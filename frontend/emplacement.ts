import {html,nothing,type TemplateResult} from 'lit';
import {listSection,listRow,segmented,t,fr} from './socle/ui';

/** Where the station stands (docs/STATION-EMPLACEMENT.md, validated by Frank on 5 November 2026): what the sensors do not
 *  say, one question a screen, then the same answers in Station › Emplacement. « Je ne sais pas » is an answer (""), a
 *  missing key a question not asked yet. Hestia Weather says how far each measure can be trusted (engine/station_place.py). */
export type PlaceKey='station_side'|'station_wall'|'station_height'|'station_ground'|'station_shade'|'rain_gauge_shelter'|'wind_shelter';
export interface Trust {level:'ok'|'handled'|'watch';title:string;line:string;learned:string;now?:string;why?:string;value?:number|null}
export interface PlaceView {values:Partial<Record<PlaceKey,string|string[]>>;asked:PlaceKey[];trust:Record<string,Trust>}
export interface PlaceContext {view:PlaceView;busy:boolean;answer:(key:PlaceKey,value:string|string[]|null)=>void}

const DIRS=['n','ne','e','se','s','sw','w','nw'] as const;
type Dir=typeof DIRS[number];
// The rose as it is drawn: north on top, the house (or the station) in the middle.
const ROSE:(Dir|null)[]=['nw','n','ne','w',null,'e','sw','s','se'];
const SHORT:Record<Dir,string>={n:fr('N'),ne:fr('NE'),e:fr('E'),se:fr('SE'),s:fr('S'),sw:fr('SO'),w:fr('O'),nw:fr('NO')};
const SIDE:Record<Dir,string>={n:fr('Côté nord'),ne:fr('Côté nord-est'),e:fr('Côté est'),se:fr('Côté sud-est'),s:fr('Côté sud'),sw:fr('Côté sud-ouest'),w:fr('Côté ouest'),nw:fr('Côté nord-ouest')};
const OPPOSITE:Record<Dir,Dir>={n:'s',ne:'sw',e:'w',se:'nw',s:'n',sw:'ne',w:'e',nw:'se'};
const isDir=(v:unknown):v is Dir=>typeof v==='string'&&(DIRS as readonly string[]).includes(v);
// Which measure's trust each question speaks of (État › Fiabilité de la station).
const MEASURE:Record<PlaceKey,string>={station_side:'temperature',station_wall:'temperature',station_height:'temperature',station_ground:'temperature',
 station_shade:'sun',rain_gauge_shelter:'rain',wind_shelter:'wind'};

interface Asked {key:PlaceKey;title:string;short:string;why:string;choices:[string,string,string?][]}
function all():Asked[]{return [
 {key:'station_side',title:t('Où est la station ?'),short:t('Où est la station'),why:t('Hestia-FB saura quand le soleil chauffe le mur près d’elle.'),
  choices:[...DIRS.map(d=>[d,t(SIDE[d])] as [string,string]),['roof',t('Sur le toit')],['open',t('Loin de la maison, au jardin')]]},
 {key:'station_wall',title:t('À quelle distance du mur ?'),short:t('Distance du mur'),why:t('Contre un mur au soleil, le thermomètre monte trop.'),
  choices:[['against',t('Contre le mur'),t('moins de 1 m')],['near',t('De 1 à 3 m')],['far',t('Plus loin')]]},
 {key:'station_height',title:t('À quelle hauteur ?'),short:t('Hauteur'),why:t('Près du sol, les nuits claires paraissent plus froides.'),
  choices:[['low',t('Moins de 1,5 m')],['standard',t('De 1,5 à 2 m'),t('la hauteur conseillée')],['high',t('Plus haut')]]},
 {key:'station_ground',title:t('Qu’y a-t-il sous la station ?'),short:t('Le sol dessous'),why:t('Une dalle au soleil chauffe l’air autour.'),
  choices:[['grass',t('Herbe ou terre')],['gravel',t('Gravier')],['paving',t('Dalle, terrasse ou bitume')]]},
 {key:'station_shade',title:t('Le soleil arrive-t-il sur la station ?'),short:t('Le soleil'),why:t('Hestia-FB ne prendra pas l’ombre pour un nuage.'),
  choices:[['never',t('Plein soleil')],['morning',t('À l’ombre le matin')],['afternoon',t('À l’ombre l’après-midi')],['always',t('Presque toujours à l’ombre')]]},
 {key:'rain_gauge_shelter',title:t('Le pluviomètre est-il à l’abri ?'),short:t('Le pluviomètre'),why:t('À l’abri, il recueille moins de pluie.'),
  choices:[['open',t('À découvert')],['tree',t('Sous un arbre')],['eave',t('Près d’un mur ou sous un avant-toit')]]},
 {key:'wind_shelter',title:t('Autour de la station, d’où le vent arrive-t-il librement ?'),short:t('Le vent autour de la station'),
  why:t('Un côté gêné par la maison, une haie ou un mur : Hestia-FB y prendra le vent prévu.'),choices:[]},
];}
/** The questions this station asks, in order (engine/station_place.asked). */
export function questions(v:PlaceView):Asked[]{return all().filter(q=>v.asked.includes(q.key));}
export function unanswered(v:PlaceView):number{return v.asked.filter(k=>!(k in v.values)).length;}

/** The side of the house, once the station is said against or near its wall: the wind is hindered from there. */
function houseSide(v:PlaceView):Dir|null{const side=v.values.station_side,wall=v.values.station_wall;
 return isDir(side)&&(wall==='against'||wall==='near')?OPPOSITE[side]:null;}
function hindered(v:PlaceView):Dir[]{const w=v.values.wind_shelter;
 if(Array.isArray(w))return w.filter(isDir);if(w==='')return [];const h=houseSide(v);return h?[h]:[];}
function windText(v:PlaceView):string{
 if(v.values.wind_shelter==='')return t('Je ne sais pas');
 const h=hindered(v);if(!h.length)return t('Dégagée de tous côtés');
 const open=DIRS.filter(d=>!h.includes(d)).map(d=>t(SHORT[d])).join(', '),shut=h.map(d=>t(SHORT[d])).join(', ');
 return open?t('Dégagée : {open} · gênée : {shut}',{open,shut}):t('Gênée de tous côtés');}

/** The rose: the house in the middle and the station around it (« Où est la station ? »), or the station in the middle and
 *  each side « dégagé » (blue) or « gêné » (dashed grey) around it, a tap changing it (the wind). */
function rose(o:PlaceContext,wind:boolean,small=false):TemplateResult{
 const v=o.view,h=hindered(v),house=houseSide(v),side=v.values.station_side;
 const cell=(d:Dir|null)=>{
  if(!d)return html`<span class="pl-mid" aria-hidden="true">${wind?t('la station'):t('la maison')}</span>`;
  if(!wind)return html`<button type="button" aria-pressed=${String(side===d)} ?disabled=${o.busy} aria-label=${t(SIDE[d])}
   @click=${()=>o.answer('station_side',d)}>${t(SHORT[d])}</button>`;
  const open=!h.includes(d),word=open?t('dégagé'):d===house?t('la maison'):t('gêné');
  return html`<button type="button" class=${open?'':'pl-shut'} aria-pressed=${String(open)} ?disabled=${o.busy} aria-label=${`${t(SIDE[d])} : ${word}`}
   @click=${()=>o.answer('wind_shelter',open?[...h,d]:h.filter(x=>x!==d))}>${t(SHORT[d])}${small?nothing:html`<small>${word}</small>`}</button>`;};
 return html`<div class=${`pl-rose${small?' pl-small':''}`} role="group" aria-label=${wind?t('Le vent autour de la station'):t('Où est la station')}>${ROSE.map(cell)}</div>`;
}

function learned(o:PlaceContext,key:PlaceKey):string{const x=o.view.trust[MEASURE[key]];return x?[x.line,x.learned].filter(Boolean).join(' '):'';}
function control(o:PlaceContext,q:Asked):TemplateResult{
 const v=o.view.values[q.key];
 if(q.key==='wind_shelter')return v===''||v===undefined
  ?html`<button type="button" class="link" ?disabled=${o.busy} @click=${()=>o.answer('wind_shelter',hindered(o.view))}>${t('Dire les côtés')}</button>`
  :html`${rose(o,true,true)}<span class="pl-sum">${windText(o.view)}</span>`;
 if(q.key==='station_side')return html`<select aria-label=${q.short} ?disabled=${o.busy} @change=${(e:Event)=>o.answer(q.key,(e.target as HTMLSelectElement).value)}>
  <option value="" ?selected=${!v}>${t('Je ne sais pas')}</option>${q.choices.map(([k,l])=>html`<option value=${k} ?selected=${v===k}>${l}</option>`)}</select>`;
 return segmented(q.short,q.choices.map(([k,l])=>[k,l] as [string,string]),typeof v==='string'&&v?v:undefined,x=>o.answer(q.key,x),o.busy);
}

/** Station › « Emplacement »: one or the other (Frank, 5 November: not the same thing twice on one page). Nothing answered
 *  yet: only the card that opens the questionnaire. Once one answer is given: the questions in rows, to change one's mind
 *  later; under each, what the nights learned. */
export function placeSection(o:PlaceContext&{quiz:()=>void}):TemplateResult{
 const left=unanswered(o.view),told=new Set<string>();
 const help=html`<p>${t('Ce que les capteurs ne disent pas. Hestia-FB s’en sert tout de suite pour savoir quand se méfier d’une mesure.')}</p>
  <p>${t('Chaque nuit, il compare la station à la prévision : ce qu’il apprend remplace vos réponses. « Je ne sais pas » laisse Hestia-FB apprendre seul.')}</p>`;
 if(!Object.keys(o.view.values).length)return listSection(t('Emplacement'),[listRow({name:t('Où est votre station ?'),label:html`<strong>${t('Où est votre station ?')}</strong>`,
  sub:left>1?t('{n} questions, une minute',{n:left}):t('{n} question, une minute',{n:left}),go:o.quiz})],{help});
 // What was learned of a measure is said once, under its first question (the temperature has four).
 const rows=questions(o.view).map(q=>{const v=o.view.values[q.key],said=v!==undefined&&v!=='',first=!told.has(MEASURE[q.key]),more=first?learned(o,q.key):'';
  told.add(MEASURE[q.key]);
  return listRow({name:q.short,label:q.short,sub:html`${q.why}${more?html`<br><span class="pl-learned">${more}</span>`:nothing}`,
   value:html`<span class="pl-ctl">${control(o,q)}${said?html`<button type="button" class="link pl-reset" ?disabled=${o.busy} @click=${()=>o.answer(q.key,'')}>${t('Rétablir : Je ne sais pas')}</button>`
    :html`<span class="pl-def">${t('Par défaut : Je ne sais pas')}</span>`}</span>`});});
 return listSection(t('Emplacement'),rows,{help});
}

/** The questionnaire: one question a screen, then « C'est noté ». */
export function quizScreen(o:PlaceContext&{step:number;go:(step:number)=>void;finish:()=>void;close?:()=>void;saves:boolean}):TemplateResult{
 const list=questions(o.view),v=o.view.values;
 if(o.step>=list.length)return html`<div class="pl-quiz"><div class="pl-done"><span class="pl-mark" aria-hidden="true">✓</span><h2>${t('C’est noté.')}</h2>
  <p class="muted">${t('Hestia-FB s’en sert tout de suite.')}<br>${t('Chaque nuit, il vérifie sur l’historique.')}<br>${t('Tout se change dans Station › Emplacement.')}</p></div>
  ${listSection('',list.map(q=>listRow({label:q.short,value:answerText(o.view,q)})))}
  <p class="pl-foot"><span class="pl-sp"></span>${o.close?html`<button type="button" @click=${o.close}>${t('Voir dans Station')}</button>`:nothing}
   <button type="button" class="primary" ?disabled=${o.busy} @click=${o.finish}>${o.saves?t('Enregistrer'):t('Terminer')}</button></p></div>`;
 const q=list[o.step],value=v[q.key];
 let body:TemplateResult;
 if(q.key==='station_side')body=html`<p class="pl-hint">${t('Touchez l’endroit de la station autour de la maison.')}</p>${rose(o,false)}<p class="pl-or">${t('ou')}</p>
  <div class="pl-choices">${q.choices.slice(8).map(([k,l])=>html`<button type="button" class="pl-choice" aria-pressed=${String(value===k)} ?disabled=${o.busy} @click=${()=>o.answer(q.key,k)}>${l}</button>`)}</div>`;
 else if(q.key==='wind_shelter')body=html`<p class="pl-hint">${t('Touchez un côté pour le passer de dégagé à gêné.')}</p>${rose(o,true)}
  <p class="pl-hint pl-center">${windText(o.view)}${houseSide(o.view)&&value===undefined?html`<br>${t('Le côté de la maison est déjà gêné.')}`:nothing}</p>`;
 else body=html`<div class="pl-choices">${q.choices.map(([k,l,s])=>html`<button type="button" class="pl-choice" aria-pressed=${String(value===k)} ?disabled=${o.busy}
  @click=${()=>o.answer(q.key,k)}><span>${l}${s?html`<small>${s}</small>`:nothing}</span></button>`)}</div>`;
 const ready=q.key==='wind_shelter'||(value!==undefined&&value!=='');
 return html`<div class="pl-quiz"><p class="pl-step">${t('Votre station · {n} sur {total}',{n:o.step+1,total:list.length})}</p>
  <div class="pl-progress" role="progressbar" aria-valuemin="0" aria-valuemax=${list.length} aria-valuenow=${o.step}><i style=${`width:${o.step/list.length*100}%`}></i></div>
  <h2 class="pl-title">${q.title}</h2><p class="muted">${q.why}</p>${body}
  <p class="pl-foot">${o.step?html`<button type="button" class="link" @click=${()=>o.go(o.step-1)}>‹ ${t('Précédent')}</button>`:nothing}<span class="pl-sp"></span>
   <button type="button" class="link" ?disabled=${o.busy} @click=${()=>{o.answer(q.key,'');o.go(o.step+1);}}>${t('Je ne sais pas')}</button>
   <button type="button" class="primary" ?disabled=${o.busy||!ready} @click=${()=>{if(q.key==='wind_shelter'&&!Array.isArray(value))o.answer(q.key,hindered(o.view));o.go(o.step+1);}}>
    ${o.step===list.length-1?t('Terminer'):t('Suivant')}</button></p></div>`;
}
function answerText(v:PlaceView,q:Asked):string{const x=v.values[q.key];
 if(q.key==='wind_shelter')return windText(v);
 return q.choices.find(c=>c[0]===x)?.[1]??t('Je ne sais pas');}

/** État › « Fiabilité de la station »: a mark and a sentence by measure; blue fiable, grey Hestia-FB s'en charge or à vérifier. */
export function trustSection(trust:Record<string,Trust>|undefined):TemplateResult|typeof nothing{
 const names:[string,string][]=[['temperature',t('Température')],['wind',t('Vent')],['rain',t('Pluie')],['sun',t('Soleil')]];
 const rows=names.filter(([k])=>trust?.[k]).map(([k,label])=>{const x=trust![k];
  return listRow({name:label,label,sub:html`${x.line}${x.learned?html`<br><span class="pl-learned">${x.learned}</span>`:nothing}`,
   value:html`<span class=${`pl-trust ${x.level}`}>${x.title}</span>`});});
 if(!rows.length)return nothing;
 return html`${listSection(t('Fiabilité de la station'),rows,{help:html`<p>${t('Une station près d’un mur, d’un arbre ou de la maison peut se tromper. Hestia-FB le dit ici, mesure par mesure, et prend la prévision quand il faut.')}</p>`})}
  <p class="hint pl-legend">${t('Bleu : fiable. Gris plein : Hestia-FB s’en charge, rien à faire. Gris creux : à vérifier.')}</p>`;
}
