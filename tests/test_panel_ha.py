"""The « Météo » tab with a real Home Assistant: the draft follows the assistant's steps and detection. Skipped without Home Assistant
(the engine's tests run without it): ../ha-test/venv/bin/python -m unittest tests/test_panel_ha.py"""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

try:
    from homeassistant.config_entries import ConfigEntries
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er
except ImportError:  # pragma: no cover - the engine's own test run
    raise unittest.SkipTest("Home Assistant is not installed")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from custom_components.hestia_weather import socle  # noqa: E402
from custom_components.hestia_weather import draft as draft_module  # noqa: E402
from custom_components.hestia_weather.draft import Draft  # noqa: E402
from custom_components.hestia_weather.panel import weather_status  # noqa: E402
from custom_components.hestia_weather.engine.families import needs  # noqa: E402
from custom_components.hestia_weather.engine.settings import Settings  # noqa: E402
from custom_components.hestia_weather.engine.i18n import speaking  # noqa: E402

STATION = {
    "sensor.gw2000a_outdoor_temperature": ("14.2", {"unit_of_measurement": "°C", "device_class": "temperature"}),
    "sensor.outdoor_humidity": ("78", {"unit_of_measurement": "%", "device_class": "humidity"}),
    "sensor.gw2000a_rain_rate": ("0", {"unit_of_measurement": "mm/h", "device_class": "precipitation_intensity"}),
    "sensor.gw2000a_wind_gust": ("20", {"unit_of_measurement": "km/h", "device_class": "wind_speed"}),
    "sensor.gw2000a_wind_speed": ("12", {"unit_of_measurement": "km/h", "device_class": "wind_speed"}),
    "sensor.gw2000a_wind_direction": ("270", {"unit_of_measurement": "°", "device_class": "wind_direction"}),
}


class PanelTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.hass = HomeAssistant(self.directory.name)
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        await ar.async_load(self.hass)
        dr.async_setup(self.hass)
        await dr.async_load(self.hass)
        await er.async_load(self.hass)
        self.hass.states.async_set("weather.maison", "sunny", {"friendly_name": "Maison"})
        for entity_id, (value, attributes) in STATION.items():
            self.hass.states.async_set(entity_id, value, attributes)

    async def asyncTearDown(self):
        await self.hass.async_stop()
        self.directory.cleanup()

    async def test_overview_technical_counts_come_from_received_data(self):
        from types import SimpleNamespace
        from datetime import timedelta
        from homeassistant.config_entries import ConfigEntryState
        from homeassistant.util import dt as dt_util
        from custom_components.hestia_weather.panel import facts, place
        now = dt_util.utcnow()
        coordinator = SimpleNamespace(forecast_at=now-timedelta(minutes=4), hours=[1, 2, 3], days=[1, 2],
                                      data=SimpleNamespace(computed=now), history={"sensor.t": [1]},
                                      rain_history={"sensor.t": [1], "sensor.rain": [1]})
        entry = SimpleNamespace(entry_id="technical-test", title="Maison", state=ConfigEntryState.LOADED,
                                options={"weather_entity": "weather.maison"}, runtime_data=coordinator)
        f = facts(self.hass, entry)
        self.assertEqual((f.forecast_hours, f.forecast_days, f.history_sources), (3, 2, 2))
        overview, _ = place(self.hass, entry)
        # One line per extension of the catalogue, then Open-Meteo, the online service (3.1.0b3): counted, never by hand.
        from custom_components.hestia_weather.extensions import CATALOGUE
        self.assertEqual([e["id"] for e in overview["extensions"]], [c[0] for c in CATALOGUE] + ["open_meteo"])
        # Saved choices only; Open-Meteo is asked for the pressure unless turned off, so it is on by default.
        self.assertFalse(any(e["configured"] for e in overview["extensions"] if not e.get("online")))
        self.assertEqual(overview["health"]["technical"]["forecast"]["received"], "il y a 4 min")
        coordinator.forecast_at = None
        pending = facts(self.hass, entry)
        self.assertIsNone(pending.forecast_hours)  # retained arrays are not a received forecast after startup

    async def test_meteo_france_installation_and_saved_sources_are_distinct(self):
        from custom_components.hestia_weather.extensions import inventory
        registry = er.async_get(self.hass)
        def meteo(options):
            return next(e for e in inventory(self.hass, options) if e["id"] == "meteo_france")
        self.assertFalse(meteo({})["installed"])
        weather = registry.async_get_or_create("weather", "meteo_france", "forecast")
        other = registry.async_get_or_create("weather", "other_weather", "forecast")
        vigilance = registry.async_get_or_create("sensor", "meteo_france", "vigilance")
        self.assertTrue(meteo({})["installed"])
        self.assertFalse(meteo({})["configured"])
        self.assertTrue(meteo({"weather_entity": weather.entity_id})["configured"])
        self.assertFalse(meteo({"weather_entity": other.entity_id})["configured"])
        self.assertTrue(meteo({"weather_entity": other.entity_id, "vigilance_entity": vigilance.entity_id})["configured"])
        self.assertEqual(meteo({})["stage"], 0)
        self.assertEqual(meteo({})["url"], "https://www.home-assistant.io/integrations/meteo_france/")
        self.assertNotIn("HACS", meteo({})["install"])

    async def test_extensions_distinguish_saved_selection_from_detection(self):
        from types import SimpleNamespace
        from custom_components.hestia_weather.extensions import inventory
        registry = er.async_get(self.hass)
        e = registry.async_get_or_create("sensor", "blitzortung", "home-distance", translation_key="distance")
        self.hass.states.async_set(e.entity_id, "unknown", {"unit_of_measurement": "km"})
        before = {x["id"]: x for x in inventory(self.hass, {})}
        self.assertTrue(before["blitzortung"]["installed"])
        self.assertFalse(before["blitzortung"]["configured"])
        self.assertFalse(before["vigieau"]["installed"])
        saved = {"weather_entity": "weather.maison", "lightning_entity": e.entity_id}
        after = {x["id"]: x for x in inventory(self.hass, saved)}
        self.assertTrue(after["blitzortung"]["configured"])
        # Draft.start proposes the detected sensor, but the extension badge still describes the saved configuration.
        entry = SimpleNamespace(entry_id="extension-test", options={"weather_entity": "weather.maison"})
        proposed = {x["id"]: x for x in Draft.start(self.hass, entry).view()["extensions"]}
        self.assertFalse(proposed["blitzortung"]["configured"])

    async def test_atmo_reports_air_and_pollen_selection_independently(self):
        from custom_components.hestia_weather.extensions import inventory
        extensions = inventory(self.hass, {"air_source": "atmo", "atmo_air_entity": "sensor.air", "pollen_source": "none"})
        atmo = next(x for x in extensions if x["id"] == "atmo")
        self.assertTrue(atmo["air_configured"])
        self.assertFalse(atmo["pollen_configured"])

    async def test_only_loaded_integrations_are_proposed_to_ask_for(self):
        from custom_components.hestia_weather.extensions import others
        self.hass.config.components.add("vigicrues")
        self.assertEqual([o["key"] for o in others(self.hass)], ["vigicrues"])
        self.assertTrue(others(self.hass)[0]["use"])

    async def test_hacs_download_counts_as_installed_before_an_integration_is_added(self):
        from types import SimpleNamespace
        from custom_components.hestia_weather.extensions import inventory
        self.hass.data["hacs"] = SimpleNamespace(repositories=SimpleNamespace(get_by_full_name=lambda repo:
            SimpleNamespace(data=SimpleNamespace(installed=True)) if repo == "kamaradclimber/vigieau" else None))
        extensions = {x["id"]: x for x in inventory(self.hass, {})}
        self.assertTrue(extensions["vigieau"]["installed"])
        self.assertFalse(extensions["vigieau"]["configured"])
        self.assertIn("Blitzortung.org Lightning Detector", extensions["blitzortung"]["install"])

    async def test_the_labels_are_read_outside_the_event_loop(self):
        # Home Assistant warns of a blocking call when fr.json is read in the event loop (« Detected blocking call to read_text »).
        draft_module._read.cache_clear()
        await draft_module.async_load_labels(self.hass)
        with mock.patch.object(Path, "read_text", side_effect=AssertionError("fichier lu dans la boucle")), \
                mock.patch("builtins.open", side_effect=AssertionError("fichier lu dans la boucle")):
            view = Draft.start(self.hass, None).view()
            self.assertEqual(draft_module.entity_label("feels_like")[0], "Ressenti")
            # English, for a panel read in English, is read beforehand too.
            with speaking("en"):
                self.assertEqual(draft_module.entity_label("feels_like")[0], "Feels like")
        self.assertIn("Vigilance officielle : il faut la vigilance officielle", view["needs"])

    async def test_a_new_place_starts_from_what_home_assistant_has(self):
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.sources["weather_entity"], "weather.maison")
        self.assertEqual(draft.sources["temperature_entity"], "sensor.gw2000a_outdoor_temperature")
        self.assertEqual(draft.sources["wind_gust_entity"], "sensor.gw2000a_wind_gust")
        self.assertEqual(draft.sources["families"], ["maintenant", "alertes", "prochaines_heures"])
        view = draft.view()
        self.assertEqual(view["title"], "Maison")
        self.assertEqual(view["station"]["model"], "gw2000a")
        # « Alertes » is chosen and there is no Météo-France vigilance: said before saving.
        self.assertIn("Vigilance officielle : il faut la vigilance officielle", view["needs"])
        self.assertEqual(view["pollen"]["value"], "none")

    async def test_no_station_then_a_station_again_proposes_its_sensors(self):
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.change({"op": "station", "value": "none"}), "")
        self.assertEqual(draft.sources["temperature_entity"], "")
        self.assertEqual(draft.view()["station"]["model"], "none")
        draft.change({"op": "station", "value": "gw2000a"})
        self.assertEqual(draft.sources["temperature_entity"], "sensor.gw2000a_outdoor_temperature")

    async def test_a_mean_wind_chosen_for_the_gusts_is_flagged_with_the_right_one(self):
        draft = Draft.start(self.hass, None)
        draft.change({"op": "set", "key": "wind_gust_entity", "value": "sensor.gw2000a_wind_speed"})
        gust = next(f for g in draft.view()["station"]["groups"] for f in g["fields"] if f["key"] == "wind_gust_entity")
        self.assertIn("ne semble pas donner", gust["warning"])
        self.assertEqual(gust["better"]["id"], "sensor.gw2000a_wind_gust")

    async def test_a_sensor_that_does_not_answer_is_said(self):
        self.hass.states.async_set("sensor.gw2000a_rain_rate", "unavailable", STATION["sensor.gw2000a_rain_rate"][1])
        rain = next(f for g in Draft.start(self.hass, None).view()["station"]["groups"] for f in g["fields"] if f["key"] == "rain_rate_entity")
        self.assertEqual(rain["warning"], "Ce capteur ne répond pas pour l’instant.")

    async def test_a_source_not_installed_is_refused_and_unknown_changes_too(self):
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.change({"op": "pollen", "value": "polleninformation"}), "Polleninformation n’est pas installée.")
        self.assertEqual(draft.change({"op": "set", "key": "families", "value": []}), "Changement inconnu.")
        self.assertEqual(draft.change({"op": "station", "value": "ws91"}), "Modèle de station inconnu.")

    def swiss_pollen(self, station="BAS", plant="beech"):
        registry = er.async_get(self.hass)
        level = registry.async_get_or_create("sensor", "swiss_pollen", f"{station}.{plant}.level")
        health = registry.async_get_or_create("sensor", "swiss_pollen", f"{station}.{plant}.station_state")
        self.hass.states.async_set(level.entity_id, "strong")
        self.hass.states.async_set(health.entity_id, "online")
        return level.entity_id, health.entity_id

    async def test_swiss_pollen_panel_selects_a_station_then_its_species(self):
        bas, health = self.swiss_pollen()
        birch, _ = self.swiss_pollen(plant="birch")
        bern, _ = self.swiss_pollen(station="BER")
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.pollen_choice(), "swiss_pollen")
        view = draft.view()["pollen"]
        self.assertEqual(view["station"], "")
        self.assertEqual(view["species"], [])
        self.assertEqual([p["value"] for p in view["stations"]], ["BAS", "BER"])
        self.assertEqual(draft.change({"op": "pollen_station", "value": "BAS"}), "")
        self.assertEqual({p["id"] for p in draft.sources["pollens"]}, {bas, birch})
        self.assertIn("station", draft.change({"op": "pollens", "value": [bern]}))
        self.assertEqual(draft.change({"op": "pollens", "value": [bas]}), "")
        self.assertEqual(draft.sources["pollens"][0]["station_state_entity"], health)
        self.hass.states.async_set(health, "offline")
        item = next(p for p in draft.view()["pollen"]["species"] if p["id"] == bas)
        self.assertFalse(item["available"])
        self.assertEqual(draft.change({"op": "pollen_station", "value": "BER"}), "")
        self.assertEqual([p["id"] for p in draft.sources["pollens"]], [bern])

    async def test_swiss_pollen_single_station_is_proposed_and_settings_keep_diagnostics(self):
        from custom_components.hestia_weather.engine.settings import Settings
        bas, health = self.swiss_pollen()
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.view()["pollen"]["station"], "BAS")
        self.assertEqual(draft.sources["pollens"][0]["nom"], "Hêtre")
        settings = Settings.from_options(draft.sources)
        self.assertIn(health, settings.entity_ids())
        self.assertEqual(draft.change({"op": "pollen", "value": "none"}), "")
        self.assertEqual(draft.view()["pollen"]["value"], "none")

    async def test_swiss_pollen_in_the_existing_configuration_assistant(self):
        from custom_components.hestia_weather.config_flow import HestiaWeatherConfigFlow
        bas, health = self.swiss_pollen()
        self.swiss_pollen(station="BER")
        flow = HestiaWeatherConfigFlow()
        flow.hass = self.hass
        flow.sources = {"weather_entity": "weather.maison"}
        form = await flow.async_step_pollen({"pollen_source": "swiss_pollen"})
        self.assertEqual(form["step_id"], "pollen_station")
        form = await flow.async_step_pollen_station({"pollen_station": "BAS"})
        self.assertEqual(form["step_id"], "pollen_sensors")
        form = await flow.async_step_pollen_sensors({"pollens": [bas]})
        self.assertEqual(form["step_id"], "families")
        self.assertEqual(flow.sources["pollens"][0]["station_state_entity"], health)

    async def test_swissweather_is_proposed_in_the_panel_and_the_assistant(self):
        from custom_components.hestia_weather.config_flow import HestiaWeatherConfigFlow
        registry = er.async_get(self.hass)
        warning = registry.async_get_or_create("sensor", "swissweather", "2829.warnings")
        self.hass.states.async_set(warning.entity_id, "0", {"warning_types": [], "warning_levels_numeric": []})
        draft = Draft.start(self.hass, None)
        field = next(f for f in draft.view()["prevision"]["fields"] if f["key"] == "vigilance_entity")
        self.assertIn(warning.entity_id, [e["id"] for e in field["options"]])
        flow = HestiaWeatherConfigFlow()
        flow.hass = self.hass
        flow.sources = {"weather_entity": "weather.maison"}
        form = await flow.async_step_weather()
        self.assertEqual(form["step_id"], "weather")
        self.assertEqual(draft.sources["vigilance_entity"], warning.entity_id)

    def kleenex_pollen(self, place="kleenex_home", title="Gardanne"):
        from homeassistant.config_entries import ConfigEntry
        from homeassistant.util import dt as dt_util
        from zoneinfo import ZoneInfo
        registry = er.async_get(self.hass)
        entry = ConfigEntry(version=1, minor_version=1, domain="kleenex_pollenradar", title=title, data={}, source="user", options={},
                            unique_id=place, discovery_keys={}, subentries_data=None)
        self.hass.config_entries._entries[entry.entry_id] = entry
        device = dr.async_get(self.hass).async_get_or_create(identifiers={("kleenex_pollenradar", place)},
                                                           config_entry_id=entry.entry_id, name=f"Kleenex Pollen Radar ({title})")
        result = {}
        now = dt_util.utcnow()
        for key, value, attrs in [("trees", "120", {"level": "very-high"}), ("grass", "0", {"level": "low"}),
                                  ("last_updated", now.isoformat(), {}),
                                  ("date", now.astimezone(ZoneInfo(self.hass.config.time_zone)).date().isoformat(), {})]:
            entity = registry.async_get_or_create("sensor", "kleenex_pollenradar", f"{place}-Kleenex Pollen Radar{key}", device_id=device.id)
            self.hass.states.async_set(entity.entity_id, value, attrs)
            result[key] = entity.entity_id
        return result

    async def test_kleenex_panel_displays_levels_and_coverage_and_saves_the_diagnostics(self):
        ids = self.kleenex_pollen()
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.pollen_choice(), "kleenex_pollenradar")
        view = draft.view()["pollen"]
        source = next(s for s in view["sources"] if s["value"] == "kleenex_pollenradar")
        self.assertIn("France", source["label"])
        self.assertIn("États-Unis", source["label"])
        self.assertEqual(view["stations"], [{"value": "kleenex_home", "label": "Kleenex Pollen Radar (Gardanne)"}])
        tree = next(s for s in view["species"] if s["id"] == ids["trees"])
        self.assertEqual(tree["state"], "Très élevé")
        self.assertTrue(tree["available"])
        self.assertEqual(draft.sources["pollens"][0]["updated_entity"], ids["last_updated"])
        self.hass.states.async_set(ids["last_updated"], "unknown")
        self.assertFalse(draft.view()["pollen"]["species"][0]["available"])

    async def test_kleenex_multiple_places_do_not_get_mixed(self):
        home = self.kleenex_pollen()
        other = self.kleenex_pollen("kleenex_other", "Paris")
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.view()["pollen"]["species"], [])
        self.assertEqual(draft.change({"op": "pollen_station", "value": "kleenex_other"}), "")
        self.assertEqual({p["id"] for p in draft.sources["pollens"]}, {other["trees"], other["grass"]})
        self.assertTrue(draft.change({"op": "pollens", "value": [home["trees"]]}))

    async def test_kleenex_is_available_in_the_existing_assistant(self):
        from custom_components.hestia_weather.config_flow import HestiaWeatherConfigFlow
        ids = self.kleenex_pollen()
        flow = HestiaWeatherConfigFlow()
        flow.hass = self.hass
        flow.sources = {"weather_entity": "weather.maison"}
        result = await flow.async_step_pollen({"pollen_source": "kleenex_pollenradar"})
        self.assertEqual(result["step_id"], "pollen_sensors")
        result = await flow.async_step_pollen_sensors({"pollens": [ids["trees"]]})
        self.assertEqual(result["step_id"], "families")
        self.assertEqual(flow.sources["pollens"][0]["updated_entity"], ids["last_updated"])

    async def test_the_air_is_chosen_by_source_like_the_pollens(self):
        draft = Draft.start(self.hass, None)
        air = draft.view()["air"]
        self.assertEqual([s["value"] for s in air["sources"]], ["atmo", "waqi", "none"])
        self.assertFalse(air["sources"][0]["available"])
        self.assertEqual(air["value"], "none")
        self.assertEqual(draft.change({"op": "air", "value": "atmo"}), "Atmo France n’est pas installée.")
        self.assertEqual(draft.change({"op": "air", "value": "lyon"}), "Source de qualité de l’air inconnue.")
        self.assertEqual(draft.change({"op": "air", "value": "none"}), "")
        self.assertEqual(draft.sources["air_source"], "none")

    async def test_atmo_zones_are_independent_and_old_settings_are_preserved(self):
        air_zone, pollen_zone = "zone:epci:cc sud retz atlantique", "zone:commune:lege"
        for entity, name, zone, kind in (
            ("sensor.atmo_air", "Qualité globale", "CC Sud Retz Atlantique", "EPCI"),
            ("sensor.atmo_pollen", "Qualité globale Pollen", "Legé", "commune"),
        ):
            self.hass.states.async_set(entity, "2", {"friendly_name": name, "attribution": "Atmo France",
                                                   "Nom de la zone": zone, "Type de zone": kind})
        draft = Draft(self.hass, {"weather_entity": "weather.maison", "air_source": "atmo",
                                 "pollen_source": "atmo", "atmo_area": pollen_zone})
        self.assertEqual(draft.change({"op": "air", "value": "atmo", "area": air_zone}), "")
        self.assertEqual(draft.view()["pollen"]["area"], pollen_zone)
        self.assertEqual(draft.sources["atmo_air_entity"], "sensor.atmo_air")
        self.assertEqual(draft.sources["atmo_pollen_entity"], "sensor.atmo_pollen")
        self.assertNotIn("qualite_air", needs(Settings.from_options(draft.sources)))
        self.assertNotIn("pollens", needs(Settings.from_options(draft.sources)))
        draft.change({"op": "air", "value": "none"})
        self.assertEqual(draft.sources["atmo_pollen_entity"], "sensor.atmo_pollen")
        draft.change({"op": "air", "value": "atmo", "area": air_zone})
        draft.change({"op": "pollen", "value": "none"})
        self.assertEqual(draft.sources["atmo_air_entity"], "sensor.atmo_air")
        draft.change({"op": "pollen", "value": "atmo", "area": pollen_zone})
        self.assertEqual(draft.view()["air"]["area"], air_zone)
        self.assertEqual(draft.view()["summary"]["pollen"], "Atmo France · Legé")
        self.assertEqual(draft.view()["summary"]["air"], "Atmo France · CC Sud Retz Atlantique")

    async def test_assistant_always_offers_a_separate_pollen_zone(self):
        from custom_components.hestia_weather.config_flow import HestiaWeatherConfigFlow, _clean
        for entity, name, zone, kind in (
            ("sensor.atmo_air", "Qualité globale", "CC Sud Retz Atlantique", "EPCI"),
            ("sensor.atmo_pollen", "Qualité globale Pollen", "Legé", "commune"),
        ):
            self.hass.states.async_set(entity, "2", {"friendly_name": name, "attribution": "Atmo France",
                                                   "Nom de la zone": zone, "Type de zone": kind})
        flow = HestiaWeatherConfigFlow()
        flow.hass = self.hass
        flow.sources = {"weather_entity": "weather.maison", "atmo_area": "zone:epci:cc sud retz atlantique",
                        "air_source": "atmo"}
        result = await flow.async_step_pollen({"pollen_source": "atmo"})
        self.assertEqual(result["step_id"], "pollen_area")
        result = await flow.async_step_pollen_area({"atmo_area": "zone:commune:lege"})
        self.assertEqual(result["step_id"], "families")
        self.assertEqual(flow.sources["atmo_air_entity"], "sensor.atmo_air")
        self.assertEqual(flow.sources["atmo_pollen_entity"], "sensor.atmo_pollen")
        saved = Settings.from_options(_clean(flow.sources))
        self.assertEqual(saved.atmo_pollen_area, "zone:commune:lege")
        self.assertEqual(saved.atmo_area, "zone:epci:cc sud retz atlantique")

    async def test_saving_without_a_weather_service_is_refused(self):
        with self.assertRaises(ValueError):
            await Draft(self.hass, {"weather_entity": ""}).save(None)

    async def test_a_place_is_removed_from_the_panel_and_only_a_place(self):
        from homeassistant.config_entries import ConfigEntry
        from custom_components.hestia_weather.panel import ws_remove
        place = ConfigEntry(domain="hestia_weather", title="Maison", unique_id="maison", version=1, minor_version=1, source="user",
                            data={}, options={"weather_entity": "weather.maison"}, discovery_keys={}, subentries_data=[])
        other = ConfigEntry(domain="hestia_comfort", title="Salon", unique_id="salon", version=1, minor_version=1, source="user",
                            data={}, options={}, discovery_keys={}, subentries_data=[])
        for entry in (place, other):
            self.hass.config_entries._entries[entry.entry_id] = entry
        connection = mock.Mock()
        handler = ws_remove
        while hasattr(handler, "__wrapped__"):  # the command itself, under the admin check and the async wrapper
            handler = handler.__wrapped__
        with mock.patch.object(self.hass.config_entries, "async_remove", mock.AsyncMock()) as remove:
            await handler(self.hass, connection, {"id": 1, "entry_id": other.entry_id})
            connection.send_error.assert_called_once()
            await handler(self.hass, connection, {"id": 2, "entry_id": place.entry_id})
        remove.assert_awaited_once_with(place.entry_id)
        connection.send_result.assert_called_once_with(2, {"removed": place.entry_id})

    async def test_home_page_without_a_place_asks_for_one(self):
        status = await weather_status(self.hass)
        self.assertEqual(status["level"], "action")
        self.assertIn("onglet Météo", status["details"][0])

    async def test_optional_station_sources_do_not_raise_alerts_on_either_home_page(self):
        from types import SimpleNamespace
        from unittest.mock import patch
        from homeassistant.config_entries import ConfigEntryState
        from custom_components.hestia_weather.engine.health import Facts
        from custom_components.hestia_weather.engine.home import status
        from custom_components.hestia_weather.engine.families import STATION_DEPENDENT
        from custom_components.hestia_weather.panel import place
        f = Facts(title='Gardanne', weather='Météo-France', forecast_age=5,
                  entities=tuple((k, k, 'Maintenant', True, False) for k in STATION_DEPENDENT),
                  needs={k: 'un capteur facultatif' for k in STATION_DEPENDENT})
        with patch('custom_components.hestia_weather.panel.facts', return_value=f):
            info, overview = place(self.hass, SimpleNamespace(entry_id='test', title='Gardanne', state=ConfigEntryState.LOADED, options={}))
        self.assertEqual(info['health']['level'], 'ok')
        self.assertEqual(status([overview])['level'], 'ok')
        self.assertEqual(overview.needs, [])

    async def test_placing_the_house_answers_the_wind_too(self):
        draft = Draft(self.hass, {"weather_entity": "weather.maison", "wind_speed_entity": "sensor.v"})
        place = lambda key, value: draft.change({"op": "place", "key": key, "value": value})
        self.assertEqual(place("wind_shelter", ["sw", "w"]), "")
        # The house south-west of the station: it leaves the list, the hedge stays.
        self.assertEqual(place("station_side", "ne"), "")
        self.assertEqual(draft.sources["wind_shelter"], ["w"])
        place("station_side", "open")
        self.assertEqual(draft.sources["wind_shelter"], ["w"])
        place("station_side", "")
        self.assertEqual(draft.sources["wind_shelter"], "")
        place("station_side", "s")
        self.assertEqual(draft.sources["wind_shelter"], [])
        # Without an anemometer, the wind is not asked: nothing written for it.
        calm = Draft(self.hass, {"weather_entity": "weather.maison"})
        calm.change({"op": "place", "key": "station_side", "value": "ne"})
        self.assertNotIn("wind_shelter", calm.sources)

    async def test_entity_settings_describe_station_sources_as_optional(self):
        from types import SimpleNamespace
        from unittest.mock import patch
        from custom_components.hestia_weather.engine.families import STATION_DEPENDENT
        draft = Draft(self.hass, {'weather_entity':'weather.maison'}, SimpleNamespace())
        with patch('custom_components.hestia_weather.draft.entity_keys', return_value={k:True for k in STATION_DEPENDENT}):
            entities = [e for f in draft.entities()['families'] for e in f['entities']]
            self.assertEqual(draft.needs(), [])
        self.assertTrue(entities)
        self.assertTrue(all(e['optional'] and e['need'].startswith('Source facultative') for e in entities))

    async def test_weather_joins_confort_in_the_same_panel(self):
        async def ok(hass):
            return {"level": "ok", "summary": "", "details": [], "links": []}
        base = {"version": "1", "icon": "mdi:x", "module_url": "/x.js", "status": ok}
        await socle.async_register_brick(self.hass, {**base, "domain": "hestia_comfort", "name": "Hestia Confort", "slug": "confort",
                                                     "element": "hestia-comfort-setup", "legacy_path": None}, "/c/hestia-socle.js")
        await socle.async_register_brick(self.hass, {**base, "domain": "hestia_weather", "name": "Hestia Weather", "slug": "meteo",
                                                     "element": "hestia-weather-setup", "status": weather_status, "legacy_path": ""}, "/w/hestia-socle.js")
        overview = await socle.async_overview(self.hass)
        self.assertEqual([b["slug"] for b in overview["bricks"]], ["meteo", "confort"])
        self.assertEqual(overview["others"], [])
        self.assertEqual(overview["bricks"][0]["status"]["level"], "action")


if __name__ == "__main__":
    unittest.main()


class NetatmoTests(unittest.IsolatedAsyncioTestCase):
    """A Netatmo station as its integration registers it: one device per module, linked to the station, some sensors disabled."""

    async def asyncSetUp(self):
        from homeassistant.config_entries import ConfigEntry
        self.directory = tempfile.TemporaryDirectory()
        self.hass = HomeAssistant(self.directory.name)
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        await ar.async_load(self.hass)
        dr.async_setup(self.hass)
        await dr.async_load(self.hass)
        await er.async_load(self.hass)
        netatmo = ConfigEntry(version=1, minor_version=1, domain="netatmo", title="Netatmo", data={}, source="user", options={},
                              unique_id="netatmo", discovery_keys={}, subentries_data=None)
        self.hass.config_entries._entries[netatmo.entry_id] = netatmo
        devices, entities = dr.async_get(self.hass), er.async_get(self.hass)

        def device(module: str, name: str, model: str, via=None):
            # The parent is set afterwards: creating a device with `via_device_id` needs Home Assistant 2026.10.
            made = devices.async_get_or_create(config_entry_id=netatmo.entry_id, identifiers={("netatmo", module)}, manufacturer="Netatmo",
                                               model=model, name=name)
            return devices.async_update_device(made.id, via_device_id=via).id if via else made.id
        home = device("home", "Maison", "Home")
        main = device("70:ee:50:00:00:01", "Intérieur", "Smart Home Weather station", home)
        modules = {"out": device("02:00:00:00:00:02", "Jardin", "Smart Outdoor Module", main),
                   "rain": device("05:00:00:00:00:03", "Pluviomètre", "Smart Rain Gauge", main),
                   "wind": device("06:00:00:00:00:04", "Anémomètre", "Smart Anemometer", main), "main": main}
        self.main, self.home = main, home
        C, MM = {"unit_of_measurement": "°C", "device_class": "temperature"}, {"unit_of_measurement": "mm", "device_class": "precipitation"}
        for object_id, module, key, value, attributes, disabled in (
                ("interieur_temperature", "main", "temperature", "21", C, False),
                ("interieur_pression_atmospherique", "main", "pressure", "1016", {"unit_of_measurement": "mbar", "device_class": "atmospheric_pressure"}, False),
                ("jardin_temperature", "out", "temperature", "9.4", C, False),
                ("jardin_humidite", "out", "humidity", "88", {"unit_of_measurement": "%", "device_class": "humidity"}, False),
                ("pluviometre_precipitations_aujourd_hui", "rain", "sum_rain_24", "3.1", {**MM, "state_class": "total_increasing"}, False),
                ("pluviometre_precipitations_derniere_heure", "rain", "sum_rain_1", "0.4", {**MM, "state_class": "total"}, True),
                ("anemometre_vitesse_du_vent", "wind", "windstrength", "14", {"unit_of_measurement": "km/h", "device_class": "wind_speed"}, False),
                ("anemometre_force_des_rafales", "wind", "guststrength", "31", {"unit_of_measurement": "km/h", "device_class": "wind_speed"}, True)):
            mac = next(i[1] for i in devices.async_get(modules[module]).identifiers)
            entry = entities.async_get_or_create("sensor", "netatmo", f"{mac}-{key}", suggested_object_id=object_id, config_entry=netatmo,
                                                 device_id=modules[module], disabled_by=er.RegistryEntryDisabler.INTEGRATION if disabled else None)
            if not disabled:
                self.hass.states.async_set(entry.entity_id, value, attributes)
        self.hass.states.async_set("weather.maison", "rainy", {"friendly_name": "Maison"})

    async def asyncTearDown(self):
        await self.hass.async_stop()
        self.directory.cleanup()

    async def test_a_new_place_proposes_the_netatmo_station_and_says_what_to_enable(self):
        draft = Draft.start(self.hass, None)
        self.assertEqual(draft.sources["station_model"], "netatmo")
        self.assertEqual((draft.sources["temperature_entity"], draft.sources["pressure_entity"], draft.sources["daily_rain_entity"]),
                         ("sensor.jardin_temperature", "sensor.interieur_pression_atmospherique", "sensor.pluviometre_precipitations_aujourd_hui"))
        station = draft.view()["station"]
        self.assertEqual((station["model"], station["profile"], station["device"]), ("netatmo", "Netatmo", self.main))
        self.assertEqual([d["label"] for d in station["devices"]], ["Aucun appareil — capteurs séparés", "Intérieur"])
        fields = {f["key"]: f for g in station["groups"] for f in g["fields"]}
        self.assertIn("sensor.anemometre_force_des_rafales", fields["wind_gust_entity"]["warning"])
        self.assertIn("Anémomètre", fields["wind_gust_entity"]["warning"])
        self.assertNotIn("solar_radiation_entity", fields)

    async def test_choosing_netatmo_after_no_station_fills_the_station_again(self):
        draft = Draft.start(self.hass, None)
        draft.change({"op": "station", "value": "none"})
        self.assertEqual(draft.change({"op": "station", "value": "netatmo"}), "")
        self.assertEqual(draft.sources["humidity_entity"], "sensor.jardin_humidite")
        self.assertEqual(draft.sources["wind_speed_entity"], "sensor.anemometre_vitesse_du_vent")


class OfficialLinkTests(unittest.IsolatedAsyncioTestCase):
    asyncSetUp = PanelTests.asyncSetUp
    asyncTearDown = PanelTests.asyncTearDown

    async def test_hestia_confort_link_is_read_and_set_through_its_interface(self):
        """One link for both bricks: Hestia Confort keeps it, Weather's switch changes it there and reads it back."""
        from custom_components.hestia_weather.extensions import official, set_official
        self.assertEqual(official(self.hass, "nw1")[0]["installed"], False)
        class Comfort:
            version = 1
            chosen = None
            def weather(self): return self.chosen
            async def set_weather(self, entry_id): self.chosen = entry_id; return entry_id
        comfort = self.hass.data["hestia_comfort_api"] = Comfort()
        first = official(self.hass, "nw1")[0]
        self.assertEqual((first["installed"], first["linked"], first["switchable"]), (True, False, True))
        await set_official(self.hass, "hestia_comfort", "nw1", True)
        self.assertTrue(official(self.hass, "nw1")[0]["linked"])
        await set_official(self.hass, "hestia_comfort", "nw2", False)  # another place cannot cut this one's link
        self.assertEqual(comfort.chosen, "nw1")
        comfort.chosen = None  # turned off in Confort's own settings
        self.assertFalse(official(self.hass, "nw1")[0]["linked"])
        del Comfort.set_weather  # an older Hestia Confort: shown, but not switchable from here
        self.assertFalse(official(self.hass, "nw1")[0]["switchable"])
        with self.assertRaises(ValueError):
            await set_official(self.hass, "hestia_comfort", "nw1", True)
