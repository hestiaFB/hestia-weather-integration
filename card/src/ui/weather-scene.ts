/**
 * Hestia Weather — the sky set in a landscape: hills, a house, three trees, the sun and the moon on their course.
 * Written to stay light on a phone:
 *  · light and shade are colours computed once per render, never a filter over the artwork;
 *  · only `transform` and `opacity` are animated, so the browser's compositor does the work, not the page;
 *  · every drop and flake is its own small element, as on the plain sky (that is what looks natural), but fewer of them and one animation each;
 *  · the only blur is on the few banks of fog, drawn once and then only moved;
 *  · everything stops when the scene is off screen, the tab hidden, or reduced motion asked.
 */
import { css, html, LitElement, nothing, svg } from 'lit';
import { property } from 'lit/decorators.js';

import { define } from './define';
type RGB=number[];
const hx=(h:string):RGB=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mx=(a:RGB,b:RGB,t:number):RGB=>a.map((v,i)=>v+(b[i]-v)*t);
const rgb=(v:RGB)=>`rgb(${v.map(x=>Math.round(x)).join(' ')})`;
/** A fixed hash: the same scene at every render, never a comb. */
const rnd=(i:number,k:number)=>{const v=Math.sin((i+1)*12.9898+k*78.233)*43758.5453;return v-Math.floor(v);};

/** Day skies by condition and by Météo-France nuance, then the clear skies: top, middle, horizon. */
const SKIES:Record<string,[string,string,string]>={
  day:['#5689b8','#6cb4df','#a3d0e6'],night:['#0b1430','#1f3358','#3a5274'],twilight:['#404c8d','#d18d9b','#f2c599'],covered:['#111c2c','#2b3a4d','#46566a'],
  cloudy:['#5d7286','#8fa5b7','#c0ccd5'],'windy-variant':['#5d7286','#8fa5b7','#c0ccd5'],fog:['#8a97a1','#aeb9c0','#cbd3d8'],
  rainy:['#55626e','#7b8791','#a7b0b7'],pouring:['#464b50','#6a6f74','#9a9ea2'],lightning:['#3f4347','#63676b','#94989b'],'lightning-rainy':['#3f4347','#63676b','#94989b'],
  snowy:['#6d7c8a','#93a0ab','#bcc6cd'],'snowy-rainy':['#6d7c8a','#93a0ab','#bcc6cd'],hail:['#43474c','#676b70','#979b9f'],
  veil:['#7b9cb8','#a9c6db','#d4e2ec'],overcast:['#565f69','#7a838c','#a3abb1'],mist:['#6f98bd','#a6c3d8','#d2dfe8'],patches:['#5a8ab8','#8ab8da','#c2d8e6'],
  dense:['#7d8891','#9ea8af','#bcc4c9'],'freezing-fog':['#7c90a2','#a6b9c8','#cddbe6'],drizzle:['#66727d','#8a959e','#b3bbc1'],
  showers:['#5479a0','#7ba3c4','#aecbdd'],'showers-light':['#5479a0','#7ba3c4','#aecbdd'],'snow-showers':['#6485a6','#8eabc4','#bbcfdd'],'sleet-showers':['#5f7f9f','#89a6c0','#b8ccda'],
  'freezing-rain':['#5a6874','#85929c','#b1bbc2'],flurries:['#6f8498','#98abbb','#c2ced7'],'heavy-snow':['#5c6976','#84909b','#aeb8c0'],
  'storm-showers':['#525d68','#7a858f','#a5aeb5'],'storm-risk':['#4d5660','#727b84','#9da4aa']};
/** What the land wears, season by season. */
const SEASONS:Record<string,Record<string,string>>={
  spring:{far:'#aacfa6',near:'#8bbb7c',soil:'#6fa462',leaf:'#9ed089',leafb:'#86bd74',pop:'#7fc27a',popb:'#63a866',bir:'#b4d98c',birb:'#9cc777',bush:'#7fb96f',pine:'#4c7a5a',flower:'#f6d04d'},
  summer:{far:'#9ebf9c',near:'#7fa56f',soil:'#648f58',leaf:'#5f9f55',leafb:'#4b8748',pop:'#4f9460',popb:'#3f7d52',bir:'#86b56a',birb:'#6fa058',bush:'#5d9655',pine:'#4c7a5a',flower:'#f2e9d8'},
  autumn:{far:'#bdb890',near:'#a79c66',soil:'#8c8152',leaf:'#e3a23c',leafb:'#cc7033',pop:'#ecc548',popb:'#d9a637',bir:'#c9b24a',birb:'#b08f3a',bush:'#b98a3e',pine:'#56775a',flower:'#a79c66'},
  winter:{far:'#a9b8b4',near:'#8c9c8e',soil:'#74846f',leaf:'#8c9c8e',leafb:'#8c9c8e',pop:'#8c9c8e',popb:'#8c9c8e',bir:'#8c9c8e',birb:'#8c9c8e',bush:'#6f8a6c',pine:'#557565',flower:'#8c9c8e'}};
/** The colours of the village and the town: walls, shutters, stone, paving, the far skyline. Darkened at night like the rest. */
const TOWN:Record<string,string>={sand1:'#e8d6ab',sand2:'#d4bd8c',wa:'#e6bc7d',wb:'#e9b6a2',wc:'#efe3c6',sa:'#5f8fae',sb:'#78a07a',sc:'#8c82b6',stone:'#d8c8a8',stone2:'#b9a682',
  brick:'#b9694e',brick2:'#9c5440',ivory:'#e4d8c2',ivory2:'#cdbfa5',zinc:'#7d8a96',conc:'#a9b2ba',conc2:'#8e98a1',glass:'#86a9c4',
  pave1:'#cdbfa6',pave2:'#b4a68c',walk:'#c4c0b8',curb:'#9a978f',road:'#6d7178',sky1:'#a5b3c1',sky2:'#8795a4',rail:'#4f5a63',awn:'#c75b4a',pot:'#b5714f',wood:'#a8744a',wood2:'#7a5134',villa:'#f6f0e4',sblue:'#4f97c2'};
const HOUSE:Record<string,string>={wall:'#f6eee0',wall2:'#e2d5bd',roof:'#d07a5c',roof2:'#a8543c',chim:'#b9644b',door:'#5f7f96',shut:'#6f93ac',frame:'#fbf8f1',pane:'#93b9d6',trunk:'#6f5238',bark:'#ebe6da',step:'#c9bda6',path:'#d9cdb4'};
const CLOUD_REAR0='M40 112C20 112 6 99 6 80C6 63 18 51 34 48C35 26 51 9 72 9C92 9 107 22 110 40C116 37 122 35 129 35C153 35 173 52 173 76C173 96 158 110 140 111C132 118 114 120 104 114C94 120 73 120 64 114C56 119 45 118 40 112Z';
const CLOUD_NEAR0='M38 114C25 114 17 105 17 93C17 81 26 73 37 72C39 58 50 49 63 49C77 49 88 59 89 72C105 69 121 79 121 93C121 105 112 113 98 114C90 120 76 121 68 116C60 121 45 120 38 114Z';
/** Three clouds: a towering cumulus, a long flat bank, a round puff. Each can also be mirrored. */
const CLOUDS:[string,string][]=[[CLOUD_REAR0,CLOUD_NEAR0],
  ['M30 110C14 110 4 100 4 88C4 76 13 67 25 66C27 50 41 38 58 38C68 38 77 42 83 49C90 36 104 28 120 28C142 28 160 44 162 64C171 67 177 76 177 87C177 100 167 110 153 110C144 116 128 117 118 112C106 118 88 118 78 112C66 118 42 117 30 110Z',
   'M44 114C32 114 24 106 24 96C24 86 32 79 42 78C45 67 55 60 67 60C78 60 87 66 91 75C95 72 100 71 105 71C119 71 130 81 131 94C139 96 144 102 144 109C138 116 126 117 118 113C108 118 92 118 84 113C74 118 54 118 44 114Z'],
  ['M46 112C26 112 12 99 12 82C12 68 21 57 34 53C33 30 50 12 74 12C91 12 105 21 112 35C117 33 122 32 128 32C150 32 168 49 168 71C168 94 151 110 130 111C120 118 102 118 92 112C80 118 58 118 46 112Z',
   'M56 116C42 116 32 106 32 94C32 83 40 74 51 72C54 60 65 52 78 52C92 52 103 61 106 74C118 74 128 83 128 95C128 107 118 116 105 116C96 120 84 120 78 116C70 120 62 119 56 116Z']];
const BOLTS=['M58 0 43 40 61 52 35 88 49 97 24 144 37 151 12 217M43 40 23 56 34 67 17 91M35 88 72 107 64 121 88 147',
  'M42 0 62 35 48 52 81 87 67 102 92 153 80 171 104 216M62 35 85 40 81 58 105 80M81 87 58 104 66 118 44 140',
  'M70 0 52 30 66 44 40 78 58 86 30 130 44 136 26 190 34 196 22 218M52 30 34 42 40 56M40 78 18 96 26 108 10 124'];
/** The storm plays one 12 s sequence that every element shares, so the strikes, the lit clouds and the ground stay in step
 *  and the rhythm feels irregular rather than a metronome: a strike on the left, a double strike on the right, sheet lightning
 *  inside the clouds, the big one in the middle, a distant glimmer, a smaller strike on the left again.
 *  Strikes are at least 1.5 s apart and none flickers more than twice: never more than three flashes in a second (photosensitivity limit).
 *  [animation name, place along the sky, bolt shape (-1: none, the light stays inside the clouds), bolt height %, strength]. */
const STRIKES:[string,number,number,number,number][]=[['sA',.12,0,58,.85],['sB',.93,1,52,.9],['sC',.3,2,66,1],['sheet',.55,-1,0,.65],['glim',.8,-1,0,.45]];
/** Wind threads: gentle waves, and two that curl like a gust. */
const THREADS=['M0 20C60 8 120 30 180 18S300 6 400 20','M0 14C80 24 160 4 240 16S340 26 400 12','M0 18C90 10 170 26 260 16C320 10 350 0 340 -8C332 -16 316 -8 324 2',
  'M0 22C70 14 140 24 210 16S330 8 400 18','M0 16C100 22 200 8 290 18C340 24 372 12 364 2C358 -6 344 0 350 8'];
/** What the wind carries: a plane-tree leaf, a petal, a dandelion seed, a dry leaf. */
const PLANE='M22 32Q14 34 8 31L4 28.5L7.5 27Q11 25.5 10 22.5L4.5 21L6.5 19.5L1 13L4.5 12.5L3 9Q8 9 10.5 12L11.5 10Q14.5 13 16 16Q15.3 11 16.8 7.6L15.4 6.2L18.8 5.3Q20.8 3.6 22 1Q23.2 3.6 25.2 5.3L28.6 6.2L27.2 7.6Q28.7 11 28 16Q29.5 13 32.5 10L33.5 12Q36 9 41 9L39.5 12.5L43 13L37.5 19.5L39.5 21L34 22.5Q33 25.5 36.5 27L40 28.5L36 31Q30 34 22 32Z';
const FAR='M0 60V34C40 22 70 30 110 24S180 6 230 16 300 30 340 22 380 12 400 18V60Z', NEAR='M0 60V46C30 40 60 48 100 42S170 30 210 38 280 50 320 44 370 34 400 40V60Z';
const PINE='M10 0L16 11H13L18 21H14L20 31H11V34H9V31H0L6 21H2L7 11H4Z', PINE_SNOW='M10 0L14 7.5 10 6 6 7.5ZM7 11L10 9.5 13 11 15.5 16 10 14 4.5 16ZM6 21L10 19.5 14 21 17 27 10 24.5 3 27Z';
const STRONG_WIND=40, STRONG_GUST=70, BREEZE_WIND=25, BREEZE_GUST=45;
let scenes=0;
type Land={u:string;cap:number;cover:number;lit:boolean;downstairs:boolean;lamp:boolean;sway:string;plume:string;splash:boolean;hail:boolean;wet:boolean;freezingRain:boolean;
  low:boolean;sho:number;t:number;late:boolean;asleep:boolean;co:unknown;windy:boolean;storm:boolean;glint:{t:number;c:string;o:number}|null};

@define('hestia-weather-scene')
export class HestiaWeatherScene extends LitElement {
  private readonly uid=`sc${++scenes}`;
  @property() condition='unknown';
  /** Météo-France nuance inside a condition (few, veil, overcast, mist, patches, dense, freezing-fog, drizzle, showers…). */
  @property() detail='';
  @property({type:Number}) wind=0;
  @property({type:Number}) gust=0;
  /** spring | summer | autumn | winter: the trees and the hills change. */
  @property() season='';
  /** Local time as a decimal hour (0–24): with sunrise and sunset it places the sun and lights the land. */
  @property({type:Number}) hour=13;
  @property({type:Number}) sunrise=7;
  @property({type:Number}) sunset=19;
  /** Moon phase: 0 new · .25 first quarter · .5 full · .75 last quarter. */
  @property({type:Number,attribute:'moon-phase'}) moonPhase=.5;
  /** Moonrise and moonset as decimal hours; -1 when unknown: the moon then crosses the sky from sunset to sunrise. */
  @property({type:Number}) moonrise=-1;
  @property({type:Number}) moonset=-1;
  /** The stove or the heating is on: smoke rises from the chimney, and leans with the wind. */
  @property({type:Boolean}) smoke=false;
  /** Snow already lying on the ground, whatever the sky does now. */
  @property({type:Boolean,attribute:'snow-cover'}) snowCover=false;
  /** Windows: 'auto' (lit from dusk to bedtime, at dawn and under a dark sky) | 'on' | 'off'. */
  @property() lights='auto';
  /** Where the home stands: 'countryside' (a house among hills), 'village' (terraced houses and a bell tower),
   *  'city' (buildings along a street), 'apartment' (a block of flats, yours lit on the third floor), 'mountain' (a chalet under snowy peaks),
   *  'seaside' (a villa by the sea, under an umbrella pine). The sky is the same everywhere. */
  @property() place='countryside';
  /** The sky alone, still on the hour: the sun, the moon and the weather, without the landscape. Rain and snow fall to the bottom. */
  @property({ type: Boolean, attribute: 'sky-only' }) skyOnly = false;
  @property({type:Boolean}) animated=true;
  @property() quality:'low'|'standard'='standard';
  // Whether the scene is on screen and the page shown: they only pause or play the animations, set on the host (--play, inherited
  // by the scene), so scrolling past it or switching tabs never redraws it.
  private visible=false;
  private pageVisible=true;
  private observer?:IntersectionObserver;
  private play() {this.style.setProperty('--play',this.animated&&this.visible&&this.pageVisible?'running':'paused');}
  private visibility=()=>{this.pageVisible=!document.hidden;this.play();};
  connectedCallback() {
    super.connectedCallback();this.visibility();document.addEventListener('visibilitychange',this.visibility);
    if(typeof IntersectionObserver!=='undefined') {this.observer=new IntersectionObserver(e=>{this.visible=e.some(x=>x.isIntersecting);this.play();});this.observer.observe(this);}
    else {this.visible=true;this.play();}
  }
  disconnectedCallback() {super.disconnectedCallback();this.observer?.disconnect();document.removeEventListener('visibilitychange',this.visibility);}
  updated() {this.play();}

  /** Where the sun and the moon stand: p runs 0 → 1 from sunrise to sunset, m along the moon's own hours; dusk is 1 at sunrise and sunset and fades within 1 h 25. */
  private course() {
    const h=((this.hour%24)+24)%24, r=this.sunrise, s=this.sunset, day=Math.max(.5,s-r), night=24-day;
    const up=h>=r&&h<=s, p=(h-r)/day, q=((h-s+24)%24)/night;
    const away=(a:number)=>{const g=Math.abs(h-a);return Math.min(g,24-g);};
    const gap=Math.min(away(r),away(s)), edge=Math.max(0,1-gap/1.4), dusk=edge*edge*(3-2*edge);
    const known=this.moonrise>=0&&this.moonset>=0, span=known?((this.moonset-this.moonrise+24)%24||24):night, m=known?((h-this.moonrise+24)%24)/span:q;
    return {h,up,p,m,moonUp:known?m<=1:!up,dusk,evening:away(s)<away(r),alt:up?Math.sin(Math.PI*p):0};
  }
  /** A point on the arc that runs from one horizon to the other. */
  private static at(t:number) {
    const s=Math.sin(Math.PI*t);
    return `left:calc(var(--ax0) + (var(--ax1) - var(--ax0)) * ${t.toFixed(4)});top:calc(var(--ah) * ${(1-s).toFixed(4)} + var(--at) * ${s.toFixed(4)})`;
  }
  private cloud(i:number,x:number,top:number,w:number,o:number,shape:number,fast:boolean) {
    // Sizes are given for a scene 280 px high and shrink with it (cqh), so the clouds stay in the sky on a small card.
    const id=`${this.uid}c${i}`, width=`min(${w}px,${(w/2.8).toFixed(1)}cqh)`, [rear,near]=CLOUDS[shape%3], flip=rnd(i,31)<.5;
    return html`<div class="cloud" style=${`left:calc(var(--z0) + (100% - var(--z0)) * ${x});top:${top}cqh;width:${width};margin-left:calc(${width} / -2);opacity:${o};animation-duration:${fast?6+i%4*1.5:this.condition.startsWith('lightning')?12+(i*5)%9:22+(i*7)%19}s;animation-delay:${-i*4.3}s`}>
      <svg viewBox="0 0 180 124" style=${flip?'transform:scaleX(-1)':''} aria-hidden="true"><defs><linearGradient id=${id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".6" stop-color="#16202c" stop-opacity="0"/><stop offset="1" stop-color="#16202c" stop-opacity=".26"/></linearGradient></defs>
        <path fill="var(--cl1)" d=${rear}/><path fill=${`url(#${id})`} d=${rear}/><path fill="var(--cl2)" d=${near}/><path fill=${`url(#${id})`} d=${near}/></svg></div>`;
  }
  /** Three trees that do not look alike: a round oak, a tall poplar, a birch with its white trunk. Bare in winter, in blossom in spring. */
  private tree(kind:'oak'|'poplar'|'birch'|'fir'|'umbrella',cls:string,cap:number) {
    const bare=this.season==='winter', spring=this.season==='spring';
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    const art=kind==='fir'?svg`<path class="trunk" d="M30 92V78"/>
        <path fill="var(--pine)" d="M30 2L40 20H35L46 38H40L52 58H43L56 80H4L17 58H8L20 38H14L25 20H20Z"/>
        <path fill="var(--pine2)" d="M30 2L35 12L30 10L25 20H20ZM30 22L38 34L30 32L22 44H17L22 36ZM30 46L41 58L30 56L19 68H13Z"/>
        ${snowOn('M30 2L35.5 12L30 9.5L24.5 12ZM25 20L30 18L35 20L39 26L30 23L21 26ZM20 38L30 35.5L40 38L45 45L30 41L15 45ZM17 58L30 55L43 58L48.5 66L30 61.5L11.5 66Z')}`
      :kind==='umbrella'?svg`<path class="trunk" d="M30 92C30 78 26 66 31 52C33 46 36 42 38 38"/><path class="branch" d="M31 56C24 50 18 46 12 44M34 46C40 42 46 41 52 42M37 40C32 36 28 34 22 34"/>
        <path fill="var(--pine)" d="M-14 40C-14 32 -2 26 10 26C14 20 26 17 34 20C42 15 58 17 64 24C76 24 84 30 82 37C80 43 66 45 54 43C46 47 32 47 24 43C12 47 -14 47 -14 40Z"/>
        <path fill="var(--pine2)" d="M-6 33C0 28 10 27 14 28C20 22 30 21 36 24C44 20 56 22 60 27C50 26 42 28 36 30C28 28 18 30 12 33C6 31 0 32 -6 33Z"/>
        ${snowOn('M-12 34C-6 26 6 25 10 26C14 20 26 17 34 20C42 15 58 17 64 24C74 24 82 29 82 34C72 31 62 33 54 31C44 34 30 32 22 33C10 31 -2 32 -12 34Z')}`
      :kind==='poplar'?svg`<path class="trunk" d="M30 92V40"/>
        ${bare?svg`<path class="twigs" d="M30 80L24 64M30 74L36 58M30 66L23 48M30 60L37 42M30 52L25 32M30 46L35 26M30 40L30 12"/>${cap?svg`<path class="twig-snow" opacity=${cap} d="M24 62.5L29 76M36 56.5L31 70M23 46.5L29 62M37 40.5L31 56"/>`:nothing}`
        :svg`<path fill="var(--popb)" d="M30 5C36 5 41 12 43 22C46 24 47 30 45 35C48 40 47 48 44 52C46 60 43 70 38 75C35 79 25 79 22 75C17 70 14 60 16 52C13 48 12 40 15 35C13 30 14 24 17 22C19 12 24 5 30 5Z"/>
          <path fill="var(--pop)" d="M29 9C34 9 37 15 38 23C41 26 41 31 39 35C42 40 41 46 38 50C39 58 36 66 32 70C29 72 25 70 23 66C19 60 18 52 20 46C17 42 17 36 20 32C18 27 20 22 22 20C23 13 26 9 29 9Z"/>
          ${snowOn('M30 5C36 5 41 12 43 22C39 19 35 20 30 17C25 20 21 19 17 22C19 12 24 5 30 5Z')}`}`
      :kind==='birch'?svg`<path class="bark" d="M30 92V46"/><path class="bark thin" d="M30 70L21 58M30 62L40 50M30 54L25 42"/><path class="marks" d="M28 86h4M27.5 78h3M29 71h3.5M28 63h3M29 56h3"/>
        ${bare?svg`<path class="twigs light" d="M21 58L14 50M21 58L21 46M40 50L47 43M40 50L42 39M25 42L18 34M25 42L28 31M30 46L32 26M30 46L24 24"/>${cap?svg`<path class="twig-snow" opacity=${cap} d="M21 56.5L29 68M40 48.5L31 60M25 40.5L29 52"/>`:nothing}`
        :svg`<circle fill="var(--birb)" cx="19" cy="46" r="11"/><circle fill="var(--birb)" cx="42" cy="42" r="12"/><circle fill="var(--bir)" cx="30" cy="30" r="15"/><circle fill="var(--bir)" cx="26" cy="50" r="8"/><circle fill="var(--bir)" cx="38" cy="54" r="7"/>
          <circle fill="#fff" fill-opacity=".14" cx="26" cy="25" r="7"/>${snowOn('M15 30C17 20 24 14 31 15C39 15 45 21 46 30C42 26 36 27 31 24C25 27 20 26 15 30Z')}`}`
      :svg`<path class="trunk" d="M30 92V50"/><path class="branch" d="M30 72L20 58M30 66L41 52M30 58L24 44M30 52L36 38"/>
        ${bare?svg`<path class="twigs" d="M20 58L13 51M20 58L21 47M41 52L48 45M41 52L42 41M24 44L17 37M24 44L27 33M36 38L32 27M36 38L44 30M30 50L30 36"/>
          ${cap?svg`<path class="twig-snow" opacity=${cap} d="M20 56.5L29 67M41 50.5L31 62M24 42.5L29 54M36 36.5L31 48M13 49.5L19 56M48 43.5L42 50"/>`:nothing}`
        :svg`<circle fill="var(--leafb)" cx="16" cy="48" r="14"/><circle fill="var(--leafb)" cx="45" cy="47" r="15"/><circle fill="var(--leaf)" cx="30" cy="33" r="21"/><circle fill="var(--leaf)" cx="25" cy="52" r="11"/>
          <circle fill="#fff" fill-opacity=".12" cx="24" cy="26" r="10"/>
          ${spring?svg`<g fill="var(--blossom)"><circle cx="15" cy="42" r="2"/><circle cx="24" cy="22" r="2.2"/><circle cx="36" cy="18" r="1.8"/><circle cx="44" cy="34" r="2.2"/><circle cx="31" cy="38" r="1.8"/><circle cx="50" cy="50" r="2"/><circle cx="21" cy="55" r="1.8"/><circle cx="38" cy="50" r="2"/></g>`:nothing}
          ${snowOn('M10 32C12 19 22 11 31 12C42 12 50 21 51 32C46 26 39 28 31 24C23 28 16 26 10 32Z')}`}`;
    return html`<div class=${cls}><svg viewBox="0 0 60 92" aria-hidden="true">${art}</svg></div>`;
  }
  /** Rain, snow and hail, drop by drop as on the plain sky: each one draws its place, size, pace, lean and shade from a fixed hash.
   *  Fewer than there, and one animation each (a flake's sway is the only second one). */
  private drops(kind:'rain'|'snow'|'hail',n:number,o:{heavy:boolean;drizzle:boolean;freezing:boolean;windy:boolean;heavySnow:boolean}) {
    return Array.from({length:n},(_,i)=>{
      const r=(k:number)=>rnd(i,k+(kind==='rain'?100:kind==='snow'?200:300)), x=`left:${(r(1)*112-10).toFixed(1)}%`;
      if(kind==='rain') {
        // Far drops (most of them) are short, thin, pale and slower; near ones long and bright.
        const depth=r(3)<.45?0:r(3)<.82?1:2, dur=(o.heavy?.45:o.drizzle?1.5:.8)*(.85+r(4)*.35)*(1+(2-depth)*.18);
        const len=(o.heavy?34:o.drizzle?10:o.freezing?16:22)*(.55+r(5)*.7)*(.7+depth*.2), w=(o.heavy?2.4:o.drizzle?1.3:1.9)*(.75+depth*.2);
        const lean=(o.windy?24:o.heavy?15:o.drizzle?5:9)+(r(6)-.5)*5, drift=(o.windy?150:o.heavy?85:38)+(r(9)-.5)*20;
        return html`<i class="p rain" style=${`${x};--dl:${(-r(7)*dur).toFixed(2)}s;--du:${dur.toFixed(2)}s;--len:${len.toFixed(1)}px;--w:${w.toFixed(2)}px;--rot:${(-lean).toFixed(1)}deg;--o:${(.5+depth*.18+r(8)*.2).toFixed(2)};--dx:${drift.toFixed(0)}px`}></i>`;
      }
      if(kind==='snow') {
        // Mostly small, far flakes; a few soft large ones close by. Each sways at its own pace and width.
        const depth=r(3)<.4?0:r(3)<.75?1:r(3)<.93?2:3, dur=[13,10.5,8.5,7][depth]*(.85+r(4)*.3)*(o.heavySnow?.6:o.windy?.5:1);
        const size=[[2,3.4],[3,5],[4.5,6.5],[6.5,9.5]][depth], s=size[0]+r(5)*(size[1]-size[0]);
        return html`<i class="p snow" style=${`${x};--dl:${(-r(7)*dur).toFixed(2)}s;--du:${dur.toFixed(2)}s;--size:${s.toFixed(1)}px;--o:${([.55,.66,.76,.8][depth]+r(8)*.18).toFixed(2)};--amp:${([3,5,8,11][depth]*(.6+r(9)*.8)).toFixed(1)}px;--sw:${(2.2+r(10)*2.5).toFixed(2)}s;--dx:${o.windy?140:o.heavySnow?55:0}px`}></i>`;
      }
      const dur=1.9+r(4)*.8;
      return html`<i class="p hail" style=${`${x};--dl:${(-r(7)*dur).toFixed(2)}s;--du:${dur.toFixed(2)}s;--size:${(4+r(5)*2.4).toFixed(1)}px;--hx:${((r(6)<.5?-1:1)*(5+r(8)*8)).toFixed(0)}px`}></i>`;
    });
  }

  private countryside(o:Land) {
    const {u,cap,cover,lit,downstairs,lamp,sway,plume,splash,hail,wet,freezingRain,low,sho,t}=o;
    return html`<svg class="hills" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><defs>
        <linearGradient id=${`${u}hf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--far2)"/><stop offset=".7" stop-color="var(--far)"/></linearGradient>
        <linearGradient id=${`${u}hn`} x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="var(--near2)"/><stop offset="1" stop-color="var(--near)"/></linearGradient></defs>
        <path fill=${`url(#${u}hf)`} d=${FAR}/><path fill=${`url(#${u}hn)`} d=${NEAR}/></svg>
      <i class="ground"></i>
      ${wet&&!low?html`<i class="puddle" style="left:14%;width:52px;--y:.42"></i><i class="puddle" style="left:78%;width:40px;--y:.7"></i>`:nothing}
      ${freezingRain?html`<i class="glaze"></i>`:nothing}
      <div class="home" style=${sway}>
        ${sho>.01?html`<i class="shade" style=${`transform:translateX(${((.5-t)*150).toFixed(0)}px) scaleX(${(1+Math.abs(.5-t)*1.5).toFixed(2)});opacity:${sho.toFixed(2)}`}></i>`:nothing}
        ${this.tree('birch','tree t3',cap)}${this.tree('poplar','tree t2',cap)}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">
          <defs><linearGradient id=${`${u}w`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--wall)"/><stop offset="1" stop-color="var(--wall2)"/></linearGradient>
            <linearGradient id=${`${u}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--roof)"/><stop offset="1" stop-color="var(--roof2)"/></linearGradient>
            <radialGradient id=${`${u}g`}><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>
          <g transform="translate(6 103) scale(1.08)"><path fill="var(--pine)" d=${PINE}/>${cover?svg`<path fill="var(--snow)" opacity=${cap} d=${PINE_SNOW}/>`:nothing}</g>
          <g transform="translate(26 95) scale(1.32)"><path fill="var(--pine)" d=${PINE}/>${cover?svg`<path fill="var(--snow)" opacity=${cap} d=${PINE_SNOW}/>`:nothing}</g>
          <g transform="translate(50 20)">
            ${downstairs?svg`<ellipse cx="84" cy="121" rx="54" ry="7" fill=${`url(#${u}g)`}/>`:nothing}
            <path fill="var(--path)" d="M75 120H93L104 134H58Z"/>
            <path fill="var(--bush)" d="M20 120C18 110 27 104 34 108C37 100 50 101 51 111C57 112 58 118 56 120Z"/>
            ${this.season==='spring'||this.season==='summer'?svg`<g fill="var(--flower)"><circle cx="112" cy="123" r="1.5"/><circle cx="121" cy="127" r="1.5"/><circle cx="131" cy="122" r="1.5"/><circle cx="44" cy="126" r="1.5"/><circle cx="33" cy="123" r="1.5"/><circle cx="142" cy="128" r="1.5"/></g>`:nothing}
            <path fill="none" stroke="var(--bush)" stroke-width="1.2" stroke-linecap="round" d="M116 126l-1.5-4M118 126l1-4.5M38 128l-1.5-4M40 128l1.5-4M136 125l-1-4M138 125l1.5-3.5"/>
            ${cover?svg`<path fill="var(--snow)" opacity=${cap} d="M22 111C26 104 31 105 34 108C38 100 49 101 51 110C45 106 40 108 36 111C31 108 27 108 22 111Z"/>`:nothing}
            <path fill="var(--chim)" d="M98 34H110V56H98Z"/><path fill="var(--roof2)" d="M96 31H112V35H96Z"/>
            <path fill=${`url(#${u}w)`} d="M44 76H124V120H44Z"/><path fill="#2a1c10" fill-opacity=".15" d="M44 76H124V83H44Z"/>
            <path fill=${`url(#${u}r)`} d="M33 79L51 45H117L135 79Z"/><path fill="none" stroke="#3a1408" stroke-opacity=".2" d="M47 53H121M43 61H125M38.5 70H129.5"/><path fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round" d="M52 45.6H116"/>
            ${cover?svg`<g fill="var(--snow)" opacity=${cap}><path d="M32 80L50.5 44H117.5L136 80C128 84 122 79 114 82S100 79 92 82 78 79 70 82 56 79 48 82 38 79 32 80Z"/><path d="M95.5 31.5C98 27.5 110 27.5 112.5 31.5V33H95.5Z"/></g>`:nothing}
            <path fill="var(--wall)" d="M64 69V57L72 51L80 57V69Z"/><path fill="var(--roof2)" d="M60.5 58.5L72 49L83.5 58.5L81 60.5L72 53L63 60.5Z"/>
            ${cover?svg`<path fill="var(--snow)" opacity=${cap} d="M60.5 58.5L72 48L83.5 58.5L81.5 59L72 51.5L62.5 59Z"/>`:nothing}
            <path fill="var(--step)" d="M73 117H95V120H73Z"/><path fill="var(--door)" d="M77 118V98A7 7 0 0 1 91 98V118Z"/><circle fill="var(--frame)" cx="88" cy="109" r="1"/>
            <path fill="var(--shut)" d="M46.5 88h4v18h-4zM69.5 88h4v18h-4zM94.5 88h4v18h-4zM117.5 88h4v18h-4z"/>
            <path fill="var(--frame)" d="M51 88h18v18H51zM99 88h18v18H99z"/>
            ${lit?svg`<circle cx="72" cy="62" r="11" fill=${`url(#${u}g)`}/>`:nothing}
            ${downstairs?svg`<circle cx="60" cy="97" r="17" fill=${`url(#${u}g)`}/><circle cx="108" cy="97" r="17" fill=${`url(#${u}g)`}/>`:nothing}
            <path fill=${lit?'#ffd98c':'var(--pane)'} d="M68.5 58h7v8h-7z"/>
            <path fill=${downstairs?'#ffd98c':'var(--pane)'} d="M53 90h14v14H53zM101 90h14v14h-14z"/>
            ${downstairs?nothing:svg`<path fill="#fff" fill-opacity=".28" d="M53 90h6l-6 7zM101 90h6l-6 7z"/>`}
            <path fill="none" stroke=${downstairs?'#c79a58':'var(--frame)'} stroke-width="1.2" d="M60 90V104M53 97H67M108 90V104M101 97H115"/>
            ${lamp?svg`<circle cx="95.5" cy="93" r="6" fill=${`url(#${u}g)`}/><circle cx="95.5" cy="93" r="1.7" fill="#fff2c8"/>`:nothing}
          </g></svg>
        ${this.tree('oak','tree',cap)}
        ${this.smoke?html`<div class="smoke" style=${plume}>${[0,1,2].slice(0,low?2:3).map(i=>html`<i style=${`animation-delay:calc(var(--smt) * ${-i/3})`}></i>`)}</div>`:nothing}
        ${(splash||hail)&&!low?html`${[[118,66],[150,70],[178,58]].map(([x,y],i)=>html`<i class="sp roof" style=${`left:${x}px;bottom:${y}px;--t:${1+i*.23}s;--d:${-i*.5}s`}></i>`)}
          ${splash?[86,182].map((x,i)=>html`<i class="drip" style=${`left:${x}px;--t:${1.2+i*.3}s;--d:${-i*.6}s`}></i>`):nothing}`:nothing}
      </div>`;
  }

  /** What every place shares: puddles, glaze, the shade under the home, smoke, rain bouncing on the roofs and dripping from the eaves. */
  private extras(o:Land,smoke:[number,number],roofs:[number,number][],drips:number[]) {
    const {splash,hail,low,sho,t,plume}=o;
    return html`${sho>.01?html`<i class="shade" style=${`transform:translateX(${((.5-t)*150).toFixed(0)}px) scaleX(${(1+Math.abs(.5-t)*1.5).toFixed(2)});opacity:${sho.toFixed(2)}`}></i>`:nothing}
      ${this.smoke?html`<div class="smoke" style=${`${plume};left:${smoke[0]}px;bottom:${smoke[1]}px`}>${[0,1,2].slice(0,low?2:3).map(i=>html`<i style=${`animation-delay:calc(var(--smt) * ${-i/3})`}></i>`)}</div>`:nothing}
      ${(splash||hail)&&!low?html`${roofs.map(([x,y],i)=>html`<i class="sp roof" style=${`left:${x}px;bottom:${y}px;--t:${1+i*.23}s;--d:${-i*.5}s`}></i>`)}
        ${splash?drips.map((x,i)=>html`<i class="drip" style=${`left:${x}px;--t:${1.2+i*.3}s;--d:${-i*.6}s`}></i>`):nothing}`:nothing}`;
  }
  /** A window: a pane, lit warm with its halo when someone is home, or showing a glint of the sky. */
  private static win(x:number,y:number,w:number,h:number,on:boolean,u:string,bars=true) {
    return svg`${on?svg`<circle cx=${x+w/2} cy=${y+h/2} r=${Math.max(w,h)*1.05} fill=${`url(#${u}g)`}/>`:nothing}
      <rect x=${x} y=${y} width=${w} height=${h} fill=${on?'#ffd98c':'var(--pane)'}/>
      ${on?nothing:svg`<path fill="#fff" fill-opacity=".26" d=${`M${x} ${y}h${(w*.42).toFixed(1)}l${(-w*.42).toFixed(1)} ${(h*.48).toFixed(1)}z`}/>`}
      ${bars?svg`<path fill="none" stroke=${on?'#c79a58':'var(--frame)'} stroke-width="1" d=${`M${x+w/2} ${y}V${y+h}M${x} ${y+h/2}H${x+w}`}/>`:nothing}`;
  }
  /** Which windows of a building are lit: most in the evening, a few late at night, none by day. Fixed per window, never a blink. */
  private static share(o:Land,i:number,k:number) {
    if(!o.lit) return false; const r=rnd(i,k);
    return o.late||o.asleep?r<.16:r<.58;
  }
  private static gradients(u:string) {
    return svg`<defs><radialGradient id=${`${u}g`}><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
      <linearGradient id=${`${u}sh`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>`;
  }

  /** The village: three terraced houses in warm colours, tiled roofs over a double row of génoise, painted shutters,
   *  the bell tower and its wrought-iron campanile behind, a plane tree and a street lamp on a paved street. */
  private village(o:Land) {
    const {u,cap,cover,lit,downstairs,lamp,sway,wet,freezingRain,low}=o, G=HestiaWeatherScene, W=G.win;
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    // [left, right, eave height, wall colour, shutter colour]
    const H:[number,number,number,string,string][]=[[52,116,52,'wa','sa'],[116,178,66,'wb','sb'],[178,226,80,'wc','sc']];
    const upper=(i:number)=>lit&&(i!==1||!o.late), lower=(i:number)=>downstairs&&i!==2;
    return html`<svg class="hills" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--far)" d=${FAR}/><path fill="var(--near)" d=${NEAR}/></svg>
      <i class="ground street"></i>
      ${wet&&!low?html`<i class="puddle" style="left:14%;width:52px;--y:.42"></i><i class="puddle" style="left:78%;width:40px;--y:.7"></i>`:nothing}
      ${freezingRain?html`<i class="glaze"></i>`:nothing}
      <div class="home" style=${sway}>
        ${this.extras(o,[166,90],[[86,90],[148,76],[204,62]],[116,178])}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">${G.gradients(u)}
          <!-- The bell tower behind the houses -->
          <path fill="var(--stone2)" d="M30 140V30H60V140Z"/><path fill="var(--stone)" d="M30 140V30H52V140Z"/>
          <path fill="var(--stone2)" d="M27 30H63V25H27Z"/><path fill="var(--rail)" d="M45 25C33 25 31 12 45 4C59 12 57 25 45 25ZM45 4V0"/>
          <path fill="none" stroke="var(--stone)" stroke-width="1.2" d="M45 22C36 22 35 13 45 7C55 13 54 22 45 22Z"/><path fill="#c9a24a" d="M42 20h6l-1-6h-4z"/>
          <path fill="var(--rail)" d="M40 42h10v14H40z"/><circle cx="45" cy="38" r="4" fill="var(--ivory)"/><path stroke="var(--rail)" stroke-width=".8" d="M45 38V35.5M45 38l2 1"/>
          ${snowOn('M26 26C30 22 60 22 64 26V28H26Z')}
          ${H.map(([l,r,e,wall,sh],i)=>{
            const w=r-l, mid=(l+r)/2, tw=(w-28)/2;
            return svg`<path fill=${`var(--${wall})`} d=${`M${l} ${e}H${r}V140H${l}Z`}/><path fill=${`url(#${u}sh)`} d=${`M${l} ${e}H${r}V140H${l}Z`}/>
              <path fill="var(--roof2)" d=${`M${l-4} ${e}L${l+6} ${e-9}H${r-6}L${r+4} ${e}Z`}/><path fill="var(--roof)" d=${`M${l-4} ${e}L${l+6} ${e-9}H${r-6}L${r+4} ${e}V${e-1}H${l-4}Z`} fill-opacity=".55"/>
              <path fill="none" stroke="var(--ivory)" stroke-width="2.4" stroke-dasharray="2.4 1.6" d=${`M${l-1} ${e+1.6}H${r+1}`}/><path fill="none" stroke="var(--ivory2)" stroke-width="2" stroke-dasharray="2 1.8" d=${`M${l+1} ${e+4}H${r-1}`}/>
              ${snowOn(`M${l-5} ${e+.5}L${l+5.5} ${e-10}H${r-5.5}L${r+5} ${e+.5}C${r-6} ${e+3} ${mid} ${e-1} ${l+4} ${e+3}Z`)}
              ${i<2?svg`${W(l+8,e+12,tw-4,15,upper(i),u)}${W(r-8-tw+4,e+12,tw-4,15,upper(i),u)}
                <path fill=${`var(--${sh})`} d=${`M${l+3} ${e+12}h4v15h-4zM${l+4+tw} ${e+12}h4v15h-4zM${r-12-tw+4} ${e+12}h4v15h-4zM${r-7} ${e+12}h4v15h-4z`}/>`:nothing}
              ${W(l+8,i<2?e+40:e+12,tw-4,i<2?15:14,i<2?lower(i):upper(i),u)}${i===2?svg`${W(r-8-tw+4,e+12,tw-4,14,upper(i),u)}`:svg``}
              <path fill=${`var(--${sh})`} d=${`M${l+3} ${i<2?e+40:e+12}h4v${i<2?15:14}h-4z`}/>
              ${i===1?svg`<path fill=${`var(--${sh})`} d=${`M${mid+2} 140V112A12 12 0 0 1 ${mid+26} 112V140Z`}/><path fill="var(--ivory)" fill-opacity=".5" d=${`M${mid+2} 112A12 12 0 0 1 ${mid+26} 112`} stroke="var(--ivory)" stroke-width="1.5"/>
                  ${W(mid-26,110,20,22,downstairs,u,false)}<path fill="var(--awn)" d=${`M${mid-30} 104h28l-3 5h-22z`}/>`
                :svg`<path fill=${`var(--${sh})`} d=${`M${r-22} 140V${i===0?114:112}A7 7 0 0 1 ${r-8} ${i===0?114:112}V140Z`}/>`}
              ${i===2?svg`<path fill="var(--pot)" d="M183 134h10l-1.5 6h-7z"/><circle cx="188" cy="131" r="4.5" fill="var(--leaf)"/>`:nothing}`;})}
          <path fill="var(--chim)" d="M161 40h10v18h-10z"/><path fill="var(--roof2)" d="M159 38h14v3h-14z"/>${snowOn('M158.5 38.5C161 34.5 171 34.5 173.5 38.5V40H158.5Z')}
          <!-- The street lamp -->
          <path fill="none" stroke="var(--rail)" stroke-width="1.8" d="M18 140V96M18 98H26"/><path fill="var(--rail)" d="M22 98h8l-1.5 8h-5z"/>
          ${lamp?svg`<circle cx="26" cy="104" r="11" fill=${`url(#${u}g)`}/><path fill="#fff2c8" d="M23.3 99h5.4l-1 6h-3.4z"/>`:svg`<path fill="var(--pane)" d="M23.3 99h5.4l-1 6h-3.4z"/>`}
        </svg>
        ${this.tree('oak','tree village',cap)}
      </div>`;
  }

  /** The town: a brick building with a shop and its awning, a stone building with a zinc mansard and balconies,
   *  a modern one in glass bands, a far skyline whose windows light up at dusk, a tree and a street lamp on the pavement. */
  private city(o:Land) {
    const {u,cap,lamp,sway,wet,freezingRain,low,downstairs}=o, G=HestiaWeatherScene, W=G.win;
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    return html`${this.skyline(o,0)}
      <i class="ground road"></i>
      ${wet&&!low?html`<i class="puddle" style="left:22%;width:60px;--y:.18"></i><i class="puddle" style="left:70%;width:44px;--y:.24"></i>`:nothing}
      ${freezingRain?html`<i class="glaze"></i>`:nothing}
      <div class="home tall" style=${sway}>
        ${this.extras(o,[212,124],[[66,128],[138,96],[204,118]],[])}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">${G.gradients(u)}
          <!-- Brick building, six floors, a shop at the bottom -->
          <path fill="var(--brick)" d="M28 12H100V140H28Z"/><path fill=${`url(#${u}sh)`} d="M28 12H100V140H28Z"/><path fill="var(--brick2)" d="M26 8H102V13H26Z"/>
          <path fill="var(--conc2)" d="M80 0h12v8H80z"/><path fill="none" stroke="var(--rail)" stroke-width="1" d="M86 0V-8M82 -6H90"/>${snowOn('M25 8.5C30 5 98 5 103 8.5V10H25Z')}
          ${[0,1,2,3,4].map(r=>[0,1,2].map(k=>W(36+k*22,20+r*19,12,13,G.share(o,r*3+k,11),u))).flat()}
          <path fill="var(--brick2)" d="M28 113H100V116H28Z"/>${W(34,120,40,20,downstairs,u,false)}<path fill="var(--door)" d="M80 140V122h14V140Z"/>
          <path fill="var(--awn)" d="M30 113h48l-4 7H34z"/><path fill="#fff" fill-opacity=".35" d="M36 113h6l-1 7h-5zM48 113h6v7h-6zM60 113h6l1 7h-6z"/>
          <!-- Stone building, zinc mansard with dormers, wrought-iron balconies -->
          <path fill="var(--ivory)" d="M100 44H176V140H100Z"/><path fill=${`url(#${u}sh)`} d="M100 44H176V140H100Z"/>
          <path fill="var(--zinc)" d="M98 44L104 26H172L178 44Z"/><path fill="var(--conc2)" d="M150 18h8v10h-8z"/>
          ${[0,1,2].map(k=>svg`<path fill="var(--ivory)" d=${`M${110+k*22} 42V32l5-4 5 4V42Z`}/>${W(112+k*22,33,6,8,G.share(o,k,21),u,false)}`)}
          ${snowOn('M97 44.5L103.5 25H172.5L179 44.5C160 41 120 47 97 44.5Z')}
          ${[0,1,2,3].map(r=>[0,1,2].map(k=>W(108+k*22,52+r*21,12,15,G.share(o,r*3+k,31),u))).flat()}
          <path fill="none" stroke="var(--rail)" stroke-width="1.2" d="M104 69H172M104 90H172M104 111H172M104 72H172M104 93H172M104 114H172"/>
          <path fill="var(--door)" d="M128 140V128a10 10 0 0 1 20 0V140Z"/>
          <!-- Modern building, glass bands -->
          <path fill="var(--conc)" d="M176 24H232V140H176Z"/><path fill=${`url(#${u}sh)`} d="M176 24H232V140H176Z"/>${snowOn('M175 24.5C190 21 220 21 233 24.5V26H175Z')}
          ${[0,1,2,3,4].map(r=>svg`<rect x="181" y=${32+r*20} width="46" height="11" fill="var(--glass)"/>${[0,1,2,3].map(k=>G.share(o,r*4+k,41)?svg`<rect x=${182+k*11.4} y=${33+r*20} width="10" height="9" fill="#ffd98c"/>`:nothing)}`)}
          <path fill="var(--conc2)" d="M200 18h12v6h-12z"/>
          <!-- Tree in its planter and the street lamp -->
          <path fill="var(--conc2)" d="M246 132h22v8h-22z"/>
          <path fill="none" stroke="var(--rail)" stroke-width="1.8" d="M284 140V88M284 90H274"/><path fill="var(--rail)" d="M268 90h10l-2 6h-6z"/>
          ${lamp?svg`<circle cx="273" cy="96" r="12" fill=${`url(#${u}g)`}/><path fill="#fff2c8" d="M270 96h6l-1 2h-4z"/>`:nothing}
        </svg>
        ${this.tree('birch','tree city',cap)}
      </div>`;
  }

  /** The block of flats: five floors of French windows and balconies; yours, on the third, has its plants and follows your lights.
   *  Neighbours on both sides, the town behind, a tree in front. */
  private apartment(o:Land) {
    const {u,cap,lit,downstairs,lamp,sway,wet,freezingRain,low}=o, G=HestiaWeatherScene, W=G.win;
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    const ours=lit&&!o.asleep, floors=[0,1,2,3,4];
    return html`${this.skyline(o,1)}
      <i class="ground road"></i>
      ${wet&&!low?html`<i class="puddle" style="left:18%;width:56px;--y:.2"></i><i class="puddle" style="left:74%;width:40px;--y:.22"></i>`:nothing}
      ${freezingRain?html`<i class="glaze"></i>`:nothing}
      <div class="home tall" style=${sway}>
        ${this.extras(o,[190,136],[[96,134],[150,134],[248,108]],[])}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">${G.gradients(u)}
          <!-- Neighbours -->
          <path fill="var(--conc2)" d="M6 46H72V140H6Z"/>${snowOn('M5 46.5C20 43 60 43 73 46.5V48H5Z')}
          ${[0,1,2,3].map(r=>[0,1].map(k=>W(16+k*28,56+r*21,14,13,G.share(o,r*2+k,51),u))).flat()}
          <path fill="var(--brick)" d="M214 30H286V140H214Z"/><path fill=${`url(#${u}sh)`} d="M214 30H286V140H214Z"/>${snowOn('M213 30.5C230 27 270 27 287 30.5V32H213Z')}
          ${[0,1,2,3,4].map(r=>[0,1,2].map(k=>W(222+k*22,38+r*20,12,13,G.share(o,r*3+k,61),u))).flat()}
          <!-- The block: our flat is the middle one on the third floor -->
          <path fill="var(--ivory)" d="M72 12H214V140H72Z"/><path fill=${`url(#${u}sh)`} d="M72 12H214V140H72Z"/><path fill="var(--ivory2)" d="M70 8H216V13H70Z"/>
          <path fill="var(--conc2)" d="M186 0h8v8h-8z"/>${snowOn('M69 8.5C90 5 196 5 217 8.5V10H69Z')}
          ${floors.map(f=>[0,1,2].map(k=>{const y=18+f*24, mine=f===2&&k===1, on=mine?ours:f===4&&k===1?downstairs:G.share(o,f*3+k,71);
            return svg`${W(84+k*44,y,18,18,on,u)}
              <path fill="var(--ivory2)" d=${`M${80+k*44} ${y+18}h26v2.5h-26z`}/><path fill="none" stroke="var(--rail)" stroke-width="1" d=${`M${80+k*44} ${y+13}h26M${80+k*44} ${y+13}v5.5M${106+k*44} ${y+13}v5.5M${86.5+k*44} ${y+13}v5.5M${93+k*44} ${y+13}v5.5M${99.5+k*44} ${y+13}v5.5`}/>
              ${mine?svg`<path fill="var(--pot)" d=${`M${81+k*44} ${y+10}h6l-1 4h-4zM${99+k*44} ${y+10}h6l-1 4h-4z`}/><circle cx=${84+k*44} cy=${y+7.5} r="4" fill="var(--leaf)"/><circle cx=${102+k*44} cy=${y+8} r="3.5" fill="var(--leafb)"/>
                ${ours?svg`<path fill="none" stroke="#ffe7a3" stroke-width=".9" stroke-dasharray=".1 3.2" stroke-linecap="round" d=${`M${80+k*44} ${y+1}Q${93+k*44} ${y+6} ${106+k*44} ${y+1}`}/>`:nothing}`:nothing}`;})).flat()}
          <path fill="var(--door)" d="M134 140V124h18V140Z"/><path fill="var(--ivory2)" d="M130 121h26v3h-26z"/>
          ${lamp?svg`<circle cx="143" cy="118" r="7" fill=${`url(#${u}g)`}/><circle cx="143" cy="118" r="1.6" fill="#fff2c8"/>`:nothing}
        </svg>
        ${this.tree('oak','tree flat',cap)}${this.tree('poplar','tree flat2',cap)}
      </div>`;
  }

  /** Far towers behind the town, two rows, their windows lit at dusk (fixed dots, no animation). */
  private skyline(o:Land,k:number) {
    const night=o.lit;
    const far=[[0,40],[34,22],[60,34],[96,10],[126,30],[160,18],[196,36],[226,6],[262,28],[300,16],[336,34],[372,20],[408,38],[440,12],[476,30],[512,24],[548,40],[580,18]];
    const near=[[0,52],[44,44],[80,56],[120,40],[168,50],[206,46],[250,54],[290,42],[338,52],[380,44],[424,56],[466,46],[512,52],[556,42]];
    const path=(rows:number[][],w:number)=>rows.map(([x,y])=>`M${x} 70V${y}H${x+w}V70Z`).join('');
    const dots=(rows:number[][],w:number,key:number)=>night?rows.flatMap(([x,y],i)=>Array.from({length:Math.floor((66-y)/7)},(_,r)=>[0,1].map(c=>rnd(i*31+r*3+c,key+k)<.34?`M${x+4+c*(w-10)/1} ${y+5+r*7}h3v3h-3z`:'')).flat()).join(''):'';
    return html`<svg class="skyline" viewBox="0 0 600 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path fill="var(--sky1)" d=${path(far,30)}/><path fill="#ffd98c" fill-opacity=".85" d=${dots(far,30,81)}/>
      <path fill="var(--sky2)" d=${path(near,40)}/><path fill="#ffd98c" d=${dots(near,40,91)}/></svg>`;
  }

  /** The mountain: two ranges of peaks, their snow caps (larger in winter), an alpine meadow, a wooden chalet on its stone base
   *  with its balcony and geraniums, firs around it and a stack of firewood. */
  private mountain(o:Land) {
    const {u,cap,lit,downstairs,lamp,sway,wet,freezingRain,low}=o, G=HestiaWeatherScene, W=G.win;
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    const winter=this.season==='winter'||cap>0, flowers=this.season==='spring'||this.season==='summer';
    const FARP='M0 90V58L40 34L62 46L96 18L124 38L150 26L190 52L230 20L262 40L290 30L330 54L372 16L404 36L430 28L470 50L508 22L540 40L570 30L600 44V90Z';
    const NEARP='M0 90V70L52 48L86 62L130 40L176 66L214 50L262 70L310 44L352 64L398 52L446 72L494 46L540 64L600 56V90Z';
    const CAPF=winter?'M74 31L96 18L114 31L106 29L98 33L90 28L82 33ZM208 33L230 20L248 33L240 31L232 35L224 30L216 35ZM350 29L372 16L390 29L382 27L374 31L366 26L358 31ZM486 35L508 22L526 35L518 33L510 37L502 32L494 37Z'
      :'M86 24L96 18L106 24L100 23L96 26L92 23ZM220 26L230 20L240 26L234 25L230 28L226 25ZM362 22L372 16L382 22L376 21L372 24L368 21ZM498 28L508 22L518 28L512 27L508 30L504 27Z';
    const CAPN=winter?'M114 47L130 40L146 47L138 46L130 50L122 46ZM294 51L310 44L326 51L318 50L310 54L302 50ZM478 53L494 46L510 53L502 52L494 56L486 52Z':'';
    return html`<svg class="peaks" viewBox="0 0 600 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path fill="var(--rockf)" d=${FARP}/><path fill="var(--cap)" d=${CAPF}/><path fill="var(--rockn)" d=${NEARP}/>${CAPN?svg`<path fill="var(--cap)" d=${CAPN}/>`:nothing}</svg>
      <svg class="hills" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--near)" d=${NEAR}/></svg>
      <i class="ground"></i>
      ${wet&&!low?html`<i class="puddle" style="left:16%;width:46px;--y:.4"></i>`:nothing}
      ${freezingRain?html`<i class="glaze"></i>`:nothing}
      <div class="home" style=${sway}>
        ${this.extras(o,[173,110],[[100,96],[140,104],[184,92]],[70,210])}
        ${this.tree('fir','tree fir1',cap)}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">${G.gradients(u)}
          <!-- Stone base, wooden upper floor in vertical boards -->
          <path fill="var(--stone)" d="M84 104H198V140H84Z"/><path fill="none" stroke="var(--stone2)" stroke-width="1" d="M84 113H198M84 122H198M84 131H198M100 104v9M126 113v9M150 104v9M176 113v9M112 122v9M164 122v9M138 131v9M190 131v9"/>
          <path fill="var(--wood)" d="M88 66H194V104H88Z"/><path fill="none" stroke="var(--wood2)" stroke-width=".8" stroke-opacity=".6" d="M96 66V104M104 66V104M112 66V104M120 66V104M128 66V104M136 66V104M144 66V104M152 66V104M160 66V104M168 66V104M176 66V104M184 66V104"/>
          <path fill="var(--wood)" d="M88 66V62.6L141 35L194 62.6V66Z"/><path fill="none" stroke="var(--wood2)" stroke-width=".8" stroke-opacity=".6" d="M104 54.3V66M120 46V66M136 37.6V66M152 40.8V66M168 49V66M184 57.3V66"/>${W(132,48,18,14,lit,u)}
          <path fill="var(--chim)" d="M166 30h12v24h-12z"/><path fill="var(--stone2)" d="M164 28h16v4h-16z"/>
          <!-- The wide roof, its thick edge and the shade under it -->
          <path fill="#1d140c" fill-opacity=".26" d="M66 74L141 35L216 74L208 74L141 40L74 74Z"/>
          <path fill="var(--wood2)" d="M62 72L141 30L220 72L216 74L141 35L66 74Z"/><path fill="var(--roof2)" d="M62 70L141 28L220 70L214 70L141 32L68 70Z"/>
          ${snowOn('M58 72L141 25L224 72C222.5 75 218 75.5 214 73.5L141 32L68 73.5C64 75.5 59.5 75 58 72Z')}${snowOn('M163.5 28.5C166 24 178 24 180.5 28.5V30H163.5Z')}
          ${W(100,72,18,16,lit,u)}${W(164,72,18,16,lit&&!o.late,u)}
          <path fill="var(--sb)" d="M95 72h4v16h-4zM119 72h4v16h-4zM159 72h4v16h-4zM183 72h4v16h-4z"/>
          <!-- The balcony, its carved balusters and flower boxes -->
          <path fill="var(--wood2)" d="M80 90H202V93H80ZM80 101H202V104H80Z"/><path fill="none" stroke="var(--wood2)" stroke-width="2.4" d="M84 93V101M92 93V101M100 93V101M108 93V101M116 93V101M124 93V101M132 93V101M140 93V101M148 93V101M156 93V101M164 93V101M172 93V101M180 93V101M188 93V101M196 93V101"/>
          ${flowers?svg`<path fill="var(--pot)" d="M98 86h22v4H98zM162 86h22v4h-22z"/><g fill="#d8474a">${[100,105,110,115,164,169,174,179].map(x=>svg`<circle cx=${x+2} cy="84.5" r="2.3"/>`)}</g><g fill="var(--leaf)"><circle cx="99" cy="87" r="1.6"/><circle cx="119" cy="87" r="1.6"/><circle cx="163" cy="87" r="1.6"/><circle cx="183" cy="87" r="1.6"/></g>`:nothing}
          ${snowOn('M79 90.5C110 88 170 88 203 90.5V91.5H79Z')}
          ${W(96,112,16,16,downstairs,u)}${W(170,112,16,16,downstairs,u)}<path fill="var(--door)" d="M132 140V114h18V140Z"/><path fill="var(--wood2)" d="M130 112h22v3h-22z"/>
          ${lamp?svg`<circle cx="156" cy="116" r="6" fill=${`url(#${u}g)`}/><circle cx="156" cy="116" r="1.6" fill="#fff2c8"/>`:nothing}
          <!-- Firewood stacked against the wall -->
          <path fill="var(--wood2)" d="M202 122h26v18h-26z"/><g fill="var(--wood)">${[[206,126],[213,126],[220,126],[209.5,132],[216.5,132],[223.5,132],[206,138],[213,138],[220,138]].map(([x,y])=>svg`<circle cx=${x+1} cy=${y-1} r="3"/>`)}</g>
          ${snowOn('M201 122.5C205 119 225 119 229 122.5V124H201Z')}
        </svg>
        ${this.tree('fir','tree fir2',cap)}${this.tree('fir','tree fir3',cap)}
      </div>`;
  }

  /** The seaside: the sea, coloured by the sky, a sail on the horizon, the sun's or the moon's path of light on the water,
   *  waves rolling on the beach; a white villa with its blue shutters and its pergola, and an umbrella pine. */
  private seaside(o:Land) {
    const {u,cap,lit,downstairs,lamp,sway,wet,low,windy,storm,glint}=o, G=HestiaWeatherScene, W=G.win;
    const snowOn=(d:string)=>cap?svg`<path fill="var(--snow)" opacity=${cap} d=${d}/>`:nothing;
    const rough=windy||storm, green=this.season==='winter'?'var(--leafb)':'var(--leaf)';
    return html`<div class="sea">
        <svg class="cape" viewBox="0 0 200 30" preserveAspectRatio="xMinYMax meet" aria-hidden="true"><path fill="var(--rockf)" d="M0 30V12C20 6 34 10 50 4C70 -2 96 8 120 14C150 20 176 22 200 30Z"/></svg>
        ${rough?html`<svg class="caps" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M30 10h14M120 6h10M200 14h16M290 8h12M360 18h14M70 24h18M160 30h12M250 26h16M330 32h18M20 34h12"/></svg>`:nothing}
        ${glint&&!low?html`<svg class="glint" style=${`left:calc(var(--ax0) + (var(--ax1) - var(--ax0)) * ${glint.t.toFixed(4)});--go:${glint.o.toFixed(2)}`} viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
          <g fill=${glint.c}>${[[19,3,2,1],[16,9,5,1.2],[21,13,4,1.2],[13,19,6,1.4],[22,24,7,1.4],[15,30,5,1.6],[9,36,9,1.6],[24,40,8,1.8],[14,47,7,1.8],[5,53,11,2],[22,57,10,2],[12,64,9,2.2],[27,69,9,2.2],[3,74,12,2.4],[17,79,11,2.4],[8,86,10,2.6],[24,89,13,2.6],[1,95,14,2.8],[18,96,16,2.8]].map(([x,y,w,h])=>svg`<rect x=${x} y=${y} width=${w} height=${h} rx=${h/2}/>`)}</g></svg>`:nothing}
        ${low?nothing:html`<div class="sail"><svg viewBox="0 0 20 18" aria-hidden="true"><path fill="var(--ivory)" d="M10 0V13H2ZM11 2C15 6 16 10 15 13H11Z"/><path fill="var(--rail)" d="M1 14H19L16 18H4Z"/></svg></div>`}
        <i class="surf" style="bottom:5%"></i>${low?nothing:html`<i class="surf s2" style="bottom:28%"></i>`}
      </div>
      <i class="ground sand"></i>
      ${wet&&!low?html`<i class="puddle" style="left:30%;width:50px;--y:.4"></i>`:nothing}
      <div class="home" style=${sway}>
        ${this.extras(o,[165,104],[[96,80],[136,84],[176,78]],[78,198])}
        <svg class="house" viewBox="0 0 300 140" aria-hidden="true">${G.gradients(u)}
          <!-- The villa: white walls, a low tiled roof over its génoise, blue shutters, an arched door -->
          <path fill="var(--villa)" d="M74 64H192V140H74Z"/><path fill=${`url(#${u}sh)`} d="M74 64H192V140H74Z"/>
          <path fill="var(--chim)" d="M158 38h12v18h-12z"/><path fill="var(--roof2)" d="M156 36h16v3h-16z"/>
          <path fill="var(--roof2)" d="M66 64L90 46H176L200 64Z"/><path fill="var(--roof)" fill-opacity=".55" d="M66 64L90 46H176L200 64V63H66Z"/>
          <path fill="none" stroke="var(--ivory)" stroke-width="2.4" stroke-dasharray="2.4 1.6" d="M70 65.6H196"/><path fill="none" stroke="var(--ivory2)" stroke-width="2" stroke-dasharray="2 1.8" d="M72 68H194"/>
          ${snowOn('M64 64.5L89 45H177L202 64.5C180 67 150 62 130 66S90 62 64 64.5Z')}${snowOn('M155.5 36.5C158 32.5 170 32.5 172.5 36.5V38H155.5Z')}
          ${[86,124,162].map((x,i)=>svg`${W(x,76,16,18,i===1?lit:lit&&!o.late,u)}<path fill="var(--sblue)" d=${`M${x-5} 76h4v18h-4zM${x+17} 76h4v18h-4z`}/>`)}
          ${W(86,108,16,18,downstairs,u)}<path fill="var(--sblue)" d="M81 108h4v18h-4zM103 108h4v18h-4z"/>
          <path fill="var(--sblue)" d="M126 140V116a10 10 0 0 1 20 0V140Z"/>
          ${W(162,108,16,18,downstairs,u)}<path fill="var(--sblue)" d="M157 108h4v18h-4zM179 108h4v18h-4z"/>
          ${lamp?svg`<circle cx="152" cy="112" r="6" fill=${`url(#${u}g)`}/><circle cx="152" cy="112" r="1.6" fill="#fff2c8"/>`:nothing}
          <!-- The pergola and its vine -->
          <path fill="none" stroke="var(--wood)" stroke-width="2.4" d="M194 100H246M198 100V140M242 100V140"/><path fill="none" stroke="var(--wood2)" stroke-width="1.6" d="M200 96V104M210 96V104M220 96V104M230 96V104M240 96V104"/>
          <path fill=${green} d="M192 100C196 92 206 94 210 98C214 92 226 94 228 98C234 92 246 94 248 102C244 106 236 104 232 106C226 108 218 104 212 106C204 108 196 106 192 100Z"/>
          ${this.season==='spring'?svg`<g fill="#b9a2e0">${[[198,104],[206,107],[214,105],[222,108],[230,106],[238,105],[244,108]].map(([x,y])=>svg`<path d=${`M${x} ${y}c-2 3 0 7 1 9c1-2 3-6 -1-9z`}/>`)}</g>`:nothing}
          ${snowOn('M192 100C196 92 206 94 210 98C214 92 226 94 228 98C234 92 246 94 248 102C240 98 230 100 220 98S200 100 192 100Z')}
          <path fill="var(--pot)" d="M214 130h12l-2 10h-8z"/><circle cx="220" cy="126" r="6" fill="var(--leafb)"/>
        </svg>
        ${this.tree('umbrella','tree umbrella',cap)}
      </div>`;
  }

  private land(o:Land) {
    return this.place==='mountain'?this.mountain(o):this.place==='seaside'?this.seaside(o):this.place==='village'?this.village(o):this.place==='city'?this.city(o):this.place==='apartment'?this.apartment(o):this.countryside(o);
  }

  protected render() {
    const c=this.condition, d=this.detail, low=this.quality==='low', u=this.uid, co=this.course();
    // ───── What the weather is ─────
    const freezingRain=d==='freezing-rain', stormHail=d==='storm-hail', distant=d==='storm-risk', drizzle=d==='drizzle';
    const showers=['showers','showers-light','snow-showers','sleet-showers','storm-showers'].includes(d);
    const hail=c==='hail'||stormHail, heavy=c==='pouring';
    const rain=['rainy','pouring','lightning-rainy','snowy-rainy','hail'].includes(c)||stormHail;
    const snow=['snowy','snowy-rainy'].includes(c)&&!freezingRain;
    const storm=['lightning','lightning-rainy'].includes(c), bolts=storm&&!distant;
    const fog=c==='fog', dense=d==='dense'||d==='freezing-fog', known=c!=='unknown'&&c!=='exceptional';
    const clouded=known&&!fog&&!['sunny','clear-night'].includes(c);
    const closed=heavy||(bolts&&d!=='storm-showers')||hail||d==='overcast';
    const open=!known||['sunny','clear-night','partlycloudy','windy'].includes(c)||showers||distant||d==='mist'||d==='patches';
    const windy=['windy','windy-variant'].includes(c)||this.wind>=STRONG_WIND||this.gust>=STRONG_GUST;
    const breeze=!windy&&(this.wind>=BREEZE_WIND||this.gust>=BREEZE_GUST);
    const grey=closed||rain||snow||(clouded&&c!=='partlycloudy'&&c!=='windy');
    // ───── Light: one number for the land, computed once ─────
    const f=((this.moonPhase%1)+1)%1, moonLit=(1-Math.cos(2*Math.PI*f))/2;
    const shade=closed&&storm?.6:closed?.7:grey?.86:fog?.92:1, nightL=.33+(open&&co.moonUp?.1*moonLit:0);
    const base=co.up?shade:nightL, L=base+(.66*Math.max(shade,.85)-base)*co.dusk, warm=open&&!fog?co.dusk:0;
    const NIGHT:RGB=[24,32,56], WARM:RGB=[255,150,100];
    const tone=(v:RGB,k=1)=>rgb(mx(mx(v,NIGHT,(1-L)*.84*k),WARM,warm*.1));
    // ───── Sky: the day (or night) sky of the weather melts into its twilight ─────
    const clearKind=['sunny','clear-night','partlycloudy','windy'].includes(c)||!known;
    const sky=(k:string)=>SKIES[k].map(hx), dayS=sky(SKIES[d]?d:SKIES[c]?c:'day'), nightS=clearKind?sky('night'):sky('covered');
    const twiS=clearKind?sky('twilight'):dayS.map((v,i)=>mx(mx(v,sky('covered')[i],.55),sky('twilight')[i],.22));
    const nowS=(co.up?dayS:nightS).map((v,i)=>mx(v,twiS[i],co.dusk));
    // ───── Snow on the ground: lying, settling, or a veil of rime ─────
    const cover=this.snowCover?1:c==='snowy'&&d!=='flurries'?(d==='heavy-snow'?.85:.62):d==='freezing-fog'?.4:0;
    // Where snow lies it is white: on the roof, the trees and the pines it never shows as a pink or green veil.
    const cap=cover?Math.max(cover,.92):0;
    const S=SEASONS[this.season]??SEASONS.summer, SNOW=hx('#f7fafd'), SNOW2=hx('#dde7f1');
    const land=(k:string,to:RGB)=>tone(mx(hx(S[k]),to,cover));
    const mood=closed&&storm||heavy||hail?['#4b4e52','#787b7f']:d==='overcast'?['#7b858f','#a7b0b8']:grey?['#8493a3','#bcc7d1']:['#dce4ea','#ffffff'];
    const fogInk=tone(d==='freezing-fog'?hx('#dbe8f3'):hx('#d5dce1'),.5);
    const vars=[`--sky:linear-gradient(172deg,${rgb(nowS[0])},${rgb(nowS[1])} 60%,${rgb(nowS[2])})`,
      `--sea1:${tone(mx(hx('#79b7c6'),nowS[2],grey?.62:.32))}`,`--sea2:${tone(mx(hx('#2a6f90'),nowS[1],grey?.5:.18))}`,
      `--rockf:${tone(mx(hx('#8f9cab'),nowS[2],.45))}`,`--rockn:${tone(mx(hx('#6d7a89'),nowS[2],.2))}`,`--cap:${tone(mx(hx('#f4f8fc'),nowS[2],.15))}`,
      `--far:${land('far',SNOW2)}`,`--near:${land('near',SNOW)}`,`--soil:${land('soil',SNOW2)}`,`--pine:${tone(hx(S.pine))}`,`--pine2:${tone(mx(hx(S.pine),hx('#ffffff'),.18))}`,`--leaf:${tone(hx(S.leaf))}`,`--leafb:${tone(hx(S.leafb))}`,
      `--bush:${tone(hx(S.bush))}`,`--pop:${tone(hx(S.pop))}`,`--popb:${tone(hx(S.popb))}`,`--bir:${tone(hx(S.bir))}`,`--birb:${tone(hx(S.birb))}`,`--flower:${tone(mx(hx(S.flower),SNOW,cover))}`,`--far2:${tone(mx(mx(hx(S.far),hx('#ffffff'),.16),SNOW2,cover))}`,`--near2:${tone(mx(mx(hx(S.near),hx('#ffffff'),.14),SNOW,cover))}`,`--blossom:${tone(hx('#fbd3e2'))}`,...Object.entries(HOUSE).map(([k,v])=>`--${k}:${tone(hx(v))}`),...Object.entries(TOWN).map(([k,v])=>`--${k}:${tone(['pave1','pave2','walk','road','sand1','sand2'].includes(k)?mx(hx(v),SNOW,cover*.9):hx(v))}`),
      `--snow:${tone(SNOW)}`,`--cl1:${tone(hx(mood[0]),.75)}`,`--cl2:${tone(hx(mood[1]),.75)}`,
      `--drop:${tone(hx('#f2f8ff'),.25)}`,`--flake:${tone(hx('#ffffff'),.2)}`,`--hail:${tone(hx('#eaf3ff'),.25)}`,`--ink:${tone(hx('#f4f8fc'),.3)}`,`--fog:${fogInk}`,
      `--smoke:${tone(hx('#eef2f6'),.6)}`,`--puddle:${rgb(mx(nowS[1],hx('#ffffff'),.25))}`].join(';');
    // ───── The sun, the moon, the stars ─────
    const showSun=co.up&&open&&!(fog&&dense), showMoon=co.moonUp&&open&&!fog, byDay=co.up&&co.dusk<.6;
    const warmSun=Math.min(1,Math.max(0,1-co.alt/.5)), sun=(a:string,b:string)=>rgb(mx(hx(a),hx(b),warmSun));
    const paleSun=fog&&!dense&&d!=='mist'&&d!=='patches', veiled=d==='veil'||paleSun;
    const wax=f<.5, g=wax?f:1-f, phase=`M0 -1A1 1 0 0 ${wax?1:0} 0 1A${Math.abs(Math.cos(2*Math.PI*f)).toFixed(3)} 1 0 0 ${(g<.25)===wax?0:1} 0 -1Z`;
    const stars=!co.up&&open&&!fog?Array.from({length:low?10:26},(_,i)=>`radial-gradient(circle at ${(3+rnd(i,1)*94).toFixed(1)}% ${(4+rnd(i,2)*84).toFixed(1)}%,#fff ${(.5+rnd(i,3)*.7).toFixed(1)}px,transparent ${(1.3+rnd(i,3)*.9).toFixed(1)}px)`):[];
    // ───── Clouds: where they stand along the sky, how big ─────
    // [place along the sky, top, width, opacity, shape]: near clouds are big and full, far ones smaller and paler.
    const sets:Record<string,[number,number,number,number,number][]>={
      few:[[.64,6,124,.95,1],[.92,17,82,.7,2]],
      partly:[[.16,3,172,.95,0],[.46,18,108,.78,1],[.7,6,150,1,2],[.97,21,92,.72,0]],
      cloudy:[[0,0,204,1,1],[.25,14,138,.84,2],[.5,2,190,1,0],[.73,16,126,.84,1],[.96,3,180,1,2]],
      closed:[[-.06,-13,272,1,2],[.2,-6,238,1,0],[.46,-15,292,1,1],[.72,-7,246,1,2],[1,-12,268,1,0],[.1,12,172,.92,1],[.58,14,182,.92,0],[.9,13,162,.92,2]]};
    const set=!clouded?[]:closed?sets.closed:d==='veil'?[]:d==='few'?sets.few:grey?sets.cloudy:sets.partly;
    // ───── The house ─────
    const dark=!co.up||co.dusk>.35||L<.75, asleep=co.h>.5&&co.h<5.5, late=co.h>=22.5||co.h<=.5;
    const lit=this.lights==='on'||(this.lights==='auto'&&dark&&!asleep), downstairs=lit&&(this.lights==='on'||!late||co.up);
    const lamp=this.lights!=='off'&&(!co.up||co.dusk>.5);
    const t=co.up?co.p:co.m, sho=open&&!fog?(co.up?.34*Math.min(1,co.alt*2.4):co.moonUp?.14*Math.sin(Math.PI*co.m):0):0;
    const sway=windy?'--lean:5deg;--amp:3deg;--tsw:.9s':breeze?'--lean:1.6deg;--amp:1.6deg;--tsw:2s':'';
    const plume=windy?'--smx:84px;--smy:-20px;--smt:2.6s':breeze?'--smx:42px;--smy:-38px;--smt:3.8s':'--smx:8px;--smy:-56px;--smt:5.2s';
    // ───── What falls ─────
    const few=low?.4:1, nRain=Math.round((heavy?68:storm?60:drizzle?26:d==='showers-light'?18:hail?16:snow?22:44)*few);
    const nSnow=Math.round((d==='heavy-snow'?110:d==='flurries'?18:rain?26:64)*few), nHail=Math.round((stormHail?18:24)*few);
    const opts={heavy:heavy||(storm&&rain&&!showers),drizzle,freezing:freezingRain,windy,heavySnow:d==='heavy-snow'};
    const wet=rain&&!freezingRain, splash=wet&&!drizzle;
    const fall=rain||snow||hail?html`<div class="fall">${rain?this.drops('rain',nRain,opts):nothing}${hail?this.drops('hail',nHail,opts):nothing}${snow?this.drops('snow',nSnow,opts):nothing}</div>
      ${splash||hail?Array.from({length:low?3:heavy?8:6},(_,i)=>html`<i class=${`sp${hail&&i%2?' hop':''}`} style=${`left:${(4+rnd(i,61)*92).toFixed(1)}%;bottom:calc(var(--gh) * ${(.12+rnd(i,62)*.6).toFixed(2)});--t:${(1+rnd(i,63)*.7).toFixed(2)}s;--d:${(-rnd(i,64)*1.6).toFixed(2)}s`}></i>`):nothing}`:nothing;
    const gale=Math.max(this.gust,this.wind*1.6)>=100;
    const blown=windy&&!snow&&!fog&&!low?(this.season==='spring'?'petal':this.season==='summer'?'seed':this.season==='winter'?'dry':'plane'):'';
    const carried=(k:string,n:number)=>k==='plane'?svg`<svg viewBox="0 0 44 44"><path fill=${n%2?'var(--leaf)':'var(--leafb)'} d=${PLANE}/><path fill="none" stroke="var(--trunk)" stroke-width="1.2" stroke-linecap="round" d="M22 31Q23 37 21 42M22 31V8"/></svg>`
      :k==='petal'?svg`<svg viewBox="0 0 12 12"><path fill="var(--blossom)" d="M6 0C10 3 10 9 6 12C2 9 2 3 6 0Z"/></svg>`
      :k==='seed'?svg`<svg viewBox="0 0 24 30"><path fill="none" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" d="M12 29V12M12 12L3 6M12 12L5 3M12 12L8 1M12 12L12 0M12 12L16 1M12 12L19 3M12 12L21 6M12 12L1 10M12 12L23 10"/></svg>`
      :svg`<svg viewBox="0 0 28 18"><path fill="var(--trunk)" d="M2 9C8-2 21 1 27 4C23 17 9 20 2 9Z"/></svg>`;
    return html`<div class=${`scene${this.skyOnly?' sky-only':''}`} style=${vars} ?data-still=${!this.animated}>
      ${stars.length?html`<div class="stars" style=${`opacity:${(1-co.dusk).toFixed(2)};background-image:${stars.filter((_,i)=>i%2).join(',')}`}></div>
        <div class="stars twinkle" style=${`--o:${(1-co.dusk).toFixed(2)};background-image:${stars.filter((_,i)=>!(i%2)).join(',')}`}></div>`:nothing}
      ${stars.length&&!low?[0,1,2,3].map(i=>html`<i class="star" style=${`left:calc(var(--z0) + (100% - var(--z0)) * ${(.08+rnd(i,41)*.84).toFixed(2)});top:${(6+rnd(i,42)*40).toFixed(0)}%;--o:${(1-co.dusk).toFixed(2)};animation-duration:${(2.4+i*.7).toFixed(1)}s;animation-delay:${-i*1.1}s`}></i>`):nothing}
      ${co.dusk>.02?html`<div class="glow" style=${`left:var(${co.evening?'--ax1':'--ax0'});opacity:${(co.dusk*(open&&!fog?1:.3)).toFixed(2)}`}></div>`:nothing}
      ${showSun?html`<div class=${`orbit sun${this.season==='summer'&&!veiled?' big':''}`} style=${`${HestiaWeatherScene.at(co.p)};opacity:${paleSun?.5:veiled?.8:1}`}>
        <i class="halo" style=${`background:radial-gradient(circle,${sun('#ffe9a8','#ffb070')}99,${sun('#ffd76a','#ff9a5a')}33 45%,transparent 70%)`}></i>
        ${veiled?nothing:html`<i class="rays" style=${`--ray:${sun('#fff2b0','#ffc890')}`}></i>`}
        <i class="disc" style=${`background:radial-gradient(circle at 38% 36%,${sun('#fff9dc','#fff0cc')},${sun('#ffe17e','#ffb45c')} 58%,${sun('#f2bb55','#ee7a45')})`}></i></div>`:nothing}
      ${showMoon?html`<div class=${`orbit moon${byDay?' by-day':''}`} style=${HestiaWeatherScene.at(co.m)}>
        ${byDay?nothing:html`<i class="halo" style=${`opacity:${(.25+.75*moonLit).toFixed(2)}`}></i>`}
        <svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><defs><clipPath id=${`${u}mc`}><path d=${phase}/></clipPath>
          <radialGradient id=${`${u}mg`} cx=".38" cy=".36" r=".8"><stop offset="0" stop-color="#fffef6"/><stop offset=".6" stop-color="#f1edd6"/><stop offset="1" stop-color="#cdd5da"/></radialGradient></defs>
          <circle r="1" fill="#fff" fill-opacity=".07"/><g clip-path=${`url(#${u}mc)`}><circle r="1" fill=${`url(#${u}mg)`}/>
          <g fill="#aab1a2" fill-opacity=".45"><circle cx="-.38" cy=".18" r=".19"/><circle cx=".28" cy="-.42" r=".15"/><circle cx=".38" cy=".38" r=".25"/><circle cx="-.1" cy="-.28" r=".09"/><circle cx="0" cy=".66" r=".11"/></g></g></svg></div>`:nothing}
      ${d==='veil'?[0,1,2].map(i=>html`<i class="cirrus" style=${`left:calc(var(--z0) + (100% - var(--z0)) * ${[.05,.3,.18][i]});top:${[10,24,37][i]}%;width:${[62,50,44][i]}%;animation-delay:${-i*9}s`}></i>`):nothing}
      ${closed?html`<i class=${`ceiling${storm?' dark':''}`}></i>`:nothing}
      ${set.slice(0,low?Math.ceil(set.length/2):set.length).map(([x,top,w,o,shape],i)=>this.cloud(i,x,top,w,o,shape,windy))}
      ${storm?html`<i class="sky-lit"></i>`:nothing}
      ${bolts?STRIKES.filter(s=>s[2]>=0).slice(0,low?1:3).map(([k,x,b,h])=>html`
          <svg class="bolt" style=${`left:calc(var(--z0) + (100% - var(--z0)) * ${x});height:${h}%;animation-name:${k}`} viewBox="0 0 120 220" preserveAspectRatio="none" aria-hidden="true">
            <path class="aura" d=${BOLTS[b]}/><path class="halo" d=${BOLTS[b]}/><path class="core" d=${BOLTS[b]}/></svg>
`):nothing}
      ${bolts?html`<i class="hit"></i>`:nothing}
      ${storm&&closed&&!low?[0,1].map(i=>html`<div class="scud" style=${`top:${[16,27][i]}cqh;width:min(${[128,96][i]}px,${[46,34][i]}cqh);animation-duration:${[40,56][i]}s;animation-delay:${[-14,-36][i]}s`}>
        <svg viewBox="0 0 180 124" style=${i?'transform:scaleX(-1)':''} aria-hidden="true"><path fill="var(--cl1)" d=${CLOUDS[1][0]}/><path fill="var(--cl1)" fill-opacity=".7" d=${CLOUDS[1][1]}/></svg></div>`):nothing}
      ${this.skyOnly?nothing:this.land({u,cap,cover,lit,downstairs,lamp,sway,plume,splash,hail,wet,freezingRain,low,sho,t,late,asleep,co,windy,storm,
        glint:showSun&&!veiled?{t:co.p,c:sun('#fff1c4','#ffb36a'),o:.85}:showMoon?{t:co.m,c:'#eef3ff',o:(.25+.6*moonLit)*(byDay?.4:1)}:null})}
      ${fog?html`<i class="wash" style=${`opacity:${dense?.55:d==='mist'?.06:d==='patches'?0:.24}`}></i>
        ${d==='mist'?Array.from({length:low?3:5},(_,i)=>html`<i class="thread" style=${`top:${30+i*11}%;left:${[-8,20,-15,26,4][i]}%;width:${[90,70,110,64,96][i]}%;--fo:.75;--dir:${i%2?-1:1};animation-duration:${16+i*3}s,${11+i*2}s;animation-delay:${-i*3.1}s`}></i>`)
        :(d==='patches'?[[66,-14,56,30],[72,36,50,28],[64,66,52,32],[78,10,60,24]]:Array.from({length:dense?6:5},(_,i)=>[(dense?2:6)+i*(dense?13:16),[-10,18,-25,30,0,-15][i],[120,95,140,85,130,110][i],dense?34:28]))
          .slice(0,low?3:6).map(([y,x,w,h],i)=>html`<div class="band" style=${`top:${y}%;left:${x}%;width:${w}%;height:${h}%;--fo:${d==='patches'?.82:[.4,.55,.7][i%3]};--dir:${i%2?-1:1};animation-duration:${13+i*3}s,${9+i*2}s;animation-delay:${-i*2.7}s`}>
            <svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34C60 16 130 20 190 30S330 48 400 32 520 14 600 28V60H0Z"/></svg></div>`)}`:nothing}
      ${showers?html`<div class="burst">${fall}</div>`:fall}
      ${d==='freezing-fog'||freezingRain?Array.from({length:low?3:6},(_,i)=>html`<i class="spark" style=${`left:${(6+rnd(i,71)*88).toFixed(1)}%;bottom:calc(var(--gh) * ${(.2+rnd(i,72)*.7).toFixed(2)});animation-delay:${(-rnd(i,73)*3).toFixed(1)}s`}></i>`):nothing}
      ${(windy||breeze)?Array.from({length:low?(breeze?2:3):breeze?3:gale?7:6},(_,i)=>{const t=(breeze?3.6:gale?1.5:2.3)+(i*37%9)/10;
        return html`<div class="gust" style=${`--wy:${8+(i*29)%62}%;--wx:${-10+(i*41)%45}%;--ww:${40+(i*23)%30}%;--wt:${t}s;--wd:${(-((i*1.7)%t)).toFixed(2)}s;--wo:${((breeze?.45:.55)+(i%3)*(breeze?.12:.2)).toFixed(2)}`}>
          <div class="win"><div class="line"><svg viewBox="0 -20 400 50" preserveAspectRatio="none" aria-hidden="true"><path d=${THREADS[(breeze?[0,1,3]:[0,1,2,3,4])[i%(breeze?3:5)]]}/></svg></div></div></div>`;}):nothing}
      ${blown?Array.from({length:gale?7:5},(_,i)=>html`<div class="fly" style=${`top:${(18+rnd(i,91)*58).toFixed(0)}%;animation-duration:${((gale?2.2:3.2)+rnd(i,92)*2.2).toFixed(2)}s;animation-delay:${(-rnd(i,93)*5).toFixed(2)}s`}>
        <i style=${`animation-duration:${(.7+rnd(i,95)*.8).toFixed(2)}s;--lamp:${(6+rnd(i,96)*13).toFixed(0)}px`}><b class=${blown} style=${`animation-duration:${(.9+rnd(i,94)*1.2).toFixed(2)}s;animation-direction:${rnd(i,97)<.5?'normal':'reverse'};--s:${(.75+rnd(i,98)*.5).toFixed(2)}`}>${carried(blown,i)}</b></i></div>`):nothing}
      ${bolts&&!low?html`<i class="bright"></i>`:nothing}
      ${this.season==='summer'&&!co.up&&co.dusk<.7&&open&&!fog&&!windy&&!breeze&&!rain&&!low?Array.from({length:5},(_,i)=>html`<i class="firefly" style=${`left:calc(var(--z0) + (100% - var(--z0)) * ${(.1+rnd(i,95)*.8).toFixed(2)});bottom:calc(var(--gh) + ${(6+rnd(i,96)*40).toFixed(0)}px);--t:${5+i}s;--d:${-i*1.7}s`}></i>`):nothing}
    </div>`;
  }

  static styles=css`
    :host {display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;contain:strict;}
    /* --nw-ground: height of the strip of ground; --nw-arc-x0 / --nw-arc-x1 / --nw-arc-top: where the sun rises, sets and culminates;
       --nw-zone: where the artwork starts (clouds, stars), clear of a card's text; --nw-house-x / --nw-house-size: where the house stands and how big. */
    .scene {position:absolute;inset:0;overflow:hidden;container-type:size;background:var(--sky);--gh:var(--nw-ground,22px);--z0:var(--nw-zone,40%);--zn:var(--nw-zone-n,40);--ax0:var(--nw-arc-x0,44%);--ax1:var(--nw-arc-x1,98%);--at:var(--nw-arc-top,44px);
      --ah:calc(100% - var(--gh) - 10px);--hh:clamp(36px,22%,62px);}
    /* Off screen or in a hidden tab, everything stops. !important: every rule below sets its animation with the shorthand, which would reset this. */
    /* Without the landscape, no ground: what falls reaches the bottom, the sun and the moon set on the bottom edge. */
    .scene.sky-only {--gh:0px;--hh:0px;}
    .scene *,.scene *::before,.scene *::after {animation-play-state:var(--play,paused)!important;}
    i {display:block;font-style:normal;}
    svg {display:block;overflow:visible;}
    .stars {position:absolute;left:var(--z0);right:0;top:0;height:calc(100% - var(--gh) - var(--hh));}
    .twinkle {opacity:var(--o);animation:twinkle 3.4s ease-in-out infinite alternate;}
    .glow {position:absolute;bottom:calc(var(--gh) - 2px);width:95%;height:80%;margin-left:-47.5%;background:radial-gradient(ellipse 50% 100% at 50% 100%,rgba(255,176,96,.62),rgba(255,128,112,.26) 42%,transparent 70%);}
    /* The sun and the moon: a point on the arc, the orb centred on it. */
    .orbit {position:absolute;width:0;height:0;}
    .orbit>* {position:absolute;}
    .sun .disc {left:-29px;top:-29px;width:58px;height:58px;border-radius:50%;}
    .sun .halo {left:-70px;top:-70px;width:140px;height:140px;border-radius:50%;}
    /* The crown of rays of the plain sky: a ring of soft rays that turns slowly. Drawn once; only its rotation is animated. */
    .sun .rays {left:-58px;top:-58px;width:116px;height:116px;border-radius:50%;background:repeating-conic-gradient(from 0deg,transparent 0 13deg,var(--ray) 15deg 18deg,transparent 20deg 30deg);
      -webkit-mask-image:radial-gradient(circle,transparent 40%,#000 52%,transparent 72%);mask-image:radial-gradient(circle,transparent 40%,#000 52%,transparent 72%);opacity:.8;animation:turn 40s linear infinite;}
    .sun .disc {box-shadow:0 0 0 1px rgba(255,243,196,.35);}
    .sun.big .disc {left:-34px;top:-34px;width:68px;height:68px;}.sun.big .rays {left:-68px;top:-68px;width:136px;height:136px;}
    .star {position:absolute;width:2.4px;height:2.4px;border-radius:50%;background:#fff;animation:twinkle 3s ease-in-out infinite alternate;}
    .star::before,.star::after {content:'';position:absolute;left:50%;top:50%;width:11px;height:1px;margin:-.5px 0 0 -5.5px;background:linear-gradient(90deg,transparent,#fff,transparent);}
    .star::after {transform:rotate(90deg);}
    .moon svg {left:-23px;top:-23px;width:46px;height:46px;}
    .moon .halo {left:-56px;top:-56px;width:112px;height:112px;border-radius:50%;background:radial-gradient(circle,rgba(255,249,224,.5),rgba(233,239,255,.16) 45%,transparent 70%);}
    .moon.by-day {opacity:.6;}
    /* Clouds: the same cumulus as the plain sky, lit on top and shaded underneath; each drifts slowly on its own. */
    .cloud {position:absolute;aspect-ratio:180/124;animation:drift 28s ease-in-out infinite alternate;}
    .cloud svg {width:100%;height:100%;}
    .cirrus {position:absolute;height:14px;border-radius:50%;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(255,255,255,.75),rgba(255,255,255,0) 100%);transform:rotate(-6deg);animation:drift 30s ease-in-out infinite alternate;}
    .ceiling {position:absolute;left:0;right:0;top:0;height:60%;background:linear-gradient(180deg,rgba(20,22,26,.42),rgba(20,22,26,0));}
    .ceiling.dark {height:78%;background:linear-gradient(180deg,rgba(12,13,17,.7),rgba(12,13,17,.28) 55%,rgba(12,13,17,0));}
    /* The land: the hills overlap the ground by 2 px, and the ground is solid down to the bottom edge. */
    .hills {position:absolute;left:0;bottom:calc(var(--gh) - 2px);width:100%;height:calc(var(--hh) + 2px);}
    .ground {position:absolute;left:0;right:0;bottom:0;height:var(--gh);background:linear-gradient(180deg,var(--near),var(--soil));}
    /* The village street: worn paving. The town: a pavement, its kerb, then the road. */
    .ground.street {background:linear-gradient(180deg,var(--pave1),var(--pave2));}
    .ground.road {background:linear-gradient(180deg,var(--walk) 0 46%,var(--curb) 46% 54%,var(--road) 54%);}
    .peaks {position:absolute;left:0;bottom:calc(var(--gh) - 2px);width:100%;height:calc(var(--hh) * 2.8);}
    /* The sea from the horizon to the beach: its colour follows the sky (set in render). */
    .sea {position:absolute;left:0;right:0;bottom:calc(var(--gh) - 3px);height:calc(var(--hh) * 1.25);background:linear-gradient(180deg,var(--sea1),var(--sea2));overflow:hidden;}
    .sea::before {content:'';position:absolute;inset:0 0 auto 0;height:1px;background:rgba(255,255,255,.35);}
    .cape {position:absolute;left:var(--z0);bottom:100%;width:30%;max-width:240px;height:auto;margin-bottom:-1px;}
    .caps {position:absolute;inset:18% 0 22% 0;width:100%;height:60%;}.caps path {fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke;}
    /* The path of light under the sun or the moon: dashes widening towards the shore, shimmering. */
    .glint {position:absolute;top:0;width:52px;height:100%;margin-left:-26px;--o:calc(var(--go) * .8);opacity:var(--o);animation:twinkle 2.6s ease-in-out infinite alternate;}
    .sail {position:absolute;top:2px;left:0;width:16px;height:15px;animation:sail 140s linear infinite;}.sail svg {width:100%;height:100%;}
    /* Waves roll onto the beach: a soft white line that comes in and fades. */
    .surf {position:absolute;left:-10%;right:-10%;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75) 20%,rgba(255,255,255,.75) 80%,transparent);opacity:0;animation:surf 5s ease-in-out infinite;}
    .surf.s2 {animation-delay:-2.4s;height:1.5px;}
    .ground.sand {background:linear-gradient(180deg,color-mix(in srgb,var(--sand2) 70%,var(--sea2)) 0 3px,var(--sand1) 6px,var(--sand2));}
    .skyline {position:absolute;left:0;bottom:calc(var(--gh) - 2px);width:100%;height:calc(var(--hh) * 1.7);}
    .puddle {position:absolute;bottom:calc(var(--gh) * var(--y) - 3px);height:5px;border-radius:50%;background:var(--puddle);opacity:.4;}
    .glaze {position:absolute;left:0;right:0;bottom:0;height:var(--gh);background:linear-gradient(180deg,rgba(220,240,255,.7),rgba(220,240,255,.25));}
    .home {position:absolute;left:var(--nw-house-x,calc(100% - 286px));bottom:calc(var(--gh) * .55);width:300px;height:140px;margin-left:-150px;transform-origin:50% 100%;transform:scale(calc(var(--nw-house-size,1) * var(--ps,1)));}
    /* Buildings are taller than a house: drawn a little smaller, so the sky keeps its room. */
    .home.tall {--ps:.82;}
    .house {position:absolute;inset:0;width:100%;height:100%;}
    .shade {position:absolute;left:66px;bottom:-7px;width:150px;height:13px;border-radius:50%;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(10,20,35,.9),rgba(10,20,35,0));}
    .tree {position:absolute;left:182px;bottom:0;width:60px;height:92px;transform-origin:50% 100%;}
    .tree.t2 {left:238px;transform:scale(.92);}.tree.t3 {left:36px;transform:scale(.8);}
    .tree.fir1 {left:28px;--ts:.95;transform:scale(.95);}.tree.fir2 {left:226px;--ts:1.08;transform:scale(1.08);}.tree.fir3 {left:256px;--ts:.78;transform:scale(.78);}.tree.umbrella {left:4px;--ts:1.05;transform:scale(1.05);}
    .tree.village {left:230px;}.tree.city {left:241px;transform:scale(.62);}.tree.flat {left:240px;transform:scale(.9);}.tree.flat2 {left:-6px;transform:scale(.8);}
    .tree svg {width:100%;height:100%;}
    /* Trees only move when the wind blows. */
    [style*="--lean"] .tree {animation:sway var(--tsw) ease-in-out infinite alternate;}
    [style*="--lean"] .tree.t2 {animation-name:sway2;animation-delay:-.6s;}[style*="--lean"] .tree.t3,[style*="--lean"] .tree.flat2 {animation-name:sway3;animation-delay:-1.1s;}[style*="--lean"] .tree.city {animation-name:sway4;}/* Firs and the umbrella pine are stiffer: they bend with the wind too, by about half as much. Still, without wind, like every tree. */
    [style*="--lean"] .tree:is(.fir1,.fir2,.fir3,.umbrella) {animation-name:stiff;}[style*="--lean"] .tree.fir2 {animation-delay:-.5s;}[style*="--lean"] .tree.fir3 {animation-delay:-.9s;}[style*="--lean"] .tree.flat {animation-name:sway5;}
    .trunk,.branch,.twigs,.twig-snow,.bark,.marks {fill:none;stroke:var(--trunk);stroke-linecap:round;stroke-linejoin:round;}.trunk {stroke-width:4.5;}.branch {stroke-width:2.4;}.twigs {stroke-width:1.3;}
    .bark {stroke:var(--bark);stroke-width:4;}.bark.thin {stroke-width:2;}.twigs.light {stroke:var(--bark);}.marks {stroke-width:1.1;stroke-opacity:.6;}
    .twig-snow {stroke:var(--snow);stroke-width:1.8;}
    .smoke {position:absolute;left:154px;bottom:107px;width:0;height:0;}
    .smoke i {position:absolute;left:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,var(--smoke),transparent 70%);opacity:0;animation:smoke var(--smt,5s) ease-out infinite;}
    /* What falls: every drop is a thin strip as tall as the box, which ends on the ground; the drop sits at its top and the strip slides down. */
    .fall {position:absolute;left:0;right:0;top:0;bottom:calc(var(--gh) * .5);overflow:hidden;}
    /* Each drop is a small box the size of the drop, moved from above the card down to the ground: its layer is a few pixels, not a full-height strip.
       The distance is counted in container units (cqh): the height of the scene less the half strip of ground where the box ends. */
    .p {position:absolute;top:-40px;height:36px;width:3px;--fallh:calc(100cqh - var(--gh) * .5 + 40px);animation:fall var(--du) linear var(--dl) infinite;}
    .p::before {content:'';position:absolute;top:0;left:0;}
    .rain {opacity:var(--o);}
    .rain::before {width:var(--w);height:var(--len);border-radius:var(--w);background:linear-gradient(transparent,var(--drop) 45%,var(--drop));transform:rotate(var(--rot));}
    .snow {opacity:var(--o);}
    .snow::before {width:var(--size);height:var(--size);border-radius:50%;background:radial-gradient(circle at 46% 44%,var(--flake) 0 30%,transparent 76%);animation:flutter var(--sw) ease-in-out var(--dl) infinite alternate;}
    .hail {top:-12px;height:12px;animation-name:hail;--g:calc(100cqh - var(--gh) * .5 + 10px - var(--size));}
    .hail::before {width:var(--size);height:var(--size);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--hail) 60%);}
    .burst {position:absolute;inset:0;animation:burst 14s ease-in-out infinite;}
    /* A drop hits the ground: a ring that widens, two droplets that hop. On the roof, the droplets only. */
    .sp {position:absolute;width:18px;height:8px;margin-left:-9px;}
    .sp::before {content:'';position:absolute;inset:auto 0 0 0;height:5px;border-radius:50%;border:1px solid var(--ink);opacity:0;animation:ring var(--t) ease-out var(--d) infinite;}
    .sp::after {content:'';position:absolute;left:8px;bottom:1px;width:2px;height:2px;border-radius:50%;background:var(--ink);box-shadow:-4px 0 0 var(--ink),4px 0 0 var(--ink);opacity:0;animation:spray var(--t) ease-out var(--d) infinite;}
    .sp.roof::before {display:none;}
    .sp.hop::before {display:none;}.sp.hop::after {width:4px;height:4px;box-shadow:none;background:var(--hail);animation-name:hop;}
    .drip {position:absolute;bottom:42px;width:1.6px;height:5px;border-radius:2px;background:var(--ink);opacity:0;animation:drip var(--t) ease-in var(--d) infinite;}
    .spark {position:absolute;width:3px;height:3px;background:#fff;transform:rotate(45deg);opacity:.2;animation:twinkle 2.6s ease-in-out infinite alternate;}
    /* Fog: a wash over everything, then banks drawn as a wave and blurred. They are drawn once and then only moved and faded, a handful at most. */
    .wash {position:absolute;inset:0;background:var(--fog);}
    .band {position:absolute;filter:blur(9px);animation:bank 14s ease-in-out infinite alternate,breathe 10s ease-in-out infinite alternate;}
    .band svg {width:100%;height:100%;}.band path {fill:var(--fog);}
    .thread {position:absolute;height:9px;border-radius:50%;background:linear-gradient(90deg,transparent,var(--fog) 30%,var(--fog) 70%,transparent);filter:blur(3px);animation:bank 16s ease-in-out infinite alternate,breathe 11s ease-in-out infinite alternate;}
    /* Wind, as on the plain sky: the whole thread is drawn and barely moves (it drifts a fifth of its width downwind);
       a soft-edged window slides along it, so it fades in at its tail and out at its head, curls included.
       The eye follows the soft window, not a thin line: a 2 px line moved fast steps from frame to frame.
       Done with two layers the graphics card moves on its own, never a redraw: the window (with its soft edges) slides one way
       and the thread inside slides back by exactly as much, so it stays put. Same duration, delay and easing on both: they cannot drift apart. */
    .gust {position:absolute;left:var(--wx);top:var(--wy);width:var(--ww);height:28px;opacity:var(--wo);animation:gust-run var(--wt) ease-in-out var(--wd) infinite;}
    .gust .win {position:absolute;left:0;top:-6px;width:45%;height:40px;overflow:hidden;will-change:transform;
      -webkit-mask-image:linear-gradient(90deg,transparent,#000 35%,#000 65%,transparent);mask-image:linear-gradient(90deg,transparent,#000 35%,#000 65%,transparent);
      animation:gust-win var(--wt) ease-in-out var(--wd) infinite;}
    .gust .line {position:absolute;left:0;top:6px;width:222.2222%;height:28px;will-change:transform;animation:gust-line var(--wt) ease-in-out var(--wd) infinite;}
    .gust svg {width:100%;height:100%;}
    .gust path {fill:none;stroke:var(--ink);stroke-width:2.2;stroke-linecap:round;vector-effect:non-scaling-stroke;}
    /* What it carries flies across the scene, rises and dips, and flips over as it spins. */
    .fly {position:absolute;left:0;width:100%;height:0;animation:fly 4s linear infinite;}
    .fly i {position:absolute;left:-22px;top:-9px;animation:bob 1s ease-in-out infinite alternate;}
    .fly b {display:block;width:18px;height:18px;transform:scale(var(--s));animation:tumble 1.2s linear infinite;}
    .fly b.petal {width:10px;height:10px;}.fly b.seed {width:13px;height:16px;animation-name:rock;animation-timing-function:ease-in-out;animation-direction:alternate!important;}.fly b.dry {width:15px;height:10px;}
    .fly svg {width:100%;height:100%;}
    /* Storm: three bolts, each a white core in a blue-white halo, from the clouds down to the ground; the strike lights the sky around it and the ground under it.
       Each strike flickers twice; strikes are at least 1.8 s apart, so never more than two flashes in a second (photosensitivity limit: three). */
    .bolt {position:absolute;bottom:calc(var(--gh) + var(--hh) * .45);aspect-ratio:120/220;transform:translateX(-50%);opacity:0;animation:none 12s linear infinite;}
    .bolt path {fill:none;stroke-linecap:round;stroke-linejoin:round;}
    .bolt .aura {stroke:#9cc8ff;stroke-width:16;stroke-opacity:.18;}.bolt .halo {stroke:#dcecff;stroke-width:6.5;stroke-opacity:.5;}.bolt .core {stroke:#fff;stroke-width:2.6;}
    /* Over the clouds: the light of a strike glows inside them, around where it falls. Each one only fades in and out. */
    /* One glow serves every strike: it slides, unseen, to where the next one falls, then lights up. One layer instead of five.
       Its place is counted in container units (cqw), so the same sequence fits a wide card and a tile. */
    .sky-lit {position:absolute;left:0;top:-14%;width:72%;height:84%;margin-left:-36%;opacity:0;animation:lit 12s linear infinite;
      background:radial-gradient(ellipse 50% 50% at 50% 40%,rgb(238 245 255 / .72),rgb(180 207 246 / .34) 40%,transparent 72%);}
    /* Bolts fall behind the hills (never on the house): the strike lights the horizon where it lands. */
    .hit {position:absolute;left:0;bottom:calc(var(--gh) + var(--hh) * .2);width:190px;height:52px;margin-left:-95px;border-radius:50%;opacity:0;animation:hit 12s linear infinite;
      background:radial-gradient(ellipse 50% 50% at 50% 60%,rgba(255,255,255,.9),rgba(170,205,255,.35) 40%,transparent 72%);}
    /* The big strike lights the whole landscape for an instant: the house, the trees, the hills, the rain. */
    .bright {position:absolute;left:0;right:0;bottom:0;height:56%;background:linear-gradient(180deg,rgba(228,238,255,0),rgba(228,238,255,.2) 30%,rgba(228,238,255,.12) 80%,rgba(228,238,255,.06));opacity:0;animation:sC 12s linear infinite;}
    /* Low, ragged storm clouds race under the ceiling. */
    .scud {position:absolute;left:0;aspect-ratio:180/124;opacity:.92;animation:scud 10s linear infinite;}
    .scud svg {width:100%;height:100%;}
    .firefly {position:absolute;width:3px;height:3px;border-radius:50%;background:#e6ff9a;opacity:0;animation:wander var(--t) ease-in-out var(--d) infinite alternate,blink calc(var(--t) * .43) ease-in-out var(--d) infinite;}
    .scene[data-still] *,.scene[data-still] *::before,.scene[data-still] *::after {animation:none;}
    .scene[data-still] .smoke i {opacity:.4;}.scene[data-still] .gust .win {transform:translateX(61%);}.scene[data-still] .gust .line {transform:translateX(-27.5%);}.scene[data-still] .twinkle {opacity:var(--o);}
    @keyframes twinkle {from{opacity:calc(var(--o,1) * .25);}to{opacity:var(--o,1);}}
    @keyframes turn {to{transform:rotate(360deg);}}
    @keyframes drift {from{transform:translateX(-18px);}to{transform:translateX(22px);}}
    @keyframes sway {from{transform:rotate(calc(var(--lean) - var(--amp)));}to{transform:rotate(calc(var(--lean) + var(--amp)));}}
    @keyframes sway2 {from{transform:scale(.92) rotate(calc(var(--lean) - var(--amp)));}to{transform:scale(.92) rotate(calc(var(--lean) + var(--amp)));}}
    @keyframes sway4 {from{transform:scale(.62) rotate(calc(var(--lean) - var(--amp)));}to{transform:scale(.62) rotate(calc(var(--lean) + var(--amp)));}}
    @keyframes sway5 {from{transform:scale(.9) rotate(calc(var(--lean) - var(--amp)));}to{transform:scale(.9) rotate(calc(var(--lean) + var(--amp)));}}
    @keyframes sail {from{transform:translateX(-30px);}to{transform:translateX(calc(100cqw + 30px));}}
    @keyframes surf {0%{transform:translateY(-6px) scaleX(.9);opacity:0;}30%{opacity:.85;}70%{opacity:.4;}100%{transform:translateY(3px) scaleX(1.05);opacity:0;}}
    @keyframes stiff {from{transform:scale(var(--ts)) rotate(calc((var(--lean) - var(--amp)) * .55));}to{transform:scale(var(--ts)) rotate(calc((var(--lean) + var(--amp)) * .55));}}
    @keyframes sway3 {from{transform:scale(.8) rotate(calc(var(--lean) - var(--amp)));}to{transform:scale(.8) rotate(calc(var(--lean) + var(--amp)));}}
    @keyframes smoke {0%{transform:translate(0,0) scale(.5);opacity:0;}12%{opacity:.75;}60%{opacity:.35;}100%{transform:translate(var(--smx,8px),var(--smy,-56px)) scale(2.6);opacity:0;}}
    @keyframes fall {to{transform:translate(var(--dx,0),var(--fallh));}}
    @keyframes flutter {from{transform:translateX(calc(var(--amp) * -1));}to{transform:translateX(var(--amp));}}
    /* Hail: a fall that speeds up, the impact, a clear bounce, a little hop, then the stone stops and melts. */
    @keyframes hail {0%{transform:translate(0,0);opacity:1;animation-timing-function:cubic-bezier(.5,0,1,1);}50%{transform:translate(0,var(--g));animation-timing-function:cubic-bezier(0,0,.4,1);}
      64%{transform:translate(var(--hx),calc(var(--g) - 30px));animation-timing-function:cubic-bezier(.6,0,1,1);}76%{transform:translate(calc(var(--hx) * 1.7),var(--g));animation-timing-function:cubic-bezier(0,0,.4,1);}
      83%{transform:translate(calc(var(--hx) * 2.1),calc(var(--g) - 10px));animation-timing-function:cubic-bezier(.6,0,1,1);}89%{transform:translate(calc(var(--hx) * 2.4),var(--g));opacity:1;}100%{transform:translate(calc(var(--hx) * 2.4),var(--g));opacity:0;}}
    @keyframes bank {from{transform:translateX(calc(var(--dir) * -7%));}to{transform:translate(calc(var(--dir) * 7%),6px);}}
    @keyframes breathe {from{opacity:calc(var(--fo) * .6);}to{opacity:var(--fo);}}
    @keyframes burst {0%,100%{opacity:0;}12%,58%{opacity:1;}70%{opacity:0;}}
    @keyframes ring {0%{opacity:.9;transform:scale(.2);}45%,100%{opacity:0;transform:scale(1.1);}}
    @keyframes spray {0%{opacity:1;transform:translateY(0) scaleX(.6);}18%{opacity:1;transform:translateY(-7px) scaleX(1.4);}34%,100%{opacity:0;transform:translateY(-1px) scaleX(1.9);}}
    @keyframes hop {0%{opacity:1;transform:translate(0,0);}20%{transform:translate(4px,-13px);}40%{transform:translate(8px,0);}52%{transform:translate(10px,-5px);}64%{opacity:1;transform:translate(12px,0);}80%,100%{opacity:0;transform:translate(12px,0);}}
    @keyframes drip {0%{transform:translateY(0);opacity:0;}12%{opacity:.9;}88%{opacity:.9;}100%{transform:translateY(34px);opacity:0;}}
    /* The soft window slides from before the tail to past the head, while the thread drifts downwind: each loop starts and ends unseen. */
    /* Window from -0.495 to +1.045 of the thread's width (as the plain sky's mask, -90% → 190%); the thread back by the same amount. */
    @keyframes gust-win {from{transform:translateX(-110%);}to{transform:translateX(232.2222%);}}
    @keyframes gust-line {from{transform:translateX(49.5%);}to{transform:translateX(-104.5%);}}
    @keyframes gust-run {from{transform:translateX(-6%);}to{transform:translate(14%,-4px);}}
    @keyframes fly {from{transform:translate(-4%,10px);}35%{transform:translate(32%,-14px);}70%{transform:translate(72%,6px);}to{transform:translate(calc(100% + 40px),-20px);}}
    @keyframes bob {from{transform:translateY(calc(var(--lamp) * -1));}to{transform:translateY(var(--lamp));}}
    @keyframes tumble {0%{transform:scale(var(--s)) rotate(0) scaleY(1);}25%{transform:scale(var(--s)) rotate(90deg) scaleY(.35);}50%{transform:scale(var(--s)) rotate(180deg) scaleY(1);}75%{transform:scale(var(--s)) rotate(270deg) scaleY(-.45);}100%{transform:scale(var(--s)) rotate(360deg) scaleY(1);}}
    @keyframes rock {from{transform:scale(var(--s)) rotate(-28deg);}to{transform:scale(var(--s)) rotate(22deg);}}
    /* The storm's 12 s sequence (1 % = 0.12 s). */
    @keyframes sA {0%,2.9%{opacity:0;}3.2%{opacity:1;}4%{opacity:.25;}4.6%{opacity:1;}6.6%{opacity:0;}90.9%{opacity:0;}91.2%{opacity:.75;}92%{opacity:.2;}93.6%{opacity:0;}100%{opacity:0;}}
    @keyframes sB {0%,26.9%{opacity:0;}27.2%{opacity:1;}28%{opacity:.3;}28.7%{opacity:1;}31%{opacity:0;}100%{opacity:0;}}
    @keyframes sC {0%,61.9%{opacity:0;}62.2%{opacity:1;}63%{opacity:.3;}63.7%{opacity:1;}66.5%{opacity:0;}100%{opacity:0;}}
    @keyframes sheet {0%,45.9%{opacity:0;}46.5%{opacity:.85;}47.4%{opacity:.25;}48.1%{opacity:.7;}50.5%{opacity:0;}100%{opacity:0;}}
    @keyframes glim {0%,81.9%{opacity:0;}82.6%{opacity:.6;}83.4%{opacity:.15;}84%{opacity:.45;}86%{opacity:0;}100%{opacity:0;}}
    /* The glow's 12 s: where it stands (it moves only while unseen) and how bright it flickers. Same instants as sA, sB, sheet, sC, glim. */
    @keyframes lit {0%,2.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}3.2%{opacity:.85;}4%{opacity:.21;}4.6%{opacity:.85;}6.6%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}
      26.5%,26.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.93) * 1cqw));opacity:0;}27.2%{opacity:.9;}28%{opacity:.27;}28.7%{opacity:.9;}31%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.93) * 1cqw));opacity:0;}
      45.5%,45.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.55) * 1cqw));opacity:0;}46.5%{opacity:.55;}47.4%{opacity:.16;}48.1%{opacity:.45;}50.5%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.55) * 1cqw));opacity:0;}
      61.5%,61.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.3) * 1cqw));opacity:0;}62.2%{opacity:1;}63%{opacity:.3;}63.7%{opacity:1;}66.5%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.3) * 1cqw));opacity:0;}
      82%,82.3%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.8) * 1cqw));opacity:0;}82.6%{opacity:.27;}83.4%{opacity:.07;}84%{opacity:.2;}86%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.8) * 1cqw));opacity:0;}
      90.5%,90.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}91.2%{opacity:.64;}92%{opacity:.17;}93.6%,100%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}}
    @keyframes hit {0%,2.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}3.2%{opacity:1;}4%{opacity:.25;}4.6%{opacity:1;}6.6%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}
      26.5%,26.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.93) * 1cqw));opacity:0;}27.2%{opacity:1;}28%{opacity:.3;}28.7%{opacity:1;}31%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.93) * 1cqw));opacity:0;}
      61.5%,61.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.3) * 1cqw));opacity:0;}62.2%{opacity:1;}63%{opacity:.3;}63.7%{opacity:1;}66.5%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.3) * 1cqw));opacity:0;}
      90.5%,90.9%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}91.2%{opacity:.75;}92%{opacity:.2;}93.6%,100%{transform:translateX(calc((var(--zn) + (100 - var(--zn)) * 0.12) * 1cqw));opacity:0;}}
    @keyframes scud {from{transform:translateX(-160px);}to{transform:translateX(calc(100cqw + 40px));}}
    @keyframes wander {0%{transform:translate(0,0);}33%{transform:translate(14px,-10px);}66%{transform:translate(-9px,-18px);}100%{transform:translate(11px,4px);}}
    @keyframes blink {0%,100%{opacity:0;}35%,65%{opacity:1;}}
    @container (max-width:650px) {
      .scene {--z0:var(--nw-zone,0%);--zn:var(--nw-zone-n,0);--ax0:var(--nw-arc-x0,20%);--ax1:var(--nw-arc-x1,96%);--at:var(--nw-arc-top,40px);}
      .home {left:var(--nw-house-x,34%);}
    }
    @media (prefers-reduced-motion:reduce) {.scene *,.scene *::before,.scene *::after {animation:none!important;}.smoke i {opacity:.4;}.gust .win {transform:translateX(61%);}.gust .line {transform:translateX(-27.5%);}.twinkle {opacity:var(--o);}}
  `;
}
