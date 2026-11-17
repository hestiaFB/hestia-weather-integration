// The installation guide (guide.ts): its screens follow the draft, each topic says whether it is complete.
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'hestia-weather-guide-'));
await build({entryPoints:['guide.ts'],bundle:true,platform:'node',format:'esm',outfile:join(temp,'guide.mjs'),logLevel:'silent'});
const {guideScreens,topicDone,guideTopics,nextScreen,sensorsToCheck}=await import(pathToFileURL(join(temp,'guide.mjs')));
after(()=>rm(temp,{recursive:true,force:true}));
const fixture=JSON.parse(await readFile(new URL('./fixtures/weather.json',import.meta.url)));
const view=(change=v=>v)=>change(structuredClone(fixture.view));
const keys=v=>guideScreens(v).map(s=>s.key);

test('a place with a station: every topic, the welcome first and the summary last',()=>{
 assert.deepEqual(keys(view()),['welcome','place','station','sensors','alerts','air','pollens','entities','recap']);
});
test('without a station, neither its sensors nor its place are asked',()=>{
 const v=view(v=>{v.station.model='none';v.station.place={values:{},asked:['station_side'],trust:{}};return v;});
 assert.deepEqual(keys(v),['welcome','place','station','alerts','air','pollens','entities','recap']);
});
test('the station’s place takes one screen a question, as the questionnaire asks them',()=>{
 const v=view(v=>{v.station.place={values:{},asked:['station_side','wind_shelter','station_height','rain_gauge_shelter'],trust:{}};return v;});
 assert.deepEqual(keys(v).filter(k=>k.startsWith('emplacement')),['emplacement:station_side','emplacement:station_height','emplacement:rain_gauge_shelter']);
 assert.equal(topicDone('emplacement',v,{}),false);
 v.station.place.values={station_side:'',station_height:'standard',rain_gauge_shelter:'open'};
 assert.equal(topicDone('emplacement',v,{}),true);  // « Je ne sais pas » is an answer
});
test('the other bricks are asked only when Weather offers one',()=>{
 const v=view(v=>{v.official=[{id:'hestia_comfort',name:'Hestia Confort',official:true,installed:true,linked:false,elsewhere:'',switchable:true,description:'',url:''}];return v;});
 assert.ok(keys(v).includes('bricks'));assert.equal(topicDone('bricks',v,{}),false);
 v.official[0].linked=true;assert.equal(topicDone('bricks',v,{}),true);
 v.official[0]={...v.official[0],installed:false,linked:false};assert.equal(topicDone('bricks',v,{}),true);
});
test('the weather service is the only step that holds the guide',()=>{
 assert.equal(topicDone('place',view(),{}),false);
 assert.equal(topicDone('place',view(),{weather_entity:'weather.maison'}),true);
});
test('a sensor is to check when it is missing, said wrong, has a better one, or is recognised but not chosen',()=>{
 assert.deepEqual(sensorsToCheck(view()).map(f=>f.key),[]);
 const v=view(v=>{const f=v.station.groups[0].fields[0];f.value='';return v;});
 assert.deepEqual(sensorsToCheck(v).map(f=>f.key),['temperature_entity']);
 assert.equal(topicDone('sensors',v,{}),false);
});
test('an optional topic with nothing to choose is complete; one with a source to pick is not',()=>{
 const v=view();
 assert.equal(topicDone('pollens',v,{}),true);   // no pollen source available here
 assert.equal(topicDone('alerts',v,{}),true);    // no vigilance nor season sensor found
 v.air.sources=[{value:'waqi',label:'WAQI',available:true},{value:'none',label:'Aucune',available:true}];v.air.value='none';
 assert.equal(topicDone('air',v,{}),false);
 v.air.value='waqi';assert.equal(topicDone('air',v,{}),true);
});
test('the summary lists each topic once, with the screen it starts on',()=>{
 const v=view(v=>{v.station.place={values:{},asked:['station_side','station_height'],trust:{}};return v;});
 const topics=guideTopics(v,{weather_entity:'weather.maison'});
 assert.deepEqual(topics.map(x=>x.topic),['place','station','sensors','emplacement','alerts','air','pollens','entities']);
 assert.equal(topics.find(x=>x.topic==='emplacement').first,'emplacement:station_side');
});
test('next and previous stay within the guide; a question no longer asked starts again from the welcome',()=>{
 const v=view();
 assert.equal(nextScreen(v,'welcome',1),'place');assert.equal(nextScreen(v,'welcome',-1),'welcome');
 assert.equal(nextScreen(v,'recap',1),'recap');assert.equal(nextScreen(v,'station',1),'sensors');
 assert.equal(nextScreen(v,'emplacement:station_wall',1),'place');
});
