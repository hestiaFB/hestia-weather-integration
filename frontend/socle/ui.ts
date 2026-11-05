// Shared Hestia interface, embedded independently in each brick.
// Since socle 1.22 a brick's pages take these pieces from the newest copy loaded on the page (hub.ts): a piece or an option
// is only ever added, never renamed or removed while a published brick still uses it.
import {LitElement,html,css,nothing,type TemplateResult,type PropertyValues} from 'lit';
import {ref} from 'lit/directives/ref.js';
import {t} from './i18n';
// This very module, to publish it whole (end of file).
import * as self from './ui';
export {t,fr,setLanguage,addDictionary,currentLanguage,currentLocale} from './i18n';

// This copy's socle: the same version as socle.py, and the build copier.sh writes when the socle changes.
export const SOCLE:readonly [number,number]=[1,22];
export const SOCLE_BUILD='20261105.1407';
// Newer or equal: the version first, then the build. Another major version is never mixed in.
export const sameOrNewer=(a:{SOCLE:readonly number[];SOCLE_BUILD:string},b:{SOCLE:readonly number[];SOCLE_BUILD:string})=>
 a.SOCLE[0]===b.SOCLE[0]&&(a.SOCLE[1]!==b.SOCLE[1]?a.SOCLE[1]>b.SOCLE[1]:a.SOCLE_BUILD>=b.SOCLE_BUILD);

// Popovers live in the browser top layer, so help escapes scrolling panels.
class HestiaHelp extends LitElement {
 static properties={label:{type:String},content:{attribute:false},trigger:{type:String},opened:{state:true}};
 declare trigger:string;declare label:string;declare content:unknown;declare opened:boolean;
 private onViewportChange=(e:Event)=>{const pop=this.renderRoot.querySelector('[popover]');if(this.opened&&!(e.target instanceof Node&&pop?.contains(e.target)))this.close();};
 connectedCallback(){super.connectedCallback();window.addEventListener('scroll',this.onViewportChange,true);window.addEventListener('resize',this.onViewportChange);}
 private pinned=false;private timer?:ReturnType<typeof setTimeout>;
 constructor(){super();this.label=t('Aide');this.trigger=t('Aide');this.opened=false;}
 disconnectedCallback(){super.disconnectedCallback();window.removeEventListener('scroll',this.onViewportChange,true);window.removeEventListener('resize',this.onViewportChange);clearTimeout(this.timer);this.pinned=false;this.opened=false;}
 private async show(){
  clearTimeout(this.timer);this.opened=true;await this.updateComplete;
  if(!this.isConnected||!this.opened)return;
  const pop=this.renderRoot.querySelector<HTMLElement>('[popover]')!;
  if(!pop.matches(':popover-open'))pop.showPopover();
  this.place();
 }
 private place(){
  const button=this.renderRoot.querySelector('button')!,pop=this.renderRoot.querySelector<HTMLElement>('[popover]')!;
  const r=button.getBoundingClientRect(),size=pop.getBoundingClientRect();
  const left=Math.max(12,Math.min(r.right-size.width,window.innerWidth-size.width-12));
  const top=r.bottom+8+size.height<=window.innerHeight-12?r.bottom+8:Math.max(12,r.top-size.height-8);
  pop.style.left=left+'px';pop.style.top=top+'px';
 }
 private close(){clearTimeout(this.timer);this.pinned=false;this.opened=false;const pop=this.renderRoot.querySelector<HTMLElement>('[popover]');if(pop?.matches(':popover-open'))pop.hidePopover();}
 private leave(){if(!this.pinned)this.timer=setTimeout(()=>this.close(),160);}
 // The page draws its help again at each Home Assistant update, a new content each time: an open help stays open and is
 // only placed again (Frank, 5 November: every help of the hub closed at once, on hover as on a click).
 protected updated(changed:PropertyValues){if(changed.has('content')&&this.opened)this.place();}
 protected render(){return html`<button class="help-button" type="button" aria-label=${t('Aide : {label}',{label:this.label})} aria-expanded=${String(this.opened)} aria-controls="help-content" aria-describedby=${this.opened?'help-content':nothing}
  @pointerenter=${(e:PointerEvent)=>{if(e.pointerType==='mouse')void this.show();}} @pointerleave=${()=>this.leave()}
  @click=${()=>{if(this.pinned)this.close();else{this.pinned=true;void this.show();}}}
  @keydown=${(e:KeyboardEvent)=>{if(e.key==='Escape')this.close();}}>
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg>${this.trigger?html`<span>${this.trigger}</span>`:nothing}</button>
  <div id="help-content" popover="auto" role="tooltip" @toggle=${(e:Event)=>{const on=(e as ToggleEvent).newState==='open';if(this.opened!==on)this.opened=on;if(!on)this.pinned=false;}}
   @pointerenter=${()=>clearTimeout(this.timer)} @pointerleave=${()=>this.leave()} @keydown=${(e:KeyboardEvent)=>{if(e.key==='Escape')this.close();}}>
   <div class="help-head"><strong>${this.label}</strong><button type="button" aria-label=${t('Fermer l’aide')} @click=${()=>this.close()}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
   <div class="help-content">${this.content}</div></div>`;}
 static styles=css`
  :host{display:inline-flex;vertical-align:middle;flex-shrink:0;color:var(--secondary-text-color,#bdc5d1);font:inherit;font-size:var(--nw-fs-small,12px);line-height:1.6}
  *{box-sizing:border-box}button{display:inline-flex;justify-content:center;align-items:center;min-width:44px;min-height:44px;padding:8px 10px;gap:6px;font:inherit;cursor:pointer;border:0;border-radius:8px;background:transparent;color:inherit}
  .help-button{color:var(--nk-help-accent,#a1c9e8);text-align:left}.help-button svg{width:16px;height:16px;flex-shrink:0}button span{text-decoration:none}
  @media(hover:hover) and (pointer:fine){button:hover{background:color-mix(in srgb,currentColor 10%,transparent)}}button[aria-expanded=true]{color:var(--nk-help-accent,#a1c9e8);background:color-mix(in srgb,currentColor 10%,transparent)}
  :focus-visible{outline:2px solid var(--nk-help-accent,#a1c9e8);outline-offset:2px}
  [popover]{position:fixed;inset:auto;margin:0;width:min(360px,calc(100vw - 24px));max-height:min(440px,calc(100dvh - 24px));overflow:auto;padding:16px 18px;color:var(--primary-text-color,#edf1f7);background:var(--ha-card-background,var(--card-background-color,#222932));border:1px solid var(--nk-border,var(--divider-color,#657386));border-radius:22px;box-shadow:0 8px 28px #0003}
  .help-head{display:flex;align-items:center;gap:8px;font-size:var(--nw-fs-text,14px)}.help-head strong{flex:1}.help-head button{margin:-8px -10px -8px 0;flex-shrink:0}
  .help-content{margin-top:10px}.help-content p{margin:8px 0}.help-content p:first-child{margin-top:0}.help-content p:last-child{margin-bottom:0}.help-content ul{margin:0;padding-left:18px}.help-content li+li{margin-top:8px}
  a{color:var(--nk-help-accent,#a1c9e8);text-underline-offset:3px}
 `;
}
if(!customElements.get('hestia-hub-help-v1'))customElements.define('hestia-hub-help-v1',HestiaHelp);
export function helpTip(label:string,content:unknown,trigger=t('Aide')){return html`<hestia-hub-help-v1 .label=${label} .content=${content} .trigger=${trigger}></hestia-hub-help-v1>`;}
export function defaultValue(value:string,onReset:()=>void,explanation:unknown,options:{applied:boolean;disabled?:boolean;note?:string}):TemplateResult {
 // Nothing useless on screen (ECOSYSTEME.md § 8): no « Valeur appliquée » when it is, no « Pourquoi » without a source to give.
 const reset=options.disabled?html`<button type="button" class="nk-reset" disabled>${t('Choisissez un capteur')}</button>`
  :options.applied?nothing:html`<button type="button" class="nk-reset" @click=${onReset}>${t('Rétablir la valeur par défaut')}</button>`;
 const why=explanation===undefined||explanation===null||explanation===nothing||explanation===''?nothing:helpTip(t('Comprendre la valeur par défaut'),explanation,t('Pourquoi cette valeur ?'));
 return html`<div class="nk-default"><div class="nk-default-value"><span>${t('Valeur par défaut')}</span><strong>${value}</strong>${options.note?html`<p>${options.note}</p>`:nothing}</div>
  ${reset===nothing&&why===nothing?nothing:html`<div class="nk-default-actions">${reset}${why}</div>`}</div>`;
}
export function frame(title:string,body:unknown,options:{count?:string|number;open?:boolean;className?:string;collapsible?:boolean;help?:unknown}={}):TemplateResult {
 const count=options.count===undefined?nothing:html`<span class="nk-count">${options.count}</span>`;
 if(options.collapsible)return html`<details class=${'nk-section '+(options.className??'')} ?open=${options.open!==false}>
  <summary><span class="nk-title">${title}</span>${count}</summary><div class="nk-body">${body}</div></details>`;
 return html`<section class=${'nk-section '+(options.className??'')}><div class="nk-section-head"><h2 class="nk-title">${title}</h2>${count}${options.help?helpTip(title,options.help):nothing}</div><div class="nk-body">${body}</div></section>`;
}
export const hubStyles=css`
 :host{--nk-help-accent:#a1c9e8;--nk-space-tight:8px;--nk-space-section:24px}
 :host([data-theme=light]){--nk-help-accent:#285f87}
 /* Purple means "something to read" only, so it keeps these values with the HA appearance too. */
 :host{--nk-note:#c7a6ef;--nk-note-bg:rgba(199,166,239,.10)}
 :host([data-theme=light]){--nk-note:#7a4bb5;--nk-note-bg:rgba(122,75,181,.08)}

 :host{--nk-accent:var(--primary-color,#a1c9e8);--nk-border:var(--divider-color,#657386);--nk-muted:var(--secondary-text-color,#bdc5d1);--nk-surface:var(--ha-card-background,var(--card-background-color,#222932));--nk-radius:16px;--nk-gap:16px}
 main{max-width:1120px;width:100%;padding:32px 28px 64px}
 h1,h2,h3,.nk-title{overflow-wrap:anywhere}h1{line-height:1.25;margin:0 0 8px}p{max-width:none}
 .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
 .nk-section{display:block;align-self:start;min-width:0;background:var(--nk-surface);border:1px solid var(--nk-border);border-radius:var(--nk-radius);margin:16px 0;overflow-wrap:anywhere}
 .nk-section>summary{list-style:none;display:flex;align-items:center;gap:12px;min-height:56px;padding:14px 18px;cursor:pointer;font-size:var(--nw-fs-title,17px);font-weight:600;line-height:1.4}
 .nk-section>summary::-webkit-details-marker{display:none}
 .nk-section>summary:before,.group>summary:before{content:'';width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);flex-shrink:0;margin-right:4px;color:var(--nk-muted)}
 .nk-section[open]>summary:before,.group[open]>summary:before{transform:rotate(45deg)}
 .nk-section[open]>summary{border-bottom:1px solid var(--nk-border)}
 .nk-title{flex:1;min-width:0}.nk-section-head{display:flex;align-items:center;gap:12px;padding:16px 20px 0;min-height:44px}.nk-section-head .nk-title{font-size:var(--nw-fs-title,17px);font-weight:600;line-height:1.4;margin:0}.nk-section-head+ .nk-body{padding-top:12px}.nk-count{color:var(--nk-muted);font-size:var(--nw-fs-text,14px);font-weight:400;flex-shrink:0;font-variant-numeric:tabular-nums}
 .nk-body{padding:18px 20px 20px}.nk-body>:first-child{margin-top:0}.nk-body>:last-child{margin-bottom:0}
 .nk-body>.field:first-child{border-top:0}.nk-section.wide{grid-column:1/-1}
 .nk-section.todo{border-color:color-mix(in srgb,var(--warning-color,#f2a65a) 55%,var(--nk-border))}
 .hl-grid,.grid{gap:var(--nk-gap);align-items:start}.hl-grid>.nk-section,.grid>.nk-section{margin:0}
 .field:not(.nk-body .field),.room,.start,.searched{background:var(--nk-surface);border:1px solid var(--nk-border);border-radius:var(--nk-radius);padding:18px;margin:16px 0;min-width:0}
 .nk-body>.field{border-radius:0;background:transparent;margin:0;padding:18px 0;border:0;border-top:1px solid var(--nk-border)}
 .field>h2,.start>h2{margin-top:0}
 .intro,.group{background:var(--nk-surface);border:1px solid var(--nk-border);border-radius:var(--nk-radius);padding:0 16px;margin:16px 0}
 .intro>summary{cursor:pointer;list-style:none;min-height:44px;display:flex;align-items:center;font-weight:600}
 .intro>summary::-webkit-details-marker{display:none}
 .group{min-width:0}.group>summary{display:flex;justify-content:space-between;align-items:center;min-height:56px;font-size:var(--nw-fs-title,17px)}
 .group>.field{border:0;border-top:1px solid var(--nk-border);background:transparent;border-radius:0;padding:18px 0;margin:0}.group>.field:first-of-type{border-top:0}
 .group[open]>summary{border-bottom:1px solid var(--nk-border)}.group[open]{padding-bottom:4px}.group p{max-width:none}
 .intro ul{margin:0 0 14px;padding-left:1.2em;list-style:none}.intro li{max-width:none;margin:4px 0}.group>summary{list-style:none;gap:12px}.group>summary strong{flex:1;min-width:0}.group>summary strong:before{display:none}
 .group>summary .hint{white-space:normal;text-align:right}.group>summary:before{display:block}
 .opening>.group{grid-column:1/-1}.opening>*{min-width:0}
 .room>div,.candidate>div,.source>span,.choice>span,.other>div{min-width:0}
 .hl-table{overscroll-behavior-x:contain;scrollbar-width:thin}.hl-table:focus-visible{outline:3px solid var(--nk-accent);outline-offset:3px}
 .hl-table table{font-variant-numeric:tabular-nums}
 .hl-go,.hl-table th button.link,.lines .go{min-height:44px;white-space:normal}
 .state{flex-wrap:wrap}.free label{min-width:min(220px,100%)}
 button,a.button{max-width:100%;overflow-wrap:anywhere}input,select{min-width:0}
 .intro[open]>summary{border-bottom:1px solid var(--nk-border);margin-bottom:12px}
 ::selection{background:var(--primary-color,#285f87);color:var(--text-primary-color,#fff)}input{caret-color:var(--nk-accent)}
 :host{scrollbar-width:thin;scrollbar-color:var(--nk-border) transparent}

 main>h1,.hl-head h1,.head h1{font-size:var(--nw-fs-case,21px);font-weight:650;letter-spacing:-.02em}
 .nk-step-help{display:flex;align-items:center;gap:4px;color:var(--nk-muted);font-size:var(--nw-fs-text,14px);margin:-4px 0 18px}
 .nk-step-help hestia-hub-help-v1{margin-left:-10px}
 .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 10px;overflow:visible;padding:0;margin:20px 0 16px}
 .steps button{width:100%;min-width:0;max-width:none;min-height:48px;display:flex;gap:8px;align-items:center;border-radius:10px;border:1px solid transparent;padding:10px 12px;text-align:left;white-space:normal;line-height:1.4}
 .steps button[aria-current=step]{border:1px solid color-mix(in srgb,var(--nk-help-accent) 40%,var(--nk-border));border-radius:10px;background:color-mix(in srgb,var(--nk-help-accent) 9%,var(--nk-surface));color:var(--primary-text-color,#edf1f7)}
 .nk-step-index{display:inline-flex;align-items:center;justify-content:center;font-size:var(--nw-fs-small,12px);font-weight:600;width:22px;height:22px;border:1px solid var(--nk-border);border-radius:6px;flex-shrink:0}
 .steps [aria-current=step] .nk-step-index{color:var(--nk-help-accent);border-color:currentColor}
 .nk-home-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin:4px 0 28px}.nk-home-head h1{font-size:var(--nw-fs-case,21px);letter-spacing:-.025em;margin:0 0 8px}.nk-home-head p{margin:0;color:var(--nk-muted);font-size:var(--nw-fs-text,14px)}
 .nk-bricks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-bottom:28px}.nk-bricks>.nk-section{margin:0}
 .nk-bricks .nk-section-head{padding-top:22px}.nk-bricks .nk-title{font-size:var(--nw-fs-title,17px)}
 .nk-bricks .nk-body{padding-top:20px}.nk-bricks .version{font-size:var(--nw-fs-small,12px);margin:0 0 14px}.nk-bricks .level{align-items:flex-start;font-size:var(--nw-fs-text,14px);line-height:1.5}.nk-bricks .dot{margin-top:6px;align-self:flex-start}
 .nk-bricks .summary{margin:0}.nk-bricks .primary{margin-top:18px}.nk-bricks ul{color:var(--nk-muted);font-size:var(--nw-fs-text,14px)}
 .nk-count{font-size:var(--nw-fs-small,12px);font-weight:500;border:1px solid var(--nk-border);border-radius:6px;padding:3px 8px;line-height:1.5}
 .hl-head,.head{margin-bottom:20px}.hl-state,.state{font-size:var(--nw-fs-text,14px);line-height:1.6}.hl-legend,.legend{gap:16px;margin:0 0 24px}
 .hl-grid>.nk-section.wide,.grid>.nk-section.wide{margin:0}
 .nk-section .nk-section{background:transparent;border-radius:10px}.nk-section .nk-section-head{padding-top:12px}
 .bottom{padding-top:20px;margin-top:28px}.bottom button.primary{min-width:150px}
 .sensor-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;border-top:1px solid var(--nk-border);padding-top:16px;margin-top:18px}
 .sensor-settings>h4,.sensor-settings>p,.sensor-settings>button,.sensor-settings>hestia-hub-help-v1{grid-column:1/-1}
 .sensor-settings>h4{margin:0;font-size:var(--nw-fs-text,14px);font-weight:600}.sensor-settings>label{min-width:0;margin:0}.sensor-settings>button{justify-self:start}.sensor-settings>hestia-hub-help-v1{justify-self:start}
 .nk-default{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:14px 16px;margin-top:4px;border-radius:10px;background:var(--nk-surface);border:1px solid var(--nk-border)}
 .nk-default-value{display:flex;gap:6px 12px;align-items:baseline;flex-wrap:wrap;min-width:0}.nk-default-value>span{font-size:var(--nw-fs-small,12px);color:var(--nk-muted)}.nk-default-value>strong{font-size:var(--nw-fs-text,14px);font-weight:600}.nk-default-value p{flex-basis:100%;font-size:var(--nw-fs-small,12px);color:var(--nk-muted);margin:0}
 .nk-default-actions{display:flex;align-items:center;gap:4px 12px;flex-wrap:wrap}.nk-default-actions .nk-reset{font-size:var(--nw-fs-text,14px);padding:8px 12px;min-height:40px;border-radius:8px;border:1px solid var(--nk-border);background:transparent}.nk-default-actions .nk-reset:disabled{opacity:1;color:var(--nk-muted);border-color:transparent;cursor:default}
 section.nk-section.nk-plain{border:0;border-radius:0;background:transparent;border-bottom:1px solid var(--nk-border);padding:0 0 24px;margin:24px 0}
 .nk-section.nk-plain>.nk-section-head{padding:0;gap:10px;flex-wrap:wrap}.nk-section.nk-plain>.nk-body{padding:8px 0 0}.nk-plain .nk-title{font-size:var(--nw-fs-title,17px)}.nk-plain .sensor-settings{border-top:0;margin-top:14px;padding-top:0}
 .field:not(.nk-body .field){border:0;border-bottom:1px solid var(--nk-border);border-radius:0;background:transparent;padding:22px 0;margin:0}
 .source,.choice{border-radius:10px}.field{border-radius:12px}
 @media(max-width:760px){.steps{grid-template-columns:repeat(2,minmax(0,1fr))}.steps button{font-size:var(--nw-fs-text,14px);padding:8px}.nk-default{padding:12px;gap:8px}.nk-default-actions{gap:4px}.nk-default-actions .nk-reset{min-height:44px}.nk-bricks{grid-template-columns:1fr}.nk-home-head{display:block}.nk-home-head h1{font-size:var(--nw-fs-case,21px)}}
 @media(max-width:600px){main{padding:24px 16px 48px}.nk-section>summary{padding:14px;font-size:var(--nw-fs-title,17px)}.nk-body{padding:14px}.room{flex-wrap:wrap}.room button{min-height:44px}.nk-count{max-width:42%;text-align:right}.hl-state{align-items:flex-start}}
`;

// Shared visual language approved for the whole hub. Semantic statuses stay blue/orange.
export const modernStyles=css`
 :host{color-scheme:dark;--primary-background-color:#1b1c1e;--card-background-color:#1b1c1e;--ha-card-background:#1b1c1e;--primary-text-color:#eeece8;--secondary-text-color:#b2aea7;--divider-color:#3b3c3f;--nk-selected:#303133;--nk-raised:#232426;--nk-button:#ebe8e1;--nk-on-button:#202122;--nk-help-accent:#a6c8d7;--nk-accent:#a6c8d7;--nk-todo:#e2b777;--error-color:#f1a59b;--warning-color:#e2b777;--nk-action-bg:#ebe8e1;--nk-ok:#a6c8d7;--nk-radius:25px;--nk-border:var(--divider-color);--nk-muted:var(--secondary-text-color);--nk-surface:var(--card-background-color);--nc-accent:var(--nk-accent);--nc-todo:var(--nk-todo);--nc-border:var(--nk-border);--nc-muted:var(--nk-muted);--nc-surface:var(--nk-surface);--nc-frame:var(--nk-surface);--nc-action-bg:var(--nk-button);--nw-accent:var(--nk-accent);--nw-todo:var(--nk-todo);--nw-border:var(--nk-border);--nw-muted:var(--nk-muted);--nw-surface:var(--nk-surface);--nw-frame:var(--nk-surface);--nw-action-bg:var(--nk-button);color:var(--primary-text-color);background:var(--primary-background-color);font:400 var(--nw-fs-text,14px)/1.65 Manrope,system-ui,sans-serif;scrollbar-width:thin}
 :host([data-theme=light]){color-scheme:light;--primary-background-color:#faf9f7;--card-background-color:#faf9f7;--ha-card-background:#faf9f7;--primary-text-color:#242321;--secondary-text-color:#75716b;--divider-color:#e2dfd9;--nk-selected:#eeece8;--nk-raised:#fff;--nk-button:#272623;--nk-on-button:#fff;--nk-help-accent:#36677d;--nk-accent:#36677d;--nk-todo:#966528;--nk-ok:#36677d;--error-color:#ae3e32;--warning-color:#966528;--nc-accent:#36677d;--nc-todo:#966528;--nw-accent:#36677d;--nw-todo:#966528}
 *{box-sizing:border-box}main{max-width:940px;width:100%;margin:0 auto;padding:54px 48px 64px}h1,main>h1,.hl-head h1,.head h1{font-size:var(--nw-fs-case,21px);font-weight:650;letter-spacing:-.035em;line-height:1.3;margin:0 0 10px}h2{font-size:var(--nw-fs-title,17px);letter-spacing:-.02em}h3{font-size:var(--nw-fs-text,14px)}p{max-width:none}.hint,.muted,.provenance{font-size:var(--nw-fs-small,12px)}button,input,select,.button{font:inherit;min-height:44px;border:1px solid var(--nk-border);border-radius:24px;padding:10px 17px;color:inherit;background:transparent}button,.button{cursor:pointer;line-height:1.5;touch-action:manipulation}input,select{width:100%;border-radius:15px;background:var(--nk-surface);margin-top:8px;padding:11px 14px}input[type=checkbox],input[type=radio]{width:19px;height:19px;min-height:19px;border-radius:4px;padding:0;accent-color:var(--nk-accent)}input[type=checkbox]:focus-visible,input[type=radio]:focus-visible{outline-offset:4px}@media(hover:hover) and (pointer:fine){button:hover,.button:hover{background:var(--nk-selected)}}button.primary,.button.primary{background:var(--nk-button);color:var(--nk-on-button);border-color:var(--nk-button);font-weight:500}@media(hover:hover) and (pointer:fine){.primary:hover{filter:brightness(.9)}}button.link{border:0;color:var(--nk-muted);background:transparent}@media(hover:hover) and (pointer:fine){button.link:hover{color:var(--primary-text-color);text-decoration:underline}}button:disabled{cursor:default;opacity:.5}a{color:var(--nk-accent)}:focus-visible{outline:2px solid var(--nk-accent);outline-offset:3px}
 .nk-section{border-radius:25px;background:transparent;margin:24px 0}.nk-section-head{padding:24px 25px 0;gap:12px}.nk-section-head .nk-title{font-size:var(--nw-fs-title,17px)}.nk-body{padding:20px 25px 25px}.nk-section>summary{padding:18px 24px;font-size:var(--nw-fs-text,14px)}.nk-count{border:0;background:var(--nk-selected);border-radius:18px;font-size:var(--nw-fs-label,11px);padding:3px 10px}.nk-bricks{gap:20px}.nk-home-head{margin-bottom:32px}.nk-home-head h1{font-size:var(--nw-fs-case,21px)}.nk-home-head p{font-size:var(--nw-fs-text,14px)}.nk-bricks .nk-title{font-size:var(--nw-fs-title,17px)}.nk-bricks .summary{font-size:var(--nw-fs-text,14px)}
 section.nk-section.nk-field-section.nk-plain{border:1px solid var(--nk-border);border-radius:25px;background:var(--nk-surface);padding:24px;margin:20px 0}section.nk-section.nk-field-section.nk-plain>.nk-section-head{padding:0;flex-wrap:wrap}section.nk-section.nk-field-section.nk-plain>.nk-body{padding:14px 0 0}section.nk-section.nk-field-section.nk-plain .nk-title{font-size:var(--nw-fs-title,17px)}.nk-field-section .sensor-settings{border-top:1px solid var(--nk-border);margin-top:20px;padding-top:18px}.sensor-settings{gap:16px}.sensor-settings>p.hint{grid-column:1/-1}.sensor-settings label{font-size:var(--nw-fs-small,12px);font-weight:500}.sensor-settings h4{font-size:var(--nw-fs-text,14px)}.nk-default{border:0;border-top:1px solid var(--nk-border);border-radius:0;padding:16px 0 0;background:transparent;gap:6px 14px}.nk-default-value>span,.nk-default-value>strong{font-size:var(--nw-fs-small,12px)}.nk-default-actions .nk-reset{border-radius:20px;min-height:44px;font-size:var(--nw-fs-small,12px)}.nk-default-actions{gap:4px}
 .chosen .choice,.choice.on,.source.on{border-color:color-mix(in srgb,var(--nk-accent) 45%,var(--nk-border));background:color-mix(in srgb,var(--nk-accent) 5%,var(--nk-surface))}.choice,.source{border-radius:18px;padding:15px 17px}.choice strong,.source strong{font-size:var(--nw-fs-text,14px)}.candidate{padding:14px 0}.candidate button{font-size:var(--nw-fs-text,14px)}.candidates{border:0}.field:not(.nk-body .field){padding:22px 0;border-bottom:1px solid var(--nk-border)}.field-top h3{font-size:var(--nw-fs-text,14px)}.field-top{align-items:center}.nk-step-help{margin:4px 0 18px}.nk-step-help hestia-hub-help-v1{margin-left:-10px}.step-count{font-size:var(--nw-fs-small,12px);margin-bottom:24px}.group{border-radius:20px}.group>summary{font-size:var(--nw-fs-text,14px)}.notice{border-radius:18px;font-size:var(--nw-fs-text,14px)}.room,.start{border-radius:24px;padding:22px 24px;margin:16px 0}.room{display:flex;align-items:center;justify-content:space-between;gap:18px}.room h3{margin:0}.room p{margin:4px 0}.room button{font-size:var(--nw-fs-text,14px)}.room-list{margin:24px 0 32px}.bottom{border-top:1px solid var(--nk-border);margin-top:30px;padding-top:22px}.bottom .primary{min-width:120px}.health-details{margin-top:32px}.health-details>summary{min-height:44px;cursor:pointer;font-size:var(--nw-fs-text,14px);color:var(--nk-muted)}
 .room-menu{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin:0 0 30px}.room-menu-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:5px;background:var(--nk-selected);border-radius:999px;width:100%}.room-menu button{display:flex;justify-content:center;align-items:center;gap:8px;min-width:0;min-height:44px;width:100%;padding:9px 12px;font-size:var(--nw-fs-text,14px);line-height:1.4;border:1px solid transparent;border-radius:999px;color:var(--nk-muted);background:transparent}.room-menu button svg{width:17px;height:17px;flex-shrink:0}@media(hover:hover) and (pointer:fine){.room-menu button:hover{background:color-mix(in srgb,var(--nk-surface) 50%,transparent);color:var(--primary-text-color)}}.room-menu button[aria-current=page]{color:var(--primary-text-color);background:var(--nk-surface);border-color:color-mix(in srgb,var(--nk-border) 55%,transparent);box-shadow:0 1px 4px #0000000a;font-weight:600}.room-content-head{margin-bottom:25px}.room-content-head h2{font-size:var(--nw-fs-case,21px);margin:0 0 7px}.room-content-head p{font-size:var(--nw-fs-text,14px);color:var(--nk-muted);margin:0}.workspace-head{margin-bottom:25px}

 /* In HA mode, inherit Home Assistant colors and typography. */
 :host([data-appearance=ha]),:host([data-appearance=ha][data-theme=light]){--primary-background-color:inherit;--card-background-color:inherit;--ha-card-background:inherit;--primary-text-color:inherit;--secondary-text-color:inherit;--divider-color:inherit;--error-color:inherit;--warning-color:inherit;--nk-selected:var(--secondary-background-color,var(--card-background-color));--nk-raised:var(--card-background-color);--nk-button:var(--primary-color,#03a9f4);--nk-on-button:var(--text-primary-color,#fff);--nk-help-accent:var(--primary-color,#03a9f4);--nk-accent:var(--primary-color,#03a9f4);--nk-ok:var(--primary-color,#03a9f4);--nk-todo:var(--warning-color,#ff9800);--nk-action-bg:var(--nk-button);--nc-accent:var(--nk-accent);--nc-todo:var(--nk-todo);--nw-accent:var(--nk-accent);--nw-todo:var(--nk-todo);font-family:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,system-ui,sans-serif))}

 /* Some HA themes deliberately make divider-color equal the page background (Nordic),
    so it cannot describe a structural outline. Derive Hestia's outlines from the theme's
    text and card surface instead, and give frames that same card surface. */
 :host([data-appearance=ha]){--nk-surface:var(--ha-card-background,var(--card-background-color,#222932));--nk-border:color-mix(in srgb,var(--primary-text-color,#edf1f7) 22%,var(--nk-surface))}
 :host([data-appearance=ha]) .nk-section{background:var(--nk-surface)}

 .nk-body>.field.nk-setting-row{border:0;border-top:1px solid var(--nk-border);margin:0;padding:18px 0;background:transparent;border-radius:0}.nk-body>.field.nk-setting-row:first-child{border-top:0;padding-top:0}.nk-body>.field.nk-setting-row:last-child{padding-bottom:0}.nk-setting-row .field-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.nk-setting-row .field-top h3{flex:1;min-width:120px;font-size:var(--nw-fs-text,14px);margin:0}.nk-setting-row .field-top>span{font-size:var(--nw-fs-small,12px);color:var(--nk-muted)}.nk-setting-row .field-top hestia-hub-help-v1{flex-shrink:0}.nk-setting-row input,.nk-setting-row select{margin-top:8px}.nk-setting-row .provenance{margin:7px 0 0}.nk-setting-row .warn{margin-top:8px}
 section.nk-section.nk-setting-section.nk-plain{margin:0;padding:18px 0;border:0;border-top:1px solid var(--nk-border);border-radius:0;background:transparent}section.nk-setting-section.nk-plain:first-child{border-top:0;padding-top:0}section.nk-setting-section.nk-plain:last-child{padding-bottom:0}section.nk-setting-section.nk-plain>.nk-section-head{padding:0}section.nk-setting-section.nk-plain>.nk-body{padding:10px 0 0}section.nk-setting-section .nk-title{font-size:var(--nw-fs-text,14px)}
 @media(max-width:760px){main{padding:30px 22px 48px}.room-menu{align-items:stretch;gap:7px;margin-bottom:26px}.room-menu-row{width:100%;padding:4px;gap:3px;border-radius:25px}.room-menu button{flex-direction:column;gap:5px;min-height:61px;padding:8px 4px;border-radius:21px;font-size:var(--nw-fs-small,12px)}.room-menu button svg{width:16px;height:16px}.room-content-head h2{font-size:var(--nw-fs-case,21px)}.nk-bricks{grid-template-columns:1fr}}
 @media(max-width:480px){main{padding:26px 18px 48px}h1,main>h1,.hl-head h1,.head h1{font-size:var(--nw-fs-case,21px)}section.nk-section.nk-field-section.nk-plain,.nk-body,.room,.start{padding:18px}.nk-section-head{padding:20px 18px 0}.sensor-settings{grid-template-columns:1fr}.nk-default{align-items:flex-start}.room{flex-wrap:wrap}.room>div{flex:1;min-width:140px}.nk-section>summary{padding:16px}.bottom{flex-wrap:wrap}.hl-lines li,.lines li{flex-wrap:wrap}.summary.compact{grid-template-columns:1fr}}
 @media(prefers-reduced-motion:no-preference){.room-menu button{transition:background-color .15s,color .15s}}
`;
// Line icons are decorative; all controls retain visible and accessible labels.
export function hubIcon(kind:string){const paths:Record<string,string>={menu:'M4 6h16M4 12h16M4 18h16',down:'m6 9 6 6 6-6',home:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',temperature:'M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0ZM12 8v10',openings:'M5 21V3h14v18M3 21h18M14 12h1',air:'M3 8h13a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7',presence:'M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',heating:'M5 21V3M19 21V3M5 6h14M5 18h14M9 6v12M15 6v12',room:'M3 21h18M5 21V4h14v17M9 8h2M14 8h1M9 12h2M14 12h1M10 21v-5h4v5',weather:'M5 16a5 5 0 1 1 4-9 5 5 0 1 1 8 6H5M4 3l1 2M14 2v2M2 10h2',pollen:'M12 21V10M6 8a3 3 0 1 1 6-3 3 3 0 1 1 6 3 3 3 0 1 1-6 3 3 3 0 1 1-6-3ZM5 15l7 4 7-4',entities:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',review:'M4 20V10M10 20V4M16 20v-7M22 20H2',rooms:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',learning:'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',light:'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3Z',extensions:'M9 3h5v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3h6Z',info:'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM12 11v6M12 7.5v.5'};return html`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${paths[kind]??paths.settings}></path></svg>`;}

// ---- The pages every brick builds the same way (socle 1.12) ----
// Three pages per brick: its Accueil (read only), its Réglages généraux (its places or rooms, extensions, cards) and
// « Configurer » one place or room, step by step. Each brick fills these pieces; none draws its own.
export type NkLevel='ok'|'todo'|'bad'|'none';
export interface NkAction {label:string;onClick:()=>void;disabled?:boolean;primary?:boolean}
const button=(a:NkAction)=>html`<button class=${a.primary?'primary':''} ?disabled=${a.disabled} @click=${a.onClick}>${a.label}</button>`;
/** The top of every page: the way back, the title, what the page is about, its state and its one or two actions. */
export function pageHead(o:{back?:NkAction;title:string;subtitle?:unknown;state?:{level:NkLevel;text:string;detail?:string};actions?:NkAction[]}):TemplateResult{
 return html`<div class="nk-page-head">${o.back?html`<button class="link nk-back" ?disabled=${o.back.disabled} @click=${o.back.onClick}>← ${o.back.label}</button>`:nothing}
  <div class="nk-page-title"><div><h1 tabindex="-1">${o.title}</h1>${o.subtitle?html`<p class="muted">${o.subtitle}</p>`:nothing}
   ${o.state?html`<p class=${'nk-state '+o.state.level}><span class="nk-dot"></span><b>${o.state.text}</b>${o.state.detail?html`<span class="muted"> · ${o.state.detail}</span>`:nothing}</p>`:nothing}</div>
  ${o.actions?.length?html`<div class="nk-page-actions">${o.actions.map(button)}</div>`:nothing}</div></div>`;
}
export interface NkLine {level:string;text:string;why?:string|null;go?:NkAction|null}
/** One line of a list of steps or things to do: its state, what it says, why, and its one action. */
export const line=(l:NkLine)=>html`<li class=${'nk-line '+l.level}><span class="nk-dot"></span><div><strong>${l.text}</strong>${l.why?html`<span class="nk-why">${l.why}</span>`:nothing}</div>
 ${l.go?html`<button class="link nk-go" ?disabled=${l.go.disabled} @click=${l.go.onClick}>${l.go.label}</button>`:nothing}</li>`;
/** What is left to do: « À régler » first (orange), then « À améliorer »; nothing at all when everything works. */
export function todoLists(todo:NkLine[],tips:NkLine[]=[]):TemplateResult{
 const row=(l:NkLine,level?:'todo')=>listRow({label:html`<b>${l.text}</b>`,name:l.text,sub:l.why??undefined,level,go:l.go&&!l.go.disabled?l.go.onClick:undefined,value:l.go&&!l.go.disabled?undefined:nothing});
 return html`${todo.length?listSection(t('À régler'),todo.map(l=>row(l,'todo'))):nothing}${tips.length?listSection(t('À améliorer'),tips.map(l=>row(l))):nothing}`;
}
export function todoFrame(todo:NkLine[],tips:NkLine[]=[]):TemplateResult|typeof nothing{
 if(!todo.length&&!tips.length)return nothing;
 return frame(todo.length?t('À régler'):t('À améliorer'),html`${todo.length?html`<ul class="nk-lines">${todo.map(line)}</ul>`:nothing}
  ${todo.length&&tips.length?html`<h3 class="nk-sub">${t('À améliorer')}</h3>`:nothing}${tips.length?html`<ul class="nk-lines">${tips.map(line)}</ul>`:nothing}`,{className:todo.length?'todo':''});
}
export interface NkItem {name:string;note?:unknown;detail?:unknown;pill?:{text:string;level:NkLevel};edit?:NkAction}
/** « Vos lieux », « Vos pièces »: one line each, what it measures and its state; « Modifier » on the settings page. */
export function itemsFrame(o:{title:string;hint?:string;items:NkItem[];add?:NkAction;addContent?:unknown;empty?:unknown}):TemplateResult{
 return frame(o.title,html`${o.hint||o.add?html`<div class="nk-items-bar">${o.hint?html`<p class="hint">${o.hint}</p>`:nothing}${o.add?button({...o.add,primary:true}):nothing}</div>`:nothing}
  ${o.addContent??nothing}
  ${o.items.length?html`<ul class="nk-items">${o.items.map(i=>html`<li><div class="nk-item-name"><b>${i.name}</b>${i.note?html`<small class="hint">${i.note}</small>`:nothing}</div>
   <div class="nk-item-detail">${i.detail?html`<span class="hint">${i.detail}</span>`:nothing}${i.pill?html`<span class=${'nk-pill '+i.pill.level}>${i.pill.text}</span>`:nothing}</div>
   ${i.edit?html`<button class="nk-edit" ?disabled=${i.edit.disabled} aria-label=${i.edit.label+' '+i.name} @click=${i.edit.onClick}>${i.edit.label}</button>`:nothing}</li>`)}</ul>`:o.empty??nothing}`);
}
export interface NkStep {label:string;title?:string;icon:string;current:boolean;onClick:()=>void}
/** The steps of one place or room, in two rows; the last one is always « Récapitulatif ». */
export function stepMenu(label:string,steps:NkStep[],disabled=false):TemplateResult{
 const half=Math.ceil(steps.length/2);
 return html`<nav class="room-menu nk-step-menu" aria-label=${label}>${[steps.slice(0,half),steps.slice(half)].map(row=>html`<div class="room-menu-row" style=${'grid-template-columns:repeat('+row.length+',minmax(0,1fr))'}>${row.map(s=>html`<button aria-label=${s.title??s.label} title=${s.title??s.label} aria-current=${s.current?'page':nothing} ?disabled=${disabled} @click=${s.onClick}>${hubIcon(s.icon)}<span>${s.label}</span></button>`)}</div>`)}</nav>`;
}
/** The bottom of a step: back on the left, on the right « Continuer » and, for a place or room that exists, « Enregistrer ». */
export function stepFooter(o:{previous?:NkAction;next?:NkAction;save?:NkAction}):TemplateResult{
 return html`<div class="bottom nk-footer">${o.previous?button(o.previous):html`<span></span>`}<div class="nk-footer-end">${o.next?button({...o.next,primary:!o.save}):nothing}${o.save?button({...o.save,primary:true}):nothing}</div></div>`;
}
/** Leaving with changes not saved: asked once, in the page. */
export function leaveNotice(o:{onStay:()=>void;onLeave:()=>void}):TemplateResult{
 return html`<section class="notice nk-leave" role="alertdialog" aria-label=${t('Quitter sans enregistrer')}><h2>${t('Quitter sans enregistrer ?')}</h2><p>${t('Vos changements de cette page seront perdus.')}</p>
  <div class="actions"><button @click=${o.onStay}>${t('Continuer à modifier')}</button><button @click=${o.onLeave}>${t('Quitter sans enregistrer')}</button></div></section>`;
}
/** Each extension in one word (liée, installée, non installée…), linked from the brick's settings. */
export function extensionsFrame(rows:{name:string;group?:string;pill:{text:string;level:NkLevel}}[],settings?:NkAction):TemplateResult{
 const groups=[...new Set(rows.map(r=>r.group??''))];
 return frame(t('Extensions'),html`${groups.map(g=>html`${g?html`<h3 class="nk-sub">${g}</h3>`:nothing}<ul class="nk-rows">${rows.filter(r=>(r.group??'')===g).map(r=>html`<li><b>${r.name}</b><span class=${'nk-pill '+r.pill.level}>${r.pill.text}</span></li>`)}</ul>`)}
  ${settings?html`<button class="link nk-go" ?disabled=${settings.disabled} @click=${settings.onClick}>${settings.label} →</button>`:nothing}`);
}
/** Versions and the same useful links in every brick. */
export function versionsFrame(rows:[string,string][],repository:string,domain:string,support=true):TemplateResult{
 return frame(t('Versions et liens'),html`<div class="nk-meta"><ul class="nk-rows">${rows.map(([k,v])=>html`<li><b>${k}</b><span>${v}</span></li>`)}</ul>
  <nav class="nk-links" aria-label=${t('Liens utiles')}><a href=${'/config/integrations/integration/'+domain}>${t('Intégration Home Assistant')}</a><a href="/config/logs">${t('Journaux Home Assistant')}</a>
   <a href=${repository+'#readme'} target="_blank" rel="noreferrer">${t('Documentation')}</a><a href=${repository+'/releases'} target="_blank" rel="noreferrer">${t('Versions publiées')}</a>
   <a href=${repository+'/issues'} target="_blank" rel="noreferrer">${t('Signaler un problème')}</a>${support?html`<a class="nk-support" href="https://paypal.me/frankblemont" target="_blank" rel="noreferrer">${t('Soutenez mon travail')}</a>`:nothing}</nav></div>`);
}
/** « À propos », a page of every brick's menu (socle 1.22): its versions, how to add its card, and the project's links —
 *  its page on GitHub, where to report a problem, the versions published, support. The same page in every brick. */
export function aboutPage(o:{name:string;versions:[string,unknown][];repository:string;card?:string;support?:boolean}):TemplateResult{
 const link=(href:string,text:string)=>html`<a href=${href} target="_blank" rel="noreferrer">${text}</a>`;
 return html`${pageHead({title:t('À propos'),subtitle:o.name})}
  ${listSection(t('Versions'),o.versions.map(([label,value])=>listRow({label,value})))}
  ${o.card?listSection(t('Ajouter une carte'),[listRow({label:o.card})]):nothing}
  ${listSection(t('Liens'),[listRow({label:t('Page du projet'),sub:t('Présentation, documentation et nouveautés.'),value:link(o.repository,'GitHub')}),
   listRow({label:t('Signaler un problème'),value:link(o.repository+'/issues','GitHub')}),
   listRow({label:t('Versions publiées'),value:link(o.repository+'/releases','GitHub')}),
   ...(o.support===false?[]:[listRow({label:t('Soutenez mon travail'),value:link('https://paypal.me/frankblemont','PayPal')})])])}`;
}
/** One extension, the same card in every brick: what it is for, its state in one word, the one thing to do, its switches. */
export interface NkSwitch {label:string;checked:boolean;disabled?:boolean;note?:string;onChange:(on:boolean)=>void}
export function extensionCard(o:{icon:string;name:string;pill:{text:string;level:NkLevel};use:string;detail?:unknown;action?:unknown;switches?:NkSwitch[];body?:unknown;todo?:boolean}):TemplateResult{
 return html`<section class=${'nk-section ex-card'+(o.todo?' act':'')}><div class="nk-body"><div class="ex-head"><span class="ex-icon">${hubIcon(o.icon)}</span>
  <div class="ex-body"><h3>${o.name} <span class=${'nk-pill '+o.pill.level}>${o.pill.text}</span></h3><p class="hint">${o.use}</p>${o.detail?html`<p class="hint ex-detail">${o.detail}</p>`:nothing}</div>${o.action??nothing}</div>
  ${(o.switches??[]).map(sw=>html`<label class="check ex-switch"><input type="checkbox" role="switch" .checked=${sw.checked} ?disabled=${sw.disabled} @change=${(e:Event)=>sw.onChange((e.target as HTMLInputElement).checked)}>${sw.label}</label>${sw.note?html`<p class="hint ex-note">${sw.note}</p>`:nothing}`)}
  ${o.body??nothing}</div></section>`;
}
/** An integration this Home Assistant has that the brick does not read yet (socle 1.18). `use` is what the brick could do with it. */
export interface NkDetected {key:string;name:string;use:string}
/** « Demander »: the brick's GitHub form (.github/ISSUE_TEMPLATE/extension.yml), its fields filled in; the person adds how they use it. */
export const askUrl=(repository:string,o:NkDetected,brick:string,version:string)=>`${repository}/issues/new?${new URLSearchParams({template:'extension.yml',
 title:t('Lire l’extension {name}',{name:o.name}),extension:`${o.name} (${o.key})`,idea:o.use,version:`${brick} ${version}`})}`;
/** « Détectées, pas encore lues par … »: found in Home Assistant, each with « Demander »; nothing at all when there is none. */
export function detectedFrame(o:{brick:string;repository:string;version:string;rows:NkDetected[]}):TemplateResult|typeof nothing{
 if(!o.rows.length)return nothing;
 return html`<h2 class="ex-sec">${t('Détectées, pas encore lues par {brick}',{brick:o.brick})}</h2>${frame(t('À proposer'),html`<p class="hint">${t('Trouvées dans votre Home Assistant. {brick} ne s’en sert pas encore ; dites-nous si elles vous seraient utiles.',{brick:o.brick})}</p>
  <ul class="nk-rows ex-others">${o.rows.map(r=>html`<li><div><b>${r.name}</b><small class="hint">${r.use}</small></div><span class="nk-pill">${t('pas encore lue')}</span>
   <a class="ex-act" href=${askUrl(o.repository,r,o.brick,o.version)} target="_blank" rel="noreferrer">${t('Demander')}</a></li>`)}</ul>
  <p class="hint">${t('« Demander » ouvre une demande toute prête sur GitHub : dites-y comment vous utilisez l’extension. Si elle a déjà été demandée, un 👍 sur la demande existante suffit. Rien n’est envoyé sans vous.')}</p>`)}`;
}
/** « Supprimer ce lieu », « Supprimer cette pièce »: asked once in the page; what stays (the sensors) is said. */
export function removeBlock(o:{link:string;title:string;lines:string[];keep:string;confirm:string;asking:boolean;busy?:boolean;onAsk:()=>void;onCancel:()=>void;onConfirm:()=>void}):TemplateResult{
 return o.asking?html`<section class="notice nk-remove" role="alertdialog" aria-label=${o.link}><h2>${o.title}</h2>${o.lines.map(l=>html`<p>${l}</p>`)}
  <div class="actions"><button @click=${o.onCancel}>${o.keep}</button><button class="danger" ?disabled=${o.busy} @click=${o.onConfirm}>${o.confirm}</button></div></section>`
  :html`<div class="nk-remove"><button class="link danger-link" ?disabled=${o.busy} @click=${o.onAsk}>${o.link}</button></div>`;
}
// Information to read, with nothing to do and no state to judge (ECOSYSTEME.md § 8): hub only, never on cards,
// one box per frame and three per page. Actions, states, benefits and warnings keep their own colours.
export function noteBox(title:string,body:unknown):TemplateResult{return html`<aside class="nk-note"><strong>${title}</strong> ${body}</aside>`;}
export function noteTag(text:string):TemplateResult{return html`<span class="nk-note-tag">${text}</span>`;}
// Lists, as on every page of the hub (CAHIER-HUB.md § 6): a section is a title and a list of rows; a row, a label on the left
// and its value or control on the right; a row that leads further is a whole button. One line, one setting.
export interface NkRow {name?:string;label:unknown;sub?:unknown;value?:unknown;go?:()=>unknown;level?:'ok'|'todo'|'none';control?:boolean}
// A row that opens a page answers at the touch (socle 1.21): it waits, busy, until the address changes, its promise ends,
// or 10 s pass. The spinner replaces the chevron only after 150 ms, so a page that opens at once never shows it.
function opening(row:HTMLElement,go:()=>unknown){
 if(row.hasAttribute('data-pending'))return;
 let timer=0;const done=()=>{row.removeAttribute('data-pending');row.removeAttribute('aria-busy');window.removeEventListener('location-changed',done);clearTimeout(timer);};
 row.setAttribute('data-pending','');row.setAttribute('aria-busy','true');window.addEventListener('location-changed',done);timer=window.setTimeout(done,10000);
 try{const result=go();if(result&&typeof (result as Promise<unknown>).then==='function')void (result as Promise<unknown>).finally(done);}
 catch(e){done();throw e;}
}
const rowEnd=html`<span class="nk-row-end" aria-hidden="true"><span class="nk-chev">›</span><span class="nk-spin"></span></span>`;
export function listRow(r:NkRow):TemplateResult{
 const body=html`<span class="nk-row-lab">${r.label}${r.sub?html`<small>${r.sub}</small>`:nothing}</span>${r.value!==undefined?html`<span class="nk-row-val">${r.value}</span>`:nothing}`;
 const skip=(e:Event)=>!!(e.target as HTMLElement).closest('input,select,button:not(.nk-row),ha-selector,ha-entity-picker,.nk-row-stop');
 if(r.go&&r.control)return html`<div class=${'nk-row nk-row-go'+(r.level==='todo'?' todo':'')} role="link" tabindex="0" aria-label=${r.name??(typeof r.label==='string'?r.label:nothing)} @click=${(e:Event)=>{if(!skip(e))opening(e.currentTarget as HTMLElement,r.go!);}} @keydown=${(e:KeyboardEvent)=>{if(e.key==='Enter'&&!skip(e))opening(e.currentTarget as HTMLElement,r.go!);}}>${body}${rowEnd}</div>`;
 return r.go?html`<button type="button" class=${'nk-row nk-row-go'+(r.level==='todo'?' todo':'')} aria-label=${r.name??(typeof r.label==='string'?r.label:nothing)} @click=${(e:Event)=>{if(!(e.target as HTMLElement).closest('input,select,ha-selector,ha-entity-picker,.nk-row-stop'))opening(e.currentTarget as HTMLElement,r.go!);}}>${body}${rowEnd}</button>`
  :html`<div class=${'nk-row'+(r.level==='todo'?' todo':'')}>${body}</div>`;
}
export function listSection(title:string,rows:unknown,o:{help?:unknown;more?:unknown}={}):TemplateResult{
 return html`<section class="nk-lsec">${title||o.help?html`<div class="nk-lsec-h">${title?html`<h2>${title}</h2>`:nothing}${o.help?helpTip(title||t('Aide'),o.help,''):nothing}${o.more?html`<span class="nk-lsec-more">${o.more}</span>`:nothing}</div>`:nothing}<div class="nk-list">${rows}</div></section>`;
}
// The save bar: shown only once something changed (one way to save everywhere, CAHIER-HUB.md § 6).
// The few numbers at the top of an overview (socle 1.21): side by side, even on a phone; one may open its page.
export interface NkKpi {value:string;label:string;level?:'ok'|'todo';go?:()=>unknown}
export function kpis(items:NkKpi[]):TemplateResult{
 return html`<div class="nk-kpis">${items.map(k=>k.go?html`<button type="button" class=${'nk-kpi nk-kpi-go '+(k.level??'')} @click=${k.go}><b>${k.value}</b><span>${k.label} ›</span></button>`
  :html`<div class=${'nk-kpi '+(k.level??'')}><b>${k.value}</b><span>${k.label}</span></div>`)}</div>`;
}
// The bar that holds a draft (socle 1.21). Hidden, it leaves the keyboard and screen readers alone (inert). With `done`
// and nothing left to save, it says it once (« Enregistré ») for two seconds, then leaves faster than it came.
export function saveBar(o:{count:number;busy?:boolean;cancel:()=>void;save:()=>void;done?:string}):TemplateResult{
 const done=!o.count&&!!o.done;
 return html`<div class=${'nk-savebar'+(o.count?' on':done?' done':'')} role="region" aria-label=${t('Modifications')} ?inert=${!o.count}><span role="status">${done?html`<b class="nk-saved">${o.done}</b>`:o.count>1?t('{n} modifications',{n:o.count}):t('1 modification')}</span>${done?nothing:html`<button type="button" ?disabled=${o.busy} @click=${o.cancel}>${t('Annuler')}</button><button type="button" class="primary" ?disabled=${o.busy} @click=${o.save}>${t('Enregistrer')}</button>`}</div>`;
}
// A page's tabs, in one line under its title (CAHIER-HUB.md § 5.3). Tabs that do not fit fade at the edge where more
// remain (socle 1.21); the current one is brought into view.
function tabEdges(nav:HTMLElement){nav.classList.toggle('more-r',nav.scrollLeft+nav.clientWidth<nav.scrollWidth-2);nav.classList.toggle('more-l',nav.scrollLeft>2);}
function tabInView(nav:HTMLElement,tab:HTMLElement|null){if(tab){const n=nav.getBoundingClientRect(),b=tab.getBoundingClientRect();
 if(b.left<n.left)nav.scrollLeft-=n.left-b.left+24;else if(b.right>n.right)nav.scrollLeft+=b.right-n.right+24;}tabEdges(nav);}
const tabsMounted=(el?:Element)=>{if(el instanceof HTMLElement)requestAnimationFrame(()=>tabInView(el,el.querySelector<HTMLElement>('[aria-selected="true"]')));};
export function tabBar(label:string,tabs:{label:string;current:boolean;onClick:()=>void}[],disabled=false):TemplateResult{
 return html`<nav class="nk-tabs" role="tablist" aria-label=${label} ${ref(tabsMounted)} @scroll=${(e:Event)=>tabEdges(e.currentTarget as HTMLElement)}>${tabs.map(x=>html`<button type="button" role="tab" aria-selected=${String(x.current)} ?disabled=${disabled} @click=${(e:Event)=>{const tab=e.currentTarget as HTMLElement;x.onClick();tabInView(tab.parentElement!,tab);}}>${x.label}</button>`)}</nav>`;
}
// A number in a row: its unit, then « par défaut » while it is, « Rétablir » once changed. Empty is the default.
export function numberField(o:{label:string;value:number|null|undefined;unit:string;dflt?:number;step?:number;min?:number;max?:number;set:(v:number|undefined)=>void}):TemplateResult{
 const v=o.value??undefined,isDefault=o.dflt!==undefined&&(v===undefined||v===o.dflt),num=(n:number)=>String(n).replace('.',',');
 return html`<input type="number" aria-label=${o.label} step=${o.step??1} min=${o.min??nothing} max=${o.max??nothing} placeholder=${o.dflt===undefined?'':num(o.dflt)} .value=${v===undefined?'':String(v)}
  @input=${(e:Event)=>{const raw=(e.target as HTMLInputElement).value;o.set(raw===''?undefined:Number(raw));}}><span class="nk-unit">${o.unit}</span>${o.dflt===undefined?nothing:isDefault?html`<span class="nk-def">${t('par défaut')}</span>`:html`<button type="button" class="nk-reset-s" @click=${()=>o.set(o.dflt)}>${t('Rétablir')}</button>`}`;
}
// A choice among a few, in a row.
export function segmented<V extends string>(label:string,options:[V,string][],value:V|undefined,set:(v:V)=>void,disabled=false):TemplateResult{
 return html`<span class="nk-seg" role="group" aria-label=${label}>${options.map(([v,l])=>html`<button type="button" aria-pressed=${String(value===v)} ?disabled=${disabled} @click=${()=>set(v)}>${l}</button>`)}</span>`;
}
// An on/off switch, in a row.
export function toggle(label:string,checked:boolean,set:(on:boolean)=>void,disabled=false):TemplateResult{
 return html`<input type="checkbox" class="nk-sw" role="switch" aria-label=${label} .checked=${checked} ?disabled=${disabled} @change=${(e:Event)=>set((e.target as HTMLInputElement).checked)}>`;
}
// « Pour aller plus loin »: a row that opens on what is optional, with how much is filled.
export function moreRow(title:string,count:string,body:unknown):TemplateResult{
 return html`<details class="nk-more"><summary class="nk-row nk-row-go"><span class="nk-row-lab">${title}</span><span class="nk-row-val">${count}</span><span class="nk-chev" aria-hidden="true">›</span></summary><div class="nk-more-body">${body}</div></details>`;
}
// The common motion (socle 1.21): one curve to answer, one to move, one for sheets and drawers; exits faster than entries.
export const motion=css`:host{--h-ease-out:cubic-bezier(.23,1,.32,1);--h-ease-move:cubic-bezier(.77,0,.175,1);--h-ease-sheet:cubic-bezier(.32,.72,0,1);--h-press:120ms;--h-fast:150ms;--h-exit:200ms;--h-base:220ms;--h-slow:280ms}`;
export const pageStyles=css`${motion}

 .nk-lsec{margin:0 0 26px}.nk-lsec-h{display:flex;align-items:center;gap:6px;margin:0 4px 8px;font-size:var(--nw-fs-small,12px);font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--nk-muted)}
 .nk-lsec-h h2{font:inherit;letter-spacing:inherit;margin:0;color:inherit}.nk-lsec-h hestia-hub-help-v1{text-transform:none;letter-spacing:0;font-weight:400}.nk-lsec-more{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:500}
 .nk-list{border:1px solid var(--nk-border);border-radius:16px;background:var(--nk-surface)}
 .nk-row{display:flex;align-items:center;gap:14px;width:100%;min-height:54px;padding:10px 16px;border:0;border-top:1px solid var(--nk-border);border-radius:0;background:none;text-align:left;font:inherit;color:inherit;margin:0}
 .nk-list>:first-child,.nk-list>:first-child>.nk-row{border-top:0}.nk-list>:first-child{border-radius:16px 16px 0 0}.nk-list>:last-child{border-radius:0 0 16px 16px}.nk-list>:only-child{border-radius:16px}
 .nk-row-go{cursor:pointer}@media(hover:hover) and (pointer:fine){.nk-row-go:hover{background:color-mix(in srgb,var(--nk-selected,var(--nk-surface)) 70%,transparent)}}
 .nk-row-lab{flex:1 1 160px;min-width:140px}.nk-row-lab small{display:block;color:var(--nk-muted);font-size:var(--nw-fs-small,12px);line-height:1.45}
 .nk-row-val{display:flex;align-items:center;gap:8px;color:var(--nk-muted);font-size:var(--nw-fs-text,14px);text-align:right;flex-wrap:wrap;justify-content:flex-end;min-width:0}
 .nk-row-val select,.nk-row-val input:not([type=checkbox]):not([type=radio]){width:auto;max-width:240px;margin:0;min-height:38px;padding:6px 10px}
 .nk-row-val input[type=number]{width:84px;flex:0 0 auto;text-align:right}.nk-row-val:has(input[type=number]){flex-wrap:nowrap;white-space:nowrap}.nk-row-val:has(ha-selector,ha-entity-picker){flex:1 1 300px;max-width:460px}.nk-row-val ha-selector,.nk-row-val ha-entity-picker{flex:1;min-width:0;display:block}
 .nk-row.todo .nk-row-lab>b,.nk-row.todo .nk-row-lab>strong{color:var(--nk-todo)}.nk-chev{color:var(--nk-muted);font-size:var(--nw-fs-title,17px)}
 .nk-savebar{position:fixed;left:50%;bottom:20px;transform:translate(-50%,180%);transition:transform var(--h-exit) var(--h-ease-out);z-index:20;bottom:calc(20px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:10px;padding:8px 8px 8px 18px;border:1px solid var(--nk-border);border-radius:999px;background:var(--nk-surface);box-shadow:0 12px 36px rgba(0,0,0,.35);max-width:calc(100% - 32px)}
 .nk-tabs{display:flex;gap:4px;border-bottom:1px solid var(--nk-border);margin:0 0 22px;overflow-x:auto;scrollbar-width:none}
 .nk-tabs button{border:0;border-radius:0;background:none;min-height:0;padding:10px;font:inherit;font-size:var(--nw-fs-text,14px);font-weight:500;color:var(--nk-muted);border-bottom:2px solid transparent;white-space:nowrap;cursor:pointer;margin:0}
 .nk-tabs button[aria-selected="true"]{color:var(--primary-text-color);border-bottom-color:var(--primary-text-color);font-weight:600}
 .nk-unit{color:var(--nk-muted);font-size:var(--nw-fs-small,12px)}.nk-def{color:var(--nk-muted);font-size:var(--nw-fs-small,12px)}
 .nk-reset-s{border:0;background:none;padding:0;min-height:0;color:var(--primary-color);font:inherit;font-size:var(--nw-fs-text,14px);cursor:pointer;margin:0}
 .nk-seg{display:inline-flex;flex-wrap:wrap;gap:2px;padding:3px;border:1px solid var(--nk-border);border-radius:999px;background:var(--nk-raised,var(--nk-surface))}
 .nk-seg button{border:0;min-height:32px;padding:5px 12px;border-radius:999px;background:transparent;color:var(--nk-muted);font:inherit;font-size:var(--nw-fs-text,14px);margin:0;cursor:pointer}
 .nk-seg button[aria-pressed="true"]{background:var(--nk-selected,var(--nk-surface));color:var(--primary-text-color);font-weight:600}
 input[type=checkbox].nk-sw{appearance:none;-webkit-appearance:none;width:42px;height:24px;min-height:24px;padding:0;border:0;border-radius:999px;background:var(--nk-border);position:relative;cursor:pointer;flex:0 0 auto;margin:0;transition:background .15s}
 input[type=checkbox].nk-sw::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s}
 input[type=checkbox].nk-sw:checked{background:var(--primary-color)}input[type=checkbox].nk-sw:checked::after{left:21px}
 .nk-chips{display:flex;flex-wrap:wrap;gap:6px}.nk-chip{border:1px solid var(--nk-border);border-radius:999px;background:none;min-height:32px;padding:4px 12px;font:inherit;font-size:var(--nw-fs-text,14px);color:var(--nk-muted);cursor:pointer;margin:0}
 .nk-chip[aria-pressed="true"]{background:var(--nk-selected,var(--nk-surface));color:var(--primary-text-color);font-weight:600;border-color:var(--primary-text-color)}
 .nk-more>summary{list-style:none}.nk-more>summary::-webkit-details-marker{display:none}.nk-more .nk-chev{transition:transform .18s;display:inline-block}.nk-more[open] .nk-chev{transform:rotate(90deg)}
 .nk-more-body{background:color-mix(in srgb,var(--nk-selected,var(--nk-surface)) 35%,transparent)}.nk-more-body>.nk-row{padding-left:28px}
 .nk-savebar.on{transform:translate(-50%,0);transition-duration:var(--h-base)}.nk-savebar span{color:var(--nk-muted);font-size:var(--nw-fs-text,14px);white-space:nowrap}
 @media (max-width:640px){.nk-row{flex-wrap:wrap}.nk-row-val:has(input[type=number]){flex-wrap:wrap}.nk-row-val{justify-content:flex-start;text-align:left}.nk-row-val ha-selector,.nk-row-val ha-entity-picker{min-width:0;width:100%;max-width:none}}
 .nk-note{display:block;margin:20px 0 0;padding:14px 18px;border:1px dashed var(--nk-note);border-radius:18px;background:var(--nk-note-bg);font-size:var(--nw-fs-text,14px)}.nk-note:first-child{margin-top:0}
 .nk-note+*{margin-top:14px}.nk-note>strong{color:var(--nk-note);font-weight:700}.nk-note ul{margin:6px 0 0;padding-left:20px}.nk-note p{margin:6px 0 0}
 .nk-note-tag{display:inline-block;margin-left:8px;padding:2px 8px;border:1px dashed var(--nk-note);border-radius:6px;background:var(--nk-note-bg);color:var(--nk-note);font-size:var(--nw-fs-label,11px);font-weight:700;line-height:1.5;letter-spacing:.02em;vertical-align:2px;white-space:normal}
 .ex-sec{font-size:var(--nw-fs-text,14px);font-weight:600;color:var(--nk-muted);margin:28px 0 6px}.ex-sec+.hint{margin:0 0 8px}
 /* The Extensions page: the third-party integrations under one heading per theme. */
 .ex-theme{font-size:var(--nw-fs-small,12px);font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--nk-muted);margin:26px 0 4px}
 .ex-head{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:12px;align-items:start}.ex-icon{color:var(--nk-muted);padding-top:2px}
 .ex-body h3{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 4px;font-size:var(--nw-fs-title,17px)}.ex-body p{margin:0}.ex-detail{margin-top:6px!important}
 .ex-card.act{border-color:var(--nk-todo)}.ex-card label.ex-switch{margin-top:16px}.ex-note{padding-left:40px;margin:4px 0 0}
 .ex-switch{padding-left:40px;display:flex;align-items:center;gap:10px}
 .ex-switch input[type=checkbox]{appearance:none;-webkit-appearance:none;flex:none;width:40px;height:22px;min-height:22px;margin:0;padding:0;border:0;border-radius:999px;background:color-mix(in srgb,var(--nk-muted) 35%,transparent);position:relative;cursor:pointer;transition:background .2s}
 .ex-switch input::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s}
 .ex-switch input[type=checkbox]:checked{background:var(--nk-accent)}.ex-switch input:checked::after{transform:translateX(18px)}
 .ex-switch input:focus-visible{outline:2px solid var(--nk-accent);outline-offset:2px}.ex-switch input:disabled{opacity:.5;cursor:default}
 .ex-act{display:inline-flex;align-items:center;min-height:36px;padding:6px 14px;font-size:var(--nw-fs-text,14px);font-weight:600;border:1px solid var(--nk-accent);border-radius:8px;text-decoration:none;white-space:nowrap}
 .ex-others li{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}.ex-others li>div{flex:1 1 220px;min-width:0}.ex-others small{display:block;margin-top:2px}
 .nk-remove{margin-top:28px}.nk-remove .danger{background:var(--error-color,#ae3e32);border-color:var(--error-color,#ae3e32);color:#fff}.danger-link{color:var(--error-color,#ae3e32)!important}
 .nk-remove .actions{display:flex;gap:8px;flex-wrap:wrap}.nk-remove h2{margin:0 0 6px;font-size:var(--nw-fs-title,17px)}
 @media(max-width:600px){.ex-head{grid-template-columns:24px minmax(0,1fr)}.ex-head>.ex-act,.ex-head>button{grid-column:2;justify-self:start}}
 .nk-page-head{margin:0 0 28px}.nk-back{margin:0 0 10px -17px}@media(max-width:600px){.nk-back{margin-left:-8px;padding-left:8px}}.nk-page-title{display:flex;justify-content:space-between;align-items:flex-start;gap:16px 24px;flex-wrap:wrap}
 .nk-page-title>div:first-child{min-width:0;flex:1 1 320px}.nk-page-title h1{margin:0 0 6px}.nk-page-title p{margin:0}.nk-page-actions{display:flex;gap:8px;flex-wrap:wrap}
 .nk-state{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px!important;font-size:var(--nw-fs-text,14px)}.nk-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--nk-muted)}
 .ok>.nk-dot{background:var(--nk-ok)}.todo>.nk-dot,.action>.nk-dot{background:var(--nk-todo)}.bad>.nk-dot{background:var(--error-color,#ae3e32)}
 .nk-lines{list-style:none;margin:0;padding:0}.nk-line{display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid var(--nk-border)}.nk-line:first-child{border-top:0;padding-top:0}
 .nk-line .nk-dot{margin-top:8px}.nk-line>div{flex:1 1 180px;min-width:0;display:flex;flex-direction:column}.nk-why{font-size:var(--nw-fs-small,12px);color:var(--nk-muted)}.nk-go{min-height:44px;white-space:normal;flex-shrink:0;max-width:100%;margin-left:auto}
 .nk-sub{font-size:var(--nw-fs-text,14px);font-weight:600;margin:20px 0 8px;color:var(--nk-muted)}
 .nk-items-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.nk-items-bar p{margin:0}
 .nk-items{list-style:none;margin:0;padding:0}.nk-items li{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;padding:14px 0;border-top:1px solid var(--nk-border)}.nk-items li:first-child{border-top:0}
 .nk-item-name{flex:1 1 200px;min-width:0;display:flex;flex-direction:column}.nk-item-detail{flex:2 1 260px;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.nk-edit{font-size:var(--nw-fs-text,14px);min-height:40px;padding:8px 16px}
 .nk-pill{display:inline-block;font-size:var(--nw-fs-label,11px);font-weight:600;border-radius:999px;padding:2px 10px;background:var(--nk-selected);color:var(--nk-muted);white-space:nowrap}
 .nk-pill.ok{color:var(--nk-ok);background:color-mix(in srgb,var(--nk-ok) 12%,transparent)}.nk-pill.todo{color:var(--nk-todo);background:color-mix(in srgb,var(--nk-todo) 14%,transparent)}.nk-pill.bad{color:var(--error-color,#ae3e32);background:color-mix(in srgb,var(--error-color,#ae3e32) 12%,transparent)}
 .nk-rows{list-style:none;margin:0;padding:0}.nk-rows li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--nk-border)}.nk-rows li:first-child{border-top:0}.nk-rows b{font-weight:500}.nk-rows span:not(.nk-pill){color:var(--nk-muted);text-align:right}
 .nk-meta{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:24px}.nk-links{display:flex;flex-direction:column;gap:6px}.nk-links a{text-underline-offset:3px}
 .nk-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.nk-footer-end{display:flex;gap:8px;flex-wrap:wrap}
 .nk-leave h2{margin:0 0 6px;font-size:var(--nw-fs-title,17px)}.nk-leave .actions{display:flex;gap:8px;flex-wrap:wrap}
 .nk-step-menu button span{overflow-wrap:normal;word-break:normal;hyphens:auto}
 @media(max-width:600px){.nk-step-menu button{font-size:var(--nw-fs-label,11px);padding:8px 2px}}
 @media(max-width:600px){.nk-meta{grid-template-columns:1fr}.nk-footer>*{flex:1 1 100%}.nk-footer-end>*{flex:1}}
 /* Socle 1.21 — answer at the touch, nothing sticks on a finger, nothing makes the phone zoom. */
 :host{-webkit-tap-highlight-color:transparent}
 button,.button{transition:transform var(--h-press) var(--h-ease-out),background-color var(--h-fast) ease,filter var(--h-fast) ease}
 button:not(.nk-row):not([role=tab]):not([role=switch]):not(:disabled):active,.button:active{transform:scale(.97)}
 .nk-row-go{transition:background-color var(--h-fast) ease}.nk-row-go:active{background:color-mix(in srgb,var(--nk-selected,var(--nk-surface)) 85%,transparent);transition-duration:0s}
 .nk-row-go,.nk-tabs button,.nav-fold{-webkit-user-select:none;user-select:none}
 @media(pointer:coarse){input:not([type=checkbox]):not([type=radio]),select,textarea{font-size:16px}}
 .nk-row-end{display:grid;flex:none;place-items:center;width:18px;height:18px}.nk-row-end>*{grid-area:1/1}
 .nk-spin{width:14px;height:14px;border:2px solid var(--nk-muted);border-top-color:transparent;border-radius:50%;opacity:0}
 .nk-row[data-pending]{cursor:progress}
 .nk-row[data-pending] .nk-chev{animation:nk-swap var(--h-fast) var(--h-ease-out) 150ms reverse both}
 .nk-row[data-pending] .nk-spin{animation:nk-swap var(--h-fast) var(--h-ease-out) 150ms both,nk-spin .6s linear 150ms infinite}
 @keyframes nk-swap{from{opacity:0}to{opacity:1}}@keyframes nk-spin{to{rotate:360deg}}
 @media(prefers-reduced-motion:reduce){.nk-row[data-pending] .nk-spin{animation:nk-swap var(--h-fast) ease 150ms both}}
 .nk-savebar.done{animation:nk-saved 2.4s var(--h-ease-out) both;padding:12px 20px}.nk-saved{color:var(--nk-ok);font-weight:600}.nk-saved::before{content:'✓';margin-right:6px}
 @keyframes nk-saved{0%,85%{transform:translate(-50%,0)}100%{transform:translate(-50%,180%)}}
 @media(prefers-reduced-motion:reduce){.nk-savebar,.nk-savebar.on{transition:opacity var(--h-fast) ease;transform:translate(-50%,0);opacity:0}.nk-savebar.on{opacity:1}.nk-savebar.done{animation:nk-saved-still 2.4s both}@keyframes nk-saved-still{0%,85%{opacity:1}100%{opacity:0}}}
 .nk-tabs.more-r{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 48px),transparent)}
 .nk-tabs.more-l{-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 48px),transparent)}
 .nk-tabs.more-l.more-r{-webkit-mask-image:linear-gradient(to right,transparent,#000 48px,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to right,transparent,#000 48px,#000 calc(100% - 48px),transparent)}
 .nk-kpis{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:12px;margin:0 0 18px}
 .nk-kpi{display:block;margin:0;min-height:0;padding:12px 16px;border:1px solid var(--nk-border);border-radius:14px;background:var(--nk-surface);font:inherit;color:inherit;text-align:left}
 .nk-kpi b{display:block;font-size:var(--nw-fs-case,21px);line-height:1.25;font-variant-numeric:tabular-nums}.nk-kpi span{display:block;color:var(--nk-muted);font-size:var(--nw-fs-small,12px);line-height:1.35}
 .nk-kpi.ok b{color:var(--nk-accent)}.nk-kpi.todo b{color:var(--nk-todo)}.nk-kpi-go{cursor:pointer}
 @media(hover:hover) and (pointer:fine){.nk-kpi-go:hover{border-color:var(--primary-color)}}
 @media(max-width:600px){.nk-kpis{gap:8px}.nk-kpi{padding:10px 12px;border-radius:12px}.nk-kpi b{font-size:var(--nw-fs-title,17px)}.nk-kpi span{font-size:var(--nw-fs-small,12px)}}
`;

// The newest copy loaded on the page is the one every brick's pages use (hub.ts). Published last: every piece above exists.
const shared=globalThis as {hestiaSocleUi?:typeof self};
if(!shared.hestiaSocleUi||!sameOrNewer(shared.hestiaSocleUi,self))shared.hestiaSocleUi=self;
