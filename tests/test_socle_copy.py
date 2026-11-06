"""The shared « Hestia-FB » panel copied into this brick hangs together (hestia-ecosysteme/socle, copied by copier.sh).

The Python registers the panel under the shell's element name, which carries the socle's version; the compiled
screen must define that very name, or the panel stays blank. Plain file reads: no Home Assistant needed.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOCLE = next(ROOT.glob("custom_components/*/socle.py"))
FRONTEND = SOCLE.parent / "frontend"


class SocleCopy(unittest.TestCase):
    def test_the_element_name_follows_the_socle_version_everywhere(self):
        python = SOCLE.read_text(encoding="utf-8")
        major, minor = re.search(r"^SOCLE_VERSION = \((\d+), (\d+)\)", python, re.M).groups()
        element = f"hestia-socle-{major}-{minor}"
        self.assertIn(f'ELEMENT = "{element}"', python)
        self.assertIn(f"ELEMENT='{element}'", (ROOT / "frontend" / "socle" / "shell.ts").read_text(encoding="utf-8"))
        # Compiled after every copy: an old bundle would define the previous name.
        self.assertIn(element, (FRONTEND / "hestia-socle.js").read_text(encoding="utf-8"))

    def test_the_build_and_version_are_the_same_in_python_and_in_the_pages(self):
        python = SOCLE.read_text(encoding="utf-8")
        ui = (ROOT / "frontend" / "socle" / "ui.ts").read_text(encoding="utf-8")
        major, minor = re.search(r"^SOCLE_VERSION = \((\d+), (\d+)\)", python, re.M).groups()
        self.assertIn(f"export const SOCLE:readonly [number,number]=[{major},{minor}];", ui)
        build = re.search(r'^SOCLE_BUILD = "(\d{8}\.\d{4})"$', python, re.M).group(1)
        self.assertIn(f"export const SOCLE_BUILD='{build}';", ui)

    def test_the_pages_take_every_piece_through_the_hub(self):
        # Socle 1.22: a brick's tab imports ui.ts through hub.ts, which must hand on every piece ui.ts exports.
        socle = ROOT / "frontend" / "socle"
        ui = (socle / "ui.ts").read_text(encoding="utf-8")
        hub = (socle / "hub.ts").read_text(encoding="utf-8")
        pieces = set(re.findall(r"^export (?:function|const|class) (\w+)", ui, re.M)) - {"SOCLE", "SOCLE_BUILD", "sameOrNewer"}
        listed = set(re.findall(r"'(\w+)'", re.search(r"PIECES=\[(.*?)\]", hub, re.S).group(1)))
        handed = set(re.findall(r"\w+", re.search(r"export const \{(.*?)\}=newest", hub, re.S).group(1)))
        self.assertEqual(pieces, listed)
        self.assertEqual(pieces | {"SOCLE", "SOCLE_BUILD", "sameOrNewer"}, handed)
        # The compiled tab went through hub.ts (hub-plugin.mjs in build.mjs), not straight to its own copy.
        self.assertIn("hubPieces", (ROOT / "frontend" / "build.mjs").read_text(encoding="utf-8"))
        self.assertIn("hestiaSocleUi", (FRONTEND / "panel.js").read_text(encoding="utf-8"))

    def test_the_fonts_are_served(self):
        for weight in (400, 500, 600, 700):
            self.assertTrue((FRONTEND / f"manrope-{weight}.ttf").is_file(), weight)
            # Socle 1.23: the hub asks for the light woff2 first.
            self.assertTrue((FRONTEND / f"manrope-{weight}.woff2").is_file(), weight)

    def test_the_hub_scripts_are_served_compressed(self):
        # Socle 1.23: Home Assistant serves the `.gz` beside a script to the browsers that accept it; an old one would be served
        # instead of the new script.
        import gzip
        # Socle 1.23: the pieces loaded when needed (hub-<sum>.js) too.
        for name in ("hestia-socle.js", "panel.js", *(p.name for p in FRONTEND.glob("hub-*.js"))):
            copy = FRONTEND / f"{name}.gz"
            self.assertTrue(copy.is_file(), f"{name}.gz : relancer node build.mjs")
            self.assertEqual(gzip.decompress(copy.read_bytes()), (FRONTEND / name).read_bytes(), f"{name}.gz : relancer node build.mjs")


if __name__ == "__main__":
    unittest.main()
