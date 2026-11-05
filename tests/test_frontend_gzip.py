"""The gzip copies of the card, the panel and the socle are what Home Assistant serves to most browsers: they must be the
very files beside them, never an older build (docs/PLAN-OPTIMISATION.md, point 4)."""
from __future__ import annotations

import gzip
from pathlib import Path

FRONTEND = Path(__file__).parent.parent / "custom_components" / "hestia_weather" / "frontend"


def test_each_gzip_copy_is_the_file_beside_it() -> None:
    copies = sorted(FRONTEND.glob("*.js.gz"))
    assert {c.name for c in copies} == {"hestia-weather-card.js.gz", "panel.js.gz", "hestia-socle.js.gz"}
    for copy in copies:
        assert gzip.decompress(copy.read_bytes()) == (FRONTEND / copy.name[:-3]).read_bytes(), f"{copy.name} : relancer npm run build"


def test_each_font_has_its_light_woff2() -> None:
    for font in FRONTEND.glob("manrope-*.ttf"):
        woff2 = font.with_suffix(".woff2")
        assert woff2.exists() and woff2.stat().st_size < font.stat().st_size / 3, woff2.name
