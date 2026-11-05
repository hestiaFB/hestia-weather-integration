"""A home installed under the former technical name, carried over to « hestia_weather » with a real Home Assistant:
nothing the user has is lost. Skipped without Home Assistant: ../ha-test/venv/bin/python -m unittest tests/test_domain_migration_ha.py

A first Home Assistant sets the home up with the former integration (a stand-in written by the test, under legacy.DOMAIN):
a place, its entities and device as the user named and placed them, its alerts in progress, a dashboard, an automation,
a blueprint imported from this repository and a package written by hand. A second one starts on the same folder with
this version next to the former code, still installed, as HACS may leave it.
"""
from pathlib import Path
import json
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

try:
    from homeassistant import loader
    from homeassistant.components.lovelace import LovelaceData
    from homeassistant.components.lovelace.dashboard import LovelaceStorage
    from homeassistant.components.lovelace.resources import ResourceStorageCollection
    from homeassistant.config_entries import ConfigEntries, ConfigEntry, ConfigEntryState
    from homeassistant.core import CoreState, HomeAssistant
    from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er, frame, issue_registry as ir
    from homeassistant.helpers.storage import Store
except ImportError:  # pragma: no cover - the engine's own test run
    raise unittest.SkipTest("Home Assistant is not installed")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import custom_components.hestia_weather as integration  # noqa: E402
from custom_components.hestia_weather import domain_migration  # noqa: E402
from custom_components.hestia_weather.coordinator import HestiaWeatherCoordinator  # noqa: E402
from custom_components.hestia_weather.engine import legacy  # noqa: E402

OLD = legacy.DOMAIN
LOADS = ("_load_forecasts", "_load_history", "_load_rain", "_load_week", "_load_air_forecast", "_load_strikes", "_load_lightning_month")
# The former code, reduced to what a home kept from it: the place's entities (same unique ids) on its device.
OLD_INIT = """from homeassistant.const import Platform
async def async_setup_entry(hass, entry):
    await hass.config_entries.async_forward_entry_setups(entry, [Platform.SENSOR])
    return True
async def async_unload_entry(hass, entry):
    return await hass.config_entries.async_unload_platforms(entry, [Platform.SENSOR])
"""
OLD_SENSOR = """from homeassistant.components.sensor import SensorEntity
DOMAIN = {domain!r}
async def async_setup_entry(hass, entry, add):
    add([Old(entry, key) for key in ("humidex", "pluie_24h")])
class Old(SensorEntity):
    _attr_native_value = 1
    def __init__(self, entry, key):
        self._attr_unique_id = f"{{entry.entry_id}}_{{key}}"
        self._attr_device_info = {{"identifiers": {{(DOMAIN, entry.entry_id)}}, "name": "Hestia Weather"}}
        self.entity_id = f"sensor.{{DOMAIN}}_{{key}}"
"""


def mocked_loads():
    return (patch.multiple(HestiaWeatherCoordinator, **{name: AsyncMock() for name in LOADS}),
            patch.object(HestiaWeatherCoordinator, "async_config_entry_first_refresh", AsyncMock()))


class DomainMigrationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.config = Path(self.directory.name)
        old = self.config / "custom_components" / OLD
        old.mkdir(parents=True)
        (old / "manifest.json").write_text(json.dumps({"domain": OLD, "name": "Hestia Weather", "codeowners": ["@hestiaFB"],
                                                       "config_flow": True, "version": "2.9.6", "dependencies": []}))
        (old / "__init__.py").write_text(OLD_INIT)
        (old / "sensor.py").write_text(OLD_SENSOR.format(domain=OLD))
        (old / "config_flow.py").write_text(f"from homeassistant import config_entries\nclass Flow(config_entries.ConfigFlow, domain={OLD!r}):\n    VERSION = 1\n")
        (self.config / "custom_components" / "hestia_weather").symlink_to(ROOT / "custom_components" / "hestia_weather")
        # Hestia Confort's new version, installed next to it but not started yet: it only says when it is.
        sibling = self.config / "custom_components" / "hestia_comfort"
        sibling.mkdir()
        (sibling / "manifest.json").write_text(json.dumps({"domain": "hestia_comfort", "name": "Hestia Confort", "codeowners": [],
                                                           "version": "2.0.0b2", "dependencies": []}))
        (sibling / "__init__.py").write_text("async def async_setup(hass, config):\n    hass.data['comfort started'] = True\n    return True\n")
        sys.path.insert(0, str(self.config))
        self.old_id = await self.first_home()

    async def asyncTearDown(self):
        sys.path.remove(str(self.config))
        for name in [m for m in sys.modules if m.startswith(f"custom_components.{OLD}")]:
            del sys.modules[name]
        self.directory.cleanup()

    async def start(self) -> HomeAssistant:
        hass = HomeAssistant(str(self.config))
        frame.async_setup(hass)
        loader.async_setup(hass)
        hass.config_entries = ConfigEntries(hass, {})
        await hass.config_entries.async_initialize()
        await ar.async_load(hass)
        dr.async_setup(hass)
        await dr.async_load(hass)
        await er.async_load(hass)
        await ir.async_load(hass)
        default = LovelaceStorage(hass, None)
        resources = ResourceStorageCollection(hass, default)
        hass.data["lovelace"] = LovelaceData("storage", {None: default}, resources, {})
        return hass

    async def first_home(self) -> str:
        """The home as the former version left it."""
        hass = await self.start()
        entry = ConfigEntry(domain=OLD, title="Gardanne", data={}, options={"weather_entity": "weather.home"}, unique_id="gardanne",
                            version=1, minor_version=1, source="user", discovery_keys={}, subentries_data=None)
        await hass.config_entries.async_add(entry)
        await hass.async_block_till_done()
        self.assertIs(entry.state, ConfigEntryState.LOADED)
        # Hestia Confort, still under its former name too (its code is not part of this test).
        comfort = ConfigEntry(domain=legacy.COMFORT_DOMAIN, title="Mon logement", data={"home": True}, options={}, unique_id="home",
                              version=1, minor_version=1, source="user", discovery_keys={}, subentries_data=None)
        hass.config_entries._entries[comfort.entry_id] = comfort
        hass.config_entries._async_schedule_save()
        area = ar.async_get(hass).async_create("Jardin")
        devices, entities = dr.async_get(hass), er.async_get(hass)
        [device] = dr.async_entries_for_config_entry(devices, entry.entry_id)
        devices.async_update_device(device.id, area_id=area.id, name_by_user="Ma météo")
        entities.async_update_entity(f"sensor.{OLD}_humidex", name="Humidex du jardin", icon="mdi:sun-thermometer")
        entities.async_update_entity(f"sensor.{OLD}_pluie_24h", disabled_by=er.RegistryEntryDisabler.USER)
        await Store(hass, 1, f"{OLD}.alertes.{entry.entry_id}").async_save({"alerts": {"vent": {"since": "2026-10-29T08:00:00+00:00"}}})
        await Store(hass, 1, legacy.SOCLE_KEY).async_save({"sidebar": False, "theme": "ha"})
        await hass.data["lovelace"].dashboards[None].async_save({"views": [{"cards": [
            {"type": f"custom:{OLD.replace('_', '-')}-card", "entry_id": entry.entry_id},
            {"type": "entities", "entities": [f"sensor.{OLD}_humidex"]},
            {"type": "button", "tap_action": {"action": "navigate", "navigation_path": f"/{legacy.PANEL}/meteo"}}]}]})
        await hass.data["lovelace"].resources.async_create_item({"res_type": "module", "url": f"{legacy.ASSETS}/{legacy.CARD_FILE}?v=2.9.6"})
        (self.config / "automations.yaml").write_text(
            f"- id: '1'\n  alias: Bulletin\n  triggers:\n  - trigger: event\n    event_type: {legacy.ALERT_EVENT}\n"
            f"  actions:\n  - action: {OLD}.prevision\n    data:\n      entity_id: sensor.{OLD}_humidex\n", encoding="utf-8")
        (self.config / "packages").mkdir()
        (self.config / "packages" / "meteo.yaml").write_text(
            f"script:\n  matin:\n    sequence:\n      - action: {OLD}.prevision\n", encoding="utf-8")
        imported = self.config / "blueprints" / "automation" / "hestiaFB"
        imported.mkdir(parents=True)
        (imported / "gel.yaml").write_text(
            "blueprint:\n  name: Gel\n  domain: automation\n"
            f"  source_url: https://github.com/hestiaFB/hestia-weather-integration/blob/main/blueprints/automation/{OLD}/gel.yaml\n"
            f"  input:\n    place:\n      selector:\n        entity:\n          filter:\n            integration: {OLD}\n", encoding="utf-8")
        await self.stop(hass)
        return entry.entry_id

    async def new_version(self, hass: HomeAssistant) -> None:
        """Home Assistant has started; this version is set up and carries the home over."""
        hass.set_state(CoreState.running)
        loads, refresh = mocked_loads()
        with loads, refresh:
            await integration.async_setup(hass, {})
            hass.config.components.add("hestia_weather")
            await hass.async_block_till_done()

    async def stop(self, hass: HomeAssistant) -> None:
        """Stopped as Home Assistant stops: every file written."""
        hass.set_state(CoreState.running)
        await hass.async_stop()

    async def test_nothing_is_lost(self):
        hass = await self.start()
        old = hass.config_entries.async_get_entry(self.old_id)
        await hass.config_entries.async_setup(old.entry_id)  # the former code is still installed
        await hass.async_block_till_done()
        self.assertIs(old.state, ConfigEntryState.LOADED)
        await self.new_version(hass)

        # One entry, under the new name, with everything the former one had.
        self.assertEqual(hass.config_entries.async_entries(OLD), [])
        [entry] = hass.config_entries.async_entries("hestia_weather")
        self.assertEqual((entry.title, entry.unique_id, dict(entry.options)), ("Gardanne", "gardanne", {"weather_entity": "weather.home"}))
        self.assertIs(entry.state, ConfigEntryState.LOADED)
        # The same entities, by the same ids, as the user named, placed and disabled them, on the same device.
        entities, devices = er.async_get(hass), dr.async_get(hass)
        humidex, rain = entities.async_get(f"sensor.{OLD}_humidex"), entities.async_get(f"sensor.{OLD}_pluie_24h")
        self.assertEqual((humidex.platform, humidex.config_entry_id, humidex.unique_id), ("hestia_weather", entry.entry_id, f"{entry.entry_id}_humidex"))
        self.assertEqual((humidex.name, humidex.icon), ("Humidex du jardin", "mdi:sun-thermometer"))
        self.assertEqual((rain.platform, rain.config_entry_id, rain.disabled_by), ("hestia_weather", entry.entry_id, er.RegistryEntryDisabler.USER))
        self.assertFalse([e for e in entities.entities.values() if e.entity_id.startswith(f"sensor.{OLD}_humidex_")])
        [device] = dr.async_entries_for_config_entry(devices, entry.entry_id)
        self.assertEqual(device.identifiers, {("hestia_weather", entry.entry_id)})
        self.assertEqual((device.name_by_user, ar.async_get(hass).async_get_area(device.area_id).name), ("Ma météo", "Jardin"))
        self.assertEqual(humidex.device_id, device.id)
        # The alerts in progress and the panel's settings, under the new name; the former files are gone.
        alerts = await Store(hass, 1, f"hestia_weather.alertes.{entry.entry_id}").async_load()
        self.assertEqual(alerts, {"alerts": {"vent": {"since": "2026-10-29T08:00:00+00:00"}}})
        self.assertEqual(await Store(hass, 1, "hestia_socle").async_load(), {"sidebar": False, "theme": "ha"})
        self.assertFalse((self.config / ".storage" / f"{OLD}.alertes.{self.old_id}").exists())
        # What the interface wrote follows; the entity ids in it do not change.
        dashboard = await hass.data["lovelace"].dashboards[None].async_load(False)
        cards = dashboard["views"][0]["cards"]
        self.assertEqual(cards[0], {"type": "custom:hestia-weather-card", "entry_id": entry.entry_id})
        self.assertEqual(cards[1]["entities"], [f"sensor.{OLD}_humidex"])
        self.assertEqual(cards[2]["tap_action"]["navigation_path"], "/hestia/meteo")
        automations = (self.config / "automations.yaml").read_text(encoding="utf-8")
        self.assertIn("event_type: hestia_weather_alerte", automations)
        self.assertIn("action: hestia_weather.prevision", automations)
        self.assertIn(f"entity_id: sensor.{OLD}_humidex", automations)
        blueprint = (self.config / "blueprints" / "automation" / "hestiaFB" / "gel.yaml").read_text(encoding="utf-8")
        self.assertIn("integration: hestia_weather", blueprint)
        self.assertIn("/blueprints/automation/hestia_weather/gel.yaml", blueprint)
        self.assertEqual([r["url"] for r in hass.data["lovelace"].resources.async_items()], [])
        # Written by hand: left as it is, and listed with its line.
        self.assertIn(f"{OLD}.prevision", (self.config / "packages" / "meteo.yaml").read_text(encoding="utf-8"))
        issues = ir.async_get(hass).issues
        self.assertIn("packages/meteo.yaml (4)", issues[("hestia_weather", "migration_manual")].translation_placeholders["items"])
        # The former code was running: its folder is gone, and a restart is asked for.
        self.assertFalse((self.config / "custom_components" / OLD).exists())
        self.assertIn(("hestia_weather", "migration_restart"), issues)
        self.assertNotIn(("hestia_weather", "migration_failed"), issues)
        # The shared table says which id the place took, for the other bricks.
        self.assertEqual(await domain_migration.async_entry_ids(hass), {self.old_id: entry.entry_id})
        # Hestia Confort, not updated yet, still finds Hestia Weather where it looked, by the place id it kept.
        former = hass.data[legacy.API_KEY]
        self.assertEqual((former.version, former.place(self.old_id)), (1, entry.entry_id))
        self.assertEqual(former.places(), [{"entry_id": self.old_id, "title": "Gardanne"}])  # the id its settings keep
        self.assertEqual(former.station(self.old_id), hass.data["hestia_weather_api"].station(entry.entry_id))
        heard = []
        stop = former.add_listener(self.old_id, lambda: heard.append(1), brick=legacy.COMFORT_DOMAIN)
        entry.runtime_data.async_update_listeners()
        self.assertEqual(heard, [1])
        stop()
        await self.stop(hass)

    async def test_add_an_integration_resumes_the_home(self):
        """The situation after an update without the bridge: the former code runs, the new one is installed but nothing
        starts it. « Add an integration → Hestia Weather » resumes the home instead of setting up a new place."""
        hass = await self.start()
        await hass.config_entries.async_setup(self.old_id)
        await hass.async_block_till_done()
        hass.set_state(CoreState.running)
        hass.config.components.update({"frontend", "http", "recorder", "websocket_api", "lovelace"})  # there in a real home
        loads, refresh = mocked_loads()
        with loads, refresh:
            self.assertNotIn("hestia_weather", hass.config.components)
            result = await hass.config_entries.flow.async_init("hestia_weather", context={"source": "user"})
            await hass.async_block_till_done()
        self.assertEqual((result["type"], result["reason"]), ("abort", "migrated"))
        self.assertEqual(hass.config_entries.async_entries(OLD), [])
        [entry] = hass.config_entries.async_entries("hestia_weather")
        self.assertEqual(entry.title, "Gardanne")
        self.assertIs(entry.state, ConfigEntryState.LOADED)
        self.assertEqual(er.async_get(hass).async_get(f"sensor.{OLD}_humidex").config_entry_id, entry.entry_id)
        # Hestia Confort, installed and still under its former name, was started too: it carries itself over.
        self.assertTrue(hass.data.get("comfort started"))
        # What the hub shows: done, a restart to finish, one place.
        from custom_components.hestia_weather.panel import migration_status
        status = await migration_status(hass)
        self.assertEqual((status["state"], status["restart"], status["summary"], status["entities"]), ("done", True, {"places": 1}, 2))
        self.assertGreater(status["names"]["left"], 0)  # the home keeps its former ids until the user renames them
        await self.stop(hass)

    async def test_a_second_start_changes_nothing(self):
        hass = await self.start()
        await self.new_version(hass)
        [entry] = hass.config_entries.async_entries("hestia_weather")
        await self.stop(hass)
        hass = await self.start()
        await self.new_version(hass)
        self.assertEqual([e.entry_id for e in hass.config_entries.async_entries("hestia_weather")], [entry.entry_id])
        self.assertFalse(domain_migration.pending(hass))
        again = await domain_migration.async_carry_over(hass)
        self.assertEqual(again["entries"], {})
        await self.stop(hass)


if __name__ == "__main__":
    unittest.main()
