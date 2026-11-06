"""Finding the sources (ported from the card's station-models, station-profiles and config-sources tests)."""
from dataclasses import dataclass, field
from typing import Any

import pytest

from engine.detection import (STATION_FIELDS, candidates, fill, function_matches, manual_candidates, measurement_matches, model_devices, netatmo_disabled,
                              selected_station_model, source_devices,
                              station_groups, station_profile, station_report)
from engine.units import Kind, measurement


@dataclass
class State:
    entity_id: str
    state: str = "20"
    attributes: dict[str, Any] = field(default_factory=dict)


def states(*items: State) -> list[State]:
    return list(items)


BASE = {"weather_entity": "weather.city"}


# ── Station models ───────────────────────────────────────────────────────────

def test_starts_from_existing_gw2000a_entities_without_a_device() -> None:
    assert selected_station_model({"temperature_entity": "sensor.gw2000a_outdoor_temperature"}) == "gw2000a"


def test_shows_model_specific_fields_grouped_by_subject() -> None:
    def fields(model: str) -> list[str]:
        return [f for _, _, group in station_groups(model) for f in group]

    assert [title for _, title, _ in station_groups("gw2000a")] == ["Température et humidité", "Pluie", "Vent", "Soleil", "Spécifiques"]
    assert "weekly_rain_entity" in fields("gw2000a")
    assert "rain_total_entity" in fields("ws90") and "weekly_rain_entity" not in fields("ws90") and "solar_radiation_entity" not in fields("ws90")
    assert "solar_radiation_entity" in fields("manual") and "rain_total_entity" in fields("manual")


def test_keeps_an_explicit_manual_choice_even_for_ws90_sensors() -> None:
    assert selected_station_model({"station_model": "manual", "temperature_entity": "sensor.ws90_temperature"}) == "manual"
    assert selected_station_model({"temperature_entity": "sensor.ws90_temperature"}) == "ws90"
    assert selected_station_model({"temperature_entity": "sensor.custom_temperature"}) == "manual"


def test_finds_known_station_devices_from_the_entity_registry_alone() -> None:
    entity = State("sensor.ws90_temperature")
    assert model_devices([entity], {entity.entity_id: {"device_id": "ws", "platform": "mqtt"}}, {}, "ws90") == ["ws"]


def test_identifies_a_manual_or_gw2000a_profile_without_the_ecowitt_integration() -> None:
    assert "configuration manuelle" in station_profile([], {}, {}, "")
    assert station_profile([], {}, {"g": {"name": "GW2000A"}}, "g") == "GW2000A / Ecowitt"
    assert station_profile([], {}, {"g": {"name": "WS90"}}, "g") == "WS90"


# ── A WS90 behind Zigbee2MQTT ────────────────────────────────────────────────

PREFIX = "sensor.station_meteo_ecowitt_ws90_powered_by_shelly_"
MEASUREMENTS = {"temperature": ("temperature", "°C"), "dew_point": ("temperature", "°C"), "apparent_temperature": ("temperature", "°C"),
                "illuminance": ("illuminance", "lx"), "illuminance_raw": ("", ""), "wind_speed": ("wind_speed", "km/h"), "gust_speed": ("wind_speed", "km/h"),
                "wind_direction": ("", "°"), "precipitation": ("precipitation", "mm"), "precipitations_24h": ("precipitation", "mm")}
WS90 = [State(PREFIX + name, "1", {"device_class": cls, "unit_of_measurement": unit,
                                   "state_class": "total_increasing" if name == "precipitation" else "measurement"})
        for name, (cls, unit) in MEASUREMENTS.items()]
WS90_REGISTRY = {s.entity_id: {"device_id": "station", "platform": "mqtt"} for s in WS90}
WS90_DEVICES = {"station": {"name": "WS90", "manufacturer": "Shelly"}}
WS90_OPTIONS = {**BASE, "station_device_id": "station"}


def test_prefills_the_calibrated_illuminance_even_with_a_raw_channel() -> None:
    assert fill(WS90, WS90_REGISTRY, WS90_DEVICES, WS90_OPTIONS, "station")["illuminance_entity"] == PREFIX + "illuminance"


def test_restricts_temperature_wind_mean_and_gusts_to_their_function() -> None:
    assert manual_candidates(WS90, "temperature_entity", WS90_REGISTRY, WS90_OPTIONS) == [PREFIX + "temperature"]
    assert manual_candidates(WS90, "wind_speed_entity", WS90_REGISTRY, WS90_OPTIONS) == [PREFIX + "wind_speed"]
    assert manual_candidates(WS90, "wind_gust_entity", WS90_REGISTRY, WS90_OPTIONS) == [PREFIX + "gust_speed"]


def test_does_not_offer_a_generic_counter_as_a_daily_counter() -> None:
    assert manual_candidates(WS90, "daily_rain_entity", WS90_REGISTRY, WS90_OPTIONS) == []


def test_does_not_mistake_an_averaged_wind_direction_for_a_speed() -> None:
    entity = State("sensor.gw2000a_wind_direction_10m_avg", "180", {"unit_of_measurement": "°"})
    assert "wind_speed_entity" not in fill([entity], {}, {}, BASE, "station")


def test_recognises_a_ws90_mqtt_profile_and_reports_fields_without_choosing() -> None:
    report = station_report(WS90, WS90_REGISTRY, WS90_DEVICES, WS90_OPTIONS)
    assert report["profile"] == "WS90 via MQTT"
    fields = {f["field"]: f for f in report["fields"]}
    assert (fields["illuminance_entity"]["status"], fields["illuminance_entity"]["entity"]) == ("recognized", PREFIX + "illuminance")
    assert fields["daily_rain_entity"]["status"] == "absent"


def test_fills_blank_fields_only_when_asked_and_keeps_valid_manual_choices() -> None:
    empty = {**WS90_OPTIONS, "illuminance_entity": ""}
    assert fill(WS90, WS90_REGISTRY, WS90_DEVICES, empty, "station")["illuminance_entity"] == ""
    assert fill(WS90, WS90_REGISTRY, WS90_DEVICES, empty, "station", True)["illuminance_entity"] == PREFIX + "illuminance"
    chosen = {**WS90_OPTIONS, "temperature_entity": PREFIX + "temperature"}
    assert fill(WS90, WS90_REGISTRY, WS90_DEVICES, chosen, "station", True)["temperature_entity"] == PREFIX + "temperature"


def test_reports_a_real_ambiguity_without_choosing_either_thermometer() -> None:
    extra = State("sensor.station_ws90_outdoor_temperature", "1", WS90[0].attributes)
    more, registry = [*WS90, extra], {**WS90_REGISTRY, extra.entity_id: {"device_id": "station", "platform": "mqtt"}}
    report = station_report(more, registry, WS90_DEVICES, WS90_OPTIONS)
    temperature = next(f for f in report["fields"] if f["field"] == "temperature_entity")
    assert (temperature["status"], temperature["entity"]) == ("ambiguous", None)
    assert "temperature_entity" not in fill(more, registry, WS90_DEVICES, WS90_OPTIONS, "station")


# ── Sources and repairs ──────────────────────────────────────────────────────

def test_filters_manual_choices_by_physical_measure_even_after_a_rename() -> None:
    every = states(State("sensor.custom", "20", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                   State("sensor.temp_bad", "60", {"device_class": "humidity", "unit_of_measurement": "%"}),
                   State("sensor.lux", "10", {"device_class": "illuminance", "unit_of_measurement": "lx"}),
                   State("sensor.fahrenheit", "70", {"unit_of_measurement": "°F"}))
    assert manual_candidates(every, "temperature_entity", {}, BASE) == ["sensor.custom", "sensor.fahrenheit"]
    assert manual_candidates(every, "humidity_entity", {}, BASE) == ["sensor.temp_bad"]


@pytest.mark.parametrize(("field_name", "unit"), [("wind_speed_entity", "m/s"), ("wind_gust_entity", "km/h"), ("rain_rate_entity", "mm/h"),
                                                  ("daily_rain_entity", "mm"), ("pressure_entity", "hPa"), ("solar_radiation_entity", "W/m²"),
                                                  ("illuminance_entity", "lx"), ("wind_bearing_entity", "°")])
def test_recognises_each_measure_by_its_unit(field_name: str, unit: str) -> None:
    assert measurement_matches(State("sensor.custom", "1", {"unit_of_measurement": unit}), field_name)
    assert not measurement_matches(State("sensor.custom", "1", {"unit_of_measurement": "kWh"}), field_name)


def test_repairs_missing_station_references_without_touching_other_categories() -> None:
    entity = State("sensor.station_meteo_ws90_temperature", "20", {"device_class": "temperature"})
    registry, devices = {entity.entity_id: {"platform": "mqtt", "device_id": "ws90"}}, {"ws90": {"name": "WS90 Zigbee2MQTT"}}
    result = fill([entity], registry, devices, {**BASE, "temperature_entity": "sensor.deleted", "atmo_air_entity": "sensor.atmo_keep"}, "station")
    assert (result["temperature_entity"], result["atmo_air_entity"], result["station_device_id"]) == (entity.entity_id, "sensor.atmo_keep", "ws90")
    assert source_devices([entity], registry, devices) == [{"value": "ws90", "label": "WS90 Zigbee2MQTT"}]


def test_keeps_empty_fields_valid_manual_ids_and_unavailable_entities() -> None:
    every = states(State("sensor.outdoor_temperature"), State("sensor.manual", "unavailable"))
    for selected in ("", "sensor.manual"):
        assert fill(every, {}, {}, {**BASE, "temperature_entity": selected}, "station")["temperature_entity"] == selected


def test_does_not_guess_an_ambiguous_missing_reference() -> None:
    every = states(State("sensor.a_outdoor_temperature"), State("sensor.b_outdoor_temperature"))
    assert fill(every, {}, {}, {**BASE, "temperature_entity": "sensor.deleted"}, "station")["temperature_entity"] == "sensor.deleted"


def test_does_not_take_a_room_humidity() -> None:
    every = states(State("sensor.salon_humidity"), State("sensor.inside_humidex"))
    assert "humidity_entity" not in fill(every, {"sensor.inside_humidex": {"platform": "thermal_comfort"}}, {}, BASE, "station")


def test_keeps_the_explicit_manual_device_mode_while_filling() -> None:
    entity = State("sensor.outdoor_temperature")
    result = fill([entity], {entity.entity_id: {"device_id": "outside", "platform": "mqtt"}}, {}, {**BASE, "station_device_id": ""}, "station")
    assert (result["station_device_id"], result["temperature_entity"]) == ("", "sensor.outdoor_temperature")


def test_keeps_indoor_apparent_and_trend_sensors_out_of_automatic_choices() -> None:
    every = [State(i) for i in ("sensor.ecowitt_indoor_temperature", "sensor.ecowitt_apparent_temperature", "sensor.ecowitt_pressure_trend",
                                "sensor.ecowitt_absolute_humidity")]
    for field_name in ("temperature_entity", "pressure_entity", "humidity_entity"):
        assert candidates(every, field_name, {}) == []


def test_never_takes_a_thermal_comfort_output_for_a_station_sensor() -> None:
    every = states(State("sensor.custom", "12", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                   State("sensor.ws90_dew_point", "12", {"device_class": "temperature", "unit_of_measurement": "°C"}))
    registry = {"sensor.custom": {"platform": "thermal_comfort", "translation_key": "dew_point"}, "sensor.ws90_dew_point": {"platform": "mqtt"}}
    assert manual_candidates(every, "dew_point_entity", registry, BASE) == ["sensor.ws90_dew_point"]
    assert fill(every, registry, {}, BASE, "station")["dew_point_entity"] == "sensor.ws90_dew_point"


def test_repairs_atmo_after_a_reinstall_from_zone_measure_and_day() -> None:
    every, registry = [], {}
    for entity_id, name in (("sensor.new_air", "Qualité globale"), ("sensor.new_next", "Qualité globale-J+1"), ("sensor.new_pm25", "PM25")):
        every.append(State(entity_id, "3", {"Nom de la zone": "Gardanne", "Type de zone": "Commune"}))
        registry[entity_id] = {"platform": "atmofrance", "original_name": name, "config_entry_id": "new-entry"}
    options = {**BASE, "location": "Gardanne", "atmo_area": "entry:old-entry", "atmo_air_entity": "sensor.old_air",
               "atmo_air_tomorrow_entity": "sensor.old_next", "atmo_pm25_entity": "", "temperature_entity": "sensor.keep"}
    result = fill(every, registry, {}, options, "atmo")
    assert {k: result[k] for k in ("atmo_area", "atmo_air_entity", "atmo_air_tomorrow_entity", "atmo_pm25_entity", "temperature_entity")} == {
        "atmo_area": "zone:commune:gardanne", "atmo_air_entity": "sensor.new_air", "atmo_air_tomorrow_entity": "sensor.new_next",
        "atmo_pm25_entity": "", "temperature_entity": "sensor.keep"}


def test_fills_only_weather_sources_without_requiring_a_station() -> None:
    every = states(State("weather.city", "sunny"), State("sun.sun", "above_horizon"), State("sensor.outdoor_temperature"))
    assert fill(every, {}, {}, {"weather_entity": "weather.deleted"}, "weather") == {"weather_entity": "weather.city", "sun_entity": "sun.sun"}


def test_converts_the_additional_pressure_and_temperature_trend_units() -> None:
    assert measurement(760, "mmHg", Kind.PRESSURE) == pytest.approx(1013.25, abs=0.05)
    assert measurement(1.8, "°F/h", Kind.TEMPERATURE_DELTA) == pytest.approx(1)


def test_does_not_confuse_millimetres_of_distance_with_rain() -> None:
    assert not measurement_matches(State("sensor.distance", "10", {"device_class": "distance", "unit_of_measurement": "mm"}), "daily_rain_entity")
    assert measurement_matches(State("sensor.trend", "1", {"device_class": "temperature", "unit_of_measurement": "°C/h"}), "temperature_trend_entity")


def test_fills_the_polleninformation_alternative() -> None:
    result = fill([State("sensor.polleninformation_city_grasses", "3")], {}, {}, {**BASE, "pollen_source": "legacy"}, "atmo")
    assert result["pollens"][0]["id"] == "sensor.polleninformation_city_grasses"


def test_prefills_compatible_outdoor_measures_of_a_gw2000a() -> None:
    every = states(State("sensor.gw2000a_outdoor_temperature", "12", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                   State("sensor.gw2000a_outdoor_humidity", "80", {"device_class": "humidity", "unit_of_measurement": "%"}),
                   State("sensor.gw2000a_wind_speed", "5", {"device_class": "wind_speed", "unit_of_measurement": "km/h"}),
                   State("sensor.gw2000a_rain_rate", "0", {"device_class": "precipitation_intensity", "unit_of_measurement": "mm/h"}),
                   State("sensor.indoor_temperature", "23", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                   State("sensor.thermal_comfort_humidex", "13", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                   State("sensor.confort_ouvertures", "ok"))
    found = fill(every, {}, {}, BASE, "station")
    assert {k: found.get(k) for k in ("temperature_entity", "humidity_entity", "wind_speed_entity", "rain_rate_entity")} == {
        "temperature_entity": "sensor.gw2000a_outdoor_temperature", "humidity_entity": "sensor.gw2000a_outdoor_humidity",
        "wind_speed_entity": "sensor.gw2000a_wind_speed", "rain_rate_entity": "sensor.gw2000a_rain_rate"}


def test_recognises_the_long_names_of_a_ws90_behind_zigbee2mqtt() -> None:
    prefix = "sensor.station_meteo_ecowitt_ws90_powered_by_shelly_"
    names = ["temperature", "humidity", "wind_speed", "gust_speed", "wind_direction", "rain_rate", "precipitations_24h", "pressure", "illuminance", "uv_index",
             "humidex"]
    every = [State(prefix + n, "1") for n in names]
    found = fill(every, {prefix + n: {"platform": "zigbee2mqtt", "device_id": "ws90"} for n in names}, {}, BASE, "station")
    expected = {"temperature_entity": "temperature", "humidity_entity": "humidity", "wind_speed_entity": "wind_speed", "wind_gust_entity": "gust_speed",
                "wind_bearing_entity": "wind_direction", "rain_rate_entity": "rain_rate", "rain_24h_entity": "precipitations_24h",
                "pressure_entity": "pressure", "illuminance_entity": "illuminance", "uv_index_entity": "uv_index"}
    assert {k: found.get(k) for k in expected} == {k: prefix + v for k, v in expected.items()}


def test_hestia_weather_never_offers_its_own_sensors_or_device_as_a_station() -> None:
    @dataclass
    class S:
        entity_id: str
        state: str
        attributes: dict = field(default_factory=dict)
    states = [S("sensor.hestia_weather_point_de_rosee", "12", {"unit_of_measurement": "°C", "device_class": "temperature", "friendly_name": "Hestia Weather Point de rosée"})]
    registry = {"sensor.hestia_weather_point_de_rosee": {"platform": "hestia_weather", "device_id": "hestia"}}
    assert source_devices(states, registry, {"hestia": {"name": "Hestia Weather"}}) == []
    assert candidates(states, "dew_point_entity", registry) == []


def test_hestia_weather_ids_are_never_offered_as_a_station_either() -> None:
    @dataclass
    class S:
        entity_id: str
        state: str
        attributes: dict = field(default_factory=dict)
    states = [S("sensor.hestia_weather_point_de_rosee", "12", {"unit_of_measurement": "°C", "device_class": "temperature", "friendly_name": "Hestia Weather Point de rosée"})]
    assert candidates(states, "dew_point_entity", {}) == []


# ── A Netatmo station: one device per module ─────────────────────────────────

def netatmo_home(via: bool = True, enabled: tuple[str, ...] = ()) -> tuple[list[State], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    """A Netatmo home as Home Assistant builds it: the station (indoor), its outdoor module, rain gauge and anemometer, a bedroom
    module, and a public station nearby. Gusts, wind angle and the rain of the last hour come disabled, unless `enabled`."""
    def device(name: str, model: str, parent: str | None = "main") -> dict[str, Any]:
        return {"name": name, "manufacturer": "Netatmo", "model": model, "via_device_id": parent if via else None}
    devices = {"home": device("Maison", "Home", None), "main": device("Intérieur", "Smart Home Weather station", "home"),
               "out": device("Extérieur", "Smart Outdoor Module"), "rain": device("Pluviomètre", "Smart Rain Gauge"),
               "wind": device("Anémomètre", "Smart Anemometer"), "room": device("Chambre", "Smart Indoor Module"),
               "public": device("Marseille", "Public Weather station", None)}
    C, PCT, MM = ({"device_class": "temperature", "unit_of_measurement": "°C"}, {"device_class": "humidity", "unit_of_measurement": "%"},
                  {"device_class": "precipitation", "unit_of_measurement": "mm"})
    KMH, DEG = {"device_class": "wind_speed", "unit_of_measurement": "km/h"}, {"device_class": "wind_direction", "unit_of_measurement": "°"}
    sensors = [  # entity id, device, Netatmo key, attributes, disabled by default
        ("sensor.interieur_temperature", "main", "temperature", C, False), ("sensor.interieur_humidite", "main", "humidity", PCT, False),
        ("sensor.interieur_pression_atmospherique", "main", "pressure", {"device_class": "atmospheric_pressure", "unit_of_measurement": "mbar"}, False),
        ("sensor.interieur_dioxyde_de_carbone", "main", "co2", {"device_class": "carbon_dioxide", "unit_of_measurement": "ppm"}, False),
        ("sensor.exterieur_temperature", "out", "temperature", C, False), ("sensor.exterieur_humidite", "out", "humidity", PCT, False),
        ("sensor.pluviometre_precipitations", "rain", "rain", {**MM, "state_class": "measurement"}, False),
        ("sensor.pluviometre_precipitations_derniere_heure", "rain", "sum_rain_1", {**MM, "state_class": "total"}, True),
        ("sensor.pluviometre_precipitations_aujourd_hui", "rain", "sum_rain_24", {**MM, "state_class": "total_increasing"}, False),
        ("sensor.anemometre_vitesse_du_vent", "wind", "windstrength", KMH, False), ("sensor.anemometre_force_des_rafales", "wind", "guststrength", KMH, True),
        ("sensor.anemometre_angle_du_vent", "wind", "windangle_value", DEG, True),
        ("sensor.anemometre_direction_du_vent", "wind", "windangle", {"device_class": "enum"}, False),
        ("sensor.chambre_temperature", "room", "temperature", C, False), ("sensor.chambre_humidite", "room", "humidity", PCT, False),
        ("sensor.marseille_temperature", "public", "temperature", C, False), ("sensor.marseille_vitesse_du_vent", "public", "windstrength", KMH, False),
    ]
    mac = {"main": "70:ee:50:00:00:01", "out": "02:00:00:00:00:02", "rain": "05:00:00:00:00:03", "wind": "06:00:00:00:00:04", "room": "03:00:00:00:00:05"}
    registry, states = {}, []
    for entity_id, dev, key, attributes, off in sensors:
        disabled = off and entity_id not in enabled
        registry[entity_id] = {"platform": "netatmo", "device_id": dev, "unique_id": f"{mac.get(dev, 'Marseille')}-{key}",
                               "disabled_by": "integration" if disabled else None, "translation_key": None, "original_name": None}
        if not disabled:
            states.append(State(entity_id, "12", {**attributes}))
    return states, registry, devices


def test_proposes_a_netatmo_station_and_takes_each_measure_from_its_module() -> None:
    every, registry, devices = netatmo_home()
    found = fill(every, registry, devices, BASE, "station")
    assert found["station_model"] == "netatmo" and found["station_device_id"] == "main"
    assert {k: found.get(k) for k in ("temperature_entity", "humidity_entity", "pressure_entity", "daily_rain_entity", "rain_total_entity",
                                      "wind_speed_entity")} == {
        "temperature_entity": "sensor.exterieur_temperature", "humidity_entity": "sensor.exterieur_humidite",
        "pressure_entity": "sensor.interieur_pression_atmospherique", "daily_rain_entity": "sensor.pluviometre_precipitations_aujourd_hui",
        "rain_total_entity": "sensor.pluviometre_precipitations_aujourd_hui", "wind_speed_entity": "sensor.anemometre_vitesse_du_vent"}
    # Disabled by Home Assistant: left empty and said, never replaced by the indoor, bedroom or public sensors.
    assert not any(found.get(k) for k in ("wind_gust_entity", "wind_bearing_entity", "rain_rate_entity"))
    assert netatmo_disabled(registry, devices, found) == {"rain_rate_entity": "sensor.pluviometre_precipitations_derniere_heure",
                                                           "wind_gust_entity": "sensor.anemometre_force_des_rafales",
                                                           "wind_bearing_entity": "sensor.anemometre_angle_du_vent"}
    assert station_profile(every, registry, devices, "main") == "Netatmo"


def test_takes_the_netatmo_sensors_once_enabled_and_the_last_hour_as_the_rain_now() -> None:
    every, registry, devices = netatmo_home(enabled=("sensor.pluviometre_precipitations_derniere_heure", "sensor.anemometre_force_des_rafales",
                                                     "sensor.anemometre_angle_du_vent"))
    found = fill(every, registry, devices, {**BASE, "station_model": "netatmo"}, "station")
    assert (found["rain_rate_entity"], found["wind_gust_entity"], found["wind_bearing_entity"]) == (
        "sensor.pluviometre_precipitations_derniere_heure", "sensor.anemometre_force_des_rafales", "sensor.anemometre_angle_du_vent")
    by_id = {s.entity_id: s for s in every}
    for field_name, entity_id in (("rain_rate_entity", "sensor.pluviometre_precipitations_derniere_heure"),
                                  ("rain_total_entity", "sensor.pluviometre_precipitations_aujourd_hui")):
        assert function_matches(by_id[entity_id], field_name, registry[entity_id])
        assert entity_id in manual_candidates(every, field_name, registry, found, devices)
    assert netatmo_disabled(registry, devices, found) == {}
    report = {f["field"]: f["status"] for f in station_report(every, registry, devices, found)["fields"]}
    assert report["temperature_entity"] == report["rain_rate_entity"] == "recognized"


def test_offers_every_module_of_the_chosen_netatmo_station_but_not_the_others() -> None:
    every, registry, devices = netatmo_home()
    options = {**BASE, "station_model": "netatmo", "station_device_id": "main"}
    offered = manual_candidates(every, "temperature_entity", registry, options, devices)
    assert "sensor.exterieur_temperature" in offered and "sensor.marseille_temperature" not in offered
    assert candidates(every, "temperature_entity", registry, options, devices) == ["sensor.exterieur_temperature"]
    assert [title for _, title, _ in station_groups("netatmo")] == ["Température et humidité", "Pluie", "Vent", "Soleil", "Spécifiques"]


def test_finds_a_renamed_netatmo_module_and_works_without_device_links() -> None:
    every, registry, devices = netatmo_home(via=False)
    devices["out"]["name"] = "Jardin"
    found = fill(every, registry, devices, BASE, "station")
    assert found["temperature_entity"] == "sensor.exterieur_temperature" and found["wind_speed_entity"] == "sensor.anemometre_vitesse_du_vent"
    # Two stations and no link between modules: which module belongs to which is unknown, nothing is guessed.
    devices["second"] = {"name": "Chalet", "manufacturer": "Netatmo", "model": "Smart Home Weather station"}
    assert fill(every, registry, devices, {**BASE, "station_model": "netatmo"}, "station").get("temperature_entity") is None


def test_keeps_an_ecowitt_station_first_when_a_netatmo_is_also_there() -> None:
    every, registry, devices = netatmo_home()
    every.append(State("sensor.gw2000a_outdoor_temperature", "12", {"device_class": "temperature", "unit_of_measurement": "°C"}))
    registry["sensor.gw2000a_outdoor_temperature"] = {"platform": "ecowitt", "device_id": "gw"}
    found = fill(every, registry, devices, BASE, "station")
    assert found.get("station_model") is None and found["temperature_entity"] == "sensor.gw2000a_outdoor_temperature"
    # A saved choice of « no station » stays.
    declined = {**BASE, "station_model": "", **{f: "" for f in STATION_FIELDS}}
    assert fill(*netatmo_home(), declined, "station")["temperature_entity"] == ""


def test_takes_the_uv_a_netatmo_station_lacks_from_openuv() -> None:
    # Issue #5: a Netatmo station has no UV sensor; OpenUV's current index must be offered and recognised, not its daily maximum nor its level.
    every, registry, devices = netatmo_home()
    devices["openuv"] = {"name": "OpenUV", "manufacturer": "OpenUV", "model": None, "via_device_id": None}
    UV = {"unit_of_measurement": "UV index", "state_class": "measurement"}
    for entity_id, name, attributes, state in (("sensor.openuv_indice_uv_actuel", "Indice UV actuel", UV, "2.3"),
                                               ("sensor.openuv_indice_uv_maximal", "Indice UV maximal", UV, "3.1"),
                                               ("sensor.openuv_niveau_uv_actuel", "Niveau UV actuel", {}, "Faible"),
                                               ("sensor.openuv_niveau_dozone_actuel", "Niveau d'ozone actuel", {"unit_of_measurement": "du"}, "300")):
        registry[entity_id] = {"platform": "openuv", "device_id": "openuv", "unique_id": entity_id, "disabled_by": None,
                               "translation_key": None, "original_name": name}
        every.append(State(entity_id, state, {**attributes, "friendly_name": f"OpenUV {name}"}))
    options = {**BASE, "station_model": "netatmo", "station_device_id": "main"}
    assert any("uv_index_entity" in group for _, _, group in station_groups("netatmo"))
    assert candidates(every, "uv_index_entity", registry, options, devices) == ["sensor.openuv_indice_uv_actuel"]
    assert "sensor.openuv_indice_uv_actuel" in manual_candidates(every, "uv_index_entity", registry, options, devices)
    assert fill(every, registry, devices, BASE, "station")["uv_index_entity"] == "sensor.openuv_indice_uv_actuel"


# ── What a sensor gives, kept from one command of the panel to the next (PLAN-OPTIMISATION-HUB.md, point 1) ──

def test_kept_between_commands_gives_the_same_lists_and_follows_changes() -> None:
    from engine import detection
    detection.forget()
    attrs = {"device_class": "temperature", "unit_of_measurement": "°C", "friendly_name": "GW2000A Outdoor Temperature"}
    registry = {"sensor.gw2000a_outdoor_temperature": {"platform": "ecowitt", "device_id": "gw"}}
    def command(a: dict[str, Any], reg: dict[str, Any]) -> tuple[list[str], list[str]]:
        # New state objects each command, as Home Assistant gives them; the attributes object is kept while unchanged.
        found = states(State("sensor.gw2000a_outdoor_temperature", "12", a), State("sensor.other", "3", {"unit_of_measurement": "km/h"}))
        with detection.batch():
            return (candidates(found, "temperature_entity", reg), manual_candidates(found, "temperature_entity", reg))
    plain = (candidates(states(State("sensor.gw2000a_outdoor_temperature", "12", attrs), State("sensor.other", "3", {"unit_of_measurement": "km/h"})),
                        "temperature_entity", registry),
             manual_candidates(states(State("sensor.gw2000a_outdoor_temperature", "12", attrs), State("sensor.other", "3", {"unit_of_measurement": "km/h"})),
                               "temperature_entity", registry))
    assert command(attrs, registry) == command(attrs, registry) == plain == (["sensor.gw2000a_outdoor_temperature"], ["sensor.gw2000a_outdoor_temperature"])
    # Its attributes change (new object, as Home Assistant makes one): read again.
    assert command({**attrs, "device_class": "humidity", "unit_of_measurement": "%"}, registry) == ([], [])
    # Its registry entry changes (disabled): read again.
    assert command(attrs, {"sensor.gw2000a_outdoor_temperature": {"platform": "ecowitt", "device_id": "gw", "disabled_by": "user"}}) == ([], [])
    assert command(attrs, registry) == plain
    detection.forget()
