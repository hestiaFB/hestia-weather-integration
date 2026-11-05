"""The integration's former technical name, gathered here and nowhere else.

Hestia Weather was first published under another technical name. A home installed then keeps that name in its
configuration entries, .storage files, dashboards and automations: domain_migration.py carries all of it over to
« hestia_weather » at the first start, then removes the old entries. These constants are only what it needs to find them.
They also let an existing home keep the entity ids it already has (sensor.<ENTITY_ROOT>_ressenti), and the optional
renaming tool of the settings (migration.py) offer the new ones. No other module writes an old name.
"""
from __future__ import annotations

# The former domain: its config entries, its entity platform, its device identifiers, its actions (DOMAIN.prevision).
DOMAIN = "niak_weather"
# The first part of the entity ids of a home set up then: sensor.niak_weather_ressenti.
ENTITY_ROOT = "niak_weather"
# Where its files were served, and its card's file.
ASSETS = "/niak_weather-assets"
CARD_FILE = "niak-weather-card.js"
# Who published it then: its former folder is removed only when it is this brick.
CODEOWNERS = ("@hestiaFB", "@Niakman13")
# The separate card of the first versions, still installed by HACS in some homes.
CARD_REPOSITORY = "hestiaFB/niak-weather"
# The alert event: still fired next to the new one, so that an automation written by hand keeps working.
ALERT_EVENT = "niak_weather_alerte"
# The shared « Hestia » panel: its former address (still opened from bookmarks) and its settings file.
PANEL = "niak"
SOCLE_KEY = "niak_socle"
# The .storage files of the former domain: alerts in progress (one per place) and the undo of the renaming tool.
STORES = (f"{DOMAIN}.alertes.", f"{DOMAIN}.migration")
# Hestia Confort under its former name: the link between the two is carried over by each side, and Hestia Weather starts
# it once carried over (domain_migration._start_siblings).
COMFORT_DOMAIN = "niak_comfort"
SIBLINGS = {"hestia_comfort": COMFORT_DOMAIN}
# Where Hestia Confort under its former name (1.7) looks for Hestia Weather's interface: former_api.py answers there
# while Hestia Confort has not been updated.
API_KEY = "niak_weather_api"
# Former names in what the user wrote (automations, scripts, scenes, dashboards, imported blueprints), with the new one.
# Whole words only; an entity id (sensor.niak_weather_…) is never touched: ids stay as they are.
TEXT = (
    (r"(?<![\w.-])niak_weather_alerte(?!\w)", "hestia_weather_alerte"),
    (r"(?<![\w.-])niak_weather(?=\.prevision\b)", "hestia_weather"),
    (r"(?<![\w.-])niak_weather(?![\w.-])", "hestia_weather"),
    (r"(?<![\w-])niak-weather-", "hestia-weather-"),
    (r"/niak_weather-assets/", "/hestia_weather-assets/"),
    (r"(?<![\w-])/niak(?=/|[\"'\s]|$)", "/hestia"),
    (r"--niak-", "--hestia-"),
    (r"/blueprints/automation/niak_weather/", "/blueprints/automation/hestia_weather/"),
)
