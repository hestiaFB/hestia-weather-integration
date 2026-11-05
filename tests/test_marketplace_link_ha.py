"""After the change of name, Home Assistant's Marketplace may no longer follow Hestia Weather: the repair says so, only
when the offered version is under the new name, and asks the Marketplace to download it again.
Skipped without Home Assistant: ../ha-test/venv/bin/python -m unittest tests/test_marketplace_link_ha.py

The Marketplace is a stand-in with the same shape as Home Assistant 2026.11's (entry.runtime_data.repositories)."""
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
from custom_components.hestia_weather.engine import legacy  # noqa: E402

ISSUE = ("hestia_weather", marketplace_link.ISSUE)


class FakeRepository:
    def __init__(self, installed: bool, last_version: str, fails: bool = False, domain: str = "hestia_weather") -> None:
        self.data = SimpleNamespace(installed=installed, last_version=last_version, domain=domain)
        self.fails, self.downloads, self.removed = fails, 0, 0

    async def update_repository(self, ignore_issues: bool = False, force: bool = False) -> None:
        self.read_again = getattr(self, "read_again", 0) + 1

    async def uninstall(self) -> None:
        self.removed += 1
        self.data.installed = False

    async def async_install_repository(self) -> None:
        self.downloads += 1
        if self.fails:
            raise RuntimeError("rate limited")
        self.data.installed, self.data.domain = True, "hestia_weather"  # read from the offered version's manifest


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

    def marketplace(self, repository: FakeRepository | None) -> None:
        entry = ConfigEntry(domain="marketplace", title="Marketplace", data={}, options={}, unique_id=None, version=1, minor_version=1,
                            source="user", discovery_keys={}, subentries_data=None)
        repositories = {marketplace_link.REPOSITORY: repository} if repository else {}
        entry.runtime_data = SimpleNamespace(repositories=SimpleNamespace(get_by_full_name=repositories.get))
        self.hass.config_entries._entries[entry.entry_id] = entry

    def issue(self):
        return ir.async_get(self.hass).issues.get(ISSUE)

    async def test_untracked_under_the_new_name_shows_the_repair_and_mends_it(self):
        repository = FakeRepository(installed=False, last_version="v3.1.0")
        self.marketplace(repository)
        marketplace_link.async_check(self.hass)
        issue = self.issue()
        self.assertTrue(issue.is_fixable)
        self.assertEqual(issue.translation_placeholders, {"version": "3.1.0"})
        self.assertTrue(await marketplace_link.async_track_again(self.hass))
        self.assertEqual((repository.read_again, repository.downloads), (1, 1))  # read again, then downloaded
        self.assertIsNone(self.issue())

    async def test_a_former_version_offered_is_never_downloaded(self):
        # While the bridge (2.9.9) is the newest stable, downloading would bring the former folder back.
        repository = FakeRepository(installed=False, last_version="v2.9.9")
        self.marketplace(repository)
        marketplace_link.async_check(self.hass)
        self.assertIsNone(self.issue())
        self.assertTrue(await marketplace_link.async_track_again(self.hass))
        self.assertEqual(repository.downloads, 0)

    async def test_followed_or_no_marketplace_shows_nothing(self):
        marketplace_link.async_check(self.hass)  # no Marketplace (HACS, or installed by hand)
        self.assertIsNone(self.issue())
        self.marketplace(FakeRepository(installed=True, last_version="v3.1.0"))
        marketplace_link.async_check(self.hass)
        self.assertIsNone(self.issue())

    async def test_the_former_folder_downloaded_again_is_removed_first(self):
        # Downloaded by hand while the bridge was the newest version: the Marketplace follows the former folder again.
        repository = FakeRepository(installed=True, last_version="v3.1.0", domain=legacy.DOMAIN)
        self.marketplace(repository)
        marketplace_link.async_check(self.hass)
        self.assertIsNotNone(self.issue())
        self.assertTrue(await marketplace_link.async_track_again(self.hass))
        self.assertEqual((repository.removed, repository.downloads), (1, 1))
        self.assertIsNone(self.issue())

    async def test_the_former_folder_still_running_a_place_is_left_alone(self):
        repository = FakeRepository(installed=True, last_version="v3.1.0", domain=legacy.DOMAIN)
        self.marketplace(repository)
        place = ConfigEntry(domain=legacy.DOMAIN, title="Gardanne", data={}, options={}, unique_id=None, version=1, minor_version=1,
                            source="user", discovery_keys={}, subentries_data=None)
        self.hass.config_entries._entries[place.entry_id] = place
        marketplace_link.async_check(self.hass)
        self.assertIsNone(self.issue())

    async def test_a_failed_download_keeps_the_repair(self):
        repository = FakeRepository(installed=False, last_version="v3.1.0", fails=True)
        self.marketplace(repository)
        marketplace_link.async_check(self.hass)
        self.assertFalse(await marketplace_link.async_track_again(self.hass))
        self.assertIsNotNone(self.issue())

    async def test_changed_insides_show_nothing(self):
        entry = ConfigEntry(domain="marketplace", title="Marketplace", data={}, options={}, unique_id=None, version=1, minor_version=1,
                            source="user", discovery_keys={}, subentries_data=None)
        entry.runtime_data = object()  # no « repositories » any more
        self.hass.config_entries._entries[entry.entry_id] = entry
        marketplace_link.async_check(self.hass)
        self.assertIsNone(self.issue())


if __name__ == "__main__":
    unittest.main()
