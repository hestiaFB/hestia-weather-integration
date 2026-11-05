import {build} from 'esbuild';
import {readFileSync, writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
// The tab takes the socle's pieces from the newest copy on the page (socle 1.22, socle/hub.ts).
import {hubPieces} from './socle/hub-plugin.mjs';
await build({entryPoints:['panel.ts'],bundle:true,format:'esm',target:'es2022',minify:true,plugins:[hubPieces],
  outfile:'../custom_components/hestia_weather/frontend/panel.js',legalComments:'none',loader:{'.css':'text'}});
// Shared « Hestia-FB » panel (socle), copied from hestia-ecosysteme/socle/ by its copier.sh.
await build({entryPoints:['socle/shell.ts'],bundle:true,format:'esm',target:'es2022',minify:true,
  outfile:'../custom_components/hestia_weather/frontend/hestia-socle.js',legalComments:'none'});
// Their gzip copies, served by Home Assistant to the browsers that accept them (tests/test_frontend_gzip.py).
for (const name of ['panel.js', 'hestia-socle.js']) {
  const out = `../custom_components/hestia_weather/frontend/${name}`;
  writeFileSync(`${out}.gz`, gzipSync(readFileSync(out), {level: 9}));
}
