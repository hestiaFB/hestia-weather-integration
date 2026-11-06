// The pieces of a brick's pages, from the newest copy of the socle loaded on the page (socle 1.22, ETAT-DES-LIEUX-HUB.md § 9).
// A brick's tab never imports ui.ts directly: hub-plugin.mjs sends its `./socle/ui` here. Under a newer hub, the brick's
// pages follow it without a new version of the brick; under an older one (the other brick took the panel), they keep
// their own copy. The words stay the brick's own: t(), addDictionary()… always come from its copy of i18n.ts.
import * as own from './ui';
export type * from './ui';
export {t,fr,setLanguage,addDictionary,currentLanguage,currentLocale,wordsReady} from './i18n';

// Every piece a page may use: a test checks it lists every export of ui.ts.
export const PIECES=['helpTip','defaultValue','frame','hubStyles','modernStyles','hubIcon','pageHead','line','todoLists','todoFrame',
 'itemsFrame','stepMenu','stepFooter','leaveNotice','extensionsFrame','versionsFrame','extensionCard','askUrl','detectedFrame',
 'removeBlock','noteBox','noteTag','listRow','listSection','kpis','saveBar','tabBar','numberField','segmented','toggle','moreRow',
 'motion','pageStyles','aboutPage','hassChanged'] as const;

const shared=(globalThis as {hestiaSocleUi?:typeof own}).hestiaSocleUi;
// ui.ts published the newest copy loaded so far, this one included; a copy lacking a piece is never taken.
const newest=shared&&shared!==own&&own.sameOrNewer(shared,own)&&PIECES.every(name=>name in shared)?shared:own;
export const {SOCLE,SOCLE_BUILD,sameOrNewer,helpTip,defaultValue,frame,hubStyles,modernStyles,hubIcon,pageHead,line,todoLists,todoFrame,
 itemsFrame,stepMenu,stepFooter,leaveNotice,extensionsFrame,versionsFrame,extensionCard,askUrl,detectedFrame,removeBlock,noteBox,
 noteTag,listRow,listSection,kpis,saveBar,tabBar,numberField,segmented,toggle,moreRow,motion,pageStyles,aboutPage,hassChanged}=newest;
