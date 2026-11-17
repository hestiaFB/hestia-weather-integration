// The installation guide of a place: every setting of the « Météo » tab, one question a screen, saved once at the end.
// It works on the same draft as the place's tabs (draft.py): the same commands, the same checks, nothing more on Weather's side.
// For now it lives beside the tabs; it is built to replace them one day: each topic says whether it is complete (topicDone),
// so that a line of « À régler » can open the right screen of the guide.
import {html,nothing,type TemplateResult} from 'lit';
import {t,fr} from './socle/ui';
import {questions,unanswered,type PlaceKey} from './emplacement';
import {NONE,type View,type Sources,type Field} from './model';

export type GuideTopic='welcome'|'place'|'station'|'sensors'|'emplacement'|'alerts'|'air'|'pollens'|'bricks'|'entities'|'recap';
/** One screen of the guide; the station's place takes one screen per question asked (emplacement.ts). */
export interface GuideScreen {key:string;topic:GuideTopic;question?:PlaceKey}

/** The name of each topic, on top of its screens and in the guide's summary. */
export const TOPICS:Record<GuideTopic,string>={welcome:fr('Bienvenue'),place:fr('Le lieu'),station:fr('La station'),sensors:fr('Les capteurs'),
 emplacement:fr('Où est la station'),alerts:fr('Alertes et risques'),air:fr('L’air'),pollens:fr('Les pollens'),bricks:fr('Les autres briques'),
 entities:fr('Les entités'),recap:fr('Récapitulatif')};
// The question each topic asks, and why, in one or two lines (the station's place has its own, in emplacement.ts).
const ASK:Record<Exclude<GuideTopic,'welcome'|'emplacement'|'recap'>,[string,string]>={
 place:[fr('D’où viennent les prévisions ?'),fr('D’un service météo installé dans Home Assistant, Météo-France par exemple. C’est la seule étape obligatoire.')],
 station:[fr('Avez-vous une station météo ?'),fr('Ses mesures, prises chez vous, passent avant celles du service météo. Sans station, la carte s’appuie sur les prévisions seules.')],
 sensors:[fr('Vérifions les capteurs de la station'),fr('Hestia Weather a reconnu ceux qu’il a pu. Il ne vous demande que ceux qui manquent ou qui sont à vérifier.')],
 alerts:[fr('Quelles alertes suivre ?'),fr('La vigilance, la saison, les orages, les feux, les crues et les restrictions d’eau. Toutes sont facultatives : Hestia Weather propose ce qu’il trouve.')],
 air:[fr('Suivre la qualité de l’air ?'),fr('L’indice du jour pour votre zone : une précaution régionale, pas une mesure à vos fenêtres. Facultatif.')],
 pollens:[fr('Suivre les pollens ?'),fr('Le niveau par espèce, pour anticiper les allergies. Facultatif.')],
 bricks:[fr('Relier les autres briques Hestia-FB ?'),fr('Hestia Confort compare vos pièces au dehors de ce lieu. Hestia Énergie lit Hestia Weather toute seule : rien à régler ici.')],
 entities:[fr('Quelles entités créer ?'),fr('Elles servent à vos automatisations et à vos tableaux de bord ; la carte n’en a pas besoin.')],
};
export const askOf=(topic:GuideTopic):[string,string]=>{const a=(ASK as Record<string,[string,string]>)[topic];return a?[t(a[0]),t(a[1])]:['',''];};

/** The fields of « Alertes et risques », in the order they are shown: from the Sources tab, and the water's tab. */
export const ALERT_KEYS=['vigilance_entity','season_entity','lightning_entity','fire_entity','river_entity','water_restriction_entity'];
export function alertFields(v:View):Field[]{return ALERT_KEYS.map(k=>v.prevision.fields.find(f=>f.key===k)).filter((f):f is Field=>!!f);}
const hasStation=(v:View)=>v.station.model!==NONE;
/** A station sensor worth a look: missing, said to check, a better one found, or recognised but not chosen. */
export function toCheck(f:Field):boolean{return !!f.warning||!!f.entity?.missing||!!f.better||!f.value&&f.recognized.length>0;}
export function sensorsToCheck(v:View):Field[]{return v.station.groups.flatMap(g=>g.fields).filter(toCheck);}

/** The screens of the guide for this draft, in order. Without a station, neither its sensors nor its place. Worked out at
 *  every change: the place's questions depend on the answers (the wall only once the house is placed). */
export function guideScreens(v:View):GuideScreen[]{
 const one=(topic:GuideTopic):GuideScreen=>({key:topic,topic});
 const place=hasStation(v)&&v.station.place?questions(v.station.place).map(q=>({key:'emplacement:'+q.key,topic:'emplacement' as const,question:q.key})):[];
 return [one('welcome'),one('place'),one('station'),...(hasStation(v)?[one('sensors')]:[]),...place,
  one('alerts'),one('air'),one('pollens'),...(v.official?.length?[one('bricks')]:[]),one('entities'),one('recap')];
}
/** Whether a topic is complete for this draft: nothing left that Hestia-FB could use. « Facultatif » stays complete when
 *  nothing is there to choose. */
export function topicDone(topic:GuideTopic,v:View,d:Sources):boolean{
 const offered=(sources:{value:string;available?:boolean}[])=>sources.some(c=>c.value!==NONE&&c.available!==false);
 switch(topic){
  case 'place':return !!d.weather_entity;
  case 'sensors':return !hasStation(v)||!sensorsToCheck(v).length;
  case 'emplacement':return !hasStation(v)||!v.station.place||!unanswered(v.station.place);
  case 'alerts':return alertFields(v).every(f=>!!f.value||!f.options.length);
  case 'air':return v.air.value!==NONE||!offered(v.air.sources);
  case 'pollens':return v.pollen.value!==NONE||!offered(v.pollen.sources);
  case 'bricks':return (v.official??[]).every(o=>!o.installed||!o.switchable||o.linked);
  default:return true;
 }
}
/** The topics of the guide, once each, in order, with their state: the summary of the welcome screen. */
export function guideTopics(v:View,d:Sources):{topic:GuideTopic;done:boolean;first:string}[]{
 const seen=new Map<GuideTopic,string>();
 for(const s of guideScreens(v))if(!seen.has(s.topic))seen.set(s.topic,s.key);
 return [...seen].filter(([topic])=>topic!=='welcome'&&topic!=='recap').map(([topic,first])=>({topic,first,done:topicDone(topic,v,d)}));
}
/** The screen after or before this one; an unknown key (a question no longer asked) starts again from the welcome. */
export function nextScreen(v:View,key:string,step:1|-1):string{
 const list=guideScreens(v),at=list.findIndex(s=>s.key===key);
 return list[Math.max(0,Math.min(list.length-1,(at<0?0:at)+step))].key;
}

export interface GuideFrame {view:View;draft:Sources;at:string;busy:boolean;creating:boolean;title:string;body:unknown;
 go:(key:string)=>void;save:()=>void;skip?:()=>void}
/** A screen of the guide: where one is, the question and why, its body, then « Précédent », « Passer » and « Suivant »
 *  (« Enregistrer » at the end). The welcome screen gives the summary, each topic a line to jump to. */
export function guideFrame(o:GuideFrame):TemplateResult{
 const list=guideScreens(o.view),at=Math.max(0,list.findIndex(s=>s.key===o.at)),screen=list[at],last=at===list.length-1;
 const ready=screen.topic!=='place'||!!o.draft.weather_entity;
 const progress=html`<p class="pl-step">${t('Guide · {topic} · {n} sur {total}',{topic:t(TOPICS[screen.topic]),n:at+1,total:list.length})}</p>
  <div class="pl-progress" role="progressbar" aria-label=${t('Avancement du guide')} aria-valuemin="0" aria-valuemax=${list.length-1} aria-valuenow=${at}><i style=${`width:${at/(list.length-1)*100}%`}></i></div>`;
 const back=at?html`<button type="button" class="link" ?disabled=${o.busy} @click=${()=>o.go(list[at-1].key)}>‹ ${t('Précédent')}</button>`:nothing;
 const skip=o.skip&&!last&&screen.topic!=='welcome'&&screen.topic!=='place'?html`<button type="button" class="link" ?disabled=${o.busy} @click=${o.skip}>${screen.topic==='emplacement'?t('Je ne sais pas'):t('Passer')}</button>`:nothing;
 const next=last?html`<button type="button" class="primary" ?disabled=${o.busy||!o.draft.weather_entity} @click=${o.save}>${o.creating?t('Créer ce lieu'):t('Enregistrer')}</button>`
  :html`<button type="button" class="primary" ?disabled=${o.busy||!ready} @click=${()=>o.go(list[at+1].key)}>${at?t('Suivant'):t('Commencer')}</button>`;
 return html`<div class="pl-quiz gd-guide">${progress}${o.body}<p class="pl-foot">${back}<span class="pl-sp"></span>${skip}${next}</p></div>`;
}
/** The welcome screen: what the guide does, then its topics, each a line to jump to, a mark when complete. */
export function welcome(o:{view:View;draft:Sources;creating:boolean;title:string;busy:boolean;go:(key:string)=>void}):TemplateResult{
 const topics=guideTopics(o.view,o.draft),left=topics.filter(x=>!x.done).length;
 return html`<h2 class="pl-title">${o.creating?t('Installons votre lieu météo'):t('Le guide de « {name} »',{name:o.title})}</h2>
  <p class="muted">${t('Une question à la fois, avec la raison de chacune. Rien n’est enregistré avant la dernière étape.')}</p>
  <p class="muted">${o.creating?t('Hestia Weather a déjà proposé ce qu’il a trouvé dans Home Assistant : vérifiez, corrigez, passez.')
   :left?(left>1?t('{n} étapes peuvent encore servir à ce lieu.',{n:left}):t('{n} étape peut encore servir à ce lieu.',{n:left})):t('Tout est déjà réglé : le guide permet de tout revoir.')}</p>
  <ol class="gd-topics">${topics.map(x=>html`<li><button type="button" class=${x.done?'gd-done':'gd-left'} ?disabled=${o.busy} @click=${()=>o.go(x.first)}>
   <span class="gd-mark" aria-hidden="true">${x.done?'✓':''}</span><span>${t(TOPICS[x.topic])}</span><small>${x.done?t('fait'):t('à voir')}</small></button></li>`)}</ol>`;
}
