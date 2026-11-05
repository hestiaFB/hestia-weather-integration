"""Puts Hestia Weather 3 inside this version (custom_components/niak_weather/next_version), for the bridge to write it.

Home Assistant's Marketplace refuses an update that changes the integration's folder: the last version under the former
name carries the new one and writes it itself (bridge.py). Run before publishing a bridge version, with the folder of the
new version as published (for example its tag, extracted by « git archive v3.1.0 custom_components/hestia_weather »):

    python3 scripts/carry_next_version.py /path/to/custom_components/hestia_weather
"""
from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = next(p for p in (ROOT / "custom_components").iterdir() if (p / "bridge.py").exists())
TARGET = PACKAGE / "next_version"


def main(source: Path) -> None:
    manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    expected = "hestia_" + PACKAGE.name.split("_", 1)[1]
    if manifest.get("domain") != expected:
        sys.exit(f"{source} is not {expected}: {manifest.get('domain')}")
    if TARGET.exists():
        shutil.rmtree(TARGET)
    shutil.copytree(source, TARGET, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    files = sum(1 for p in TARGET.rglob("*") if p.is_file())
    print(f"{expected} {manifest['version']} carried in {TARGET.relative_to(ROOT)} ({files} files)")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
