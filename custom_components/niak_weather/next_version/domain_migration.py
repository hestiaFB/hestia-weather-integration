"""A home installed under a brick's former technical name is carried over to its Hestia name, once, at the first start.

Copied unchanged into each brick from hestia-ecosysteme/socle/ (copier.sh), like socle.py. The brick's former names
are in its engine/legacy.py, the only module that writes them.

Nothing the user has is lost:
1. each former config entry becomes a new one, with its title, data, options, unique id and preferences. The entities
   and devices follow, with their ids, names, areas and icons. Entity ids do not change: history and long-term
   statistics stay attached to them;
2. the brick's .storage files (learning, alerts…) are copied under the new name;
3. what the interface wrote (automations, scripts, scenes, dashboards, other integrations' options, blueprints imported
   from this brick) is updated. YAML written by hand is never rewritten: a repair lists its files and lines;
4. only then are the former entries removed, and the former folder custom_components/<former domain> when it is this
   brick's own: two copies are never loaded side by side.
Entry ids change with the entries. A shared table (.storage/hestia_migration) keeps which new id each former one took,
so that every brick can mend what points to another brick's entry (Hestia Confort's link to a Hestia Weather place).
A run cut short starts again where it stopped at the next start: the table says which entries already exist.

Home Assistant only starts an integration that has entries: under the former name, none has yet. Three things start it:
the last version under the former name (a bridge, which starts the new one when its folder is there), « Add an
integration » (the config flow resumes the home instead of setting up a new one: async_resume), and the other brick,
which starts this one once it has carried itself over (legacy.SIBLINGS).
"""
from __future__ import annotations

import asyncio
import inspect
import json
import logging
import os
import re
import shutil
from pathlib import Path
from types import MappingProxyType
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry, ConfigEntryDisabler, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er, issue_registry as ir
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.storage import Store
from homeassistant.loader import IntegrationNotFound, async_get_integration
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from homeassistant.util.file import write_utf8_file_atomic

from .const import DOMAIN
from .engine import legacy

LOGGER = logging.getLogger(__name__)
TABLE = "hestia_migration"
LOCK = "hestia_migration_lock"
# Fired when a brick has carried its entries over: {"domain": new domain, "entries": {former id: new id}}.
DONE_EVENT = "hestia_migration_done"
UI_FILES = (("automations.yaml", "automation"), ("scripts.yaml", "script"), ("scenes.yaml", "scene"))
# Never read for hand-written YAML: Home Assistant's own data, code, and what is not configuration.
SKIPPED = {"custom_components", "deps", "tts", "www", "backups", "node_modules", "blueprints"}
BIGGEST = 2_000_000


def pending(hass: HomeAssistant) -> bool:
    """Something of the former name is still there: its entries, or its folder next to this one."""
    return bool(hass.config_entries.async_entries(legacy.DOMAIN)) or os.path.isdir(_old_folder(hass))


async def async_setup_migration(hass: HomeAssistant) -> None:
    """From the brick's async_setup, before it reads any of its files: the new entry ids are chosen and the .storage
    files copied under the new name. Once Home Assistant has started (every integration set up, the former one
    included if still installed), the entries, entities and devices move."""
    if not pending(hass):
        # Started again after the carrying over: nothing of the former name is loaded any more.
        ir.async_delete_issue(hass, DOMAIN, "migration_restart")
        return
    try:
        await async_prepare(hass)
    except Exception:  # noqa: BLE001 - never keeps the brick from starting; tried again once started
        LOGGER.exception("Preparing to carry the former name over failed")

    async def run(_hass: HomeAssistant) -> None:
        try:
            await async_carry_over(hass)
        except Exception:  # noqa: BLE001 - never keeps the brick from working; tried again at the next start
            LOGGER.exception("Carrying the former name over did not finish: it starts again at the next start")
            ir.async_create_issue(hass, DOMAIN, "migration_failed", is_fixable=False, severity=ir.IssueSeverity.ERROR,
                                  translation_key="migration_failed")

    async_at_started(hass, run)


async def async_resume(hass: HomeAssistant) -> bool:
    """From « Add an integration »: a home installed under the former name is resumed, never set up a second time.
    Starting the integration carries it over (async_setup_migration); True when there was something to resume."""
    if not hass.config_entries.async_entries(legacy.DOMAIN):
        return False
    await async_setup_component(hass, DOMAIN, {})
    return True


async def async_status(hass: HomeAssistant) -> dict[str, Any] | None:
    """What the hub's « Passage au nom Hestia » shows for this brick (socle 1.16); None when it never had a former name.
    The brick adds its own lines (summary, names) before handing it to the socle."""
    done = (await _table(hass))[1]["done"].get(DOMAIN)
    waiting = bool(hass.config_entries.async_entries(legacy.DOMAIN))
    if done is None and not waiting:
        return None
    done = done or {}
    issues = ir.async_get(hass).issues
    loaded = legacy.DOMAIN in hass.config.components or os.path.isdir(_old_folder(hass))
    return {"domain": DOMAIN, "state": "failed" if (DOMAIN, "migration_failed") in issues else "running" if waiting else "done",
            "at": done.get("at"), "entries": len(done.get("entries", {})), "entities": done.get("entities", 0),
            "devices": done.get("devices", 0), "stores": len(done.get("stores", [])),
            "updated": {k: done.get(k, 0) for k in ("files", "dashboards", "helpers", "blueprints")},
            "dashboards": done.get("dashboard_ids", []), "manual": done.get("manual", []), "restart": bool(done.get("restart")) and loaded}


async def _start_siblings(hass: HomeAssistant) -> None:
    """The other Hestia bricks still under their former name are started, when their new version is installed:
    each then carries itself over. One « Add an integration » or one bridge is enough for the whole home."""
    for domain, former in getattr(legacy, "SIBLINGS", {}).items():
        if domain in hass.config.components or not hass.config_entries.async_entries(former):
            continue
        try:
            await async_get_integration(hass, domain)
        except IntegrationNotFound:
            continue
        hass.async_create_task(async_setup_component(hass, domain, {}), f"{domain} carried over")


# ——— what only computes ———

def ids_pattern(ids: dict[str, str]) -> re.Pattern[str] | None:
    if not ids:
        return None
    return re.compile(r"(?<![0-9A-Za-z])(?:" + "|".join(re.escape(i) for i in sorted(ids, key=len, reverse=True)) + r")(?![0-9A-Za-z])")


def rewrite_text(text: str, ids: dict[str, str]) -> tuple[str, int]:
    """The text with the former names (legacy.TEXT) and the former entry ids changed, and how many were changed."""
    count = 0
    for old, new in legacy.TEXT:
        text, n = re.subn(old, new, text)
        count += n
    if pattern := ids_pattern(ids):
        text, n = pattern.subn(lambda m: ids[m.group(0)], text)
        count += n
    return text, count


def rewrite_data(data: Any, ids: dict[str, str], names: bool = True) -> tuple[Any, int]:
    """The same in a dashboard, options or a .storage file: every string, keys included, at any depth.
    `names=False` is for the brick's own data: the entry ids change, and the values it wrote under the former name
    (legacy.VALUES, whole strings only), never a text the user wrote."""
    count = 0
    pattern = ids_pattern(ids)
    values: dict[str, str] = getattr(legacy, "VALUES", {})

    def walk(value: Any) -> Any:
        nonlocal count
        if isinstance(value, str):
            if names:
                value, n = rewrite_text(value, ids)
            elif value in values:
                value, n = values[value], 1
            elif pattern:
                value, n = pattern.subn(lambda m: ids[m.group(0)], value)
            else:
                n = 0
            count += n
            return value
        if isinstance(value, dict):
            return {walk(k): walk(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [walk(v) for v in value]
        return value

    return walk(data), count


def rekey(value: str, ids: dict[str, str]) -> str:
    """A unique id or a device identifier with the former entry ids changed; the brick may order its parts again."""
    pattern = ids_pattern(ids)
    value = pattern.sub(lambda m: ids[m.group(0)], value) if pattern else value
    hook: Callable[[str], str] | None = getattr(legacy, "rekey", None)
    return hook(value) if hook else value


def lines_with(text: str) -> list[int]:
    """The line numbers (from 1) where a former name is written: for the files Hestia leaves to the user."""
    patterns = [re.compile(old) for old, _ in legacy.TEXT]
    return [n for n, line in enumerate(text.splitlines(), 1) if any(p.search(line) for p in patterns)]


# ——— files ———

def _read(path: str) -> str | None:
    try:
        if os.path.getsize(path) > BIGGEST:
            return None
        return Path(path).read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def _old_folder(hass: HomeAssistant) -> str:
    return hass.config.path("custom_components", legacy.DOMAIN)


def _own_old_folder(path: str) -> bool:
    """The former folder is removed only when its manifest says it is this brick under its former name."""
    try:
        manifest = json.loads(Path(path, "manifest.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    return manifest.get("domain") == legacy.DOMAIN and any(o in legacy.CODEOWNERS for o in manifest.get("codeowners", []))


def _remove_old_folder(path: str) -> bool:
    if not os.path.isdir(path) or not _own_old_folder(path):
        return False
    shutil.rmtree(path)
    return True


def _storage_files(config_dir: str, prefixes: tuple[str, ...]) -> list[str]:
    folder = os.path.join(config_dir, ".storage")
    try:
        names = sorted(os.listdir(folder))
    except OSError:
        return []
    return [n for n in names if n.startswith(prefixes) and os.path.isfile(os.path.join(folder, n))]


def _load_raw(config_dir: str, key: str) -> dict[str, Any] | None:
    text = _read(os.path.join(config_dir, ".storage", key))
    try:
        raw = json.loads(text) if text else None
    except ValueError:
        return None
    return raw if isinstance(raw, dict) and "data" in raw else None


def _hand_written(config_dir: str) -> list[dict[str, Any]]:
    """The YAML files that write a former name and that Hestia leaves to the user: the file and its lines."""
    found, ui = [], {name for name, _ in UI_FILES} | {"secrets.yaml"}
    for root, dirs, files in os.walk(config_dir):
        dirs[:] = sorted(d for d in dirs if d not in SKIPPED and not d.startswith("."))
        for name in sorted(files):
            relative = os.path.relpath(os.path.join(root, name), config_dir)
            if not name.endswith((".yaml", ".yml")) or relative in ui:
                continue
            text = _read(os.path.join(root, name))
            if text and (lines := lines_with(text)):
                found.append({"name": relative, "lines": lines})
    return found


def _blueprints(config_dir: str) -> tuple[list[str], list[dict[str, Any]]]:
    """The blueprints imported from this brick (their source says so): rewritten. Others that write a former name: listed."""
    ours, others = [], []
    folder = f"/blueprints/automation/{legacy.DOMAIN}/"
    for root, _, files in os.walk(os.path.join(config_dir, "blueprints")):
        for name in sorted(files):
            path = os.path.join(root, name)
            text = _read(path) if name.endswith((".yaml", ".yml")) else None
            if not text or not (lines := lines_with(text)):
                continue
            if re.search(r"^\s*source_url:.*" + re.escape(folder), text, re.M):
                ours.append(path)
            else:
                others.append({"name": os.path.relpath(path, config_dir), "lines": lines})
    return ours, others


# ——— Home Assistant ———

def _dashboards(hass: HomeAssistant) -> list[Any]:
    lovelace = hass.data.get("lovelace")
    dashboards = getattr(lovelace, "dashboards", None) or (lovelace.get("dashboards") if isinstance(lovelace, dict) else None) or {}
    return [dashboard for _, dashboard in sorted(dashboards.items(), key=lambda item: item[0] or "")]


async def _table(hass: HomeAssistant) -> tuple[Store[dict[str, Any]], dict[str, Any]]:
    store: Store[dict[str, Any]] = Store(hass, 1, TABLE)
    data = await store.async_load() or {}
    data.setdefault("entries", {})
    data.setdefault("done", {})
    return store, data


async def async_entry_ids(hass: HomeAssistant) -> dict[str, str]:
    """Every former entry id of every Hestia brick, with the new one: to mend what points to another brick's entry."""
    return dict((await _table(hass))[1]["entries"])


def _new_entry(old: ConfigEntry, ids: dict[str, str], entry_id: str | None = None) -> ConfigEntry:
    """The new entry, added paused: it starts once its entities and devices are its own (see async_carry_over)."""
    data, _ = rewrite_data(dict(old.data), ids, names=False)
    options, _ = rewrite_data(dict(old.options), ids, names=False)
    return ConfigEntry(domain=DOMAIN, entry_id=entry_id, title=old.title, data=data, options=options,
                       unique_id=getattr(legacy, "VALUES", {}).get(old.unique_id, old.unique_id),
                       version=old.version, minor_version=old.minor_version, source=old.source,
                       disabled_by=old.disabled_by or ConfigEntryDisabler.USER,
                       pref_disable_new_entities=old.pref_disable_new_entities, pref_disable_polling=old.pref_disable_polling,
                       discovery_keys=MappingProxyType({}), subentries_data=None)


async def _copy_stores(hass: HomeAssistant, ids: dict[str, str]) -> list[str]:
    """Each .storage file of the former domain under the new name, its entry ids changed. A copy already made is kept."""
    config_dir, copied = hass.config.config_dir, []
    keys = await hass.async_add_executor_job(_storage_files, config_dir, legacy.STORES)
    for key in keys:
        new_key = rekey(DOMAIN + key[len(legacy.DOMAIN):], ids)
        raw = await hass.async_add_executor_job(_load_raw, config_dir, key)
        if raw is None:
            continue
        if not os.path.exists(os.path.join(config_dir, ".storage", new_key)):
            data, _ = rewrite_data(raw["data"], ids, names=False)
            await Store(hass, raw.get("version", 1), new_key, minor_version=raw.get("minor_version", 1)).async_save(data)
        copied.append(key)
    # The shared panel's settings (sidebar shown or not): copied once, by whichever brick comes first.
    if not os.path.exists(os.path.join(config_dir, ".storage", "hestia_socle")):
        raw = await hass.async_add_executor_job(_load_raw, config_dir, legacy.SOCLE_KEY)
        if raw is not None and isinstance(raw["data"], dict):
            sidebar = raw["data"].get("sidebar", True) is not False
            theme = "ha" if raw["data"].get("theme") == "ha" else "hestia"
            await Store(hass, 1, "hestia_socle").async_save({"sidebar": sidebar, "theme": theme})
    return copied


def _move_registries(hass: HomeAssistant, old: ConfigEntry, entry: ConfigEntry, ids: dict[str, str]) -> tuple[int, int]:
    """The former entry's entities and devices become the new entry's, with their ids, names, areas and icons.
    The new entry is still paused: when it starts, it finds them as its own instead of creating new ones."""
    entities, devices = er.async_get(hass), dr.async_get(hass)
    moved = [0, 0]
    for item in er.async_entries_for_config_entry(entities, old.entry_id):
        if item.platform != legacy.DOMAIN:
            continue
        unique_id = rekey(item.unique_id, ids)
        if entities.async_get_entity_id(item.domain, DOMAIN, unique_id):
            continue  # already carried over by a run cut short
        entities.async_update_entity_platform(item.entity_id, DOMAIN, new_config_entry_id=entry.entry_id, new_unique_id=unique_id)
        moved[0] += 1
    # Since Home Assistant 2026.10 a device belongs to one entry and moves with `new_config_entry_id`; before, it was
    # added to the new entry and removed from the former one.
    single = "new_config_entry_id" in inspect.signature(devices.async_update_device).parameters
    for device in dr.async_entries_for_config_entry(devices, old.entry_id):
        identifiers = {(DOMAIN, rekey(value, ids)) if domain == legacy.DOMAIN else (domain, value) for domain, value in device.identifiers}
        if single:
            devices.async_update_device(device.id, new_config_entry_id=entry.entry_id, new_identifiers=identifiers)
        else:
            devices.async_update_device(device.id, add_config_entry_id=entry.entry_id, remove_config_entry_id=old.entry_id,
                                        new_identifiers=identifiers)
        moved[1] += 1
    return moved[0], moved[1]


async def _rewrite_users(hass: HomeAssistant, ids: dict[str, str]) -> dict[str, Any]:
    """What the interface wrote, with the former names and entry ids changed; what was written by hand, listed."""
    counts: dict[str, Any] = {"files": 0, "dashboards": 0, "helpers": 0, "blueprints": 0, "resources": 0, "dashboard_ids": []}
    for name, kind in UI_FILES:
        path = hass.config.path(name)
        text = await hass.async_add_executor_job(_read, path)
        changed, n = rewrite_text(text or "", ids)
        if n:
            await hass.async_add_executor_job(write_utf8_file_atomic, path, changed)
            counts["files"] += 1
            if hass.services.has_service(kind, "reload"):
                await hass.services.async_call(kind, "reload", blocking=True)
    manual: list[dict[str, Any]] = []
    for dashboard in _dashboards(hass):
        try:
            config = await dashboard.async_load(False)
        except Exception:  # noqa: BLE001 - an empty dashboard has no configuration yet; a broken YAML one cannot be read
            continue
        changed, n = rewrite_data(config, ids)
        if not n:
            continue
        if getattr(dashboard, "mode", None) == "storage":
            await dashboard.async_save(changed)
            counts["dashboards"] += 1
            counts["dashboard_ids"].append(getattr(dashboard, "url_path", None) or "default")
        else:
            manual.append({"name": (dashboard.config or {}).get("title") or "ui-lovelace.yaml", "lines": []})
    for entry in hass.config_entries.async_entries():
        if entry.domain in (DOMAIN, legacy.DOMAIN):
            continue
        options, n = rewrite_data(dict(entry.options), ids)
        if n:
            hass.config_entries.async_update_entry(entry, options=options)
            hass.config_entries.async_schedule_reload(entry.entry_id)
            counts["helpers"] += 1
    ours, others = await hass.async_add_executor_job(_blueprints, hass.config.config_dir)
    for path in ours:
        text = await hass.async_add_executor_job(_read, path)
        changed, n = rewrite_text(text or "", ids)
        if n:
            await hass.async_add_executor_job(write_utf8_file_atomic, path, changed)
            counts["blueprints"] += 1
    if ours and hass.services.has_service("automation", "reload"):
        await hass.services.async_call("automation", "reload", blocking=True)
    resources = getattr(hass.data.get("lovelace"), "resources", None)
    if resources is not None and hasattr(resources, "async_delete_item"):
        if not getattr(resources, "loaded", True):
            await resources.async_get_info()
        for item in list(resources.async_items() or []):
            if str(item.get("url", "")).startswith(legacy.ASSETS + "/"):
                await resources.async_delete_item(item["id"])
                counts["resources"] += 1
    counts["manual"] = manual + others + await hass.async_add_executor_job(_hand_written, hass.config.config_dir)
    return counts


async def _ids(hass: HomeAssistant, store: Store[dict[str, Any]], table: dict[str, Any]) -> list[tuple[ConfigEntry, ConfigEntry, bool]]:
    """Each former entry with its new one: the new ids are chosen once and kept in the shared table before anything
    moves, so that a run cut short finds them again. `True` when the new entry is still to be added."""
    news: list[tuple[ConfigEntry, ConfigEntry, bool]] = []
    for old in hass.config_entries.async_entries(legacy.DOMAIN):
        existing = hass.config_entries.async_get_entry(table["entries"].get(old.entry_id, ""))
        if existing is not None and existing.domain == DOMAIN:
            news.append((old, existing, False))
            continue
        entry = _new_entry(old, {}, table["entries"].get(old.entry_id))
        table["entries"][old.entry_id] = entry.entry_id
        news.append((old, entry, True))
    await store.async_save(table)
    ids = dict(table["entries"])
    return [(old, _new_entry(old, ids, entry.entry_id) if fresh else entry, fresh) for old, entry, fresh in news]


async def async_prepare(hass: HomeAssistant) -> None:
    """The new entry ids, and the .storage files under the new name: before the brick reads them."""
    async with hass.data.setdefault(LOCK, asyncio.Lock()):
        store, table = await _table(hass)
        await _ids(hass, store, table)
        await _copy_stores(hass, dict(table["entries"]))


async def async_carry_over(hass: HomeAssistant) -> dict[str, Any]:
    """The whole carrying over; safe to run again (what is done is not done twice)."""
    async with hass.data.setdefault(LOCK, asyncio.Lock()):
        store, table = await _table(hass)
        olds = hass.config_entries.async_entries(legacy.DOMAIN)
        restart = False
        # The former code may still be installed next to this one: its entries are stopped before anything moves.
        for old in olds:
            if old.state is ConfigEntryState.LOADED:
                await hass.config_entries.async_unload(old.entry_id)
                restart = True
        news = await _ids(hass, store, table)
        ids = dict(table["entries"])
        copied = await _copy_stores(hass, ids)
        moved = [0, 0]
        for old, entry, fresh in news:
            if fresh:
                await hass.config_entries.async_add(entry)
            entities, devices = _move_registries(hass, old, entry, ids)
            moved = [moved[0] + entities, moved[1] + devices]
        for old, entry, _ in news:
            await hass.config_entries.async_remove(old.entry_id)
            # Paused for the move only: started now, as the former one was (a disabled entry stays disabled).
            if entry.disabled_by is ConfigEntryDisabler.USER and old.disabled_by is None:
                await hass.config_entries.async_set_disabled_by(entry.entry_id, None)
        mine = {old.entry_id: entry.entry_id for old, entry, _ in news}
        result = await _rewrite_users(hass, mine)
        for key in copied:
            await Store(hass, 1, key).async_remove()
        if await hass.async_add_executor_job(_remove_old_folder, _old_folder(hass)):
            restart = True

        manual = result.pop("manual")
        if manual:
            items = "\n".join(f"- {m['name']}" + (f" ({', '.join(map(str, m['lines']))})" if m["lines"] else "") for m in manual)
            ir.async_create_issue(hass, DOMAIN, "migration_manual", is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                  translation_key="migration_manual", translation_placeholders={"items": items})
        if restart:
            ir.async_create_issue(hass, DOMAIN, "migration_restart", is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                  translation_key="migration_restart")
        ir.async_delete_issue(hass, DOMAIN, "migration_failed")
        done = {"at": dt_util.utcnow().isoformat(), "entries": mine, "stores": copied, "manual": manual, "restart": restart,
                "entities": moved[0], "devices": moved[1], **result}
        if news or copied or restart:
            table["done"][DOMAIN] = done
            await store.async_save(table)
            hass.bus.async_fire(DONE_EVENT, {"domain": DOMAIN, "entries": mine})
            LOGGER.info("Carried over to %s: %s", DOMAIN, done)
    await _start_siblings(hass)
    return done
