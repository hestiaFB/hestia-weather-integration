"""The bridge to the Hestia name: it starts the new version once installed next to this one, and has HACS read the
folder again. Skipped without Home Assistant: ../ha-test/venv/bin/python -m unittest tests/test_bridge_ha.py"""
from pathlib import Path
import json
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import shutil

try:
    from homeassistant import loader
    from homeassistant.config_entries import ConfigEntries
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import frame
except ImportError:  # pragma: no cover - the engine's own test run
    raise unittest.SkipTest("Home Assistant is not installed")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
PACKAGE = next(p.name for p in (ROOT / "custom_components").iterdir() if (p / "bridge.py").exists())
bridge = __import__(f"custom_components.{PACKAGE}.bridge", fromlist=["bridge"])


class BridgeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.config = Path(self.directory.name)
        self.hass = HomeAssistant(str(self.config))
        frame.async_setup(self.hass)
        loader.async_setup(self.hass)
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        sys.path.insert(0, str(self.config))

    async def asyncTearDown(self):
        sys.path.remove(str(self.config))
        sys.modules.pop(f"custom_components.{bridge.NEW}", None)
        await self.hass.async_stop()
        self.directory.cleanup()

    def install_new_version(self):
        folder = self.config / "custom_components" / bridge.NEW
        folder.mkdir(parents=True)
        (folder / "manifest.json").write_text(json.dumps({"domain": bridge.NEW, "name": "Hestia", "codeowners": [], "version": "9.0.0",
                                                          "dependencies": []}))
        (folder / "__init__.py").write_text("async def async_setup(hass, config):\n    hass.data['new started'] = True\n    return True\n")

    async def test_nothing_happens_before_the_new_version_is_installed(self):
        self.assertFalse(await bridge.async_start_new(self.hass))
        self.assertNotIn(bridge.NEW, self.hass.config.components)

    async def test_the_new_version_is_started_once_installed(self):
        self.install_new_version()
        self.assertTrue(await bridge.async_start_new(self.hass))
        self.assertTrue(self.hass.data.get("new started"))
        self.assertFalse(await bridge.async_start_new(self.hass))  # already started

    async def test_hacs_reads_the_folder_again(self):
        repository = SimpleNamespace(content=SimpleNamespace(path=SimpleNamespace(remote=f"custom_components/{bridge.DOMAIN}")),
                                     update_repository=AsyncMock())
        self.hass.data["hacs"] = SimpleNamespace(repositories=SimpleNamespace(get_by_full_name=lambda name: repository if name == bridge.REPOSITORY else None))
        self.assertTrue(await bridge.async_refresh_hacs(self.hass))
        self.assertEqual(repository.content.path.remote, "custom_components")
        repository.update_repository.assert_awaited_once_with(ignore_issues=True, force=True)
        repository.content.path.remote = f"custom_components/{bridge.NEW}"  # HACS found the new folder: left alone
        self.assertFalse(await bridge.async_refresh_hacs(self.hass))

    def carried(self, version="3.1.0"):
        """The new version as this one carries it (next_version/)."""
        folder = self.config / "carried"
        shutil.rmtree(folder, ignore_errors=True)
        folder.mkdir()
        (folder / "manifest.json").write_text(json.dumps({"domain": bridge.NEW, "name": "Hestia", "codeowners": [], "version": version,
                                                          "dependencies": []}))
        (folder / "__init__.py").write_text("async def async_setup(hass, config):\n    hass.data['new started'] = True\n    return True\n")
        (folder / "__pycache__").mkdir()
        return patch.object(bridge, "CARRIED", folder)

    def written(self):
        manifest = self.config / "custom_components" / bridge.NEW / "manifest.json"
        return json.loads(manifest.read_text())["version"] if manifest.exists() else None

    async def test_the_carried_version_is_written_then_started_without_the_marketplace(self):
        (self.config / "custom_components").mkdir()
        await loader.async_get_custom_components(self.hass)  # listed at start, without the new version
        with self.carried():
            self.assertTrue(await bridge.async_write_new(self.hass))
        self.assertEqual(self.written(), "3.1.0")
        self.assertFalse((self.config / "custom_components" / bridge.NEW / "__pycache__").exists())
        self.assertEqual(sorted(p.name for p in (self.config / "custom_components").iterdir()), [bridge.NEW])  # nothing left aside
        self.assertTrue(await bridge.async_start_new(self.hass))
        self.assertTrue(self.hass.data.get("new started"))
        with self.carried():
            self.assertFalse(await bridge.async_write_new(self.hass))  # started: never rewritten under it

    async def test_an_older_new_version_is_replaced_a_newer_one_kept(self):
        self.install_new_version()  # 9.0.0, newer: kept
        with self.carried():
            self.assertFalse(await bridge.async_write_new(self.hass))
        self.assertEqual(self.written(), "9.0.0")
        manifest = self.config / "custom_components" / bridge.NEW / "manifest.json"
        manifest.write_text(manifest.read_text().replace("9.0.0", "3.1.0b8"))  # a beta tester's: replaced by the stable
        with self.carried():
            self.assertTrue(await bridge.async_write_new(self.hass))
        self.assertEqual(self.written(), "3.1.0")

    async def test_nothing_carried_nothing_written(self):
        with patch.object(bridge, "CARRIED", self.config / "absent"):
            self.assertFalse(await bridge.async_write_new(self.hass))
        self.assertIsNone(self.written())

    async def test_without_hacs_or_with_another_hacs_nothing_breaks(self):
        self.assertFalse(await bridge.async_refresh_hacs(self.hass))
        self.hass.data["hacs"] = SimpleNamespace()  # its insides changed
        self.assertFalse(await bridge.async_refresh_hacs(self.hass))


if __name__ == "__main__":
    unittest.main()
