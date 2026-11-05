"""Reading numbers from Home Assistant states and converting them to the engine's units.

Every calculation uses the same units: °C, km/h, mm, hPa, W/m², lx. A missing or impossible value is None,
never a placeholder number.
"""
from __future__ import annotations

import math
import re
from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum
from typing import Any

from .i18n import decimal_comma


class Kind(StrEnum):
    """What a value measures, to pick its unit conversion."""

    TEMPERATURE = "temperature"
    TEMPERATURE_DELTA = "temperature_delta"
    WIND = "wind"
    RAIN = "rain"
    PRESSURE = "pressure"
    SOLAR = "solar"
    PLAIN = ""


def finite(value: Any) -> float | None:
    """A real number, or None for anything else (text, empty, boolean, NaN, and the old -999 placeholder)."""
    if value is None or value == "" or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and number > -900 else None


_KNOTS = re.compile(r"^(kn|kt|kts|knots?)$")


def measurement(value: Any, unit: Any = "", kind: Kind = Kind.PLAIN) -> float | None:
    """The value converted to the engine's unit for its kind."""
    number = finite(value)
    if number is None:
        return None
    u = str(unit or "").lower().strip()
    if kind is Kind.TEMPERATURE:
        return (number - 32) * 5 / 9 if "f" in u else number - 273.15 if u == "k" else number
    if kind is Kind.TEMPERATURE_DELTA:
        return number * 5 / 9 if "f" in u else number
    if kind is Kind.WIND:
        if u == "m/s":
            return number * 3.6
        if u == "mph":
            return number * 1.609344
        return number * 1.852 if _KNOTS.match(u) else number
    if kind is Kind.RAIN:
        return number * 25.4 if "in" in u else number
    if kind is Kind.PRESSURE:
        factors = {"pa": 1 / 100, "kpa": 10, "inhg": 33.86389, "mmhg": 1.333224}
        return number * factors[u] if u in factors else number
    if kind is Kind.SOLAR:
        return number * 1000 if "kw" in u else number
    return number


def fr(value: float | None, digits: int = 1) -> str:
    """A number written the French way, with a fixed number of decimals; « — » when unknown."""
    if value is None:
        return "—"
    text = f"{round(value, digits):.{digits}f}"
    return text.replace(".", ",") if decimal_comma() else text


def french(value: float, digits: int = 1, minimum: int = 0) -> str:
    """A number in the language currently used for the rendered view.

    The public function keeps its historical name because the engine imports it
    everywhere; it writes 8,5 in French and 8.5 in English.
    """
    q = Decimal(repr(float(value))).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP)
    whole, _, decimals = f"{abs(q):f}".partition(".")
    decimals = decimals.rstrip("0").ljust(minimum, "0")
    separator = "," if decimal_comma() else "."
    thousands = "\u202f" if decimal_comma() else ","
    return f"{'-' if q < 0 else ''}{int(whole):,}".replace(",", thousands) + (f"{separator}{decimals}" if decimals else "")
