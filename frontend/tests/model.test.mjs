import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'hestia-weather-'));
await build({entryPoints:['model.ts'],bundle:true,platform:'node',format:'esm',outfile:join(temp,'model.mjs')});
const {provenance,grouped,enabledKeys,entityLine,sameSet,extensionGroups,extensionSwitch}=await import(pathToFileURL(join(temp,'model.mjs')));
after(()=>rm(temp,{recursive:true,force:true}));
const sensor=(id,state='1')=>({id,name:id,state,available:true,missing:false});

test('what Hestia-FB proposes on top of the saved settings shows as proposed, until it is touched',()=>{
 const saved={temperature_entity:'sensor.a'};
 assert.equal(provenance('temperature_entity','sensor.a',saved,new Set()),'');
 assert.match(provenance('humidity_entity','sensor.h',saved,new Set()),/Proposé par Hestia-FB/);
 assert.equal(provenance('humidity_entity','sensor.h',saved,new Set(['humidity_entity'])),'');
 assert.equal(provenance('humidity_entity','sensor.h',undefined,new Set()),'');  // a new place: everything is proposed
});

test('recognised sensors come first, in their own group, only when there are others too',()=>{
 const groups=grouped({options:[sensor('sensor.a'),sensor('sensor.b')],recognized:['sensor.b']});
 assert.deepEqual(groups.map(g=>[g.label,g.options.map(o=>o.id)]),[['Reconnus',['sensor.b']],['Autres capteurs',['sensor.a']]]);
 assert.deepEqual(grouped({options:[sensor('sensor.a')],recognized:['sensor.a']}).map(g=>g.label),['']);
});

test('the entities switched on, and a sensor line that says when it is gone',()=>{
 const view={entities:{new:false,families:[{key:'f',name:'F',entities:[{key:'a',enabled:true},{key:'b',enabled:false}]}]}};
 assert.deepEqual(enabledKeys(view),['a']);
 assert.deepEqual(enabledKeys({entities:{new:true,families:[]}}),[]);
 assert.equal(entityLine({id:'sensor.x',name:'x',state:'',available:false,missing:true}),'sensor.x · introuvable');
 assert.equal(entityLine(sensor('sensor.t','14 °C')),'14 °C · sensor.t');
 assert.ok(sameSet(['a','b'],['b','a'])&&!sameSet(['a'],['a','b']));
});


test('extensions group by use and Atmo keeps separate air and pollen configuration and destinations',()=>{
 const shared={installed:true,configured:true,stage:2,field:'',description:'',name:'Atmo France'};
 const groups=extensionGroups([{...shared,id:'meteo_france',stage:0},{...shared,id:'atmo',air_configured:true,pollen_configured:false},{...shared,id:'waqi'},
  {...shared,id:'polleninformation',stage:3},{...shared,id:'vigieau',stage:6},{...shared,id:'blitzortung',stage:0}]);
 assert.deepEqual(groups.map(g=>g.label),['Sources météo','Qualité de l’air','Pollens','Eau et jardin','Orages et éclairs']);
 assert.equal(groups[1].items[0].configured,true);
 assert.equal(groups[2].items[0].configured,false);
 assert.equal(groups[2].items[0].stage,3);
 assert.notEqual(groups[1].items[0].id,groups[2].items[0].id);
});

test('an extension switch turns its source on or off in the draft, and Météo-France has none',()=>{
 const ext=(id,extra={})=>({id,name:id,description:'',installed:true,configured:false,stage:2,field:'',url:'',integration:id,install:'',...extra});
 const view={air:{value:'atmo',sources:[{value:'atmo',label:'Atmo'},{value:'waqi',label:'WAQI',available:false},{value:'none',label:'Aucune'}]},
  pollen:{value:'irm_kmi',sources:[{value:'atmo',label:'Atmo'},{value:'irm_kmi',label:'IRM'},{value:'none',label:'Aucun'}]},
  prevision:{fields:[{key:'lightning_entity',value:'',options:[sensor('sensor.strikes')],better:null},{key:'weather_entity',value:'weather.home',options:[],better:null}]}};
 const atmo=extensionSwitch(ext('atmo',{configured:true,air_configured:true,pollen_configured:false}),view);
 assert.deepEqual([atmo.shown,atmo.checked,atmo.uses],[true,true,['Qualité de l’air']]);
 assert.deepEqual(atmo.off,[{op:'air',value:'none'}]);           // pollens stay with IRM KMI
 assert.deepEqual(atmo.on,[{op:'pollen',value:'atmo'}]);         // air is Atmo already
 assert.equal(extensionSwitch(ext('waqi'),view).available,false);  // no WAQI station found: nothing to turn on
 // Ranged by theme, Atmo France is switched for that theme only.
 const [air]=extensionGroups([ext('atmo',{air_configured:true,pollen_configured:false})]).find(g=>g.key==='air').items;
 const [pollens]=extensionGroups([ext('atmo',{air_configured:true,pollen_configured:false})]).find(g=>g.key==='pollen').items;
 assert.deepEqual([extensionSwitch(air,view).checked,extensionSwitch(air,view).off],[true,[{op:'air',value:'none'}]]);
 assert.deepEqual([extensionSwitch(pollens,view).checked,extensionSwitch(pollens,view).on],[false,[{op:'pollen',value:'atmo'}]]);
 assert.deepEqual(extensionSwitch(ext('irm_kmi',{configured:true}),view).off,[{op:'pollen',value:'none'}]);
 const storm=extensionSwitch(ext('blitzortung',{field:'lightning_entity'}),view);
 assert.deepEqual([storm.available,storm.on],[true,[{op:'set',key:'lightning_entity',value:'sensor.strikes'}]]);
 assert.equal(extensionSwitch(ext('meteo_france',{field:'weather_entity',configured:true}),view).shown,false);
 assert.equal(extensionSwitch(ext('vigieau',{installed:false,field:'water_restriction_entity'}),view).shown,false);
});

test('Open-Meteo, asked directly, sits with the weather sources and its switch allows the pressure to come',()=>{
 const meteo={id:'open_meteo',name:'Open-Meteo',description:'',installed:true,online:true,configured:true,stage:0,field:'open_meteo_pressure',url:'https://open-meteo.com',integration:'',install:''};
 assert.deepEqual(extensionGroups([meteo]).map(g=>[g.key,g.items.map(e=>e.id)]),[['weather',['open_meteo']]]);
 const view={air:{value:'atmo',sources:[]},pollen:{value:'none',sources:[]},prevision:{fields:[]}};
 const on=extensionSwitch(meteo,view);
 assert.deepEqual([on.shown,on.checked,on.available,on.uses,on.off],[true,true,true,['Pression à venir'],[{op:'set',key:'open_meteo_pressure',value:false}]]);
 assert.deepEqual(extensionSwitch({...meteo,configured:false},view).on,[{op:'set',key:'open_meteo_pressure',value:true}]);
});
