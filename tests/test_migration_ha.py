"""Renaming a home's former entity ids « hestia_weather… » and back, with a real Home Assistant. Skipped without Home
Assistant (the engine's tests run without it): ../ha-test/venv/bin/python -m unittest tests/test_migration_ha.py"""
from pathlib import Path
import sys
import tempfile
import unittest

try:
    from homeassistant.config_entries import ConfigEntries, ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import device_registry as dr, entity_registry as er
except ImportError:  # pragma: no cover - the engine's own test run
    raise unittest.SkipTest("Home Assistant is not installed")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from custom_components.hestia_weather import migration  # noqa: E402
from custom_components.hestia_weather.sensor import prefix  # noqa: E402
from custom_components.hestia_weather.engine.legacy import ENTITY_ROOT as OLD  # noqa: E402

AUTOMATIONS = f"""- id: '1'
  alias: Pluie au jardin
  triggers:
  - trigger: numeric_state
    entity_id: sensor.{OLD}_pluie_24h
    above: 5
- id: '2'
  alias: Volets
  actions: []
"""
USES = [{"kind": "automation", "name": "Pluie au jardin"}, {"kind": "helper", "name": "Pluie max"},
        {"kind": "file", "name": "packages/pluie.yaml", "lines": [4]}]
PACKAGE = f"template:\n  - sensor:\n      - name: Pluie\n        state: \"{{{{ states('sensor.{OLD}_pluie_24h') }}}}\"\n"


class MigrationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.config = Path(self.directory.name)
        self.hass = HomeAssistant(self.directory.name)
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        dr.async_setup(self.hass)
        await dr.async_load(self.hass)
        await er.async_load(self.hass)
        (self.config / "automations.yaml").write_text(AUTOMATIONS, encoding="utf-8")
        (self.config / "packages").mkdir()
        (self.config / "packages" / "pluie.yaml").write_text(PACKAGE, encoding="utf-8")
        self.entry = ConfigEntry(version=1, minor_version=1, domain="hestia_weather", title="Gardanne", data={}, source="user", options={},
                                 unique_id="Gardanne", discovery_keys={}, subentries_data=None)
        self.hass.config_entries._entries[self.entry.entry_id] = self.entry
        # A helper of another integration that uses an old id in its options.
        self.helper = ConfigEntry(version=1, minor_version=1, domain="min_max", title="Pluie max", data={}, source="user",
                                  options={"entity_ids": [f"sensor.{OLD}_pluie_24h"]}, unique_id=None, discovery_keys={}, subentries_data=None)
        self.hass.config_entries._entries[self.helper.entry_id] = self.helper
        registry = er.async_get(self.hass)
        for n, entity_id in enumerate((f"sensor.{OLD}_pluie_24h", f"weather.{OLD}", "sensor.ma_station_pluie")):
            domain, object_id = entity_id.split(".", 1)
            registry.async_get_or_create(domain, "hestia_weather", f"{self.entry.entry_id}_{n}", suggested_object_id=object_id,
                                         config_entry=self.entry)

    async def asyncTearDown(self):
        await self.hass.async_stop()
        self.directory.cleanup()

    async def test_the_preview_changes_nothing(self):
        seen = await migration.preview(self.hass)
        self.assertEqual(seen["entities"], [{"from": f"sensor.{OLD}_pluie_24h", "to": "sensor.hestia_weather_pluie_24h"},
                                            {"from": f"weather.{OLD}", "to": "weather.hestia_weather"}])
        # Everything that uses them is the user's to change: listed, never rewritten.
        self.assertEqual(seen["auto"], [])
        self.assertEqual(seen["manual"], USES)
        self.assertEqual(seen["stale"], [])
        self.assertFalse(seen["undo"])
        self.assertIsNotNone(er.async_get(self.hass).async_get(f"sensor.{OLD}_pluie_24h"))
        self.assertEqual((self.config / "automations.yaml").read_text(encoding="utf-8"), AUTOMATIONS)

    async def test_renaming_then_going_back(self):
        registry = er.async_get(self.hass)
        done = await migration.apply(self.hass)
        self.assertEqual(done["entities"], 2)
        self.assertIsNotNone(registry.async_get("sensor.hestia_weather_pluie_24h"))
        self.assertIsNotNone(registry.async_get("sensor.ma_station_pluie"))  # an id the user chose stays
        # Only the entities: the automations, the files and the other integrations' options are never written.
        self.assertEqual((self.config / "automations.yaml").read_text(encoding="utf-8"), AUTOMATIONS)
        self.assertEqual((self.config / "packages" / "pluie.yaml").read_text(encoding="utf-8"), PACKAGE)
        self.assertEqual(dict(self.helper.options), {"entity_ids": [f"sensor.{OLD}_pluie_24h"]})
        self.assertEqual(prefix(self.hass, self.entry), "hestia_weather")
        seen = await migration.preview(self.hass)
        self.assertEqual(seen["entities"], [])
        self.assertTrue(seen["undo"])
        # What still uses an old id, until the user changes it.
        self.assertEqual(seen["stale"], USES)
        (self.config / "automations.yaml").write_text(AUTOMATIONS.replace(f"sensor.{OLD}_", "sensor.hestia_weather_"), encoding="utf-8")
        self.assertEqual((await migration.preview(self.hass))["stale"], USES[1:])

        await migration.undo(self.hass)
        self.assertIsNotNone(registry.async_get(f"sensor.{OLD}_pluie_24h"))
        self.assertIsNotNone(registry.async_get(f"weather.{OLD}"))
        self.assertEqual(prefix(self.hass, self.entry), f"{OLD}")
        self.assertFalse((await migration.preview(self.hass))["undo"])

    async def test_a_taken_name_is_kept(self):
        er.async_get(self.hass).async_get_or_create("weather", "other", "x", suggested_object_id="hestia_weather")
        mapping, taken = migration.plan(self.hass)
        self.assertEqual(list(mapping), [f"sensor.{OLD}_pluie_24h"])
        self.assertEqual(taken, [f"weather.{OLD}"])

    async def test_nothing_to_rename_or_undo_says_so(self):
        await migration.apply(self.hass)
        with self.assertRaises(ValueError):
            await migration.apply(self.hass)
        await migration.undo(self.hass)
        with self.assertRaises(ValueError):
            await migration.undo(self.hass)


if __name__ == "__main__":
    unittest.main()
