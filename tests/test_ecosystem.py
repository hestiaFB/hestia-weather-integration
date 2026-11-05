"""The « Écosystème Hestia-FB » screen: each brick linked to this place, installed, missing or to come; nothing guessed."""
from engine.ecosystem import BRICKS, links, summary


def line(text, name):
    return next(l for l in text.splitlines() if f"**{name}**" in l)


def test_every_brick_has_a_line_and_nothing_is_linked_by_default():
    text = links({}, set())
    assert len(text.splitlines()) == len(BRICKS)
    assert "non installé" in line(text, "Hestia Confort") and "[L’installer](https://github.com/hestiaFB/hestia-comfort-integration)" in text
    assert "à venir" in line(text, "Hestia Chauffage")
    assert summary({}) == "aucune brique reliée"


def test_installed_is_not_linked_until_the_brick_listens_to_this_place():
    assert "installé, pas relié à ce lieu" in line(links({}, {"hestia_comfort"}), "Hestia Confort")
    linked = links({"hestia_comfort": 1}, {"hestia_comfort"})
    assert line(linked, "Hestia Confort").startswith("- ✅ **Hestia Confort** · relié à ce lieu")
    assert summary({"hestia_comfort": 2}) == "Hestia Confort"


def test_a_listener_that_does_not_say_who_it_is_is_counted_apart():
    text = links({"": 2}, set())
    assert text.splitlines()[-1] == "- 2 autres liens actifs vers ce lieu."
    assert summary({"": 2}) == "aucune brique reliée"


def test_the_hestia_panel_gets_the_same_states_one_brick_at_a_time():
    from engine.ecosystem import states
    found = {b["domain"]: b["state"] for b in states({"hestia_comfort": 1}, {"hestia_comfort"})}
    assert found["hestia_comfort"] == "linked" and found["hestia_heating"] == "future"
    assert {b["domain"]: b["state"] for b in states({}, set())}["hestia_comfort"] == "missing"
    assert {b["domain"]: b["state"] for b in states({}, {"hestia_comfort"})}["hestia_comfort"] == "installed"
