// The « Météo » tab of the shared « Hestia » panel: each place's settings, step by step, then saved at once.
// Hestia Weather computes everything (draft.py): this page shows the draft, sends each change and saves it.
import {LitElement,html,unsafeCSS,nothing,type TemplateResult,type PropertyValues} from 'lit';
import {customElement,property,state} from 'lit/decorators.js';
import styles from './styles.css';
import {frame,hubStyles,modernStyles,helpTip,pageHead,todoFrame,itemsFrame,stepMenu,stepFooter,leaveNotice,extensionsFrame,detectedFrame,versionsFrame,extensionCard,removeBlock,pageStyles,setLanguage,addDictionary,t,fr,type NkLine,type NkLevel,type NkSwitch} from './socle/ui';
import {PANEL_EN} from './i18n-en';
import {PANEL_DE} from './i18n-de';
import {NONE,stages,intros,extensionGroups,extensionSwitch,enabledKeys,provenance,sameSet,entityLine,grouped,capital,type Change,type Choice,type DraftReply,type Field,type Hass,type Place,type Places,type Sources,type View,type Extension,type Official,type RenamePreview,type RenameReply,type RenameUse} from './model';

// Weather's words beside the hub's (socle 1.13): French in the code, English for any language without a dictionary.
addDictionary('en',PANEL_EN);
addDictionary('de',PANEL_DE);
const categories=['sources','station','air','pollens','entites','recapitulatif','eau-jardin','extensions'];
// The extensions have their own page (socle 1.12): a place's steps no longer show them.
const order=[0,1,2,3,6,4,5];
const sections=[{stage:0,label:fr('Sources météo'),icon:'weather'},{stage:1,label:fr('Station météo'),icon:'temperature'},{stage:2,label:fr('Qualité de l’air'),icon:'air'},{stage:3,label:fr('Pollens'),icon:'pollen'},{stage:6,label:fr('Eau et jardin'),icon:'pollen'},{stage:4,label:fr('Entités'),icon:'entities'},{stage:5,label:fr('Récapitulatif'),icon:'review'}];
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
 // The three pages of every Hestia brick (socle 1.12): its Accueil, its Réglages généraux, and « Configurer » one place.
 @state() private page:'home'|'settings'|'extensions'='home';
 // The Extensions page reads each place's draft: its switches change and save that place at once.
 @state() private extViews=new Map<string,{draft:Sources;view:View;enabled:string[]}>();
 @state() private confirmRemove=false;
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
 connectedCallback(){super.connectedCallback();window.addEventListener('beforeunload',this.beforeUnload);}
 disconnectedCallback(){super.disconnectedCallback();this.routeGeneration++;if(this.busy)this.routeHandled=undefined;window.removeEventListener('beforeunload',this.beforeUnload);}
 protected updated(changed:PropertyValues){
  // The hub's words (socle 1.13) follow Home Assistant's language.
  // Its places come back from Weather in the new language too: they are read again.
  if(setLanguage(this.hass?.language)){this.requestUpdate();if(this.places&&!this.busy)void this.load();}
  this.setAttribute('data-theme',this.hass?.themes?.darkMode===false?'light':'dark');
  if(this.hass&&!this.places&&!this.busy&&!this.error)void this.load();
  if(changed.has('route')&&this.places)void this.followRoute();
  if(this.page==='settings'&&!this.editing&&this.hass&&!this.renameRead){this.renameRead=true;void this.readRename();}
 }
 /** A command of Weather, answered in the panel's language (engine/i18n.py). */
 private ws<T>(msg:Record<string,unknown>){return this.hass!.callWS<T>({...msg,language:this.hass!.language});}
 private message(e:unknown){return typeof e==='object'&&e&&'message' in e?String((e as {message:unknown}).message):t('Home Assistant ne répond pas. Réessayez.');}
 private async load(){
  this.busy=true;
  try{this.places=await this.ws<Places>({type:'hestia_weather/panel/places'});this.error='';await this.followRoute();}
  catch(e){this.error=this.message(e);}
  finally{this.busy=false;}
  // A place restarting after a save: look again in a moment, a few times at most.
  if(this.places?.places.some(p=>!p.loaded&&!p.failed)&&this.retries<10){this.retries++;setTimeout(()=>{if(!this.editing)void this.load();},2000);}
  else this.retries=0;
 }
 private retries=0;
 private dirty(){return !!this.draft&&(JSON.stringify(this.draft)!==this.initial||!sameSet(this.enabled,this.initialEnabled));}
 private top(){this.scrollTop=0;this.renderRoot.querySelector('main')?.scrollIntoView?.({block:'start'});}

 private path(path:string){if(!this.isConnected)return;this.routeHandled=path?'/'+path:'';this.page=path==='reglages'?'settings':path==='extensions'?'extensions':'home';history.pushState(null,'',(this.route?.prefix??'/hestia/meteo')+(path?'/'+path:''));window.dispatchEvent(new CustomEvent('location-changed'));}
 private remember(){if(this.draft&&this.view)this.drafts.set(this.entryId??'nouveau',{draft:this.draft,view:this.view,stage:this.stage,enabled:this.enabled,error:this.error,initial:this.initial,initialEnabled:this.initialEnabled,savedOptions:this.savedOptions,touched:this.touched,placeTitle:this.placeTitle});}
 private async followRoute(){
  const path=this.route?.path??'';if(path===this.routeHandled)return;this.routeHandled=path;this.routeGeneration++;
  // /reglages: the places to set; /<place>/<step>: one place, step by step (/nouveau/… for a new one).
  // Former addresses: /reglages/<step>/<place> and /<step> (the menu of 2.8) still lead to the same pages.
  const parts=path.split('/').filter(Boolean);this.remember();
  const legacy=parts[0]==='reglages'&&parts.length>=3,id=legacy?parts[2]:parts[0]&&parts[0]!=='reglages'&&!categories.includes(parts[0])?parts[0]:undefined;
  const stage=id?sectionStage((legacy?parts[1]:parts[1])??'sources'):-1;
  this.page=parts[0]==='extensions'||parts[1]==='extensions'?'extensions':!id&&(parts[0]==='reglages'||categories.includes(parts[0]))?'settings':'home';
  if(this.page==='extensions'){this.editing=false;this.draft=undefined;this.view=undefined;void this.loadExtensions();return;}
  const target=id;
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
   this.close();
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
 private close(){this.confirmRemove=false;this.drafts.delete(this.entryId??'nouveau');this.path('reglages');this.editing=false;this.draft=undefined;this.view=undefined;this.confirmLeave=false;this.error='';void this.updateComplete.then(()=>{this.top();});}
 private leave(){if(this.dirty()&&!this.confirmLeave){this.confirmLeave=true;return;}this.close();}
 private go(stage:number){this.stage=stage;this.path((this.entryId??'nouveau')+'/'+categories[stage]);void this.updateComplete.then(()=>{this.top();});}

 // ---- Pieces ----
 private choiceList(name:string,choices:Choice[],value:string,pick:(v:string)=>void,extensions:Extension[]=[]){
  return html`<div role="radiogroup" aria-label=${({model:t('Modèle de station'),air:t('Source de qualité de l’air'),pollen:t('Source des pollens')} as Record<string,string>)[name]??name}>${choices.map(c=>{const e=extensions.find(e=>e.id===c.value||e.id==='atmo-'+name&&c.value==='atmo');return html`<div class="source-choice"><label class="choice ${c.value===value?'on':''} ${c.available===false?'off':''}">
   <input type="radio" name=${name} .checked=${c.value===value} ?disabled=${c.available===false||this.busy} @change=${()=>pick(c.value)}>
   <span><strong>${c.label}</strong>${c.hint?html`<span>${c.hint}</span>`:nothing}${c.available===false&&(!e||e.installed)?html`<span>${e?.installed?t('Aucune donnée détectée pour cette source'):t('Pas encore installée')}</span>`:nothing}</span></label>
   ${e?this.integrationInfo(e,c.available!==false):nothing}</div>`;})}</div>`;
 }
 private integrationInfo(e:Extension|undefined,available=true):TemplateResult|typeof nothing{
  if(!e)return nothing;
  return html`<div class="integration-info" aria-label=${e.name}><div class="extension-status">
   <span class="extension-badge ${e.installed?'ok':'none'}">${e.installed?t('Installée'):t('Pas installée')}</span>
   ${e.configured?html`<span class="extension-badge ok">${t('Configurée pour ce lieu')}</span>`:nothing}
   ${!e.installed||!available?html`<button class="link" ?disabled=${this.busy} aria-expanded=${this.extensionId===e.id?'true':'false'} @click=${()=>{this.extensionId=this.extensionId===e.id?'':e.id;}}>${e.installed?t('Configurer dans Home Assistant'):t('Comment l’installer')}</button>`:nothing}</div>
   ${this.extensionId===e.id?html`<div class="extension-detail"><p>${e.install}</p><div class="actions">${e.url?html`<a href=${e.url} target="_blank" rel="noreferrer">${t('Voir l’intégration {name}',{name:e.name})}</a>`:nothing}<a href="/config/integrations" target="_blank" rel="noreferrer">${t('Appareils et services')}</a></div><p class="hint">${t('Après l’ajout dans Home Assistant, actualisez la détection dans cet onglet.')}</p></div>`:nothing}
  </div>`;
 }
 private refreshSources(){return html`<button class="link" ?disabled=${this.busy} @click=${()=>void this.change({op:'redetect',value:'weather'})}>${t('Actualiser la détection')}</button>`;}
 private field(f:Field):TemplateResult{
  const origin=provenance(f.key,f.value,this.savedOptions,this.touched);
  return html`<div class="field nk-setting-row"><div class="field-top"><h3 id=${'l-'+f.key}>${f.label}</h3><span>${f.need}</span>${f.help?helpTip(f.label,f.help):nothing}</div>
   <select aria-labelledby=${'l-'+f.key} ?disabled=${this.busy} @change=${(e:Event)=>this.set(f.key,(e.target as HTMLSelectElement).value)}>
    <option value="" ?selected=${!f.value}>${f.options.length?t('— Aucun —'):t('— Aucun capteur trouvé —')}</option>
    ${grouped(f).map(g=>{const items=g.options.map(o=>html`<option value=${o.id} ?selected=${o.id===f.value}>${o.name}${o.state?` · ${o.state}`:''}</option>`);
     return g.label?html`<optgroup label=${g.label}>${items}</optgroup>`:items;})}
   </select>
   ${f.entity?html`<p class="provenance">${entityLine(f.entity)}</p>`:nothing}
   ${origin?html`<p class="provenance">${origin}</p>`:nothing}
   ${f.warning?html`<p class="warn">${f.warning}</p>`:nothing}
   ${f.better?html`<button class="link" ?disabled=${this.busy} @click=${()=>this.set(f.key,f.better!.id)}>${t('Choisir « {name} » à la place',{name:f.better.name})}</button>`:nothing}</div>`;
 }
 // What the step is for, in a frame that folds and stays folded.
 private intro(){return html`<div class="nk-step-help">${helpTip(t('Comprendre cette étape'),html`<ul>${intros[this.stage].map(line=>html`<li>${t(line)}</li>`)}</ul>`,t('À quoi sert cette étape ?'))}</div>`;}

 private zone(id:string,label:string,areas:Choice[],value:string,pick:(v:string)=>void){
  return html`<div class="field"><div class="field-top"><h3 id=${id}>${label}</h3></div>
   <select aria-labelledby=${id} ?disabled=${this.busy} @change=${(e:Event)=>pick((e.target as HTMLSelectElement).value)}>
    ${areas.map(x=>html`<option value=${x.value} ?selected=${x.value===value}>${x.label}</option>`)}</select></div>`;
 }
 // The common bottom of a step (socle 1.12): back, « Continuer », and « Enregistrer » for a place that exists.
 private bottom(){
  const at=order.indexOf(this.stage),saveDisabled=this.busy||!this.draft?.weather_entity;
  return stepFooter({previous:at>0?{label:t('Étape précédente'),onClick:()=>this.go(order[at-1]),disabled:this.busy}:undefined,
   next:this.stage!==5?{label:t('Continuer'),onClick:()=>this.go(order[Math.min(at+1,order.length-1)]),disabled:this.busy}:undefined,
   save:this.entryId?{label:t('Enregistrer'),onClick:()=>void this.save(),disabled:saveDisabled}:this.stage===5?{label:t('Créer ce lieu'),onClick:()=>void this.save(),disabled:saveDisabled}:undefined});
 }

 // ---- The steps ----
 private prevision(v:View){const p=v.prevision;
  return html`${frame(t('Prévisions du lieu'),html`<h3>${t('Météo-France')}</h3>${this.integrationInfo(v.extensions?.find(e=>e.id==='meteo_france'))}${this.field(p.fields[0])}
   <div class="field nk-setting-row"><div class="field-top"><h3 id="l-location">${t('Nom du lieu')}</h3><span>${t('Facultatif')}</span>${helpTip(t('Nom du lieu'),t('Affiché en tête de la carte. Vide : le nom vient du service météo.'))}</div>
    <input aria-labelledby="l-location" .value=${p.location} placeholder=${p.location_placeholder} ?disabled=${this.busy} @change=${(e:Event)=>this.set('location',(e.target as HTMLInputElement).value.trim())}></div>`,{className:'nk-field-section nk-plain'})}
   ${frame(t('Alertes et saison'),html`${p.fields.slice(1).filter(f=>!['water_restriction_entity','lightning_entity'].includes(f.key)).map(f=>this.field(f))}`,{className:'nk-field-section nk-plain'})}
   ${frame(t('Orages et éclairs'),html`<h3>${t('Blitzortung')}</h3>${this.integrationInfo(v.extensions?.find(e=>e.id==='blitzortung'),!!p.fields.find(f=>f.key==='lightning_entity')?.options.length)}${p.fields.filter(f=>f.key==='lightning_entity').map(f=>this.field(f))}`,{className:'nk-field-section nk-plain'})}
   ${this.refreshSources()}
   ${frame(t('Réglages avancés'),html`${helpTip(t('Soleil et prévisions'),t('Laissés vides, Hestia prend le soleil de Home Assistant.'))}${p.advanced.map(f=>this.field(f))}
    <div class="field nk-setting-row"><div class="field-top"><h3 id="l-source">${t('Nom de la source des prévisions')}</h3><span>${t('Facultatif')}</span></div><input aria-labelledby="l-source" .value=${p.forecast_source} ?disabled=${this.busy} @change=${(e:Event)=>this.set('forecast_source',(e.target as HTMLInputElement).value.trim())}></div>`,{collapsible:true,open:false})}${this.bottom()}`;
 }
 private station(v:View){const s=v.station;
  return html`${frame(t('Votre station'),html`${s.model!==NONE?html`<p class="hint">${t('Reconnue : {name}',{name:s.profile})}</p>`:nothing}
   ${this.choiceList('model',s.models,s.model,m=>void this.change({op:'station',value:m}))}
   ${s.model!==NONE?html`<div class="field nk-setting-row"><div class="field-top"><h3 id="l-device">${t('Appareil')}</h3><span>${t('Facultatif')}</span>${helpTip(t('Appareil de la station'),t('Limite les capteurs proposés à cet appareil.'))}</div>
    <select aria-labelledby="l-device" ?disabled=${this.busy} @change=${(e:Event)=>void this.change({op:'device',value:(e.target as HTMLSelectElement).value})}>${s.devices.map(d=>html`<option value=${d.value} ?selected=${d.value===s.device}>${d.label}</option>`)}</select></div>`:nothing}`,{className:'nk-field-section nk-plain'})}
   ${s.model===NONE?html`<p class="muted">${t('Sans station, Hestia Weather s’appuie sur le service météo seul : pas de pluie mesurée, pas d’alerte de la station.')}</p>`:html`
    ${s.groups.map((g,i)=>frame(g.title,html`${g.fields.map(f=>this.field(f))}`,{count:t('{n} sur {total}',{n:g.fields.filter(f=>f.value).length,total:g.fields.length})+(g.fields.some(f=>f.warning)?' · '+t('à vérifier'):''),className:i<3||g.fields.some(f=>f.warning)?'nk-field-section nk-plain':'',collapsible:i>=3&&!g.fields.some(f=>f.warning),open:false}))}
    ${frame(t('Historique de la station'),html`<label class="check"><input type="checkbox" .checked=${s.history} ?disabled=${this.busy} @change=${(e:Event)=>this.set('station_history',(e.target as HTMLInputElement).checked)}><span><strong>${t('Calculer depuis l’historique')}</strong></span></label>${helpTip(t('Calculer depuis l’historique'),s.history_help,t('Comprendre ce réglage'))}`,{className:'nk-field-section nk-plain'})}
    <button class="link" ?disabled=${this.busy} @click=${()=>void this.change({op:'redetect',value:'station'})}>${t('Rechercher à nouveau les capteurs')}</button>`}${this.bottom()}`;
 }
 private air(v:View){const a=v.air;
  return html`${frame(t('Source de qualité de l’air'),html`${this.choiceList('air',a.sources,a.value,x=>void this.change({op:'air',value:x}),extensionGroups(v.extensions??[]).find(g=>g.key==='air')?.items)}
   ${a.value==='atmo'&&a.areas.length?this.zone('l-aarea',t('Zone Atmo France'),a.areas,a.area,x=>void this.change({op:'air',value:'atmo',area:x})):nothing}
   ${a.value==='waqi'&&a.stations.length?this.zone('l-astation',t('Station WAQI'),a.stations,a.station,x=>void this.change({op:'air',value:'waqi',area:x})):nothing}`,{className:'nk-field-section nk-plain'})}${this.refreshSources()}${this.bottom()}`;
 }
 private pollen(v:View){
  const p=v.pollen;const chosen=p.species.filter(s=>s.chosen).map(s=>s.id);
  const toggle=(id:string,on:boolean)=>void this.change({op:'pollens',value:on?[...chosen,id]:chosen.filter(x=>x!==id)});
  return html`${frame(t('Source des pollens'),html`${this.choiceList('pollen',p.sources,p.value,x=>void this.change({op:'pollen',value:x}),extensionGroups(v.extensions??[]).find(g=>g.key==='pollen')?.items)}
   ${p.value==='atmo'&&p.areas.length?this.zone('l-parea',t('Zone Atmo France des pollens'),p.areas,p.area,x=>void this.change({op:'pollen',value:'atmo',area:x})):nothing}
   ${p.value==='swiss_pollen'&&p.stations.length?html`${this.zone('l-pstation',t('Station Swiss Pollen'),p.station?p.stations:[{value:'',label:t('Choisir une station…')},...p.stations],p.station,x=>void this.change({op:'pollen_station',value:x}))}
    <p class="hint">${t('Mesures actuelles, sans prévision pour demain. Les niveaux d’une station hors service restent indisponibles.')}</p>`:nothing}
   ${p.value==='kleenex_pollenradar'&&p.stations.length?html`${this.zone('l-kplace',t('Lieu Kleenex / Scottex'),p.station?p.stations:[{value:'',label:t('Choisir un lieu…')},...p.stations],p.station,x=>void this.change({op:'pollen_station',value:x}))}
    <p class="hint">${t('Niveaux de faible à très élevé, aujourd’hui et demain. Les données trop anciennes restent indisponibles.')}</p>`:nothing}
   `,{className:'nk-field-section nk-plain'})}
   ${p.species.length?frame(p.value==='kleenex_pollenradar'?t('Espèces et groupes suivis'):t('Espèces suivies'),html`${helpTip(t('Espèces suivies'),t('Tous les capteurs trouvés pour ce lieu sont proposés ; décochez ceux qui ne vous concernent pas.'))}
    ${p.species.map(s=>html`<label class="check"><input type="checkbox" .checked=${s.chosen} ?disabled=${this.busy} @change=${(e:Event)=>toggle(s.id,(e.target as HTMLInputElement).checked)}>
     <span>${s.label} <span class="hint inline">· ${s.state||'indisponible'}</span>${s.chosen&&!s.available?html`<span class="warn">${t('Ne répond pas pour l’instant (hors saison ?).')}</span>`:nothing}</span></label>`)}`,{className:'nk-field-section nk-plain'}):nothing}
   ${p.risk?frame(p.risk.label,html`${this.field(p.risk)}`,{className:'nk-field-section nk-plain'}):nothing}
   ${this.refreshSources()}${this.bottom()}`;
 }
 private entities(v:View){
  const e=v.entities;
  if(e.new){
   const chosen=e.families.filter(f=>f.chosen).map(f=>f.key);
   return html`<p class="muted">${t('Choisissez les familles à créer ; vous pourrez ensuite régler leurs entités une par une.')}</p>
    ${frame(t('Familles d’entités'),html`${e.families.map(f=>html`<label class="check"><input type="checkbox" .checked=${!!f.chosen} ?disabled=${this.busy}
     @change=${(ev:Event)=>void this.change({op:'families',value:(ev.target as HTMLInputElement).checked?[...chosen,f.key]:chosen.filter(x=>x!==f.key)})}>
     <span><strong>${f.name}</strong>${f.hint?html`<span class="hint">${f.hint}</span>`:nothing}</span></label>`)}`,{className:'nk-field-section nk-plain'})}${this.bottom()}`;
  }
  const flip=(key:string,on:boolean)=>{this.enabled=on?[...this.enabled,key]:this.enabled.filter(k=>k!==key);};
  return html`<p class="muted">${t('Une entité décochée disparaît de Home Assistant.')}</p>
   ${e.families.map(f=>{const items=f.entities??[];const on=items.filter(i=>this.enabled.includes(i.key)).length;
    return frame(f.name,html`
     ${items.map(i=>html`<label class="check"><input type="checkbox" .checked=${this.enabled.includes(i.key)} @change=${(ev:Event)=>flip(i.key,(ev.target as HTMLInputElement).checked)}>
      <span>${i.name}${i.hint?html`<span class="hint">${i.hint}</span>`:nothing}${i.need?html`<span class=${i.optional?'hint':'warn'}>${i.need}</span>`:nothing}</span></label>`)}`,{count:t('{n} sur {total}',{n:on,total:items.length}),className:'nk-field-section nk-plain'});})}
   ${this.bottom()}`;
 }
 private water(v:View){return html`${frame(t('Restrictions d’eau'),html`<h3>${t('Vigieau')}</h3>${this.integrationInfo(v.extensions?.find(e=>e.id==='vigieau'),!!v.prevision.fields.find(f=>f.key==='water_restriction_entity')?.options.length)}
  ${v.prevision.fields.filter(f=>f.key==='water_restriction_entity').map(f=>this.field(f))}`,{className:'nk-field-section nk-plain'})}${this.refreshSources()}${this.bottom()}`;}
 // ---- The Extensions page: Hestia's own bricks, then the integrations of Home Assistant, place by place ----
 private async loadExtensions(){
  const places=this.places?.places??[],views=new Map<string,{draft:Sources;view:View;enabled:string[]}>();
  this.busy=true;
  try{for(const p of places){const reply=await this.ws<DraftReply>({type:'hestia_weather/panel/open',entry_id:p.entry_id});views.set(p.entry_id,{draft:reply.draft,view:reply.view,enabled:enabledKeys(reply.view)});}
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
 /** Links a place to a Hestia brick or unlinks it: the brick saves it, then both pages read it back. */
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
  return html`<main>${pageHead({back:{label:t('Accueil Météo'),onClick:()=>this.path('')},title:t('Extensions'),subtitle:t('Les autres briques Hestia et les intégrations de Home Assistant que Météo lit, lieu par lieu.')})}
   ${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}${this.error?html`<p class="notice error" role="alert">${this.error}</p>`:nothing}
   ${!places.length?html`<p class="muted">${t('Ajoutez d’abord un lieu dans les Réglages généraux.')}</p>`:!views.length?html`<p class="muted" role="status">${t('Lecture des extensions…')}</p>`:html`
   <h2 class="ex-sec">${t('Extensions officielles Hestia')}</h2>
   ${officials.map(o=>{const linked=views.filter(({v})=>(v.view.official??[]).some(x=>x.id===o.id&&x.linked));
    return extensionCard({icon:extIcon[o.id]??'settings',name:o.name,use:o.description,todo:o.installed&&o.switchable&&!linked.length,
     pill:!o.installed?{text:t('non installée'),level:'none'}:linked.length?{text:t('liée'),level:'ok'}:{text:t('à lier'),level:'todo'},
     detail:!o.installed?'':!o.switchable?t('Mettez à jour Hestia Confort pour régler la liaison d’ici.'):linked.length&&several?t('Liée à « {places} ».',{places:linked.map(x=>x.p.title).join(', ')}):'',
     action:o.installed?nothing:html`<a class="ex-act" href=${hacsUrl(o.url)} target="_blank" rel="noreferrer">${t('Installer avec HACS')}</a>`,
     switches:o.installed&&o.switchable?views.map(({p,v}):NkSwitch=>({label:forPlace(fr('Donner à {name} le dehors de « {place} »'),fr('Donner à {name} le dehors de ce lieu'),o.name,p),checked:!!(v.view.official??[]).find(x=>x.id===o.id)?.linked,disabled:this.busy,
      note:t('Enregistré tout de suite, ici et dans {name}.',{name:o.name}),onChange:on=>void this.link(p.entry_id,o.id,on)})):[]});})}
   <h2 class="ex-sec">${t('Extensions tierces')}</h2><p class="hint">${t('Rangées par thème. Toutes facultatives, sauf le service météo. Un changement s’enregistre tout de suite : le lieu redémarre.')}</p>
   ${extensionGroups(thirds).map(g=>html`<h3 class="ex-theme">${g.label}</h3>${g.items.map(e=>{
    // Each place reads its own state of this extension (Atmo France: one theme at a time).
    const mine=views.map(({p,v})=>({p,v,e:extensionGroups(v.view.in_draft??v.view.extensions??[]).flatMap(x=>x.items).find(x=>x.id===e.id)})).filter((x):x is {p:Place;v:{draft:Sources;view:View;enabled:string[]};e:Extension}=>!!x.e);
    const used=mine.filter(x=>x.e.configured);
    const go=used.length===1?html`<button class="nk-edit" ?disabled=${this.busy} @click=${()=>void this.open(used[0].p.entry_id,e.stage)}>${t('Régler')}</button>`:nothing;
    return extensionCard({icon:extIcon[e.id.replace(/^atmo-.*/,'atmo')]??'settings',name:e.name,use:e.description,
     pill:e.online?(mine.some(x=>x.e.configured||x.e.air_configured)?{text:t('service en ligne utilisé'),level:'ok'}:{text:t('service en ligne'),level:'none'})
      :!e.installed?{text:t('non installée'),level:'none'}:used.length?{text:t('liée'),level:'ok'}:{text:t('installée'),level:'none'},
     detail:e.online?(several?mine.map(x=>`${x.p.title} : ${x.e.detail??''}`).join(' · '):mine[0]?.e.detail??''):e.id==='meteo_france'?t('Obligatoire : les prévisions et la vigilance du lieu.'):used.length&&several?t('Utilisée pour « {places} ».',{places:used.map(x=>x.p.title).join(', ')}):'',
     action:e.online?html`<a class="ex-act" href=${e.url} target="_blank" rel="noreferrer">${t('En savoir plus')}</a>`:!e.installed?(e.url.startsWith('https://github.com/')?html`<a class="ex-act" href=${hacsUrl(e.url)} target="_blank" rel="noreferrer">${t('Installer avec HACS')}</a>`
      :html`<a class="ex-act" href=${'https://my.home-assistant.io/redirect/config_flow_start/?domain='+e.integration} target="_blank" rel="noreferrer">${t('Ajouter')}</a>`):go,
     switches:mine.map(x=>({p:x.p,sw:extensionSwitch(x.e,x.v.view)})).filter(x=>x.sw.shown).map(({p,sw}):NkSwitch=>({label:forPlace(fr('Utiliser {name} pour « {place} »'),fr('Utiliser {name} pour ce lieu'),e.name,p),checked:sw.checked,disabled:this.busy||!sw.checked&&!sw.available,
      onChange:on=>void this.usePlace(p.entry_id,on?sw.on:sw.off)}))});})}`)}
   ${detectedFrame({brick:t('Météo'),repository:'https://github.com/hestiaFB/hestia-weather-integration',version:places[0]?.health.technical?.integration??'',rows:this.places?.others??[]})}
   <button class="link" ?disabled=${this.busy} @click=${()=>void this.loadExtensions()}>${t('Actualiser la détection')}</button>`}
  </main>${this.busy?html`<p class="busy" role="status">${t('Un instant…')}</p>`:nothing}`;
 }
 private recap(v:View){
  const added=this.enabled.filter(k=>!this.initialEnabled.includes(k)).length,removed=this.initialEnabled.filter(k=>!this.enabled.includes(k)).length;
  const change=[added?t('{n} de plus',{n:added}):'',removed?t('{n} de moins',{n:removed}):''].filter(Boolean).join(', ');
  const entities=v.entities.new?v.entities.families.filter(f=>f.chosen).map(f=>f.name).join(', ')||t('aucune famille')
   :t('{n} actives',{n:this.enabled.length})+(change?' '+t('({change} qu’avant)',{change}):'');
  return html`${frame(t('Configuration du lieu'),html`<dl class="summary">
    <dt>${t('Sources météo')}</dt><dd>${v.summary.weather} · « ${v.title} »</dd>
    <dt>${t('Station météo')}</dt><dd>${v.summary.station}${v.station.model!==NONE?' · '+(v.station.history?t('historique calculé'):t('sans historique')):''}</dd>
    <dt>${t('Qualité de l’air')}</dt><dd>${capital(v.summary.air)}</dd>
    <dt>${t('Pollens')}</dt><dd>${capital(v.summary.pollen)}</dd>
    <dt>${t('Eau et jardin')}</dt><dd>${v.prevision.fields.find(f=>f.key==='water_restriction_entity')?.entity?.name||v.prevision.fields.find(f=>f.key==='water_restriction_entity')?.value||t('Non configuré')}</dd>
    <dt>${t('Orages et éclairs')}</dt><dd>${v.prevision.fields.find(f=>f.key==='lightning_entity')?.entity?.name||v.prevision.fields.find(f=>f.key==='lightning_entity')?.value||t('Non configuré')}</dd>
    <dt>${t('Entités')}</dt><dd>${entities}</dd></dl>`)}
   ${v.needs.length?html`${frame(t('À savoir'),html`<ul>${v.needs.map(n=>html`<li class="warn">${t('{need}. L’entité restera vide.',{need:n})}</li>`)}</ul>`)}`:nothing}
   <p class="notice">${this.entryId?t('En enregistrant, le lieu redémarre avec ses nouveaux réglages : la carte se met à jour quelques secondes plus tard.'):t('En enregistrant, Hestia Weather crée ce lieu et ses entités.')}</p>
   ${this.bottom()}`;
 }

 // ---- Pages: the same three as every Hestia brick (socle 1.12) ----
 private lines(kind:'todo'|'tips'):NkLine[]{
  const several=(this.places?.places.length??0)>1;
  return (this.places?.places??[]).flatMap(p=>p.health[kind].map(l=>({level:l.level,text:several?`${p.title} : ${l.text}`:l.text,why:l.why,
   go:l.stage!==null&&l.stage!==undefined?{label:t(stages[l.stage]),onClick:()=>void this.open(p.entry_id,l.stage!),disabled:this.busy}:null})));
 }
 /** What the place is made of, in a few words: its state is on its pill. */
 private placeDetail(p:Place){const station=p.health.technical?.station?.name;return station?t('Station {name}',{name:station}):t('Sans station, le service météo seul');}
 private placeLevel(p:Place):NkLevel{return p.failed?'bad':!p.loaded?'none':p.health.todo.length?'todo':'ok';}
 private placeState(p:Place){return p.failed?t('Démarrage en échec'):!p.loaded?t('Redémarrage en cours'):p.health.todo.length?(p.health.todo.length>1?t('{n} points à régler',{n:p.health.todo.length}):t('{n} point à régler',{n:p.health.todo.length})):t('Tout fonctionne');}
 /** Accueil: read only. What works, what is left to set, each place, the extensions and the versions. */
 private home(){
  const p=this.places!,todo=this.lines('todo'),failed=p.places.some(x=>x.failed);
  const head=pageHead({title:t('Météo'),subtitle:t('Vos lieux météo, leurs sources et leurs extensions.'),
   state:p.places.length?{level:failed?'bad':todo.length?'todo':'ok',text:failed?t('Un lieu ne démarre pas'):todo.length?(todo.length>1?t('{n} points à régler',{n:todo.length}):t('{n} point à régler',{n:todo.length})):t('Tout fonctionne'),detail:p.places.length>1?t('{n} lieux suivis',{n:p.places.length}):t('{n} lieu suivi',{n:p.places.length})}:undefined,
   actions:[{label:t('Réglages généraux'),onClick:()=>this.path('reglages')}]});
  if(!p.places.length)return html`<main>${head}${frame(t('Votre lieu météo'),html`<p class="muted">${t('Configurez votre lieu pour suivre ici les sources, les capteurs et les données disponibles.')}</p>
   ${p.can_add?html`<button class="primary" ?disabled=${this.busy} @click=${()=>void this.open(null)}>${t('Configurer mon lieu')}</button>`:html`<p class="warn">${t('Aucun service météo dans Home Assistant : installez Météo-France dans Appareils et services, puis revenez ici.')}</p>`}`)}</main>`;
  const first=p.places[0],tech=first.health.technical;
  const version=tech?.integration||first.health.version||t('Version non reçue');
  return html`<main>${head}${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}
   ${todoFrame(todo,this.lines('tips'))}
   ${itemsFrame({title:t('Vos lieux'),items:p.places.map(x=>({name:x.title,detail:this.placeDetail(x),pill:{text:this.placeState(x),level:this.placeLevel(x)}}))})}
   ${p.places.map(x=>this.place(x,p.places.length>1))}
   ${extensionsFrame(this.extensionRows(),{label:t('Gérer les extensions'),onClick:()=>this.path('extensions')})}
   ${versionsFrame([[t('Intégration'),version],[t('Carte'),version],['API',tech?`hestia_weather_api v${tech.interface_version}`:t('Version non reçue')],[t('Liaisons'),tech?.links.length?tech.links.join(' · '):t('Aucune brique reliée')]],repository,'hestia_weather')}
  </main>`;
 }
 /** Each extension in one word, over every place: used by one at least, installed only, or not installed. */
 private extensionRows(){
  const places=this.places?.places??[],all=places.flatMap(p=>p.extensions??[]),official=places.flatMap(p=>p.official??[]);
  const rows:{name:string;group?:string;pill:{text:string;level:NkLevel}}[]=[];
  for(const o of official.filter((o,i)=>official.findIndex(x=>x.id===o.id)===i)){const linked=official.some(x=>x.id===o.id&&x.linked);
   rows.push({name:o.name,group:t('Briques Hestia'),pill:!o.installed?{text:t('non installée'),level:'none'}:linked?{text:t('liée'),level:'ok'}:{text:t('à lier'),level:'todo'}});}
  for(const group of extensionGroups(all.filter((e,i)=>all.findIndex(x=>x.id===e.id)===i)))for(const e of group.items){const used=all.some(x=>x.id===e.id&&x.configured);
   rows.push({name:e.name,group:group.label,pill:used?{text:t('utilisée'),level:'ok'}:e.installed?{text:t('installée'),level:'none'}:{text:t('non installée'),level:'none'}});}
  return rows;
 }
 /** One place's own frames on the Accueil: its state and its numbers. */
 private place(p:Place,named:boolean){
  const h=p.health,tech=h.technical,station=tech?.station,entities=tech?.entities;
  const row=(label:string,text:string,level='none')=>html`<div class="technical-row"><strong>${label}</strong><span class=${level}>${text}</span></div>`;
  return html`<div class="dashboard-main">
    ${frame(named?t('État · {place}',{place:p.title}):t('État du lieu'),html`${row(t('Lieu'),p.loaded?t('Chargé'):p.failed?t('En échec'):t('En cours de chargement'),p.loaded?'ok':p.failed?'bad':'none')}
     ${h.sources.filter(x=>['forecast','vigilance'].includes(x.key??'')).map(x=>row(x.label,x.text,x.level))}
     ${row(t('Dernier calcul'),tech?.computation??t('Non disponible'),tech?.computation?'ok':'none')}
     ${row(t('Station'),station?.name||t('Non configurée'))}
     ${row(t('Historique'),!station?.name?t('Sans station'):!station.history?t('Désactivé'):station.history_sources==null?t('Non disponible'):station.history_sources>1?t('{n} sources avec des données',{n:station.history_sources}):t('{n} source avec des données',{n:station.history_sources}))}`)}
    ${frame(named?t('Statistiques · {place}',{place:p.title}):t('Statistiques'),html`<dl class="dashboard-stats">
     <div><dt>${t('Capteurs de station qui répondent')}</dt><dd>${station?.configured?`${station.responding} / ${station.configured}`:'—'}</dd></div>
     <div><dt>${t('Entités activées')}</dt><dd>${entities?`${entities.active} / ${entities.total}`:'—'}</dd></div>
     <div><dt>${t('Entités actives avec une valeur')}</dt><dd>${entities?`${entities.with_value} / ${entities.active}`:'—'}</dd></div>
     <div><dt>${t('Créneaux horaires reçus')}</dt><dd>${tech?.forecast.hours??'—'}</dd></div>
     <div><dt>${t('Prévisions quotidiennes reçues')}</dt><dd>${tech?.forecast.days==null?'—':(tech.forecast.days>1?t('{n} jours',{n:tech.forecast.days}):t('{n} jour',{n:tech.forecast.days}))}</dd></div>
    </dl>`)}
   </div>
   ${h.sensors.length?frame(named?t('Détail des capteurs · {place}',{place:p.title}):t('Détail des capteurs'),html`<ul class="sensors">${h.sensors.map(x=>html`<li class=${x.level}><span class="dot"></span><span title=${x.name}>${x.label}</span><span class="v">${x.text}</span></li>`)}</ul>`,{collapsible:true,open:false,count:h.sensors.length}):nothing}`;
 }
 /** Réglages généraux: each place to change or add, the extensions, and how to show the card. */
 private settings(){
  const p=this.places!;
  return html`<main>${pageHead({back:{label:t('Accueil Météo'),onClick:()=>this.path('')},title:t('Réglages généraux'),subtitle:t('Vos lieux météo, les extensions et les cartes.')})}
   ${this.saved?html`<p class="notice" role="status">${this.saved}</p>`:nothing}
   ${itemsFrame({title:t('Vos lieux'),hint:t('Sources, station, air, pollens, eau et entités de chaque lieu.'),
    add:p.can_add?{label:t('Ajouter un lieu'),onClick:()=>void this.open(null),disabled:this.busy}:undefined,
    items:p.places.map(x=>({name:x.title,detail:this.placeDetail(x),pill:{text:this.placeState(x),level:this.placeLevel(x)},edit:{label:t('Modifier'),onClick:()=>void this.open(x.entry_id,0),disabled:this.busy}})),
    empty:html`<p class="muted">${p.can_add?t('Aucun lieu pour l’instant : ajoutez le vôtre.'):t('Aucun service météo dans Home Assistant : installez Météo-France dans Appareils et services, puis revenez ici.')}</p>`})}
   ${this.renameFrame()}
   ${frame(t('Les cartes'),html`<p class="hint">${t('Dans un tableau de bord :')} <strong>${t('Ajouter une carte')}</strong>${t(', puis')} <strong>${t('Hestia Weather')}</strong>${t('. Choisissez le lieu et la taille de la carte dans ses réglages.')}</p>`)}
  </main>`;
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
   ${r.manual.length?html`<h3>${t('À corriger vous-même')}</h3><p class="hint">${t('Écrits à la main : Hestia ne les modifie pas.')}</p><ul>${r.manual.map(u=>this.renameUse(u))}</ul>`:nothing}
   ${r.taken.length?html`<h3>${t('Gardés tels quels')}</h3><p class="hint">${t('Leur nouveau nom est déjà pris.')}</p><ul class="hint">${r.taken.map(id=>html`<li>${id}</li>`)}</ul>`:nothing}
   <p>${t('L’historique et les statistiques sont conservés.')}</p>
   <p class="hint">${t('Hors de Home Assistant (Node-RED, applications…), changez les noms vous-même.')}</p>
   <p class="warn">${t('Faites une sauvegarde de Home Assistant avant.')}</p>
   <div class="actions"><button @click=${()=>{this.renameShown=false;}}>${t('Annuler')}</button>
    <button class="primary" ?disabled=${this.busy} @click=${()=>void this.runRename('hestia_weather/rename/apply')}>${t('Renommer')}</button></div>`);
 }
 private editor(){
  const v=this.view!;
  const body=[this.prevision,this.station,this.air,this.pollen,this.entities,this.recap,this.water,this.recap][this.stage].call(this,v);
  return html`<main>${pageHead({back:{label:t('Réglages généraux'),onClick:()=>this.leave()},title:this.entryId?t('Configurer {name}',{name:this.placeTitle||v.title}):t('Nouveau lieu'),subtitle:t('Les réglages de ce lieu météo')})}
   ${this.confirmLeave?leaveNotice({onStay:()=>{this.confirmLeave=false;},onLeave:()=>this.close()}):nothing}
   ${stepMenu(t('Configuration du lieu'),sections.map(x=>({label:t(x.label),title:t(stages[x.stage]),icon:x.icon,current:x.stage===this.stage,onClick:()=>this.go(x.stage)})),this.busy)}
   ${this.error?html`<p class="notice error" role="alert">${this.error}</p>`:nothing}
   <div class="room-content-head"><h2>${t(stages[this.stage])}</h2></div>${this.intro()}${body}
   ${this.entryId?removeBlock({link:t('Supprimer ce lieu'),title:t('Supprimer « {name} » ?',{name:this.placeTitle||v.title}),lines:[t('Ce lieu ne sera plus suivi : ses entités et sa carte disparaissent. Les capteurs de votre station et le service météo restent dans Home Assistant.')],
    keep:t('Garder le lieu'),confirm:t('Supprimer le lieu'),asking:this.confirmRemove,busy:this.busy,onAsk:()=>{this.confirmRemove=true;},onCancel:()=>{this.confirmRemove=false;},onConfirm:()=>void this.removePlace()}):nothing}</main>${this.busy?html`<p class="busy" role="status">${t('Un instant…')}</p>`:nothing}`;
 }
 protected render(){
  if(this.editing&&this.view)return this.editor();
  if(this.error&&!this.places)return html`<main><p class="notice error" role="alert">${this.error}</p><button @click=${()=>{this.error='';void this.load();}}>${t('Réessayer')}</button></main>`;
  if(!this.places)return html`<main><p class="muted" role="status">${t('Chargement…')}</p></main>`;
  if(this.page==='extensions')return this.extensionsPage();
  return html`${this.error?html`<main><p class="notice error" role="alert">${this.error}</p></main>`:nothing}${this.page==='settings'?this.settings():this.home()}`;
 }
}
