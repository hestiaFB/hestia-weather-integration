// What the « Météo » tab receives from Hestia Weather (panel.py, draft.py), in the panel's language.
import {t,fr} from './socle/i18n';
export interface Hass {callWS<T>(msg:Record<string,unknown>):Promise<T>;themes?:{darkMode?:boolean};language?:string}
export interface Entity {id:string;name:string;state:string;available:boolean;missing:boolean}
export interface Field {key:string;label:string;help:string;value:string;entity:Entity|null;need:string;options:Entity[];warning:string;better:Entity|null;recognized:string[]}
export interface Choice {value:string;label:string;hint?:string;available?:boolean}
// The technical state of a place (engine/health.py): orange (bad) stops something, tip could be better, none is not used.
export type Level='ok'|'bad'|'tip'|'none';
export interface Line {level:Level;text:string;why:string;stage:number|null}
export interface Health {title:string;level:'ok'|'action';summary:string;tips_summary:string;todo:Line[];tips:Line[];
 technical?:Technical;
 sources:{key?:string;label:string;level:Level;text:string}[];version?:string;sensors:{label:string;name:string;level:Level;text:string}[];entities:Line[];versions:Line[]}
export interface Technical {
 station:{name:string;responding:number;configured:number;history:boolean;history_sources:number|null};
 forecast:{hours:number|null;days:number|null;received:string|null};computation:string|null;
 entities:{active:number;with_value:number;total:number};integration:string;links:string[];interface_version:number;
}
export interface Extension {id:string;name:string;description:string;installed:boolean;configured:boolean;online?:boolean;detail?:string;air_configured?:boolean;pollen_configured?:boolean;stage:number;field:string;url:string;integration:string;install:string}
// A Hestia brick: Hestia Confort keeps the link, Hestia Weather reads and changes it through Confort's interface.
export interface Official {id:string;name:string;official:true;installed:boolean;linked:boolean;elsewhere:string;switchable:boolean;description:string;url:string}
export interface Place {entry_id:string;title:string;loaded:boolean;failed:boolean;health:Health;extensions?:Extension[];official?:Official[]}
export interface Places {places:Place[];can_add:boolean;extensions?:Extension[]}
export interface Species extends Entity {label:string;chosen:boolean}
export interface EntityItem {key:string;name:string;hint:string;enabled:boolean;need:string;optional?:boolean}
export interface Family {key:string;name:string;hint?:string;chosen?:boolean;entities?:EntityItem[]}
export interface View {
 title:string;
 extensions?:Extension[];
 in_draft?:Extension[];
 official?:Official[];
 prevision:{fields:Field[];location:string;location_placeholder:string;advanced:Field[];forecast_source:string};
 station:{model:string;models:Choice[];device:string;devices:Choice[];profile:string;history:boolean;history_help:string;groups:{name:string;title:string;fields:Field[]}[]};
 air:{value:string;sources:Choice[];area:string;areas:Choice[];station:string;stations:Choice[]};
 pollen:{value:string;sources:Choice[];area:string;areas:Choice[];species:Species[];risk:Field|null;station:string;stations:Choice[]};
 entities:{new:boolean;families:Family[]};
 summary:{weather:string;station:string;air:string;pollen:string};
 needs:string[];
}
export type Sources=Record<string,unknown>;
export interface DraftReply {draft:Sources;view:View;error:string}
export type Change={op:string;key?:string;value?:unknown;area?:string};
// Renaming the « niak_weather… » entities « hestia_weather… » (migration.py): what it would change, then what it changed.
export interface RenameUse {kind:'automation'|'script'|'scene'|'dashboard'|'helper'|'file';name:string;lines?:number[]}
export interface RenamePreview {entities:{from:string;to:string}[];taken:string[];auto:RenameUse[];manual:RenameUse[];undo:boolean;renamed_at:string|null}
export interface RenameReply {done:{entities:number;files:number;dashboards:number;helpers:number};preview:RenamePreview}

export const NONE='none';
export const stages=[fr('Sources météo'),fr('Station météo · capteurs locaux'),fr('Qualité de l’air'),fr('Pollens'),fr('Entités'),fr('Récapitulatif'),fr('Eau et jardin'),fr('Extensions')];
// What each step is for, shown on top of it in a frame that folds: one idea per line.
export const intros:string[][]=[
 [fr('Les prévisions du lieu viennent d’un service météo installé dans Home Assistant, Météo-France par exemple.'),
  fr('C’est la seule source obligatoire : sans elle, pas de carte.'),
  fr('Hestia Weather propose celle qu’il trouve ; vérifiez qu’elle correspond bien à votre lieu.')],
 [fr('Ce que vos propres capteurs mesurent chez vous : température, pluie, vent…'),
  fr('Leurs mesures passent avant celles du service météo, plus loin de chez vous.'),
  fr('Facultatif : sans station, la carte s’appuie sur les prévisions seules.')],
 [fr('L’indice de qualité de l’air du jour et ses polluants, pour votre zone.'),
  fr('Une précaution régionale, pas une mesure à vos fenêtres.'),
  fr('Choisissez la source, puis sa zone. Facultatif.')],
 [fr('Le niveau des pollens par espèce, pour anticiper les allergies.'),
  fr('Choisissez la source, puis les espèces qui vous concernent. Facultatif.')],
 [fr('Les entités que Hestia Weather crée dans Home Assistant, rangées par famille.'),
  fr('Elles servent à vos automatisations et tableaux de bord ; la carte n’en a pas besoin.')],
 [fr('Tout ce que vous avez choisi, onglet par onglet.'),
  fr('Rien ne change tant que vous n’avez pas enregistré ; un oubli, revenez à l’onglet voulu.')],
 [fr('Les restrictions d’eau de votre commune viennent de Vigieau.'), fr('Choisissez ici le capteur de la zone d’eau du robinet (AEP). Facultatif.')],
 [fr('Les autres briques Hestia et les intégrations de Home Assistant dont ce lieu se sert.'),
  fr('Une brique Hestia se relie ici ou dans ses propres réglages : coupée d’un côté, elle l’est des deux.'),
  fr('Une extension tierce s’allume ou s’éteint ici ; son onglet sert à la régler.')],
];

// The entities switched on, by key, as the « Entités » step shows them.
export function enabledKeys(view:View):string[]{
 return view.entities.new?[]:view.entities.families.flatMap(f=>(f.entities??[]).filter(e=>e.enabled).map(e=>e.key));
}
// Where a value came from, for an existing place: what Hestia proposes differs from what was saved, and was not touched.
export function provenance(key:string,value:string,saved:Sources|undefined,touched:Set<string>):string{
 if(!saved||touched.has(key)||!value)return '';
 return (saved[key]??'')===value?'':t('Proposé par Hestia : vérifiez-le avant d’enregistrer.');
}
export function sameSet(a:string[],b:string[]){return a.length===b.length&&a.every(x=>b.includes(x));}
export function entityLine(e:Entity|null){
 if(!e)return '';
 if(e.missing)return `${e.id} · ${t('introuvable')}`;
 return e.state?`${e.state} · ${e.id}`:e.id;
}
// A field's choices: those recognised by name and measure first, when there are some among many.
export function grouped(f:Pick<Field,'options'|'recognized'>):{label:string;options:Entity[]}[]{
 const first=f.options.filter(o=>f.recognized.includes(o.id)),rest=f.options.filter(o=>!f.recognized.includes(o.id));
 return first.length&&rest.length?[{label:t('Reconnus'),options:first},{label:t('Autres capteurs'),options:rest}]:[{label:'',options:f.options}];
}
export function capital(text:string){return text.charAt(0).toUpperCase()+text.slice(1);}

export interface ExtensionGroup {key:string;label:string;items:Extension[]}
// Atmo can serve both subjects: each occurrence opens the matching settings and reports its own saved selection.
export function extensionGroups(items:Extension[]):ExtensionGroup[]{
 const atmo=items.find(e=>e.id==='atmo');
 const subject=(key:'air'|'pollen',stage:number)=>atmo?[{...atmo,id:'atmo-'+key,stage,
  configured:(key==='air'?atmo.air_configured:atmo.pollen_configured)??atmo.configured,
  description:key==='air'?t('Qualité de l’air de votre commune.'):t('Pollens de votre commune, aujourd’hui et demain.')}]:[];
 return [
  {key:'weather',label:t('Sources météo'),items:items.filter(e=>e.id==='meteo_france'||e.id==='open_meteo')},
  {key:'air',label:t('Qualité de l’air'),items:[...subject('air',2),...items.filter(e=>e.id==='waqi')]},
  {key:'pollen',label:t('Pollens'),items:[...subject('pollen',3),...items.filter(e=>['polleninformation','irm_kmi','swiss_pollen','kleenex_pollenradar'].includes(e.id))]},
  {key:'water',label:t('Eau et jardin'),items:items.filter(e=>e.id==='vigieau')},
  {key:'storm',label:t('Orages et éclairs'),items:items.filter(e=>e.id==='blitzortung')},
 ].filter(g=>g.items.length);
}

// What a third-party extension's switch shows and the draft changes that turn it on or off for this place.
// Météo-France is the one source every place needs: it has no switch.
export interface ExtensionSwitch {shown:boolean;checked:boolean;available:boolean;on:Change[];off:Change[];uses:string[]}
export function extensionSwitch(e:Extension,v:View):ExtensionSwitch{
 const air=v.air.sources.find(c=>c.value===e.id),pollen=v.pollen.sources.find(c=>c.value===e.id);
 const atmoAir=v.air.sources.find(c=>c.value==='atmo'),atmoPollen=v.pollen.sources.find(c=>c.value==='atmo');
 const field=e.field?v.prevision.fields.find(f=>f.key===e.field):undefined;
 const uses=e.id==='atmo'?[e.air_configured?t('Qualité de l’air'):'',e.pollen_configured?t('Pollens'):''].filter(Boolean)
  :e.configured?[extensionGroups([e]).map(g=>g.label)[0]??''].filter(Boolean):[];
 const base={shown:e.installed&&e.id!=='meteo_france',checked:e.configured,uses};
 // Open-Meteo, an online service asked directly: its switch only allows the pressure to come (tomorrow's air follows WAQI).
 if(e.id==='open_meteo')return {...base,uses:e.configured?[t('Pression à venir')]:[],available:true,
  on:[{op:'set',key:'open_meteo_pressure',value:true}],off:[{op:'set',key:'open_meteo_pressure',value:false}]};
 // Atmo France under one theme (extensionGroups): its switch sets that theme only, air or pollens.
 if(e.id==='atmo-air'||e.id==='atmo-pollen'){const subject=e.id==='atmo-air'?v.air:v.pollen,op=e.id==='atmo-air'?'air':'pollen',c=subject.sources.find(x=>x.value==='atmo');
  return {...base,uses:e.configured?[op==='air'?t('Qualité de l’air'):t('Pollens')]:[],available:!!c&&c.available!==false,
   on:subject.value!=='atmo'?[{op,value:'atmo'}]:[],off:subject.value==='atmo'?[{op,value:NONE}]:[]};}
 if(e.id==='atmo'){const ok=(c?:Choice)=>!!c&&c.available!==false;
  return {...base,available:ok(atmoAir)||ok(atmoPollen),
   on:[...(ok(atmoAir)&&v.air.value!=='atmo'?[{op:'air',value:'atmo'}]:[]),...(ok(atmoPollen)&&v.pollen.value!=='atmo'?[{op:'pollen',value:'atmo'}]:[])],
   off:[...(v.air.value==='atmo'?[{op:'air',value:NONE}]:[]),...(v.pollen.value==='atmo'?[{op:'pollen',value:NONE}]:[])]};}
 if(air)return {...base,available:air.available!==false,on:[{op:'air',value:e.id}],off:v.air.value===e.id?[{op:'air',value:NONE}]:[]};
 if(pollen)return {...base,available:pollen.available!==false,on:[{op:'pollen',value:e.id}],off:v.pollen.value===e.id?[{op:'pollen',value:NONE}]:[]};
 if(field){const pick=field.better?.id??field.options[0]?.id;
  return {...base,available:!!pick||!!field.value,on:pick?[{op:'set',key:field.key,value:pick}]:[],off:[{op:'set',key:field.key,value:''}]};}
 return {...base,shown:false,available:false,on:[],off:[]};
}
