"""The engine's words follow Home Assistant's language. French is the source: each text is written in French in the code,
and `t()` gives it in the language set here, French when that language's dictionary lacks it.

Another language: add its dictionary (same keys as i18n_en.py) to DICTIONARIES. tests/test_i18n.py checks that none is missing.
Only words shown to people go through t(): states that automations read (« hausse », condition names) never change.
"""
from __future__ import annotations

import re
from contextlib import contextmanager
from contextvars import ContextVar
from collections.abc import Iterator

from .i18n_de import DE
from .i18n_en import EN

DICTIONARIES: dict[str, dict[str, str]] = {"en": EN, "de": DE}
_language = "fr"
# One panel request's language (speaking()), over the card's (localized()): two people reading the panel in two
# languages at once never mix their words, and a request never changes the card's.
_REQUEST: ContextVar[str | None] = ContextVar("hestia_weather_language", default=None)


def set_language(language: str | None) -> None:
    """Home Assistant's language: French in French, its own dictionary when there is one, English otherwise."""
    global _language
    code = (language or "").lower().replace("_", "-").split("-")[0]
    _language = "fr" if code == "fr" or not code else code if code in DICTIONARIES else "en"


@contextmanager
def localized(language: str | None) -> Iterator[None]:
    """Temporarily render one view in `language`.

    A coordinator is shared by every dashboard user, while a card's language is
    a user preference.  Rendering is synchronous, so restoring the previous
    language here keeps one subscriber from leaking its language to another.
    """
    global _language
    previous = _language
    set_language(language)
    try:
        yield
    finally:
        _language = previous


@contextmanager
def speaking(language: str | None) -> Iterator[None]:
    """The words of one panel request in `language`, put back as they were afterwards."""
    code = (language or "").lower().replace("_", "-").split("-")[0]
    token = _REQUEST.set("fr" if code == "fr" or not code else code if code in DICTIONARIES else "en")
    try:
        yield
    finally:
        _REQUEST.reset(token)


def language() -> str:
    return _REQUEST.get() or _language


def decimal_comma() -> bool:
    """French writes 8,5; English 8.5."""
    return language() != "en"


_NAME = re.compile(r"\{(\w+)\}")


def t(french: str, **values: object) -> str:
    """A French text in the language set; `{name}` takes `values[name]`."""
    lang = language()
    text = french if lang == "fr" else DICTIONARIES.get(lang, {}).get(french, french)
    return _NAME.sub(lambda m: str(values[m.group(1)]) if m.group(1) in values else m.group(0), text) if values else text


def N_(french: str) -> str:
    """Marks a French text kept in a table and translated where it is shown, with t(): the dictionary test finds it there too."""
    return french
