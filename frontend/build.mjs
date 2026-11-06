import {build} from 'esbuild';
// The tab takes the socle's pieces from the newest copy on the page (socle 1.22, socle/hub.ts).
import {hubPieces} from './socle/hub-plugin.mjs';
// Socle 1.23: pieces loaded when needed (the English and German words), then the gzip copy beside each script
// (tests/test_frontend_gzip.py).
import {DECOUPE,nettoyer,compresser} from './socle/compresser.mjs';
const out='../custom_components/hestia_weather/frontend';
nettoyer(out);
await build({entryPoints:{panel:'panel.ts'},...DECOUPE,outdir:out,bundle:true,target:'es2022',minify:true,plugins:[hubPieces],
  legalComments:'none',loader:{'.css':'text'}});
// Shared « Hestia-FB » panel (socle), copied from hestia-ecosysteme/socle/ by its copier.sh.
await build({entryPoints:{'hestia-socle':'socle/shell.ts'},...DECOUPE,outdir:out,bundle:true,target:'es2022',minify:true,legalComments:'none'});
compresser(out,['panel.js','hestia-socle.js']);
