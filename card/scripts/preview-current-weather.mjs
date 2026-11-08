import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import * as mdi from '@mdi/js';
import { serveDemoView } from './demo-view.mjs';

const page=name=>readFileSync(new URL(`../demo/${name}.html`,import.meta.url));
const bundlePath=new URL('../../custom_components/hestia_weather/frontend/hestia-weather-card.js',import.meta.url);
const icons=JSON.stringify(mdi);
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Cache-Control','no-store');
  if(path==='/demo/view') return serveDemoView(req,res);
  if(path==='/'||path==='/formats'||path==='/maquette'||path==='/bandeau'||path==='/capteurs'||path==='/cartes'||path==='/records'||path==='/banc-hestia-weather') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page(path==='/'?'current-weather':path.slice(1)));}
  else if(path==='/demo-hass.js') {res.setHeader('Content-Type','text/javascript');res.end(readFileSync(new URL('../demo/demo-hass.js',import.meta.url)));}
  else if(path==='/card.js') {res.setHeader('Content-Type','text/javascript');res.end(readFileSync(bundlePath));}
  else if(path==='/icons.json') {res.setHeader('Content-Type','application/json');res.end(icons);}
  else {res.writeHead(404);res.end();}
});
const port=Number(process.argv[2] ?? 0);
if(!Number.isInteger(port) || port<0 || port>65535) throw new Error('Port invalide');
server.listen(port,'127.0.0.1',()=>console.log(`Aperçu Hestia Weather : http://127.0.0.1:${server.address().port}`));
