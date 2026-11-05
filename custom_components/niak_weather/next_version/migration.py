"""A home set up under the former name renames its entities (legacy.ENTITY_ROOT…) « hestia_weather… », from Réglages généraux, and back.

Only when the user asks: the preview changes nothing. History and statistics follow the new ids (the recorder moves them).
What uses the entities follows too: the automations, scripts and scenes the interface writes, the dashboards it keeps and the
helpers' options. YAML written by hand is only shown, with its lines: Hestia never rewrites it.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.file import write_utf8_file_atomic

from .const import DOMAIN, LOGGER
from .engine import legacy, renaming
from .engine.i18n import t

STORE_KEY = f"{DOMAIN}.migration"
# The files the interface writes, rewritten; each with its kind and reloaded after.
UI_FILES = (("automations.yaml", "automation", False), ("scripts.yaml", "script", True), ("scenes.yaml", "scene", False))
# Never read: Home Assistant's own data, code, and what is not configuration.
SKIPPED = {"custom_components", "deps", "tts", "www", "backups", "node_modules", "blueprints"}
BIGGEST = 2_000_000


def _store(hass: HomeAssistant) -> Store[dict[str, Any]]:
    return Store(hass, 1, STORE_KEY)


def plan(hass: HomeAssistant) -> tuple[dict[str, str], list[str]]:
    """Each « hestia_weather… » entity of Hestia Weather and its new id; the ones whose new id is already taken stay as they are.

    An id the user chose (one that does not start with « hestia_weather ») is never touched."""
    registry, mapping, taken = er.async_get(hass), {}, []
    for entry in hass.config_entries.async_entries(DOMAIN):
        for item in er.async_entries_for_config_entry(registry, entry.entry_id):
            new = renaming.new_id(item.entity_id)
            if new is None:
                continue
            if registry.async_get(new) or hass.states.get(new):
                taken.append(item.entity_id)
            else:
                mapping[item.entity_id] = new
    return dict(sorted(mapping.items())), sorted(taken)


def _read(path: str) -> str | None:
    try:
        if os.path.getsize(path) > BIGGEST:
            return None
        return Path(path).read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def _hand_written(config_dir: str, mapping: dict[str, str]) -> list[dict[str, Any]]:
    """The YAML files that write an old id and that Hestia leaves to the user: the file and its lines."""
    found, ui = [], {name for name, _, _ in UI_FILES} | {"secrets.yaml"}
    for root, dirs, files in os.walk(config_dir):
        dirs[:] = sorted(d for d in dirs if d not in SKIPPED and not d.startswith("."))
        for name in sorted(files):
            relative = os.path.relpath(os.path.join(root, name), config_dir)
            if not name.endswith((".yaml", ".yml")) or relative in ui:
                continue
            text = _read(os.path.join(root, name))
            if text and (lines := renaming.lines_with(text, mapping)):
                found.append({"kind": "file", "name": relative, "lines": lines})
    return found


def _dashboards(hass: HomeAssistant) -> list[tuple[str, Any]]:
    """Every dashboard, with its title: the default one first."""
    lovelace = hass.data.get("lovelace")
    dashboards = getattr(lovelace, "dashboards", None) or (lovelace.get("dashboards") if isinstance(lovelace, dict) else None) or {}
    return [((dashboard.config or {}).get("title") or t("Tableau de bord par défaut"), dashboard)
            for _, dashboard in sorted(dashboards.items(), key=lambda item: item[0] or "")]


async def _dashboard_config(dashboard: Any) -> dict[str, Any] | None:
    try:
        return await dashboard.async_load(False)
    except Exception:  # noqa: BLE001 - an empty dashboard has no configuration yet; a broken YAML one cannot be read
        return None


async def preview(hass: HomeAssistant) -> dict[str, Any]:
    """What renaming would do, without doing it; and whether a renaming can be undone."""
    mapping, taken = plan(hass)
    done = await _store(hass).async_load()
    auto: list[dict[str, Any]] = []
    manual: list[dict[str, Any]] = []
    if mapping:
        for name, kind, keyed in UI_FILES:
            text = await hass.async_add_executor_job(_read, hass.config.path(name))
            auto += [{"kind": kind, "name": user} for user in renaming.users(text or "", mapping, keyed)]
        for title, dashboard in _dashboards(hass):
            config = await _dashboard_config(dashboard)
            if config is not None and renaming.rewrite_data(config, mapping)[1]:
                (auto if dashboard.mode == "storage" else manual).append({"kind": "dashboard", "name": title})
        for entry in hass.config_entries.async_entries():
            if entry.domain != DOMAIN and renaming.rewrite_data(dict(entry.options), mapping)[1]:
                auto.append({"kind": "helper", "name": entry.title})
        manual += await hass.async_add_executor_job(_hand_written, hass.config.config_dir, mapping)
    return {"entities": [{"from": old, "to": new} for old, new in mapping.items()], "taken": taken, "auto": auto, "manual": manual,
            "undo": bool(done and done.get("mapping")), "renamed_at": (done or {}).get("at"), "old": legacy.ENTITY_ROOT}


async def _change(hass: HomeAssistant, mapping: dict[str, str]) -> dict[str, int]:
    """Renames the entities, then everything that uses them. The same for going back, with the mapping turned round."""
    registry, counts = er.async_get(hass), {"entities": 0, "files": 0, "dashboards": 0, "helpers": 0}
    for old, new in mapping.items():
        if registry.async_get(old) and not registry.async_get(new):
            registry.async_update_entity(old, new_entity_id=new)
            counts["entities"] += 1
    for name, kind, _ in UI_FILES:
        path = hass.config.path(name)
        text = await hass.async_add_executor_job(_read, path)
        changed, n = renaming.rewrite(text or "", mapping)
        if n:
            await hass.async_add_executor_job(write_utf8_file_atomic, path, changed)
            counts["files"] += 1
            if hass.services.has_service(kind, "reload"):
                await hass.services.async_call(kind, "reload", blocking=True)
    for _, dashboard in _dashboards(hass):
        config = await _dashboard_config(dashboard)
        if config is not None and dashboard.mode == "storage":
            changed, n = renaming.rewrite_data(config, mapping)
            if n:
                await dashboard.async_save(changed)
                counts["dashboards"] += 1
    for entry in hass.config_entries.async_entries():
        if entry.domain == DOMAIN:
            continue
        options, n = renaming.rewrite_data(dict(entry.options), mapping)
        if n:
            hass.config_entries.async_update_entry(entry, options=options)
            hass.config_entries.async_schedule_reload(entry.entry_id)
            counts["helpers"] += 1
    return counts


async def apply(hass: HomeAssistant) -> dict[str, int]:
    """Renames: the mapping is kept first, so that it can be undone. A step that fails puts everything back as it was."""
    mapping, _ = plan(hass)
    if not mapping:
        raise ValueError(t("Aucune entité à renommer."))
    store = _store(hass)
    await store.async_save({"mapping": mapping, "at": dt_util.utcnow().isoformat()})
    try:
        return await _change(hass, mapping)
    except Exception as err:
        LOGGER.exception("Renaming the entities failed: going back")
        await _change(hass, {new: old for old, new in mapping.items()})
        await store.async_remove()
        raise ValueError(t("Le renommage n’a pas abouti : tout a été remis comme avant ({error}).", error=err)) from err


async def undo(hass: HomeAssistant) -> dict[str, int]:
    """Back to the old ids, with what uses them."""
    store = _store(hass)
    done = await store.async_load()
    if not done or not done.get("mapping"):
        raise ValueError(t("Aucun renommage à annuler."))
    counts = await _change(hass, {new: old for old, new in done["mapping"].items()})
    await store.async_remove()
    return counts
