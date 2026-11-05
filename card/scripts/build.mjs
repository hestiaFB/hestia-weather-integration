import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { haCardBuild } from './ha-card-build.mjs';

await build({
  entryPoints: ["src/hestia-weather-card.ts"],
  bundle: true,
  ...haCardBuild,
  target: "es2022",
  minify: true,
  sourcemap: false,
  // Built straight into the integration, which serves the card on every dashboard.
  outfile: "../custom_components/hestia_weather/frontend/hestia-weather-card.js",
  legalComments: "none",
});

// Beside it, its gzip copy: Home Assistant serves it to every browser that accepts it (290 ko → 88 ko),
// tests/test_frontend_gzip.py checks the two never differ (docs/PLAN-OPTIMISATION.md, point 4).
const out = "../custom_components/hestia_weather/frontend/hestia-weather-card.js";
writeFileSync(`${out}.gz`, gzipSync(readFileSync(out), { level: 9 }));
