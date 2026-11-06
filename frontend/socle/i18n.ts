// The hub's words follow Home Assistant's language (socle 1.13). French is the source: each text is written in French in
// the code, and `t()` gives it in the user's language from that language's dictionary, French when it lacks one.
// Each brick adds its own dictionary (addDictionary) to the hub's; any language without one reads English, and a word
// a dictionary lacks (a brick with no German, say) is read in English too (socle 1.17).
// Since socle 1.23 a dictionary is only loaded for a Home Assistant in its language: French needs none, and the English and
// German words no longer weigh on every page (PLAN-OPTIMISATION-HUB.md, point 10). When words arrive, the event
// `hestia-words` asks the pages to draw again; `wordsReady()` waits for them.

type Words=Record<string,string>;
type Loader=()=>Promise<Words>;
const LOADERS:Record<string,Loader[]>={en:[()=>import('./i18n-en').then(m=>m.SOCLE_EN)],de:[()=>import('./i18n-de').then(m=>m.SOCLE_DE)]};
const DICTIONARIES:Record<string,Words>={};
const loading:Record<string,Promise<void>|undefined>={};
let language='fr';

/** A brick's words for a language, beside the hub's: the words themselves, or (socle 1.23) how to load them when needed. */
export function addDictionary(lang:string,words:Words|Loader){
 if(typeof words==='function'){(LOADERS[lang]??=[]).push(words);loading[lang]=undefined;if(wanted().includes(lang))void load(lang);}
 else DICTIONARIES[lang]={...DICTIONARIES[lang],...words};
}
/** The languages the current one reads: itself, and English for a word it lacks. */
const wanted=()=>language==='fr'?[]:language==='en'?['en']:[language,'en'];
function load(lang:string):Promise<void>{
 return loading[lang]??=Promise.all((LOADERS[lang]??[]).map(f=>f())).then(parts=>{
  // The words given at once (addDictionary with words) stay above those loaded, as when everything was given at once.
  DICTIONARIES[lang]=Object.assign({},...parts,DICTIONARIES[lang]);
  if(typeof window!=='undefined')window.dispatchEvent(new Event('hestia-words'));
 },()=>{loading[lang]=undefined;});
}
/** Resolves once the words of the current language are there. */
export const wordsReady=():Promise<void>=>Promise.all(wanted().map(load)).then(()=>undefined);
/** Home Assistant's language (hass.language); true when it changed. */
export function setLanguage(lang?:string|null):boolean{
 const code=(lang??'').toLowerCase().split('-')[0];
 const next=code==='fr'||!code?'fr':DICTIONARIES[code]||LOADERS[code]?code:'en';
 const changed=next!==language;language=next;
 if(changed)void wordsReady();
 return changed;
}
export const currentLanguage=()=>language;
/** The locale numbers and dates are written in. */
export const currentLocale=()=>language==='fr'?'fr-FR':language;
/** A French text in the user's language, else in English; `{name}` takes the value of `vars.name`. */
export function t(french:string,vars?:Record<string,string|number>):string{
 const text=language==='fr'?french:DICTIONARIES[language]?.[french]??DICTIONARIES.en?.[french]??french;
 return vars?text.replace(/\{(\w+)\}/g,(all,name:string)=>name in vars?String(vars[name]):all):text;
}
/** Marks a French text kept in a list and translated where it is shown: the dictionary test finds it there too. */
export const fr=(text:string)=>text;
