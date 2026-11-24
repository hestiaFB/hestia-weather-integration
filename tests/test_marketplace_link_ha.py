"""After the change of name, a repair says how to get Hestia Weather's updates from the Marketplace again: only when the
carrying over has just removed the former folder, as a plain message, gone by itself once another version is installed.
The Marketplace is never read nor driven: Hestia Weather only knows what it did itself.
Skipped without Home Assistant: ../ha-test/venv/bin/python -m unittest tests/test_marketplace_link_ha.py"""
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest

try:
    from homeassistant import loader
    from homeassistant.config_entries import ConfigEntries, ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import frame, issue_registry as ir
except ImportError:  # pragma: no cover - the engine's own test run
    raise unittest.SkipTest("Home Assistant is not installed")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from custom_components.hestia_weather import marketplace_link  # noqa: E402
from custom_components.hestia_weather.domain_migration import DONE_EVENT  # noqa: E402

ISSUE = ("hestia_weather", marketplace_link.ISSUE)


class MarketplaceLinkTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.hass = hass = HomeAssistant(self.directory.name)
        frame.async_setup(hass)
        loader.async_setup(hass)
        hass.config_entries = ConfigEntries(hass, {})
        await hass.config_entries.async_initialize()
        await ir.async_load(hass)

    async def asyncTearDown(self):
        await self.hass.async_stop(force=True)
        self.directory.cleanup()

    def issue(self):
        return ir.async_get(self.hass).issues.get(ISSUE)

    async def carried_over(self, folder: bool, domain: str = "hestia_weather") -> None:
        self.hass.bus.async_fire(DONE_EVENT, {"domain": domain, "entries": {}, "folder": folder})
        await self.hass.async_block_till_done()

    async def test_the_message_comes_when_the_former_folder_was_removed(self):
        marketplace_link.async_setup_marketplace_link(self.hass, "4.3.0")
        await self.carried_over(folder=False)
        self.assertIsNone(self.issue())  # nothing removed: the Marketplace still follows what it installed
        await self.carried_over(folder=True, domain="hestia_comfort")
        self.assertIsNone(self.issue())  # the other brick says it for itself
        await self.carried_over(folder=True)
        issue = self.issue()
        self.assertFalse(issue.is_fixable)  # a message: nothing is downloaded from here
        self.assertTrue(issue.is_persistent)  # kept across restarts, until dismissed or the next update
        self.assertEqual(issue.data, {"version": "4.3.0"})

    async def test_it_goes_by_itself_with_the_next_version(self):
        marketplace_link.async_setup_marketplace_link(self.hass, "4.3.0")
        await self.carried_over(folder=True)
        marketplace_link.async_setup_marketplace_link(self.hass, "4.3.0")  # started again, same version: kept
        self.assertIsNotNone(self.issue())
        marketplace_link.async_setup_marketplace_link(self.hass, "4.3.1")  # an update came: the Marketplace follows it
        self.assertIsNone(self.issue())

    async def test_the_marketplace_is_never_read(self):
        # Its config entry and objects are there, with a repository that would say « not installed »: nothing reads them.
        entry = ConfigEntry(domain="marketplace", title="Marketplace", data={}, options={}, unique_id=None, version=1, minor_version=1,
                            source="user", discovery_keys={}, subentries_data=None)

        def touched(*_):
            raise AssertionError("the Marketplace's objects were read")
        entry.runtime_data = SimpleNamespace(repositories=SimpleNamespace(get_by_full_name=touched))
        self.hass.config_entries._entries[entry.entry_id] = entry
        self.hass.data["hacs"] = SimpleNamespace(repositories=SimpleNamespace(get_by_full_name=touched))
        marketplace_link.async_setup_marketplace_link(self.hass, "4.3.0")
        await self.carried_over(folder=False)
        self.assertIsNone(self.issue())
        self.assertFalse(hasattr(marketplace_link, "async_track_again"))
        self.assertFalse((ROOT / "custom_components" / "hestia_weather" / "repairs.py").exists())


if __name__ == "__main__":
    unittest.main()
