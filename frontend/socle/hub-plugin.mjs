// esbuild: a brick's pages import the socle's pieces through hub.ts, the newest copy on the page (socle 1.22).
// Usage in the brick's frontend/build.mjs, for its tab only (never for the hub itself):
//   import {hubPieces} from './socle/hub-plugin.mjs';  build({…, plugins:[hubPieces]})
import {join} from 'node:path';

export const hubPieces={name:'hestia-hub-pieces',setup(build){
 // `./socle/ui` from a brick's file; inside socle/ (shell.ts, hub.ts) `./ui` stays the copy itself.
 build.onResolve({filter:/(^|\/)socle\/ui(\.ts)?$/},args=>({path:join(args.resolveDir,args.path.replace(/ui(\.ts)?$/,'hub.ts'))}));
}};
