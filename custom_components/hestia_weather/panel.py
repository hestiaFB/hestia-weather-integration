"""The « Météo » tab of the shared « Hestia-FB » panel (socle, see socle.py) and what the panel's home page says about Hestia Weather.

The assistant of Paramètres (Configurer) stays as it is while the panel takes over: Hestia Weather keeps no former panel
address, so the « Configurer » button still opens it.
"""
from __future__ import annotations

import functools
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .api import API_VERSION
from .config_flow import NONE, _context
from .const import DOMAIN, LOGGER
from .draft import Draft, ecosystem_of, entity_keys, entity_label, family_label, field_label, linked, needs_text
from .engine import atmo, detection, families, health, home, polleninfo, station_place
from .engine.settings import Settings
from .engine.i18n import speaking, t
from .extensions import inventory, official, others, set_official
from . import domain_migration, migration
from .engine import legacy
from .websocket import VERSION_KEY
from .socle import async_register_brick, async_register_card, is_card_resource

ASSETS = f"/{DOMAIN}-assets"
CARD_REPOSITORY = legacy.CARD_REPOSITORY
"""The former card's repository: since 2.3 the card comes with the integration."""
CARD_FILE = "hestia-weather-card.js"
CARD_URL = f"{ASSETS}/{CARD_FILE}"
FAILED = (ConfigEntryState.SETUP_ERROR, ConfigEntryState.SETUP_RETRY, ConfigEntryState.MIGRATION_ERROR, ConfigEntryState.FAILED_UNLOAD)


async def async_setup_panel(hass: HomeAssistant, version: str) -> None:
    if not getattr(hass, "http", None) or not hasattr(hass.http, "async_register_static_paths"):
        return  # Headless setups and isolated tests have no frontend.
    if not hass.data.get(f"{DOMAIN}_panel"):
        await hass.http.async_register_static_paths([StaticPathConfig(ASSETS, str(Path(__file__).parent / "frontend"), True)])
        for command in (ws_places, ws_open, ws_change, ws_save, ws_link, ws_remove, ws_rename_preview, ws_rename, ws_rename_undo):
            websocket_api.async_register_command(hass, command)
        # Dashboard resource, with a guarded extra-module fallback for YAML resources.
        await async_register_card(hass, CARD_URL, version)
        hass.data[f"{DOMAIN}_panel"] = True
    await async_register_brick(hass, {
        "domain": DOMAIN, "name": "Hestia Weather", "slug": "meteo", "tab": "Météo", "version": version, "icon": "mdi:weather-partly-cloudy",
        "navigation": 3,
        # The same menu as every brick (socle 1.20, ETAT-DES-LIEUX-HUB.md § 2): overview, its places, settings, extensions.
        "menu": [["", "Vue d’ensemble", "home"], ["lieux", "Lieux", "weather"], ["extensions", "Extensions", "extensions"],
                 ["a-propos", "À propos", "info"]],
        "module_url": f"{ASSETS}/panel.js?v={version}", "element": "hestia-weather-setup", "status": weather_status, "legacy_path": "",
        "migration": migration_status,
    }, f"{ASSETS}/hestia-socle.js?v={version}")


def _entries(hass: HomeAssistant) -> list[Any]:
    return sorted(hass.config_entries.async_entries(DOMAIN), key=lambda e: e.title)


def _entry(hass: HomeAssistant, entry_id: str | None) -> Any:
    entry = hass.config_entries.async_get_entry(entry_id) if entry_id else None
    if entry_id and (entry is None or entry.domain != DOMAIN):
        raise LookupError(t("Lieu Hestia Weather introuvable."))
    return entry


MODELS = {"gw2000a": "GW2000A", "ws90": "WS90", "netatmo": "Netatmo", "manual": "Station"}
GONE = ("unavailable", "unknown")


def _name(state: Any, entity_id: str) -> str:
    return str(state.attributes.get("friendly_name") or entity_id) if state is not None else entity_id


def _minutes(now: datetime, moment: datetime | None) -> float | None:
    return (now - moment).total_seconds() / 60 if moment else None


Context = tuple[list[Any], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]


def facts(hass: HomeAssistant, entry: Any, card_twice: bool = False, context: Context | None = None) -> health.Facts:
    """What the tab's home page shows about one place, read from Home Assistant and this place's own settings.

    `context`: the states and registries already read for every place of the same page, read here otherwise."""
    sources, now, get = dict(entry.options), dt_util.utcnow(), hass.states.get
    states, registry, devices = context or _context(hass)
    failed, loaded = entry.state in FAILED, entry.state is ConfigEntryState.LOADED
    coordinator = getattr(entry, "runtime_data", None) if loaded else None
    weather = get(sources.get("weather_entity") or "")
    vigilance = get(sources.get("vigilance_entity") or "")
    water, strikes = get(sources.get("water_restriction_entity") or ""), get(sources.get("lightning_entity") or "")
    found = detection.vigilance_candidates(states, registry)
    model = Draft(hass, sources, entry).station_model()
    sensors, chosen = [], set()
    for field in detection.STATION_FIELDS:
        entity_id = sources.get(field)
        if not entity_id:
            continue
        chosen.add(field)
        state = get(entity_id)
        if state is None:
            sensors.append(health.Sensor(field_label(field), entity_id, "missing"))
        elif state.state in GONE:
            sensors.append(health.Sensor(field_label(field), _name(state, entity_id), "silent", _minutes(now, state.last_changed)))
        else:
            seen = getattr(state, "last_reported", None) or state.last_updated
            sensors.append(health.Sensor(field_label(field), _name(state, entity_id), "ok", _minutes(now, seen)))
    unused = []
    if model != NONE:
        shown = {f for _, _, group in detection.station_groups(model) for f in group}
        for field in health.GAINS:
            if field in shown and field not in chosen:
                ids = detection.candidates(states, field, registry, sources, devices)
                if len(ids) == 1:
                    unused.append((field, field_label(field), _name(get(ids[0]), ids[0])))
    areas = detection.atmo_areas(states, registry, devices)
    area = next((a["label"] for a in areas if a["value"] == sources.get("atmo_area")), sources.get("atmo_area") or "")
    pollen_zone = sources.get("atmo_pollen_area", sources.get("atmo_area")) or ""
    pollen_area = next((a["label"] for a in areas if a["value"] == pollen_zone), pollen_zone)
    waqi_air = sources.get("air_source") == "waqi"
    air_entity = sources.get("waqi_air_entity" if waqi_air else "atmo_air_entity")
    try:
        settings = Settings.from_options({k: v for k, v in sources.items() if v is not None})
    except ValueError:
        settings = None
    pollen, pollen_ids = "", []
    if settings is not None and settings.pollen_source == "legacy" and settings.pollens:
        count = len(settings.pollens)
        pollen = f"{polleninfo.provider_name(settings)} · " + (t("{n} espèces", n=count) if count > 1 else t("{n} espèce", n=count))
        pollen_ids = [p.entity_id for p in settings.pollens] + ([settings.pollen_risk_entity] if settings.pollen_risk_entity else [])
    elif settings is not None and settings.atmo_pollens and settings.atmo.get("atmo_pollen_entity"):
        pollen, pollen_ids = f"Atmo France · {pollen_area}", [settings.atmo["atmo_pollen_entity"]]
    needs = families.needs(settings) if settings is not None else {}
    keys = entity_keys(hass, entry)
    ids = {e.unique_id.removeprefix(f"{entry.entry_id}_"): e.entity_id
           for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id)}
    entities = []
    for family, members in families.FAMILIES:
        for key in members:
            if key in keys:
                state = get(ids.get(key, ""))
                entities.append((key, entity_label(key)[0], family_label(family)[0], keys[key], state is not None and state.state not in GONE))
    ready = [family_label(family)[0] for family, members in families.FAMILIES
             if any(k in keys for k in members) and not any(keys.get(k) for k in members) and not any(k in needs for k in members if k in keys)]
    bricks = linked(hass, entry.entry_id)
    names = [b["name"] for b in ecosystem_of(hass, entry.entry_id) if b["state"] == "linked"] + ([t("une autre brique Hestia-FB")] if bricks.get("") else [])
    return health.Facts(
        title=entry.title, failed=failed, restarting=not loaded and not failed,
        weather=_name(weather, sources.get("weather_entity") or "") if weather else (sources.get("weather_entity") or ""),
        weather_ok=weather is not None and weather.state not in GONE,
        forecast_age=_minutes(now, getattr(coordinator, "forecast_at", None)),
        forecast_hours=len(getattr(coordinator, "hours", ())) if getattr(coordinator, "forecast_at", None) is not None else None,
        forecast_days=len(getattr(coordinator, "days", ())) if getattr(coordinator, "forecast_at", None) is not None else None,
        computation_age=_minutes(now, getattr(getattr(coordinator, "data", None), "computed", None)),
        history_sources=(len({key for history in (getattr(coordinator, "history", {}), getattr(coordinator, "rain_history", {})) for key, rows in history.items() if rows})
                         if coordinator is not None else None), interface_version=API_VERSION,
        vigilance=_name(vigilance, sources.get("vigilance_entity") or "") if sources.get("vigilance_entity") else "",
        vigilance_ok=vigilance is not None and vigilance.state not in GONE,
        vigilance_found=_name(get(found[0]), found[0]) if found and not sources.get("vigilance_entity") else "",
        season=_name(get(sources["season_entity"]), sources["season_entity"]) if sources.get("season_entity") else "",
        water=_name(water, sources["water_restriction_entity"]) if sources.get("water_restriction_entity") else "",
        water_ok=water is not None and water.state not in GONE,
        lightning=_name(strikes, sources["lightning_entity"]) if sources.get("lightning_entity") else "",
        # « unknown » is Blitzortung's quiet state, between storms.
        lightning_ok=strikes is not None and strikes.state != "unavailable",
        station=MODELS.get(model, "") if model != NONE else "", sensors=sensors, history=bool(sources.get("station_history", True)),
        unused=unused, air=(f"WAQI · {sources.get('waqi_place') or sources.get('waqi_station')}" if waqi_air and sources.get("waqi_station")
                            else f"Atmo France · {area}" if area and sources.get("air_source") not in ("none", "waqi") else ""),
        air_ok=bool(air_entity) and get(air_entity) is not None and get(air_entity).state not in GONE,
        atmo_installed=bool(areas), pollen=pollen,
        pollen_ok=any(get(i) is not None and get(i).state not in GONE for i in pollen_ids),
        pollen_available=bool(areas) or any(polleninfo.candidates(states, registry, p)[0] for p in polleninfo.PROVIDERS),
        entities=entities, needs=needs, ready_families=ready, integration=str(hass.data.get(VERSION_KEY, "")),
        card_twice=card_twice, links=names,
        place_left=station_place.questions_left(settings, sources) if settings is not None and model != NONE else 0,
        gauge_share=((getattr(coordinator, "place_learned", None) or {}).get("rain") or {}).get("share") if not sources.get("rain_gauge_shelter") else None)


def place(hass: HomeAssistant, entry: Any, card_twice: bool = False, context: Context | None = None) -> tuple[dict[str, Any], home.Place]:
    """One place, for the tab's home page and for the panel's home page: both say the same."""
    f = facts(hass, entry, card_twice, context)
    enabled = {key for key, _, _, on, _ in f.entities if on}
    info = {"entry_id": entry.entry_id, "title": entry.title, "loaded": entry.state is ConfigEntryState.LOADED,
            "failed": f.failed, "health": health.report(f), "extensions": inventory(hass, entry.options),
            "official": official(hass, entry.entry_id),
            # How far each of the station's measures can be trusted (État › Fiabilité de la station).
            "trust": entry.runtime_data.trust_view() if entry.state is ConfigEntryState.LOADED and hasattr(getattr(entry, "runtime_data", None), "trust_view") else {}}
    status = home.Place(title=entry.title, loaded=not f.failed, station=len(f.sensors),
                        silent=[s.label for s in f.sensors if s.status != "ok"],
                        forecast=f.restarting or f.failed or f.forecast_age is not None,
                        needs=[needs_text(k, text) for k, text in f.needs.items() if k in enabled and k not in families.STATION_DEPENDENT],
                        down=health.silent_sources(f), links=f.links)
    return info, status


async def card_twice(hass: HomeAssistant) -> bool:
    """Whether the former card is still installed next to the one the integration serves: both would load.

    A dashboard resource naming the card (HACS declares one, so does a card copied by hand), or HACS saying it is installed.
    The integration's own resource (CARD_URL) does not count.
    """
    try:
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None) or (lovelace.get("resources") if isinstance(lovelace, dict) else None)
        if resources is not None:
            if not getattr(resources, "loaded", True):
                await resources.async_get_info()  # Resources kept by the UI load on first use.
            urls = [str(item.get("url", "")) for item in resources.async_items() or []]
            if any((CARD_FILE in unquote(u) or legacy.CARD_FILE in unquote(u)) and not is_card_resource(u, CARD_URL) for u in urls):
                return True
        hacs = hass.data.get("hacs")
        repository = hacs.repositories.get_by_full_name(CARD_REPOSITORY) if hacs is not None else None
        return bool(repository is not None and repository.data.installed)
    except Exception:  # noqa: BLE001 - Lovelace's and HACS's insides may change: nothing is then said
        LOGGER.debug("Former card not looked for", exc_info=True)
        return False


async def migration_status(hass: HomeAssistant) -> dict[str, Any] | None:
    """Hestia Weather's lines in the hub's « Passage au nom Hestia » (socle 1.16): its places and its entities' names."""
    status = await domain_migration.async_status(hass)
    if status is None:
        return None
    mapping, _ = migration.plan(hass)
    renamed = await migration._store(hass).async_load()  # noqa: SLF001 - the renaming tool's own record
    status["summary"] = {"places": status["entries"]}
    status["names"] = {"left": len(mapping), "old": legacy.ENTITY_ROOT, "renamed_at": (renamed or {}).get("at")}
    return status


async def weather_status(hass: HomeAssistant, language: str | None = None) -> dict[str, Any]:
    """What the « Hestia-FB » home page says about Hestia Weather, from its own settings only, in the hub's language (socle 1.14)."""
    twice = await card_twice(hass)
    with speaking(language), detection.batch():
        # Home Assistant's registries are read once for every place, not once per place.
        context = _context(hass)
        return home.status([place(hass, e, twice, context)[1] for e in _entries(hass)], twice)


# The panel's language, sent with each of its commands: its words and errors come back in it (engine/i18n.py).
LANGUAGE = vol.Optional("language")


def spoken(handler: Any) -> Any:
    """A panel command answered in the panel's language."""
    @functools.wraps(handler)
    async def answer(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        with speaking(msg.get("language")):
            await handler(hass, connection, msg)
    return answer


def _has_weather(hass: HomeAssistant) -> bool:
    return any(not s.entity_id.startswith((f"weather.{DOMAIN}", "weather.hestia_weather")) for s in hass.states.async_all("weather"))


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/places", LANGUAGE: str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_places(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    twice = await card_twice(hass)
    context = _context(hass)  # read once for every place
    with detection.batch():  # what each sensor gives, known from the command before (PLAN-OPTIMISATION-HUB.md, point 1)
        places = [place(hass, e, twice, context)[0] for e in _entries(hass)]
    connection.send_result(msg["id"], {"places": places, "can_add": _has_weather(hass), "others": others(hass)})


def _send_draft(connection: websocket_api.ActiveConnection, msg: dict[str, Any], draft: Draft, error: str = "", **extra: Any) -> None:
    connection.send_result(msg["id"], {"draft": draft.sources, "view": draft.view(), "error": error, **extra})


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/open", LANGUAGE: str, vol.Optional("entry_id"): str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_open(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """A place's draft: its settings with what the assistant would propose. Without `entry_id`, a new place."""
    try:
        entry = _entry(hass, msg.get("entry_id"))
    except LookupError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    if entry is None and not _has_weather(hass):
        connection.send_error(msg["id"], "no_weather", t("Aucun service météo dans Home Assistant : installez Météo-France, puis revenez ici."))
        return
    # The saved settings come along: what Hestia-FB proposes on top of them shows as proposed.
    with detection.batch():
        _send_draft(connection, msg, Draft.start(hass, entry), saved=dict(entry.options) if entry else None)


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/change", LANGUAGE: str, vol.Optional("entry_id"): str,
                                  vol.Required("draft"): dict, vol.Required("change"): dict})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_change(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """One change to the draft, as the assistant's step would make it. Nothing is saved."""
    try:
        entry = _entry(hass, msg.get("entry_id"))
    except LookupError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    if msg["change"].get("op") == "redetect":
        detection.forget()  # « Rechercher à nouveau les capteurs »: every sensor read again
    with detection.batch():
        draft = Draft(hass, msg["draft"], entry)
        error = draft.change(msg["change"])
        # A refused change leaves the draft as it was.
        _send_draft(connection, msg, Draft(hass, msg["draft"], entry) if error else draft, error)


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/save", LANGUAGE: str, vol.Optional("entry_id"): str,
                                  vol.Required("draft"): dict, vol.Optional("enabled"): [str]})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Saves the place: it restarts with its new settings."""
    try:
        entry_id = await Draft(hass, msg["draft"], _entry(hass, msg.get("entry_id"))).save(msg.get("enabled"))
    except (LookupError, ValueError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"entry_id": entry_id})


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/remove", LANGUAGE: str, vol.Required("entry_id"): str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_remove(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Removes the place, as « Supprimer » in Home Assistant would: its entities go, the station's sensors stay."""
    try:
        entry = _entry(hass, msg["entry_id"])
    except (LookupError, ValueError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    await hass.config_entries.async_remove(entry.entry_id)
    connection.send_result(msg["id"], {"removed": entry.entry_id})


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/panel/link", LANGUAGE: str, vol.Required("entry_id"): str,
                                  vol.Required("brick"): str, vol.Required("enabled"): bool})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_link(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Links this place to an official Hestia-FB brick or unlinks it, saved at once on the brick's side: one link for both."""
    try:
        _entry(hass, msg["entry_id"])
        await set_official(hass, msg["brick"], msg["entry_id"], msg["enabled"])
    except (LookupError, ValueError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"official": official(hass, msg["entry_id"])})


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/rename/preview", LANGUAGE: str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_rename_preview(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """What renaming the former « legacy.ENTITY_ROOT… » entities « hestia_weather… » would do (migration.py). Nothing changes."""
    connection.send_result(msg["id"], await migration.preview(hass))


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/rename/apply", LANGUAGE: str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_rename(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Renames the entities and what uses them, asked for by the user."""
    try:
        done = await migration.apply(hass)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"done": done, "preview": await migration.preview(hass)})


@websocket_api.websocket_command({vol.Required("type"): "hestia_weather/rename/undo", LANGUAGE: str})
@websocket_api.require_admin
@websocket_api.async_response
@spoken
async def ws_rename_undo(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Back to the old ids."""
    try:
        done = await migration.undo(hass)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"done": done, "preview": await migration.preview(hass)})
