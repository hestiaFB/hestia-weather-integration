"""Air-moisture quantities from temperature (°C) and relative humidity (%).

Same formulas as the Thermal Comfort integration, checked against its sensors on a real GW2000A history:
identical dew point to the hundredth of a degree. No extra integration needed.
"""
from __future__ import annotations

import math

from .i18n import N_, t


def dew_point(temperature: float, humidity: float) -> float | None:
    """Dew point (°C), from the Goff-Gratch / Arden Buck saturation vapour pressure."""
    if not (0 < humidity <= 100) or not math.isfinite(temperature):
        return None
    a0 = 373.15 / (273.15 + temperature)
    total = (-7.90298 * (a0 - 1) + 5.02808 * math.log10(a0) - 1.3816e-7 * (10 ** (11.344 * (1 - 1 / a0)) - 1)
             + 8.1328e-3 * (10 ** (-3.49149 * (a0 - 1)) - 1) + math.log10(1013.246))
    td = math.log(10 ** (total - 3) * humidity / 0.61078)
    return 241.88 * td / (17.558 - td)


def frost_point(temperature: float, dew: float) -> float:
    """Frost point (°C): the temperature at which a surface collects rime instead of dew."""
    t, d = temperature + 273.15, dew + 273.15
    return d - t + 2671.02 / (2954.61 / t + 2.193665 * math.log(t) - 13.3448) - 273.15


def humidex(temperature: float, dew: float) -> float:
    """Humidex (Environment Canada) from temperature and dew point."""
    return temperature + 0.5555 * (6.11 * math.exp(5417.7530 * (1 / 273.16 - 1 / (273.15 + dew))) - 10)


def humidity_feel(dew: float | None, humidity: float | None, feels: float | None) -> str:
    """How the moisture feels, from the dew point; said only when it changes the experience."""
    if dew is None or feels is None:
        return ""
    if dew >= 24:
        return t("air étouffant")
    if dew >= 21:
        return t("air très lourd")
    if dew >= 18:
        return t("air lourd")
    if dew >= 16 and feels >= 20:
        return t("air un peu humide")
    if humidity is not None and humidity < 30 and feels >= 15:
        return t("air sec")
    return ""


def humidex_feel(value: float) -> str:
    """The discomfort a humidex value means."""
    for limit, text in ((54, N_("coup de chaleur imminent")), (45, N_("inconfort dangereux")), (40, N_("fort inconfort")),
                        (35, N_("inconfort évident")), (30, N_("léger inconfort"))):
        if value >= limit:
            return t(text)
    return t("confortable")


def comfort_word(feels: float | None) -> str:
    """One word for the overall feel, on the thresholds of the UTCI thermal stress scale (borrowed as a reading grid)."""
    if feels is None:
        return ""
    for limit, word in ((-13, N_("Froid intense")), (0, N_("Froid")), (9, N_("Frais")), (26, N_("Agréable")), (32, N_("Chaud")),
                        (38, N_("Très chaud")), (46, N_("Chaleur intense"))):
        if feels < limit:
            return t(word)
    return t("Chaleur extrême")
