import { css, html, LitElement, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from './define';

/** Bolt artwork and phase offset in the 6 s storm cycle. Offsets keep successive strikes ≥ 1.8 s apart. */
const BOLTS=[
  {d:'M58 0 43 40 61 52 35 88 49 97 24 144 37 151 12 217M43 40 23 56 34 67 17 91M35 88 72 107 64 121 88 147',delay:0},
  {d:'M42 0 62 35 48 52 81 87 67 102 92 153 80 171 104 216M62 35 85 40 81 58 105 80',delay:-2.1},
  {d:'M70 0 52 30 66 44 40 78 58 86 30 130 44 136 26 190M52 30 34 42 40 56M40 78 18 96',delay:-4.2},
];

/** Nuances of a condition that Météo-France tells apart:
 *  few, veil (partlycloudy) · overcast (cloudy) · mist, patches, dense, freezing-fog (fog) · drizzle, showers, showers-light (rainy)
 *  · freezing-rain, sleet-showers (snowy-rainy) · flurries, heavy-snow, snow-showers (snowy) · storm-risk, storm-hail (lightning) · storm-showers (lightning-rainy). */
export const SKY_DETAILS=['few','veil','overcast','mist','patches','dense','freezing-fog','drizzle','showers','showers-light','freezing-rain','sleet-showers',
  'flurries','heavy-snow','snow-showers','storm-risk','storm-hail','storm-showers'] as const;
/** Wind that shows on the sky: mean speed or gusts, km/h. */
const STRONG_WIND=40, STRONG_GUST=70;
/** A steady breeze: a few slow, faint threads, no slanted rain. */
const BREEZE_WIND=25, BREEZE_GUST=45;

// The cumulus of every cloudy sky (viewBox 180 × 124): the back mass rises to a tall tower; its base and the front lump's are billowed.
const CLOUD_REAR='M40 112C20 112 6 99 6 80C6 63 18 51 34 48C35 26 51 9 72 9C92 9 107 22 110 40C116 37 122 35 129 35C153 35 173 52 173 76C173 96 158 110 140 111C132 118 114 120 104 114C94 120 73 120 64 114C56 119 45 118 40 112Z';
const CLOUD_NEAR='M38 114C25 114 17 105 17 93C17 81 26 73 37 72C39 58 50 49 63 49C77 49 88 59 89 72C105 69 121 79 121 93C121 105 112 113 98 114C90 120 76 121 68 116C60 121 45 120 38 114Z';
/** Each sky's own gradient names: two cards on a page never paint with each other's (the browser QA's « unique gradient names »). */
let skies = 0;
/** Original vector/CSS weather scene. All artwork is bundled; no remote assets. */
@define('hestia-weather-sky')
export class HestiaWeatherSky extends LitElement {
  private readonly uid = `sky${++skies}`;
  @property() condition='unknown';
  @property() phase='unknown';
  @property() quality:'low'|'standard'='standard';
  @property({type:Boolean}) animated=true;
  @property({type:Number}) wind=0;
  /** Gusts in km/h: a strong wind draws gusts and slants the rain, whatever the condition. */
  @property({type:Number}) gust=0;
  /** Météo-France nuance inside a condition (see SKY_DETAILS); empty keeps the plain scene. */
  @property() detail='';
  /** spring | summer | autumn | winter: small seasonal touches that never contradict the weather. */
  @property() season='';
  @state() private visible=false;
  @state() private pageVisible=true;
  private observer?:IntersectionObserver;
  private visibility=()=>{this.pageVisible=!document.hidden;};
  connectedCallback() {
    super.connectedCallback();this.visibility();document.addEventListener('visibilitychange',this.visibility);
    if(typeof IntersectionObserver!=='undefined') {
      this.observer=new IntersectionObserver(entries=>{this.visible=entries.some(e=>e.isIntersecting);});this.observer.observe(this);
    } else this.visible=true;
  }
  disconnectedCallback() {super.disconnectedCallback();this.observer?.disconnect();document.removeEventListener('visibilitychange',this.visibility);}
  /** A cumulus: a back mass with a tall tower and a lower front lump, both with a billowed base (not a flat cut);
   *  each is lit on top and shaded underneath, so the cloud has volume. */
  private cloud(layer:string) {
    const id=`nw-cloud-${this.uid}-${layer}`;
    return html`<div class=${`cloud ${layer}`}><svg viewBox="0 0 180 124" aria-hidden="true">
      <defs><linearGradient id=${id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="lit"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".58" stop-color="#1b2b3d" stop-opacity="0"/><stop offset="1" class="base"/></linearGradient></defs>
      <path class="cloud-rear" d=${CLOUD_REAR}/><path fill=${`url(#${id})`} d=${CLOUD_REAR}/>
      <path class="cloud-near" d=${CLOUD_NEAR}/><path fill=${`url(#${id})`} d=${CLOUD_NEAR}/>
    </svg></div>`;
  }
  /** Deterministic star field over the artwork side; each star twinkles on its own rhythm. */
  private stars(count:number) {
    return Array.from({length:count},(_,i)=>{
      const duration=2.2+(i*7%10)*.26;
      return html`<i class=${`star${i%6===0?' bright':''}`} style=${`--sx:${48+(i*37)%50}%;--sy:${4+(i*53)%62}%;--ss:${1.2+(i%4)*.5}px;--st:${duration}s;--sd:${-((i*.73)%duration)}s`}></i>`;
    });
  }
  /** Fog: drifting bands of mist at several depths, instead of clouds. */
  private fog() {
    // Five fogs, from the lightest to the thickest:
    //  mist (brume): thin threads across a sky still blue, the sun plain to see;
    //  patches (bancs): thick banks lying on the ground only, clear sky and sun above;
    //  fog: bands over the whole height, the sun a pale disc;
    //  dense: a closed grey wall that breathes, bands in front, no sun;
    //  freezing-fog: the same wall, colder, with ice crystals glinting in the air (and rime on the ground).
    const d=this.detail, low=this.quality==='low', dense=d==='dense'||d==='freezing-fog';
    const day=this.phase==='day'||this.phase==='twilight';
    const band=(i:number,y:number,x:number,w:number,depth:number,h?:number)=>html`<div class=${`fog-band depth-${depth}`} style=${`--fy:${y}%;--fl:${x}%;--fw:${w}%;--fd:${13+i*3}s;--fdelay:${-i*2.7}s;--dir:${i%2?-1:1}${h?`;--fh:${h}%`:''}`}><svg viewBox="0 0 600 60" preserveAspectRatio="none"><path d="M0 34C60 16 130 20 190 30S330 48 400 32 520 14 600 28V60H0Z"/></svg></div>`;
    if(d==='mist') return html`${day?html`<div class="orb sun"><i></i></div>`:html`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer">${Array.from({length:low?3:6},(_,i)=>html`<div class="mist-thread" style=${`--fy:${30+i*11}%;--fl:${[-8,20,-15,26,4,-20][i]}%;--fw:${[90,70,110,64,96,80][i]}%;--fd:${16+i*3}s;--fdelay:${-i*3.1}s;--dir:${i%2?-1:1}`}></div>`)}</div>`;
    if(d==='patches') return html`${day?html`<div class="orb sun"><i></i></div>`:html`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer patches">${[[0,52,-14,56,2,44],[1,60,36,50,2,40],[2,48,66,52,2,46],[3,68,10,60,1,34]].slice(0,low?2:4).map(([i,y,x,w,k,h])=>band(i,y,x,w,k,h))}</div>`;
    const bands=low?(dense?4:3):dense?7:5;
    return html`${day&&!dense?html`<div class="fog-sun"></div>`:nothing}${dense?html`<div class="fog-wall"></div>`:nothing}
      <div class="fog-layer">${Array.from({length:bands},(_,i)=>band(i,(dense?2:6)+i*(dense?12:16),[-10,18,-25,30,0,-15,22][i],[120,95,140,85,130,110,100][i],i%3))}</div>
      ${d==='freezing-fog'?html`<div class="ice-air">${Array.from({length:low?8:22},(_,i)=>html`<i style=${`--x:${(i*37+5)%96}%;--y:${8+(i*53)%80}%;--t:${2.4+(i%5)*.5}s;--dl:-${(i*0.7)%3}s`}></i>`)}</div>`:nothing}`;
  }
  /** Ice on the ground: a glassy sheet with a glint sweeping across (freezing rain), or white rime (freezing fog); crystals sparkle on it. */
  private ice(kind:'glaze'|'rime') {
    return html`<div class=${`ice ${kind}`}>${Array.from({length:this.quality==='low'?4:10},(_,i)=>html`<i style=${`--x:${4+(i*17*37+11)%92}%;--dl:-${(i*37+11)%30/10}s`}></i>`)}</div>`;
  }
  /** Wind: threads of air that run across the sky, a short stretch of each line travelling along it; some curl at their end.
   *  The stronger the gusts, the more threads and the faster they run. */
  private windLines(breeze=false) {
    const storm=Math.max(this.gust,this.wind*1.6)>=100, count=this.quality==='low'?(breeze?2:4):breeze?5:storm?14:10;
    // [path, top %, left %, width %] — gentle waves, and two that curl like a gust.
    const shapes=['M0 20C60 8 120 30 180 18S300 6 400 20','M0 14C80 24 160 4 240 16S340 26 400 12','M0 18C90 10 170 26 260 16C320 10 350 0 340 -8C332 -16 316 -8 324 2',
      'M0 22C70 14 140 24 210 16S330 8 400 18','M0 16C100 22 200 8 290 18C340 24 372 12 364 2C358 -6 344 0 350 8'];
    // A breeze only draws the gentle waves, never a curling gust.
    const pick=breeze?[0,1,3]:[0,1,2,3,4];
    return html`<div class="wind">${Array.from({length:count},(_,i)=>{
      const t=(breeze?3.6:storm?1.5:2.3)+(i*37%9)/10;
      return html`<div class="wind-line" style=${`--wy:${8+(i*29)%80}%;--wx:${-10+(i*41)%45}%;--ww:${55+(i*23)%45}%;--wt:${t}s;--wd:${-((i*1.7)%t).toFixed(2)}s;--wo:${(breeze?.45:.55)+(i%3)*(breeze?.12:.2)}`}>
        <svg viewBox="0 -20 400 50" preserveAspectRatio="none"><path d=${shapes[pick[i%pick.length]]}/></svg></div>`;})}</div>`;
  }
  /** Ciel voilé: long thin streaks of high cloud over a softened sun. */
  private cirrus() {
    return html`<div class="veil-wash"></div>${[0,1,2].slice(0,this.quality==='low'?2:3).map(i=>html`<div class=${`cirrus c${i}`}></div>`)}`;
  }
  /** Six-armed snowflake centred on 0,0: main arms, two pairs of side branches and an inner star. */
  private static flake(r:number):string {
    let d='';
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3,c=Math.cos(a),n=Math.sin(a),p=(t:number)=>[c*t,n*t];
      const [ex,ey]=p(r);d+=`M0 0L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      for(const [t,len] of [[.42,.3],[.68,.22]] as const){
        const [bx,by]=p(r*t);
        for(const side of [-1,1]){const b=a+side*Math.PI/4;d+=`M${bx.toFixed(1)} ${by.toFixed(1)}l${(Math.cos(b)*r*len).toFixed(1)} ${(Math.sin(b)*r*len).toFixed(1)}`;}
      }
      const [ix,iy]=p(r*.24),[jx,jy]=[Math.cos(a+Math.PI/3)*r*.24,Math.sin(a+Math.PI/3)*r*.24];
      d+=`M${ix.toFixed(1)} ${iy.toFixed(1)}L${(Math.cos(a+Math.PI/6)*r*.36).toFixed(1)} ${(Math.sin(a+Math.PI/6)*r*.36).toFixed(1)}L${jx.toFixed(1)} ${jy.toFixed(1)}`;
    }
    return d;
  }
  /** Plane-tree autumn shades: golden, green turning orange, red-brown. The gradient runs from the stem to the tip. */
  private static planeTint(k:number,uid:string) {
    const stops=[['#d9a531','#e8b84a','#c76a26'],['#8f9e3e','#e29a34','#b5502a'],['#b64a2b','#c9572f','#7f2c1f']][k];
    return svg`<linearGradient id=${`nw-plane-${k}-${uid}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color=${stops[0]}/><stop offset=".55" stop-color=${stops[1]}/><stop offset="1" stop-color=${stops[2]}/></linearGradient>`;
  }
  /** Winter in the top-right corner: snowflakes of every size gather, glow and sparkle, then fade, on a 16 s cycle. */
  private frostPane() {
    // [x, y, radius, opacity, rotation, delay s] in a 420 × 170 corner
    const flakes=[[372,34,58,.9,8,0],[300,18,34,.75,-12,.8],[404,112,30,.7,20,1.6],[246,52,22,.55,4,2.2],[330,88,18,.6,-6,1.2],[214,16,15,.45,14,2.8],
      [388,158,13,.45,-10,3.2],[270,108,11,.4,0,2],[176,40,12,.35,22,3.6],[140,12,9,.3,-14,4]];
    const bokeh=[[350,70,16],[262,30,10],[396,60,9],[220,78,7]], sparks=[[318,52],[244,10],[402,22],[286,74],[196,58]];
    return html`<svg class="frost-pane" viewBox="0 0 420 170" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
      <defs><radialGradient id=${`nw-bokeh-${this.uid}`}><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${bokeh.map(([x,y,r],k)=>svg`<circle class="frost-bokeh" fill=${`url(#nw-bokeh-${this.uid})`} cx=${x} cy=${y} r=${r} style=${`--fd:${k*1.1}s`}/>`)}
      ${flakes.map(([x,y,r,o,rot,d])=>svg`<g transform=${`translate(${x} ${y}) rotate(${rot})`}><path class="frost-flake" style=${`--fo:${o};--fd:${d}s;stroke-width:${Math.max(1.2,r*.11)}`} d=${HestiaWeatherSky.flake(r)}/></g>`)}
      ${sparks.map(([x,y],k)=>svg`<path class="frost-spark" style=${`--fd:${k*.7}s`} transform=${`translate(${x} ${y})`} d="M0 -6L1.2 -1.2L6 0L1.2 1.2L0 6L-1.2 1.2L-6 0L-1.2 -1.2Z"/>`)}
    </svg>`;
  }
  /** Spring petal, two shades. */
  private static petal(k:number) {
    return html`<svg class=${`petal petal-${k}`} viewBox="0 0 12 12"><path d="M6 0C10 3 10 9 6 12C2 9 2 3 6 0Z"/></svg>`;
  }
  /** Plane-tree leaf in one of three autumn shades. */
  private static plane(k:number,uid:string) {
    return html`<svg class=${`plane plane-${k}`} viewBox="0 0 44 44"><defs>${HestiaWeatherSky.planeTint(k,uid)}</defs>
      <path class="stem" d="M22 30.5Q23 37 21 42.5"/><path class="blade" fill=${`url(#nw-plane-${k}-${uid})`} d="M22 32Q14 34 8 31L4 28.5L7.5 27Q11 25.5 10 22.5L4.5 21L6.5 19.5L1 13L4.5 12.5L3 9Q8 9 10.5 12L11.5 10Q14.5 13 16 16Q15.3 11 16.8 7.6L15.4 6.2L18.8 5.3Q20.8 3.6 22 1Q23.2 3.6 25.2 5.3L28.6 6.2L27.2 7.6Q28.7 11 28 16Q29.5 13 32.5 10L33.5 12Q36 9 41 9L39.5 12.5L43 13L37.5 19.5L39.5 21L34 22.5Q33 25.5 36.5 27L40 28.5L36 31Q30 34 22 32Z"/><path class="veins" d="M22 31V4M22 31Q14 22 3.5 10M22 31Q30 22 40.5 10M22 31Q14 29 5 28.5M22 31Q30 29 39 28.5M22 19L17 13.5M22 19L27 13.5M22 12L19 8.5M22 12L25 8.5M13.5 21.5L8.5 18.5M30.5 21.5L35.5 18.5M10 17L6.5 12.5M34 17L37.5 12.5"/></svg>`;
  }
  /** Dandelion seed: a fine stem under a tuft of white rays. */
  private static seed() {
    return html`<svg class="seed" viewBox="0 0 24 30"><path class="seed-stem" d="M12 29V12"/><ellipse class="seed-body" cx="12" cy="27.5" rx="1.3" ry="2.4"/>
      <path class="seed-rays" d="M12 12L3 6M12 12L5 3M12 12L8 1M12 12L12 0M12 12L16 1M12 12L19 3M12 12L21 6M12 12L1 10M12 12L23 10"/></svg>`;
  }
  /** A plain leaf: golden when there is no season, dry and brown in winter. */
  private static leaf(dry:boolean) {
    return html`<svg class=${dry?'dry':'gleaf'} viewBox="0 0 28 18"><path d="M2 9C8-2 21 1 27 4C23 17 9 20 2 9Z"/><path d="M0 10 22 6"/></svg>`;
  }
  /** What the wind carries across the sky, by season: petals, dandelion seeds, plane leaves, a few dry leaves; plain leaves without a season.
   *  Each one draws its height, pace, flutter, spin, size and shade from a fixed hash: scattered, never in a row. */
  private blown(kind:'petal'|'seed'|'plane'|'dry'|'leaf',count:number) {
    const slow=kind==='seed'?1.5:kind==='petal'?1.15:1, spin=kind==='plane'?1.4:1;
    return Array.from({length:this.quality==='low'?2:count},(_,i)=>{
      const r=(k:number)=>{const v=Math.sin((i+1)*91.7+k*47.3)*24634.6345;return v-Math.floor(v);};
      const time=(3.2+r(1)*2.6)*slow, tinted=kind==='leaf'||kind==='dry';
      const art=kind==='petal'?HestiaWeatherSky.petal(i%2):kind==='plane'?HestiaWeatherSky.plane(i%3,this.uid):kind==='seed'?HestiaWeatherSky.seed():HestiaWeatherSky.leaf(kind==='dry');
      return html`<div class="leaf-track" style=${`--leaf-top:${(18+r(2)*62).toFixed(0)}%;--leaf-delay:${(-r(3)*time).toFixed(2)}s;--leaf-time:${time.toFixed(2)}s`}><div class="leaf-bob" style=${`--bob:${((.7+r(4)*.9)*slow).toFixed(2)}s;--lamp:${((6+r(5)*14)*slow).toFixed(0)}px;--bd:${(-r(6)*1.5).toFixed(2)}s`}><div class=${`leaf k-${kind}`} style=${`--spin:${((.9+r(7)*1.4)*spin).toFixed(2)}s;--ls:${(.7+r(8)*.55).toFixed(2)};--lh:${tinted?((r(9)-.5)*50).toFixed(0):0}deg;--dir:${r(10)<.5?'normal':'reverse'}`}>${art}</div></div></div>`;
    });
  }
  /** Seasonal touches, layered over the weather: petals, rising heat, falling leaves, winter snowflakes.
   *  In a strong wind they no longer fall: the wind carries them across the sky. */
  private seasonal(rain:boolean,snow:boolean,storm:boolean,fog:boolean,windy:boolean) {
    const few=this.quality==='low', precip=rain||snow, dry=!precip&&!fog;
    if(windy) {
      if(this.season==='spring') return dry?this.blown('petal',7):nothing;
      if(this.season==='summer') return dry?this.blown('seed',6):nothing;
      // Autumn leaves fly in rain too; only snow, hail and fog hide them.
      if(this.season==='autumn') return !snow&&!fog?this.blown('plane',5):nothing;
      if(this.season==='winter') return html`${this.frostPane()}${dry?this.blown('dry',3):nothing}`;
      return dry?this.blown('leaf',5):nothing;
    }
    // Storms and a steady breeze carry leaves and petals faster.
    const gusty=storm||this.wind>=30||this.gust>=BREEZE_GUST;
    const drift=(count:number,art:(i:number)=>unknown)=>Array.from({length:few?2:count},(_,i)=>html`<div class=${`drift${gusty?' drift--gusty':''}`} style=${`--dx:${46+(i*23)%50}%;--dt:${(gusty?5:11)+(i*7)%(gusty?4:7)}s;--dd:${-(i*3.1)%11}s;--rest:${12+(i*29)%70}%;--sw:${2.6+(i%3)*.5}s`}><i>${art(i)}</i></div>`);
    if(this.season==='spring'&&!precip&&!storm&&!fog) return drift(6,i=>HestiaWeatherSky.petal(i%2));
    // Autumn leaves fall in rain and storms too; only snow and hail hide them.
    if(this.season==='autumn'&&!['snowy','snowy-rainy','hail'].includes(this.condition)) return drift(5,i=>HestiaWeatherSky.plane(i%3,this.uid));
    if(this.season==='summer'&&this.phase==='day'&&['sunny','partlycloudy'].includes(this.condition)) return html`<div class="heat">${Array.from({length:few?3:7},(_,i)=>html`<div class="heat-plume" style=${`--hx:${47+(i*13)%46}%;--hh:${70+(i*17)%45}px;--hd:${-(i*.9)%4.2}s;--hs:${1.6+(i%3)*.35}s`}><svg viewBox="0 0 24 120" preserveAspectRatio="none"><defs><linearGradient id=${`nw-heat-${i}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="heat-stop" stop-opacity="0"/><stop offset=".35" class="heat-stop" stop-opacity=".6"/><stop offset="1" class="heat-stop" stop-opacity="0"/></linearGradient></defs><path stroke=${`url(#nw-heat-${i})`} d="M12 120C4 104 20 92 12 76S4 48 12 32S20 10 12 0"/></svg></div>`)}</div>`;
    if(this.season==='winter') return this.frostPane();
    return nothing;
  }
  protected render() {
    const d=this.detail, low=this.quality==='low';
    const freezingRain=d==='freezing-rain', stormHail=d==='storm-hail', distant=d==='storm-risk';
    const showers=['showers','showers-light','snow-showers','sleet-showers','storm-showers'].includes(d);
    const rain=['rainy','pouring','lightning-rainy','snowy-rainy','hail'].includes(this.condition)||stormHail;
    const hail=this.condition==='hail'||stormHail;
    const snow=(['snowy','snowy-rainy'].includes(this.condition)&&!freezingRain)||hail;
    const storm=['lightning','lightning-rainy'].includes(this.condition);
    const bolts=storm&&!distant;
    const fog=this.condition==='fog';
    const cloudy=!fog&&!['sunny','clear-night','unknown','exceptional'].includes(this.condition);
    // Showers and a storm that only threatens leave the sun (or the moon) between the clouds.
    const clearSky=['sunny','clear-night','partlycloudy','windy'].includes(this.condition)||showers||distant;
    // Météo-France never says « windy »: the wind itself, mean or gusts, brings the gusts on the sky.
    const windy=['windy','windy-variant'].includes(this.condition)||this.wind>=STRONG_WIND||this.gust>=STRONG_GUST;
    const breeze=!windy&&(this.wind>=BREEZE_WIND||this.gust>=BREEZE_GUST);
    const heavy=this.condition==='pouring';
    // Averses orageuses: the storm passes between sunny spells, so the sky stays open.
    const closed=heavy||(bolts&&d!=='storm-showers')||hail||d==='overcast';
    const n=low ? (d==='heavy-snow'?14:d==='flurries'?5:8) : heavy ? 80 : hail ? 18 : d==='drizzle' ? 30 : d==='showers-light' ? 20
      : rain ? 52 : d==='flurries' ? 22 : d==='heavy-snow' ? 160 : snow ? 90 : 20;
    const drift=windy ? -150 : heavy ? -85 : -38;
    const particles=(kind:string,count=n)=>Array.from({length:count},(_,i)=>{
      // Every drop and flake draws its own place, size, speed and shade from a fixed hash: irregular, never a comb, and the same at each render.
      const r=(k:number)=>{const v=Math.sin((i+1)*12.9898+k*78.233+kind.length*3.1)*43758.5453;return v-Math.floor(v);};
      const x=`--x:${(r(1)*104-2).toFixed(1)}%;--rest:${(r(2)*88).toFixed(0)}%`;
      if(kind==='rain') {
        // Far drops (most of them) are short, thin, pale and slower; near ones long and bright. Each leans a little on its own.
        const depth=r(3)<.45?0:r(3)<.82?1:2;
        const duration=(heavy?.45:d==='drizzle'?1.5:.8)*(.85+r(4)*.35)*(1+(2-depth)*.18);
        const len=(heavy?34:d==='drizzle'?10:freezingRain?16:22)*(.55+r(5)*.7)*(.7+depth*.2);
        const width=(heavy?2.4:d==='drizzle'?1.3:1.9)*(.75+depth*.2);
        const lean=(windy?24:heavy?15:d==='drizzle'?5:9)+(r(6)-.5)*5;
        return html`<i class=${`particle rain depth-${depth}`} style=${`${x};--delay:${(-r(7)*duration).toFixed(2)}s;--duration:${duration.toFixed(2)}s;--len:${len.toFixed(1)}px;--w:${width.toFixed(2)}px;--rot:${lean.toFixed(1)}deg;--o:${(.5+depth*.18+r(8)*.2).toFixed(2)};--drift:${drift+(r(9)-.5)*20}px`}></i>`;
      }
      if(kind==='snow') {
        // Mostly small, far, faint flakes; a few soft, blurred ones close by. Each sways at its own pace and width.
        const depth=low ? (r(3)<.6?1:2) : r(3)<.4?0:r(3)<.75?1:r(3)<.93?2:3;
        const duration=[13,10.5,8.5,7][depth]*(.85+r(4)*.3)*(d==='heavy-snow'?.6:1);
        const size=[[2,3.4],[3,5],[4.5,6.5],[6.5,9.5]][depth], s=size[0]+r(5)*(size[1]-size[0]);
        return html`<i class=${`particle snow depth-${depth}`} style=${`${x};--delay:${(-r(7)*duration).toFixed(2)}s;--duration:${duration.toFixed(2)}s;--size:${s.toFixed(1)}px;--o:${([.5,.62,.72,.78][depth]+r(8)*.18).toFixed(2)};--blur:${[.3,.2,.5,1.1][depth]}px;--amp:${([3,5,8,11][depth]*(.6+r(9)*.8)).toFixed(1)}px;--sw:${(2.2+r(10)*2.5).toFixed(2)}s`}></i>`;
      }
      const duration=1.9+(i*37%8)/10, size=4+i%3;
      return html`<i class=${`particle ${kind} depth-${i%3}`} style=${`${x};--delay:${-((i*13)%37)/37*duration}s;--duration:${duration}s;--size:${size}px;--drift:${drift}px;--dx:${(i%2?1:-1)*(5+(i*5*37+11)%8)}px`}></i>`;
    });
    // Water on the ground: a shimmering film, and splashes (two droplets and a widening ripple) here and there.
    // Drizzle only wets the ground; freezing rain glazes it.
    const ground=(count:number)=>freezingRain?this.ice('glaze'):html`<div class="wet"></div>${d==='drizzle'?nothing:Array.from({length:low?Math.min(count,5):count},(_,i)=>html`<i class="splash" style=${`--x:${4+(i*11*37+11)%92}%;--d:${1.1+(i*37+11)%7/10}s;--dl:-${((i*3*37+11)%150)/100}s`}></i>`)}`;
    // Showers come and go: rain or snow in bursts, with the sun between them.
    const fall=html`${rain?particles('rain',hail&&!low?18:n):nothing}${snow?particles(hail?'hailstone':'snow',hail&&!low?(stormHail?22:30):n):nothing}
        ${rain?ground(heavy?18:hail?8:d==='showers-light'?6:14):nothing}`;
    return html`<div class=${`scene ${this.phase} ${this.condition}${d?` detail-${d}`:''}${windy?' gale':''}${closed?' closed-sky':''}${this.season?` season-${this.season}`:''}`} style=${`--play:${this.animated&&this.visible&&this.pageVisible?'running':'paused'};--cloud-duration:${windy?6:Math.max(11,28-Math.min(Math.max(this.wind,0),60)/2.5)}s`} ?data-still=${!this.animated}>
      <div class="weather-art">${this.condition!=='unknown'&&this.condition!=='exceptional' ? html`
        ${this.phase==='night'&&clearSky?this.stars(this.quality==='low'?8:this.condition==='partlycloudy'&&d!=='few'?12:24):nothing}
        ${clearSky?(this.phase==='night'?html`<div class="orb moon"><i></i><b></b></div>`:html`<div class="orb sun"><i></i></div>`):nothing}
        ${closed?html`<div class="overcast"></div>${this.cloud('heavy-left')}${low?nothing:this.cloud('heavy-right')}${d==='overcast'&&!low?this.cloud('back'):nothing}`
          :d==='veil'?this.cirrus()
          :d==='few'?this.cloud('front')
          :cloudy?html`${this.cloud('back')}${this.cloud('front')}${low?nothing:this.cloud('small')}`:nothing}
        ${fog?this.fog():nothing}
        ${d==='freezing-fog'?this.ice('rime'):nothing}
        ${this.condition!=='unknown'?this.seasonal(rain,snow,storm,fog,windy):nothing}
        ${showers?html`<div class="burst">${fall}</div>`:fall}
        ${this.condition==='snowy'&&d!=='flurries'?html`<div class="snowbank"><svg viewBox="0 0 400 20" preserveAspectRatio="none"><defs><linearGradient id=${`nw-snowbank-${this.uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe9f4"/></linearGradient></defs>
          <path fill=${`url(#nw-snowbank-${this.uid})`} d="M0 20V11C22 6 40 13 66 9S112 4 140 9 190 14 222 8 276 4 306 10 360 13 400 8V20Z"/></svg>
          ${Array.from({length:low?3:8},(_,i)=>html`<i style=${`--x:${6+(i*13*37+11)%88}%;--dl:-${(i*37+11)%26/10}s`}></i>`)}</div>`:nothing}
        ${windy?this.windLines():breeze?this.windLines(true):nothing}
        ${storm?html`${bolts?BOLTS.map((b,i)=>html`<div class=${`bolt b${i+1}`} style=${`animation-delay:${b.delay}s`}><svg viewBox="0 0 120 220"><path d=${b.d}/></svg></div>`):nothing}
          ${BOLTS.map((b,i)=>html`<div class=${`flash f${i+1}`} style=${`animation-delay:${b.delay}s`}></div>`)}`:nothing}
      `:nothing}</div>
    </div>`;
  }
  static styles=css`
    :host {display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;}
    /* The sky colour is a faded layer under the artwork: the drawings stay crisp while the card background shows through.
       Night and storm keep more of their colour, because their artwork (stars, moon, bolts) needs a dark sky. */
    .scene {position:absolute;inset:0;overflow:hidden;--sky:linear-gradient(150deg,#5689b8,#6cb4df 65%,#a3d0e6);--tint:.42;}
    .scene::before {content:'';position:absolute;inset:0;background:var(--sky);opacity:var(--tint);}
    /* Seasonal light: a faint wash on the artwork side, under everything else. */
    .scene::after {content:'';position:absolute;inset:0;pointer-events:none;background:var(--season-light,none);}
    .season-spring {--season-light:radial-gradient(ellipse 60% 90% at 80% 100%,rgba(150,210,120,.14),transparent 70%);}
    .season-summer {--season-light:radial-gradient(ellipse 55% 80% at 78% 20%,rgba(255,196,110,.16),transparent 70%);}
    .season-autumn {--season-light:radial-gradient(ellipse 65% 90% at 85% 90%,rgba(230,140,60,.14),transparent 70%);}
    .season-winter {--season-light:radial-gradient(ellipse 60% 90% at 85% 10%,rgba(190,225,255,.18),transparent 70%);}
    /* Summer: a bigger, hotter sun whose glow breathes. */
    .season-summer .sun {width:136px;height:136px;margin:-30px 0 0 -30px;box-shadow:0 0 64px 28px #ffc96a88;animation:bob 9s ease-in-out infinite,sun-glow 4s ease-in-out infinite;}
    /* Full-height track moved by translate only (top would relayout every frame); the leaf sits at its top. */
    .drift {position:absolute;left:var(--dx);top:0;height:100%;translate:0 -8%;animation:drift-fall var(--dt) linear var(--dd) infinite;}
    .drift>i {display:block;animation:sway var(--sw) ease-in-out infinite alternate;}
    .drift--gusty {animation-name:drift-gust;}
    .petal {width:14px;height:14px;filter:drop-shadow(0 1px 1px #0002);}.petal-0 {fill:#f2a9c6;}.petal-1 {fill:#fbe3ec;}
    /* Plane-tree leaf: five toothed lobes, palmate veins, long stem. */
    .plane {width:24px;height:24px;overflow:visible;filter:drop-shadow(0 1px 1.5px #0004);}
    .plane .stem {fill:none;stroke:#7a4a22;stroke-width:1.4;stroke-linecap:round;} .plane .blade {stroke:#6b3d16;stroke-opacity:.25;stroke-width:.4;} .plane .veins {fill:none;stroke:#5b3a17;stroke-opacity:.4;stroke-width:.6;stroke-linecap:round;}
    .plane-0 .stem {stroke:#8a5a26;} .plane-2 .stem {stroke:#5e2416;}
    .night .drift {filter:brightness(.6);}
    /* Heat rising over the artwork side, above the banner's bottom fade: warm wavy lines that climb and fade. */
    /* Heat rising from the ground on a sunny summer day: soft vertical plumes that waver as they climb, over a warm glow at the horizon. */
    .heat {position:absolute;left:0;right:0;top:16%;height:62%;--heat:color-mix(in srgb,var(--primary-text-color,#253047) 28%,rgb(255,168,80));background:radial-gradient(ellipse 50% 50% at 72% 78%,rgba(255,175,95,.16),transparent 75%);-webkit-mask-image:linear-gradient(transparent,#000 22%,#000 62%,transparent);mask-image:linear-gradient(transparent,#000 22%,#000 62%,transparent);}
    .heat-stop {stop-color:var(--heat);}
    .heat-plume {position:absolute;left:var(--hx);bottom:14%;width:22px;height:var(--hh);fill:none;stroke-width:7;stroke-linecap:round;filter:blur(3px);opacity:0;transform-origin:50% 100%;animation:heat-rise 4.2s ease-out var(--hd) infinite,heat-sway var(--hs) ease-in-out var(--hd) infinite alternate;}
    /* Clear of the "En ce moment" column on wide cards; the corner is free on mobile. */
    /* Winter corner: soft white glow from the corner, light-blue snowflakes with a white rim (visible on light and dark cards). */
    .frost-pane {position:absolute;right:0;top:0;width:min(46%,460px);height:186px;overflow:visible;background:radial-gradient(ellipse 70% 85% at 100% 0,rgba(235,246,255,.55),rgba(235,246,255,.18) 45%,transparent 75%);}
    .frost-flake {fill:none;stroke:#a7cdf2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 3px rgba(255,255,255,.6));transform-box:fill-box;transform-origin:center;opacity:var(--fo);animation:flake-cycle 16s ease-in-out var(--fd) infinite;}
    .frost-bokeh {opacity:.6;animation:bokeh-cycle 16s ease-in-out var(--fd) infinite;}
    .frost-spark {fill:#fff;filter:drop-shadow(0 0 3px #dff1ff);transform-box:fill-box;transform-origin:center;opacity:0;animation:spark-cycle 16s ease-in-out var(--fd) infinite;}
    .weather-art {display:contents;}
    .scene.night {--sky:linear-gradient(145deg,#0b1430,#1f3358 70%,#3a5274);--tint:.46;}
    .scene.twilight {--sky:linear-gradient(155deg,#404c8d,#d18d9b 65%,#f2c599);--tint:.5;}
    .scene.cloudy,.scene.windy-variant {--sky:linear-gradient(155deg,#4c657b,#8aa3b7 75%,#becbd4);}
    .scene.fog {--sky:linear-gradient(180deg,#7f8e9a,#aab6be 60%,#c9d1d6);--tint:.5;}
    .scene.rainy {--sky:linear-gradient(150deg,#263e56,#486580 65%,#6c8aa1);--tint:.45;}
    .scene.pouring {--sky:linear-gradient(150deg,#17293f,#35485e 65%,#536c83);--tint:.45;}
    .scene.lightning,.scene.lightning-rainy {--sky:linear-gradient(150deg,#0b1626,#1d2c40 65%,#32435a);--tint:.52;}
    /* A snowy sky a shade darker than the flakes, so they show. */
    .scene.snowy,.scene.snowy-rainy {--sky:linear-gradient(150deg,#3b5876,#7491ab 70%,#a9bfcf);--tint:.55;}
    .scene.hail {--sky:linear-gradient(150deg,#1d2a3c,#3f5068 65%,#56677d);--tint:.5;}
    .scene.night:not(.clear-night):not(.sunny):not(.partlycloudy) {--sky:linear-gradient(150deg,#111c2c,#334457 80%,#506276);--tint:.44;}
    .scene.night.lightning,.scene.night.lightning-rainy {--tint:.56;}
    .scene.unknown,.scene.exceptional {--sky:linear-gradient(145deg,#697782,#87949e);--tint:.3;}
    /* Météo-France nuances: each one tints its sky a shade from the plain condition. */
    .scene.detail-veil {--sky:linear-gradient(150deg,#7b9cb8,#a9c6db 65%,#d4e2ec);--tint:.42;}
    .scene.detail-overcast {--sky:linear-gradient(155deg,#3f4f60,#6c7d8e 75%,#9aa8b4);--tint:.46;}
    .scene.detail-mist {--sky:linear-gradient(160deg,#6f98bd,#a6c3d8 60%,#d2dfe8);--tint:.45;}
    .scene.detail-patches {--sky:linear-gradient(150deg,#5a8ab8,#8ab8da 65%,#c2d8e6);--tint:.42;}
    .scene.detail-dense {--sky:linear-gradient(180deg,#6f7c87,#98a4ad 60%,#b8c1c7);--tint:.6;}
    .scene.detail-freezing-fog {--sky:linear-gradient(180deg,#6f879c,#a2b8c9 60%,#cbdae6);--tint:.6;}
    .scene.detail-drizzle {--sky:linear-gradient(150deg,#3a536b,#5f7b94 65%,#8aa2b5);--tint:.42;}
    .scene.detail-showers,.scene.detail-showers-light,.scene.detail-snow-showers,.scene.detail-sleet-showers {--sky:linear-gradient(150deg,#46698b,#6f97b8 65%,#a5c3d8);--tint:.44;}
    .scene.detail-freezing-rain {--sky:linear-gradient(150deg,#2c4560,#5b7d9c 65%,#9cb6cb);--tint:.5;}
    .scene.detail-flurries {--sky:linear-gradient(150deg,#56728e,#8ea7bd 70%,#bccbd8);--tint:.48;}
    .scene.detail-heavy-snow {--sky:linear-gradient(150deg,#2e465f,#5f7a93 70%,#8ea5b8);--tint:.58;}
    .scene.detail-storm-showers {--sky:linear-gradient(150deg,#2a3d52,#557089 65%,#8aa3b8);--tint:.48;}
    .scene.detail-storm-risk {--sky:linear-gradient(150deg,#2f4256,#5a6f86 65%,#8095aa);--tint:.48;}
    /* --nw-orb-x (and, on a phone, --nw-orb-y) let a card move the sun or moon away from its text. */
    .orb {position:absolute;left:var(--nw-orb-x,73%);top:36px;width:76px;height:76px;border-radius:50%;}
    /* The big sun: a whole disc (never cut by the top of the card), its glow, and rays turning slowly. Centred where the 76 px orb was. */
    .sun {width:112px;height:112px;margin:-18px 0 0 -18px;background:radial-gradient(circle at 38% 36%,#fff9dc,#ffe17e 58%,#f2bb55);
      box-shadow:0 0 0 1px #fff3c455,0 0 48px 18px #ffd76a66;animation:bob 9s ease-in-out infinite;}
    .sun i {position:absolute;inset:-46px;border-radius:50%;background:repeating-conic-gradient(from 0deg,#fff2b000 0 13deg,#fff2b0b0 15deg 18deg,#fff2b000 20deg 30deg);
      -webkit-mask-image:radial-gradient(circle,transparent 38%,black 50%,transparent 72%);mask-image:radial-gradient(circle,transparent 38%,black 50%,transparent 72%);animation:rays 38s linear infinite;}
    .moon {width:60px;height:60px;background:radial-gradient(circle at 34% 32%,#fffef6,#f3efd6 55%,#d3dbe0);animation:bob 11s ease-in-out infinite;
      box-shadow:inset -9px -7px 14px #9aa6b255,0 0 16px 3px #fff9e0aa,0 0 50px 16px #e9efff40,0 0 110px 40px #c7d6ff1f;}
    .moon i {position:absolute;inset:-34px;border-radius:50%;background:radial-gradient(circle,#fff7d84d,transparent 66%);animation:halo 6s ease-in-out infinite alternate;}
    /* Craters: a shaded hollow with a lit rim. */
    .moon b {position:absolute;inset:0;border-radius:50%;background:
      radial-gradient(circle at 30% 58%,#b4bba866 0 5px,#fffef6aa 5.5px 6.5px,transparent 7px),radial-gradient(circle at 63% 28%,#b4bba855 0 4px,#fffef699 4.5px 5.3px,transparent 5.8px),
      radial-gradient(circle at 68% 68%,#b4bba84d 0 7px,#fffef680 7.5px 8.5px,transparent 9px),radial-gradient(circle at 44% 36%,#b4bba844 0 2.5px,transparent 3.2px),
      radial-gradient(circle at 50% 82%,#b4bba844 0 3px,transparent 3.8px),radial-gradient(circle at 22% 34%,#b4bba83d 0 2px,transparent 2.6px);}
    .star {position:absolute;left:var(--sx);top:var(--sy);width:var(--ss);height:var(--ss);border-radius:50%;background:#fff;box-shadow:0 0 4px #fffc;animation:twinkle var(--st) ease-in-out var(--sd) infinite;}
    .star.bright {width:calc(var(--ss) + 1px);height:calc(var(--ss) + 1px);box-shadow:0 0 6px 1px #fff;}
    .star.bright::before,.star.bright::after {content:'';position:absolute;left:50%;top:50%;width:11px;height:1px;translate:-50% -50%;background:linear-gradient(90deg,transparent,#fffe,transparent);}
    .star.bright::after {rotate:90deg;}
    .cloud {position:absolute;width:190px;aspect-ratio:180/124;overflow:visible;filter:drop-shadow(0 5px 7px #172d4317);animation:clouds var(--cloud-duration,32s) ease-in-out infinite alternate;}
    /* Animated artwork is wrapped in a div: Chrome can only hand HTML boxes to the GPU, an animated <svg> restyles every frame. */
    :is(.cloud,.fog-band,.heat-plume,.leaf,.bolt)>svg {display:block;width:100%;height:100%;overflow:visible;}
    /* Day clouds take a little of the theme's text colour: a grey back and a soft shadow on a light card (white on white vanished),
       unchanged on a dark one. The shadow fades as the text gets lighter (relative colour; older browsers keep the faint one). */
    .cloud {--cloud-shade:oklch(from var(--primary-text-color,#253047) .3 .03 250 / calc((1 - l) * .42));}
    .cloud {filter:drop-shadow(0 5px 7px #172d4317);filter:drop-shadow(0 6px 10px var(--cloud-shade));}
    .cloud-rear {fill:color-mix(in srgb,var(--primary-text-color,#253047) 30%,#dce3e9);}.cloud-near {fill:color-mix(in srgb,var(--primary-text-color,#253047) 5%,#fbfcfd);}
    /* Volume: each mass lit on top and shaded at its base; a dark sky's clouds keep a fainter light. */
    .cloud .lit {stop-color:#fff;stop-opacity:.32;}.cloud .base {stop-color:#1b2b3d;stop-opacity:.24;}
    :is(.night,.pouring,.hail,.lightning,.lightning-rainy) .cloud .lit {stop-opacity:.16;}
    .cloud.back {left:55%;top:15px;width:220px;opacity:.62;animation-delay:-12s;}
    .cloud.front {left:73%;top:90px;animation-delay:-4s;}
    .cloud.small {left:93%;top:6px;width:150px;opacity:.7;animation-delay:-22s;}
    /* Storms and downpours: a dark ceiling and two extra banks of cloud, so the sky reads thick and closed. */
    .overcast {position:absolute;left:30%;right:0;top:0;height:46%;background:linear-gradient(180deg,rgba(28,38,52,.32),rgba(28,38,52,0));filter:blur(10px);}
    .cloud.heavy-left {left:40%;top:-34px;width:300px;opacity:.9;animation-delay:-8s;}
    .cloud.heavy-right {left:80%;top:-40px;width:320px;opacity:.85;animation-delay:-17s;}
    .night .cloud-rear {fill:#73869f;}.night .cloud-near {fill:#a0aec1;}
    .rainy .cloud-rear {fill:#7d90a5;}.pouring .cloud-rear,.hail .cloud-rear {fill:#56677c;}.lightning .cloud-rear,.lightning-rainy .cloud-rear {fill:#46566a;}
    .rainy .cloud-near {fill:#b0c0cf;}.pouring .cloud-near,.hail .cloud-near {fill:#8496aa;}
    /* Snow clouds are grey: white flakes show over them. */
    .snowy .cloud-rear,.snowy-rainy .cloud-rear {fill:#94a6b9;}.snowy .cloud-near,.snowy-rainy .cloud-near {fill:#bccad8;}.lightning .cloud-near,.lightning-rainy .cloud-near {fill:#728499;}
    .windy .cloud,.windy-variant .cloud {animation-name:wind-clouds;}
    .particle {position:absolute;left:var(--x);top:-40px;height:calc(100% + 80px);width:3px;animation:fall var(--duration) linear var(--delay) infinite;}
    .particle::before {content:'';position:absolute;top:0;left:0;display:block;}
    /* Each drop carries its own length, width, lean and shade (set in render): a streak that fades towards its tail. */
    .rain {opacity:var(--o);}
    .rain::before {width:var(--w);height:var(--len);border-radius:var(--w);background:linear-gradient(#e4f3ff00,#eaf6ffd0 40%,#f6fbff);rotate:var(--rot);}
    .snow {animation-name:snow;opacity:var(--o);}
    /* A white flake with a fine blue-grey rim and a soft glow: it shows on a pale sky as on a dark one. */
    /* A soft flake: a bright heart melting into its edge, a faint shadow so it shows on a pale sky, near flakes slightly out of focus. */
    .snow::before {width:var(--size);height:var(--size);border-radius:50%;background:radial-gradient(circle at 46% 44%,#fff 0 28%,rgba(255,255,255,.78) 52%,rgba(255,255,255,0) 74%);
      box-shadow:0 0 2px rgba(45,75,115,.16);filter:blur(var(--blur));
      animation:snow-sway var(--sw) ease-in-out var(--delay) infinite alternate;}
    /* Snow settling on the ground: a thin white layer that thickens slowly, a few crystals sparkling. */
    .snowbank {position:absolute;left:-1%;right:-1%;bottom:-1px;height:18px;transform-origin:50% 100%;scale:1 .3;animation:settle 40s ease-out forwards;}
    .snowbank svg {display:block;width:100%;height:100%;}
    .snowbank i {position:absolute;bottom:4px;left:var(--x);width:2px;height:2px;border-radius:50%;background:#fff;animation:twinkle 2.6s ease-in-out var(--dl) infinite;}
    /* Hail starts just above the card; its course (its own height, the card's) ends on the bottom edge, its ground. */
    .particle.hailstone {top:-12px;height:100%;animation-name:hail;--ground:calc(100% + 11px - var(--size));}
    .hailstone::before {width:var(--size);height:var(--size);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#dcecff 60%,#b8d0ea);box-shadow:0 0 0 .6px rgba(70,110,150,.5);}
    /* Water on the ground: a shimmering film, splashes and ripples. Darker on a light card, lighter on a dark card or a dark sky. */
    .scene {--splash:color-mix(in srgb,color-mix(in srgb,var(--primary-text-color,#253047) 45%,#dcebff) 75%,transparent);}
    .pouring,.lightning-rainy,.hail {--splash:rgb(225 238 255 / .8);}
    .wet {position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(0deg,var(--splash),transparent);opacity:.35;}
    .wet::after {content:'';position:absolute;inset:auto 0 0 0;height:1px;background:linear-gradient(90deg,transparent,var(--splash) 30%,transparent 55%,var(--splash) 80%,transparent);background-size:200% 100%;animation:sheen 6s linear infinite;}
    .splash {position:absolute;bottom:1px;left:var(--x);width:20px;height:10px;margin-left:-10px;}
    .splash::before {content:'';position:absolute;left:0;right:0;bottom:0;height:5px;border-radius:50%;border:1px solid var(--splash);opacity:0;scale:.2;animation:ripple var(--d) ease-out var(--dl) infinite;}
    .splash::after {content:'';position:absolute;left:9px;bottom:1px;width:2px;height:2px;border-radius:50%;opacity:0;box-shadow:-4px 0 0 .4px var(--splash),4px 0 0 .4px var(--splash);animation:spray var(--d) ease-out var(--dl) infinite;}
    .fog-sun {position:absolute;left:70%;top:30px;width:84px;height:84px;border-radius:50%;background:radial-gradient(circle,#fffbeae6,#fff4d080 45%,transparent 70%);filter:blur(1.5px);animation:fog-sun 9s ease-in-out infinite alternate;}
    /* Mist takes a little of the theme's text colour: pale grey on a light card, near white on a dark one. */
    .scene {--fog-ink:color-mix(in srgb,var(--primary-text-color,#253047) 42%,#eef3f6);}
    .fog-band {position:absolute;left:var(--fl);top:var(--fy);width:var(--fw);height:var(--fh,24%);fill:var(--fog-ink);filter:blur(10px);animation:fog-drift var(--fd) ease-in-out var(--fdelay) infinite alternate,fog-breathe calc(var(--fd) * .7) ease-in-out var(--fdelay) infinite alternate;}
    .fog-band.depth-0 {--fo:.4;}.fog-band.depth-1 {--fo:.55;height:var(--fh,28%);}.fog-band.depth-2 {--fo:.7;height:var(--fh,32%);filter:blur(14px);}
    .night {--fog-ink:#a9b6c4;}
    /* Brume: thin threads of mist, low in the sky. */
    .mist-thread {position:absolute;left:var(--fl);top:var(--fy);width:var(--fw);height:9px;border-radius:50%;background:linear-gradient(90deg,transparent,var(--fog-ink) 30%,var(--fog-ink) 70%,transparent);
      filter:blur(3px);--fo:.75;animation:fog-drift var(--fd) ease-in-out var(--fdelay) infinite alternate,fog-breathe calc(var(--fd) * .7) ease-in-out var(--fdelay) infinite alternate;}
    /* Brouillard dense: a closed wall of grey that breathes, behind the bands. */
    .fog-wall {position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--fog-ink) 70%,transparent),var(--fog-ink));animation:wall-breathe 10s ease-in-out infinite alternate;}
    .detail-freezing-fog {--fog-ink:color-mix(in srgb,var(--primary-text-color,#253047) 34%,#d7eaff);}
    /* Ice crystals hanging in freezing fog: tiny glints that come and go. */
    .ice-air i {position:absolute;left:var(--x);top:var(--y);width:3px;height:3px;rotate:45deg;background:#fff;box-shadow:0 0 0 .5px rgba(60,95,135,.55),0 0 5px 1px #e3f3ff;animation:twinkle var(--t) ease-in-out var(--dl) infinite;}
    /* Wind threads take the theme's text colour: blue-grey on a light card, near white on a dark card, white on a dark sky. */
    .wind {position:absolute;inset:0;--wind-ink:color-mix(in srgb,var(--primary-text-color,#253047) 55%,#e9f2fa);}
    .night .wind,.pouring .wind,.lightning .wind,.lightning-rainy .wind,.hail .wind,.detail-overcast .wind,.detail-heavy-snow .wind {--wind-ink:#f1f7fd;}
    /* The whole thread is drawn; a soft-edged window slides along it, so it fades in at its tail and out at its head, never a dot or a cut. */
    .wind-line {position:absolute;left:var(--wx);top:var(--wy);width:var(--ww);height:34px;opacity:var(--wo);
      -webkit-mask-image:linear-gradient(90deg,transparent,#000 35%,#000 65%,transparent);mask-image:linear-gradient(90deg,transparent,#000 35%,#000 65%,transparent);
      -webkit-mask-size:45% 100%;mask-size:45% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
      animation:wind-sweep var(--wt) ease-in-out var(--wd) infinite,wind-run var(--wt) ease-in-out var(--wd) infinite;}
    .wind-line svg {display:block;width:100%;height:100%;overflow:visible;}
    .wind-line path {fill:none;stroke:var(--wind-ink);stroke-width:2.2;stroke-linecap:round;vector-effect:non-scaling-stroke;}
    .leaf-track {position:absolute;left:0;top:var(--leaf-top);width:100%;height:20px;animation:leaves var(--leaf-time) linear var(--leaf-delay) infinite;}
    /* The leaf rises and dips as it flies, and flips over as it spins (it narrows when seen edge-on). */
    .leaf-bob {animation:leaf-flutter var(--bob) ease-in-out var(--bd) infinite alternate;}
    .leaf {width:20px;height:14px;scale:var(--ls);filter:hue-rotate(var(--lh)) drop-shadow(0 2px 2px #0002);animation:leaf-spin var(--spin) linear infinite var(--dir);}
    .gleaf path:first-child {fill:#e4c080;}.gleaf path:last-child {fill:none;stroke:#a5854d;stroke-width:1.4;}
    .dry path:first-child {fill:#9c6b3c;}.dry path:last-child {fill:none;stroke:#6b4423;stroke-width:1.4;}
    /* What the wind carries keeps its own size; a dandelion seed sways instead of flipping. */
    .leaf.k-dry {width:17px;height:12px;}.leaf.k-plane {width:26px;height:26px;}.leaf.k-petal {width:12px;height:12px;}.leaf.k-seed {width:18px;height:23px;}
    .leaf.k-seed {animation:seed-sway var(--spin) ease-in-out infinite alternate;filter:drop-shadow(0 0 1px rgba(40,70,110,.35));}
    .seed-stem {fill:none;stroke:#e8eef2;stroke-width:1;}.seed-body {fill:#8a7a5c;}.seed-rays {fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;}
    .bolt {position:absolute;fill:none;stroke:#fff;stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #f2f8ff) drop-shadow(0 0 16px #8fc2ff);opacity:0;animation:lightning 6s linear infinite;}
    .bolt.b1 {left:72%;top:80px;width:100px;height:170px;}
    .bolt.b2 {left:88%;top:55px;width:60px;height:130px;stroke-width:2.4;}
    .bolt.b3 {left:58%;top:28px;width:78px;height:150px;stroke-width:3;}
    /* One flash per bolt, centred on it and painted after the clouds so they light up too.
       Each strike flickers twice; strikes are ≥ 1.8 s apart, so never more than 2 flashes in a second
       (photosensitivity limit: 3). The text side of the card stays out of the bright centre. */
    .flash {position:absolute;inset:0;--fx:76%;--fy:30%;background:radial-gradient(ellipse 48% 105% at var(--fx) var(--fy),#f4f9ff,#c9dff7a6 30%,transparent 68%);mix-blend-mode:screen;opacity:0;animation:storm-flash 6s linear infinite;}
    .flash.f2 {--fx:92%;--fy:22%;}.flash.f3 {--fx:62%;--fy:18%;}
    /* Ciel voilé: a milky wash, three long streaks of high cloud, the sun softened behind them. */
    .veil-wash {position:absolute;inset:0;background:radial-gradient(ellipse 55% 70% at 76% 30%,rgba(255,255,255,.3),transparent 72%);}
    .cirrus {position:absolute;left:var(--cx);top:var(--cy);width:var(--cw);height:12px;border-radius:50%;background:linear-gradient(90deg,transparent,#fffc 35%,#ffffffb0 65%,transparent);
      filter:blur(4px);rotate:-7deg;animation:clouds 30s ease-in-out infinite alternate;}
    .cirrus.c0 {--cx:44%;--cy:42px;--cw:56%;}.cirrus.c1 {--cx:58%;--cy:84px;--cw:46%;height:9px;animation-delay:-11s;}.cirrus.c2 {--cx:50%;--cy:122px;--cw:40%;height:7px;opacity:.7;animation-delay:-20s;}
    .detail-veil .sun {filter:blur(1.5px) saturate(.7);opacity:.82;box-shadow:0 0 70px 30px #fff4d455;}.detail-veil .sun i {opacity:.25;}
    .detail-veil .moon {filter:blur(1px);opacity:.75;}
    /* Couvert: a lighter grey ceiling than a storm's, closed from edge to edge. */
    .detail-overcast .overcast {left:0;height:60%;background:linear-gradient(180deg,rgba(60,72,86,.34),rgba(60,72,86,0));}
    .detail-overcast .cloud-rear {fill:#8c99a6;}.detail-overcast .cloud-near {fill:#b9c3cc;}
    /* Brume: thin; brouillard dense: thick and closer. */
    .fog-layer {position:absolute;inset:0;}
    /* Bancs de brouillard: thick, opaque banks lying on the ground. */
    .patches .fog-band {--fo:.92;filter:blur(8px);}
    .detail-dense .fog-band,.detail-freezing-fog .fog-band {height:34%;}
    /* Bruine: short, fine, slow drops. */
    /* Pluie verglaçante: glassy drops, then ice on the ground. */
    .detail-freezing-rain .rain::before {background:linear-gradient(#dff4ff00,#e6f7ffc0 50%,#f6fcff);}
    .ice {position:absolute;left:0;right:0;bottom:0;height:9px;}
    .ice.glaze {background:linear-gradient(0deg,rgba(214,238,255,.75),rgba(214,238,255,0));}
    .ice.glaze::after {content:'';position:absolute;inset:auto 0 0 0;height:2px;background:linear-gradient(90deg,transparent 40%,#fff 50%,transparent 60%);background-size:250% 100%;animation:sheen 3.5s linear infinite;}
    .ice.rime {height:7px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.85) 0 1px,transparent 1px 4px),linear-gradient(0deg,rgba(240,248,255,.8),rgba(240,248,255,0));
      -webkit-mask-image:linear-gradient(0deg,#000,transparent);mask-image:linear-gradient(0deg,#000,transparent);}
    .ice i {position:absolute;bottom:2px;left:var(--x);width:3px;height:3px;rotate:45deg;background:#fff;box-shadow:0 0 5px 1px #e6f6ff;animation:twinkle 3s ease-in-out var(--dl) infinite;}
    /* Averses: the shower passes, stops, comes back (14 s). */
    .burst {position:absolute;inset:0;animation:burst 14s ease-in-out infinite;}
    /* Risque d'orages: no bolt, only a faint glow inside the clouds now and then. */
    .detail-storm-risk .flash {animation-name:distant-flash;animation-duration:9s;}
    /* Neige forte: bigger flakes, falling slantwise. */
    .detail-heavy-snow .snow {animation-name:snow-heavy;}.detail-heavy-snow .snow::before {scale:1.15;}
    /* Strong wind: rain and snow driven sideways. */
    .gale .snow {animation-name:snow-gale;}
    .scene *, .scene *::after, .scene *::before {animation-play-state:var(--play,paused);}
    .scene[data-still] *,.scene[data-still] *::before,.scene[data-still] *::after {animation:none;}.scene[data-still] .particle {translate:0 var(--rest);}
    .scene[data-still] .snowbank {scale:1 1;}.scene[data-still] .particle.hailstone {translate:0 calc(var(--rest) * .9);}.scene[data-still] .drift {translate:0 var(--rest);}.scene[data-still] .frost-bokeh {opacity:.6;}
    .scene[data-still] .bolt.b1 {opacity:.8;}.scene[data-still] .flash {opacity:0;}.scene[data-still] .burst {opacity:1;}.scene[data-still] .wind-line {-webkit-mask-position:50% 0;mask-position:50% 0;}
    @keyframes clouds {from{translate:-24px 0;}to{translate:32px 4px;}}
    @keyframes wind-clouds {from{translate:-75px -3px;}to{translate:90px 6px;}}
    @keyframes rays {to{rotate:360deg;}}
    @keyframes halo {from{opacity:.55;scale:.94;}to{opacity:1;scale:1.06;}}
    @keyframes twinkle {0%,100%{opacity:.25;scale:.7;}50%{opacity:1;scale:1.15;}}
    @keyframes fall {from{translate:0 0;}to{translate:var(--drift) 100%;}}
    @keyframes snow {to{translate:0 100%;}}
    @keyframes snow-gale {to{translate:-140px 100%;}}
    @keyframes snow-heavy {to{translate:-55px 100%;}}
    @keyframes burst {0%,100%{opacity:0;}12%,58%{opacity:1;}70%{opacity:0;}}
    @keyframes distant-flash {0%,3%,100%{opacity:0;}.8%{opacity:.28;}1.6%{opacity:.08;}2.2%{opacity:.22;}}
    @keyframes snow-sway {from{translate:calc(var(--amp) * -1) 0;}to{translate:var(--amp) 0;}}
    @keyframes settle {to{scale:1 1;}}
    @keyframes bob {50%{translate:0 5px;}}
    @keyframes sun-glow {50%{box-shadow:0 0 90px 40px #ffb84d99;}}
    /* Hail: a fall that speeds up, the impact, a clear first bounce, a second little hop, then the stone stops and melts. */
    @keyframes hail {
      0%{translate:0 0;opacity:1;animation-timing-function:cubic-bezier(.5,0,1,1);}
      50%{translate:0 var(--ground);animation-timing-function:cubic-bezier(0,0,.4,1);}
      64%{translate:var(--dx) calc(var(--ground) - 34px);animation-timing-function:cubic-bezier(.6,0,1,1);}
      76%{translate:calc(var(--dx) * 1.7) var(--ground);animation-timing-function:cubic-bezier(0,0,.4,1);}
      83%{translate:calc(var(--dx) * 2.1) calc(var(--ground) - 11px);animation-timing-function:cubic-bezier(.6,0,1,1);}
      89%{translate:calc(var(--dx) * 2.4) var(--ground);opacity:1;}
      100%{translate:calc(var(--dx) * 2.4) var(--ground);opacity:0;}}
    @keyframes ripple {0%{opacity:.9;scale:.2;}45%{opacity:0;scale:1.1;}100%{opacity:0;scale:1.1;}}
    @keyframes spray {0%{opacity:1;translate:0 0;scale:.6 1;}18%{opacity:1;translate:0 -7px;scale:1.4 1;}34%{opacity:0;translate:0 -1px;scale:1.9 1;}100%{opacity:0;}}
    @keyframes sheen {to{background-position:-200% 0;}}
    @keyframes fog-drift {from{translate:calc(var(--dir) * -7%) 0;}to{translate:calc(var(--dir) * 7%) 6px;}}
    @keyframes fog-sun {from{opacity:.55;}to{opacity:.9;}}
    @keyframes drift-fall {from{translate:0 -8%;}to{translate:-40px 108%;}}
    @keyframes drift-gust {from{translate:60px -8%;}to{translate:-160px 108%;}}
    @keyframes sway {from{translate:-10px 0;rotate:-25deg;}to{translate:10px 0;rotate:35deg;}}
    @keyframes heat-rise {0%{translate:0 18px;opacity:0;}30%{opacity:.85;}70%{opacity:.55;}100%{translate:0 -40px;opacity:0;}}
    @keyframes heat-sway {from{transform:skewX(-9deg) scaleX(.85);}to{transform:skewX(9deg) scaleX(1.2);}}
    /* Winter, 16 s: snowflakes gather from the corner, hold while sparkles shine, then fade. */
    @keyframes flake-cycle {0%{opacity:0;transform:scale(.3) rotate(-30deg);}28%{opacity:var(--fo);transform:scale(1) rotate(0);}68%{opacity:var(--fo);transform:scale(1) rotate(10deg);}88%,100%{opacity:0;transform:scale(1.08) rotate(16deg);}}
    @keyframes bokeh-cycle {0%,100%{opacity:0;}35%,70%{opacity:.6;}}
    @keyframes spark-cycle {0%,30%,78%,100%{opacity:0;transform:scale(.4);}42%,62%{opacity:1;transform:scale(1);}52%{opacity:.4;transform:scale(.7);}}
    @keyframes wall-breathe {from{opacity:.5;}to{opacity:.75;}}
    @keyframes fog-breathe {from{opacity:calc(var(--fo) * .6);}to{opacity:var(--fo);}}
    /* The soft window slides from before the tail to past the head, while the thread drifts downwind: each loop starts and ends unseen. */
    @keyframes wind-sweep {from{-webkit-mask-position:-90% 0;mask-position:-90% 0;}to{-webkit-mask-position:190% 0;mask-position:190% 0;}}
    @keyframes wind-run {0%{translate:-6% 0;}100%{translate:14% -4px;}}
    @keyframes leaves {from{translate:-8% 10px;}35%{translate:30% -14px;}70%{translate:72% 6px;}to{translate:112% -20px;}}
    @keyframes seed-sway {from{rotate:-28deg;}to{rotate:22deg;}}
    @keyframes leaf-flutter {from{translate:0 calc(var(--lamp) * -1);}to{translate:0 var(--lamp);}}
    @keyframes leaf-spin {0%{transform:rotate(0) scaleY(1);}25%{transform:rotate(90deg) scaleY(.35);}50%{transform:rotate(180deg) scaleY(1);}75%{transform:rotate(270deg) scaleY(-.45);}100%{transform:rotate(360deg) scaleY(1);}}
    @keyframes lightning {0%,4.5%,100%{opacity:0;}.6%,1.6%{opacity:1;}2.2%{opacity:.3;}3%{opacity:1;}}
    @keyframes storm-flash {0%,4.5%,100%{opacity:0;}.6%{opacity:.7;}1.6%{opacity:.5;}2.2%{opacity:.1;}3%{opacity:.55;}}
    @container(max-width:650px) {
      /* The artwork fills the whole card height: leaves, rain and snow fall to the bottom on every format. */
      .weather-art {display:block;position:absolute;top:0;right:0;width:100%;height:100%;overflow:hidden;}
      /* Small cards: the clouds stand at several heights, the farthest lowest and palest, down the card as it grows:
         a sky with depth rather than one band along the top (9 November, « écrasé en haut de la carte »). Storm banks no longer start above the edge. */
      .cloud.heavy-left {left:auto;right:30%;top:-8px;width:290px;}.cloud.heavy-right {left:auto;right:-24%;top:clamp(26px,9%,80px);width:300px;}
      /* Small cards: what the weather carries is drawn larger, so it still reads at a glance. */
      .petal {width:20px;height:20px;}.plane {width:34px;height:34px;}.moon {width:72px;height:72px;}
      .leaf {width:28px;height:20px;}.leaf.k-dry {width:24px;height:17px;}.leaf.k-plane {width:36px;height:36px;}.leaf.k-petal {width:17px;height:17px;}.leaf.k-seed {width:25px;height:32px;}
      .orb {left:var(--nw-orb-x,auto);right:12%;top:var(--nw-orb-y,36px);}.cloud.back {left:auto;right:20%;top:6px;width:235px;}.cloud.front {left:auto;right:-4%;top:clamp(100px,24%,210px);width:210px;}.cloud.small {left:auto;right:-16%;top:clamp(0px,7%,60px);width:165px;}
      .closed-sky .cloud.back {right:8%;top:clamp(150px,36%,300px);width:200px;opacity:.5;}
      .bolt.b1 {left:auto;right:18%;}.bolt.b2 {left:auto;right:2%;}.bolt.b3 {left:auto;right:42%;}
      .flash.f1 {--fx:70%;}.flash.f2 {--fx:94%;}.flash.f3 {--fx:48%;}
      .fog-sun {left:auto;right:14%;}
      .frost-pane {width:70%;height:150px;}
    }
    @media(prefers-reduced-motion:reduce) {.scene *,.scene *::before,.scene *::after{animation:none!important;}.snowbank{scale:1 1;}.particle{translate:0 var(--rest);}.drift{top:var(--rest);}.frost-bokeh{opacity:.6;}.bolt.b1{opacity:.8;}.flash{opacity:0;}.burst{opacity:1;}.wind-line{-webkit-mask-position:50% 0;mask-position:50% 0;}}
  `;
}
