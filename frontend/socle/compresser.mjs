// Socle 1.23: what every brick's frontend/build.mjs does the same way for the hub (PLAN-OPTIMISATION-HUB.md, points 8 and 10).
//   import {DECOUPE, nettoyer, compresser} from './socle/compresser.mjs';
//   nettoyer(dossier);                                       // the pieces of the previous build go
//   await build({entryPoints:{panel:'panel.ts'}, outdir:dossier, ...DECOUPE, …});   // and {'hestia-socle':'socle/shell.ts'}
//   compresser(dossier, ['panel.js', 'hestia-socle.js']);   // the gzip copy beside each script, its pieces included
// The pieces (`hub-<somme>.js`): what is only needed sometimes (the English and German words, a page few open) is loaded
// when needed. Home Assistant serves a `.js.gz` beside a script to the browsers that accept it (verified on the lab).
import {readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';

export const DECOUPE = {format: 'esm', splitting: true, chunkNames: 'hub-[hash]', entryNames: '[name]'};
const piece = name => /^hub-[A-Z0-9]+\.js(\.gz)?$/i.test(name);

export function nettoyer(folder) {
  for (const name of readdirSync(folder)) if (piece(name)) rmSync(join(folder, name));
}

export function compresser(folder, names) {
  const all = [...names, ...readdirSync(folder).filter(name => piece(name) && name.endsWith('.js'))];
  for (const name of all) writeFileSync(join(folder, `${name}.gz`), gzipSync(readFileSync(join(folder, name)), {level: 9}));
}
