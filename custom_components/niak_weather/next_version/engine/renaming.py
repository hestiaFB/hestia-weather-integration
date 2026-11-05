"""Entity ids of a home set up under the former name (legacy.ENTITY_ROOT) renamed « hestia_weather… »: the new name of each id, and the same change in a text or a dashboard.

Without Home Assistant: migration.py reads and writes Home Assistant, this module only computes.
"""
from __future__ import annotations

import re

from . import legacy
from typing import Any

OLD_ROOT = legacy.ENTITY_ROOT
NEW_ROOT = "hestia_weather"


def new_id(entity_id: str) -> str | None:
    """`sensor.hestia_weather_ressenti` → `sensor.hestia_weather_ressenti`; None for an id that does not start with the old root."""
    domain, _, object_id = entity_id.partition(".")
    if object_id != OLD_ROOT and not object_id.startswith(OLD_ROOT + "_"):
        return None
    return f"{domain}.{NEW_ROOT}{object_id[len(OLD_ROOT):]}"


def _pattern(mapping: dict[str, str]) -> re.Pattern[str] | None:
    # Whole ids only: `sensor.hestia_weather_pluie_24h` never touches `sensor.hestia_weather_pluie_24h_prevue`.
    # `states.sensor.hestia_weather_ressenti` in a template is found too: a dot before the id is allowed.
    if not mapping:
        return None
    alternatives = "|".join(re.escape(old) for old in sorted(mapping, key=len, reverse=True))
    return re.compile(rf"(?<!\w)(?:{alternatives})(?!\w)")


def rewrite(text: str, mapping: dict[str, str]) -> tuple[str, int]:
    """The text with each old id replaced by its new one, and how many were replaced."""
    pattern = _pattern(mapping)
    if pattern is None:
        return text, 0
    return pattern.subn(lambda m: mapping[m.group(0)], text)


def rewrite_data(data: Any, mapping: dict[str, str]) -> tuple[Any, int]:
    """The same change in a dashboard or options: every string, keys included, at any depth."""
    pattern = _pattern(mapping)
    if pattern is None:
        return data, 0
    count = 0

    def walk(value: Any) -> Any:
        nonlocal count
        if isinstance(value, str):
            text, n = pattern.subn(lambda m: mapping[m.group(0)], value)
            count += n
            return text
        if isinstance(value, dict):
            return {walk(k): walk(v) for k, v in value.items()}
        if isinstance(value, list):
            return [walk(v) for v in value]
        return value

    return walk(data), count


def _unquote(text: str) -> str:
    text = text.strip()
    return text[1:-1] if len(text) > 1 and text[0] == text[-1] and text[0] in "'\"" else text


def users(text: str, mapping: dict[str, str], keyed: bool = False) -> list[str]:
    """The names of the automations or scenes of a file the interface writes (a list of `- id: …`), or of its scripts
    (`keyed`: one top-level key each), that write an old id somewhere, templates included."""
    pattern = _pattern(mapping)
    if pattern is None:
        return []
    blocks: list[list[str]] = []
    for line in text.splitlines():
        starts = bool(re.match(r"[\w-]+:", line)) if keyed else line.startswith("- ")
        if starts or not blocks:
            blocks.append([])
        blocks[-1].append(line)
    names = []
    for block in blocks:
        body = "\n".join(block)
        if not pattern.search(body):
            continue
        named = re.search(r"^\s*(?:-\s*)?alias:\s*(.+)$", body, re.M) or re.search(r"^\s*(?:-\s*)?name:\s*(.+)$", body, re.M)
        first = block[0].split(":", 1)[0] if keyed else block[0][2:].partition(":")[2]
        names.append(_unquote(named.group(1) if named else first))
    return names


def lines_with(text: str, mapping: dict[str, str]) -> list[int]:
    """The line numbers (from 1) where an old id is written: for the files Hestia leaves to the user."""
    pattern = _pattern(mapping)
    if pattern is None:
        return []
    return [n for n, line in enumerate(text.splitlines(), 1) if pattern.search(line)]
