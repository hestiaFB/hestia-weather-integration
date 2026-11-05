"""The interface published for the other Hestia bricks: places, station by role, hourly forecast."""
from datetime import datetime, timezone
from pathlib import Path
import sys
from types import SimpleNamespace

import importlib.util

from engine.forecast import Hour
from engine.settings import Settings

_spec = importlib.util.spec_from_file_location("hestia_weather_api", Path(__file__).resolve().parents[1] / "custom_components/hestia_weather/api.py")
_api = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_api)
API_VERSION, HestiaWeatherApi = _api.API_VERSION, _api.HestiaWeatherApi
LOADED, NOT_LOADED = SimpleNamespace(value="loaded"), SimpleNamespace(value="not_loaded")


def entry(entry_id, title, settings, hours=(), state=LOADED):
    listeners = []
    runtime = SimpleNamespace(settings=settings, hours=list(hours),
                              async_add_listener=lambda cb: (listeners.append(cb), lambda: listeners.remove(cb))[1])
    return SimpleNamespace(entry_id=entry_id, title=title, state=state, runtime_data=runtime, listeners=listeners)


def hass_with(*entries):
    return SimpleNamespace(config_entries=SimpleNamespace(async_entries=lambda domain: list(entries)))


def test_station_is_published_by_role_without_empty_roles():
    s = Settings(weather_entity="weather.home", temperature_entity="sensor.out_t", humidity_entity="sensor.out_h", wind_bearing_entity="sensor.wind_dir")
    api = HestiaWeatherApi(hass_with(entry("e1", "Gardanne", s)))
    assert api.version == API_VERSION == 1
    assert api.station() == {"entry_id": "e1", "title": "Gardanne",
                             "sensors": {"temperature": "sensor.out_t", "humidity": "sensor.out_h", "wind_bearing": "sensor.wind_dir"}}


def test_several_places_need_an_explicit_choice_and_unloaded_ones_are_ignored():
    a, b = entry("a", "Maison", Settings(weather_entity="weather.home")), entry("b", "Chalet", Settings(weather_entity="weather.home"))
    off = entry("c", "Ancien", Settings(weather_entity="weather.home"), state=NOT_LOADED)
    api = HestiaWeatherApi(hass_with(a, b, off))
    assert api.places() == [{"entry_id": "a", "title": "Maison"}, {"entry_id": "b", "title": "Chalet"}]
    assert api.station() is None
    assert api.station("b")["title"] == "Chalet"
    assert api.station("c") is None


def test_hourly_forecast_carries_wind_direction_and_skips_undated_hours():
    t = datetime(2026, 10, 14, 21, tzinfo=timezone.utc)
    hours = [Hour(time=t, temperature=18.2, humidity=70, precipitation=0, wind_speed=12, wind_gust=25, wind_bearing=270, condition="clear-night", cloud_coverage=12), Hour()]
    api = HestiaWeatherApi(hass_with(entry("e1", "Gardanne", Settings(weather_entity="weather.home"), hours)))
    assert api.hourly() == [{"time": "2026-10-14T21:00:00+00:00", "temperature": 18.2, "humidity": 70, "precipitation": 0,
                             "wind_speed": 12, "wind_gust": 25, "wind_bearing": 270, "condition": "clear-night", "cloud_coverage": 12}]


def test_listeners_follow_the_place_and_can_be_removed():
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home"))
    api = HestiaWeatherApi(hass_with(e))
    remove = api.add_listener(None, lambda: None)
    assert len(e.listeners) == 1
    remove()
    assert e.listeners == []
    assert api.add_listener("absent", lambda: None)() is None


def test_a_brick_that_says_who_it_is_shows_linked_to_its_place_until_it_stops():
    a, b = entry("a", "Maison", Settings(weather_entity="weather.home")), entry("b", "Chalet", Settings(weather_entity="weather.home"))
    api = HestiaWeatherApi(hass_with(a, b))
    stop = api.add_listener("a", lambda: None, brick="hestia_comfort")
    other = api.add_listener("a", lambda: None)
    assert api.linked("a") == {"hestia_comfort": 1, "": 1} and api.linked("b") == {}
    stop(); stop()  # a second stop changes nothing
    assert api.linked("a") == {"": 1} and a.listeners != []
    other()
    assert api.linked("a") == {} and a.listeners == []


def test_air_follows_the_chosen_source_on_atmo_scale():
    from engine.catalogue import Item
    at = datetime(2026, 10, 18, 13, tzinfo=timezone.utc)
    waqi = Settings(weather_entity="weather.home", air_source="waqi", waqi={"waqi_air_entity": "sensor.gardanne_aqi"},
                    atmo={"atmo_air_entity": "sensor.atmo_qualite_globale"})
    e = entry("e1", "Gardanne", waqi)
    e.runtime_data.data = SimpleNamespace(catalogue={"qualite_air": Item(2, "Moyen (2/6)", "waqi", extra={"libelle": "Moyen"})}, computed=at)
    assert HestiaWeatherApi(hass_with(e)).air() == {"entry_id": "e1", "source": "waqi", "provider": "WAQI", "entity_id": "sensor.gardanne_aqi",
                                                   "index": 2, "label": "Moyen", "at": "2026-10-18T13:00:00+00:00"}
    e.runtime_data.data = SimpleNamespace(catalogue={"qualite_air": Item(None, "Mesure WAQI indisponible", "waqi")}, computed=at)
    assert HestiaWeatherApi(hass_with(e)).air()["index"] is None  # the source does not answer
    atmo = entry("e2", "Gardanne", Settings(weather_entity="weather.home", atmo={"atmo_air_entity": "sensor.atmo_qualite_globale"}))
    assert HestiaWeatherApi(hass_with(atmo)).air()["entity_id"] == "sensor.atmo_qualite_globale"
    assert HestiaWeatherApi(hass_with(entry("e3", "Gardanne", Settings(weather_entity="weather.home")))).air() is None


def test_pollen_is_published_on_one_scale_whatever_the_source():
    """Hestia Confort asks it, to air short and early for a household that says it is allergic (29 October 2026)."""
    from engine.catalogue import Item
    at = datetime(2026, 10, 29, 9, tzinfo=timezone.utc)
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home", pollen_source="atmo"))
    api = HestiaWeatherApi(hass_with(e))
    e.runtime_data.data = SimpleNamespace(catalogue={"pollens": Item(4, "Élevé (4/6) · Ambroisie", "atmo",
                                                                     extra={"libelle": "Élevé", "principal": "Ambroisie", "demain": 2})}, computed=at)
    assert api.pollen() == {"entry_id": "e1", "source": "atmo", "level": 3, "high": True, "index": 4, "scale": 6, "label": "Élevé",
                            "main": "Ambroisie", "tomorrow": 1, "at": "2026-10-29T09:00:00+00:00"}
    e.runtime_data.data.catalogue["pollens"] = Item(3, "Modéré (3/6)", "atmo", extra={"libelle": "Modéré"})
    assert (api.pollen()["level"], api.pollen()["high"]) == (2, False)
    # Polleninformation, IRM KMI, Kleenex: their own 0-4 scale is the shared one.
    e.runtime_data.settings = Settings(weather_entity="weather.home", pollen_source="legacy", pollen_provider="kleenex_pollenradar")
    e.runtime_data.data.catalogue["pollens"] = Item(3, "Élevé (3/4) · Graminées", "kleenex_pollenradar",
                                                    extra={"libelle": "Élevé", "principal": "Graminées", "demain": 4})
    found = api.pollen()
    assert (found["level"], found["high"], found["index"], found["scale"], found["main"], found["tomorrow"]) == (3, True, 3, 4, "Graminées", 4)
    e.runtime_data.data.catalogue["pollens"] = Item(None, "Kleenex / Scottex indisponible", "kleenex_pollenradar")
    found = api.pollen()
    assert found["level"] is None and found["high"] is False and found["label"] is None  # the source does not answer
    e.runtime_data.data = None  # before the first calculation
    assert api.pollen()["level"] is None
    assert HestiaWeatherApi(hass_with(entry("e2", "Gardanne", Settings(weather_entity="weather.home", pollen_source="none")))).pollen() is None
    assert HestiaWeatherApi(hass_with()).pollen() is None


def test_rain_ahead_is_published_once_computed():
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home"))
    api = HestiaWeatherApi(hass_with(e))
    assert api.rain() is None
    at = datetime(2026, 10, 20, 11, 51, tzinfo=timezone.utc)
    e.runtime_data.data = SimpleNamespace(rain_ahead={"minutes": 29, "precision": "minute", "source": "radar", "amount": None, "dry_until": None},
                                          computed=at)
    assert api.rain("e1") == {"entry_id": "e1", "minutes": 29, "precision": "minute", "source": "radar", "amount": None,
                              "dry_until": None, "at": "2026-10-20T11:51:00+00:00"}


def test_season_is_shared_with_the_other_bricks():
    """Hestia Confort asks it, to propose an airing at hours that suit the season (21 October 2026)."""
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home", season_entity="sensor.season"))
    states = {"sensor.season": SimpleNamespace(state="autumn")}
    hass = SimpleNamespace(config_entries=SimpleNamespace(async_entries=lambda domain: [e]), states=SimpleNamespace(get=states.get),
                           config=SimpleNamespace(latitude=43.45, elevation=100, time_zone="Europe/Paris"))
    found = HestiaWeatherApi(hass).season()
    assert (found["entry_id"], found["season"], found["label"], found["from_sensor"]) == ("e1", "autumn", "Automne", True)
    assert found["day_length"] > 0
    states.clear()  # no sensor: the date decides
    assert HestiaWeatherApi(hass).season()["from_sensor"] is False
    assert HestiaWeatherApi(hass_with()).season() is None


def test_lightning_is_published_from_the_strikes_kept():
    from engine.lightning import Strike
    at = datetime(2026, 10, 21, 14, tzinfo=timezone.utc)
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home", lightning_entity="sensor.blitzortung_distance"))
    e.runtime_data.data = SimpleNamespace(catalogue={}, computed=at)
    e.runtime_data.strikes = [Strike(at.timestamp() - 300, 14.0, 225.0), Strike(at.timestamp() - 60, 9.0, 230.0)]
    hass = hass_with(e)
    hass.states = SimpleNamespace(get=lambda entity_id: SimpleNamespace(state="9.0"))
    seen = HestiaWeatherApi(hass).lightning()
    assert seen["near"] and seen["overhead"] and seen["nearest_km"] == 9.0 and seen["direction"] == "au sud-ouest" and seen["count"] == 2
    assert seen["text"] == "Orage à 9 km au sud-ouest" and seen["last"] == "2026-10-21T13:59:00+00:00" and seen["available"]
    hass.states = SimpleNamespace(get=lambda entity_id: SimpleNamespace(state="unavailable"))
    assert HestiaWeatherApi(hass).lightning()["available"] is False
    plain = entry("e2", "Gardanne", Settings(weather_entity="weather.home"))
    plain.runtime_data.data = SimpleNamespace(catalogue={}, computed=at)
    assert HestiaWeatherApi(hass_with(plain)).lightning() is None


def test_water_restrictions_are_published_with_watering():
    from engine.catalogue import Item
    at = datetime(2026, 8, 12, 8, tzinfo=timezone.utc)
    e = entry("e1", "Gardanne", Settings(weather_entity="weather.home", water_restriction_entity="sensor.vigieau"))
    e.runtime_data.data = SimpleNamespace(catalogue={"restrictions_eau": Item("alerte", "Alerte", "vigieau", extra={
        "niveau": 2, "libelle": "Alerte", "usages": ["Arrosage des pelouses"], "arrosage_restreint": True, "arrete": None})}, computed=at)
    assert HestiaWeatherApi(hass_with(e)).water() == {"entry_id": "e1", "entity_id": "sensor.vigieau", "level": 2, "state": "alerte", "label": "Alerte",
                                                     "restricted": True, "watering_restricted": True, "usages": ["Arrosage des pelouses"],
                                                     "order": None, "at": "2026-08-12T08:00:00+00:00"}
    e.runtime_data.data = SimpleNamespace(catalogue={"restrictions_eau": Item(None, "Vigieau indisponible", "vigieau")}, computed=at)
    assert HestiaWeatherApi(hass_with(e)).water()["level"] is None  # the source does not answer


def test_station_shade_is_shared_only_with_a_sun_sensor():
    without = entry("a", "Maison", Settings.from_options({"weather_entity": "weather.home"}))
    assert HestiaWeatherApi(hass_with(without)).station_shade() is None
    view = {"cells": {"170/25": 0.4}, "learned": 1, "reachable": 161}
    with_sun = entry("b", "Maison", Settings.from_options({"weather_entity": "weather.home", "solar_radiation_entity": "sensor.sun"}))
    with_sun.runtime_data.shade_view = lambda: view
    assert HestiaWeatherApi(hass_with(with_sun)).station_shade() == view
