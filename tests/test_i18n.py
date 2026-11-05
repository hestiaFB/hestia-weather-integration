"""The engine in English: every French text has its English words, and French stays exactly as it was."""
from __future__ import annotations

import ast
import re
from pathlib import Path

import pytest

from engine import i18n
from engine.i18n_de import DE
from engine.i18n_en import EN

ROOT = Path(__file__).parent.parent / "custom_components" / "hestia_weather"


def french_texts(source: str) -> set[str]:
    """The literals given to t() and N_(), both sides of a conditional included."""
    found: set[str] = set()

    def literals(node: ast.AST) -> None:
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            found.add(node.value)
        elif isinstance(node, ast.IfExp):
            literals(node.body)
            literals(node.orelse)
        elif isinstance(node, ast.BoolOp):
            for value in node.values:
                literals(value)

    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in ("t", "N_") and node.args:
            literals(node.args[0])
        # A plural choice, _count(n, one, many): both French texts.
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "_count":
            for arg in node.args[1:3]:
                literals(arg)
    return found


TEXTS = set().union(*(french_texts(p.read_text(encoding="utf-8")) for p in ROOT.rglob("*.py") if not p.name.startswith("i18n")))


@pytest.fixture(autouse=True)
def _french_again():
    yield
    i18n.set_language("fr")


def test_texts_are_found():
    assert french_texts("t('Oui' if a else 'Non', x='pas ça') + N_('Bonjour') + t(x or 'Rien')") == {"Oui", "Non", "Bonjour", "Rien"}


def test_every_french_text_has_english_words():
    assert sorted(TEXTS - EN.keys()) == []


def test_no_english_text_is_left_over():
    assert sorted(EN.keys() - TEXTS) == []


def test_both_languages_keep_the_same_names():
    def names(s: str) -> list[str]:
        return sorted(re.findall(r"\{(\w+)\}", s))
    assert [k for k, v in EN.items() if names(k) != names(v)] == []


def test_language_follows_home_assistant():
    assert i18n.t("Pluie") == "Pluie"
    i18n.set_language("en")
    assert i18n.t("Pluie") == "Rain"
    i18n.set_language("nl")
    assert i18n.language() == "en"
    i18n.set_language("fr-FR")
    assert i18n.t("Pluie") == "Pluie"


def test_a_view_in_english_leaves_french_untouched():
    with i18n.localized("en"):
        assert i18n.t("Pluie") == "Rain"
    assert i18n.t("Pluie") == "Pluie"


def test_a_panel_request_speaks_its_own_language_and_never_the_cards():
    from engine import home
    with i18n.speaking("en-US"):
        assert home.status([home.Place(title="Maison", station=3)])["summary"] == "1 place followed with its station, nothing to fix."
        with i18n.localized("fr"):
            assert i18n.language() == "en"
    assert i18n.language() == "fr"
    assert home.status([home.Place(title="Maison", station=3)])["summary"] == "1 lieu suivi avec sa station, rien à régler."


def test_every_french_text_has_german_words_and_none_is_left_over():
    assert sorted(TEXTS - DE.keys()) == []
    assert sorted(DE.keys() - TEXTS) == []


def test_german_keeps_the_same_names():
    def names(s: str) -> list[str]:
        return sorted(re.findall(r"\{(\w+)\}", s))
    assert [k for k, v in DE.items() if names(k) != names(v)] == []


def test_a_view_in_german_leaves_french_untouched():
    i18n.set_language("de-DE")
    assert i18n.language() == "de"
    assert i18n.t("Pluie") == "Regen"
    assert i18n.t("{weekday} {day} {month}", weekday="Mittwoch", day=28, month="Oktober") == "Mittwoch, 28. Oktober"
    with i18n.localized("fr"):
        assert i18n.t("Pluie") == "Pluie"
    assert i18n.t("Pluie") == "Regen"


def test_two_calculations_at_once_never_mix_their_words() -> None:
    # The calculation runs in worker threads (docs/PLAN-OPTIMISATION.md, point 6): its language belongs to its thread.
    import threading
    words: dict[str, set[str]] = {"fr": set(), "en": set()}
    ready = threading.Barrier(2)

    def render(language: str) -> None:
        with i18n.localized(language):
            ready.wait()
            for _ in range(2000):
                words[language].add(i18n.t("Pluie"))
    threads = [threading.Thread(target=render, args=(code,)) for code in ("fr", "en")]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert words == {"fr": {"Pluie"}, "en": {EN["Pluie"]}}
    # The event loop's language is left as it was.
    assert i18n.t("Pluie") == "Pluie"
