// The « Météo » tab of the shared « Hestia-FB » panel: each place's settings, step by step, then saved at once.
// Hestia Weather computes everything (draft.py): this page shows the draft, sends each change and saves it.
import {LitElement,html,unsafeCSS,nothing,type TemplateResult,type PropertyValues} from 'lit';
import {customElement,property,state} from 'lit/decorators.js';
import styles from './styles.css';
import {frame,hubStyles,modernStyles,helpTip,pageHead,todoLists,listSection,listRow,moreRow,tabBar,saveBar,toggle,kpis,stepFooter,leaveNotice,detectedFrame,removeBlock,pageStyles,aboutPage,hassChanged,SOCLE,setLanguage,addDictionary,wordsReady,t,fr,type NkLine,type NkLevel} from './socle/ui';
import {placeSection,quizScreen,trustSection,questions as placeQuestions} from './emplacement';
import {NONE,stages,intros,extensionGroups,extensionSwitch,enabledKeys,provenance,sameSet,entityLine,grouped,capital,type Change,type Choice,type DraftReply,type Entity,type Field,type Hass,type Place,type Places,type Sources,type View,type Extension,type Official,type RenamePreview,type RenameReply,type RenameUse} from './model';

// Weather's words beside the hub's (socle 1.13): French in the code, English for any language without a dictionary.
// Loaded only for a Home Assistant in English or German (socle 1.23, PLAN-OPTIMISATION-HUB.md point 10).
addDictionary('en',()=>import('./i18n-en').then(m=>m.PANEL_EN));
addDictionary('de',()=>import('./i18n-de').then(m=>m.PANEL_DE));
const categories=['sources','station','air','pollens','entites','recapitulatif','eau-jardin','extensions','etat'];
// The extensions have their own page (socle 1.12): a place's steps no longer show them.
const order=[0,1,2,3,6,4,5];
// A place's tabs (socle 1.21, like a Confort room): its settings, then its state; a new place ends on « Récapitulatif ».
const sections=[{stage:0,label:fr('Sources')},{stage:1,label:fr('Station')},{stage:2,label:fr('Air')},{stage:3,label:fr('Pollens')},{stage:6,label:fr('Eau et jardin')},{stage:4,label:fr('Entités')},{stage:8,label:fr('État')}];
const createSections=order.map(stage=>sections.find(x=>x.stage===stage)??{stage,label:fr('Récapitulatif')});
const repository='https://github.com/hestiaFB/hestia-weather-integration';
const sectionStage=(section:string)=>categories.indexOf(section);
// The same words and colours as Hestia Confort's general settings: blue when used, orange when something is to do.
const extIcon:Record<string,string>={hestia_comfort:'home',meteo_france:'weather',open_meteo:'weather',atmo:'air',waqi:'air',vigieau:'pollen',blitzortung:'weather',polleninformation:'pollen',irm_kmi:'pollen',swiss_pollen:'pollen',kleenex_pollenradar:'pollen'};
const hacsUrl=(url:string)=>{const [owner,repository]=url.replace('https://github.com/','').split('/');return `https://my.home-assistant.io/redirect/hacs_repository/?owner=${owner}&repository=${repository}&category=integration`;};

@customElement('hestia-weather-setup')
export class WeatherSetup extends LitElement {
 static styles=[unsafeCSS(styles),hubStyles,modernStyles,pageStyles];
 @property({attribute:false}) hass?:Hass;
 @property({attribute:false}) route?:{prefix?:string;path:string};
 @property({type:Boolean}) narrow=false;
 @state() private places?:Places;
 @state() private entryId:string|null=null;
 @state() private editing=false;
 @state() private draft?:Sources;
 @state() private view?:View;
 @state() private stage=0;
 @state() private enabled:string[]=[];
 @state() private busy=false;
 @state() private error='';
 @state() private saved='';
 @state() private confirmLeave=false;
 @state() private placeTitle='';
 @state() private extensionId='';
 // The pages of every Hestia-FB brick (socle 1.21): its overview, its places, its settings, its extensions, and one place.
 @state() private page:'home'|'places'|'extensions'|'about'='home';
 // The Extensions page reads each place's draft: its switches change and save that place at once.
 @state() private extViews=new Map<string,{draft:Sources;view:View;enabled:string[]}>();
 @state() private confirmRemove=false;
 // The questionnaire of Station › Emplacement, one question a screen; null when not open.
 @state() private quizStep:number|null=null;
 // Where the questionnaire was opened: the overview (saved at its end, back to the overview) or the Station tab.
 private quizFrom:'home'|'station'='station';
 // Renaming the entities « hestia_weather » (Réglages généraux): read when the page opens, shown only to a home that has old ids.
 @state() private rename?:RenamePreview;
 @state() private renameShown=false;
 @state() private renameAsk=false;
 @state() private renameDone:string[]=[];
 private renameRead=false;
 private routeHandled:string|undefined;
 private routeGeneration=0;
 private drafts=new Map<string,{draft:Sources;view:View;stage:number;enabled:string[];error:string;initial:string;initialEnabled:string[];savedOptions?:Sources;touched:Set<string>;placeTitle:string}>();
 private initial='';
 private initialEnabled:string[]=[];
 private savedOptions?:Sources;
 private touched=new Set<string>();
 private generation=0;
 private beforeUnload=(e:BeforeUnloadEvent)=>{if(this.dirty()||[...this.drafts.values()].some(d=>JSON.stringify(d.draft)!==d.initial||!sameSet(d.enabled,d.initialEnabled))){e.preventDefault();e.returnValue='';}};
 // The words of a language arrive after the page (socle 1.23): drawn again with them.
 private words=()=>this.requestUpdate();
 connectedCallback(){super.connectedCallback();window.addEventListener('beforeunload',this.beforeUnload);window.addEventListener('hestia-words',this.words);}
 disconnectedCallback(){super.disconnectedCallback();this.routeGeneration++;if(this.busy)this.routeHandled=undefined;window.removeEventListener('beforeunload',this.beforeUnload);window.removeEventListener('hestia-words',this.words);}
 // Home Assistant hands a new `hass` at every change of state in the home: this tab shows none, it only redraws for its language,
 // its theme or a new connection (socle 1.23, PLAN-OPTIMISATION-HUB.md point 7).
 protected shouldUpdate(changed:PropertyValues){return !(changed.size===1&&changed.has('hass'))||hassChanged(changed.get('hass') as Hass|undefined,this.hass,[],this.hassSeen);}
 private hassSeen={};
 protected updated(changed:PropertyValues){
  // The hub's words (socle 1.13) follow Home Assistant's language.
  // Its places come back from Weather in the new language too: they are read again.
  if(setLanguage(this.hass?.language)){this.requestUpdate();if(this.places&&!this.busy)void this.load();}
  this.setAttribute('data-theme',this.hass?.themes?.darkMode===false?'light':'dark');
  if(this.hass&&!this.places&&!this.busy&&!this.error)void this.load();
  if(changed.has('route')&&this.places)void this.followRoute();
  // The entities' name is said on the overview while some keep the former one, and on « À propos » once renamed.
  if((this.page==='home'||this.page==='about')&&!this.editing&&this.hass&&!this.renameRead){this.renameRead=true;void this.readRename();}
 }
 /** A command of Weather, answered in the panel's language (engine/i18n.py). */
 private ws<T>(msg:Record<string,unknown>){return this.hass!.callWS<T>({...msg,language:this.hass!.language});}
 private message(e:unknown){return typeof e==='object'&&e&&'message' in e?String((e as {message:unknown}).message):t('Home Assistant ne répond pas. Réessayez.');}
 private async load(){
  this.busy=true;
  try{[this.places]=await Promise.all([this.ws<Places>({type:'hestia_weather/panel/places'}),wordsReady()]);this.error='';await this.followRoute();}
  catch(e){this.error=this.message(e);}
  finally{this.busy=false;}
  // A place restarting after a save: look again in a moment, a few times at most.
  if(this.places?.places.some(p=>!p.loaded&&!p.failed)&&this.retries<10){this.retries++;setTimeout(()=>{if(!this.editing)void this.load();},2000);}
  else this.retries=0;
 }
 private retries=0;
 private dirty(){return !!this.draft&&(JSON.stringify(this.draft)!==this.initial||!sameSet(this.enabled,this.initialEnabled));}
 /** How many settings differ from the saved place, for the save bar (socle 1.21). */
 private changeCount(){if(!this.draft||!this.initial)return 0;const before=JSON.parse(this.initial) as Record<string,unknown>,now=this.draft as unknown as Record<string,unknown>;
  return [...new Set([...Object.keys(before),...Object.keys(now)])].filter(k=>JSON.stringify(before[k])!==JSON.stringify(now[k])).length+(sameSet(this.enabled,this.initialEnabled)?0:1);}
 /** « Annuler »: the place as it is saved, read again. */
 private revert(){if(!this.entryId)return;this.drafts.delete(this.entryId);void this.open(this.entryId,this.stage,false);}
 private top(){this.scrollTop=0;this.renderRoot.querySelector('main')?.scrollIntoView?.({block:'start'});}

 private path(path:string){if(!this.isConnected)return;this.routeHandled=path?'/'+path:'';this.page=path==='lieux'?'places':path==='extensions'?'extensions':path==='a-propos'?'about':'home';history.pushState(null,'',(this.route?.prefix??'/hestia/meteo')+(path?'/'+path:''));window.dispatchEvent(new CustomEvent('location-changed'));}
 private remember(){if(this.draft&&this.view)this.drafts.set(this.entryId??'nouveau',{draft:this.draft,view:this.view,stage:this.stage,enabled:this.enabled,error:this.error,initial:this.initial,initialEnabled:this.initialEnabled,savedOptions:this.savedOptions,touched:this.touched,placeTitle:this.placeTitle});}
 private async followRoute(){
  const path=this.route?.path??'';if(path===this.routeHandled)return;this.routeHandled=path;this.routeGeneration++;
  // /reglages: the places to set; /<place>/<step>: one place, step by step (/nouveau/… for a new one).
  // Former addresses: /reglages/<step>/<place> and /<step> (the menu of 2.8) still lead to the same pages.
  const parts=path.split('/').filter(Boolean);this.remember();
  const legacy=parts[0]==='reglages'&&parts.length>=3,id=legacy?parts[2]:parts[0]&&!['reglages','lieux','a-propos'].includes(parts[0])&&!categories.includes(parts[0])?parts[0]:undefined;
  const stage=id?sectionStage((legacy?parts[1]:parts[1])??'sources'):-1;
  this.page=parts[0]==='extensions'||parts[1]==='extensions'?'extensions':!id&&parts[0]==='lieux'?'places':'home';
  // « À propos », a page of every brick's menu (socle 1.22).
  if(parts[0]==='a-propos'&&!parts[1]){this.page='about';this.editing=false;this.draft=undefined;this.view=undefined;return;}
  if(this.page==='extensions'){this.editing=false;this.draft=undefined;this.view=undefined;void this.loadExtensions();return;}
  const target=id;
  if(target&&target!=='nouveau'&&parts[1]==='emplacement'&&this.places?.places.some(p=>p.entry_id===target)){await this.openQuiz(target,false);return;}
  if(stage>=0&&target){
   const cached=this.drafts.get(target);if(cached){Object.assign(this,cached);this.entryId=target==='nouveau'?null:target;this.stage=stage;this.editing=true;return;}
   if(target==='nouveau'||this.places?.places.some(p=>p.entry_id===target)){await this.open(target==='nouveau'?null:target,stage,false);return;}
  }
  this.editing=false;this.draft=undefined;this.view=undefined;this.confirmLeave=false;this.error='';
 }
 // ---- Opening, changing, saving ----
 private async open(entryId:string|null,stage=0,route=true){
  const cached=this.drafts.get(entryId??'nouveau');if(route&&cached){Object.assign(this,cached);this.entryId=entryId;this.stage=stage;this.editing=true;this.path((entryId??'nouveau')+'/'+categories[stage]);return;}
  const generation=this.routeGeneration;
  this.busy=true;this.error='';this.saved='';
  try{
   const reply=await this.ws<DraftReply&{saved:Sources|null}>({type:'hestia_weather/panel/open',...(entryId?{entry_id:entryId}:{})});
   if(generation!==this.routeGeneration)return;
   this.placeTitle=this.places?.places.find(p=>p.entry_id===entryId)?.title??'';
   this.entryId=entryId;this.draft=reply.draft;this.view=reply.view;this.stage=stage;this.editing=true;this.touched=new Set();
   // Leaving asks first once something changed since opening; a new place always does.
   this.initial=entryId?JSON.stringify(reply.draft):'';
   this.savedOptions=reply.saved??undefined;
   this.enabled=enabledKeys(reply.view);this.initialEnabled=[...this.enabled];
   if(route)this.path((entryId??'nouveau')+'/'+categories[stage]);
   await this.updateComplete;this.top();
  }catch(e){this.error=this.message(e);}
  finally{this.busy=false;}
 }
 private async change(change:Change){
  if(!this.draft||this.busy)return;
  const generation=++this.generation,owner=this.entryId??'nouveau';this.busy=true;this.error='';
  if(change.key)this.touched.add(change.key);
  try{
   const reply=await this.ws<DraftReply>({type:'hestia_weather/panel/change',draft:this.draft,change,...(this.entryId?{entry_id:this.entryId}:{})});
   if(!this.editing||(this.entryId??'nouveau')!==owner){const cached=this.drafts.get(owner);if(cached)this.drafts.set(owner,{...cached,draft:reply.draft,view:reply.view,error:reply.error});return;}
   if(generation!==this.generation)return;
   this.draft=reply.draft;this.view=reply.view;this.error=reply.error;
  }catch(e){this.error=this.message(e);}
  finally{if(generation===this.generation)this.busy=false;}
 }
 private set(key:string,value:unknown){void this.change({op:'set',key,value});}
 private async save(){
  if(!this.draft)return;
  const generation=this.routeGeneration;this.busy=true;this.error='';
  try{
   await this.ws({type:'hestia_weather/panel/save',draft:this.draft,...(this.entryId?{entry_id:this.entryId,enabled:this.enabled}:{})});
   if(generation!==this.routeGeneration){this.places=undefined;return;}
   const title=this.view?.title??'',created=!this.entryId;
   this.close(this.quizFrom==='home'&&this.quizStep!==null?'':'lieux');
   this.saved=created?t('{name} est créé : ses entités apparaissent dans quelques secondes.',{name:title})
    :t('{name} est enregistré : le lieu redémarre avec ses nouveaux réglages, la carte suit dans quelques secondes.',{name:title});
   this.places=undefined;
  }catch(e){this.error=this.message(e);}
  finally{this.busy=false;}
 }
 /** « Supprimer ce lieu »: the place and its entities go; the station's sensors stay in Home Assistant. */
 private async removePlace(){
  if(!this.entryId)return;const title=this.placeTitle||this.view?.title||'';
  this.busy=true;this.error='';
  try{await this.ws({type:'hestia_weather/panel/remove',entry_id:this.entryId});this.confirmRemove=false;this.close();this.saved=t('« {name} » est supprimé. Les capteurs de votre station n’ont pas été touchés.',{name:title});this.places=undefined;}
  catch(e){this.error=this.message(e);}finally{this.busy=false;}
 }
 private close(to='lieux'){this.confirmRemove=false;this.quizStep=null;this.drafts.delete(this.entryId??'nouveau');this.path(to);this.editing=false;this.draft=undefined;this.view=undefined;this.confirmLeave=false;this.error='';void this.updateComplete.then(()=>{this.top();});}
 private leave(){if(this.dirty()&&!this.confirmLeave){this.confirmLeave=true;return;}this.close();}
 private go(stage:number){this.stage=stage;this.quizStep=null;this.path((this.entryId??'nouveau')+'/'+categories[stage]);void this.updateComplete.then(()=>{this.top();});}

 // ---- Pieces: each setting is a row, as in Confort (socle 1.21) ----
 /** An entity's state in the user's words: Home Assistant's own translation when it has one, never « partlycloudy ». */
 private stateText(o:Entity){const h=this.hass as (Hass&{states?:Record<string,unknown>;formatEntityState?:(s:unknown)=>string})|undefined,st=h?.states?.[o.id];
  try{return st&&h?.formatEntityState?h.formatEntityState(st):o.state;}catch{return o.state;}}
 /** The choices of one source (station, air, pollens): one row each, a radio on the right; one not yet installed says how to get it. */
 private choiceRows(name:string,choices:Choice[],value:string,pick:(v:string)=>void,extensions:Extension[]=[]){
  return choices.map(c=>{const e=extensions.find(e=>e.id===c.value||e.id==='atmo-'+name&&c.value==='atmo'),on=c.value===value,off=c.available===false,id=`c-${name}-${c.value}`;
   const why=off?(e&&!e.installed?html`${t('Pas encore installée')}${e.url?html` · <a href=${e.url} target="_blank" rel="noreferrer">${t('Comment l’installer')}</a>`:nothing}`:t('Aucune donnée détectée pour cette source')):'';
   return listRow({name:c.label,label:html`<label for=${id}>${on?html`<strong>${c.label}</strong>`:c.label}</label>`,sub:c.hint||why?html`${c.hint??''}${c.hint&&why?' · ':''}${why}`:undefined,
    value:html`<input type="radio" class="nk-radio" id=${id} name=${name} .checked=${on} ?disabled=${off||this.busy} @change=${()=>pick(c.value)}>`});});
 }
 /** An integration the step needs: a row only when it is missing or gives nothing. */
 private integrationRow(e:Extension|undefined,available=true){
  if(!e||e.installed&&available)return [];
  return [listRow({label:e.name,sub:e.installed?t('Aucune donnée détectée pour cette source'):e.install,
   value:html`<a href=${e.installed?'/config/integrations':e.url} target="_blank" rel="noreferrer">${e.installed?t('Appareils et services'):t('Comment l’installer')}</a>`})];
 }
 private refreshSources(){return html`<button class="link" ?disabled=${this.busy} @click=${()=>void this.change({op:'redetect',value:'weather'})}>${t('Actualiser la détection')}</button>`;}
 /** One entity to choose: its name and state in the list, what to check under the label; the help behind its ⓘ. */
 private field(f:Field):TemplateResult{
  const origin=provenance(f.key,f.value,this.savedOptions,this.touched);
  const opt=(o:Entity)=>{const st=this.stateText(o);return html`<option value=${o.id} ?selected=${o.id===f.value}>${o.name}${st?` · ${st}`:''}</option>`;};
  const select=html`<select aria-label=${f.label} ?disabled=${this.busy} @change=${(e:Event)=>this.set(f.key,(e.target as HTMLSelectElement).value)}>
   <option value="" ?selected=${!f.value}>${f.options.length?t('— Aucun —'):t('— Aucun capteur trouvé —')}</option>
   ${grouped(f).map(g=>g.label?html`<optgroup label=${g.label}>${g.options.map(opt)}</optgroup>`:g.options.map(opt))}</select>`;
  const missing=f.entity?.missing?t('{name} est introuvable.',{name:f.entity.name||f.entity.id}):'',warn=[missing,f.warning].filter(Boolean);
  const sub=warn.length||origin||f.better?html`${warn.map(x=>html`<span class="warn">${x}</span> `)}${origin?html`<span>${origin}</span> `:nothing}${f.better?html`<button class="link" ?disabled=${this.busy} @click=${()=>this.set(f.key,f.better!.id)}>${t('Choisir « {name} » à la place',{name:f.better.name})}</button>`:nothing}`:undefined;
  return listRow({name:f.label,label:html`${f.label}${f.help?helpTip(f.label,f.help,''):nothing}`,sub,level:warn.length?'todo':undefined,value:select});
 }
 private textRow(key:string,label:string,value:string,placeholder:string,help?:string){
  return listRow({name:label,label:html`${label}${help?helpTip(label,help,''):nothing}`,value:html`<input aria-label=${label} .value=${value} placeholder=${placeholder} ?disabled=${this.busy} @change=${(e:Event)=>this.set(key,(e.target as HTMLInputElement).value.trim())}>`});
 }
 private zoneRow(label:string,areas:Choice[],value:string,pick:(v:string)=>void,hint?:string){
  return listRow({name:label,label,sub:hint,value:html`<select aria-label=${label} ?disabled=${this.busy} @change=${(e:Event)=>pick((e.target as HTMLSelectElement).value)}>${areas.map(x=>html`<option value=${x.value} ?selected=${x.value===value}>${x.label}</option>`)}</select>`});
 }
 // What the step is for, behind one ⓘ.
 private intro(){return html`<div class="nk-step-help">${helpTip(t('Comprendre cette étape'),html`<ul>${intros[this.stage].map(line=>html`<li>${t(line)}</li>`)}</ul>`,t('À quoi sert cette étape ?'))}</div>`;}
 // The common bottom of a step (socle 1.12): back, « Continuer », and « Enregistrer » for a place that exists.
 private bottom(){
  const at=order.indexOf(this.stage),saveDisabled=this.busy||!this.draft?.weather_entity;
  if(this.entryId)return saveBar({count:this.changeCount(),busy:saveDisabled,cancel:()=>this.revert(),save:()=>void this.save()});
  return stepFooter({previous:at>0?{label:t('Étape précédente'),onClick:()=>this.go(order[at-1]),disabled:this.busy}:undefined,
   next:this.stage!==5?{label:t('Continuer'),onClick:()=>this.go(order[Math.min(at+1,order.length-1)]),disabled:this.busy}:undefined,
   save:this.stage===5?{label:t('Créer ce lieu'),onClick:()=>void this.save(),disabled:saveDisabled}:undefined});
 }

 // ---- The steps ----
 private prevision(v:View){const p=v.prevision,lightning=p.fields.find(f=>f.key==='lightning_entity');
  return html`${listSection(t('Prévisions du lieu'),[...this.integrationRow(v.extensions?.find(e=>e.id==='meteo_france')),this.field(p.fields[0]),
    this.textRow('location',t('Nom du lieu'),p.location,p.location_placeholder,t('Affiché en tête de la carte. Vide : le nom vient du service météo.'))])}
   ${listSection(t('Alertes et saison'),p.fields.slice(1).filter(f=>!['water_restriction_entity','lightning_entity'].includes(f.key)).map(f=>this.field(f)))}
   ${listSection(t('Orages et éclairs'),[...this.integrationRow(v.extensions?.find(e=>e.id==='blitzortung'),!!lightning?.options.length),...(lightning?[this.field(lightning)]:[])])}
   ${listSection('',moreRow(t('Réglages avancés'),'',html`<p class="hint nk-more-note">${t('Laissés vides, Hestia-FB prend le soleil de Home Assistant.')}</p>${p.advanced.map(f=>this.field(f))}${this.textRow('forecast_source',t('Nom de la source des prévisions'),p.forecast_source,'')}`))}
   ${this.refreshSources()}${this.bottom()}`;
 }
 private station(v:View){const s=v.station;
  const place=s.place?{view:s.place,busy:this.busy,answer:(key:string,value:unknown)=>void this.change({op:'place',key,value})}:null;
  const head=listSection(t('Votre station'),[...this.choiceRows('model',s.models,s.model,m=>void this.change({op:'station',value:m})),
   ...(s.model!==NONE?[listRow({name:t('Appareil'),label:html`${t('Appareil')}${helpTip(t('Appareil de la station'),t('Limite les capteurs proposés à cet appareil.'),'')}`,sub:t('Reconnue : {name}',{name:s.profile}),
    value:html`<select aria-label=${t('Appareil')} ?disabled=${this.busy} @change=${(e:Event)=>void this.change({op:'device',value:(e.target as HTMLSelectElement).value})}>${s.devices.map(d=>html`<option value=${d.value} ?selected=${d.value===s.device}>${d.label}</option>`)}</select>`})]:[])]);
  if(s.model===NONE)return html`${head}<p class="muted">${t('Sans station, Hestia Weather s’appuie sur le service météo seul : pas de pluie mesurée, pas d’alerte de la station.')}</p>${this.bottom()}`;
  const filled=(g:{fields:Field[]})=>t('{n} sur {total}',{n:g.fields.filter(f=>f.value).length,total:g.fields.length});
  // The first groups open; the others fold into « Autres mesures », unless one has something to check.
  const open=s.groups.filter((g,i)=>i<3||g.fields.some(f=>f.warning)),folded=s.groups.filter((g,i)=>i>=3&&!g.fields.some(f=>f.warning));
  return html`${head}${open.map(g=>listSection(g.title,g.fields.map(f=>this.field(f)),{more:filled(g)}))}
   ${folded.length?listSection(t('Autres mesures'),folded.map(g=>moreRow(g.title,filled(g),g.fields.map(f=>this.field(f))))):nothing}
   ${listSection(t('Historique de la station'),[listRow({name:t('Calculer depuis l’historique'),label:html`${t('Calculer depuis l’historique')}${helpTip(t('Calculer depuis l’historique'),s.history_help,'')}`,
    value:toggle(t('Calculer depuis l’historique'),s.history,on=>this.set('station_history',on),this.busy)})])}
   ${place?placeSection({...place,quiz:()=>{this.quizFrom='station';this.quizStep=this.firstQuestion();}}):nothing}
   <button class="link" ?disabled=${this.busy} @click=${()=>void this.change({op:'redetect',value:'station'})}>${t('Rechercher à nouveau les capteurs')}</button>${this.bottom()}`;
 }
 private air(v:View){const a=v.air;
  return html`${listSection(t('Source de qualité de l’air'),[...this.choiceRows('air',a.sources,a.value,x=>void this.change({op:'air',value:x}),extensionGroups(v.extensions??[]).find(g=>g.key==='air')?.items),
   ...(a.value==='atmo'&&a.areas.length?[this.zoneRow(t('Zone Atmo France'),a.areas,a.area,x=>void this.change({op:'air',value:'atmo',area:x}))]:[]),
   ...(a.value==='waqi'&&a.stations.length?[this.zoneRow(t('Station WAQI'),a.stations,a.station,x=>void this.change({op:'air',value:'waqi',area:x}))]:[])])}${this.refreshSources()}${this.bottom()}`;
 }
 private pollen(v:View){
  const p=v.pollen,chosen=p.species.filter(s=>s.chosen).map(s=>s.id);
  const flip=(id:string,on:boolean)=>void this.change({op:'pollens',value:on?[...chosen,id]:chosen.filter(x=>x!==id)});
  const source=[...this.choiceRows('pollen',p.sources,p.value,x=>void this.change({op:'pollen',value:x}),extensionGroups(v.extensions??[]).find(g=>g.key==='pollen')?.items),
   ...(p.value==='atmo'&&p.areas.length?[this.zoneRow(t('Zone Atmo France des pollens'),p.areas,p.area,x=>void this.change({op:'pollen',value:'atmo',area:x}))]:[]),
   ...(p.value==='swiss_pollen'&&p.stations.length?[this.zoneRow(t('Station Swiss Pollen'),p.station?p.stations:[{value:'',label:t('Choisir une station…')},...p.stations],p.station,x=>void this.change({op:'pollen_station',value:x}),t('Mesures actuelles, sans prévision pour demain. Les niveaux d’une station hors service restent indisponibles.'))]:[]),
   ...(p.value==='kleenex_pollenradar'&&p.stations.length?[this.zoneRow(t('Lieu Kleenex / Scottex'),p.station?p.stations:[{value:'',label:t('Choisir un lieu…')},...p.stations],p.station,x=>void this.change({op:'pollen_station',value:x}),t('Niveaux de faible à très élevé, aujourd’hui et demain. Les données trop anciennes restent indisponibles.'))]:[])];
  return html`${listSection(t('Source des pollens'),source)}
   ${p.species.length?listSection(p.value==='kleenex_pollenradar'?t('Espèces et groupes suivis'):t('Espèces suivies'),p.species.map(sp=>listRow({name:sp.label,label:sp.label,
     sub:sp.chosen&&!sp.available?html`<span class="warn">${t('Ne répond pas pour l’instant (hors saison ?).')}</span>`:this.stateText(sp)||t('indisponible'),value:toggle(sp.label,sp.chosen,on=>flip(sp.id,on),this.busy)})),
    {help:html`<p>${t('Tous les capteurs trouvés pour ce lieu sont proposés ; décochez ceux qui ne vous concernent pas.')}</p>`}):nothing}
   ${p.risk?listSection(p.risk.label,[this.field(p.risk)]):nothing}
   ${this.refreshSources()}${this.bottom()}`;
 }
 private entities(v:View){
  const e=v.entities;
  if(e.new){
   const chosen=e.families.filter(f=>f.chosen).map(f=>f.key);
   return html`${listSection(t('Familles d’entités'),e.families.map(f=>listRow({name:f.name,label:f.name,sub:f.hint||undefined,
     value:toggle(f.name,!!f.chosen,on=>void this.change({op:'families',value:on?[...chosen,f.key]:chosen.filter(x=>x!==f.key)}),this.busy)})),
    {help:html`<p>${t('Choisissez les familles à créer ; vous pourrez ensuite régler leurs entités une par une.')}</p>`})}${this.bottom()}`;
  }
  const flip=(key:string,on:boolean)=>{this.enabled=on?[...this.enabled,key]:this.enabled.filter(k=>k!==key);};
  return html`${e.families.map((f,n)=>{const items=f.entities??[],on=items.filter(i=>this.enabled.includes(i.key)).length;
    return listSection(f.name,items.map(i=>listRow({name:i.name,label:i.name,sub:i.hint||i.need?html`${i.hint}${i.hint&&i.need?' · ':''}${i.need?html`<span class=${i.optional?'':'warn'}>${i.need}</span>`:nothing}`:undefined,
     value:toggle(i.name,this.enabled.includes(i.key),x=>flip(i.key,x))})),{more:t('{n} sur {total}',{n:on,total:items.length}),help:n?undefined:html`<p>${t('Une entité décochée disparaît de Home Assistant.')}</p>`});})}
   ${this.bottom()}`;
 }
 private water(v:View){const f=v.prevision.fields.find(x=>x.key==='water_restriction_entity');
  return html`${listSection(t('Restrictions d’eau'),[...this.integrationRow(v.extensions?.find(e=>e.id==='vigieau'),!!f?.options.length),...(f?[this.field(f)]:[])])}${this.refreshSources()}${this.bottom()}`;}
 // ---- The Extensions page: Hestia-FB's own bricks, then the integrations of Home Assistant, place by place ----
 private async loadExtensions(){
  const places=this.places?.places??[],views=new Map<string,{draft:Sources;view:View;enabled:string[]}>();
  this.busy=true;
  // Every place asked at once, not one after the other (PLAN-OPTIMISATION-HUB.md, point 5).
  try{const replies=await Promise.all(places.map(p=>this.ws<DraftReply>({type:'hestia_weather/panel/open',entry_id:p.entry_id})));
   places.forEach((p,i)=>{const reply=replies[i];views.set(p.entry_id,{draft:reply.draft,view:reply.view,enabled:enabledKeys(reply.view)});});
   this.extViews=views;this.error='';}
  catch(e){this.error=this.message(e);}finally{this.busy=false;}
 }
 /** A switch of a third-party integration, for one place: its changes, then that place saved at once. */
 private async usePlace(entryId:string,changes:Change[]){
  const current=this.extViews.get(entryId);if(!current)return;
  this.busy=true;this.error='';this.saved='';
  try{let draft=current.draft,view=current.view;
   for(const change of changes){const reply=await this.ws<DraftReply>({type:'hestia_weather/panel/change',draft,change,entry_id:entryId});if(reply.error)throw new Error(reply.error);draft=reply.draft;view=reply.view;}
   await this.ws({type:'hestia_weather/panel/save',draft,entry_id:entryId,enabled:current.enabled});
   this.extViews=new Map(this.extViews).set(entryId,{draft,view,enabled:current.enabled});
   this.saved=t('Enregistré : « {name} » redémarre avec ce changement.',{name:view.title});}
  catch(e){this.error=this.message(e);}finally{this.busy=false;}
 }
 /** Links a place to a Hestia-FB brick or unlinks it: the brick saves it, then both pages read it back. */
 private async link(entryId:string,brick:string,enabled:boolean){
  this.busy=true;this.error='';
  try{const reply=await this.ws<{official:Official[]}>({type:'hestia_weather/panel/link',entry_id:entryId,brick,enabled});
   const p=this.places?.places.find(x=>x.entry_id===entryId);if(p)p.official=reply.official;
   const v=this.extViews.get(entryId);if(v)this.extViews=new Map(this.extViews).set(entryId,{...v,view:{...v.view,official:reply.official}});}
  catch(e){this.error=this.message(e);}finally{this.busy=false;}
 }
 private extensionsPage(){
  const places=this.places?.places??[],several=places.length>1,views=places.map(p=>({p,v:this.extViews.get(p.entry_id)})).filter((x):x is {p:Place;v:{draft:Sources;view:View;enabled:string[]}}=>!!x.v);
  const forPlace=(named:string,here:string,name:string,p:Place)=>several?t(named,{name,place:p.title}):t(here,{name});
  const officials=views.flatMap(({v})=>v.view.official??[]).filter((o,i,a)=>a.findIndex(x=>x.id===o.id)===i);
  const thirds=views.flatMap(({v})=>v.view.in_draft??v.view.extensions??[]).filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i);
  const install=(url:string,integration?:string)=>url.startsWith('https://github.com/')?html`<a href=${hacsUrl(url)} target="_blank" rel="noreferrer">${t('Installer avec HACS')}</a>`
   :html`<a href=${'https://my.home-assistant.io/redirect/config_flow_start/?domain='+integration} target="_blank" rel="noreferrer">${t('Ajouter')}</a>`;
  // One line per extension, as in Confort (socle 1.21): what it is for, then its switch, or the one thing to do.
  // With several places, one switch per place under it.
  const rows=(name:string,use:string,sub:string|undefined,switches:{label:string;checked:boolean;disabled:boolean;set:(on:boolean)=>void}[],value:unknown)=>{
   const one=switches.length===1?switches[0]:undefined;
   return [listRow({label:name,sub:[use,sub].filter(Boolean).join(' · ')||undefined,value:one?toggle(one.label,one.checked,one.set,one.disabled):value}),
    ...(switches.length>1?switches.map(sw=>listRow({label:sw.label,value:toggle(sw.label,sw.checked,sw.set,sw.disabled)})):[])];};
  return html`<main>${pageHead({title:t('Extensions'),subtitle:t('Les autres briques Hestia-FB et les intégrations que Météo lit. Un changement s’enregistre tout de suite : le lieu redémarre.')})}
   ${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}${this.error?html`<p class="notice error" role="alert">${this.error}</p>`:nothing}
   ${!places.length?html`<p class="muted">${t('Ajoutez d’abord un lieu.')}</p>`:!views.length?html`<p class="muted" role="status">${t('Lecture des extensions…')}</p>`:html`
   ${officials.length?listSection(t('Briques Hestia-FB'),officials.flatMap(o=>rows(o.name,o.description,!o.installed?undefined:!o.switchable?t('Mettez à jour Hestia Confort pour régler la liaison d’ici.'):undefined,
     o.installed&&o.switchable?views.map(({p,v})=>({label:forPlace(fr('Donner à {name} le dehors de « {place} »'),fr('Donner à {name} le dehors de ce lieu'),o.name,p),checked:!!(v.view.official??[]).find(x=>x.id===o.id)?.linked,disabled:this.busy,set:(on:boolean)=>void this.link(p.entry_id,o.id,on)})):[],
     o.installed?undefined:install(o.url)))):nothing}
   ${extensionGroups(thirds).map(g=>listSection(g.label,g.items.flatMap(e=>{
    // Each place reads its own state of this extension (Atmo France: one theme at a time).
    const mine=views.map(({p,v})=>({p,v,e:extensionGroups(v.view.in_draft??v.view.extensions??[]).flatMap(x=>x.items).find(x=>x.id===e.id)})).filter((x):x is {p:Place;v:{draft:Sources;view:View;enabled:string[]};e:Extension}=>!!x.e);
    const used=mine.filter(x=>x.e.configured);
    const switches=mine.map(x=>({p:x.p,sw:extensionSwitch(x.e,x.v.view)})).filter(x=>x.sw.shown).map(({p,sw})=>({label:forPlace(fr('Utiliser {name} pour « {place} »'),fr('Utiliser {name} pour ce lieu'),e.name,p),checked:sw.checked,disabled:this.busy||!sw.checked&&!sw.available,set:(on:boolean)=>void this.usePlace(p.entry_id,on?sw.on:sw.off)}));
    const detail=e.online?(several?mine.map(x=>`${x.p.title} : ${x.e.detail??''}`).join(' · '):mine[0]?.e.detail??''):e.id==='meteo_france'?t('Obligatoire : les prévisions et la vigilance du lieu.'):'';
    const value=e.online?html`<a href=${e.url} target="_blank" rel="noreferrer">${t('En savoir plus')}</a>`:!e.installed?install(e.url,e.integration)
     :used.length===1?html`<button type="button" class="nk-reset-s" ?disabled=${this.busy} @click=${()=>void this.open(used[0].p.entry_id,e.stage)}>${t('Régler')}</button>`:undefined;
    return rows(e.name,e.description,detail||undefined,switches,value);})))}
   ${detectedFrame({brick:t('Météo'),repository,version:places[0]?.health.technical?.integration??'',rows:this.places?.others??[]})}
   <button class="link" ?disabled=${this.busy} @click=${()=>void this.loadExtensions()}>${t('Actualiser la détection')}</button>`}
  </main>${this.busy?html`<p class="busy" role="status">${t('Un instant…')}</p>`:nothing}`;
 }
 private recap(v:View){
  const added=this.enabled.filter(k=>!this.initialEnabled.includes(k)).length,removed=this.initialEnabled.filter(k=>!this.enabled.includes(k)).length;
  const change=[added?t('{n} de plus',{n:added}):'',removed?t('{n} de moins',{n:removed}):''].filter(Boolean).join(', ');
  const entities=v.entities.new?v.entities.families.filter(f=>f.chosen).map(f=>f.name).join(', ')||t('aucune famille')
   :t('{n} actives',{n:this.enabled.length})+(change?' '+t('({change} qu’avant)',{change}):'');
  const named=(key:string)=>{const f=v.prevision.fields.find(x=>x.key===key);return f?.entity?.name||f?.value||t('Non configuré');};
  const row=(label:string,value:string)=>listRow({label,value});
  return html`${listSection(t('Configuration du lieu'),[row(t('Sources météo'),`${v.summary.weather} · « ${v.title} »`),
    row(t('Station météo'),v.summary.station+(v.station.model!==NONE?' · '+(v.station.history?t('historique calculé'):t('sans historique')):'')),
    row(t('Qualité de l’air'),capital(v.summary.air)),row(t('Pollens'),capital(v.summary.pollen)),row(t('Eau et jardin'),named('water_restriction_entity')),
    row(t('Orages et éclairs'),named('lightning_entity')),row(t('Entités'),entities)])}
   ${v.needs.length?listSection(t('À savoir'),v.needs.map(n=>listRow({label:html`<span class="warn">${t('{need}. L’entité restera vide.',{need:n})}</span>`}))):nothing}
   <p class="notice">${this.entryId?t('En enregistrant, le lieu redémarre avec ses nouveaux réglages : la carte se met à jour quelques secondes plus tard.'):t('En enregistrant, Hestia Weather crée ce lieu et ses entités.')}</p>
   ${this.bottom()}`;
 }

 // ---- Pages: the same three as every Hestia-FB brick (socle 1.12) ----
 private lines(kind:'todo'|'tips'):NkLine[]{
  const several=(this.places?.places.length??0)>1;
  return (this.places?.places??[]).flatMap(p=>p.health[kind].map(l=>({level:l.level,text:several?`${p.title} : ${l.text}`:l.text,why:l.why,
   go:l.quiz?{label:t('Répondre'),onClick:()=>void this.openQuiz(p.entry_id),disabled:this.busy}
    :l.stage!==null&&l.stage!==undefined?{label:t(stages[l.stage]),onClick:()=>void this.open(p.entry_id,l.stage!),disabled:this.busy}:null})));
 }
 /** What the place is made of, in a few words: its state is on its pill. */
 private placeDetail(p:Place){const station=p.health.technical?.station?.name;return station?t('Station {name}',{name:station}):t('Sans station, le service météo seul');}
 private placeLevel(p:Place):NkLevel{return p.failed?'bad':!p.loaded?'none':p.health.todo.length?'todo':'ok';}
 private placeState(p:Place){return p.failed?t('Démarrage en échec'):!p.loaded?t('Redémarrage en cours'):p.health.todo.length?(p.health.todo.length>1?t('{n} points à régler',{n:p.health.todo.length}):t('{n} point à régler',{n:p.health.todo.length})):t('Tout fonctionne');}
 /** The overview (socle 1.21, like Confort's): its state in a sentence, a few numbers, what to set, the places. */
 private home(){
  const p=this.places!,todo=this.lines('todo'),failed=p.places.some(x=>x.failed),starting=p.places.some(x=>!x.loaded&&!x.failed);
  const count=todo.length>1?t('{n} points à régler',{n:todo.length}):t('{n} point à régler',{n:todo.length});
  // While a place starts, nothing is wrong yet: the overview says so, in grey.
  const head=pageHead({title:t('Météo'),state:p.places.length?{level:failed?'bad':starting?'none':todo.length?'todo':'ok',text:failed?t('Un lieu ne démarre pas'):starting?t('Redémarrage en cours'):todo.length?count:t('Tout fonctionne'),detail:p.places.length>1?t('{n} lieux suivis',{n:p.places.length}):t('{n} lieu suivi',{n:p.places.length})}:undefined});
  if(!p.places.length)return html`<main>${head}${frame(t('Votre lieu météo'),html`<p class="muted">${t('Configurez votre lieu pour suivre ici les sources, les capteurs et les données disponibles.')}</p>
   ${p.can_add?html`<button class="primary" ?disabled=${this.busy} @click=${()=>void this.open(null)}>${t('Configurer mon lieu')}</button>`:html`<p class="warn">${t('Aucun service météo dans Home Assistant : installez Météo-France dans Appareils et services, puis revenez ici.')}</p>`}`)}</main>`;
  const sum=(f:(x:Place)=>number|undefined)=>p.places.reduce((n,x)=>n+(f(x)??0),0);
  const configured=sum(x=>x.health.technical?.station?.configured),responding=sum(x=>x.health.technical?.station?.responding);
  const active=sum(x=>x.health.technical?.entities?.active),valued=sum(x=>x.health.technical?.entities?.with_value);
  const days=Math.min(...p.places.map(x=>x.health.technical?.forecast.days??0));
  return html`<main>${head}${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}
   ${starting?nothing:kpis([...(configured?[{value:`${responding} / ${configured}`,label:t('capteurs qui répondent'),level:responding===configured?'ok' as const:'todo' as const}]:[]),
    {value:`${valued} / ${active}`,label:t('entités avec une valeur'),level:valued===active?'ok':'todo'},
    {value:days>1?t('{n} jours',{n:days}):t('{n} jour',{n:days}),label:t('de prévisions')}])}
   ${todoLists(todo,this.lines('tips'))}
   ${this.rename?.entities.length||this.renameDone.length?this.renameFrame():nothing}
   ${this.placeList(t('Lieux'))}</main>`;
 }
 /** The places, one line each: what it is made of, how it is; a tap opens the place. */
 private placeList(title:string){
  return listSection(title,this.places!.places.map(x=>{const level=this.placeLevel(x);
   return listRow({name:x.title,label:level==='todo'||level==='bad'?html`<strong>${x.title}</strong>`:x.title,level:level==='todo'||level==='bad'?'todo':undefined,sub:this.placeDetail(x),value:this.placeState(x),go:()=>this.open(x.entry_id,0)});}));
 }
 /** « Lieux »: every place, to open or to add. */
 private placesPage(){const p=this.places!;
  return html`<main>${pageHead({title:t('Lieux'),actions:p.can_add?[{label:t('Ajouter un lieu'),onClick:()=>void this.open(null),disabled:this.busy}]:[]})}
   ${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}
   ${p.places.length?this.placeList(''):html`<p class="muted">${p.can_add?t('Aucun lieu pour l’instant : ajoutez le vôtre.'):t('Aucun service météo dans Home Assistant : installez Météo-France dans Appareils et services, puis revenez ici.')}</p>`}</main>`;
 }
 /** A place's last tab, « État »: how it runs, its numbers, each sensor; then « Supprimer ce lieu ». */
 private stateTab(v:View){
  const p=this.places?.places.find(x=>x.entry_id===this.entryId);
  if(!p)return html`<p class="muted" role="status">${t('Chargement…')}</p>`;
  const h=p.health,tech=h.technical,station=tech?.station,entities=tech?.entities;
  const row=(label:string,value:string)=>listRow({label,value});
  return html`${listSection(t('État du lieu'),[row(t('Lieu'),p.loaded?t('Chargé'):p.failed?t('En échec'):t('En cours de chargement')),
    ...h.sources.filter(x=>['forecast','vigilance'].includes(x.key??'')).map(x=>row(x.label,x.text)),
    row(t('Dernier calcul'),tech?.computation??t('Non disponible')),row(t('Station'),station?.name||t('Non configurée')),
    row(t('Historique'),!station?.name?t('Sans station'):!station.history?t('Désactivé'):station.history_sources==null?t('Non disponible'):station.history_sources>1?t('{n} sources avec des données',{n:station.history_sources}):t('{n} source avec des données',{n:station.history_sources}))])}
   ${trustSection(p.trust)}
   ${listSection(t('Statistiques'),[row(t('Capteurs de station qui répondent'),station?.configured?`${station.responding} / ${station.configured}`:'—'),
    row(t('Entités activées'),entities?`${entities.active} / ${entities.total}`:'—'),row(t('Entités actives avec une valeur'),entities?`${entities.with_value} / ${entities.active}`:'—'),
    row(t('Créneaux horaires reçus'),String(tech?.forecast.hours??'—')),row(t('Prévisions quotidiennes reçues'),tech?.forecast.days==null?'—':(tech.forecast.days>1?t('{n} jours',{n:tech.forecast.days}):t('{n} jour',{n:tech.forecast.days})))])}
   ${h.sensors.length?html`<div class="nk-list">${moreRow(t('Détail des capteurs'),String(h.sensors.length),h.sensors.map(x=>listRow({label:html`<span title=${x.name}>${x.label}</span>`,value:x.text})))}</div>`:nothing}
   ${removeBlock({link:t('Supprimer ce lieu'),title:t('Supprimer « {name} » ?',{name:this.placeTitle||v.title}),lines:[t('Ce lieu ne sera plus suivi : ses entités et sa carte disparaissent. Les capteurs de votre station et le service météo restent dans Home Assistant.')],
    keep:t('Garder le lieu'),confirm:t('Supprimer le lieu'),asking:this.confirmRemove,busy:this.busy,onAsk:()=>{this.confirmRemove=true;},onCancel:()=>{this.confirmRemove=false;},onConfirm:()=>void this.removePlace()})}
   ${this.bottom()}`;
 }
 /** « À propos » (socle 1.22): Weather's versions, how to add a card, the project's links. */
 private about(){
  const tech=this.places?.places[0]?.health.technical,version=tech?.integration||this.places?.places[0]?.health.version||'';
  return html`<main>${aboutPage({name:'Hestia Weather',repository,card:t('Tableau de bord → Ajouter une carte → Hestia Weather, puis le lieu et la taille dans ses réglages.'),
   versions:[[t('Hestia Weather'),version||'—'],...(tech?[['API',`hestia_weather_api v${tech.interface_version}`] as [string,string]]:[]),
    [t('Socle commun'),SOCLE.join('.')],[t('Liaisons'),tech?.links.length?tech.links.join(' · '):t('Aucune brique reliée')]]})}
   ${this.rename&&!this.rename.entities.length&&!this.renameDone.length?this.renameFrame():nothing}</main>`;
 }
 // ---- Renaming the entities « hestia_weather » (migration.py): a preview first, nothing changes before « Renommer » ----
 private async readRename(){
  try{this.rename=await this.ws<RenamePreview>({type:'hestia_weather/rename/preview'});}
  catch{this.rename=undefined;}  // An older Hestia Weather, or Home Assistant busy: the frame does not show.
 }
 private async runRename(type:'hestia_weather/rename/apply'|'hestia_weather/rename/undo'){
  if(this.busy)return;
  this.busy=true;this.error='';this.renameDone=[];
  try{
   const reply=await this.ws<RenameReply>({type}),d=reply.done;
   this.rename=reply.preview;this.renameShown=false;this.renameAsk=false;
   this.renameDone=type==='hestia_weather/rename/undo'?[t('Vos entités ont repris l’ancien nom « {old} ».',{old:reply.preview.old})]:[
    d.entities>1?t('{n} entités renommées.',{n:d.entities}):t('{n} entité renommée.',{n:d.entities}),
    ...(d.files?[t('Automatisations, scripts et scènes mis à jour.')]:[]),
    ...(d.dashboards?[d.dashboards>1?t('{n} tableaux de bord mis à jour.',{n:d.dashboards}):t('{n} tableau de bord mis à jour.',{n:d.dashboards})]:[]),
    ...(d.helpers?[d.helpers>1?t('{n} assistants mis à jour.',{n:d.helpers}):t('{n} assistant mis à jour.',{n:d.helpers})]:[])];
  }catch(e){this.error=this.message(e);}
  finally{this.busy=false;}
 }
 private renameUse(u:RenameUse){
  const kind={automation:t('Automatisation'),script:t('Script'),scene:t('Scène'),dashboard:t('Tableau de bord'),helper:t('Assistant'),file:t('Fichier')}[u.kind];
  const lines=u.lines?.length?(u.lines.length>1?t('lignes {list}',{list:u.lines.join(', ')}):t('ligne {n}',{n:u.lines[0]})):'';
  return html`<li><strong>${u.name}</strong><span class="hint inline"> · ${kind}${lines?` · ${lines}`:''}</span></li>`;
 }
 private renameFrame(){
  const r=this.rename;if(!r||(!r.entities.length&&!r.undo))return nothing;
  const done=this.renameDone.length?html`<div class="notice" role="status">${this.renameDone.map(l=>html`<p>${l}</p>`)}</div>`:nothing;
  if(!r.entities.length){
   const when=r.renamed_at?new Date(r.renamed_at).toLocaleDateString(this.hass?.language):'';
   return frame(t('Nom des entités'),html`${done}<p>${t('Vos entités portent le nom « hestia_weather ».')}</p>${when?html`<p class="hint">${t('Renommées le {date}.',{date:when})}</p>`:nothing}
    ${this.renameAsk?html`<div class="notice" role="alertdialog"><p>${t('Revenir à l’ancien nom « {old} » ?',{old:r.old})}</p><p class="hint">${t('Les automatisations et tableaux de bord mis à jour reviennent aussi.')}</p>
     <div class="actions"><button @click=${()=>{this.renameAsk=false;}}>${t('Garder « hestia_weather »')}</button><button class="primary" ?disabled=${this.busy} @click=${()=>void this.runRename('hestia_weather/rename/undo')}>${t('Revenir à l’ancien nom')}</button></div></div>`
    :html`<button class="link" ?disabled=${this.busy} @click=${()=>{this.renameAsk=true;}}>${t('Revenir à l’ancien nom')}</button>`}`);
  }
  const n=r.entities.length;
  const intro=html`${done}<p>${t('Vos entités portent encore l’ancien nom « {old} ».',{old:r.old})}</p><p>${t('Vous pouvez les renommer en « hestia_weather ».')}</p><p class="hint">${t('Rien ne change tant que vous ne validez pas.')}</p>`;
  if(!this.renameShown)return frame(t('Nom des entités'),html`${intro}<button ?disabled=${this.busy} @click=${()=>{this.renameShown=true;}}>${t('Voir ce qui change')}</button>`);
  return frame(t('Nom des entités'),html`${intro}
   <h3>${n>1?t('{n} entités renommées',{n}):t('{n} entité renommée',{n})}</h3>
   <ul class="hint">${r.entities.map(e=>html`<li>${e.from} → <strong>${e.to}</strong></li>`)}</ul>
   <h3>${t('Mis à jour tout seuls')}</h3>
   ${r.auto.length?html`<ul>${r.auto.map(u=>this.renameUse(u))}</ul>`:html`<p class="hint">${t('Aucune automatisation, aucun script ni tableau de bord ne les utilise.')}</p>`}
   ${r.manual.length?html`<h3>${t('À corriger vous-même')}</h3><p class="hint">${t('Écrits à la main : Hestia-FB ne les modifie pas.')}</p><ul>${r.manual.map(u=>this.renameUse(u))}</ul>`:nothing}
   ${r.taken.length?html`<h3>${t('Gardés tels quels')}</h3><p class="hint">${t('Leur nouveau nom est déjà pris.')}</p><ul class="hint">${r.taken.map(id=>html`<li>${id}</li>`)}</ul>`:nothing}
   <p>${t('L’historique et les statistiques sont conservés.')}</p>
   <p class="hint">${t('Hors de Home Assistant (Node-RED, applications…), changez les noms vous-même.')}</p>
   <p class="warn">${t('Faites une sauvegarde de Home Assistant avant.')}</p>
   <div class="actions"><button @click=${()=>{this.renameShown=false;}}>${t('Annuler')}</button>
    <button class="primary" ?disabled=${this.busy} @click=${()=>void this.runRename('hestia_weather/rename/apply')}>${t('Renommer')}</button></div>`);
 }
 private editor(){
  if(this.quizStep!==null&&this.view?.station.place)return this.quizPage();
  const v=this.view!,creating=!this.entryId;
  const body=[this.prevision,this.station,this.air,this.pollen,this.entities,this.recap,this.water,this.recap,this.stateTab][this.stage].call(this,v);
  const tabs=creating?createSections:sections,at=order.indexOf(this.stage);
  // A place opens like a Confort room (socle 1.21): back to the places, its name and state, its tabs, the save bar.
  return html`<main>${pageHead({back:{label:t('Lieux'),onClick:()=>this.leave()},title:creating?t('Nouveau lieu'):this.placeTitle||v.title,
    state:creating?undefined:(()=>{const p=this.places?.places.find(x=>x.entry_id===this.entryId);return p?{level:this.placeLevel(p),text:this.placeState(p)}:undefined;})()})}
   ${creating?html`<p class="muted">${t('Nouveau lieu · étape {n} sur {total}',{n:at+1,total:order.length})}</p>`:nothing}
   ${this.confirmLeave?leaveNotice({onStay:()=>{this.confirmLeave=false;},onLeave:()=>this.close()}):nothing}
   ${tabBar(t('Réglages du lieu'),tabs.map(x=>({label:t(x.label),current:x.stage===this.stage,onClick:()=>this.go(x.stage)})),this.busy)}
   ${this.error?html`<p class="notice error" role="alert">${this.error}</p>`:nothing}
   ${intros[this.stage]?this.intro():nothing}${body}</main>${this.busy?html`<p class="busy" role="status">${t('Un instant…')}</p>`:nothing}`;
 }
 // ---- « Où est votre station ? » (docs/STATION-EMPLACEMENT.md § 6) ----
 private firstQuestion(){const place=this.view?.station.place;if(!place)return 0;const i=placeQuestions(place).findIndex(q=>!(q.key in place.values));return i<0?0:i;}
 /** From the overview: the place's draft, straight to its first question not answered; saved at its end. */
 private async openQuiz(entryId:string,route=true){
  await this.open(entryId,1,false);
  if(!this.view?.station.place||this.entryId!==entryId)return;
  this.quizFrom='home';this.quizStep=this.firstQuestion();
  if(route)this.path(entryId+'/emplacement');
 }
 /** Leaving the questionnaire: opened from the overview, what was answered is saved and the overview comes back. */
 private exitQuiz(){
  if(this.quizFrom!=='home'){this.quizStep=null;return;}
  if(this.entryId&&this.changeCount()>0){void this.save();return;}
  this.close('');
 }
 private quizPage(){const place=this.view!.station.place!,home=this.quizFrom==='home';
  return html`<main>${pageHead({back:{label:home?t('Vue d’ensemble'):t('Station'),onClick:()=>this.exitQuiz()},title:t('Votre station'),subtitle:this.placeTitle||this.view!.title})}
   ${this.error?html`<p class="notice error" role="alert">${this.error}</p>`:nothing}
   ${quizScreen({view:place,busy:this.busy,answer:(key:string,value:unknown)=>void this.change({op:'place',key,value}),step:this.quizStep!,go:n=>{this.quizStep=n;},
    close:home?undefined:()=>{this.quizStep=null;},saves:!!this.entryId,finish:()=>{if(this.entryId)void this.save();else this.quizStep=null;}})}</main>
   ${this.busy?html`<p class="busy" role="status">${t('Un instant…')}</p>`:nothing}`;
 }
 protected render(){
  if(this.editing&&this.view)return this.editor();
  if(this.error&&!this.places)return html`<main><p class="notice error" role="alert">${this.error}</p><button @click=${()=>{this.error='';void this.load();}}>${t('Réessayer')}</button></main>`;
  if(!this.places)return html`<main><p class="muted" role="status">${t('Chargement…')}</p></main>`;
  if(this.page==='extensions')return this.extensionsPage();
  return html`${this.error?html`<main><p class="notice error" role="alert">${this.error}</p></main>`:nothing}${this.page==='about'?this.about():this.page==='places'?this.placesPage():this.home()}`;
 }
}
