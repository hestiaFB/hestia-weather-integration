"""The home's time zone comes from Home Assistant, already loaded: building one reads the disk, a blocking call on the event loop
(review of the HACS default list, 9 November 2026). dt_util.get_default_time_zone() or the zone passed in, never ZoneInfo(...)."""
from pathlib import Path
import re

INTEGRATION = Path(__file__).resolve().parents[1] / "custom_components" / "hestia_weather"
# dt_util.get_time_zone() reads the disk too, the first time; async_get_time_zone() does it in a worker thread.
BLOCKING = re.compile(r"ZoneInfo\(|(?<!\w)get_time_zone\(")


def test_no_time_zone_is_built_in_the_integration():
    found = [f"{path.relative_to(INTEGRATION)}:{number}" for path in sorted(INTEGRATION.rglob("*.py"))
             for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1) if BLOCKING.search(line)]
    assert found == [], "use dt_util.get_default_time_zone() or the zone passed in: " + ", ".join(found)


def test_the_check_sees_a_built_zone():
    assert BLOCKING.search('zone = ZoneInfo(hass.config.time_zone)') and BLOCKING.search('zone = dt_util.get_time_zone("Europe/Paris")')
    assert not BLOCKING.search("zone = dt_util.get_default_time_zone()") and not BLOCKING.search("await dt_util.async_get_time_zone(name)")
