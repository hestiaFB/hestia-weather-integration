"""Hestia shared panel (socle v1): one sidebar entry « Hestia » for every installed Hestia brick.

Copied unchanged into each brick from hestia-ecosysteme/socle/ (see ECOSYSTEME.md § 8).
Several copies may run side by side: the newest one shows the panel and every brick
registers with it. Registrations are plain dicts, so copies of different versions
understand each other; no brick ever reads another brick's settings.
"""
from __future__ import annotations

import asyncio
import hashlib
import inspect
import logging
from pathlib import Path
from urllib.parse import unquote, urlsplit

import voluptuous as vol
from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.storage import Store

from .engine import legacy

SOCLE_VERSION = (1, 22)
# Which copy of a same version is the newest: written by copier.sh when the socle changes (EMPREINTE), equal in ui.ts.
SOCLE_BUILD = "20261105.1407"
# 1.1: an optional `tab`, the tab's own name when it is not the brick's (« Météo » for Hestia Weather).
# 1.2: async_register_card, the brick's card on every dashboard, also as a dashboard resource.
# 1.3: the home page says « À découvrir » and « Voir » for the bricks not installed (same contract as 1.2).
# 1.4: guarded card bundles, extra module only as fallback, encoded resource migration.
# 1.5: the sidebar entry can be hidden (`set_sidebar`, kept in .storage); the panel itself stays reachable by its address.
# 1.6: grouped navigation and optional brick `navigation=1` capability; older bricks keep their overview link.
# 1.7: full-height shell and a persisted HA/Hestia theme preference.
# 1.8: Weather navigation=2 groups its configuration under general settings, like Comfort.
# 1.9: HA themes keep visible structural outlines even when divider-color equals the page background.
# 1.10: a brick's first link is « Accueil »; Comfort navigation=2 adds « Bilan du logement » under it.
# 1.11: the Hestia logo heads the menu (and the mobile bar).
#       Same contract, later fixes: the panel settings are written one at a time; the bricks' states are read together.
# 1.12: the panel is at /hestia (the former address leads there); the menu names each brick by its tab; ui.ts gives every brick the
#       same pages (pageHead, todoFrame, itemsFrame, stepMenu, stepFooter, extensionsFrame, versionsFrame).
#       A brick with `navigation: 3` also has its « Extensions » page (/hestia/<brique>/extensions): extensionCard, removeBlock.
# 1.13: the hub speaks Home Assistant's language (i18n.ts: t(), one dictionary per language; English for any other).
# 1.14: a brick's status may take the hub's language as a second argument: status(hass, language).
# 1.15: every technical name says Hestia: websocket `hestia/…`, .storage/hestia_socle, the « hestia » appearance.
#       The former names live in the brick's legacy.py only: its migration carries the settings over.
# 1.16: a brick may give `migration(hass)`: the home page shows « Passage au nom Hestia » until every step is done and
#       the user closes it (`hestia/close_migration`, kept with the panel settings).
# 1.17: the hub speaks German (i18n-de.ts); a word a brick's dictionary lacks is read in English, not French.
# 1.18: ui.ts detectedFrame and askUrl: the integrations found but not read yet, « Demander » opens the brick's extension.yml form.
# 1.19: ui.ts noteBox and noteTag, the purple dotted « Encart d'information » (--nk-note, --nk-note-bg): something to read, hub only.
# 1.20: a brick may give its own `menu` ([[path, label, icon], …], CAHIER-HUB.md § 5): the hub shows it as is; ui.ts listSection,
#       listRow and saveBar, the lists and the save bar every page shares.
# 1.21: the structure answers at the touch: ☰ opens Home Assistant's menu, the bar's title opens the Hestia drawer
#       (slides, pushed back with a finger), other bricks' groups fold; rows wait busy, the save bar says « Enregistré »,
#       tabs fade at the edge; common motion tokens (ETAT-DES-LIEUX-HUB.md § 7). No change to the bricks' contract.
# 1.22: the newest copy on the page gives every brick its pages (ETAT-DES-LIEUX-HUB.md § 9): a brick's tab imports ui.ts through
#       hub.ts, which takes the newest ui.ts loaded; ui.ts only ever adds. Of two copies of one version, the later SOCLE_BUILD
#       shows the panel. A brick still under its former name (socle 1.14, `niak_socle`) is listed in the hub, never shows its own.
#       The hub's script and the brick's tab are served at an address of their content (/hestia-socle/<domain>/<version>.<build>-<sum>/):
#       a cache that kept an older script under the brick's address (browser, or a proxy ignoring ?v=) can no longer leave
#       the page blank (another element name) nor an old tab in a new hub. A copy whose script on disk does not define its
#       own element (a file left from another version) never shows the panel: another brick's copy shows it.
# The shell's custom element carries its version: two copies never fight over one name.
ELEMENT = "hestia-socle-1-22"
KEY = "hestia_socle"
STORE_VERSION = 1
PANEL = "hestia"
# The address before 1.12: still opened from bookmarks, older dashboards and older copies; it leads to PANEL.
LEGACY_PANEL = legacy.PANEL
THEMES = ("ha", "hestia")
TITLE = "Hestia"
ICON = "mdi:home-heart"
LEVELS = ("ok", "action", "unknown")
# Published bricks only: the home page never proposes a brick that does not exist yet.
CATALOGUE = (
    {"domain": "hestia_weather", "name": "Hestia Weather",
     "pitch": "La météo de votre station : prévisions, alertes, qualité de l’air et pollens.",
     "url": "https://github.com/hestiaFB/hestia-weather-integration"},
    {"domain": "hestia_comfort", "name": "Hestia Confort",
     "pitch": "Le confort de chaque pièce et le bon moment pour ouvrir, fermer ou aérer.",
     "url": "https://github.com/hestiaFB/hestia-comfort-integration"},
)
_LOGGER = logging.getLogger(__name__)


async def async_register_brick(hass, brick, shell_url):
    """Register a brick: {domain, name, slug, version, icon, module_url, element, status, legacy_path} and, since 1.1, `tab`."""
    data = hass.data.setdefault(KEY, {"bricks": {}, "panel": None})
    await _load_settings(hass, data)
    shell_url, brick = await _served(hass, shell_url, brick)
    data["bricks"][brick["domain"]] = {**brick, "socle": SOCLE_VERSION}
    if brick.get("legacy_path"):
        await _legacy_panel(hass, brick, shell_url)
    current = data.get("panel")
    if current is not None and _rank(current) >= (SOCLE_VERSION, SOCLE_BUILD):
        return
    if not await hass.async_add_executor_job(_defines_element, shell_url):
        _LOGGER.error("Le script du panneau Hestia de %s ne définit pas %s : fichier d'une autre version ? "
                      "Réinstallez la brique. Le panneau reste à une autre brique.", brick["domain"], ELEMENT)
        return
    data["panel"] = {"socle": SOCLE_VERSION, "build": SOCLE_BUILD, "shell_url": shell_url, "domain": brick["domain"]}
    _hold_former(hass, shell_url, brick["domain"])
    # Re-registering replaces an older copy's handler: the newest socle answers.
    websocket_api.async_register_command(hass, _ws_overview)
    websocket_api.async_register_command(hass, _ws_set_sidebar)
    websocket_api.async_register_command(hass, _ws_set_theme)
    websocket_api.async_register_command(hass, _ws_close_migration)
    await _show_panel(hass, shell_url, data["settings"]["sidebar"])


async def _served(hass, shell_url, brick):
    """The hub's script and the brick's tab at an address of their content, served from this brick's frontend folder.

    The panel asks for an element named after the socle's version: an older script found in a cache under the same
    address would define another name, and Home Assistant shows an empty page without an error. The address changes
    with any script of the folder (hub, tab, card the tab may load next to it).
    """
    if not getattr(hass, "http", None) or not hasattr(hass.http, "async_register_static_paths"):
        return shell_url, brick  # Isolated tests and headless setups have no frontend.
    folder = Path(__file__).parent / "frontend"
    content = await hass.async_add_executor_job(_content, folder)
    base = f"/hestia-socle/{folder.parent.name}/{SOCLE_VERSION[0]}.{SOCLE_VERSION[1]}.{SOCLE_BUILD}-{content}"
    served = hass.data.setdefault(f"{KEY}_served", set())
    if base not in served:
        await hass.http.async_register_static_paths([StaticPathConfig(base, str(folder), True)])
        served.add(base)

    def here(url):
        name = urlsplit(url or "").path.rsplit("/", 1)[-1]
        return f"{base}/{name}" if url and url.startswith("/") and (folder / name).is_file() else url
    return here(shell_url), {**brick, "module_url": here(brick.get("module_url"))}


def _defines_element(shell_url):
    """The hub's script in this brick's folder defines this copy's element; True when it cannot be read here (tests).

    Home Assistant creates the panel's element by name: a script of another version defines another name and the page
    stays empty, without an error (issue #48 of Hestia Confort).
    """
    script = Path(__file__).parent / "frontend" / urlsplit(shell_url).path.rsplit("/", 1)[-1]
    try:
        return ELEMENT.encode() in script.read_bytes()
    except OSError:
        return True


def _content(folder):
    """A short sum of the folder's scripts: the same files, the same address."""
    digest = hashlib.sha256()
    for script in sorted(folder.glob("*.js")):
        digest.update(script.name.encode() + b"\0" + script.read_bytes())
    return digest.hexdigest()[:10]


def _rank(panel):
    """The version, then the build: a copy before 1.22 has no build and loses to any 1.22 of its version."""
    return tuple(panel["socle"]), str(panel.get("build") or "")


def _former(hass):
    """The bricks still under their former name, kept by their own older copy of the socle (1.14 and before)."""
    key = getattr(legacy, "SOCLE_KEY", None)
    return hass.data.get(key, {}).get("bricks", {}) if key else {}


def _hold_former(hass, shell_url, domain):
    """An older copy under the former name finds the panel taken by a newer socle and leaves it alone.

    Before 1.15 the bricks registered under another key: without this, each copy showed /hestia in turn,
    the last one started winning, and the hub of the other one listed only its own brick.
    """
    key = getattr(legacy, "SOCLE_KEY", None)
    if key:
        hass.data.setdefault(key, {"bricks": {}, "panel": None})["panel"] = {"socle": SOCLE_VERSION, "shell_url": shell_url, "domain": domain}


async def _load_settings(hass, data):
    """What the user chose for the whole panel (shared by every brick): sidebar visibility and appearance."""
    if "theme" in data.get("settings", {}):
        return
    stored = None
    try:
        stored = await Store(hass, STORE_VERSION, KEY).async_load()
    except Exception:  # noqa: BLE001 - an unreadable file never keeps the panel from opening
        _LOGGER.warning("Réglages du panneau Hestia illisibles : menu affiché par défaut", exc_info=True)
    settings = stored if isinstance(stored, dict) else {}
    data["settings"] = {"sidebar": data.get("settings", {}).get("sidebar", settings.get("sidebar", True)) is not False,
                        "theme": settings.get("theme") if settings.get("theme") in THEMES else "hestia",
                        "migration_closed": settings.get("migration_closed") is True}


async def _show_panel(hass, shell_url, sidebar):
    """The panel at /hestia, in the sidebar or not: hidden, it stays open to anyone who follows its address."""
    for path in (PANEL, LEGACY_PANEL):
        if frontend.async_panel_exists(hass, path):
            frontend.async_remove_panel(hass, path, warn_if_unknown=False)
    await async_register_panel(hass, frontend_url_path=PANEL, webcomponent_name=ELEMENT,
                               sidebar_title=TITLE if sidebar else None, sidebar_icon=ICON if sidebar else None,
                               module_url=shell_url, require_admin=True)
    # An older copy showed the panel at the former address: it now leads to /hestia, hidden from the sidebar.
    await async_register_panel(hass, frontend_url_path=LEGACY_PANEL, webcomponent_name=ELEMENT, module_url=shell_url,
                               require_admin=True, config={"redirect": f"/{PANEL}"})


def _settings_lock(hass):
    """One write of the panel settings at a time: two quick changes never lose one another."""
    return hass.data.setdefault(f"{KEY}_lock", asyncio.Lock())


async def async_set_sidebar(hass, visible):
    """Show or hide « Hestia » in the sidebar, at once, and remember it."""
    data = hass.data.setdefault(KEY, {"bricks": {}, "panel": None})
    async with _settings_lock(hass):
        await _load_settings(hass, data)
        data["settings"]["sidebar"] = bool(visible)
        await Store(hass, STORE_VERSION, KEY).async_save(dict(data["settings"]))
    if data.get("panel"):
        await _show_panel(hass, data["panel"]["shell_url"], bool(visible))
    return bool(visible)


async def async_set_theme(hass, theme):
    """Remember the hub appearance without changing the Home Assistant theme."""
    if theme not in THEMES:
        raise ValueError("Thème Hestia inconnu")
    data = hass.data.setdefault(KEY, {"bricks": {}, "panel": None})
    async with _settings_lock(hass):
        await _load_settings(hass, data)
        data["settings"]["theme"] = theme
        await Store(hass, STORE_VERSION, KEY).async_save(dict(data["settings"]))
    return theme


async def async_close_migration(hass):
    """« J'ai compris »: the « Passage au nom Hestia » frame is closed for good."""
    data = hass.data.setdefault(KEY, {"bricks": {}, "panel": None})
    async with _settings_lock(hass):
        await _load_settings(hass, data)
        data["settings"]["migration_closed"] = True
        await Store(hass, STORE_VERSION, KEY).async_save(dict(data["settings"]))
    return True


async def _migration(hass, brick):
    """One brick's « Passage au nom Hestia » (socle 1.16), or None: never what keeps the home page from opening."""
    if not callable(brick.get("migration")):
        return None
    try:
        async with asyncio.timeout(5):
            return await brick["migration"](hass)
    except Exception:  # noqa: BLE001 - one brick's failure never hides the others
        _LOGGER.exception("Passage au nom Hestia de %s illisible", brick.get("domain"))
        return None


async def _legacy_panel(hass, brick, shell_url):
    """The brick's former address stays valid, hidden from the sidebar, and leads to its tab.

    It also keeps the « Configurer » button of the integrations page working.
    """
    if frontend.async_panel_exists(hass, brick["legacy_path"]):
        return
    await async_register_panel(hass, frontend_url_path=brick["legacy_path"], webcomponent_name=ELEMENT,
                               module_url=shell_url, require_admin=True,
                               config={"redirect": f"/{PANEL}/{brick['slug']}"},
                               config_panel_domain=brick["domain"])


async def async_register_card(hass, url, version):
    """The brick's card on every dashboard, at the brick's version (`url` without query: /hestia_x-assets/hestia-x-card.js).

    Prefer the dashboard resource collection. YAML collections cannot be edited:
    only there (or on registration failure) use an extra module. Every card bundle
    must wait for home-assistant before executing, including Lit and decorators
    (card-build.mjs), so this fallback and cached older index pages are safe too.
    """
    async def resource(_hass):
        try:
            if await _card_resource(hass, url, f"{url}?v={version}"):
                return
        except Exception:  # noqa: BLE001 - fall back to the guarded card bundle
            _LOGGER.warning("Ressource de tableau de bord %s non enregistrée", url, exc_info=True)
        frontend.add_extra_js_url(hass, f"{url}?v={version}")

    async_at_started(hass, resource)


def _resources(hass):
    """The dashboard resources kept by the user interface; None when they are written in YAML."""
    lovelace = hass.data.get("lovelace")
    resources = lovelace.get("resources") if isinstance(lovelace, dict) else getattr(lovelace, "resources", None)
    return resources if hasattr(resources, "async_create_item") else None


def is_card_resource(candidate, url):
    """Recognize only this local asset, including percent-encoded workarounds."""
    try:
        parsed = urlsplit(str(candidate))
        return not parsed.scheme and not parsed.netloc and unquote(parsed.path) == url
    except ValueError:
        return False


async def _card_resource(hass, url, wanted):
    """One resource for the card, at its current address: created, updated after a new version, duplicates removed."""
    resources = _resources(hass)
    if resources is None:
        return False
    if not getattr(resources, "loaded", True):
        await resources.async_load()
        resources.loaded = True
    mine = [item for item in resources.async_items() if is_card_resource(item.get("url", ""), url)]
    for extra in mine[1:]:
        await resources.async_delete_item(extra["id"])
    if not mine:
        await resources.async_create_item({"res_type": "module", "url": wanted})
    elif mine[0].get("url") != wanted or mine[0].get("type") != "module":
        await resources.async_update_item(mine[0]["id"], {"res_type": "module", "url": wanted})
    return True


async def async_remove_card(hass, url):
    """The card's dashboard resource goes when the brick's last place or room does: nothing left points to it."""
    resources = _resources(hass)
    if resources is None:
        return
    if not getattr(resources, "loaded", True):
        await resources.async_load()
        resources.loaded = True
    for item in [i for i in resources.async_items() if is_card_resource(i.get("url", ""), url)]:
        await resources.async_delete_item(item["id"])


def _speaks(status) -> bool:
    """A status written for socle 1.14 or later takes the hub's language; an older brick's only takes hass."""
    try:
        return len(inspect.signature(status).parameters) >= 2
    except (TypeError, ValueError):
        return False


async def _status(hass, brick, language=None):
    try:
        async with asyncio.timeout(5):
            status = await (brick["status"](hass, language) if _speaks(brick["status"]) else brick["status"](hass))
        level = status.get("level")
        return {"level": level if level in LEVELS else "unknown",
                "summary": str(status.get("summary") or ""),
                "details": [str(d) for d in status.get("details", [])][:6],
                "links": [str(link) for link in status.get("links", [])][:6]}
    except Exception:  # noqa: BLE001 - one brick's failure never hides the others
        _LOGGER.exception("État de %s indisponible", brick.get("domain"))
        return {"level": "unknown", "summary": "État indisponible pour le moment.", "details": [], "links": []}


def _order(brick):
    """The catalogue's order; a brick under its former name takes its new name's place."""
    found = [i for i, c in enumerate(CATALOGUE) if brick["domain"] == c["domain"] or brick.get("name") == c["name"]]
    return (found[0] if found else len(CATALOGUE), brick["name"])


async def async_overview(hass, language=None):
    bricks = hass.data.get(KEY, {}).get("bricks", {})
    # A brick still under its former name is shown too, unless it is already there under its new one (during its move).
    slugs = {b["slug"] for b in bricks.values()}
    former = [b for b in _former(hass).values() if b.get("slug") not in slugs]
    listed = sorted([*bricks.values(), *former], key=_order)
    # Read together: a slow brick (5 s at most) does not add its wait to the others'.
    statuses = await asyncio.gather(*(_status(hass, brick, language) for brick in listed))
    result = [{**{k: brick.get(k) for k in ("domain", "name", "slug", "version", "icon", "module_url", "element", "tab", "navigation", "menu")},
               "status": status} for brick, status in zip(listed, statuses)]
    shown = {b["domain"] for b in listed} | {b["name"] for b in listed}
    others = [{**c, "installed": c["domain"] in hass.config.components,
               "settings_path": f"/config/integrations/integration/{c['domain']}"}
              for c in CATALOGUE if c["domain"] not in shown and c["name"] not in shown]
    settings = hass.data.get(KEY, {}).get("settings", {})
    migration = [m for m in await asyncio.gather(*(_migration(hass, brick) for brick in listed)) if m]
    return {"version": 1, "socle": list(SOCLE_VERSION), "bricks": result, "others": others, "sidebar": settings.get("sidebar", True),
            "theme": settings.get("theme", "hestia"),
            "migration": [] if settings.get("migration_closed") else migration}


@websocket_api.websocket_command({vol.Required("type"): "hestia/overview", vol.Optional("language"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_overview(hass, connection, msg):
    connection.send_result(msg["id"], await async_overview(hass, msg.get("language")))


@websocket_api.websocket_command({vol.Required("type"): "hestia/set_sidebar", vol.Required("visible"): bool})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_set_sidebar(hass, connection, msg):
    connection.send_result(msg["id"], {"sidebar": await async_set_sidebar(hass, msg["visible"])})


@websocket_api.websocket_command({vol.Required("type"): "hestia/set_theme", vol.Required("theme"): vol.In(THEMES)})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_set_theme(hass, connection, msg):
    connection.send_result(msg["id"], {"theme": await async_set_theme(hass, msg["theme"])})


@websocket_api.websocket_command({vol.Required("type"): "hestia/close_migration"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_close_migration(hass, connection, msg):
    connection.send_result(msg["id"], {"closed": await async_close_migration(hass)})
