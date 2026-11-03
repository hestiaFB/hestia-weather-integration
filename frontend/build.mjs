import {build} from 'esbuild';
// The tab takes the socle's pieces from the newest copy on the page (socle 1.22, socle/hub.ts).
import {hubPieces} from './socle/hub-plugin.mjs';
await build({entryPoints:['panel.ts'],bundle:true,format:'esm',target:'es2022',minify:true,plugins:[hubPieces],
  outfile:'../custom_components/hestia_weather/frontend/panel.js',legalComments:'none',loader:{'.css':'text'}});
// Shared « Hestia » panel (socle), copied from hestia-ecosysteme/socle/ by its copier.sh.
await build({entryPoints:['socle/shell.ts'],bundle:true,format:'esm',target:'es2022',minify:true,
  outfile:'../custom_components/hestia_weather/frontend/hestia-socle.js',legalComments:'none'});
