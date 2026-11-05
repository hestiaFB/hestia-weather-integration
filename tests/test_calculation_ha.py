"""The calculation runs in a worker thread (docs/PLAN-OPTIMISATION.md, points 6, 7 and 13): one way to compute a view,
the other languages with the French one, never on the event loop, and never mixing their words."""
import tempfile
import threading
import unittest
from unittest.mock import patch

try:
    from homeassistant.config_entries import ConfigEntries, ConfigEntry, ConfigEntryState
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import device_registry as dr, entity_registry as er
except ImportError:
    raise unittest.SkipTest('Home Assistant is not installed')

from custom_components.hestia_weather import coordinator as module
from custom_components.hestia_weather.coordinator import HestiaWeatherCoordinator


class CalculationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.hass = HomeAssistant(self.temp.name)
        self.hass.config.time_zone = 'Europe/Paris'
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        dr.async_setup(self.hass)
        await dr.async_load(self.hass)
        await er.async_load(self.hass)
        self.hass.states.async_set('weather.home', 'rainy', {'temperature': 12, 'friendly_name': 'Maison'})
        self.hass.states.async_set('sensor.pressure', '1012', {'unit_of_measurement': 'hPa'})
        entry = ConfigEntry(domain='hestia_weather', title='Maison', unique_id='maison', version=1, minor_version=1, source='user',
                            data={}, options={'weather_entity': 'weather.home', 'pressure_entity': 'sensor.pressure'},
                            discovery_keys={}, subentries_data=[])
        self.hass.config_entries._entries[entry.entry_id] = entry
        entry._async_set_state(self.hass, ConfigEntryState.SETUP_IN_PROGRESS, None)
        self.coordinator = HestiaWeatherCoordinator(self.hass, entry)

    async def asyncTearDown(self):
        await self.hass.async_stop()
        self.temp.cleanup()

    async def test_computes_in_a_worker_thread(self):
        threads = []
        calculate = module.calculate

        def spy(inputs, language):
            threads.append(threading.current_thread())
            return calculate(inputs, language)
        with patch.object(module, 'calculate', spy):
            snapshot = await self.coordinator._async_update_data()
        self.assertTrue(threads)
        self.assertTrue(all(t is not threading.main_thread() for t in threads))
        self.assertEqual(snapshot.view['location'], 'Maison')
        self.assertEqual(snapshot.views, {})

    async def test_other_languages_come_with_the_french_view_and_go_with_their_cards(self):
        leave = self.coordinator.async_want_language('en-GB')
        snapshot = await self.coordinator._async_update_data()
        self.coordinator.data = snapshot
        english, french = self.coordinator.view_for('en'), self.coordinator.view_for('fr')
        self.assertIsNotNone(english)
        # The same calculation, in two languages: the date says it.
        self.assertNotEqual(english['dateLabel'], french['dateLabel'])
        self.assertIsNone(self.coordinator.view_for('de'))
        leave()
        self.assertEqual((await self.coordinator._async_update_data()).views, {})

    async def test_a_first_card_in_a_new_language_gets_its_view_without_waiting(self):
        self.coordinator.data = await self.coordinator._async_update_data()
        heard = []
        self.coordinator.async_add_listener(lambda: heard.append(self.coordinator.view_for('de')))
        self.coordinator.async_want_language('de')
        await self.hass.async_block_till_done()
        self.assertTrue(heard and heard[-1] is not None)
        self.assertNotEqual(heard[-1]['dateLabel'], self.coordinator.view_for('fr')['dateLabel'])

    async def test_a_card_that_asks_for_it_receives_only_the_parts_that_changed(self):
        from types import SimpleNamespace
        from custom_components.hestia_weather.websocket import ws_subscribe
        entry = self.coordinator.config_entry
        entry.runtime_data = self.coordinator
        entry._async_set_state(self.hass, ConfigEntryState.LOADED, None)
        self.coordinator.data = await self.coordinator._async_update_data()
        connections = {}
        for changes in (True, False):
            sent = []
            connection = SimpleNamespace(subscriptions={}, send_result=lambda *_: None, send_error=lambda *a: sent.append(a),
                                         send_message=sent.append)
            ws_subscribe(self.hass, connection, {'id': 1, 'type': 'hestia_weather/subscribe', 'changes': changes})
            connections[changes] = sent
        self.hass.states.async_set('sensor.pressure', '1003', {'unit_of_measurement': 'hPa'})
        self.coordinator.async_set_updated_data(await self.coordinator._async_update_data())
        first, then = connections[True][0]['event'], connections[True][-1]['event']
        self.assertIn('view', first)
        self.assertNotIn('view', then)
        self.assertIn('pressure', then['changes'])
        self.assertNotIn('location', then['changes'])
        # An older card, without `changes`, keeps receiving the whole view.
        self.assertTrue(all('view' in m['event'] for m in connections[False]))
        self.assertEqual(len(connections[False]), 2)


if __name__ == '__main__':
    unittest.main()
