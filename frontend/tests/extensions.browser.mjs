// The real Weather panel and shared shell, served with fictitious websocket responses only.
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const requestedWidths=process.env.WEATHER_WIDTHS?.split(',').map(Number)??[1280,390,320];
const require=createRequire(new URL('../../card/package.json',import.meta.url));
const {chromium}=require('playwright');
const base=JSON.parse(readFileSync(new URL('./fixtures/weather.json',import.meta.url)));
const assets=new URL('../../custom_components/hestia_weather/frontend/',import.meta.url);
// The hub's element is named after the socle's version (shell.ts): read there, never written by hand.
const SHELL=readFileSync(new URL('../socle/shell.ts',import.meta.url),'utf8').match(/ELEMENT='([^']+)'/)[1];
const fixture=JSON.stringify(base).replace(/</g,'\\u003c');
const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui;background:#151c25;color:#edf1f7;--primary-text-color:#edf1f7;--secondary-text-color:#bdc5d1;--primary-background-color:#151c25;--card-background-color:#222932;--divider-color:#657386}ha-panel-custom{display:block}</style><ha-panel-custom><${SHELL}></${SHELL}></ha-panel-custom><script type="module">
import '/hestia-socle.js';
const original=${fixture};const shell=document.querySelector('${SHELL}');window.shell=shell;window.calls=[];window.installed=false;window.comfortLinked=false;window.silentSensor=false;
window.saved=JSON.parse(sessionStorage.getItem('saved')||'null')||{...original.draft,water_restriction_entity:'',lightning_entity:''};
const extras=()=>[{id:'meteo_france',name:'Météo-France',description:'Prévisions et vigilance.',installed:true,configured:true,stage:0,field:'weather_entity',url:'https://www.home-assistant.io/integrations/meteo_france/',integration:'meteo_france',install:'Ajoutez Météo-France dans Appareils et services.'},{id:'atmo',name:'Atmo France',description:'Qualité de l’air et pollens.',installed:true,configured:false,stage:2,field:'',url:'https://github.com/sebcaps/atmofrance',integration:'atmofrance',air_configured:false,pollen_configured:false,install:'Ajoutez Atmo France dans Home Assistant.'},{id:'vigieau',name:'Vigieau',description:'Restrictions d’eau et usages concernés.',installed:true,configured:!!saved.water_restriction_entity,stage:6,field:'water_restriction_entity',url:'https://github.com/kamaradclimber/vigieau',integration:'vigieau',install:'Ajoutez Vigieau dans Home Assistant.'},{id:'blitzortung',name:'Blitzortung',description:'Éclairs à proximité, distance et direction.',installed:installed||!!saved.lightning_entity,configured:!!saved.lightning_entity,stage:0,field:'lightning_entity',url:'https://github.com/mrk-its/homeassistant-blitzortung',integration:'blitzortung',install:'Dans HACS, cherchez « Blitzortung.org Lightning Detector ». Puis ajoutez Blitzortung dans Appareils et services.'},...['waqi','polleninformation','irm_kmi','swiss_pollen','kleenex_pollenradar'].map((id,i)=>({id,name:['WAQI','Polleninformation','IRM KMI','Swiss Pollen','Kleenex / Scottex'][i],description:'',installed:i<2,configured:i<2,stage:i===0?2:3,field:'',url:'',integration:id,install:''})),{id:'open_meteo',name:'Open-Meteo',online:true,description:'Service météo en ligne, gratuit et sans compte, que Hestia Weather interroge directement.',detail:'Utilisé pour la pression à venir, quand votre service météo ne la prévoit pas. Il reçoit la position de la maison, arrondie à environ 100 m.',installed:true,configured:true,stage:0,field:'open_meteo_pressure',url:'https://open-meteo.com',integration:'',install:''}];
const official=()=>[{id:'hestia_comfort',name:'Hestia Confort',official:true,installed:true,linked:comfortLinked,elsewhere:'',switchable:true,description:'Vos pièces comparées au dehors de ce lieu : quand aérer, quand fermer, quand chauffer.',url:'https://github.com/hestiaFB/hestia-comfort-integration'}];
function reply(draft=saved){const r=structuredClone(original);r.draft=structuredClone(draft);r.saved=structuredClone(saved);r.view.extensions=extras();r.view.official=official();r.view.air.value=draft.air_source==='none'?'waqi':draft.air_source;r.view.air.sources=[{value:'atmo',label:'Atmo France',available:false},{value:'waqi',label:'WAQI',available:true},{value:'none',label:'Pas de qualité de l’air',available:true}];for(const [key,label]of [['water_restriction_entity','Restrictions d’eau (Vigieau)'],['lightning_entity','Éclairs (Blitzortung)']]){const value=draft[key]||'';const options=key==='lightning_entity'&&!installed&&!saved.lightning_entity?[]:[{id:key==='lightning_entity'?'sensor.blitz_distance':'sensor.vigieau',name:key==='lightning_entity'?'Distance des éclairs':'Vigieau Gardanne AEP',state:'',available:true,missing:false}];r.view.prevision.fields.push({key,label,help:'',value,entity:null,need:'Facultatif',options,warning:'',better:null,recognized:options.map(o=>o.id)});}return r;}
function technicalHealth(){const quiet=window.silentSensor;return {title:'Maison',level:quiet?'action':'ok',summary:quiet?'1 point à régler':'Tout est suivi',tips_summary:'',todo:quiet?[{level:'bad',text:'Le capteur de rafales ne répond pas',why:'Vérifiez la station.',stage:1}]:[],tips:[],sources:[{label:'Prévisions',level:'ok',text:'Météo-France · Gardanne · reçues il y a 4 min'},{label:'Station',level:quiet?'bad':'ok',text:'GW2000A'},{label:'Qualité de l’air',level:'ok',text:'WAQI · Aix-en-Provence'},{label:'Pollens',level:'ok',text:'Polleninformation · Gardanne'},...(saved.lightning_entity?[{label:'Éclairs',level:'ok',text:'Blitzortung · distance des éclairs'}]:[])],sensors:[{label:'Température extérieure',name:'Extérieur',level:'ok',text:'à l’instant'},{label:'Humidité',name:'Humidité dehors',level:'ok',text:'à l’instant'},{label:'Rafales',name:'Anémomètre',level:quiet?'bad':'ok',text:quiet?'ne répond pas':'il y a 1 min'}],entities:[{level:'ok',text:'12 actives sur 34',why:'Maintenant, Alertes, Jardin',stage:null},{level:'none',text:'2 actives sans valeur',why:'Fonctions en attente de données.',stage:null}],versions:[{level:'ok',text:'Carte 2.8.0b2',why:'fournie par l’intégration',stage:null}],technical:{station:{name:'Ecowitt GW2000A',responding:quiet?2:3,configured:3,history:true,history_sources:3},forecast:{hours:24,days:6,received:'il y a 4 min'},computation:'à l’instant',entities:{active:12,with_value:10,total:34},integration:'2.8.0b2',links:['Hestia Confort'],interface_version:1}};}
window.hass={themes:{darkMode:true},async callWS(msg){calls.push(structuredClone(msg));if(msg.type==='hestia/overview')return {version:1,socle:[1,9],sidebar:true,theme:'hestia',bricks:[{domain:'hestia_weather',name:'Hestia Weather',slug:'meteo',tab:'Météo',navigation:3,menu:[['','Vue d’ensemble','home'],['lieux','Lieux','weather'],['reglages','Réglages','settings'],['extensions','Extensions','extensions']],version:'test',module_url:'/panel.js',element:'hestia-weather-setup',status:{level:'ok',summary:'',details:[],links:[]}}],others:[]};if(msg.type==='hestia_weather/panel/places')return {can_add:true,places:[{entry_id:'maison',title:'Maison',loaded:true,failed:false,extensions:extras(),official:official(),health:technicalHealth()}]};if(msg.type==='hestia_weather/panel/link'){comfortLinked=msg.enabled;return {official:official()};}if(msg.type==='hestia_weather/panel/open')return reply();if(msg.type==='hestia_weather/panel/change'){const d={...msg.draft};if(msg.change.op==='set')d[msg.change.key]=msg.change.value;if(msg.change.op==='air')d.air_source=msg.change.value==='none'?'off':msg.change.value;return reply(d);}if(msg.type==='hestia_weather/panel/save'){window.saved=structuredClone(msg.draft);sessionStorage.setItem('saved',JSON.stringify(saved));return {entry_id:'maison'};}throw Error(msg.type);}};
function route(){shell.route={prefix:'/hestia',path:location.pathname.replace(/^\\/hestia/,'')};}window.addEventListener('location-changed',route);window.addEventListener('popstate',route);route();shell.hass=hass;
window.theme=(dark)=>{hass.themes={darkMode:dark};shell.hass={...hass};};
</script></html>`;
const server=createServer((req,res)=>{try{const path=req.url.split('?')[0];if(path.startsWith('/hestia/')||path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}else{const file=path.slice(1);if(!/^[\w.-]+$/.test(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'font/ttf');res.end(readFileSync(new URL(file,assets)));}}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true});const output=fileURLToPath(new URL('../../card/test-results/',import.meta.url));mkdirSync(output,{recursive:true});
try{for(const width of requestedWidths){const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width<600});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const panel=page.locator('hestia-weather-setup'),shell=page.locator(SHELL);
 const noOverflow=async()=>{assert.equal(await panel.evaluate(e=>[...e.shadowRoot.querySelectorAll('main,section,nav:not(.nk-tabs)')].some(x=>x.scrollWidth>x.clientWidth+2)),false,'overflow at '+width);};
 const capture=async(name)=>{const height=await panel.evaluate(e=>e.scrollHeight);await page.setViewportSize({width,height:Math.max(1000,height+20)});await panel.screenshot({path:output+'/'+name+'-'+width+'.png'});await page.setViewportSize({width,height:1000});};
 // The Hestia menu: on a phone it opens from the bar's title (socle 1.21).
 const go=async(label)=>{if(await shell.locator('.mobile-bar').isVisible())await shell.locator('.mobile-bar').getByRole('button',{name:'Ouvrir la navigation Hestia',exact:true}).click();await shell.locator('nav[aria-label="Météo"]').getByRole('link',{name:label,exact:true}).click();};
 const saves=()=>page.evaluate(()=>calls.filter(c=>c.type==='hestia_weather/panel/save').length);
 const tab=label=>panel.getByRole('tablist',{name:'Réglages du lieu'}).getByRole('tab',{name:label,exact:true});

 // The overview (socle 1.21, like Confort's): its state, a few numbers, what to set, the places; the brick's own menu.
 await page.goto(origin+'/hestia/meteo');await panel.getByRole('heading',{name:'Météo',exact:true,level:1}).waitFor();
 const nav=shell.locator('nav[aria-label="Météo"]');await nav.locator('a').first().waitFor({state:'attached'});assert.deepEqual(await nav.locator('a').allTextContents(),['Vue d’ensemble','Lieux','Réglages','Extensions']);
 await panel.getByText('Tout fonctionne',{exact:true}).first().waitFor();await panel.getByText('3 / 3',{exact:true}).waitFor();
 await panel.getByRole('heading',{name:'Lieux',exact:true,level:2}).waitFor();await panel.getByRole('button',{name:'Maison',exact:true}).waitFor();
 await noOverflow();await capture('weather-home');
 // A station sensor that stops answering is to fix on the overview; reading it saves nothing.
 const reread=quiet=>page.evaluate(async quiet=>{silentSensor=quiet;await window.shell.shadowRoot.querySelector('hestia-weather-setup').load();},quiet);
 await reread(true);
 await panel.getByText('Le capteur de rafales ne répond pas',{exact:true}).waitFor();await panel.getByText('2 / 3',{exact:true}).waitFor();await capture('weather-home-problem');
 assert.equal(await saves(),0);await reread(false);await panel.getByText('Le capteur de rafales ne répond pas',{exact:true}).waitFor({state:'detached'});

 // Extensions, one line each as in Confort: the official brick's switch is saved at once on its side, a third party's saves the place at once.
 await go('Extensions');await panel.getByRole('heading',{name:'Extensions',exact:true,level:1}).waitFor();await panel.getByRole('heading',{name:'Briques Hestia',exact:true,level:2}).waitFor();
 const confort=panel.getByRole('switch',{name:'Donner à Hestia Confort le dehors de ce lieu',exact:true});await confort.waitFor();assert.equal(await confort.isChecked(),false);await noOverflow();await capture('weather-extensions');
 await confort.check();await page.waitForFunction(()=>calls.some(c=>c.type==='hestia_weather/panel/link'&&c.enabled&&c.entry_id==='maison'));
 assert.equal(await panel.getByRole('switch',{name:'Utiliser Météo-France pour ce lieu',exact:true}).count(),0);
 const before=await saves();await panel.getByRole('switch',{name:'Utiliser WAQI pour ce lieu',exact:true}).uncheck();
 await page.waitForFunction(n=>calls.filter(c=>c.type==='hestia_weather/panel/save').length>n,before);assert.ok(await page.evaluate(()=>calls.some(c=>c.type==='hestia_weather/panel/change'&&c.change.op==='air'&&c.change.value==='none')));
 // Open-Meteo, asked directly: said with what it receives; its switch only allows the pressure to come.
 await panel.getByText(/arrondie à environ 100 m/).first().waitFor();
 const beforeMeteo=await saves();await panel.getByRole('switch',{name:'Utiliser Open-Meteo pour ce lieu',exact:true}).uncheck();
 await page.waitForFunction(n=>calls.filter(c=>c.type==='hestia_weather/panel/save').length>n,beforeMeteo);assert.ok(await page.evaluate(()=>calls.some(c=>c.type==='hestia_weather/panel/change'&&c.change.key==='open_meteo_pressure'&&c.change.value===false)));
 await capture('weather-extensions-linked');

 // One place, like a Confort room: its tabs, a draft kept from one tab to another, nothing saved before the save bar's « Enregistrer ».
 await go('Lieux');await panel.getByRole('heading',{name:'Lieux',exact:true,level:1}).waitFor();await panel.getByRole('button',{name:'Maison',exact:true}).click();
 await panel.getByRole('heading',{name:'Maison',exact:true,level:1}).waitFor();assert.deepEqual(await panel.getByRole('tablist',{name:'Réglages du lieu'}).getByRole('tab').allTextContents(),['Sources','Station','Air','Pollens','Eau et jardin','Entités','État']);
 assert.equal(await tab('Sources').getAttribute('aria-selected'),'true');await panel.getByRole('heading',{name:'Prévisions du lieu',exact:true,level:2}).waitFor();
 const writes=await saves();
 await page.evaluate(()=>{installed=true;});await panel.getByRole('button',{name:'Actualiser la détection',exact:true}).click();await panel.getByLabel('Éclairs (Blitzortung)',{exact:true}).selectOption('sensor.blitz_distance');
 await panel.locator('.nk-savebar.on').waitFor();await noOverflow();await capture('weather-place-sources');
 await tab('Eau et jardin').click();await panel.getByLabel('Restrictions d’eau (Vigieau)',{exact:true}).selectOption('sensor.vigieau');
 for(const label of ['Air','Pollens']){await tab(label).click();assert.equal(await tab(label).getAttribute('aria-selected'),'true');await noOverflow();await capture('weather-place-'+(label==='Air'?'air':'pollens'));}
 await tab('Eau et jardin').click();assert.equal(await panel.getByLabel('Restrictions d’eau (Vigieau)',{exact:true}).inputValue(),'sensor.vigieau');
 await tab('Sources').click();assert.equal(await panel.getByLabel('Éclairs (Blitzortung)',{exact:true}).inputValue(),'sensor.blitz_distance');
 assert.equal(await saves(),writes);
 await panel.locator('.nk-savebar').getByRole('button',{name:'Enregistrer',exact:true}).click();await page.waitForFunction(n=>calls.filter(c=>c.type==='hestia_weather/panel/save').length>n,writes);
 const saved=await page.evaluate(()=>calls.filter(c=>c.type==='hestia_weather/panel/save').at(-1).draft);assert.equal(saved.lightning_entity,'sensor.blitz_distance');assert.equal(saved.water_restriction_entity,'sensor.vigieau');
 // Its last tab, « État »: how it runs and its numbers.
 await page.goto(origin+'/hestia/meteo/maison/etat');await panel.getByRole('heading',{name:'État du lieu',exact:true,level:2}).waitFor();assert.equal(await tab('État').getAttribute('aria-selected'),'true');await panel.getByRole('heading',{name:'Statistiques',exact:true,level:2}).waitFor();

 // « Réglages »: what holds for every place, and « À propos ».
 await go('Réglages');await panel.getByRole('heading',{name:'Réglages',exact:true,level:1}).waitFor();await panel.getByRole('heading',{name:'À propos',exact:true,level:2}).waitFor();await noOverflow();

 // Direct addresses and reload.
 await page.goto(origin+'/hestia/meteo/maison/eau-jardin');await panel.getByLabel('Restrictions d’eau (Vigieau)',{exact:true}).waitFor();assert.equal(await tab('Eau et jardin').getAttribute('aria-selected'),'true');
 await page.reload();await panel.getByLabel('Restrictions d’eau (Vigieau)',{exact:true}).waitFor();
 await page.goto(origin+'/hestia/meteo/extensions');await panel.getByRole('heading',{name:'Briques Hestia',exact:true,level:2}).waitFor();
 await page.goto(origin+'/hestia/meteo/lieux');await panel.getByRole('heading',{name:'Lieux',exact:true,level:1}).waitFor();
 await page.goto(origin+'/hestia/meteo/maison/sources');await panel.getByRole('heading',{name:'Prévisions du lieu',exact:true,level:2}).waitFor();await noOverflow();await panel.screenshot({path:output+'/weather-settings-'+width+'.png'});
 // Nordic makes its dividers equal the page background: both themes must retain visible Hestia outlines around the lists.
 const lists=()=>panel.locator('.nk-list').evaluateAll(nodes=>nodes.filter(e=>e.getBoundingClientRect().width).map(e=>{const s=getComputedStyle(e);return {border:s.borderTopColor,width:s.borderTopWidth,page:getComputedStyle(e.getRootNode().host).backgroundColor};}));
 for(const dark of [true,false]){
  const colors=dark?{page:'#2e3440',card:'#38404f',text:'#d8dee9'}:{page:'#eceff4',card:'#ffffff',text:'#2e3440'};
  await page.evaluate(({dark,colors})=>{theme(dark);for(const [k,v]of Object.entries({'primary-background-color':colors.page,'ha-card-background':colors.card,'card-background-color':colors.card,'primary-text-color':colors.text,'divider-color':colors.page}))document.body.style.setProperty('--'+k,v);window.shell.overview={...window.shell.overview,theme:'ha'};},{dark,colors});
  await page.waitForFunction(()=>window.shell.getAttribute('data-appearance')==='ha'&&window.shell.shadowRoot.querySelector('hestia-weather-setup').getAttribute('data-appearance')==='ha');
  const place=await lists();assert.ok(place.length);for(const l of place){assert.notEqual(l.border,l.page);}await noOverflow();await panel.screenshot({path:output+'/weather-nordic-'+(dark?'dark':'light')+'-'+width+'.png'});
  await go('Vue d’ensemble');await panel.getByRole('heading',{name:'Météo',exact:true,level:1}).waitFor();await noOverflow();
  const home=await lists();assert.ok(home.length);for(const l of home){assert.notEqual(l.border,l.page);}await capture('weather-home-nordic-'+(dark?'dark':'light'));
  await page.goto(origin+'/hestia/meteo/maison/sources');await panel.getByRole('heading',{name:'Prévisions du lieu',exact:true,level:2}).waitFor();
 }
 // A new place goes through every step with « Continuer », water before entities, and ends at « Créer ce lieu ».
 await page.goto(origin+'/hestia/meteo/nouveau/sources');await panel.getByRole('heading',{name:'Nouveau lieu',exact:true,level:1}).waitFor();
 for(const label of ['Station','Air','Pollens','Eau et jardin','Entités','Récapitulatif']){await panel.getByRole('button',{name:'Continuer',exact:true}).click();assert.equal(await tab(label).getAttribute('aria-selected'),'true',label);await noOverflow();}
 await panel.getByRole('button',{name:'Créer ce lieu',exact:true}).waitFor();
 assert.deepEqual(errors,[]);await page.close();}
console.log('Weather overview, extensions in lines, a place in tabs with a kept draft and the save bar, settings, direct addresses, Nordic themes and a new place: OK.');}finally{await browser.close();await new Promise(r=>server.close(r));}
