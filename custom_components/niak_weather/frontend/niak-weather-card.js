// Home Assistant frontend#53890: wait for the final custom element registry.
while (!customElements.get('home-assistant')) {
  await customElements.whenDefined('home-assistant');
}
"use strict";(()=>{var hn=Object.defineProperty;var un=Object.getOwnPropertyDescriptor;var $=(e,i,t,n)=>{for(var a=n>1?void 0:n?un(i,t):i,s=e.length-1,d;s>=0;s--)(d=e[s])&&(a=(n?d(i,t,a):d(a))||a);return n&&a&&hn(i,t,a),a};var He=globalThis,Oe=He.ShadowRoot&&(He.ShadyCSS===void 0||He.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,st=Symbol(),Kt=new WeakMap,ye=class{constructor(i,t,n){if(this._$cssResult$=!0,n!==st)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=i,this.t=t}get styleSheet(){let i=this.o,t=this.t;if(Oe&&i===void 0){let n=t!==void 0&&t.length===1;n&&(i=Kt.get(t)),i===void 0&&((this.o=i=new CSSStyleSheet).replaceSync(this.cssText),n&&Kt.set(t,i))}return i}toString(){return this.cssText}},Qt=e=>new ye(typeof e=="string"?e:e+"",void 0,st),C=(e,...i)=>{let t=e.length===1?e[0]:i.reduce((n,a,s)=>n+(d=>{if(d._$cssResult$===!0)return d.cssText;if(typeof d=="number")return d;throw Error("Value passed to 'css' function must be a 'css' function result: "+d+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[s+1],e[0]);return new ye(t,e,st)},Yt=(e,i)=>{if(Oe)e.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of i){let n=document.createElement("style"),a=He.litNonce;a!==void 0&&n.setAttribute("nonce",a),n.textContent=t.cssText,e.appendChild(n)}},ot=Oe?e=>e:e=>e instanceof CSSStyleSheet?(i=>{let t="";for(let n of i.cssRules)t+=n.cssText;return Qt(t)})(e):e;var{is:mn,defineProperty:fn,getOwnPropertyDescriptor:gn,getOwnPropertyNames:wn,getOwnPropertySymbols:bn,getPrototypeOf:vn}=Object,Fe=globalThis,Jt=Fe.trustedTypes,xn=Jt?Jt.emptyScript:"",yn=Fe.reactiveElementPolyfillSupport,$e=(e,i)=>e,ke={toAttribute(e,i){switch(i){case Boolean:e=e?xn:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,i){let t=e;switch(i){case Boolean:t=e!==null;break;case Number:t=e===null?null:Number(e);break;case Object:case Array:try{t=JSON.parse(e)}catch{t=null}}return t}},Be=(e,i)=>!mn(e,i),Zt={attribute:!0,type:String,converter:ke,reflect:!1,useDefault:!1,hasChanged:Be};Symbol.metadata??=Symbol("metadata"),Fe.litPropertyMetadata??=new WeakMap;var ee=class extends HTMLElement{static addInitializer(i){this._$Ei(),(this.l??=[]).push(i)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(i,t=Zt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(i)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(i,t),!t.noAccessor){let n=Symbol(),a=this.getPropertyDescriptor(i,n,t);a!==void 0&&fn(this.prototype,i,a)}}static getPropertyDescriptor(i,t,n){let{get:a,set:s}=gn(this.prototype,i)??{get(){return this[t]},set(d){this[t]=d}};return{get:a,set(d){let l=a?.call(this);s?.call(this,d),this.requestUpdate(i,l,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(i){return this.elementProperties.get(i)??Zt}static _$Ei(){if(this.hasOwnProperty($e("elementProperties")))return;let i=vn(this);i.finalize(),i.l!==void 0&&(this.l=[...i.l]),this.elementProperties=new Map(i.elementProperties)}static finalize(){if(this.hasOwnProperty($e("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($e("properties"))){let t=this.properties,n=[...wn(t),...bn(t)];for(let a of n)this.createProperty(a,t[a])}let i=this[Symbol.metadata];if(i!==null){let t=litPropertyMetadata.get(i);if(t!==void 0)for(let[n,a]of t)this.elementProperties.set(n,a)}this._$Eh=new Map;for(let[t,n]of this.elementProperties){let a=this._$Eu(t,n);a!==void 0&&this._$Eh.set(a,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(i){let t=[];if(Array.isArray(i)){let n=new Set(i.flat(1/0).reverse());for(let a of n)t.unshift(ot(a))}else i!==void 0&&t.push(ot(i));return t}static _$Eu(i,t){let n=t.attribute;return n===!1?void 0:typeof n=="string"?n:typeof i=="string"?i.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(i=>this.enableUpdating=i),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(i=>i(this))}addController(i){(this._$EO??=new Set).add(i),this.renderRoot!==void 0&&this.isConnected&&i.hostConnected?.()}removeController(i){this._$EO?.delete(i)}_$E_(){let i=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(i.set(n,this[n]),delete this[n]);i.size>0&&(this._$Ep=i)}createRenderRoot(){let i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Yt(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(i=>i.hostConnected?.())}enableUpdating(i){}disconnectedCallback(){this._$EO?.forEach(i=>i.hostDisconnected?.())}attributeChangedCallback(i,t,n){this._$AK(i,n)}_$ET(i,t){let n=this.constructor.elementProperties.get(i),a=this.constructor._$Eu(i,n);if(a!==void 0&&n.reflect===!0){let s=(n.converter?.toAttribute!==void 0?n.converter:ke).toAttribute(t,n.type);this._$Em=i,s==null?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(i,t){let n=this.constructor,a=n._$Eh.get(i);if(a!==void 0&&this._$Em!==a){let s=n.getPropertyOptions(a),d=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:ke;this._$Em=a;let l=d.fromAttribute(t,s.type);this[a]=l??this._$Ej?.get(a)??l,this._$Em=null}}requestUpdate(i,t,n,a=!1,s){if(i!==void 0){let d=this.constructor;if(a===!1&&(s=this[i]),n??=d.getPropertyOptions(i),!((n.hasChanged??Be)(s,t)||n.useDefault&&n.reflect&&s===this._$Ej?.get(i)&&!this.hasAttribute(d._$Eu(i,n))))return;this.C(i,t,n)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(i,t,{useDefault:n,reflect:a,wrapped:s},d){n&&!(this._$Ej??=new Map).has(i)&&(this._$Ej.set(i,d??t??this[i]),s!==!0||d!==void 0)||(this._$AL.has(i)||(this.hasUpdated||n||(t=void 0),this._$AL.set(i,t)),a===!0&&this._$Em!==i&&(this._$Eq??=new Set).add(i))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let i=this.scheduleUpdate();return i!=null&&await i,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[a,s]of this._$Ep)this[a]=s;this._$Ep=void 0}let n=this.constructor.elementProperties;if(n.size>0)for(let[a,s]of n){let{wrapped:d}=s,l=this[a];d!==!0||this._$AL.has(a)||l===void 0||this.C(a,void 0,s,l)}}let i=!1,t=this._$AL;try{i=this.shouldUpdate(t),i?(this.willUpdate(t),this._$EO?.forEach(n=>n.hostUpdate?.()),this.update(t)):this._$EM()}catch(n){throw i=!1,this._$EM(),n}i&&this._$AE(t)}willUpdate(i){}_$AE(i){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(i)),this.updated(i)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(i){return!0}update(i){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(i){}firstUpdated(i){}};ee.elementStyles=[],ee.shadowRootOptions={mode:"open"},ee[$e("elementProperties")]=new Map,ee[$e("finalized")]=new Map,yn?.({ReactiveElement:ee}),(Fe.reactiveElementVersions??=[]).push("2.1.2");var mt=globalThis,Xt=e=>e,Ie=mt.trustedTypes,ei=Ie?Ie.createPolicy("lit-html",{createHTML:e=>e}):void 0,si="$lit$",ie=`lit$${Math.random().toFixed(9).slice(2)}$`,oi="?"+ie,$n=`<${oi}>`,le=document,Ce=()=>le.createComment(""),Ae=e=>e===null||typeof e!="object"&&typeof e!="function",ft=Array.isArray,kn=e=>ft(e)||typeof e?.[Symbol.iterator]=="function",lt=`[ 	
\f\r]`,_e=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ti=/-->/g,ii=/>/g,se=RegExp(`>|${lt}(?:([^\\s"'>=/]+)(${lt}*=${lt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ni=/'/g,ai=/"/g,li=/^(?:script|style|textarea|title)$/i,gt=e=>(i,...t)=>({_$litType$:e,strings:i,values:t}),o=gt(1),B=gt(2),$a=gt(3),de=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),ri=new WeakMap,oe=le.createTreeWalker(le,129);function di(e,i){if(!ft(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return ei!==void 0?ei.createHTML(i):i}var _n=(e,i)=>{let t=e.length-1,n=[],a,s=i===2?"<svg>":i===3?"<math>":"",d=_e;for(let l=0;l<t;l++){let c=e[l],h,m,u=-1,g=0;for(;g<c.length&&(d.lastIndex=g,m=d.exec(c),m!==null);)g=d.lastIndex,d===_e?m[1]==="!--"?d=ti:m[1]!==void 0?d=ii:m[2]!==void 0?(li.test(m[2])&&(a=RegExp("</"+m[2],"g")),d=se):m[3]!==void 0&&(d=se):d===se?m[0]===">"?(d=a??_e,u=-1):m[1]===void 0?u=-2:(u=d.lastIndex-m[2].length,h=m[1],d=m[3]===void 0?se:m[3]==='"'?ai:ni):d===ai||d===ni?d=se:d===ti||d===ii?d=_e:(d=se,a=void 0);let v=d===se&&e[l+1].startsWith("/>")?" ":"";s+=d===_e?c+$n:u>=0?(n.push(h),c.slice(0,u)+si+c.slice(u)+ie+v):c+ie+(u===-2?l:v)}return[di(e,s+(e[t]||"<?>")+(i===2?"</svg>":i===3?"</math>":"")),n]},Pe=class e{constructor({strings:i,_$litType$:t},n){let a;this.parts=[];let s=0,d=0,l=i.length-1,c=this.parts,[h,m]=_n(i,t);if(this.el=e.createElement(h,n),oe.currentNode=this.el.content,t===2||t===3){let u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(a=oe.nextNode())!==null&&c.length<l;){if(a.nodeType===1){if(a.hasAttributes())for(let u of a.getAttributeNames())if(u.endsWith(si)){let g=m[d++],v=a.getAttribute(u).split(ie),k=/([.?@])?(.*)/.exec(g);c.push({type:1,index:s,name:k[2],strings:v,ctor:k[1]==="."?ct:k[1]==="?"?pt:k[1]==="@"?ht:me}),a.removeAttribute(u)}else u.startsWith(ie)&&(c.push({type:6,index:s}),a.removeAttribute(u));if(li.test(a.tagName)){let u=a.textContent.split(ie),g=u.length-1;if(g>0){a.textContent=Ie?Ie.emptyScript:"";for(let v=0;v<g;v++)a.append(u[v],Ce()),oe.nextNode(),c.push({type:2,index:++s});a.append(u[g],Ce())}}}else if(a.nodeType===8)if(a.data===oi)c.push({type:2,index:s});else{let u=-1;for(;(u=a.data.indexOf(ie,u+1))!==-1;)c.push({type:7,index:s}),u+=ie.length-1}s++}}static createElement(i,t){let n=le.createElement("template");return n.innerHTML=i,n}};function ue(e,i,t=e,n){if(i===de)return i;let a=n!==void 0?t._$Co?.[n]:t._$Cl,s=Ae(i)?void 0:i._$litDirective$;return a?.constructor!==s&&(a?._$AO?.(!1),s===void 0?a=void 0:(a=new s(e),a._$AT(e,t,n)),n!==void 0?(t._$Co??=[])[n]=a:t._$Cl=a),a!==void 0&&(i=ue(e,a._$AS(e,i.values),a,n)),i}var dt=class{constructor(i,t){this._$AV=[],this._$AN=void 0,this._$AD=i,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(i){let{el:{content:t},parts:n}=this._$AD,a=(i?.creationScope??le).importNode(t,!0);oe.currentNode=a;let s=oe.nextNode(),d=0,l=0,c=n[0];for(;c!==void 0;){if(d===c.index){let h;c.type===2?h=new Te(s,s.nextSibling,this,i):c.type===1?h=new c.ctor(s,c.name,c.strings,this,i):c.type===6&&(h=new ut(s,this,i)),this._$AV.push(h),c=n[++l]}d!==c?.index&&(s=oe.nextNode(),d++)}return oe.currentNode=le,a}p(i){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings!==void 0?(n._$AI(i,n,t),t+=n.strings.length-2):n._$AI(i[t])),t++}},Te=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(i,t,n,a){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=i,this._$AB=t,this._$AM=n,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let i=this._$AA.parentNode,t=this._$AM;return t!==void 0&&i?.nodeType===11&&(i=t.parentNode),i}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(i,t=this){i=ue(this,i,t),Ae(i)?i===p||i==null||i===""?(this._$AH!==p&&this._$AR(),this._$AH=p):i!==this._$AH&&i!==de&&this._(i):i._$litType$!==void 0?this.$(i):i.nodeType!==void 0?this.T(i):kn(i)?this.k(i):this._(i)}O(i){return this._$AA.parentNode.insertBefore(i,this._$AB)}T(i){this._$AH!==i&&(this._$AR(),this._$AH=this.O(i))}_(i){this._$AH!==p&&Ae(this._$AH)?this._$AA.nextSibling.data=i:this.T(le.createTextNode(i)),this._$AH=i}$(i){let{values:t,_$litType$:n}=i,a=typeof n=="number"?this._$AC(i):(n.el===void 0&&(n.el=Pe.createElement(di(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===a)this._$AH.p(t);else{let s=new dt(a,this),d=s.u(this.options);s.p(t),this.T(d),this._$AH=s}}_$AC(i){let t=ri.get(i.strings);return t===void 0&&ri.set(i.strings,t=new Pe(i)),t}k(i){ft(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,n,a=0;for(let s of i)a===t.length?t.push(n=new e(this.O(Ce()),this.O(Ce()),this,this.options)):n=t[a],n._$AI(s),a++;a<t.length&&(this._$AR(n&&n._$AB.nextSibling,a),t.length=a)}_$AR(i=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);i!==this._$AB;){let n=Xt(i).nextSibling;Xt(i).remove(),i=n}}setConnected(i){this._$AM===void 0&&(this._$Cv=i,this._$AP?.(i))}},me=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(i,t,n,a,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=i,this.name=t,this._$AM=a,this.options=s,n.length>2||n[0]!==""||n[1]!==""?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=p}_$AI(i,t=this,n,a){let s=this.strings,d=!1;if(s===void 0)i=ue(this,i,t,0),d=!Ae(i)||i!==this._$AH&&i!==de,d&&(this._$AH=i);else{let l=i,c,h;for(i=s[0],c=0;c<s.length-1;c++)h=ue(this,l[n+c],t,c),h===de&&(h=this._$AH[c]),d||=!Ae(h)||h!==this._$AH[c],h===p?i=p:i!==p&&(i+=(h??"")+s[c+1]),this._$AH[c]=h}d&&!a&&this.j(i)}j(i){i===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,i??"")}},ct=class extends me{constructor(){super(...arguments),this.type=3}j(i){this.element[this.name]=i===p?void 0:i}},pt=class extends me{constructor(){super(...arguments),this.type=4}j(i){this.element.toggleAttribute(this.name,!!i&&i!==p)}},ht=class extends me{constructor(i,t,n,a,s){super(i,t,n,a,s),this.type=5}_$AI(i,t=this){if((i=ue(this,i,t,0)??p)===de)return;let n=this._$AH,a=i===p&&n!==p||i.capture!==n.capture||i.once!==n.once||i.passive!==n.passive,s=i!==p&&(n===p||a);a&&this.element.removeEventListener(this.name,this,n),s&&this.element.addEventListener(this.name,this,i),this._$AH=i}handleEvent(i){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,i):this._$AH.handleEvent(i)}},ut=class{constructor(i,t,n){this.element=i,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(i){ue(this,i)}};var Cn=mt.litHtmlPolyfillSupport;Cn?.(Pe,Te),(mt.litHtmlVersions??=[]).push("3.3.3");var ci=(e,i,t)=>{let n=t?.renderBefore??i,a=n._$litPart$;if(a===void 0){let s=t?.renderBefore??null;n._$litPart$=a=new Te(i.insertBefore(Ce(),s),s,void 0,t??{})}return a._$AI(e),a};var wt=globalThis,V=class extends ee{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let i=super.createRenderRoot();return this.renderOptions.renderBefore??=i.firstChild,i}update(i){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(i),this._$Do=ci(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return de}};V._$litElement$=!0,V.finalized=!0,wt.litElementHydrateSupport?.({LitElement:V});var An=wt.litElementPolyfillSupport;An?.({LitElement:V});(wt.litElementVersions??=[]).push("4.2.2");var Pn={attribute:!0,type:String,converter:ke,reflect:!1,hasChanged:Be},Tn=(e=Pn,i,t)=>{let{kind:n,metadata:a}=t,s=globalThis.litPropertyMetadata.get(a);if(s===void 0&&globalThis.litPropertyMetadata.set(a,s=new Map),n==="setter"&&((e=Object.create(e)).wrapped=!0),s.set(t.name,e),n==="accessor"){let{name:d}=t;return{set(l){let c=i.get.call(this);i.set.call(this,l),this.requestUpdate(d,c,e,!0,l)},init(l){return l!==void 0&&this.C(d,void 0,e,l),l}}}if(n==="setter"){let{name:d}=t;return function(l){let c=this[d];i.call(this,l),this.requestUpdate(d,c,e,!0,l)}}throw Error("Unsupported decorator location: "+n)};function R(e){return(i,t)=>typeof t=="object"?Tn(e,i,t):((n,a,s)=>{let d=a.hasOwnProperty(s);return a.constructor.createProperty(s,n),d?Object.getOwnPropertyDescriptor(a,s):void 0})(e,i,t)}function j(e){return R({...e,state:!0,attribute:!1})}var Q=e=>i=>{customElements.get(e)||customElements.define(e,i)};var Sn={comfort:["feel","gauge","factors","extras"],rain:["ahead","now","chart","stats"],wind:["ahead","now","chart","stats"],pressure:["ahead","now","chart","stats"],lightning:["ahead","now","radar","stats"],air:["air_today","pollen_today","air_tomorrow","pollen_tomorrow"],forecast:["hours","days"]};function Se(e){let i=Sn[e.format??"full"]??[];if(!e.card_blocks)return i;let t=e.card_blocks.filter(n=>i.includes(n));return t.length||!e.card_blocks.length?t:i}function qe(e){return{hero:e.banner_blocks!==void 0||e.show_synthesis!==!1,banner:e.banner_blocks??(e.show_synthesis===!1?[]:[...e.show_bulletin===!1?[]:["bulletin"],"events"]),today:e.today_blocks??(e.show_today===!1?[]:["comfort","rain","wind","pressure","lightning","extras","air"]),forecasts:e.forecast_blocks??(e.show_predictions===!1?[]:["hours","days",...e.show_atmo_tomorrow===!1?[]:["air"]])}}function Ee(e){let i={...e};i.mode==="compact"&&i.show_predictions===void 0&&(i.show_predictions=!1),delete i.mode;let t=i.full_blocks;if(Array.isArray(t)){let n=["bulletin","events","moments","forecast"],a=t.includes("air");i.banner_blocks??=t.filter(s=>n.includes(s)),i.today_blocks??=t.includes("today")?["comfort","rain","wind","pressure","extras",...a?["air"]:[]]:[],i.forecast_blocks??=t.includes("predictions")?["hours","days",...a?["air"]:[]]:[]}delete i.full_blocks,delete i.air_blocks,delete i.lightning_distance_entity,delete i.comfort_entity,delete i.air_quality_entity,delete i.model_entity,delete i.forecast_entity,delete i.air_path;for(let n of["humidex_entity","humidex_perception_entity","thermal_dew_point_entity","heat_index_entity","absolute_humidity_entity","thermal_perception_entity","thermal_device_id"])delete i[n];return i}var pi={banner_blocks:["bulletin","events","moments","forecast"],today_blocks:["comfort","rain","wind","pressure","lightning","extras","air"],forecast_blocks:["hours","days","air"]};function hi(e,i,t){let n=d=>{let l=t.indexOf(d);return l<0?t.length:l},a=new Set(i.filter(d=>!e.includes(d))),s=i.filter(d=>!a.has(d));for(let d of a){let l=s.length;for(;l>0&&n(s[l-1])>n(d);)l--;s.splice(l,0,d)}return s}function En(e,i){let t=e.periods?.find(n=>n.period===i);return t?{...e,period:i,series:t.series,low:t.low,top:t.top,stats:t.stats}:{...e,period:"6h"}}function zn(e,i){let t=e.periods?.find(n=>n.period===i);return t?{...e,period:i,mean:t.mean,gust:t.gust,top:t.top}:{...e,period:"6h"}}function Mn(e,i){let t=e.periods?.find(n=>n.period===i);return t?{...e,period:i,days:t.days,total:t.total,totalPartial:t.partial}:{...e,period:"7d"}}function ui(e,i,t){let n=!t&&!!i.banner_blocks,a=t||n||i.smart_brief!==!1&&i.show_synthesis!==!1,s=d=>i.show_atmo_details===!1?d.map(l=>({...l,details:[],updated:""})):d;return{...e,brief:a?e.brief:void 0,alerts:a?e.alerts:[],points:a?e.points:[],timeline:a?e.timeline:[],bulletin:i.show_bulletin===!1&&!(t&&i.tile_blocks?.length)&&!n?void 0:e.bulletin,pressure:e.pressure&&En(e.pressure,i.pressure_span??"6h"),wind:e.wind&&zn(e.wind,i.wind_span??"6h"),rain:e.rain&&Mn(e.rain,i.rain_span??"7d"),air:{today:s(e.air.today),tomorrow:i.show_atmo_tomorrow===!1&&!i.forecast_blocks&&i.format!=="air"?[]:s(e.air.tomorrow)}}}var mi=C`
  :host {
    /* Theme colours, with fallbacks for themes that leave them out. */
    --nw-fg: var(--primary-text-color, #212121);
    --nw-fg2: var(--secondary-text-color, #727272);
    --nw-bg: var(--ha-card-background, var(--card-background-color, #fff));
    --nw-accent: var(--primary-color, #03a9f4);

    /* Outlines and radii: one radius for every box (tiles, bubbles, panels), one for pills. */
    --nw-line: color-mix(in srgb, var(--nw-fg) 13%, transparent);
    --nw-line-soft: color-mix(in srgb, var(--nw-fg) 8%, transparent);
    --nw-radius-card: var(--ha-card-border-radius, 12px);
    --nw-radius: 14px;
    --nw-radius-pill: 999px;

    /* Glass over the sky: the brief bubble and the timeline's labels. */
    --nw-glass-strong: color-mix(in srgb, var(--nw-bg) 84%, transparent);
    --nw-blur: blur(6px) saturate(1.2);
    /* Frosted glass of the banner's timeline: clearer, so the animated sky shows through, and blurred more to stay readable. */
    --nw-glass-clear: color-mix(in srgb, var(--nw-bg) 45%, transparent);
    --nw-frost: blur(14px) saturate(1.6);

    /* Spacing */
    --nw-pad-bubble: 6px 14px 7px 10px;
    --nw-pad-panel: 18px 20px;

    /* Type scale: six sizes for the whole card, nothing else.
       label 10 (small capitals) · small 12 · text 13 · title 17 · value 30 · temperature 42 */
    --nw-fs-label: 10px; --nw-fs-small: 12px; --nw-fs-text: 13px; --nw-fs-title: 17px; --nw-fs-value: 30px; --nw-fs-temp: 42px;
    --nw-label-spacing: .6px;

    /* Meaning colours, « Aube » palette: OKLCH, same lightness and chroma, only the hue changes, so they always match.
       Pastel for surfaces; text in these colours uses the ink mix below, darker on light themes, lighter on dark ones. */
    --nw-rain: var(--hestia-rain-color, var(--niak-rain-color, oklch(.8 .07 190)));
    --nw-wind: var(--hestia-wind-color, var(--niak-wind-color, oklch(.79 .075 280)));
    --nw-heat: var(--hestia-heat-color, var(--niak-heat-color, oklch(.83 .085 42)));
    --nw-cold: var(--hestia-cold-color, var(--niak-cold-color, oklch(.85 .05 220)));
    --nw-calm: var(--hestia-calm-color, var(--niak-calm-color, oklch(.83 .075 150)));
    --nw-pressure: var(--hestia-pressure-color, var(--niak-pressure-color, oklch(.78 .07 315)));
    --nw-level1: var(--hestia-level1-color, var(--niak-level1-color, oklch(.88 .1 96)));
    --nw-level2: var(--hestia-level2-color, var(--niak-level2-color, oklch(.81 .105 64)));
    --nw-level3: var(--hestia-level3-color, var(--niak-level3-color, oklch(.74 .115 18)));
    /* How much of the meaning colour goes into a coloured text: 34 % keeps even the light yellow readable (contrast 4.5:1) on its tinted pill. */
    --nw-ink: 34%;

    /* Motion */
    --nw-ease: cubic-bezier(.2, .8, .2, 1);
    --nw-expand: .45s;
  }
`,fi=C`
  ha-icon { display:flex; line-height:0; }
  button { font:inherit; color:inherit; }
  [data-entity] { cursor:pointer; }
  [data-entity]:focus-visible, button:focus-visible { outline:2px solid var(--nw-accent); outline-offset:2px; }
  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }

  /* Label: small capitals, one size everywhere. */
  .nw-label { font-size:var(--nw-fs-label); line-height:13px; font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; color:var(--nw-fg2); white-space:nowrap; }

  /* Coloured text, always readable: the meaning colour mixed into the text colour. */
  .nw-ink { font-size:var(--nw-fs-small); font-weight:600; color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }

  /* The day's bulletin: medium weight, never bold. Home Assistant's Roboto comes in 400, 500 and 700: a 600 shows as bold. */
  .nw-bulletin { margin:0; font-size:var(--nw-fs-text); font-weight:500; line-height:1.5; max-width:62ch; }

  /* Source pill: one rule for the whole card. Same shape as the info pill, only the tint differs. */
  .nw-badge { display:inline-flex; align-items:center; font-size:var(--nw-fs-small); line-height:18px; font-weight:500; white-space:nowrap;
    padding:3px 10px; border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:color-mix(in srgb, var(--nw-bg) 70%, transparent); color:var(--nw-fg);
    max-width:100%; overflow:hidden; text-overflow:ellipsis; box-sizing:border-box; }
  /* Info pill: tinted background, icon and text in the colour, value in bold. */
  .nw-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-small); line-height:18px; font-weight:600;
    white-space:nowrap; border:1px solid transparent; background:color-mix(in oklab, var(--c) 24%, transparent); color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }
  .nw-chip ha-icon { --mdc-icon-size:14px; } .nw-chip b { font-weight:700; }
  .nw-chips { display:flex; flex-wrap:wrap; gap:8px; }

  /* « En ce moment »: condition, temperature, source, with a halo that keeps them readable on any sky. */
  .nw-now { display:flex; flex-direction:column; align-items:flex-end; text-align:right; gap:2px;
    text-shadow:0 0 14px var(--nw-bg), 0 0 5px var(--nw-bg), 0 0 2px var(--nw-bg); }
  .nw-now .nw-label { color:color-mix(in srgb, var(--nw-fg) 75%, transparent); }
  .nw-now :is(.nw-chip, .nw-badge) { text-shadow:none; color:var(--nw-fg); background:color-mix(in srgb, var(--nw-bg) 86%, transparent); border-color:var(--nw-line); backdrop-filter:var(--nw-blur); }
  .nw-now .nw-chip ha-icon { color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .nw-now .cond { display:flex; align-items:center; gap:6px; font-weight:650; font-size:var(--nw-fs-text); }
  .nw-now .cond ha-icon { --mdc-icon-size:17px; }
  .nw-now .temp { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-1px; line-height:1.05; white-space:nowrap; }
  .nw-now .temp small { font-size:var(--nw-fs-text); font-weight:400; vertical-align:super; margin-left:2px; letter-spacing:0; }
  /* Today's low and high: a quiet line under the temperature. */
  .nw-now .range { display:flex; gap:10px; font-size:var(--nw-fs-small); font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap;
    color:color-mix(in srgb, currentColor 82%, transparent); }
  /* Storm and downpour clouds stay dark whatever the theme: the text on them turns white, the pills keep the theme. */
  .dark-sky .nw-now { color:#fff; text-shadow:0 1px 5px #0b1a2b99; }
  .dark-sky .nw-now .nw-label { color:rgba(255,255,255,.88); }

  /* Panel: every frame of the full card. */
  .nw-panel { background:var(--nw-bg); border:1px solid var(--nw-line); border-radius:var(--nw-radius); padding:var(--nw-pad-panel);
    display:flex; flex-direction:column; gap:14px; min-width:0; box-sizing:border-box; }
  /* When the title and its source do not fit on one line, the source moves under the title rather than cutting it. */
  .nw-panel-head { display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; min-width:0; }
  .nw-panel-head h3 { display:flex; align-items:center; gap:8px; margin:0; font-size:var(--nw-fs-title); font-weight:700; letter-spacing:-.2px; flex:1 0 auto; max-width:calc(100% - 42px); white-space:nowrap; }
  .nw-panel-head h3 > span { overflow:hidden; text-overflow:ellipsis; }
  .nw-panel-head .nw-badge { margin-left:auto; }
  .nw-panel-icon { display:grid; place-items:center; width:32px; height:32px; border-radius:10px; flex:none;
    background:color-mix(in oklab, var(--c) 28%, transparent); color:color-mix(in oklab, var(--c) 60%, var(--nw-fg)); }
  .nw-panel-icon ha-icon { --mdc-icon-size:18px; }
  .nw-sub { margin:-8px 0 0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-empty { margin:0; padding:14px 0; text-align:center; font-size:var(--nw-fs-small); color:var(--nw-fg2); }

  /* Legend: always centred under its chart. */
  .nw-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:6px 16px; font-size:var(--nw-fs-small); color:var(--nw-fg2); margin-top:auto; }
  .nw-legend span { display:inline-flex; align-items:center; gap:6px; }
  .nw-legend i { width:14px; height:4px; border-radius:2px; background:var(--c); }
  .nw-legend i.sq { width:10px; height:10px; border-radius:3px; }
  .nw-legend i.dash { background:repeating-linear-gradient(90deg, color-mix(in oklab, var(--c) 60%, transparent) 0 3px, transparent 3px 5px); }
  .nw-legend svg { width:10px; height:10px; fill:color-mix(in oklab, var(--nw-wind) 70%, var(--nw-fg)); }

  /* Main value of a panel: big figure, unit, caption. */
  .metric-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px 14px; }
  .metric { display:flex; flex-direction:column; gap:4px; min-width:0; border:0; background:none; padding:0; text-align:left; }
  .metric-main { display:flex; align-items:baseline; gap:5px; }
  .metric-main b { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-1px; line-height:1; font-variant-numeric:tabular-nums; }
  .metric-main span { font-size:var(--nw-fs-text); color:var(--nw-fg2); font-weight:600; }
  .metric small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .metric small b { color:var(--nw-fg); }
  /* Three small values under a line. */
  .stats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; padding-top:12px; border-top:1px solid var(--nw-line-soft); margin-top:auto; }
  .stats > * { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .stats .nw-label { overflow:hidden; text-overflow:ellipsis; }
  .stats b { font-size:var(--nw-fs-text); font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }

  /* Small history chart: the same frame for rain, wind and pressure. */
  .mini { display:flex; flex-direction:column; gap:4px; }
  .mini-top { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .mini-plot { position:relative; height:52px; margin:16px 0 14px; }
  .mini-plot svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .mini-axis { display:flex; justify-content:space-between; }
  /* A value posed on a chart: above its point, below it when the point touches the top. */
  .pill { position:absolute; transform:translate(-50%, -130%); font-size:var(--nw-fs-small); font-weight:700; padding:2px 8px; border-radius:var(--nw-radius-pill);
    background:var(--nw-bg); border:1px solid var(--nw-line); box-shadow:0 2px 6px #0001; white-space:nowrap; }
  .pill.low { transform:translate(-50%, 40%); }

  /* Folding details at the bottom of a panel. */
  .nw-details { font-size:var(--nw-fs-small); color:var(--nw-fg2); border-top:1px solid var(--nw-line-soft); padding-top:10px; margin-top:auto; }
  .nw-details summary { cursor:pointer; list-style:none; display:flex; align-items:center; gap:6px; font-weight:600; }
  .nw-details summary::-webkit-details-marker { display:none; }
  .nw-details summary ha-icon { --mdc-icon-size:16px; transition:transform .2s; }
  .nw-details[open] summary ha-icon { transform:rotate(90deg); }
  .nw-details ul { margin:8px 0 0; padding:0; list-style:none; display:grid; gap:6px; }
  .nw-details li { display:flex; justify-content:space-between; gap:12px; font-size:var(--nw-fs-text); color:var(--nw-fg); }
  .nw-details li b { text-align:right; }
  .nw-details p { margin:8px 0 0; }

  /* « i » button and its explanation bubble: one sentence, then an example. */
  .nw-info { display:inline-grid; place-items:center; width:22px; height:22px; padding:0; flex:none; border-radius:50%; border:1px solid var(--nw-line);
    background:var(--nw-bg); color:var(--nw-fg2); cursor:pointer; }
  .nw-info:hover { color:var(--nw-fg); border-color:color-mix(in srgb, var(--nw-fg) 30%, transparent); }
  .nw-info ha-icon { --mdc-icon-size:15px; }
  .nw-pop { position:fixed; inset:auto; margin:0; width:min(320px, calc(100vw - 24px)); max-height:min(70vh, 480px); overflow:auto; box-sizing:border-box;
    padding:12px 14px; border-radius:var(--nw-radius); border:1px solid var(--nw-line); background:var(--nw-bg); color:var(--nw-fg);
    box-shadow:0 12px 32px #0b1a2b26; font-size:var(--nw-fs-text); line-height:1.45; font-weight:400;
    white-space:normal; text-align:left; letter-spacing:0; text-transform:none; text-shadow:none; }
  .nw-pop > b { display:block; margin-bottom:4px; }
  .nw-pop .ex { margin-top:8px; padding-top:8px; border-top:1px solid var(--nw-line); font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-pop .ex::before { content:var(--nw-example-word, 'Exemple'); display:block; font-size:var(--nw-fs-label); font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; margin-bottom:2px; }
  .nw-pop a { color:var(--nw-accent); }
`,We=C`
  .nw-bubble { display:inline-grid; grid-template-columns:auto minmax(0,1fr); column-gap:10px; align-items:center; max-width:100%; box-sizing:border-box; margin:0;
    padding:var(--nw-pad-bubble); border-radius:var(--nw-radius); background:var(--nw-glass-strong); border:1px solid var(--nw-line); backdrop-filter:var(--nw-blur);
    color:var(--nw-fg); transition:opacity .35s, transform .35s; }
  .nw-bubble ha-icon { --mdc-icon-size:18px; display:flex; line-height:0; grid-row:1/3; color:var(--nw-fg2); }
  /* A touch of colour: only the icon takes the colour of the bubble's theme. */
  .nw-bubble[data-theme] ha-icon { color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .nw-bubble .nw-label { grid-column:2; font-size:var(--nw-fs-label); line-height:13px; font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; color:var(--nw-fg2); white-space:nowrap; }
  .nw-bubble b { grid-column:2; font-size:var(--nw-fs-text); line-height:16px; font-weight:500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nw-bubble.out { opacity:0; transform:translateY(-5px); }
  /* Alert: the same bubble, tinted by its level, with a breathing halo (a fixed shadow whose opacity pulses: no repaint). */
  .nw-bubble--alert { --al:var(--nw-level1); position:relative; border-color:color-mix(in oklab, var(--al) 60%, transparent);
    background:linear-gradient(100deg, color-mix(in oklab, var(--nw-bg) 72%, var(--al)), color-mix(in oklab, var(--nw-bg) 90%, var(--al)));
    box-shadow:0 0 6px 0 color-mix(in oklab, var(--al) 32%, transparent), 0 4px 18px -10px color-mix(in oklab, var(--al) 65%, transparent); }
  .nw-bubble--alert::after { content:''; position:absolute; inset:-1px; border-radius:inherit; box-shadow:0 0 16px 2px color-mix(in oklab, var(--al) 55%, transparent);
    opacity:0; animation:nw-glow 5.2s ease-in-out infinite; animation-play-state:var(--nw-motion, running); pointer-events:none; }
  .nw-bubble--alert ha-icon { color:color-mix(in oklab, var(--al) 70%, var(--nw-fg)); }
  .nw-bubble--alert .nw-label { color:color-mix(in oklab, var(--al) var(--nw-ink), var(--nw-fg)); }
  /* Official vigilance in the banner: a compact pill, its icon in a disc of the level's colour, the same outline and halo as the alert bubble. */
  .nw-alert { --al:var(--nw-level1); position:relative; display:inline-flex; align-items:center; gap:8px; max-width:100%; box-sizing:border-box; margin:0;
    padding:3px 14px 3px 3px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-text); line-height:18px; color:var(--nw-fg);
    background:color-mix(in srgb, var(--al) 30%, color-mix(in srgb, var(--nw-bg) 55%, transparent)); border:1px solid color-mix(in oklab, var(--al) 60%, transparent);
    backdrop-filter:var(--nw-blur); box-shadow:0 0 6px 0 color-mix(in oklab, var(--al) 32%, transparent), 0 4px 18px -10px color-mix(in oklab, var(--al) 65%, transparent); }
  .nw-alert::after { content:''; position:absolute; inset:-1px; border-radius:inherit; box-shadow:0 0 16px 2px color-mix(in oklab, var(--al) 55%, transparent);
    opacity:0; animation:nw-glow 5.2s ease-in-out infinite; animation-play-state:var(--nw-motion, running); pointer-events:none; }
  .nw-alert .dot { display:grid; place-items:center; width:24px; height:24px; flex:none; border-radius:50%; background:var(--al); color:#2b2620; }
  .nw-alert .dot ha-icon { --mdc-icon-size:14px; display:flex; line-height:0; }
  .nw-alert > span:last-child { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nw-alert b { font-weight:650; }
  /* On a narrow card the phenomenon is enough: the disc's colour and the halo give the level, screen readers still read it. */
  @container (max-width:400px) { .nw-alert b { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; } }
  /* The level's colour, after the pieces that set the yellow of level 1. */
  .nw-level2 { --al:var(--nw-level2); } .nw-level3 { --al:var(--nw-level3); }
  @keyframes nw-glow { 50% { opacity:1; } }
  @media (prefers-reduced-motion:reduce) { .nw-bubble { transition:none; } .nw-bubble--alert::after, .nw-alert::after { animation:none; } }
`;var gi={Lieu:"Place",Format:"Format","Ciel anim\xE9 et halos":"Animated sky and halos","Qualit\xE9 des animations":"Animation quality","Effet verre d\xE9poli":"Frosted glass effect","Bandeau (synth\xE8se et m\xE9t\xE9o du moment)":"Banner (summary and current weather)","Bulletin du jour":"Today\u2019s bulletin","Alertes et \xE9v\xE9nements":"Alerts and events","Section Aujourd\u2019hui":"Today section","Aujourd\u2019hui repli\xE9 au d\xE9part":"Today folded at first","Section Pr\xE9visions":"Forecast section","Pr\xE9visions repli\xE9es au d\xE9part":"Forecast folded at first","D\xE9tail des polluants et des pollens":"Pollutant and pollen details","Air et pollens de demain":"Tomorrow\u2019s air and pollen","Page \xE0 ouvrir":"Page to open","Contenu de la tuile d\xE9pli\xE9e":"Unfolded tile content","Pr\xE9visions affich\xE9es au d\xE9part":"Forecast shown at first","Contenu du bandeau":"Banner content","Contenu d\u2019Aujourd\u2019hui":"Today content","Contenu des Pr\xE9visions":"Forecast content","Appui long":"Long press",Appui:"Tap","Courbe de pression":"Pressure chart","Courbe du vent":"Wind chart","Barres de pluie":"Rain bars","Heure dans le bandeau":"Time in the banner","Coup\xE9es, le ciel et les halos restent fixes.":"Off, the sky and the halos stay still.","All\xE9g\xE9e : moins de gouttes, de flocons et de nuages.":"Light: fewer drops, flakes and clouds.","Le flou demande beaucoup de ressources : \xE0 couper sur un appareil lent. Coup\xE9, le verre devient plus opaque.":"The blur takes a lot of power: switch it off on a slow device. Off, the glass becomes more opaque.","La vigilance, l\u2019alerte mesur\xE9e chez vous et la frise des \xE9v\xE9nements. Coup\xE9, la frise ne montre que le ciel pr\xE9vu.":"The weather warning, the alert measured at home and the events timeline. Off, the timeline only shows the forecast sky.","Le chemin de la page, par exemple /meteo ou /lovelace/meteo.":"The page\u2019s path, for example /weather or /lovelace/weather.","Cochez ce qui s\u2019affiche quand la tuile est d\xE9pli\xE9e, et faites glisser pour changer l\u2019ordre.":"Tick what shows when the tile is unfolded, and drag to change the order.","Le bandeau et son ciel anim\xE9 restent toujours, avec le lieu, la vigilance et la m\xE9t\xE9o du moment. Cochez ce qu\u2019il montre en dessous, dans l\u2019ordre.":"The banner and its animated sky always stay, with the place, the weather warning and the current weather. Tick what it shows below, in order.","Tout d\xE9cocher retire la section.":"Untick everything to remove the section.","Un appui sur Heures ou Jours change l\u2019affichage ; ce choix est gard\xE9 sur chaque appareil.":"A tap on Hours or Days switches the view; the choice is kept on each device.","Sur plusieurs jours, on voit mieux arriver une d\xE9pression ou un anticyclone.":"Over several days, a low or a high is easier to see coming.","24 heures et 30 jours demandent un pluviom\xE8tre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours.":"24 hours and 30 days need a rain gauge whose statistics Home Assistant keeps; otherwise the card shows 7 days.","L\u2019heure de l\u2019appareil, mise \xE0 jour chaque minute.":"The device\u2019s time, updated every minute.","Compl\xE8te : la page m\xE9t\xE9o":"Full: the weather page","Tuile : une bande qui se d\xE9plie d\u2019un appui":"Tile: a band that unfolds with a tap","Tuile d\xE9pli\xE9e : la m\xEAme, ouverte au d\xE9part":"Unfolded tile: the same, open at first","Mini : une seule ligne":"Mini: a single line","Pr\xE9visions : les heures et les jours":"Forecast: the hours and the days","Pluie : \xE0 venir et tomb\xE9e":"Rain: coming and fallen","Alerte : visible seulement en cas de vigilance ou d\u2019alerte":"Alert: only shown during a weather warning or an alert","\xC9v\xE9nements (la frise)":"Events (the timeline)","Les prochains moments (soir, nuit, matin\u2026)":"The coming moments (evening, night, morning\u2026)","Pr\xE9visions (heures ou jours)":"Forecast (hours or days)",Heures:"Hours",Jours:"Days","D\xE9plier ou replier la tuile":"Unfold or fold the tile","Ouvrir la m\xE9t\xE9o compl\xE8te en fen\xEAtre":"Open the full weather in a window","Ouvrir une page":"Open a page",Rien:"Nothing","Visuel et performance":"Look and performance",Standard:"Standard",All\u00E9g\u00E9e:"Light",Fonctionnalit\u00E9s:"Features",Contenu:"Content","6 derni\xE8res heures":"Last 6 hours","24 derni\xE8res heures":"Last 24 hours","2 derniers jours":"Last 2 days","7 derniers jours":"Last 7 days","30 derniers jours":"Last 30 days","Bandeau intelligent":"Smart banner","Pr\xE9visions en tuiles (heures ou jours)":"Forecast tiles (hours or days)",Masqu\u00E9e:"Hidden","Sous le titre, en grand":"Under the title, large","Au-dessus de \xAB En ce moment \xBB":"Above \u201CRight now\u201D","Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)":"Chips (humidity, dew, sun\u2026)","Air et pollens du jour":"Today\u2019s air and pollen","24 derni\xE8res heures (une barre par heure)":"Last 24 hours (one bar an hour)","30 derniers jours (une barre par jour)":"Last 30 days (one bar a day)","Les 18 prochaines heures":"The next 18 hours","Les 7 prochains jours":"The next 7 days","Air et pollens":"Air and pollen","L\u2019int\xE9gration Hestia Weather ne r\xE9pond pas : la carte en a besoin depuis la version 2.0.":"The Hestia Weather integration does not answer: the card needs it since version 2.0.","D\xE9j\xE0 t\xE9l\xE9charg\xE9e ?":"Already downloaded?","Ajoutez-la":"Add it","Sinon,":"Otherwise,","installez-la":"install it","Ajoutez l\u2019int\xE9gration Hestia Weather : Param\xE8tres \u2192 Appareils et services.":"Add the Hestia Weather integration: Settings \u2192 Devices & services.","Lieu :":"Place:","Les sources (pr\xE9visions, station, air et pollens) se r\xE8glent dans":"The sources (forecast, station, air and pollen) are set in","l\u2019int\xE9gration Hestia Weather":"the Hestia Weather integration","Hestia Weather a besoin de son int\xE9gration":"Hestia Weather needs its integration","Depuis la version 2.0, la carte re\xE7oit ses calculs de l\u2019int\xE9gration Hestia Weather. D\xE9j\xE0 t\xE9l\xE9charg\xE9e depuis HACS ? Ajoutez-la dans Param\xE8tres \u2192 Appareils et services. Sinon, installez-la depuis HACS, red\xE9marrez Home Assistant, puis ajoutez-la. D\xE9j\xE0 ajout\xE9e ? Elle n\u2019a pas d\xE9marr\xE9 : les journaux disent pourquoi (Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB).":"Since version 2.0, the card gets its figures from the Hestia Weather integration. Already downloaded from HACS? Add it in Settings \u2192 Devices & services. Otherwise, install it from HACS, restart Home Assistant, then add it. Already added? It did not start: the logs say why (Settings \u2192 System \u2192 Logs, search for \u201Cweather\u201D).","Ajouter l\u2019int\xE9gration":"Add the integration","L\u2019installer":"Install it","Ajoutez l\u2019int\xE9gration Hestia Weather":"Add the Hestia Weather integration","Elle est install\xE9e mais pas encore configur\xE9e. Elle peut reprendre les r\xE9glages de vos cartes.":"It is installed but not set up yet. It can take over your cards\u2019 settings.","Choisissez un lieu":"Choose a place","Plusieurs lieux Hestia Weather sont configur\xE9s : choisissez celui de cette carte dans ses r\xE9glages.":"Several Hestia Weather places are set up: choose this card\u2019s place in its settings.","Lieu introuvable":"Place not found","Le lieu de cette carte n\u2019existe plus : choisissez-en un autre dans ses r\xE9glages.":"This card\u2019s place no longer exists: choose another one in its settings.","Rechargez la page":"Reload the page","L\u2019int\xE9gration Hestia Weather vient d\u2019\xEAtre mise \xE0 jour : rechargez la page pour afficher sa carte.":"The Hestia Weather integration has just been updated: reload the page to show its card.","L\u2019int\xE9gration Hestia Weather a renvoy\xE9 une erreur":"The Hestia Weather integration returned an error","Les journaux de Home Assistant disent pourquoi : Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB.":"Home Assistant\u2019s logs say why: Settings \u2192 System \u2192 Logs, search for \u201Cweather\u201D.","Voir les journaux":"See the logs","Chargement de la m\xE9t\xE9o":"Loading the weather",M\u00E9t\u00E9o:"Weather","M\xE9t\xE9o \xE0 {place}":"Weather in {place}",Fermer:"Close","Hestia - M\xE9t\xE9o":"Hestia - Weather",Maintenant:"Now",maintenant:"now",minuit:"midnight",midi:"noon","N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO":"N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW","Vent du {from} jusqu\u2019\xE0 {speed} km/h":"Wind from {from} up to {speed} km/h","Vent jusqu\u2019\xE0 {speed} km/h":"Wind up to {speed} km/h","Vent du {from} {speed} km/h":"Wind from {from} {speed} km/h","Vent {speed} km/h":"Wind {speed} km/h",", rafales {gust} km/h":", gusts {gust} km/h","Qu\u2019est-ce que : {title} ?":"What is: {title}?",Exemple:"Example","{label} : {text}":"{label}: {text}"," ; ":"; ","concentration indisponible":"concentration unavailable","donn\xE9es anciennes":"old data","Pr\xE9vision non disponible":"Forecast not available","Indice non configur\xE9":"Index not set up","Donn\xE9es anciennes":"Old data","\xC9v\xE9nement signal\xE9":"Event reported","Air ext\xE9rieur demain":"Outdoor air tomorrow","Air ext\xE9rieur aujourd\u2019hui":"Outdoor air today","Pollens demain":"Pollen tomorrow","Pollens aujourd\u2019hui":"Pollen today","Air ext\xE9rieur":"Outdoor air",Pollens:"Pollen",Demain:"Tomorrow","Indice de demain":"Tomorrow\u2019s index","Indice du jour":"Today\u2019s index","Niveau {value} sur {scale}":"Level {value} of {scale}","Code 7 \xB7 hors \xE9chelle":"Code 7 \xB7 off the scale","Indice pollen non fourni":"Pollen index not given","Niveau indisponible":"Level unavailable","Atmo France ne fournit pas d\u2019indice pollen exploitable pour demain \xE0 cet endroit.":"Atmo France gives no usable pollen index for tomorrow at this place.","D\xE9tail des polluants":"Pollutant details","D\xE9tail des pollens":"Pollen details","Une concentration \xE0 0 peut \xEAtre une valeur r\xE9elle ou remplacer une donn\xE9e manquante chez Atmo France. Elle ne permet pas, \xE0 elle seule, de conclure \xE0 une absence de pollen.":"A concentration of 0 may be a real value or stand for missing data at Atmo France. On its own, it does not mean there is no pollen.","Publication Atmo : {date}.":"Published by Atmo: {date}.","Mise \xE0 jour {source} : {date}.":"Updated by {source}: {date}.","Certaines donn\xE9es sont anciennes : \xE0 v\xE9rifier dans l\u2019int\xE9gration.":"Some data is old: check it in the integration.","appui pour la page m\xE9t\xE9o":"tap for the weather page","appui pour la carte compl\xE8te":"tap for the full card","Aucune alerte en ce moment.":"No alert right now.","Cette carte reste cach\xE9e tant que tout est calme.":"This card stays hidden while all is calm.","Alertes m\xE9t\xE9o : appui pour la carte compl\xE8te":"Weather alerts: tap for the full card","Pr\xE9visions affich\xE9es":"Forecast shown","Pr\xE9visions indisponibles pour le moment.":"Forecast unavailable for now.","Pas de pluie avant {hour}":"No rain before {hour}","Pas de pluie pr\xE9vue d\u2019ici 18 h":"No rain expected in the next 18 hours","dans l\u2019heure":"within the hour","sur 6 h":"over 6 hours","\xE0 partir de {hour}":"from {hour}","\xC0 venir":"Coming up","au plus sur 6 h":"at most over 6 hours","en rafales":"in gusts","vent fort \xE0 partir de {hour}":"strong wind from {hour}","Votre fournisseur m\xE9t\xE9o ne pr\xE9voit pas la pression.":"Your weather provider does not forecast the pressure.","Pression stable sur 6 h":"Steady pressure over 6 hours","vers {hour}":"around {hour}","Orage pr\xE9vu vers {hour}":"Storm expected around {hour}","Pas d\u2019orage pr\xE9vu d\u2019ici 6 h":"No storm expected in the next 6 hours","\xC0 venir : le vent le plus fort des 6 heures":"Coming up: the strongest wind of the next 6 hours","\xC0 venir : la pression des 6 heures, si votre fournisseur la pr\xE9voit":"Coming up: the pressure of the next 6 hours, if your provider forecasts it","\xC0 venir : un orage pr\xE9vu dans les 6 heures":"Coming up: a storm expected within 6 hours",Pr\u00E9visions:"Forecast","18 prochaines heures":"Next 18 hours","Temp\xE9ratures de {low} \xE0 {high} \xB0C":"Temperatures from {low} to {high} \xB0C",", pluie jusqu\u2019\xE0 {mm} mm par heure":", rain up to {mm} mm an hour",", pas de pluie pr\xE9vue":", no rain expected",Temp\u00E9rature:"Temperature",Nuit:"Night","Vent km/h":"Wind km/h","{n} prochains jours":"Next {n} days","Temp\xE9ratures minimales et maximales en \xB0C, pluie en mm, vent maximal en km/h":"Lowest and highest temperatures in \xB0C, rain in mm, strongest wind in km/h",Min:"Low",Max:"High","Aujourd\u2019hui":"Today","aujourd\u2019hui":"today","Mesures et ressenti":"Measurements and feel","Conditions actuelles":"Current conditions","Vigilance officielle":"Official warning",Synth\u00E8se:"Summary","La m\xE9t\xE9o du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.":"Today\u2019s weather in one sentence, with what matters now and what is coming.","\xC0 v\xE9rifier":"To check","\xAB Pluie ce soir, puis \xE9claircies demain matin. \xBB":"\u201CRain this evening, then sunny spells tomorrow morning.\u201D","La temp\xE9rature monte":"The temperature is rising","La temp\xE9rature baisse":"The temperature is falling","page m\xE9t\xE9o":"weather page","carte compl\xE8te":"full card",replier:"fold",d\u00E9plier:"unfold","Les prochains moments":"The coming moments","Pr\xE9vu aujourd\u2019hui : {range}":"Expected today: {range}","mini {t} \xB0C":"low {t} \xB0C","maxi {t} \xB0C":"high {t} \xB0C","En ce moment":"Right now","Temp\xE9rature indisponible":"Temperature unavailable","{source} : {t} degr\xE9s Celsius":"{source}: {t} degrees Celsius",\u00C9v\u00E9nements:"Events","appui pour {goal}":"tap to {goal}","appui long pour {goal}":"long press to {goal}","Appui : {goal}":"Tap: {goal}","Appui long : {goal}":"Long press: {goal}",Pluie:"Rain",Vent:"Wind",Pression:"Pressure",Ressenti:"Feels like","\u22122 j":"\u22122 d","\u22121 j":"\u22121 d","\u22127 j":"\u22127 d","\u221230 j":"\u221230 d","\u221215 j":"\u221215 d","{gap} \xB0C par rapport au thermom\xE8tre":"{gap} \xB0C compared with the thermometer","{gap} \xB0C par rapport \xE0 la temp\xE9rature du bulletin":"{gap} \xB0C compared with the forecast temperature","C\u2019est la temp\xE9rature que le corps per\xE7oit. L\u2019humidit\xE9 et le soleil la font monter, le vent la fait baisser.":"It is the temperature the body feels. Humidity and sun push it up, wind brings it down.","C\u2019est une estimation, pas un indice officiel.":"It is an estimate, not an official index.","En savoir plus":"Learn more","En ce moment : {example}.":"Right now: {example}.","25 \xB0C au thermom\xE8tre dans un air tr\xE8s humide se ressentent comme 30 \xB0C.":"25 \xB0C on the thermometer in very humid air feels like 30 \xB0C.","Thermom\xE8tre {t} \xB0C":"Thermometer {t} \xB0C","Bulletin {t} \xB0C":"Forecast {t} \xB0C","Ressenti {t} \xB0C":"Feels like {t} \xB0C","en ce moment":"right now","Pluie des {period}":"Rain, {period}",indisponible:"unavailable","au moins {mm} mm":"at least {mm} mm","Vent des {period}, moyennes et rafales":"Wind, {period}, mean and gusts",Rafales:"Gusts","Pression des {period}":"Pressure, {period}","Contenu de la carte":"Card content","Cochez ce que la carte montre.":"Tick what the card shows.","Ressenti : la temp\xE9rature per\xE7ue":"Feels like: the temperature you feel","Vent : le vent du moment et sa courbe":"Wind: the wind now and its chart","Pression : la pression et sa courbe":"Pressure: the pressure and its chart","Air et pollens : aujourd\u2019hui et demain":"Air and pollen: today and tomorrow","Le ressenti et son explication":"Feels like, and why","La jauge de \u22125 \xE0 45 \xB0C":"The gauge from \u22125 to 45 \xB0C","Ce qui le fait varier (humidit\xE9, vent, soleil)":"What changes it (humidity, wind, sun)","\xC0 venir : la prochaine heure et les 6 heures":"To come: the next hour and the next 6 hours","Tomb\xE9e aujourd\u2019hui, et en ce moment":"Fallen today, and right now","Les barres de pluie":"The rain bars","Les cumuls":"The totals","Le vent du moment et sa direction":"The wind now and its direction","La courbe":"The chart","Rafales, direction et maximum du jour":"Gusts, direction and today\u2019s maximum","La pression et sa tendance":"The pressure and its trend","Les valeurs pass\xE9es, le minimum et le maximum":"Past values, the minimum and the maximum","Rien \xE0 afficher : cochez au moins un \xE9l\xE9ment dans les r\xE9glages de la carte.":"Nothing to show: tick at least one item in the card\u2019s settings.","Ressenti indisponible pour le moment.":"Feels like unavailable for now.","Pluie indisponible pour le moment.":"Rain unavailable for now.","Vent indisponible pour le moment.":"Wind unavailable for now.","Pression indisponible pour le moment.":"Pressure unavailable for now.","Air et pollens indisponibles pour le moment.":"Air and pollen unavailable for now.","Type de carte":"Card type","Grandes cartes : la page m\xE9t\xE9o et la tuile":"Large cards: the weather page and the tile","Petites cartes : une ligne ou une alerte":"Small cards: one line or an alert","Hestia - \xC0 la pi\xE8ce":"Hestia - Single card","Hestia - Petite carte":"Hestia - Small card","La page m\xE9t\xE9o compl\xE8te ou la tuile qui se d\xE9plie. Le format se choisit dans les r\xE9glages.":"The full weather page or the tile that unfolds. The format is chosen in the settings.","Une seule ligne, ou une alerte visible seulement en cas de vigilance.":"A single line, or an alert shown only during a warning.","Cartes \xE0 la pi\xE8ce : ressenti, pluie, vent, pression, \xE9clairs, air, pr\xE9visions":"Single cards: feels like, rain, wind, pressure, lightning, air, forecast","Une seule partie : ressenti, pluie, vent, pression, \xE9clairs, air et pollens ou pr\xE9visions.":"A single part: feels like, rain, wind, pressure, lightning, air and pollen, or forecast.","Seulement en cas d\u2019orage":"Only during a storm","Cach\xE9e tant qu\u2019aucun orage n\u2019est \xE0 moins de 30 km ; visible pendant la modification du tableau de bord.":"Hidden while no storm is within 30 km; shown while the dashboard is edited.","\xC9clairs : le radar des orages (Blitzortung)":"Lightning: the storm radar (Blitzortung)","L\u2019\xE9clair le plus proche et sa direction":"The nearest strike and its direction","Le radar et le niveau":"The radar and the level","Les comptes (heure, 10 minutes, mois)":"The counts (hour, 10 minutes, month)","\xC9clairs (avec Blitzortung)":"Lightning (with Blitzortung)",Calme:"Calm",Secteur:"Area",Proche:"Close","Sur vous":"Overhead","{n} \xE9clairs":"{n} strikes","{n} \xE9clair":"{n} strike","\xC9clairs de la derni\xE8re heure autour de chez vous":"Lightning of the last hour around your home",N:"N",E:"E",S:"S",O:"W","Niveau : {step}":"Level: {step}",\u00C9clairs:"Lightning","ce mois":"this month","\xC0 moins de {km} km.":"Within {km} km.","Dans l\u2019heure":"Last hour","En 10 min":"Last 10 min","Ce mois":"This month",Dernier:"Last","il y a {n} min":"{n} min ago","Derni\xE8re heure \xB7 en rouge, les 10 derni\xE8res minutes":"Last hour \xB7 in red, the last 10 minutes","Cette carte montre les \xE9clairs autour de chez vous gr\xE2ce \xE0 Blitzortung, un r\xE9seau de d\xE9tecteurs b\xE9n\xE9voles. Installez l\u2019extension depuis HACS, puis choisissez-la dans les r\xE9glages de Hestia Weather.":"This card shows lightning around your home thanks to Blitzortung, a network of volunteer detectors. Install the extension from HACS, then choose it in the Hestia Weather settings.","Installer Blitzortung":"Install Blitzortung","R\xE9glages de Hestia Weather":"Hestia Weather settings"};var wi={en:gi},ze="fr",bt="fr-FR";function Me(e,i){let t=(e??"").toLowerCase().split("-")[0],n=t==="fr"?"fr":wi[t]?t:"en",a=n==="fr"?"fr-FR":i||e||"en",s=n!==ze||a!==bt;return ze=n,bt=a,s}function bi(){let e;try{e=document.querySelector("home-assistant")?.hass?.language}catch{}try{e??=JSON.parse(localStorage.getItem("selectedLanguage")??"null")??void 0}catch{}Me(e||document.documentElement.lang||navigator.language)}var De=()=>bt;function r(e,i){let t=ze==="fr"?e:wi[ze]?.[e]??e;return i?t.replace(/\{(\w+)\}/g,(n,a)=>a in i?String(i[a]):n):t}var fe=e=>ze==="fr"?`${e} h`:`${String(e).padStart(2,"0")}:00`,ce=e=>e===0?r("minuit"):e===12?r("midi"):fe(e),Y=(e,i)=>r("{label} : {text}",{label:e,text:i}),f=e=>e;var vi=new Map,xi=new Map;function yi(e,i={}){let t=JSON.stringify([e,i]),n=vi.get(t);return n||vi.set(t,n=new Intl.DateTimeFormat(e,i)),n}function $i(e,i={}){let t=JSON.stringify([e,i]),n=xi.get(t);return n||xi.set(t,n=new Intl.NumberFormat(e,i)),n}var y=(e,i=1,t=!1)=>$i(De(),{maximumFractionDigits:i,minimumFractionDigits:t?i:0}).format(e),Ue=e=>e.replace(/(\d) (°C|km\/h|mm|%|hPa)/g,"$1\xA0$2"),ne=e=>`--c:var(--nw-${e})`,ge=e=>`color-mix(in oklab,var(--nw-heat) ${Math.round(Math.min(100,Math.max(0,(e-5)/25*100)))}%,var(--nw-cold))`,J=e=>e??p,A=e=>o`<span class="nw-label">${e}</span>`,Ln=e=>o`<span class="nw-badge" title=${e}>${e}</span>`;function E(e){return o`<span class="nw-chip" style=${ne(e.theme)} data-entity=${J(e.entity)} role=${e.entity?"button":p} tabindex=${e.entity?0:p}>
    <ha-icon icon=${e.icon}></ha-icon>${e.value?o`<b>${e.value}</b>`:p}${e.label}</span>`}function Ne(e,i=""){return o`<p class=${`nw-bubble ${i}`} data-theme=${e.theme??p} style=${e.theme?ne(e.theme):p}>
    <ha-icon icon=${e.icon}></ha-icon><span class="nw-label">${e.label}</span><b title=${e.text}>${e.text}</b></p>`}function Ge(e,i=""){return o`<p class=${`nw-bubble nw-bubble--alert nw-level${e.level} ${i}`} role="status">
    <ha-icon icon=${e.icon}></ha-icon>${e.label?o`<span class="nw-label">${e.label}</span>`:p}<b title=${e.text}>${e.text}</b></p>`}function pe(e){return o`<p class=${`nw-alert nw-level${e.level}`} role="status" title=${e.source} data-entity=${J(e.entity)}>
    <span class="dot"><ha-icon icon=${e.icon}></ha-icon></span><span>${e.label?o`<b>${e.label}<span class="sep"> · </span></b>`:p}${e.text}</span></p>`}var Rn=e=>r("N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO").split(" ")[Math.round((e%360+360)%360/22.5)%16];function Le(e,i,t,n=!1){let a=i===void 0?"":Rn(i),s=n?a?r("Vent du {from} jusqu\u2019\xE0 {speed} km/h",{from:a,speed:e}):r("Vent jusqu\u2019\xE0 {speed} km/h",{speed:e}):a?r("Vent du {from} {speed} km/h",{from:a,speed:e}):r("Vent {speed} km/h",{speed:e});return t===void 0?s:`${s}${r(", rafales {gust} km/h",{gust:t})}`}var we=e=>B`<svg viewBox="0 0 10 10" aria-hidden="true" style=${`transform:rotate(${Math.round(e+180)}deg)`}><path d="M5 0 9 10 5 7.5 1 10Z"/></svg>`;function Ke(e,i){return o`<button class="nw-info" type="button" popovertarget=${e} aria-label=${r("Qu\u2019est-ce que : {title} ?",{title:i.title})} @click=${ki}><ha-icon icon="mdi:information-variant"></ha-icon></button>
    <div class="nw-pop" id=${e} popover style=${`--nw-example-word:"${r("Exemple")}"`} @toggle=${jn} @click=${ki}><b>${i.title}</b>${i.text}${i.example?o`<div class="ex">${i.example}</div>`:p}</div>`}var ki=e=>e.stopPropagation();function jn(e){let i=e.currentTarget;if(e.newState!=="open")return;let t=i.getRootNode().querySelector(`[popovertarget="${i.id}"]`);if(!t)return;let n=t.getBoundingClientRect();i.style.top=`${Math.max(8,Math.min(n.bottom+8,innerHeight-i.offsetHeight-8))}px`,i.style.left=`${Math.max(8,Math.min(n.left-12,innerWidth-i.offsetWidth-8))}px`}function q(e,i,t,n,a){return o`<header class="nw-panel-head"><span class="nw-panel-icon" style=${ne(i)}><ha-icon icon=${e}></ha-icon></span>
    <h3><span>${t}</span>${a??p}</h3>${Ln(n)}</header>`}var he=(e,i,t="")=>o`<span><i class=${t} style=${t==="dash"?`--c:${i}`:`background:${i}`}></i>${e}</span>`;var ae=class extends V{constructor(){super(...arguments);this.points=[];this.index=0;this.leaving=!1}connectedCallback(){super.connectedCallback(),this.leaving=!1,this.timer=setInterval(()=>this.next(),5e3)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.timer),clearTimeout(this.swap)}willUpdate(t){if(!t.has("points"))return;let n=this.points.findIndex(a=>a.text===this.shown);if(n>=0){this.index=n;return}if(this.shown===void 0||this.reduced){this.index=0;return}this.leaving=!0,clearTimeout(this.swap),this.swap=setTimeout(()=>{this.index=0,this.leaving=!1},300)}get reduced(){return matchMedia("(prefers-reduced-motion: reduce)").matches}next(){let t=this.getRootNode().host;if(this.points.length<2||document.hidden||t?.matches(":hover, :focus-within"))return;let n=()=>{this.index=(this.index+1)%this.points.length,this.leaving=!1};if(this.reduced){n();return}this.leaving=!0,this.swap=setTimeout(n,350)}render(){let t=this.points[this.index%Math.max(1,this.points.length)];if(this.shown=t?.text,!t)return p;let n=this.leaving?"out":"";return o`<div aria-hidden="true">${"official"in t?Ge(t,n):Ne(t,n)}</div>
      <ul class="sr">${this.points.map(a=>o`<li>${a.label?Y(a.label,a.text):a.text}</li>`)}</ul>`}};ae.styles=[We,C`
    :host { display:block; min-width:0; }
    ha-icon { display:flex; line-height:0; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
  `],$([R({attribute:!1})],ae.prototype,"points",2),$([j()],ae.prototype,"index",2),$([j()],ae.prototype,"leaving",2),ae=$([Q("niak-ticker")],ae);var be=3600,Hn=1200,On=be,_i=18*be,Fn=3*be,Bn={sunny:"sun","clear-night":"night",partlycloudy:"partly",cloudy:"cloud",fog:"fog",rainy:"rain",pouring:"rain",lightning:"storm","lightning-rainy":"storm",snowy:"snow","snowy-rainy":"snow",hail:"hail",windy:"wind","windy-variant":"wind",exceptional:"cloud"},In=e=>e.condition==="sunny"&&e.night?"night":Bn[e.condition]??"cloud",vt=ce,Qe=e=>Math.min(3,Math.max(1,e));function xt(e,i,t,n,a){let s=t.filter(w=>w.time!==void 0),d=s[s.length-1],l=Math.max(Fn,Math.min(_i,d?d.time+be-n:_i)),c=w=>Math.max(0,Math.min(1,(w-n)/l)),h=(w,S)=>({at:w,clock:S??(w===void 0?"":vt(new Date(w*1e3).getHours())),now:w===void 0||w<=n+Hn}),m=w=>({label:w.label,icon:w.icon,text:w.text,theme:w.theme,alert:w.alert||w.level>=2?Qe(w.level):void 0,...h(w.at,w.clock)}),u=i.filter(w=>!w.official).map(w=>({label:w.label??r("Maintenant"),icon:w.icon,text:w.text,alert:Qe(w.level),...h(w.at,w.clock)})),g=a?a.map(m):[...u,...e.map(m)],v=[...g.filter(w=>w.now),...g.filter(w=>!w.now).sort((w,S)=>w.at-S.at)],k=(w,S,I)=>{let D=Math.max(0,...w.map(P=>v[P].alert??0));return{items:w,x:c(S),clock:I,theme:v[w[0]].theme,alert:D?Qe(D):void 0}},_=v.flatMap((w,S)=>w.now?[S]:[]),M=[];v.forEach((w,S)=>{if(w.now)return;let I=M[M.length-1];I&&w.at-v[I[0]].at<On?I.push(S):M.push([S])});let G=[..._.length?[k(_,n,r("Maintenant"))]:[],...M.map(w=>k(w,v[w[0]].at,v[w[0]].clock))],L=[];for(let w of s){let S=Math.max(w.time,n),I=Math.min(w.time+be,n+l);if(I<=S)continue;let D=In(w),P=L[L.length-1];P&&P.kind===D&&(D!=="partly"||P.icon===w.icon)?P.flex+=I-S:L.push({kind:D,icon:w.icon,flex:I-S})}let O=[{x:0,text:r("Maintenant"),edge:"first"}];for(let w of s)w.hour%6===0&&c(w.time)>.04&&c(w.time)<.9&&O.push({x:c(w.time),text:vt(w.hour)});return d&&O.push({x:1,text:vt((d.hour+Math.round((n+l-d.time)/be))%24),edge:"last"}),{items:v,groups:G,segments:L,marks:O}}var Re=4500,Vn=9e3,Ci=300,Ye=6,yt=10,$t=e=>`--tone:var(--nw-${e.theme??(e.alert?`level${e.alert}`:"calm")})`,qn=e=>e.stopPropagation(),K=class extends V{constructor(){super(...arguments);this.points=[];this.alerts=[];this.hours=[];this.index=0;this.paused=!1;this.step=Re;this.frise=xt([],[],[],0);this.built=0;this.due=0;this.left=Re;this.pause=t=>{t.pointerType==="touch"||this.paused||(this.paused=!0,clearTimeout(this.timer),this.left=Math.max(300,this.due-Date.now()))};this.resume=t=>{t.pointerType==="touch"||!this.paused||t.type==="pointerleave"&&this.matches(":focus-within")||(this.paused=!1,this.due=Date.now()+this.left,this.timer=setTimeout(()=>this.next(),this.left))}}connectedCallback(){super.connectedCallback(),this.schedule(Re),this.hasUpdated&&this.observe()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timer),clearTimeout(this.leave),this.resize?.disconnect()}willUpdate(t){let n=Date.now()/1e3;if(!t.has("points")&&!t.has("alerts")&&!t.has("hours")&&!t.has("timeline")&&n-this.built<Ci)return;let a=this.frise.items[this.index]?.text;this.frise=xt(this.points,this.alerts,this.hours,n,this.timeline),this.built=n;let s=this.frise.items.findIndex(d=>d.text===a);this.index=s>=0?s:0,this.leaving=void 0}firstUpdated(){this.observe()}updated(){this.layout()}observe(){let t=this.renderRoot.querySelector(".track");!t||typeof ResizeObserver>"u"||(this.resize?.disconnect(),this.resize=new ResizeObserver(()=>this.layout()),this.resize.observe(t))}schedule(t){clearTimeout(this.timer),this.step=t,this.left=t,this.due=Date.now()+t,this.paused||(this.timer=setTimeout(()=>this.next(),t))}next(){Date.now()/1e3-this.built>=Ci&&this.requestUpdate();let t=this.frise.items.length;if(t<2||document.hidden){this.schedule(Re);return}this.show((this.index+1)%t,Re)}show(t,n){t!==this.index&&(this.leaving=this.index,this.index=t,clearTimeout(this.leave),this.leave=setTimeout(()=>{this.leaving=void 0},460)),this.schedule(n)}pick(t){let n=t.items.indexOf(this.index);this.show(n<0?t.items[0]:t.items[(n+1)%t.items.length],Vn)}layout(){let t=this.renderRoot.querySelector(".track"),n=t?.clientWidth;if(!t||!n)return;let a=[...t.querySelectorAll(".pin")];t.classList.remove("compact"),(u=>u.reduce((g,v)=>g+v.offsetWidth+Ye,-Ye)<=n+2*yt)(a)||t.classList.add("compact");let d=a.map(u=>u.offsetWidth),l=a.map(u=>Number(u.dataset.x)*n);l.forEach((u,g)=>{l[g]=Math.max(u,d[g]/2-yt,g?l[g-1]+(d[g-1]+d[g])/2+Ye:-1/0)});for(let u=l.length-1;u>=0;u--)l[u]=Math.min(l[u],u===l.length-1?n-d[u]/2+yt:l[u+1]-(d[u+1]+d[u])/2-Ye);a.forEach((u,g)=>{u.style.left=`${Math.round(l[g])}px`}),t.querySelectorAll(".seg").forEach(u=>u.classList.toggle("tight",u.clientWidth<28));let c=[...this.renderRoot.querySelectorAll(".hours span")];if(c.forEach(u=>u.classList.remove("hide")),c.length<3)return;let h=c[c.length-1].getBoundingClientRect(),m=c[0].getBoundingClientRect();for(let u of c.slice(1,-1)){let g=u.getBoundingClientRect();g.left<m.right+18||g.right>h.left-18?u.classList.add("hide"):m=g}}render(){let{items:t,groups:n,segments:a,marks:s}=this.frise;if(!t.length&&!a.length)return p;let d=l=>l.now||!l.clock?l.label:`${l.label} \xB7 ${l.clock}`;return o`<div class=${`panel${this.paused?" paused":""}`} @pointerenter=${this.pause} @pointerleave=${this.resume} @focusin=${this.pause} @focusout=${this.resume}>
      ${t.length?o`<div class="head" aria-hidden="true">
        <div class="say">${t.map((l,c)=>o`<div class=${`item${c===this.index?" on":c===this.leaving?" off":""}${l.alert?" al":""}`}
          style=${`${$t(l)}${l.alert?`;--al:var(--nw-level${l.alert})`:""}`}>
          <span class="badge"><ha-icon icon=${l.icon}></ha-icon></span><div><div class="when">${d(l)}</div><div class="x" title=${l.text}>${l.text}</div></div></div>`)}</div>
        ${t.length>1?o`<div class="progress" style=${`--step:${this.step}ms`}>${t.map((l,c)=>o`<i class=${c===this.index?"on":c<this.index?"done":""}></i>`)}</div>`:p}
      </div>`:p}
      <div class=${`track${n.length?"":" bare"}`}>
        <div class="chips">${n.map(l=>{let c=l.items.includes(this.index),h=t[c?this.index:l.items[0]];return o`<button type="button" class=${`pin${c?" on":""}${l.alert?" al":""}`} data-x=${l.x}
            style=${`left:${(l.x*100).toFixed(2)}%;${$t(h)}${l.alert?`;--al:var(--nw-level${l.alert})`:""}`}
            aria-label=${l.items.map(m=>Y(d(t[m]),t[m].text)).join(r(" ; "))} @click=${()=>this.pick(l)} @pointerdown=${qn}>
            <span class="chip"><span class="stack">${l.items.map((m,u)=>o`<span class=${`mini${m===this.index||!c&&!u?" cur":""}`} style=${$t(t[m])}>
              <ha-icon icon=${t[m].icon}></ha-icon></span>`)}</span><span class="clock">${l.clock}</span>${l.items.length>1?o`<span class="count">${l.items.length}</span>`:p}</span>
            <span class="stem"></span></button>`})}</div>
        <div class="lane">${a.length?a.map(l=>o`<span class=${`seg s-${l.kind}`} style=${`flex:${l.flex}`}><ha-icon icon=${l.icon}></ha-icon></span>`):o`<span class="seg s-cloud" style="flex:1"></span>`}</div>
        <span class="needle"></span>
      </div>
      ${a.length?o`<div class="hours" aria-hidden="true">${s.map(l=>o`<span class=${l.edge??""} style=${`left:${(l.x*100).toFixed(2)}%`}>${l.text}</span>`)}</div>`:p}
      <ul class="sr">${t.map(l=>o`<li>${Y(d(l),l.text)}</li>`)}</ul>
    </div>`}};K.styles=C`
    :host { display:block; min-width:0; color:var(--nw-fg); }
    ha-icon { display:flex; line-height:0; }
    button { font:inherit; color:inherit; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
    /* Frosted glass: clear enough to see the animated sky through it, blurred enough to keep the text readable. Crisp 1 px outline. */
    .panel { position:relative; padding:12px 16px; border-radius:var(--nw-radius); border:1px solid var(--nw-line);
      background:var(--nw-glass-clear); backdrop-filter:var(--nw-frost); -webkit-backdrop-filter:var(--nw-frost); box-shadow:0 8px 24px rgb(15 25 45 / .08); }

    /* The sentence: one point at a time, sliding up. */
    .head { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
    /* Clipped for the slide, so it starts 3 px further left: the outline of the badge stays whole. */
    .say { position:relative; flex:1; min-width:0; height:38px; overflow:hidden; margin-left:-3px; }
    .item { position:absolute; inset:0 0 0 3px; display:flex; gap:10px; align-items:center; opacity:0; translate:0 100%; transition:opacity .45s var(--nw-ease), translate .45s var(--nw-ease); }
    .item.on { opacity:1; translate:0 0; } .item.off { opacity:0; translate:0 -100%; }
    .item > div { min-width:0; }
    .when { font-size:var(--nw-fs-label); line-height:13px; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; font-weight:700; white-space:nowrap;
      color:color-mix(in oklab, var(--tone) var(--nw-ink), var(--nw-fg)); }
    .x { font-size:var(--nw-fs-text); line-height:18px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .badge { display:grid; place-items:center; width:32px; height:32px; flex:none; border-radius:10px; background:color-mix(in srgb, var(--tone) 32%, var(--nw-bg)); }
    .badge ha-icon { --mdc-icon-size:18px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .item.al .badge { background:color-mix(in srgb, var(--al) 50%, var(--nw-bg)); box-shadow:0 0 0 1px color-mix(in oklab, var(--al) 70%, transparent); }
    .item.al .badge ha-icon { color:color-mix(in oklab, var(--al) 30%, var(--nw-fg)); }
    .item.al .when { color:color-mix(in oklab, var(--al) var(--nw-ink), var(--nw-fg)); }
    /* One bar per point: the one on show fills while it stays. */
    .progress { display:flex; gap:4px; flex:none; }
    .progress i { position:relative; width:18px; height:3px; border-radius:2px; background:var(--nw-line); overflow:hidden; }
    .progress i.done { background:color-mix(in srgb, var(--nw-fg2) 60%, transparent); }
    .progress i.on::after { content:''; position:absolute; inset:0; background:var(--nw-fg2); transform-origin:left; animation:fill var(--step) linear forwards; }
    .paused .progress i.on::after { animation-play-state:paused; }
    @keyframes fill { from { transform:scaleX(0); } }

    /* The track: labels above, the forecast sky as capsules, the needle of now on the left. */
    .track { position:relative; height:62px; margin:0 4px; }
    .track.bare { height:26px; }
    .chips { position:absolute; inset:0 0 auto; height:40px; }
    .pin { position:absolute; top:0; display:flex; flex-direction:column; align-items:center; translate:-50% 0; border:0; background:none; padding:0; cursor:pointer; }
    .pin:focus-visible { outline:none; } .pin:focus-visible .chip { outline:2px solid var(--nw-accent); outline-offset:2px; }
    .chip { --chip:var(--nw-glass-strong); position:relative; display:flex; gap:5px; align-items:center; padding:3px 6px 3px 4px; border-radius:var(--nw-radius-pill);
      white-space:nowrap; font-size:var(--nw-fs-small); line-height:16px; font-weight:600; font-variant-numeric:tabular-nums;
      background:var(--chip); border:1px solid transparent; transition:background .35s, transform .35s var(--nw-ease), box-shadow .35s; }
    /* The outline is drawn above the icons: the ring of the icon in front never eats into it. */
    .chip::before { content:''; position:absolute; inset:-1px; z-index:2; border-radius:inherit; border:1px solid var(--edge, var(--nw-line)); pointer-events:none; }
    .stem { width:1px; height:12px; background:var(--nw-line); }
    .pin.on .chip { --chip:color-mix(in srgb, var(--tone) 40%, var(--nw-bg)); transform:translateY(-2px); --edge:transparent; box-shadow:0 6px 14px rgb(0 0 0 / .12); }
    /* Stacked icons, all in the label's colour: each ringed with it to stand apart; the point on show is darker and comes forward. */
    .stack { display:flex; }
    .mini { position:relative; display:grid; place-items:center; width:20px; height:20px; border-radius:50%;
      background:color-mix(in srgb, var(--nw-fg) 6%, var(--chip)); box-shadow:0 0 0 2px var(--chip); transition:transform .3s var(--nw-ease), background .3s; }
    .mini + .mini { margin-left:-4px; }
    .mini ha-icon { --mdc-icon-size:13px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .mini.cur { z-index:1; background:color-mix(in srgb, var(--tone) 70%, var(--nw-bg)); }
    .pin.on .mini.cur { transform:scale(1.12); }
    .count { display:grid; place-items:center; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; border-radius:8px;
      font-size:var(--nw-fs-label); font-weight:700; background:var(--nw-fg); color:var(--nw-bg); }
    /* A label holding an alert: the charter's alert outline and halo (a fixed shadow whose opacity breathes). */
    .pin.al .chip { --edge:color-mix(in oklab, var(--al) 70%, transparent); box-shadow:0 0 6px 0 color-mix(in oklab, var(--al) 32%, transparent); }
    .pin.al .chip::after { content:''; position:absolute; inset:-1px; border-radius:inherit; pointer-events:none; opacity:0;
      box-shadow:0 0 14px 2px color-mix(in oklab, var(--al) 55%, transparent); animation:nw-glow 5.2s ease-in-out infinite; animation-play-state:var(--nw-motion, running); }
    .lane { position:absolute; left:0; right:0; top:40px; height:16px; display:flex; gap:2px; }
    .track.bare .lane { top:5px; }
    .seg { display:grid; place-items:center; min-width:0; height:100%; overflow:hidden; border-radius:5px; background:color-mix(in srgb, var(--tone) 80%, transparent); }
    .seg:first-child { border-radius:8px 5px 5px 8px; } .seg:last-child { border-radius:5px 8px 8px 5px; } .seg:only-child { border-radius:8px; }
    .seg ha-icon { --mdc-icon-size:11px; color:color-mix(in oklab, var(--tone) 30%, #1f2430); }
    .seg.tight ha-icon { display:none; }
    .s-sun { --tone:var(--nw-heat); } .s-night { --tone:color-mix(in oklab, var(--nw-pressure) 70%, var(--nw-cold)); }
    .s-partly { --tone:color-mix(in oklab, var(--nw-cold) 60%, var(--nw-heat)); } .s-cloud { --tone:color-mix(in srgb, var(--nw-fg2) 35%, var(--nw-bg)); }
    .s-rain { --tone:var(--nw-rain); } .s-storm { --tone:var(--nw-pressure); } .s-snow { --tone:var(--nw-cold); } .s-wind { --tone:var(--nw-wind); }
    .s-hail { --tone:color-mix(in oklab, var(--nw-cold) 55%, var(--nw-pressure)); } .s-fog { --tone:color-mix(in srgb, var(--nw-fg2) 22%, var(--nw-bg)); }
    .compact .clock { display:none; }
    .needle { position:absolute; left:0; top:34px; width:3px; height:28px; margin-left:-1.5px; border-radius:2px; background:var(--nw-fg); box-shadow:0 0 0 2px var(--nw-bg); }
    .track.bare .needle { top:0; height:26px; }
    .hours { position:relative; height:14px; margin:0 4px; font-size:var(--nw-fs-label); line-height:14px; color:var(--nw-fg2); letter-spacing:.04em; font-variant-numeric:tabular-nums; }
    .hours span { position:absolute; translate:-50% 0; white-space:nowrap; }
    .hours span.first { translate:0 0; } .hours span.last { translate:-100% 0; } .hours span.hide { visibility:hidden; }
    @keyframes nw-glow { 50% { opacity:1; } }
    @media (prefers-reduced-motion:reduce) {
      .item, .chip, .mini { transition:none; } .progress i.on::after { animation:none; } .pin.al .chip::after { animation:none; }
    }
  `,$([R({attribute:!1})],K.prototype,"points",2),$([R({attribute:!1})],K.prototype,"alerts",2),$([R({attribute:!1})],K.prototype,"hours",2),$([R({attribute:!1})],K.prototype,"timeline",2),$([j()],K.prototype,"index",2),$([j()],K.prototype,"leaving",2),$([j()],K.prototype,"paused",2),$([j()],K.prototype,"step",2),K=$([Q("niak-frise")],K);var Ti=["bulletin","events"];function Je(e,i){return e==="page"?r("page m\xE9t\xE9o"):e==="card"?r("carte compl\xE8te"):i?r("replier"):r("d\xE9plier")}function kt(e,i,t,n=p,a=""){return o`<div class="nw-tile" title=${a||p}>${A(e)}<ha-icon icon=${i}></ha-icon><strong>${t}</strong>${n}</div>`}var _t=(e,i=.1)=>e>=i?o`<span class="nw-ink" style=${ne("rain")}>${y(e)} mm</span>`:o`<span class="nw-ink">&nbsp;</span>`;function Ai(e,i,t){if(e===void 0)return o`<span class="tile-wind">&nbsp;</span>`;let n=Le(y(e,0),i,t!==void 0&&t>e?y(t,0):void 0);return o`<span class="tile-wind" title=${n} aria-label=${n}>${i===void 0?p:we(i)}${y(e,0)}</span>`}var Wn=e=>e.tmin===void 0?"\u2014":e.tmin===e.tmax?`${e.tmin} \xB0C`:`${e.tmin}\u2013${e.tmax} \xB0C`,Ct=e=>e.bulletin?.periods.length?o`<div class="block">${A(r("Les prochains moments"))}<div class="moments">${e.bulletin.periods.map(i=>kt(i.label,i.icon,Wn(i),o`<small>${i.phrase}</small>${i.rain>=1?_t(i.rain):p}`,i.text))}</div></div>`:p;function At(e,i,t,n=r("Pr\xE9visions")){let a=e.hours.slice(0,12).filter(c=>c.temperature!==void 0),s=e.days.slice(0,5);if(!a.length&&!s.length)return p;let d=a.length?s.length?i:"hours":"days",l=c=>h=>{h.stopPropagation(),t(c)};return o`<div class="block"><div class="block-title">${A(n)}
      ${a.length&&s.length?o`<span class="seg" role="group" aria-label=${r("Pr\xE9visions affich\xE9es")}>
        <button type="button" aria-pressed=${d==="hours"} @click=${l("hours")} @pointerdown=${Pi}>${r("Heures")}</button>
        <button type="button" aria-pressed=${d==="days"} @click=${l("days")} @pointerdown=${Pi}>${r("Jours")}</button></span>`:p}</div>
    ${d==="hours"?o`<div class="hours">${a.map(c=>kt(fe(c.hour),c.icon,`${y(c.temperature,0)}\xB0`,o`${_t(c.precipitation)}${Ai(c.wind,c.bearing,c.gust)}`,c.conditionLabel))}</div>`:o`<div class="days">${s.map(c=>kt(c.label,c.icon,c.high===void 0?"\u2014":`${c.high}\xB0`,o`<span class="lo">${c.low===void 0?"":`${c.low}\xB0`}</span>${_t(c.rain)}${Ai(c.wind,c.bearing,c.gust)}`,c.conditionLabel))}</div>`}</div>`}var Pi=e=>e.stopPropagation();function Dn(e){let i=e.days.find(n=>n.today);if(!i||i.low===void 0&&i.high===void 0)return p;let t=r("Pr\xE9vu aujourd\u2019hui : {range}",{range:[i.low===void 0?"":r("mini {t} \xB0C",{t:i.low}),i.high===void 0?"":r("maxi {t} \xB0C",{t:i.high})].filter(Boolean).join(", ")});return o`<span class="range" title=${t} aria-label=${t}>${i.low===void 0?p:o`<span>↓ ${i.low}°</span>`}${i.high===void 0?p:o`<span>↑ ${i.high}°</span>`}</span>`}function Pt(e,i,t=p,n=p){let a=e.now;return o`<div class="nw-now">${n}${i?A(r("En ce moment")):p}
    <span class="cond" data-entity=${a.conditionEntity??p} title=${a.source}><ha-icon icon=${a.icon}></ha-icon>${a.label}</span>
    ${a.temperature===void 0?o`<span class="cond">${r("Temp\xE9rature indisponible")}</span>`:o`<span class="temp" data-entity=${a.temperatureEntity??p} aria-label=${r("{source} : {t} degr\xE9s Celsius",{source:a.temperatureSource,t:y(a.temperature)})}>${y(a.temperature)}<small>°C</small></span>`}
    ${Dn(e)}${t}<span class="nw-badge">${a.temperatureSource}</span></div>`}var Tt=e=>e.points.length||e.alerts.length||e.hours.length||e.timeline?.length?o`<div class="nw-events">${A(r("\xC9v\xE9nements"))}<niak-frise .points=${e.points} .alerts=${e.alerts} .hours=${e.hours} .timeline=${e.timeline}></niak-frise></div>`:p;function Si(e,i,t){let n=e.alerts.filter(g=>g.official),[a,...s]=n,l=[...[...e.alerts.filter(g=>!g.official),...s].map(g=>({...g,alert:!0})),...e.points],c=e.bulletin?.summary,h=[["tap",t.tapTarget],["hold",t.holdTarget]].filter(([,g])=>g!=="none"),m=t.tapTarget==="toggle"||t.holdTarget==="toggle",u=h.filter(([g,v])=>g!=="tap"||v!=="toggle");return o`<div class=${`nw-tilecard${t.open?" open":""}${m?"":" fixed"}${e.now.darkSky?" dark-sky":""}${l.length?"":" quiet"}`}
      role="button" tabindex="0" aria-expanded=${m?t.open:p}
      aria-label=${`${e.location?r("M\xE9t\xE9o \xE0 {place}",{place:e.location}):r("M\xE9t\xE9o")}${h.length?` : ${h.map(([g,v])=>g==="tap"?r("appui pour {goal}",{goal:Je(v,t.open)}):r("appui long pour {goal}",{goal:Je(v,t.open)})).join(", ")}`:""}`}>
    <div class="sky" aria-hidden="true">${i}</div><div class="veil" aria-hidden="true"></div><i class="press-ring" aria-hidden="true"></i>
    <div class="top">
      <div class="meta">${e.location?o`<span class="place">${e.location}</span>`:p}${a?pe(a):p}
        ${s.map(g=>o`<div class="reveal"><div>${pe(g)}</div></div>`)}</div>
      <div class="brief"><div><div>${l.length?o`<niak-ticker .points=${l}></niak-ticker>`:p}</div></div></div>
      ${Pt(e,!1)}
    </div>
    <div class="grabber" aria-hidden="true"><i></i></div>
    <div class="more" ?inert=${!t.open}><div><div class="more-in">
      ${t.blocks.map(g=>g==="bulletin"?c?o`<div class="bulletin">${A(r("Bulletin du jour"))}<p class="nw-bulletin">${Ue(c)}</p></div>`:p:g==="events"?Tt(e):g==="moments"?Ct(e):At(e,t.tab,t.onTab))}
      <div class="foot"><span>${e.forecastSource}${e.now.temperatureSource!==e.forecastSource?` \xB7 ${e.now.temperatureSource.toLowerCase()}`:""}</span>
        ${u.length?o`<span>${u.map(([g,v])=>g==="tap"?r("Appui : {goal}",{goal:Je(v,!0)}):r("Appui long : {goal}",{goal:Je(v,!0)})).join(" \xB7 ")}</span>`:p}</div>
    </div></div></div>
  </div>`}var Ei=C`
  .nw-tilecard { position:relative; isolation:isolate; overflow:hidden; cursor:pointer; user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent;
    color:var(--nw-fg); border-radius:inherit; transition:box-shadow .2s; }
  .nw-tilecard:focus-visible { outline:2px solid var(--nw-accent); outline-offset:-2px; }
  /* The sky keeps its drawing size and shrinks as one block: clouds, sun and rain stay in proportion. */
  .sky { position:absolute; top:0; right:0; z-index:-2; width:calc(100% / var(--k)); height:calc(100% / var(--k)); transform:scale(var(--k)); transform-origin:top right; pointer-events:none; }
  .nw-tilecard .sky { --k:.5; --nw-orb-x:calc(100% - 370px); }
  .veil { position:absolute; inset:0; z-index:-1; pointer-events:none; }
  .nw-tilecard .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 96%, transparent) 18%,
    color-mix(in srgb, var(--nw-bg) 70%, transparent) 30%, color-mix(in srgb, var(--nw-bg) 30%, transparent) 46%, transparent 64%); }
  /* Unfolded, the timeline has its own frosted glass: the veil keeps the text side and fades the bottom softly, the ground still showing. */
  .nw-tilecard.open .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 92%, transparent) 30%, color-mix(in srgb, var(--nw-bg) 40%, transparent) 60%, transparent 85%),
    linear-gradient(0deg, color-mix(in srgb, var(--nw-bg) 55%, transparent) 0%, transparent 30%); }
  .top { display:grid; grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"meta now" "brief now"; column-gap:14px; row-gap:8px; padding:14px 16px; align-items:center; }
  .quiet .top { grid-template-areas:"meta now"; }
  .meta { grid-area:meta; align-self:start; display:flex; flex-direction:column; align-items:flex-start; gap:6px; min-width:0; }
  .place { font-size:var(--nw-fs-small); color:var(--nw-fg2); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .brief { grid-area:brief; min-width:0; min-height:38px; transition:min-height var(--nw-expand) var(--nw-ease); }
  .quiet .brief { display:none; }
  /* Unfolded, the scrolling bubble folds away: the timeline below shows the same points. */
  .brief > div { display:grid; grid-template-rows:1fr; transition:grid-template-rows var(--nw-expand) var(--nw-ease), opacity .25s; }
  .brief > div > div { min-height:0; overflow:clip; overflow-clip-margin:18px; }
  .open .brief { min-height:0; }
  .open .brief > div { grid-template-rows:0fr; opacity:0; }
  /* Anchored at the top: it does not move when the left column grows as the tile unfolds. */
  .top .nw-now { grid-area:now; align-self:start; position:relative; }
  /* The source fades in under the temperature, out of the flow: nothing moves. */
  .top .nw-now .nw-badge { position:absolute; top:100%; right:0; max-width:none; margin-top:6px; opacity:0; transform:translateY(-4px); transition:opacity .3s .15s, transform .3s .15s; pointer-events:none; }
  .open .top .nw-now .nw-badge { opacity:1; transform:none; }
  /* Folded, extra alerts wait in the scrolling bubble; unfolded, they open gently under the first one. */
  .reveal { display:grid; grid-template-rows:0fr; margin-top:-6px; opacity:0;
    transition:grid-template-rows var(--nw-expand) var(--nw-ease), margin-top var(--nw-expand) var(--nw-ease), opacity .3s .1s; }
  .reveal > div { min-height:0; overflow:clip; overflow-clip-margin:18px; }
  .open .reveal { grid-template-rows:1fr; margin-top:0; opacity:1; }
  /* The unfolding part: the height animates with grid-template-rows, no measuring in script. */
  /* Folded, the hidden part is not drawn at all (visibility waits for the end of the folding): its glass costs nothing on a phone. */
  .more { display:grid; grid-template-rows:0fr; visibility:hidden; transition:grid-template-rows var(--nw-expand) var(--nw-ease), visibility 0s linear var(--nw-expand); }
  .open .more { grid-template-rows:1fr; visibility:visible; transition:grid-template-rows var(--nw-expand) var(--nw-ease), visibility 0s; }
  .more > div { overflow:hidden; min-height:0; }
  .more-in { padding:0 16px 14px; display:flex; flex-direction:column; gap:12px; opacity:0; transform:translateY(-6px); transition:opacity .3s .1s, transform .3s .1s; }
  .open .more-in { opacity:1; transform:none; }
  .bulletin, .nw-events, .block { display:flex; flex-direction:column; gap:6px; }
  .bulletin, .nw-events { gap:4px; }
  /* Moments, hours and days: see-through tiles over the sky, without blur (it would be recomputed at every frame of the sky). */
  .moments, .hours, .days { display:grid; gap:8px; }
  .moments { grid-template-columns:repeat(4, minmax(0,1fr)); }
  .days { grid-template-columns:repeat(5, minmax(0,1fr)); }
  .hours { grid-auto-flow:column; grid-auto-columns:minmax(60px,1fr); overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
  .nw-tile { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; align-content:start; column-gap:8px; row-gap:3px;
    padding:10px 12px; border-radius:var(--nw-radius); min-width:0; box-sizing:border-box;
    background:color-mix(in srgb, var(--nw-bg) 72%, transparent); border:1px solid var(--nw-line); }
  .nw-tile > .nw-label, .nw-tile > small, .nw-tile > .nw-ink { grid-column:1/-1; }
  .nw-tile ha-icon { --mdc-icon-size:24px; }
  .nw-tile strong { font-size:var(--nw-fs-title); line-height:1.2; font-weight:700; letter-spacing:-.3px; white-space:nowrap; }
  .nw-tile small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .hours .nw-tile, .days .nw-tile { grid-template-columns:1fr; justify-items:center; text-align:center; padding:9px 6px; }
  .hours .nw-tile strong, .days .nw-tile strong { font-size:var(--nw-fs-text); }
  .days .lo { font-size:var(--nw-fs-small); font-weight:600; color:var(--nw-fg2); }
  .tile-wind { display:inline-flex; align-items:center; justify-content:center; gap:3px; font-size:var(--nw-fs-small); color:var(--nw-fg2); white-space:nowrap; }
  .tile-wind svg { width:10px; height:10px; fill:color-mix(in oklab, var(--nw-wind) 70%, var(--nw-fg)); }
  .block-title { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .seg { display:inline-flex; padding:2px; border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:color-mix(in srgb, var(--nw-bg) 72%, transparent); }
  .seg button { font-size:var(--nw-fs-small); line-height:1; font-weight:600; border:0; background:none; color:var(--nw-fg2); padding:5px 10px; border-radius:var(--nw-radius-pill); cursor:pointer; }
  .seg button[aria-pressed=true] { background:var(--nw-bg); color:var(--nw-fg); box-shadow:0 1px 3px #0002; }
  @container (max-width:600px) { .moments { grid-template-columns:repeat(2, minmax(0,1fr)); } }
  .foot { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px 10px; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .grabber { display:flex; justify-content:center; padding:0 0 8px; }
  .grabber i { width:34px; height:4px; border-radius:4px; background:var(--nw-line); }
  .open .grabber, .fixed .grabber { display:none; }
  /* Long press: a ring fills up under the finger. */
  .nw-tilecard.pressing { box-shadow:inset 0 0 0 3px color-mix(in srgb, var(--nw-accent) 45%, transparent); }
  .press-ring { position:absolute; width:44px; height:44px; margin:-22px 0 0 -22px; border-radius:50%; pointer-events:none; opacity:0;
    background:conic-gradient(var(--nw-accent) calc(var(--p, 0) * 1turn), transparent 0);
    -webkit-mask:radial-gradient(circle, transparent 15px, #000 16px); mask:radial-gradient(circle, transparent 15px, #000 16px); }
  .pressing .press-ring { opacity:.9; }
  @container (max-width:480px) {
    .top { grid-template-areas:"meta now" "brief brief"; }
    .nw-tilecard .sky { --k:.42; --nw-orb-x:calc(100% - 300px); }
    .days { grid-template-columns:repeat(5, minmax(58px,1fr)); overflow-x:auto; scrollbar-width:none; }
  }
  @media (prefers-reduced-motion:reduce) { .more, .more-in, .reveal, .brief, .brief > div, .top .nw-now .nw-badge { transition:none; } }
`;function St(e,i,t,n){let a=e.map((b,x)=>({h:b,i:x})).filter(b=>b.h.temperature!==void 0);if(a.length<3)return p;let s=e.length,d=100/(s-1),l=b=>b*d,c=a.map(b=>b.h.temperature),h=Math.min(...c)-1.5,m=Math.max(...c)+1.5,u=b=>(1-(b-h)/(m-h))*78+8,g=a.map(b=>[l(b.i),u(b.h.temperature)]),v=g.map(([b,x],z)=>z?`C${g[z-1][0]+(b-g[z-1][0])/2} ${g[z-1][1]} ${g[z-1][0]+(b-g[z-1][0])/2} ${x} ${b} ${x}`:`M${b} ${x}`).join(" "),k=a.reduce((b,x)=>x.h.temperature>b.h.temperature?x:b),_=a.reduce((b,x)=>x.h.temperature<b.h.temperature?x:b),M=Math.max(2,...e.map(b=>b.precipitation)),G=e.some(b=>b.precipitation>=.1),L=e.some(b=>b.wind!==void 0),O=[];e.forEach((b,x)=>{if(!b.night)return;let z=O.at(-1);z&&z[1]===x-1?z[1]=x:O.push([x,x])});let w=e.findIndex((b,x)=>x>0&&b.day>e[x-1].day),S=[1,4,7,10,13,16].filter(b=>b<s&&e[b].temperature!==void 0),I=b=>{let x=u(b.h.temperature);return o`<span class=${`pill${x<30?" low":""}`} style=${`left:${Math.min(94,Math.max(6,l(b.i)))}%;top:${x}%`}>${y(b.h.temperature,0)}°</span>`},D=`${n}-fs`,P=`${n}-fa`;return o`<section class="nw-panel" aria-label=${r("18 prochaines heures")}>${q("mdi:chart-bell-curve-cumulative","wind",r("18 prochaines heures"),i)}
    <div class="fc" data-entity=${t}>
      <div class="fc-marks">${w<0||l(w)>22?o`<span style="left:0">${r("Maintenant")}</span>`:p}${w>0?o`<span class="next" style=${`left:${l(w)}%`}>${r("Demain")}</span>`:p}</div>
      <div class="fc-plot" role="img" aria-label=${`${r("Temp\xE9ratures de {low} \xE0 {high} \xB0C",{low:y(_.h.temperature,0),high:y(k.h.temperature,0)})}${G?r(", pluie jusqu\u2019\xE0 {mm} mm par heure",{mm:y(Math.max(...e.map(b=>b.precipitation)))}):r(", pas de pluie pr\xE9vue")}`}>
        ${O.map(([b,x])=>{let z=Math.max(0,l(b)-d/2),X=Math.min(100,l(x)+d/2);return o`<i class="fc-night" style=${`left:${z}%;width:${X-z}%`}></i>`})}
        ${w>0?o`<i class="fc-divider" style=${`left:${l(w)}%`}></i>`:p}
        ${e.map((b,x)=>b.precipitation>=.1?o`<i class="fc-bar" title=${Y(fe(b.hour),`${y(b.precipitation)} mm`)} style=${`left:calc(${l(x)}% - 5px);height:${Math.max(6,b.precipitation/M*42)}%`}></i>`:p)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>
          <linearGradient id=${D} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)"/><stop offset="1" stop-color="var(--nw-cold)"/></linearGradient>
          <linearGradient id=${P} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)" stop-opacity=".28"/><stop offset="1" stop-color="var(--nw-cold)" stop-opacity="0"/></linearGradient></defs>
          ${B`<path d=${`${v} L${g.at(-1)[0]} 100 L${g[0][0]} 100Z`} fill=${`url(#${P})`}/><path class="fc-line" d=${v} stroke=${`url(#${D})`}/>`}</svg>
        <i class="fc-dot" style=${`left:${g[0][0]}%;top:${g[0][1]}%;--c:${ge(a[0].h.temperature)}`}></i>
        ${I(k)}${_.i!==k.i&&y(_.h.temperature,0)!==y(k.h.temperature,0)?I(_):p}
      </div>
      <div class="fc-hours">${S.map(b=>{let x=e[b];return o`<div style=${`left:${l(b)}%`} title=${x.conditionLabel}>${A(fe(x.hour))}<ha-icon icon=${x.icon}></ha-icon><b>${y(x.temperature,0)}°</b>
          ${x.wind===void 0?p:o`<span class="fc-wind" title=${Le(y(x.wind,0),x.bearing,x.gust!==void 0&&x.gust>x.wind?y(x.gust,0):void 0)}>${x.bearing===void 0?p:we(x.bearing)}${y(x.wind,0)}</span>`}</div>`})}</div>
    </div>
    <div class="nw-legend">${he(r("Temp\xE9rature"),"linear-gradient(90deg,var(--nw-cold),var(--nw-heat))")}${G?he(r("Pluie"),"var(--nw-rain)","sq"):p}
      ${O.length?he(r("Nuit"),"color-mix(in oklab,var(--nw-wind) 30%,transparent)","sq"):p}${L?o`<span>${we(200)}${r("Vent km/h")}</span>`:p}</div>
  </section>`}function Et(e,i,t){if(!e.length)return p;let n=e.flatMap(c=>c.low??c.high??[]),a=e.flatMap(c=>c.high??c.low??[]),s=Math.min(...n),d=Math.max(...a,s+1),l=c=>(c-s)/(d-s)*100;return o`<section class="nw-panel" aria-label=${r("{n} prochains jours",{n:e.length})}>${q("mdi:calendar-week","wind",r("{n} prochains jours",{n:e.length}),i)}
    <div class="wk" data-entity=${t} role="group" aria-label=${r("Temp\xE9ratures minimales et maximales en \xB0C, pluie en mm, vent maximal en km/h")}>
      <span></span><span></span>${A(r("Min"))}<span></span>${A(r("Max"))}${A(r("Pluie"))}${A(r("Vent"))}
      ${e.map((c,h)=>o`${h?o`<i class="rule"></i>`:p}<span class=${`day${c.today?" today":""}`}>${c.label}</span>
        <ha-icon icon=${c.icon} title=${c.conditionLabel}></ha-icon>
        <span class="lo">${c.low===void 0?"":`${c.low}\xB0`}</span>
        <span class="track">${c.low!==void 0&&c.high!==void 0?o`<i style=${`left:${l(c.low)}%;width:${Math.max(2,l(c.high)-l(c.low))}%;background:linear-gradient(90deg,${ge(c.low)},${ge(c.high)})`}></i>`:p}</span>
        <span class="hi">${c.high===void 0?"\u2014":`${c.high}\xB0`}</span>
        <span class="rain">${c.rain>=.1?`${y(c.rain)} mm`:""}</span>
        <span class="wind" title=${c.wind===void 0?"":Le(c.wind,c.bearing,c.gust!==void 0&&c.gust>c.wind?c.gust:void 0,!0)}>${c.wind===void 0?"":o`${c.bearing===void 0?p:we(c.bearing)}${c.wind}`}</span>`)}
    </div>
  </section>`}function zi(e,i,t,n,a=["hours","days","air"]){let s=a.map(l=>l==="hours"?St(e.hours,e.provider,i,t):l==="days"?Et(e.days,e.provider,i):p).filter(l=>l!==p),d=a.some(l=>l!=="air");return o`${s.length?o`<div class=${`panels${s.length===1?" single":""}`}>${s}</div>`:d?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:p}${a.includes("air")?n:p}`}var Mi=C`
  .panels { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(0,1fr); gap:16px; align-items:stretch; }
  .panels.single { grid-template-columns:minmax(0,1fr); }
  @container (max-width:980px) { .panels { grid-template-columns:minmax(0,1fr); } }
  /* 18 hours */
  .fc { display:grid; grid-template-rows:auto 168px auto; gap:6px; cursor:pointer; }
  .fc-marks { position:relative; height:14px; }
  .fc-marks span { position:absolute; top:0; font-size:var(--nw-fs-label); line-height:13px; font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; color:var(--nw-fg2); white-space:nowrap; }
  .fc-marks .next { transform:translateX(-50%); }
  .fc-plot { position:relative; border-radius:12px; background:linear-gradient(color-mix(in oklab, var(--nw-line) 40%, transparent) 1px, transparent 1px) 0 0/100% 42px; }
  .fc-night { position:absolute; top:0; bottom:0; background:color-mix(in oklab, var(--nw-wind) 14%, transparent); }
  .fc-plot svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .fc-line { fill:none; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
  .fc-bar { position:absolute; bottom:0; width:10px; border-radius:6px 6px 2px 2px; background:color-mix(in oklab, var(--nw-rain) 75%, transparent); }
  .fc-divider { position:absolute; top:0; bottom:0; width:0; border-left:1px dashed color-mix(in oklab, var(--nw-fg2) 55%, transparent); }
  .fc-dot { position:absolute; width:10px; height:10px; margin:-5px 0 0 -5px; border-radius:50%; background:var(--nw-bg); border:3px solid var(--c); }
  /* Each hour sits exactly under its point of the curve. */
  .fc-hours { position:relative; height:78px; }
  .fc-hours > div { position:absolute; top:0; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:3px; }
  .fc-hours ha-icon { --mdc-icon-size:20px; }
  .fc-hours b { font-size:var(--nw-fs-text); font-weight:700; }
  .fc-wind { display:inline-flex; align-items:center; gap:3px; font-size:var(--nw-fs-small); color:var(--nw-fg2); white-space:nowrap; }
  .fc-wind svg, .wk .wind svg { width:10px; height:10px; fill:color-mix(in oklab, var(--nw-wind) 70%, var(--nw-fg)); }
  /* 7 days */
  .wk { display:grid; grid-template-columns:auto auto auto minmax(40px,1fr) auto auto auto; align-items:center; column-gap:12px; row-gap:2px; cursor:pointer; }
  .wk > .nw-label { padding-bottom:4px; }
  .wk > .nw-label:nth-child(3), .wk > .nw-label:nth-child(6), .wk > .nw-label:nth-child(7) { text-align:right; }
  .wk .day { font-size:var(--nw-fs-text); font-weight:700; padding:7px 0; }
  .wk .day.today { color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); }
  .wk ha-icon { --mdc-icon-size:20px; color:var(--nw-fg2); }
  .wk .lo, .wk .hi { font-size:var(--nw-fs-text); font-variant-numeric:tabular-nums; }
  .wk .lo { color:var(--nw-fg2); text-align:right; } .wk .hi { font-weight:700; }
  .wk .track { position:relative; height:6px; border-radius:3px; background:color-mix(in oklab, var(--nw-line) 70%, transparent); }
  .wk .track i { position:absolute; top:0; bottom:0; border-radius:3px; }
  .wk .rain { white-space:nowrap; font-size:var(--nw-fs-small); font-weight:600; color:color-mix(in oklab, var(--nw-rain) var(--nw-ink), var(--nw-fg)); text-align:right; min-width:42px; }
  .wk .wind { display:inline-flex; align-items:center; justify-content:flex-end; gap:3px; white-space:nowrap; font-size:var(--nw-fs-small); color:var(--nw-fg2); min-width:30px; }
  .wk .rule { grid-column:1/-1; height:1px; background:var(--nw-line-soft); }
  @container (max-width:380px) { .wk { column-gap:7px; } .wk .rain { min-width:34px; } }
`;function Li(e,i){let t=e.now,n=e.alerts.find(s=>s.official)??e.alerts[0],a=e.location?r("M\xE9t\xE9o \xE0 {place}",{place:e.location}):r("M\xE9t\xE9o");return o`<div class=${`nw-mini${i==="none"?" still":""}`} role=${i==="none"?"group":"button"} tabindex=${i==="none"?-1:0}
      aria-label=${i==="none"?a:Y(a,i==="page"?r("appui pour la page m\xE9t\xE9o"):r("appui pour la carte compl\xE8te"))}>
    <ha-icon class="mini-icon" icon=${t.icon}></ha-icon>
    <span class="mini-temp">${t.temperature===void 0?"\u2014":y(t.temperature)}<small>°C</small></span>
    <span class="mini-text"><b>${t.label}</b>${e.location?o`<span>${e.location}</span>`:p}</span>
    ${n?pe(n):p}
  </div>`}function zt(e){return{alerts:e.alerts,points:e.points.filter(i=>i.level>=2&&i.group!=="official")}}function Ri(e,i){let{alerts:t,points:n}=zt(e);return!t.length&&!n.length?i?o`<div class="nw-alertcard quiet-card"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><b>${r("Aucune alerte en ce moment.")}</b> ${r("Cette carte reste cach\xE9e tant que tout est calme.")}</span></div>`:p:o`<div class="nw-alertcard" role="button" tabindex="0" aria-label=${r("Alertes m\xE9t\xE9o : appui pour la carte compl\xE8te")}>
    ${e.location?o`<span class="place">${e.location}</span>`:p}
    ${t.map(a=>Ge(a))}${n.map(a=>Ne(a))}
  </div>`}function ji(e,i,t,n,a,s=["hours","days"]){let d=s.includes("hours")&&e.hours.some(u=>u.temperature!==void 0),l=s.includes("days")&&e.days.length>0,c=d?l?i:"hours":"days",h=u=>g=>{g.stopPropagation(),t(u)},m=!d&&!l?p:c==="hours"?St(e.hours,e.provider,n,a):Et(e.days,e.provider,n);return o`<div class="nw-forecastcard">
    <div class="fcard-head"><span class="fcard-title"><b>${r("Pr\xE9visions")}</b>${e.location?o`<span>${e.location}</span>`:p}</span>
      ${d&&l?o`<span class="seg" role="group" aria-label=${r("Pr\xE9visions affich\xE9es")}>
        <button type="button" aria-pressed=${c==="hours"} @click=${h("hours")}>${r("Heures")}</button>
        <button type="button" aria-pressed=${c==="days"} @click=${h("days")}>${r("Jours")}</button></span>`:p}</div>
    ${m===p?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:m}
  </div>`}function Un(e){let i=e.hours,t=a=>i.slice(0,a).reduce((s,d)=>s+(d.precipitation??0),0),n=i.find(a=>a.precipitation>=.3);return{hour:t(1),six:t(6),next:n?ce(n.hour):void 0}}function Hi(e){let i=Un(e),t=e.hours.length?i.six<.1?o`<div class="nw-chips">${E({theme:"calm",icon:"mdi:weather-partly-cloudy",label:i.next?r("Pas de pluie avant {hour}",{hour:i.next}):r("Pas de pluie pr\xE9vue d\u2019ici 18 h")})}</div>`:o`<div class="nw-chips">${E({theme:"rain",icon:"mdi:timer-sand",value:`${y(i.hour)} mm`,label:r("dans l\u2019heure")})}
        ${E({theme:"rain",icon:"mdi:weather-pouring",value:`${y(i.six)} mm`,label:r("sur 6 h")})}
        ${i.next&&i.hour<.1?E({theme:"rain",icon:"mdi:clock-outline",label:r("\xE0 partir de {hour}",{hour:i.next})}):p}</div>`:o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`;return o`<div class="rain-ahead">${A(r("\xC0 venir"))}${t}</div>`}function Nn(e){let i=e.hours.slice(0,6),t=a=>a.reduce((s,d)=>d===void 0?s:Math.max(s??d,d),void 0),n=i.find(a=>(a.wind??0)>=30||(a.gust??0)>=40);return{wind:t(i.map(a=>a.wind)),gust:t(i.map(a=>a.gust)),strong:n?ce(n.hour):void 0}}function Oi(e){let i=Nn(e),t=i.strong?"wind":"calm",n=i.wind===void 0&&i.gust===void 0?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:o`<div class="nw-chips">${i.wind===void 0?p:E({theme:t,icon:"mdi:weather-windy",value:`${y(i.wind,0)} km/h`,label:r("au plus sur 6 h")})}
        ${i.gust===void 0?p:E({theme:t,icon:"mdi:weather-windy-variant",value:`${y(i.gust,0)} km/h`,label:r("en rafales")})}
        ${i.strong?E({theme:"wind",icon:"mdi:clock-outline",label:r("vent fort \xE0 partir de {hour}",{hour:i.strong})}):p}</div>`;return o`<div class="rain-ahead">${A(r("\xC0 venir"))}${n}</div>`}function Gn(e){let i=e.hours.slice(0,7).filter(a=>a.pressure!==void 0);if(i.length<2)return;let t=i[0],n=i[i.length-1];return{change:n.pressure-t.pressure,last:n.pressure,hour:ce(n.hour)}}function Fi(e,i=!1){let t=Gn(e);if(!t&&!i)return p;let n=s=>`${s>0?"+":s<0?"\u2212":""}${y(Math.abs(s))} hPa`,a=t?o`<div class="nw-chips">${E({theme:Math.abs(t.change)>=4?"pressure":"calm",icon:t.change<=-1?"mdi:trending-down":t.change>=1?"mdi:trending-up":"mdi:trending-neutral",value:Math.abs(t.change)<1?void 0:n(t.change),label:Math.abs(t.change)<1?r("Pression stable sur 6 h"):r("sur 6 h")})}
        ${E({theme:"pressure",icon:"mdi:gauge",value:`${y(t.last,0)} hPa`,label:r("vers {hour}",{hour:t.hour})})}</div>`:o`<p class="nw-empty">${r("Votre fournisseur m\xE9t\xE9o ne pr\xE9voit pas la pression.")}</p>`;return o`<div class="rain-ahead">${A(r("\xC0 venir"))}${a}</div>`}var Kn=["lightning","lightning-rainy","hail"];function Bi(e){let i=e.hours.slice(0,6).find(n=>Kn.includes(n.condition)),t=e.hours.length?o`<div class="nw-chips">${i?E({theme:"level2",icon:"mdi:weather-lightning",label:r("Orage pr\xE9vu vers {hour}",{hour:ce(i.hour)})}):E({theme:"calm",icon:"mdi:weather-partly-cloudy",label:r("Pas d\u2019orage pr\xE9vu d\u2019ici 6 h")})}</div>`:o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`;return o`<div class="rain-ahead">${A(r("\xC0 venir"))}${t}</div>`}var Ii=C`
  .nw-mini { display:flex; align-items:center; gap:10px; padding:10px 14px; min-height:56px; box-sizing:border-box; cursor:pointer; color:var(--nw-fg); }
  .nw-mini.still { cursor:default; }
  .nw-mini:focus-visible, .nw-alertcard:focus-visible { outline:2px solid var(--nw-accent); outline-offset:-2px; }
  .mini-icon { --mdc-icon-size:30px; color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); flex:none; }
  .mini-temp { font-size:24px; font-weight:700; letter-spacing:-.6px; white-space:nowrap; line-height:1; }
  .mini-temp small { font-size:var(--nw-fs-small); font-weight:400; vertical-align:super; margin-left:1px; letter-spacing:0; }
  .mini-text { display:flex; flex-direction:column; min-width:0; flex:1; line-height:1.3; }
  .mini-text b { font-size:var(--nw-fs-text); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mini-text span { font-size:var(--nw-fs-small); color:var(--nw-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nw-mini .nw-alert { flex:none; max-width:46%; }
  /* Narrow: the sky, the temperature and the vigilance; the words give way. */
  @container (max-width:300px) { .mini-text { display:none; } .nw-mini .nw-alert { max-width:none; margin-left:auto; } }

  .nw-alertcard { display:flex; flex-direction:column; align-items:stretch; gap:8px; padding:12px 14px; cursor:pointer; color:var(--nw-fg); }
  .nw-alertcard .place { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-alertcard .nw-bubble { max-width:none; }
  .quiet-card { flex-direction:row; align-items:center; gap:10px; cursor:default; color:var(--nw-fg2); font-size:var(--nw-fs-text); }
  .quiet-card ha-icon { --mdc-icon-size:22px; color:color-mix(in oklab, var(--nw-calm) var(--nw-ink), var(--nw-fg)); flex:none; }
  .quiet-card b { color:var(--nw-fg); font-weight:600; }

  .nw-forecastcard { display:flex; flex-direction:column; gap:12px; padding:14px 16px 16px; }
  .fcard-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .fcard-title { display:flex; align-items:baseline; gap:8px; min-width:0; }
  .fcard-title b { font-size:var(--nw-fs-title); font-weight:700; letter-spacing:-.2px; }
  .fcard-title span { font-size:var(--nw-fs-small); color:var(--nw-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* The full card's panels, without their frame: the card is the frame. */
  .nw-forecastcard .nw-panel { border:0; padding:0; background:none; }
  .nw-forecastcard .nw-panel-head { display:none; }
  .rain-ahead { display:flex; flex-direction:column; gap:6px; padding-bottom:12px; border-bottom:1px solid var(--nw-line-soft); }
  .rain-ahead:last-child { padding-bottom:0; border-bottom:0; }
`;var Vi={6:["calm","calm","level1","level2","level3","pressure"],4:["calm","level1","level2","level3"]},Ze=(e,i)=>e&&!e.stale&&e.value!==void 0&&e.value<=i&&(i!==6||e.value>=1)?e.value:void 0;function Qn(e,i){let t=Ze(e,i),n=Vi[i]??Vi[6],a=360/i,s=d=>{let l=(d*a-88)*Math.PI/180,c=((d+1)*a-92)*Math.PI/180,h=32,m=38;return B`<path d=${`M${m+h*Math.cos(l)} ${m+h*Math.sin(l)} A${h} ${h} 0 0 1 ${m+h*Math.cos(c)} ${m+h*Math.sin(c)}`} fill="none" stroke-width="9" stroke-linecap="round"
      stroke=${t!==void 0&&d<t?`var(--nw-${n[d]})`:"color-mix(in oklab,var(--nw-fg) 10%,transparent)"}/>`};return o`<svg class="disc" viewBox="0 0 76 76" aria-hidden="true">${n.map((d,l)=>s(l))}
    <text x="38" y="44" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor">${t??"\u2013"}</text></svg>`}function Yn(e){let i=e.reading,t=e.concentration,n=s=>s.value===void 0?r("concentration indisponible"):`${y(s.value,2)}${s.unit?` ${s.unit}`:""}`;return`${i.unit!==void 0?n(i):`${i.label}${t?` \xB7 ${n(t)}`:""}`}${i.stale?` \xB7 ${r("donn\xE9es anciennes")}`:""}`}function Mt(e){let i=e.kind==="air",t=e.primary,n=e.scale??6,a=Ze(t,n),s=n===6,d=e.source??(s?"Atmo France":"Polleninformation"),l=e.worse?Ze(e.worse.reading,n)??0:0,c=!i&&s&&e.tomorrow&&!t?.stale&&t?.unavailableReason==="no_index",h=!i&&s&&e.details.some(u=>u.concentration?.value===0&&Ze(u.reading,n)===void 0),m=c?r("Pr\xE9vision non disponible"):t?t.stale?r("Donn\xE9es anciennes"):t.value===7?r("\xC9v\xE9nement signal\xE9"):t.label:r("Indice non configur\xE9");return o`<section class="nw-panel" aria-label=${i?r(e.tomorrow?"Air ext\xE9rieur demain":"Air ext\xE9rieur aujourd\u2019hui"):r(e.tomorrow?"Pollens demain":"Pollens aujourd\u2019hui")}>
    ${q(i?"mdi:air-filter":"mdi:flower-pollen-outline","calm",i?r("Air ext\xE9rieur"):r("Pollens"),d)}
    <p class="nw-sub">${e.tomorrow?r("Demain"):r("Aujourd\u2019hui")}${e.zone?` \xB7 ${e.zone}`:""}</p>
    <div class="aq" data-entity=${t?.entityId??p} role=${t?"button":p} tabindex=${t?0:p}>${Qn(t,n)}
      <div class="txt">${A(e.tomorrow?r("Indice de demain"):r("Indice du jour"))}<strong>${m}</strong>
        <small>${a!==void 0?r("Niveau {value} sur {scale}",{value:a,scale:n}):t?.value===7&&s?r("Code 7 \xB7 hors \xE9chelle"):c?r("Indice pollen non fourni"):r("Niveau indisponible")}</small></div></div>
    ${c?o`<p class="availability-note">${r("Atmo France ne fournit pas d\u2019indice pollen exploitable pour demain \xE0 cet endroit.")}</p>`:p}
    ${e.worse?o`<div class="nw-chips">${E({theme:`level${Math.min(3,Math.max(1,l-(s?2:1)))}`,icon:"mdi:alert-circle-outline",value:e.worse.label,label:e.worse.reading.label.toLowerCase(),entity:e.worse.reading.entityId})}</div>`:p}
    ${e.details.length||e.updated?o`<details class="nw-details"><summary><ha-icon icon="mdi:chevron-right"></ha-icon>${i?r("D\xE9tail des polluants"):r("D\xE9tail des pollens")}</summary>
      ${e.details.length?o`<ul>${e.details.map(u=>o`<li data-entity=${u.reading.entityId}><span>${u.label}</span><b>${Yn(u)}</b></li>`)}</ul>`:p}
      ${h?o`<p>${r("Une concentration \xE0 0 peut \xEAtre une valeur r\xE9elle ou remplacer une donn\xE9e manquante chez Atmo France. Elle ne permet pas, \xE0 elle seule, de conclure \xE0 une absence de pollen.")}</p>`:p}
      ${e.updated?o`<p>${s&&!e.source?r("Publication Atmo : {date}.",{date:e.updated}):r("Mise \xE0 jour {source} : {date}.",{source:d,date:e.updated})}${e.stale?` ${r("Certaines donn\xE9es sont anciennes : \xE0 v\xE9rifier dans l\u2019int\xE9gration.")}`:""}</p>`:p}</details>`:p}
  </section>`}var Lt=e=>e.length?o`<div class="panels-two">${e.map(Mt)}</div>`:p,qi=C`
  .panels-two { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; align-items:stretch; }
  .panels-two > :only-child { grid-column:1/-1; }
  @container (max-width:640px) { .panels-two { grid-template-columns:minmax(0,1fr); } }
  .availability-note { color:var(--nw-fg2); font-size:var(--nw-fs-small); line-height:1.5; }
  .aq { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:16px; }
  .aq .disc { width:76px; height:76px; }
  .aq .txt { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .aq strong { font-size:var(--nw-fs-title); font-weight:700; }
  .aq small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
`;var Rt=(...e)=>Math.max(0,...e.flatMap(i=>i.length?[i[i.length-1][0]]:[])),Xe=(e,i,t=0)=>48-(e-t)/Math.max(1e-6,i-t)*44;function et(e,i,t,n=0,a=21600){let s=[],d=[];for(let l of e)l[1]===null?(d.length>1&&s.push(d),d=[]):d.push(l);return d.length>1&&s.push(d),s.map(l=>{let c=l.map(([v,k])=>({x:(v-(t-a))/a*100,y:Xe(k,i,n)})),h=c.slice(1).map((v,k)=>(v.y-c[k].y)/(v.x-c[k].x)),m=c.map((v,k)=>k===0?h[0]:k===c.length-1?h.at(-1):h[k-1]*h[k]<=0?0:2/(1/h[k-1]+1/h[k]));h.forEach((v,k)=>{if(v===0){m[k]=0,m[k+1]=0;return}let _=Math.hypot(m[k]/v,m[k+1]/v);_>3&&(m[k]*=3/_,m[k+1]*=3/_)});let u=v=>v.toFixed(2),g=`M${u(c[0].x)},${u(c[0].y)}`;for(let v=1;v<c.length;v++){let k=c[v-1],_=c[v],M=(_.x-k.x)/3;g+=` C${u(k.x+M)},${u(k.y+m[v-1]*M)} ${u(_.x-M)},${u(_.y-m[v]*M)} ${u(_.x)},${u(_.y)}`}return{line:g,area:`${g} L${u(c.at(-1).x)},50 L${u(c[0].x)},50 Z`}})}function jt(e,i,t,n,a=21600){let s=e.filter(m=>m[1]!==null);if(s.length<2)return[];let d=s.reduce((m,u)=>u[1]>m[1]?u:m),l=s.reduce((m,u)=>u[1]<m[1]?u:m),c=m=>Math.min(92,Math.max(8,(m-(i-a))/a*100)),h=([m,u])=>({x:c(m),y:t(u)/50*100,text:n(u)});return n(d[1])===n(l[1])?[h(d)]:[h(d),h(l)]}var tt=[[f("Calme"),"calm"],[f("Secteur"),"level1"],[f("Proche"),"level2"],[f("Sur vous"),"level3"]],Ft=50,T=100,Z=82,je=e=>Math.sqrt(Math.min(e,Ft)/Ft)*Z,Ht=(e,i)=>!e||e.has(i),Jn=e=>e<10?"var(--nw-level3)":e<30?"var(--nw-level2)":"var(--nw-level1)",Ot=(e,i)=>r(i>1?"{n} \xE9clairs":"{n} \xE9clair",{n:e});function Zn(e){let i=(d,l)=>[T+je(d)*Math.sin(l*Math.PI/180),T-je(d)*Math.cos(l*Math.PI/180)],t=e.strikes.filter(d=>d[2]!==null),n=[...new Set(e.strikes.filter(d=>d[2]===null).map(d=>Math.round(d[1])))],a=t.at(-1),s=a&&a[0]<10?i(a[1],a[2]):void 0;return o`<svg class="lz-radar" viewBox="-14 -14 228 228" role="img" aria-label=${r("\xC9clairs de la derni\xE8re heure autour de chez vous")}>
    ${B`<circle cx=${T} cy=${T} r=${Z} fill="color-mix(in oklab, var(--nw-wind) 8%, transparent)"/>
    <line x1=${T} y1=${T-Z} x2=${T} y2=${T+Z} stroke="var(--nw-line-soft)"/><line x1=${T-Z} y1=${T} x2=${T+Z} y2=${T} stroke="var(--nw-line-soft)"/>
    ${[10,30,50].map(d=>B`<circle class=${d===30?"ring near":"ring"} cx=${T} cy=${T} r=${je(d)}/>
      <text class="km" x=${T+3} y=${T-je(d)+10}>${d}</text>`)}
    <text x=${T} y=${T-Z-5}>${r("N")}</text><text x=${T+Z+9} y=${T+4}>${r("E")}</text>
    <text x=${T} y=${T+Z+14}>${r("S")}</text><text x=${T-Z-9} y=${T+4}>${r("O")}</text>
    ${n.map(d=>B`<circle class="unplaced" cx=${T} cy=${T} r=${je(d)}/>`)}
    ${t.map(([d,l,c])=>{let[h,m]=i(l,c);return B`<circle cx=${h.toFixed(1)} cy=${m.toFixed(1)} r=${d<10?4:3} fill=${Jn(d)} opacity=${Math.max(.4,1-d/70).toFixed(2)}/>`})}
    ${s?B`<circle class="lz-pulse" cx=${s[0].toFixed(1)} cy=${s[1].toFixed(1)} r="4"/>`:p}
    <circle cx=${T} cy=${T} r="5" fill="var(--nw-bg)" stroke="var(--nw-fg)" stroke-width="2"/>`}</svg>`}var Xn=e=>o`<div class="lz-level" role="img" aria-label=${r("Niveau : {step}",{step:r(tt[e][0])})}>
  ${[3,2,1,0].map(i=>o`<div class=${i===e?"on":""}><i class=${i<=e?"lit":""} style=${`--c:var(--nw-${tt[e][1]})`}></i>${A(r(tt[i][0]))}</div>`)}</div>`;function it(e,i,t=p){let n=q("mdi:flash",tt[e.available?e.step:0][1],r("\xC9clairs"),e.source),a=e.month===void 0?p:E({theme:"calm",icon:"mdi:calendar-month",value:y(e.month,0),label:r("ce mois")});if(!e.available||!e.hourCount)return o`<section class="nw-panel" aria-label=${r("\xC9clairs")}>${n}${t}
    <div class="lz-calm" data-entity=${J(e.entity)}><p><b>${e.headline}</b>${e.available&&!e.hourCount?o` ${r("\xC0 moins de {km} km.",{km:Ft})}`:p}</p>${e.available?a:p}</div></section>`;let s=e.trend==="approche"?E({theme:"level2",icon:"mdi:arrow-collapse-down",label:e.movement}):e.trend==="eloigne"?E({theme:"calm",icon:"mdi:arrow-expand-up",label:e.movement}):p,d=[[r("Dans l\u2019heure"),Ot(e.hourCount,e.hourCount)],[r("En 10 min"),Ot(e.recentCount,e.recentCount)],e.month!==void 0?[r("Ce mois"),Ot(y(e.month,0),e.month)]:[r("Dernier"),r("il y a {n} min",{n:Math.max(1,e.lastMinutes??1)})]];return o`<section class="nw-panel" aria-label=${r("\xC9clairs")}>${n}${t}
    ${Ht(i,"now")?o`<div class="metric-row"><div class="metric" data-entity=${J(e.entity)}>
        <div class="metric-main"><b>${e.nearest===void 0?"\u2014":y(Math.max(1,e.nearest),0)}</b><span>km</span></div>
        <small><b>${e.headline}</b>${e.direction?` \xB7 ${e.direction}`:""}</small></div>${s}</div>`:p}
    ${Ht(i,"radar")?o`<div class="mini lz"><div class="mini-top">${r("Derni\xE8re heure \xB7 en rouge, les 10 derni\xE8res minutes")}</div>
        <div class="lz-body">${Zn(e)}${Xn(e.step)}</div></div>`:p}
    ${Ht(i,"stats")?o`<div class="stats">${d.map(([l,c])=>o`<div>${A(l)}<b>${c}</b></div>`)}</div>`:p}
  </section>`}var Wi=C`
  .lz-body { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
  .lz-radar { width:100%; max-width:160px; aspect-ratio:1; justify-self:center; overflow:visible; }
  .lz-radar .ring { fill:none; stroke:var(--nw-line); }
  .lz-radar .ring.near { stroke:color-mix(in oklab, var(--nw-level2) 75%, transparent); stroke-dasharray:3 3; }
  .lz-radar .unplaced { fill:none; stroke:var(--nw-level1); stroke-opacity:.5; stroke-dasharray:1 3; }
  .lz-radar text { font-size:12px; font-weight:700; fill:var(--nw-fg2); text-anchor:middle; }
  .lz-radar text.km { font-size:10px; font-weight:600; text-anchor:start; }
  .lz-pulse { fill:none; stroke:var(--nw-level3); stroke-width:1.5; transform-box:fill-box; transform-origin:center;
    animation:lz-pulse 1.8s ease-out infinite; animation-play-state:var(--nw-motion, running); }
  @keyframes lz-pulse { from { opacity:.9; transform:scale(1); } to { opacity:0; transform:scale(3.2); } }
  @media (prefers-reduced-motion:reduce) { .lz-pulse { display:none; } }
  .lz-level { display:flex; flex-direction:column; gap:7px; }
  .lz-level div { display:flex; align-items:center; gap:8px; }
  .lz-level div:not(.on) .nw-label { opacity:.7; }
  .lz-level div.on .nw-label { color:var(--nw-fg); }
  .lz-level i { width:26px; height:8px; border-radius:4px; background:color-mix(in srgb, var(--nw-fg) 9%, transparent); flex:none; }
  .lz-level i.lit { background:var(--c); }
  .lz-calm { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .lz-calm p { margin:0; flex:1; min-width:12em; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  .lz-calm b { color:var(--nw-fg); font-weight:600; }
`;var Di=e=>e.map(i=>o`<span class=${`pill${i.y<30?" low":""}`} style=${`left:${i.x}%;top:${i.y}%`}>${i.text}</span>`),Bt=e=>e.length?o`<div class="stats">${e.map(i=>o`<div data-entity=${J(i.entity)}>${A(i.label)}<b>${i.value}</b></div>`)}</div>`:p,Ui={"6h":{span:6*3600,title:f("6 derni\xE8res heures"),axis:["\u22126 h","\u22123 h"]},"1d":{span:86400,title:f("24 derni\xE8res heures"),axis:["\u221224 h","\u221212 h"]},"2d":{span:2*86400,title:f("2 derniers jours"),axis:[f("\u22122 j"),f("\u22121 j")]},"7d":{span:7*86400,title:f("7 derniers jours"),axis:[f("\u22127 j"),""]}},Ni=e=>o`<div class="mini-axis">${A(r(e.axis[0]))}${A(r(e.axis[1]))}${A(r("maintenant"))}</div>`,ea={"24h":{title:f("24 derni\xE8res heures"),axis:["\u221224 h","\u221212 h",f("maintenant")]},"7d":{title:f("7 derniers jours")},"30d":{title:f("30 derniers jours"),axis:[f("\u221230 j"),f("\u221215 j"),f("aujourd\u2019hui")]}},N=(e,i)=>!e||e.has(i),Gi=(e,i)=>e.map(t=>B`
  <path d=${t.area} fill=${`color-mix(in oklab,${i} 16%,transparent)`}/>
  <path d=${t.line} fill="none" stroke=${i} stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`);function It(e,i,t,n,a=p){let s=c=>Math.min(100,Math.max(0,(c+5)/50*100)),d=e.gap===void 0||Math.abs(e.gap)<.1?"":r(t?"{gap} \xB0C par rapport au thermom\xE8tre":"{gap} \xB0C par rapport \xE0 la temp\xE9rature du bulletin",{gap:`${e.gap>0?"+":"\u2212"}${y(Math.abs(e.gap))}`}),l=Ke(`${i}-feel`,{title:r("Ressenti"),text:o`${r("C\u2019est la temp\xE9rature que le corps per\xE7oit. L\u2019humidit\xE9 et le soleil la font monter, le vent la fait baisser.")}
      ${r("C\u2019est une estimation, pas un indice officiel.")} <a href="https://github.com/hestiaFB/hestia-weather-integration/blob/main/docs/ressenti.md" target="_blank" rel="noopener noreferrer">${r("En savoir plus")}</a>`,example:e.example?r("En ce moment : {example}.",{example:e.example}):r("25 \xB0C au thermom\xE8tre dans un air tr\xE8s humide se ressentent comme 30 \xB0C.")});return o`<section class="nw-panel" aria-label=${r("Ressenti")}>${q("mdi:thermometer","heat",r("Ressenti"),e.source,l)}
    ${N(n,"feel")||N(n,"factors")&&e.factors.length?o`<div class="metric-row">
      ${N(n,"feel")?o`<div class="metric" data-entity=${J(e.entity)}><div class="metric-main"><b>${y(e.feels)}</b><span>°C</span></div>
        <small>${[e.word?o`<b>${e.word}</b>`:"",e.humidity,d].filter(Boolean).map((c,h)=>o`${h?" \xB7 ":""}${c}`)}</small></div>`:p}
      ${N(n,"factors")&&e.factors.length?o`<div class="nw-chips factors">${e.factors.map(E)}</div>`:p}
    </div>`:p}
    ${N(n,"gauge")?o`<div class="rail-line"><span>−5°</span><div class="rail">
      ${e.temperature===void 0?p:o`<i class="thermo" style=${`left:${s(e.temperature)}%`} title=${r(t?"Thermom\xE8tre {t} \xB0C":"Bulletin {t} \xB0C",{t:y(e.temperature)})}></i>`}
      <i class="feel" style=${`left:${s(e.feels)}%;--c:${ge(e.feels)}`} title=${r("Ressenti {t} \xB0C",{t:y(e.feels)})}></i></div><span>45°</span></div>`:p}
    ${a}
  </section>`}function Vt(e,i,t=p){let n=Math.max(1,...(e.days??[]).map(h=>h.value??0)),a=ea[e.period??"7d"],s=(e.days?.length??0)>7,d=s?(e.days??[]).reduce((h,m)=>(m.value??0)>(h?.value??0)?m:h,void 0):void 0,l=h=>e.period==="24h"?h.label:e.period==="30d"?`${h.label}/${h.date.slice(5,7)}`:h.date,c=e.rate!==void 0&&e.rate>0?E({theme:"rain",icon:"mdi:weather-rainy",value:`${y(e.rate)} mm/h`,label:r("en ce moment"),entity:e.rateEntity}):e.status?E({theme:"rain",icon:"mdi:weather-rainy",label:e.status}):p;return o`<section class="nw-panel" aria-label=${r("Pluie")}>${q("mdi:weather-rainy","rain",r("Pluie"),e.source)}${t}
    ${N(i,"now")?o`<div class="metric-row"><div class="metric" data-entity=${e.entity}>
      ${e.text?o`<div class="metric-main"><b class="word">${e.text}</b></div>`:o`<div class="metric-main"><b>${e.value===void 0?"\u2014":y(e.value,1,!0)}</b><span>${e.unit}</span></div>`}<small>${e.label}</small></div>${c}</div>`:p}
    ${N(i,"chart")?o`<div class="mini" title=${e.daysNote}><div class="mini-top">${r(a.title)} · ${e.total===void 0?"mm":`${e.totalPartial?"\u2265 ":""}${y(e.total)} mm`}</div>
      ${e.days?o`<div class=${`bars${s?" dense":""}`} style=${`--n:${e.days.length}`} role="img" aria-label=${r("Pluie des {period}",{period:r(a.title)})}>${e.days.map(h=>o`<div title=${Y(l(h),h.value===void 0?r("indisponible"):h.partial?r("au moins {mm} mm",{mm:y(h.value)}):`${y(h.value)} mm`)}>
          <span>${h.value===void 0?s?"":"\u2014":h.value&&(!s||h===d)?`${h.partial?"\u2265 ":""}${y(h.value)}`:""}</span>
          <i class=${h.value?"":"zero"} style=${`height:${h.value?Math.max(12,h.value/n*74):5}%`}></i></div>`)}</div>
        ${a.axis?o`<div class="mini-axis">${a.axis.map(h=>A(r(h)))}</div>`:o`<div class="bars-axis">${e.days.map(h=>A(h.label.replace(".","")))}</div>`}`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${N(i,"stats")?Bt(e.stats):p}
  </section>`}function qt(e,i,t=p){let n="var(--nw-wind)",a=Rt(e.mean,e.gust),s=Ui[e.period??"6h"],d=et(e.mean,e.top,a,0,s.span),l=et(e.gust,e.top,a,0,s.span);return o`<section class="nw-panel" aria-label=${r("Vent")}>${q("mdi:weather-windy","wind",r("Vent"),e.source)}${t}
    ${N(i,"now")?o`<div class="metric-row"><div class="metric" data-entity=${e.entity}><div class="metric-main"><b>${e.value===void 0?"\u2014":y(e.value,0)}</b><span>km/h</span></div>
      <small>${e.label}${e.description?` \xB7 ${e.description}`:""}</small></div>
      ${e.status?E({theme:"wind",icon:"mdi:weather-windy",label:e.status}):p}
      ${e.bearing===void 0?p:o`<svg class="compass" viewBox="0 0 72 72" role="img" aria-label=${e.compass} data-entity=${J(e.bearingEntity)}>
        <circle cx="36" cy="36" r="30" fill="color-mix(in oklab,var(--nw-wind) 10%,transparent)" stroke="var(--nw-line)"/>
        <text x="36" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="var(--nw-fg2)">N</text>
        <path d="M36 16 44 46 36 40 28 46Z" fill="color-mix(in oklab,var(--nw-wind) 75%,var(--nw-fg))" transform=${`rotate(${(e.bearing+180)%360} 36 36)`}/></svg>`}</div>`:p}
    ${N(i,"chart")?o`<div class="mini"><div class="mini-top">${r(s.title)} · km/h</div>
      ${d.length||l.length?o`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${r("Vent des {period}, moyennes et rafales",{period:r(s.title)})}>
          ${l.map(c=>B`<path d=${c.line} fill="none" stroke="color-mix(in oklab,var(--nw-wind) 55%,transparent)" stroke-width="2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`)}
          ${Gi(d,n)}</svg>${Di(jt(e.mean,a,c=>Xe(c,e.top),c=>y(c,0),s.span))}</div>${Ni(s)}
        <div class="nw-legend">${he(e.meanLabel,n)}${l.length?he(r("Rafales"),n,"dash"):p}</div>`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${N(i,"stats")?Bt(e.stats):p}
  </section>`}function Wt(e,i,t=p){let n=Ui[e.period??"6h"],a=Rt(e.series),s=et(e.series,e.top,a,e.low,n.span);return o`<section class="nw-panel" aria-label=${r("Pression")}>${q("mdi:gauge","pressure",r("Pression"),e.source)}${t}
    ${N(i,"now")?o`<div class="metric-row"><div class="metric" data-entity=${J(e.entity)}><div class="metric-main"><b>${e.value===void 0?"\u2014":y(e.value,0)}</b><span>hPa</span></div>
      <small>${e.description}</small></div>${e.trend?E(e.trend):p}</div>`:p}
    ${N(i,"chart")?o`<div class="mini"><div class="mini-top">${r(n.title)} · hPa</div>
      ${s.length?o`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${r("Pression des {period}",{period:r(n.title)})}>${Gi(s,"var(--nw-pressure)")}</svg>${Di(jt(e.series,a,d=>Xe(d,e.top,e.low),d=>y(d,0),n.span))}</div>${Ni(n)}`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${N(i,"stats")?Bt(e.stats):p}
  </section>`}var ta=["comfort","rain","wind","pressure","lightning","extras","air"];function Ki(e,i,t,n,a=ta){let s=h=>h==="rain"?e.rain&&Vt(e.rain):h==="wind"?e.wind&&qt(e.wind):h==="pressure"?e.pressure&&Wt(e.pressure):h==="lightning"?e.lightning&&it(e.lightning):void 0,d=[],l=[],c=()=>{l.length&&d.push(o`<div class=${`grid3 n${l.length}`}>${l}</div>`),l=[]};for(let h of a){let m=s(h);if(m){l.push(m);continue}c(),h==="comfort"&&e.comfort&&d.push(It(e.comfort,i,t)),h==="extras"&&e.extras.length&&d.push(o`<div class="nw-chips extras">${e.extras.map(E)}</div>`),h==="air"&&d.push(n)}return c(),o`${d}`}var Qi=C`
  /* Three panels: one column on a phone, two then three as the card widens; the third never leaves a hole. */
  .grid3 { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
  @container (min-width:560px) { .grid3 { grid-template-columns:repeat(2, minmax(0,1fr)); } .grid3.n3 > :last-child, .grid3.n1 > * { grid-column:1/-1; } }
  @container (min-width:860px) { .grid3.n3 { grid-template-columns:repeat(3, minmax(0,1fr)); } .grid3.n3 > :last-child { grid-column:auto; } }
  .extras { justify-content:center; }
  .factors { justify-content:flex-end; }
  .metric .word { font-size:var(--nw-fs-title); letter-spacing:-.2px; }
  .compass { width:72px; height:72px; flex:none; }
  /* The feel gauge on one line, its bounds at both ends. */
  .rail-line { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:10px; font-size:var(--nw-fs-small); color:var(--nw-fg2); padding:6px 0 2px; }
  .rail { position:relative; height:8px; border-radius:var(--nw-radius-pill);
    background:linear-gradient(90deg, var(--nw-cold), var(--nw-rain) 28%, var(--nw-calm) 45%, var(--nw-level1) 62%, var(--nw-heat) 78%, var(--nw-level3)); }
  .rail .thermo { position:absolute; top:50%; width:3px; height:18px; margin:-9px 0 0 -1.5px; border-radius:2px; background:var(--nw-bg); box-shadow:0 0 0 1px var(--nw-line); }
  .rail .feel { position:absolute; top:50%; box-sizing:border-box; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%; background:var(--nw-bg); border:4px solid var(--c); box-shadow:0 1px 4px #0002; }
  /* Rain of the last seven days: the value on each bar. */
  .bars, .bars-axis { display:grid; grid-template-columns:repeat(var(--n, 7), 1fr); gap:6px; }
  .bars.dense { gap:2px; }
  .bars.dense span { overflow:visible; white-space:nowrap; }
  .bars { align-items:end; height:66px; }
  .bars > div { display:flex; flex-direction:column; justify-content:flex-end; height:100%; gap:3px; }
  .bars span { font-size:var(--nw-fs-small); font-weight:700; text-align:center; line-height:1; min-height:12px; }
  .bars i { display:block; border-radius:5px 5px 2px 2px; background:color-mix(in oklab, var(--nw-rain) 80%, transparent); min-height:3px; }
  .bars i.zero { background:color-mix(in oklab, var(--nw-line) 80%, transparent); }
  .bars-axis { text-align:center; }
`;var ia="/config/integrations/integration/niak_weather";function na(e,i){let t=n=>{let[a,s]=n.split("_");return(s==="today"?e.air.today:s==="tomorrow"?e.air.tomorrow:[]).find(d=>d.kind===a)};return i.map(t).filter(n=>!!n)}function Yi(e,i,t,n){if(i==="forecast")return ji(e,n.tab,n.onTab,n.entity,n.uid,t);let a=new Set(t),s=l=>o`<p class="nw-empty">${l}</p>`,d;if(!t.length)d=s(r("Rien \xE0 afficher : cochez au moins un \xE9l\xE9ment dans les r\xE9glages de la carte."));else if(i==="comfort"){let l=a.has("extras")&&e.extras.length?o`<div class="nw-chips extras">${e.extras.map(E)}</div>`:p;d=e.comfort?It(e.comfort,n.uid,n.station,a,l):s(r("Ressenti indisponible pour le moment."))}else if(i==="rain"){let l=a.has("ahead")?Hi(e):p;d=e.rain?Vt(e.rain,a,l):o`<section class="nw-panel" aria-label=${r("Pluie")}>${q("mdi:weather-rainy","rain",r("Pluie"),e.provider)}${l===p?s(r("Pluie indisponible pour le moment.")):l}</section>`}else if(i==="wind"){let l=a.has("ahead")?Oi(e):p;d=e.wind?qt(e.wind,a,l):l===p?s(r("Vent indisponible pour le moment.")):o`<section class="nw-panel" aria-label=${r("Vent")}>${q("mdi:weather-windy","wind",r("Vent"),e.provider)}${l}</section>`}else if(i==="pressure"){let l=a.has("ahead")?Fi(e,a.size===1):p;d=e.pressure?Wt(e.pressure,a,l):l===p?s(r("Pression indisponible pour le moment.")):o`<section class="nw-panel" aria-label=${r("Pression")}>${q("mdi:gauge","pressure",r("Pression"),e.provider)}${l}</section>`}else if(i==="lightning")d=e.lightning?it(e.lightning,a,a.has("ahead")?Bi(e):p):o`<section class="nw-panel lz-missing" aria-label=${r("\xC9clairs")}>${q("mdi:flash","wind",r("\xC9clairs"),"Blitzortung")}
        <p>${r("Cette carte montre les \xE9clairs autour de chez vous gr\xE2ce \xE0 Blitzortung, un r\xE9seau de d\xE9tecteurs b\xE9n\xE9voles. Installez l\u2019extension depuis HACS, puis choisissez-la dans les r\xE9glages de Hestia Weather.")}</p>
        <div class="links"><a href="https://github.com/mrk-its/homeassistant-blitzortung" target="_blank" rel="noopener noreferrer">${r("Installer Blitzortung")}</a>
          <a class="second" href=${ia}>${r("R\xE9glages de Hestia Weather")}</a></div></section>`;else{let l=na(e,t);d=l.length?o`<div class="panels-two">${l.map(Mt)}</div>`:s(r("Air et pollens indisponibles pour le moment."))}return o`<div class=${`nw-single ${i}`}>${d}</div>`}var Ji=C`
  .nw-single { padding:14px 16px 16px; color:var(--nw-fg); }
  .nw-single .nw-panel { border:0; padding:0; background:none; }
  .nw-single .extras { justify-content:flex-start; }
  .lz-missing p { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); line-height:1.5; }
  .lz-missing .links { display:flex; flex-wrap:wrap; gap:8px; }
  .lz-missing a { display:inline-block; padding:6px 14px; border-radius:var(--nw-radius-pill); background:var(--nw-accent); color:var(--nw-bg); font-weight:600; text-decoration:none; font-size:var(--nw-fs-small); }
  .lz-missing a.second { background:none; color:var(--nw-accent); box-shadow:inset 0 0 0 1px var(--nw-line); }
  .nw-single.air .panels-two { gap:24px 20px; }
  .nw-single .lz-radar { max-width:210px; }
`;var ve=class extends V{constructor(){super(...arguments);this.now=new Date;this.tick=()=>{this.now=new Date,clearTimeout(this.timer),this.timer=setTimeout(this.tick,6e4-this.now.getSeconds()*1e3-this.now.getMilliseconds()+50)}}connectedCallback(){super.connectedCallback(),this.tick()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timer)}render(){return o`<time datetime=${this.now.toISOString()}>${yi(De(),{hour:"2-digit",minute:"2-digit"}).format(this.now)}</time>`}};ve.styles=C`
    :host { display:block; font-variant-numeric:tabular-nums; line-height:1; }
    time { font:inherit; }
  `,$([j()],ve.prototype,"now",2),ve=$([Q("niak-clock")],ve);var aa=[{key:"official",title:f("Vigilance officielle")},{key:"now",title:f("Maintenant")},{key:"future",title:f("\xC0 venir")},{key:"environment",title:f("Air et pollens")}];function ra(e,i){let t=e.brief,n=t?aa.map(a=>({...a,signals:t.signals.filter(s=>s.group===a.key&&(s.severity>0||e.points.some(d=>d.text===s.text)))})).filter(a=>a.signals.length):[];return Ke(`${i}-brief`,{title:r("Synth\xE8se"),text:o`${r("La m\xE9t\xE9o du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.")}
      ${n.map(a=>o`<div class="brief-group">${A(r(a.title))}<ul>${a.signals.map(s=>o`<li data-entity=${s.entity??p}>
        <ha-icon icon=${s.icon}></ha-icon><span>${s.text}</span></li>`)}</ul></div>`)}
      ${t?.caveats.length?o`<div class="brief-group">${A(r("\xC0 v\xE9rifier"))}<ul>${t.caveats.map(a=>o`<li><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${a}</span></li>`)}</ul></div>`:p}`,example:r("\xAB Pluie ce soir, puis \xE9claircies demain matin. \xBB")})}function Zi(e,i,t,n,a,s="none"){let d=e.now.trend===void 0?p:o`<span class="nw-chip" style=${ne(e.now.trend>0?"heat":"cold")}
    title=${e.now.trend>0?r("La temp\xE9rature monte"):r("La temp\xE9rature baisse")}><ha-icon icon=${e.now.trend>0?"mdi:arrow-top-right":"mdi:arrow-bottom-right"}></ha-icon>${e.now.trend>0?"+":"\u2212"}${y(Math.abs(e.now.trend))} °C/h</span>`,l=e.season.news?o`<span class="nw-chip" style=${ne("calm")} title=${e.season.tip}><ha-icon icon=${e.season.info.icon}></ha-icon>${e.season.news}</span>`:p,c=e.alerts.filter(u=>u.official),h=Dt(e),m=n[0]==="bulletin"?n.slice(1):n;return o`<section class=${`nw-hero${e.now.darkSky?" dark-sky":""}`} aria-label=${r("Synth\xE8se")}>
    <div class="sky" aria-hidden="true">${i}</div><div class="veil" aria-hidden="true"></div>
    <header class="fm-head"><h2>${r("Synth\xE8se")}</h2>${ra(e,t)}<span>${[e.location,e.dateLabel].filter(Boolean).join(" \xB7 ")}</span>${l}</header>
    <div class="hero-main">
      ${s==="left"?o`<niak-clock class="hero-clock"></niak-clock>`:p}
      ${c.length?o`<div class="nw-alerts">${c.map(u=>pe(u))}</div>`:p}
      ${n[0]==="bulletin"?h:p}
    </div>
    ${Pt(e,!0,d,s==="right"?o`<niak-clock class="now-clock"></niak-clock>`:p)}
    ${m.length?o`<div class="hero-blocks">${m.map(a)}</div>`:p}
  </section>`}var Dt=e=>e.bulletin?o`${A(r("Bulletin du jour"))}<p class="nw-bulletin">${Ue(e.bulletin.summary)}</p>`:p,Xi=C`
  .nw-hero { position:relative; isolation:isolate; overflow:hidden; padding:20px 24px 24px; display:grid; grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:"head now" "main now" "blocks blocks"; column-gap:24px; row-gap:12px; color:var(--nw-fg); }
  .nw-hero .sky { --k:1; }
  /* The text side stays readable; the bottom fades softly towards the next section, light enough for the ground (puddles, snow) to show. */
  .nw-hero .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 92%, transparent) 30%,
    color-mix(in srgb, var(--nw-bg) 45%, transparent) 55%, transparent 78%),
    linear-gradient(0deg, color-mix(in srgb, var(--nw-bg) 55%, transparent) 0%, transparent 30%); }
  .nw-hero > .fm-head { grid-area:head; cursor:default; flex-wrap:wrap; }
  .hero-main { grid-area:main; display:flex; flex-direction:column; align-items:flex-start; gap:10px; min-width:0; }
  .nw-alerts { display:flex; flex-wrap:wrap; gap:8px; max-width:100%; }
  .nw-hero .nw-bulletin { animation:nw-rise .7s var(--nw-ease) both; }
  @keyframes nw-rise { from { opacity:0; filter:blur(3px); } }
  .nw-hero > .nw-now { grid-area:now; align-self:start; gap:4px; }
  .nw-hero > .nw-now .temp { font-size:var(--nw-fs-temp); }
  .nw-hero > .nw-now .temp small { font-size:var(--nw-fs-title); }
  .hero-clock { font-size:var(--nw-fs-temp); font-weight:300; letter-spacing:-1px; }
  .now-clock { font-size:var(--nw-fs-title); font-weight:650; color:var(--nw-fg2); margin-bottom:4px; }
  .hero-blocks { grid-area:blocks; display:flex; flex-direction:column; gap:14px; margin-top:4px; min-width:0; }
  .hero-blocks > .nw-events, .hero-blocks > .hero-bulletin, .hero-blocks > .block { display:flex; flex-direction:column; gap:6px; }
  .brief-group { margin-top:10px; }
  .brief-group ul { list-style:none; margin:4px 0 0; padding:0; display:grid; gap:4px; }
  .brief-group li { display:flex; align-items:flex-start; gap:7px; font-size:var(--nw-fs-small); }
  .brief-group li ha-icon { --mdc-icon-size:15px; color:var(--nw-fg2); margin-top:1px; }
  @media (prefers-reduced-motion:reduce) { .nw-hero .nw-bulletin { animation:none; } }
  @container (max-width:650px) {
    .nw-hero { grid-template-columns:minmax(0,1fr); grid-template-areas:"head" "now" "main" "blocks"; padding:16px 14px 18px; }
  }
`;function en(e,i,t,n,a){let s=n.folded[e],d=l=>{l instanceof KeyboardEvent&&l.key!=="Enter"&&l.key!==" "||(l.preventDefault(),n.onFold(e))};return o`<section class=${`fm-section${s?" folded":""}`} aria-labelledby=${`${n.uid}-${e}`}>
    <header class="fm-head" role="button" tabindex="0" aria-expanded=${!s} @click=${d} @keydown=${d}>
      <h2 id=${`${n.uid}-${e}`}>${i}</h2><span>${t}</span>
      <span class="fm-fold" aria-hidden="true"><ha-icon icon="mdi:chevron-down"></ha-icon></span></header>
    ${s?p:o`<div class="fm-body">${a()}</div>`}
  </section>`}function tn(e,i){let{hero:t,banner:n,today:a,forecasts:s}=i.sections,d=l=>l==="bulletin"?o`<div class="hero-bulletin">${Dt(e)}</div>`:l==="events"?Tt(e):l==="moments"?Ct(e):At(e,i.tab,i.onTab);return o`<div class="nw-full">
    ${t?Zi(e,i.sky,i.uid,n,d,i.clock):p}
    ${a.length?en("today",r("Aujourd\u2019hui"),e.comfort?r("Mesures et ressenti"):r("Conditions actuelles"),i,()=>Ki(e,i.uid,i.station,Lt(e.air.today),a)):p}
    ${s.length?en("predictions",r("Pr\xE9visions"),e.forecastSource,i,()=>zi(e,i.entity,i.uid,Lt(e.air.tomorrow),s)):p}
  </div>`}var nn=C`
  .nw-full { container-type:inline-size; color:var(--nw-fg); }
  .fm-section { padding:20px 24px 24px; border-top:1px solid var(--nw-line-soft); }
  .nw-full > .fm-section:first-child { border-top:0; }
  .fm-head { display:flex; align-items:center; gap:10px; min-width:0; }
  .fm-section > .fm-head { cursor:pointer; user-select:none; -webkit-user-select:none; border-radius:var(--nw-radius); }
  .fm-head:focus-visible { outline:2px solid var(--nw-accent); outline-offset:4px; }
  .fm-head h2 { margin:0; font-size:var(--nw-fs-title); font-weight:750; letter-spacing:-.2px; }
  .fm-head > span:not(.fm-fold):not(.nw-chip) { font-size:var(--nw-fs-small); color:var(--nw-fg2); flex:1; min-width:0; }
  .fm-fold { display:grid; place-items:center; width:30px; height:30px; flex:none; border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:var(--nw-bg); color:var(--nw-fg2); }
  .fm-fold ha-icon { --mdc-icon-size:20px; transition:transform .3s; }
  .folded .fm-fold ha-icon { transform:rotate(-90deg); }
  .fm-body { display:grid; gap:16px; margin-top:16px; }
  @container (max-width:560px) { .fm-section { padding:16px 14px 18px; } }
`;var an=[{d:"M58 0 43 40 61 52 35 88 49 97 24 144 37 151 12 217M43 40 23 56 34 67 17 91M35 88 72 107 64 121 88 147",delay:0},{d:"M42 0 62 35 48 52 81 87 67 102 92 153 80 171 104 216M62 35 85 40 81 58 105 80",delay:-2.1},{d:"M70 0 52 30 66 44 40 78 58 86 30 130 44 136 26 190M52 30 34 42 40 56M40 78 18 96",delay:-4.2}];var sa=40,oa=70,la=25,rn=45,H=class extends V{constructor(){super(...arguments);this.condition="unknown";this.phase="unknown";this.quality="standard";this.animated=!0;this.wind=0;this.gust=0;this.detail="";this.season="";this.visible=!1;this.pageVisible=!0;this.visibility=()=>{this.pageVisible=!document.hidden}}connectedCallback(){super.connectedCallback(),this.visibility(),document.addEventListener("visibilitychange",this.visibility),typeof IntersectionObserver<"u"?(this.observer=new IntersectionObserver(t=>{this.visible=t.some(n=>n.isIntersecting)}),this.observer.observe(this)):this.visible=!0}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.removeEventListener("visibilitychange",this.visibility)}cloud(t){return o`<div class=${`cloud ${t}`}><svg viewBox="0 0 180 112" aria-hidden="true">
      <path class="cloud-rear" d="M42 103C21 103 7 90 7 70C7 53 17 40 33 36C35 16 50 5 69 5C91 5 107 19 109 40C116 37 123 36 130 36C154 36 172 51 172 73C172 92 157 103 137 103Z"/>
      <path class="cloud-near" d="M38 103C26 103 19 95 19 84C19 73 27 65 36 64C38 52 47 45 59 45C72 45 82 54 83 65C99 62 116 72 116 85C116 96 108 103 94 103Z"/>
    </svg></div>`}stars(t){return Array.from({length:t},(n,a)=>{let s=2.2+a*7%10*.26;return o`<i class=${`star${a%6===0?" bright":""}`} style=${`--sx:${48+a*37%50}%;--sy:${4+a*53%62}%;--ss:${1.2+a%4*.5}px;--st:${s}s;--sd:${-(a*.73%s)}s`}></i>`})}fog(){let t=this.detail,n=this.quality==="low",a=t==="dense"||t==="freezing-fog",s=this.phase==="day"||this.phase==="twilight",d=(c,h,m,u,g,v)=>o`<div class=${`fog-band depth-${g}`} style=${`--fy:${h}%;--fl:${m}%;--fw:${u}%;--fd:${13+c*3}s;--fdelay:${-c*2.7}s;--dir:${c%2?-1:1}${v?`;--fh:${v}%`:""}`}><svg viewBox="0 0 600 60" preserveAspectRatio="none"><path d="M0 34C60 16 130 20 190 30S330 48 400 32 520 14 600 28V60H0Z"/></svg></div>`;if(t==="mist")return o`${s?o`<div class="orb sun"><i></i></div>`:o`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer">${Array.from({length:n?3:6},(c,h)=>o`<div class="mist-thread" style=${`--fy:${30+h*11}%;--fl:${[-8,20,-15,26,4,-20][h]}%;--fw:${[90,70,110,64,96,80][h]}%;--fd:${16+h*3}s;--fdelay:${-h*3.1}s;--dir:${h%2?-1:1}`}></div>`)}</div>`;if(t==="patches")return o`${s?o`<div class="orb sun"><i></i></div>`:o`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer patches">${[[0,52,-14,56,2,44],[1,60,36,50,2,40],[2,48,66,52,2,46],[3,68,10,60,1,34]].slice(0,n?2:4).map(([c,h,m,u,g,v])=>d(c,h,m,u,g,v))}</div>`;let l=n?a?4:3:a?7:5;return o`${s&&!a?o`<div class="fog-sun"></div>`:p}${a?o`<div class="fog-wall"></div>`:p}
      <div class="fog-layer">${Array.from({length:l},(c,h)=>d(h,(a?2:6)+h*(a?12:16),[-10,18,-25,30,0,-15,22][h],[120,95,140,85,130,110,100][h],h%3))}</div>
      ${t==="freezing-fog"?o`<div class="ice-air">${Array.from({length:n?8:22},(c,h)=>o`<i style=${`--x:${(h*37+5)%96}%;--y:${8+h*53%80}%;--t:${2.4+h%5*.5}s;--dl:-${h*.7%3}s`}></i>`)}</div>`:p}`}ice(t){return o`<div class=${`ice ${t}`}>${Array.from({length:this.quality==="low"?4:10},(n,a)=>o`<i style=${`--x:${4+(a*17*37+11)%92}%;--dl:-${(a*37+11)%30/10}s`}></i>`)}</div>`}windLines(t=!1){let n=Math.max(this.gust,this.wind*1.6)>=100,a=this.quality==="low"?t?2:4:t?5:n?14:10,s=["M0 20C60 8 120 30 180 18S300 6 400 20","M0 14C80 24 160 4 240 16S340 26 400 12","M0 18C90 10 170 26 260 16C320 10 350 0 340 -8C332 -16 316 -8 324 2","M0 22C70 14 140 24 210 16S330 8 400 18","M0 16C100 22 200 8 290 18C340 24 372 12 364 2C358 -6 344 0 350 8"],d=t?[0,1,3]:[0,1,2,3,4];return o`<div class="wind">${Array.from({length:a},(l,c)=>{let h=(t?3.6:n?1.5:2.3)+c*37%9/10;return o`<div class="wind-line" style=${`--wy:${8+c*29%80}%;--wx:${-10+c*41%45}%;--ww:${55+c*23%45}%;--wt:${h}s;--wd:${-(c*1.7%h).toFixed(2)}s;--wo:${(t?.45:.55)+c%3*(t?.12:.2)}`}>
        <svg viewBox="0 -20 400 50" preserveAspectRatio="none"><path d=${s[d[c%d.length]]}/></svg></div>`})}</div>`}cirrus(){return o`<div class="veil-wash"></div>${[0,1,2].slice(0,this.quality==="low"?2:3).map(t=>o`<div class=${`cirrus c${t}`}></div>`)}`}static flake(t){let n="";for(let a=0;a<6;a++){let s=a*Math.PI/3,d=Math.cos(s),l=Math.sin(s),c=_=>[d*_,l*_],[h,m]=c(t);n+=`M0 0L${h.toFixed(1)} ${m.toFixed(1)}`;for(let[_,M]of[[.42,.3],[.68,.22]]){let[G,L]=c(t*_);for(let O of[-1,1]){let w=s+O*Math.PI/4;n+=`M${G.toFixed(1)} ${L.toFixed(1)}l${(Math.cos(w)*t*M).toFixed(1)} ${(Math.sin(w)*t*M).toFixed(1)}`}}let[u,g]=c(t*.24),[v,k]=[Math.cos(s+Math.PI/3)*t*.24,Math.sin(s+Math.PI/3)*t*.24];n+=`M${u.toFixed(1)} ${g.toFixed(1)}L${(Math.cos(s+Math.PI/6)*t*.36).toFixed(1)} ${(Math.sin(s+Math.PI/6)*t*.36).toFixed(1)}L${v.toFixed(1)} ${k.toFixed(1)}`}return n}static planeTint(t){let n=[["#d9a531","#e8b84a","#c76a26"],["#8f9e3e","#e29a34","#b5502a"],["#b64a2b","#c9572f","#7f2c1f"]][t];return B`<linearGradient id=${`nw-plane-${t}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color=${n[0]}/><stop offset=".55" stop-color=${n[1]}/><stop offset="1" stop-color=${n[2]}/></linearGradient>`}frostPane(){let t=[[372,34,58,.9,8,0],[300,18,34,.75,-12,.8],[404,112,30,.7,20,1.6],[246,52,22,.55,4,2.2],[330,88,18,.6,-6,1.2],[214,16,15,.45,14,2.8],[388,158,13,.45,-10,3.2],[270,108,11,.4,0,2],[176,40,12,.35,22,3.6],[140,12,9,.3,-14,4]],n=[[350,70,16],[262,30,10],[396,60,9],[220,78,7]],a=[[318,52],[244,10],[402,22],[286,74],[196,58]];return o`<svg class="frost-pane" viewBox="0 0 420 170" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
      <defs><radialGradient id="nw-bokeh"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${n.map(([s,d,l],c)=>B`<circle class="frost-bokeh" fill="url(#nw-bokeh)" cx=${s} cy=${d} r=${l} style=${`--fd:${c*1.1}s`}/>`)}
      ${t.map(([s,d,l,c,h,m])=>B`<g transform=${`translate(${s} ${d}) rotate(${h})`}><path class="frost-flake" style=${`--fo:${c};--fd:${m}s;stroke-width:${Math.max(1.2,l*.11)}`} d=${H.flake(l)}/></g>`)}
      ${a.map(([s,d],l)=>B`<path class="frost-spark" style=${`--fd:${l*.7}s`} transform=${`translate(${s} ${d})`} d="M0 -6L1.2 -1.2L6 0L1.2 1.2L0 6L-1.2 1.2L-6 0L-1.2 -1.2Z"/>`)}
    </svg>`}static petal(t){return o`<svg class=${`petal petal-${t}`} viewBox="0 0 12 12"><path d="M6 0C10 3 10 9 6 12C2 9 2 3 6 0Z"/></svg>`}static plane(t){return o`<svg class=${`plane plane-${t}`} viewBox="0 0 44 44"><defs>${H.planeTint(t)}</defs>
      <path class="stem" d="M22 30.5Q23 37 21 42.5"/><path class="blade" fill=${`url(#nw-plane-${t})`} d="M22 32Q14 34 8 31L4 28.5L7.5 27Q11 25.5 10 22.5L4.5 21L6.5 19.5L1 13L4.5 12.5L3 9Q8 9 10.5 12L11.5 10Q14.5 13 16 16Q15.3 11 16.8 7.6L15.4 6.2L18.8 5.3Q20.8 3.6 22 1Q23.2 3.6 25.2 5.3L28.6 6.2L27.2 7.6Q28.7 11 28 16Q29.5 13 32.5 10L33.5 12Q36 9 41 9L39.5 12.5L43 13L37.5 19.5L39.5 21L34 22.5Q33 25.5 36.5 27L40 28.5L36 31Q30 34 22 32Z"/><path class="veins" d="M22 31V4M22 31Q14 22 3.5 10M22 31Q30 22 40.5 10M22 31Q14 29 5 28.5M22 31Q30 29 39 28.5M22 19L17 13.5M22 19L27 13.5M22 12L19 8.5M22 12L25 8.5M13.5 21.5L8.5 18.5M30.5 21.5L35.5 18.5M10 17L6.5 12.5M34 17L37.5 12.5"/></svg>`}static seed(){return o`<svg class="seed" viewBox="0 0 24 30"><path class="seed-stem" d="M12 29V12"/><ellipse class="seed-body" cx="12" cy="27.5" rx="1.3" ry="2.4"/>
      <path class="seed-rays" d="M12 12L3 6M12 12L5 3M12 12L8 1M12 12L12 0M12 12L16 1M12 12L19 3M12 12L21 6M12 12L1 10M12 12L23 10"/></svg>`}static leaf(t){return o`<svg class=${t?"dry":"gleaf"} viewBox="0 0 28 18"><path d="M2 9C8-2 21 1 27 4C23 17 9 20 2 9Z"/><path d="M0 10 22 6"/></svg>`}blown(t,n){let a=t==="seed"?1.5:t==="petal"?1.15:1,s=t==="plane"?1.4:1;return Array.from({length:this.quality==="low"?2:n},(d,l)=>{let c=g=>{let v=Math.sin((l+1)*91.7+g*47.3)*24634.6345;return v-Math.floor(v)},h=(3.2+c(1)*2.6)*a,m=t==="leaf"||t==="dry",u=t==="petal"?H.petal(l%2):t==="plane"?H.plane(l%3):t==="seed"?H.seed():H.leaf(t==="dry");return o`<div class="leaf-track" style=${`--leaf-top:${(18+c(2)*62).toFixed(0)}%;--leaf-delay:${(-c(3)*h).toFixed(2)}s;--leaf-time:${h.toFixed(2)}s`}><div class="leaf-bob" style=${`--bob:${((.7+c(4)*.9)*a).toFixed(2)}s;--lamp:${((6+c(5)*14)*a).toFixed(0)}px;--bd:${(-c(6)*1.5).toFixed(2)}s`}><div class=${`leaf k-${t}`} style=${`--spin:${((.9+c(7)*1.4)*s).toFixed(2)}s;--ls:${(.7+c(8)*.55).toFixed(2)};--lh:${m?((c(9)-.5)*50).toFixed(0):0}deg;--dir:${c(10)<.5?"normal":"reverse"}`}>${u}</div></div></div>`})}seasonal(t,n,a,s,d){let l=this.quality==="low",c=t||n,h=!c&&!s;if(d)return this.season==="spring"?h?this.blown("petal",7):p:this.season==="summer"?h?this.blown("seed",6):p:this.season==="autumn"?!n&&!s?this.blown("plane",5):p:this.season==="winter"?o`${this.frostPane()}${h?this.blown("dry",3):p}`:h?this.blown("leaf",5):p;let m=a||this.wind>=30||this.gust>=rn,u=(g,v)=>Array.from({length:l?2:g},(k,_)=>o`<div class=${`drift${m?" drift--gusty":""}`} style=${`--dx:${46+_*23%50}%;--dt:${(m?5:11)+_*7%(m?4:7)}s;--dd:${-(_*3.1)%11}s;--rest:${12+_*29%70}%;--sw:${2.6+_%3*.5}s`}><i>${v(_)}</i></div>`);return this.season==="spring"&&!c&&!a&&!s?u(6,g=>H.petal(g%2)):this.season==="autumn"&&!["snowy","snowy-rainy","hail"].includes(this.condition)?u(5,g=>H.plane(g%3)):this.season==="summer"&&this.phase==="day"&&["sunny","partlycloudy"].includes(this.condition)?o`<div class="heat">${Array.from({length:l?3:7},(g,v)=>o`<div class="heat-plume" style=${`--hx:${47+v*13%46}%;--hh:${70+v*17%45}px;--hd:${-(v*.9)%4.2}s;--hs:${1.6+v%3*.35}s`}><svg viewBox="0 0 24 120" preserveAspectRatio="none"><defs><linearGradient id=${`nw-heat-${v}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="heat-stop" stop-opacity="0"/><stop offset=".35" class="heat-stop" stop-opacity=".6"/><stop offset="1" class="heat-stop" stop-opacity="0"/></linearGradient></defs><path stroke=${`url(#nw-heat-${v})`} d="M12 120C4 104 20 92 12 76S4 48 12 32S20 10 12 0"/></svg></div>`)}</div>`:this.season==="winter"?this.frostPane():p}render(){let t=this.detail,n=this.quality==="low",a=t==="freezing-rain",s=t==="storm-hail",d=t==="storm-risk",l=["showers","showers-light","snow-showers","sleet-showers","storm-showers"].includes(t),c=["rainy","pouring","lightning-rainy","snowy-rainy","hail"].includes(this.condition)||s,h=this.condition==="hail"||s,m=["snowy","snowy-rainy"].includes(this.condition)&&!a||h,u=["lightning","lightning-rainy"].includes(this.condition),g=u&&!d,v=this.condition==="fog",k=!v&&!["sunny","clear-night","unknown","exceptional"].includes(this.condition),_=["sunny","clear-night","partlycloudy","windy"].includes(this.condition)||l||d,M=["windy","windy-variant"].includes(this.condition)||this.wind>=sa||this.gust>=oa,G=!M&&(this.wind>=la||this.gust>=rn),L=this.condition==="pouring",O=L||g&&t!=="storm-showers"||h||t==="overcast",w=n?t==="heavy-snow"?14:t==="flurries"?5:8:L?80:h?18:t==="drizzle"?30:t==="showers-light"?20:c?52:t==="flurries"?22:t==="heavy-snow"?160:m?90:20,S=M?-150:L?-85:-38,I=(b,x=w)=>Array.from({length:x},(z,X)=>{let F=U=>{let te=Math.sin((X+1)*12.9898+U*78.233+b.length*3.1)*43758.5453;return te-Math.floor(te)},at=`--x:${(F(1)*104-2).toFixed(1)}%;--rest:${(F(2)*88).toFixed(0)}%`;if(b==="rain"){let U=F(3)<.45?0:F(3)<.82?1:2,te=(L?.45:t==="drizzle"?1.5:.8)*(.85+F(4)*.35)*(1+(2-U)*.18),xe=(L?34:t==="drizzle"?10:a?16:22)*(.55+F(5)*.7)*(.7+U*.2),rt=(L?2.4:t==="drizzle"?1.3:1.9)*(.75+U*.2),pn=(M?24:L?15:t==="drizzle"?5:9)+(F(6)-.5)*5;return o`<i class=${`particle rain depth-${U}`} style=${`${at};--delay:${(-F(7)*te).toFixed(2)}s;--duration:${te.toFixed(2)}s;--len:${xe.toFixed(1)}px;--w:${rt.toFixed(2)}px;--rot:${pn.toFixed(1)}deg;--o:${(.5+U*.18+F(8)*.2).toFixed(2)};--drift:${S+(F(9)-.5)*20}px`}></i>`}if(b==="snow"){let U=n?F(3)<.6?1:2:F(3)<.4?0:F(3)<.75?1:F(3)<.93?2:3,te=[13,10.5,8.5,7][U]*(.85+F(4)*.3)*(t==="heavy-snow"?.6:1),xe=[[2,3.4],[3,5],[4.5,6.5],[6.5,9.5]][U],rt=xe[0]+F(5)*(xe[1]-xe[0]);return o`<i class=${`particle snow depth-${U}`} style=${`${at};--delay:${(-F(7)*te).toFixed(2)}s;--duration:${te.toFixed(2)}s;--size:${rt.toFixed(1)}px;--o:${([.5,.62,.72,.78][U]+F(8)*.18).toFixed(2)};--blur:${[.3,.2,.5,1.1][U]}px;--amp:${([3,5,8,11][U]*(.6+F(9)*.8)).toFixed(1)}px;--sw:${(2.2+F(10)*2.5).toFixed(2)}s`}></i>`}let Gt=1.9+X*37%8/10,cn=4+X%3;return o`<i class=${`particle ${b} depth-${X%3}`} style=${`${at};--delay:${-(X*13%37)/37*Gt}s;--duration:${Gt}s;--size:${cn}px;--drift:${S}px;--dx:${(X%2?1:-1)*(5+(X*5*37+11)%8)}px`}></i>`}),D=b=>a?this.ice("glaze"):o`<div class="wet"></div>${t==="drizzle"?p:Array.from({length:n?Math.min(b,5):b},(x,z)=>o`<i class="splash" style=${`--x:${4+(z*11*37+11)%92}%;--d:${1.1+(z*37+11)%7/10}s;--dl:-${(z*3*37+11)%150/100}s`}></i>`)}`,P=o`${c?I("rain",h&&!n?18:w):p}${m?I(h?"hailstone":"snow",h&&!n?s?22:30:w):p}
        ${c?D(L?18:h?8:t==="showers-light"?6:14):p}`;return o`<div class=${`scene ${this.phase} ${this.condition}${t?` detail-${t}`:""}${M?" gale":""}${this.season?` season-${this.season}`:""}`} style=${`--play:${this.animated&&this.visible&&this.pageVisible?"running":"paused"};--cloud-duration:${M?6:Math.max(11,28-Math.min(Math.max(this.wind,0),60)/2.5)}s`} ?data-still=${!this.animated}>
      <div class="weather-art">${this.condition!=="unknown"&&this.condition!=="exceptional"?o`
        ${this.phase==="night"&&_?this.stars(this.quality==="low"?8:this.condition==="partlycloudy"&&t!=="few"?12:24):p}
        ${_?this.phase==="night"?o`<div class="orb moon"><i></i><b></b></div>`:o`<div class="orb sun"><i></i></div>`:p}
        ${O?o`<div class="overcast"></div>${this.cloud("heavy-left")}${n?p:this.cloud("heavy-right")}${t==="overcast"&&!n?this.cloud("back"):p}`:t==="veil"?this.cirrus():t==="few"?this.cloud("front"):k?o`${this.cloud("back")}${this.cloud("front")}${n?p:this.cloud("small")}`:p}
        ${v?this.fog():p}
        ${t==="freezing-fog"?this.ice("rime"):p}
        ${this.condition!=="unknown"?this.seasonal(c,m,u,v,M):p}
        ${l?o`<div class="burst">${P}</div>`:P}
        ${this.condition==="snowy"&&t!=="flurries"?o`<div class="snowbank"><svg viewBox="0 0 400 20" preserveAspectRatio="none"><defs><linearGradient id="nw-snowbank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe9f4"/></linearGradient></defs>
          <path d="M0 20V11C22 6 40 13 66 9S112 4 140 9 190 14 222 8 276 4 306 10 360 13 400 8V20Z"/></svg>
          ${Array.from({length:n?3:8},(b,x)=>o`<i style=${`--x:${6+(x*13*37+11)%88}%;--dl:-${(x*37+11)%26/10}s`}></i>`)}</div>`:p}
        ${M?this.windLines():G?this.windLines(!0):p}
        ${u?o`${g?an.map((b,x)=>o`<div class=${`bolt b${x+1}`} style=${`animation-delay:${b.delay}s`}><svg viewBox="0 0 120 220"><path d=${b.d}/></svg></div>`):p}
          ${an.map((b,x)=>o`<div class=${`flash f${x+1}`} style=${`animation-delay:${b.delay}s`}></div>`)}`:p}
      `:p}</div>
    </div>`}};H.styles=C`
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
    /* --nw-orb-x lets a smaller card move the sun or moon away from its text. */
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
    .cloud {position:absolute;width:190px;height:120px;overflow:visible;filter:drop-shadow(0 5px 7px #172d4317);animation:clouds var(--cloud-duration,32s) ease-in-out infinite alternate;}
    /* Animated artwork is wrapped in a div: Chrome can only hand HTML boxes to the GPU, an animated <svg> restyles every frame. */
    :is(.cloud,.fog-band,.heat-plume,.leaf,.bolt)>svg {display:block;width:100%;height:100%;overflow:visible;}
    .cloud-rear {fill:#d6dde3;}.cloud-near {fill:#f4f7f8;}
    .cloud.back {left:55%;top:15px;width:220px;height:140px;opacity:.62;animation-delay:-12s;}
    .cloud.front {left:73%;top:90px;animation-delay:-4s;}
    .cloud.small {left:93%;top:6px;width:150px;height:95px;opacity:.7;animation-delay:-22s;}
    /* Storms and downpours: a dark ceiling and two extra banks of cloud, so the sky reads thick and closed. */
    .overcast {position:absolute;left:30%;right:0;top:0;height:46%;background:linear-gradient(180deg,rgba(28,38,52,.32),rgba(28,38,52,0));filter:blur(10px);}
    .cloud.heavy-left {left:40%;top:-34px;width:300px;height:180px;opacity:.9;animation-delay:-8s;}
    .cloud.heavy-right {left:80%;top:-40px;width:320px;height:190px;opacity:.85;animation-delay:-17s;}
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
    .snowbank svg {display:block;width:100%;height:100%;}.snowbank path {fill:url(#nw-snowbank);}
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
      .cloud.heavy-left {left:auto;right:30%;width:220px;}.cloud.heavy-right {left:auto;right:-20%;width:240px;}
      .orb {left:var(--nw-orb-x,auto);right:12%;top:36px;}.cloud.back {left:auto;right:22%;top:20px;width:170px;}.cloud.front {left:auto;right:0;top:90px;width:150px;}.cloud.small {left:auto;right:-12%;top:6px;width:120px;}
      .bolt.b1 {left:auto;right:18%;}.bolt.b2 {left:auto;right:2%;}.bolt.b3 {left:auto;right:42%;}
      .flash.f1 {--fx:70%;}.flash.f2 {--fx:94%;}.flash.f3 {--fx:48%;}
      .fog-sun {left:auto;right:14%;}
      .frost-pane {width:70%;height:150px;}
    }
    @media(prefers-reduced-motion:reduce) {.scene *,.scene *::before,.scene *::after{animation:none!important;}.snowbank{scale:1 1;}.particle{translate:0 var(--rest);}.drift{top:var(--rest);}.frost-bokeh{opacity:.6;}.bolt.b1{opacity:.8;}.flash{opacity:0;}.burst{opacity:1;}.wind-line{-webkit-mask-position:50% 0;mask-position:50% 0;}}
  `,$([R()],H.prototype,"condition",2),$([R()],H.prototype,"phase",2),$([R()],H.prototype,"quality",2),$([R({type:Boolean})],H.prototype,"animated",2),$([R({type:Number})],H.prototype,"wind",2),$([R({type:Number})],H.prototype,"gust",2),$([R()],H.prototype,"detail",2),$([R()],H.prototype,"season",2),$([j()],H.prototype,"visible",2),$([j()],H.prototype,"pageVisible",2),H=$([Q("niak-weather-sky")],H);var da={format:"full",show_synthesis:!0,show_bulletin:!0,show_today:!0,show_predictions:!0,collapse_today:!1,collapse_predictions:!1,smart_brief:!0,weather_animations:!0,weather_animation_quality:"standard",show_atmo_details:!0,show_atmo_tomorrow:!0,glass_effect:!0,tile_blocks:["bulletin","events"],forecast_tab:"hours",pressure_span:"6h",wind_span:"6h",rain_span:"7d",clock:"none"},ca={entry_id:f("Lieu"),format:f("Format"),weather_animations:f("Ciel anim\xE9 et halos"),weather_animation_quality:f("Qualit\xE9 des animations"),glass_effect:f("Effet verre d\xE9poli"),show_synthesis:f("Bandeau (synth\xE8se et m\xE9t\xE9o du moment)"),show_bulletin:f("Bulletin du jour"),smart_brief:f("Alertes et \xE9v\xE9nements"),show_today:f("Section Aujourd\u2019hui"),collapse_today:f("Aujourd\u2019hui repli\xE9 au d\xE9part"),show_predictions:f("Section Pr\xE9visions"),collapse_predictions:f("Pr\xE9visions repli\xE9es au d\xE9part"),show_atmo_details:f("D\xE9tail des polluants et des pollens"),show_atmo_tomorrow:f("Air et pollens de demain"),weather_path:f("Page \xE0 ouvrir"),tile_blocks:f("Contenu de la tuile d\xE9pli\xE9e"),card_blocks:f("Contenu de la carte"),hide_when_calm:f("Seulement en cas d\u2019orage"),forecast_tab:f("Pr\xE9visions affich\xE9es au d\xE9part"),banner_blocks:f("Contenu du bandeau"),today_blocks:f("Contenu d\u2019Aujourd\u2019hui"),forecast_blocks:f("Contenu des Pr\xE9visions"),hold_action:f("Appui long"),tap_action:f("Appui"),pressure_span:f("Courbe de pression"),wind_span:f("Courbe du vent"),rain_span:f("Barres de pluie"),clock:f("Heure dans le bandeau")},pa={weather_animations:f("Coup\xE9es, le ciel et les halos restent fixes."),weather_animation_quality:f("All\xE9g\xE9e : moins de gouttes, de flocons et de nuages."),glass_effect:f("Le flou demande beaucoup de ressources : \xE0 couper sur un appareil lent. Coup\xE9, le verre devient plus opaque."),smart_brief:f("La vigilance, l\u2019alerte mesur\xE9e chez vous et la frise des \xE9v\xE9nements. Coup\xE9, la frise ne montre que le ciel pr\xE9vu."),weather_path:f("Le chemin de la page, par exemple /meteo ou /lovelace/meteo."),tile_blocks:f("Cochez ce qui s\u2019affiche quand la tuile est d\xE9pli\xE9e, et faites glisser pour changer l\u2019ordre."),banner_blocks:f("Le bandeau et son ciel anim\xE9 restent toujours, avec le lieu, la vigilance et la m\xE9t\xE9o du moment. Cochez ce qu\u2019il montre en dessous, dans l\u2019ordre."),card_blocks:f("Cochez ce que la carte montre."),hide_when_calm:f("Cach\xE9e tant qu\u2019aucun orage n\u2019est \xE0 moins de 30 km ; visible pendant la modification du tableau de bord."),today_blocks:f("Tout d\xE9cocher retire la section."),forecast_blocks:f("Tout d\xE9cocher retire la section."),forecast_tab:f("Un appui sur Heures ou Jours change l\u2019affichage ; ce choix est gard\xE9 sur chaque appareil."),pressure_span:f("Sur plusieurs jours, on voit mieux arriver une d\xE9pression ou un anticyclone."),rain_span:f("24 heures et 30 jours demandent un pluviom\xE8tre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours."),clock:f("L\u2019heure de l\u2019appareil, mise \xE0 jour chaque minute.")},sn="/config/integrations/integration/niak_weather",nt={large:["full","tile","intermediate"],piece:["comfort","rain","wind","pressure","lightning","air","forecast"],small:["mini","alert"]},Ut=(e="full")=>Object.keys(nt).find(i=>nt[i].includes(e))??"large",re=class extends V{constructor(){super(...arguments);this.asked=!1;this.computeLabel=t=>t.title??(t.name==="hold_action"&&this.tapped?r("Appui"):r(ca[t.name]??t.name));this.computeHelper=t=>r(pa[t.name]??"");this.follow=t=>{t.preventDefault(),history.pushState(null,"",t.currentTarget.getAttribute("href")??sn),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}))}}get small(){return!!this.config?.format&&this.config.format!=="full"}get tapped(){return this.config?.format==="mini"||this.config?.format==="alert"}setConfig(t){let n=Ee(t);this.config&&JSON.stringify(n)===JSON.stringify(this.config)||(this.config=n)}shouldUpdate(t){return t.has("hass")&&this.hass&&Me(this.hass.language,this.hass.locale?.language)?!0:(t.has("hass")&&!this.asked&&this.hass&&(this.asked=!0,this.hass.callWS({type:"niak_weather/entries"}).then(n=>{this.entries=n},()=>{this.entries=null})),!(t.size===1&&t.has("hass")))}changed(t){if(t.stopPropagation(),!this.config)return;let n={...t.detail.value};n.kind&&n.kind!==Ut(this.config.format)&&(n.format=nt[n.kind][0]),delete n.kind,n.format&&n.format!==this.config.format&&(delete n.card_blocks,delete this.config.card_blocks);for(let[a,s]of Object.entries(pi)){let d=n[a],l=this.config[a]??[];Array.isArray(d)&&(n[a]=hi(l,d,s))}this.config=Ee({...this.config,...n}),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:!0,composed:!0}))}schema(){let t=(...P)=>P.map(b=>({name:b,selector:{boolean:{}}})),n=(P,b,x,z=!1)=>({type:"expandable",name:"",title:P,icon:b,flatten:!0,expanded:z,schema:x}),a={name:"kind",title:r("Type de carte"),required:!0,selector:{select:{mode:"list",options:[{value:"large",label:r("Grandes cartes : la page m\xE9t\xE9o et la tuile")},{value:"piece",label:r("Cartes \xE0 la pi\xE8ce : ressenti, pluie, vent, pression, \xE9clairs, air, pr\xE9visions")},{value:"small",label:r("Petites cartes : une ligne ou une alerte")}]}}},s=[{value:"full",label:r("Compl\xE8te : la page m\xE9t\xE9o")},{value:"tile",label:r("Tuile : une bande qui se d\xE9plie d\u2019un appui")},{value:"intermediate",label:r("Tuile d\xE9pli\xE9e : la m\xEAme, ouverte au d\xE9part")},{value:"mini",label:r("Mini : une seule ligne")},{value:"comfort",label:r("Ressenti : la temp\xE9rature per\xE7ue")},{value:"rain",label:r("Pluie : \xE0 venir et tomb\xE9e")},{value:"wind",label:r("Vent : le vent du moment et sa courbe")},{value:"pressure",label:r("Pression : la pression et sa courbe")},{value:"lightning",label:r("\xC9clairs : le radar des orages (Blitzortung)")},{value:"air",label:r("Air et pollens : aujourd\u2019hui et demain")},{value:"forecast",label:r("Pr\xE9visions : les heures et les jours")},{value:"alert",label:r("Alerte : visible seulement en cas de vigilance ou d\u2019alerte")}],d=nt[Ut(this.config?.format)],l=[a,{name:"format",required:!0,selector:{select:{mode:"dropdown",options:d.map(P=>s.find(b=>b.value===P))}}}],c={name:"tile_blocks",selector:{select:{multiple:!0,reorder:!0,mode:"list",options:[{value:"bulletin",label:r("Bulletin du jour")},{value:"events",label:r("\xC9v\xE9nements (la frise)")},{value:"moments",label:r("Les prochains moments (soir, nuit, matin\u2026)")},{value:"forecast",label:r("Pr\xE9visions (heures ou jours)")}]}}},h={name:"forecast_tab",selector:{select:{mode:"dropdown",options:[{value:"hours",label:r("Heures")},{value:"days",label:r("Jours")}]}}},m=this.config?.format==="tile"||this.config?.format==="intermediate",u=this.config?.hold_action??(this.config?.weather_path?"page":"popup"),g=m?this.config?.tap_action??"toggle":void 0,v=P=>({name:P,required:!0,selector:{select:{mode:"dropdown",options:[...m?[{value:"toggle",label:r("D\xE9plier ou replier la tuile")}]:[],{value:"popup",label:r("Ouvrir la m\xE9t\xE9o compl\xE8te en fen\xEAtre")},{value:"page",label:r("Ouvrir une page")},{value:"none",label:r("Rien")}]}}}),k=[...m?[v("tap_action")]:[],v("hold_action"),...u==="page"||g==="page"?[{name:"weather_path",selector:{text:{}}}]:[]],_=this.entries&&this.entries.length>1?[{name:"entry_id",selector:{select:{options:this.entries.map(P=>({value:P.entry_id,label:P.title}))}}}]:[],M=n(r("Visuel et performance"),"mdi:palette-outline",[...t("weather_animations"),{name:"weather_animation_quality",required:!0,selector:{select:{mode:"dropdown",options:[{value:"standard",label:r("Standard")},{value:"low",label:r("All\xE9g\xE9e")}]}}},...t("glass_effect")],!0),G=[["6h",r("6 derni\xE8res heures")],["1d",r("24 derni\xE8res heures")],["2d",r("2 derniers jours")],["7d",r("7 derniers jours")]],L=(P,b)=>({name:P,required:!0,selector:{select:{mode:"dropdown",options:b.map(([x,z])=>({value:x,label:z}))}}}),O=this.config?.format;if(O==="mini"||O==="alert")return[..._,...l,n(r("Fonctionnalit\xE9s"),"mdi:tune-variant",k,!0)];let w=(P,b=!1)=>({name:"card_blocks",selector:{select:{multiple:!0,reorder:b,mode:"list",options:P.map(([x,z])=>({value:x,label:z}))}}}),S=(P,...b)=>[..._,...l,n(r("Contenu"),"mdi:view-list-outline",[P,...b],!0)],I=this.config?Se(this.config):[];if(O==="comfort")return S(w([["feel",r("Le ressenti et son explication")],["gauge",r("La jauge de \u22125 \xE0 45 \xB0C")],["factors",r("Ce qui le fait varier (humidit\xE9, vent, soleil)")],["extras",r("Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)")]]));if(O==="rain")return S(w([["ahead",r("\xC0 venir : la prochaine heure et les 6 heures")],["now",r("Tomb\xE9e aujourd\u2019hui, et en ce moment")],["chart",r("Les barres de pluie")],["stats",r("Les cumuls")]]),L("rain_span",[["24h",r("24 derni\xE8res heures (une barre par heure)")],["7d",r("7 derniers jours")],["30d",r("30 derniers jours (une barre par jour)")]]));if(O==="wind")return S(w([["ahead",r("\xC0 venir : le vent le plus fort des 6 heures")],["now",r("Le vent du moment et sa direction")],["chart",r("La courbe")],["stats",r("Rafales, direction et maximum du jour")]]),L("wind_span",G));if(O==="pressure")return S(w([["ahead",r("\xC0 venir : la pression des 6 heures, si votre fournisseur la pr\xE9voit")],["now",r("La pression et sa tendance")],["chart",r("La courbe")],["stats",r("Les valeurs pass\xE9es, le minimum et le maximum")]]),L("pressure_span",G));if(O==="lightning")return S(w([["ahead",r("\xC0 venir : un orage pr\xE9vu dans les 6 heures")],["now",r("L\u2019\xE9clair le plus proche et sa direction")],["radar",r("Le radar et le niveau")],["stats",r("Les comptes (heure, 10 minutes, mois)")]]),...t("hide_when_calm"));if(O==="air")return S(w([["air_today",r("Air ext\xE9rieur aujourd\u2019hui")],["pollen_today",r("Pollens aujourd\u2019hui")],["air_tomorrow",r("Air ext\xE9rieur demain")],["pollen_tomorrow",r("Pollens demain")]],!0),...t("show_atmo_details"));if(O==="forecast")return S(w([["hours",r("Les 18 prochaines heures")],["days",r("Les 7 prochains jours")]]),...I.includes("hours")&&I.includes("days")?[h]:[]);if(this.small)return[..._,...l,M,n(r("Contenu"),"mdi:view-list-outline",[c,...(this.config?.tile_blocks??[]).includes("forecast")?[h]:[]],!0),n(r("Fonctionnalit\xE9s"),"mdi:tune-variant",k)];let D=(P,b)=>({name:P,selector:{select:{multiple:!0,reorder:!0,mode:"list",options:b.map(([x,z])=>({value:x,label:z}))}}});return[..._,...l,M,n(r("Bandeau intelligent"),"mdi:view-day-outline",[D("banner_blocks",[["bulletin",r("Bulletin du jour")],["events",r("\xC9v\xE9nements (la frise)")],["moments",r("Les prochains moments (soir, nuit, matin\u2026)")],["forecast",r("Pr\xE9visions en tuiles (heures ou jours)")]]),L("clock",[["none",r("Masqu\xE9e")],["left",r("Sous le titre, en grand")],["right",r("Au-dessus de \xAB En ce moment \xBB")]])],!0),n(r("Aujourd\u2019hui"),"mdi:calendar-today",[D("today_blocks",[["rain",r("Pluie")],["wind",r("Vent")],["pressure",r("Pression")],["lightning",r("\xC9clairs (avec Blitzortung)")],["comfort",r("Ressenti")],["extras",r("Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)")],["air",r("Air et pollens du jour")]]),L("rain_span",[["24h",r("24 derni\xE8res heures (une barre par heure)")],["7d",r("7 derniers jours")],["30d",r("30 derniers jours (une barre par jour)")]]),L("wind_span",G),L("pressure_span",G),...t("collapse_today")]),n(r("Pr\xE9visions"),"mdi:calendar-week",[D("forecast_blocks",[["hours",r("Les 18 prochaines heures")],["days",r("Les 7 prochains jours")],["air",r("Air et pollens de demain")]]),...t("collapse_predictions")]),n(r("Air et pollens"),"mdi:flower-pollen-outline",t("show_atmo_details"))]}render(){if(!this.config||!this.hass)return p;let t=qe(this.config),n={...this.config.show_bulletin===!1?{tile_blocks:["events"]}:{},banner_blocks:t.banner,today_blocks:t.today,forecast_blocks:t.forecasts,card_blocks:Se(this.config)},a={tap_action:"toggle",hold_action:this.config.weather_path?"page":"popup"},s=Object.fromEntries(Object.entries({...da,...a,...n,...this.config,kind:Ut(this.config.format)}).filter(([l])=>l!=="type")),d=this.entries?.length===1?this.entries[0]:void 0;return o`
      ${this.entries===null?o`<p class="note warn">${r("L\u2019int\xE9gration Hestia Weather ne r\xE9pond pas : la carte en a besoin depuis la version 2.0.")}
          ${r("D\xE9j\xE0 t\xE9l\xE9charg\xE9e ?")} <a href="/config/integrations/dashboard/add?domain=niak_weather" @click=${this.follow}>${r("Ajoutez-la")}</a>.
          ${r("Sinon,")} <a href="https://github.com/hestiaFB/hestia-weather-integration#installation" target="_blank" rel="noopener noreferrer">${r("installez-la")}</a>.</p>`:this.entries?.length===0?o`<p class="note warn">${r("Ajoutez l\u2019int\xE9gration Hestia Weather : Param\xE8tres \u2192 Appareils et services.")}</p>`:o`<p class="note">${d?o`${r("Lieu :")} <b>${d.title}</b>. `:p}${r("Les sources (pr\xE9visions, station, air et pollens) se r\xE8glent dans")}
          <a href=${sn} @click=${this.follow}>${r("l\u2019int\xE9gration Hestia Weather")}</a>.</p>`}
      <ha-form .hass=${this.hass} .data=${s} .schema=${this.schema()} .computeLabel=${this.computeLabel} .computeHelper=${this.computeHelper} @value-changed=${this.changed}></ha-form>`}};re.styles=C`
    .note { color:var(--secondary-text-color); font-size:13px; line-height:1.6; margin:0 0 16px; }
    .note.warn { color:var(--primary-text-color); }
    a { color:var(--primary-color); }
  `,$([R({attribute:!1})],re.prototype,"hass",2),$([j()],re.prototype,"config",2),$([j()],re.prototype,"entries",2),re=$([Q("niak-weather-card-editor")],re);var on=500,ua=matchMedia("(pointer: coarse)"),ma=0,ln={missing:{title:f("Hestia Weather a besoin de son int\xE9gration"),text:f("Depuis la version 2.0, la carte re\xE7oit ses calculs de l\u2019int\xE9gration Hestia Weather. D\xE9j\xE0 t\xE9l\xE9charg\xE9e depuis HACS ? Ajoutez-la dans Param\xE8tres \u2192 Appareils et services. Sinon, installez-la depuis HACS, red\xE9marrez Home Assistant, puis ajoutez-la. D\xE9j\xE0 ajout\xE9e ? Elle n\u2019a pas d\xE9marr\xE9 : les journaux disent pourquoi (Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB)."),links:[[f("Ajouter l\u2019int\xE9gration"),"/config/integrations/dashboard/add?domain=niak_weather"],[f("L\u2019installer"),"https://github.com/hestiaFB/hestia-weather-integration#installation"]]},not_configured:{title:f("Ajoutez l\u2019int\xE9gration Hestia Weather"),text:f("Elle est install\xE9e mais pas encore configur\xE9e. Elle peut reprendre les r\xE9glages de vos cartes."),links:[[f("Ajouter l\u2019int\xE9gration"),"/config/integrations/dashboard/add?domain=niak_weather"]]},choose_entry:{title:f("Choisissez un lieu"),text:f("Plusieurs lieux Hestia Weather sont configur\xE9s : choisissez celui de cette carte dans ses r\xE9glages.")},not_found:{title:f("Lieu introuvable"),text:f("Le lieu de cette carte n\u2019existe plus : choisissez-en un autre dans ses r\xE9glages.")},version:{title:f("Rechargez la page"),text:f("L\u2019int\xE9gration Hestia Weather vient d\u2019\xEAtre mise \xE0 jour : rechargez la page pour afficher sa carte.")},error:{title:f("L\u2019int\xE9gration Hestia Weather a renvoy\xE9 une erreur"),text:f("Les journaux de Home Assistant disent pourquoi : Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB."),links:[[f("Voir les journaux"),"/config/logs"]]}},W=class extends V{constructor(){super(...arguments);this.editMode=!1;this.preview=!1;this.tab="hours";this.failure="";this.open=!1;this.dialogOpen=!1;this.folded={today:!1,predictions:!1};this.uid=`nw${++ma}`;this.setTab=t=>{this.tab=t;try{localStorage.setItem(`niak-weather:tab:${this.config?.entry_id??""}`,t)}catch{}};this.picker=!1;this.follow=t=>{let n=t.currentTarget.getAttribute("href");n?.startsWith("/")&&(t.preventDefault(),this.go(n))};this.down=t=>{let n=this.tileCard();if(t.button!==0||!n)return;this.cancelPress();let a=n.querySelector(".press-ring"),s=n.getBoundingClientRect(),d=performance.now();a?.style.setProperty("left",`${t.clientX-s.left}px`),a?.style.setProperty("top",`${t.clientY-s.top}px`);let l=()=>{let h=Math.min(1,(performance.now()-d)/on);a?.style.setProperty("--p",String(h)),n.classList.toggle("pressing",h>.15),h<1&&this.press&&(this.press.frame=requestAnimationFrame(l))},c=this.holdTarget!=="none";this.press={x:t.clientX,y:t.clientY,long:!1,frame:c?requestAnimationFrame(l):0,timer:setTimeout(()=>{!this.press||!c||(this.press.long=!0,this.stopRing(),this.act(this.holdTarget))},on)}};this.move=t=>{this.press&&Math.hypot(t.clientX-this.press.x,t.clientY-this.press.y)>10&&this.cancelPress()};this.up=()=>{let t=this.press;this.cancelPress(),t&&!t.long&&this.act(this.tapTarget)};this.cancelPress=()=>{this.stopRing(),this.press=void 0};this.noMenu=t=>t.preventDefault();this.tileKey=t=>{t.target!==this.tileCard()||!["Enter"," "].includes(t.key)||(t.preventDefault(),this.act(t.shiftKey?this.holdTarget:this.tapTarget))};this.tap=t=>{t.target.closest("dialog")||this.act(this.holdTarget)};this.tapKey=t=>{!["Enter"," "].includes(t.key)||t.target.closest("dialog")||this.holdTarget==="none"||(t.preventDefault(),this.act(this.holdTarget))};this.closeDialog=()=>{this.renderRoot.querySelector("dialog")?.close()};this.openEntity=t=>{let n=t.composedPath().find(a=>a instanceof HTMLElement&&a.hasAttribute("data-entity"));!n||n.closest(".nw-tilecard")||(this.closeDialog(),this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:n.getAttribute("data-entity")},bubbles:!0,composed:!0})))};this.entityKey=t=>{!["Enter"," "].includes(t.key)||!(t.target instanceof HTMLElement)||!t.target.hasAttribute("data-entity")||(t.preventDefault(),this.openEntity(t))}}setConfig(t){let n=Ee(t),a=this.config;a&&JSON.stringify(a)===JSON.stringify(n)||(this.config=n,(!a||a.collapse_today!==n.collapse_today||a.collapse_predictions!==n.collapse_predictions)&&(this.folded={today:n.collapse_today===!0,predictions:n.collapse_predictions===!0}),(!a||a.format!==n.format||a.entry_id!==n.entry_id)&&(this.open=this.remembered(n)),(!a||a.forecast_tab!==n.forecast_tab||a.entry_id!==n.entry_id)&&(this.tab=this.rememberedTab(n)),a&&a.entry_id!==n.entry_id&&(this.unsubscribe(),this.view=void 0,this.problem=void 0))}static getStubConfig(){return{type:"custom:niak-weather-card"}}static getConfigElement(){return document.createElement("niak-weather-card-editor")}getCardSize(){return this.config?this.config.format==="mini"?1:this.config.format==="alert"?this.view&&this.hasAlert(this.view)?2:0:this.config.format==="forecast"||this.config.format==="rain"||this.config.format==="air"?5:this.single?this.config.format==="comfort"?3:4:this.tile?this.unfolded?7:2:Math.max(1,(this.config.show_synthesis===!1?0:4)+(this.config.show_today===!1?0:5)+(this.config.show_predictions===!1?0:4)):10}getGridOptions(){let t=this.config?.format;return t==="mini"?{columns:12,rows:1,min_columns:3}:this.tile||this.single||t==="alert"?{columns:12,rows:"auto",min_columns:6}:{columns:"full",rows:"auto"}}get single(){return["comfort","rain","wind","pressure","lightning","air","forecast"].includes(this.config?.format??"")}calm(t){return this.config?.format==="lightning"&&this.config.hide_when_calm===!0&&!!t.lightning&&t.lightning.step===0}get unfolded(){return this.tapTarget==="toggle"||this.holdTarget==="toggle"?this.open:this.config?.format==="intermediate"}get tile(){return this.config?.format==="tile"||this.config?.format==="intermediate"}hasAlert(t){let{alerts:n,points:a}=zt(t);return n.length+a.length>0}rememberedTab(t){try{let n=localStorage.getItem(`niak-weather:tab:${t.entry_id??""}`);if(n==="hours"||n==="days")return n}catch{}return t.forecast_tab??"hours"}key(t=this.config){return`niak-weather:open:${t.format}:${t.entry_id??t.weather_entity??""}`}remembered(t){try{let n=localStorage.getItem(this.key(t));if(n!==null)return n==="1"}catch{}return t.format==="intermediate"}connectedCallback(){super.connectedCallback(),this.picker=this.inPicker(),this.subscribe()}inPicker(){for(let t=this;t;t=t.parentNode??(t instanceof ShadowRoot?t.host:null))if(t instanceof HTMLElement&&t.localName==="hui-card-picker")return!0;return!1}get editing(){return this.editMode||this.preview||this.picker}disconnectedCallback(){super.disconnectedCallback(),this.cancelPress(),this.unsubscribe()}shouldUpdate(t){(t.has("hass")||t.has("config"))&&this.subscribe();let n=this.hass&&`${this.hass.language}|${this.hass.locale?.language??""}`;return n&&n!==this.language?(this.language=n,Me(this.hass.language,this.hass.locale?.language),!0):!(t.size===1&&t.has("hass"))}updated(){this.toggleAttribute("hidden",!!this.view&&!this.editing&&(this.config?.format==="alert"&&!this.hasAlert(this.view)||this.calm(this.view))),this.toggleAttribute("still",this.config?.weather_animations===!1),this.toggleAttribute("flat",this.config?.glass_effect===!1);let t=this.renderRoot.querySelector("dialog");t&&this.dialogOpen&&!t.open&&t.showModal()}subscribe(){let t=this.hass?.connection,n=this.config;if(!t||!n||!this.isConnected)return;let a=`${n.entry_id??""}|${this.hass?.language??""}`;if(this.subscription&&this.subscribedTo===a)return;this.unsubscribe(),this.subscribedTo=a;let s=t.subscribeMessage(d=>this.receive(d),{type:"niak_weather/subscribe",language:this.hass?.language,...n.entry_id?{entry_id:n.entry_id}:{}});this.subscription=s,s.catch(d=>{if(this.subscription!==s)return;this.subscription=void 0;let l=d?.code;this.failure=[d?.message,l].filter(Boolean).join(" \xB7 "),this.problem=l==="not_configured"||l==="choose_entry"||l==="not_found"?l:!l||l==="unknown_command"?"missing":"error",l!=="choose_entry"&&this.retryLater(l==="unknown_command"?3e4:5e3)})}receive(t){if("reload"in t){this.unsubscribe(),this.retryLater(2e3);return}if(t.version!==1){this.problem="version";return}this.problem=void 0,this.view=t.view}unsubscribe(){clearTimeout(this.retry);let t=this.subscription;this.subscription=void 0,this.subscribedTo=void 0,t?.then(n=>n()).catch(()=>{})}retryLater(t){clearTimeout(this.retry),this.retry=setTimeout(()=>this.subscribe(),t)}render(){if(!this.config)return p;if(this.problem&&!this.view)return this.renderProblem(ln[this.problem]);if(!this.view)return o`<ha-card><div class=${`nw-wait${this.config.format==="mini"?" line":""}`} role="status" aria-label=${r("Chargement de la m\xE9t\xE9o")}>
      <i class="dot"></i><i></i><i></i><i></i></div></ha-card>`;let t=this.config,n=ui(this.view,t,this.tile),s=n.wind?.gust.at(-1)?.[1]??n.hours[0]?.gust??0,d=o`<niak-weather-sky .condition=${n.now.condition} .phase=${n.now.phase} .animated=${t.weather_animations!==!1}
      .quality=${t.weather_animation_quality??(this.tile&&ua.matches?"low":"standard")} .wind=${n.now.wind??0} .gust=${s} .detail=${n.now.detail??""} .season=${n.season.info.season}></niak-weather-sky>`,l=()=>tn(n,{sky:d,uid:this.uid,entity:n.weatherEntity,station:n.station,sections:qe(t),tab:this.tab,onTab:this.setTab,clock:t.clock,folded:this.folded,onFold:g=>{this.folded={...this.folded,[g]:!this.folded[g]}}}),c=`${r("M\xE9t\xE9o")}${n.location?` \xB7 ${n.location}`:""}`,h=()=>this.dialogOpen?o`<dialog class="nw-dialog" aria-label=${c} @close=${()=>{this.dialogOpen=!1}} @click=${this.openEntity} @keydown=${this.entityKey}>
        <header><b>${c}</b><button type="button" @click=${this.closeDialog}>${r("Fermer")}</button></header>${l()}</dialog>`:p,m=this.holdTarget;switch(t.format){case"mini":return o`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${Li(n,m)}</div>${h()}</ha-card>`;case"alert":{let g=Ri(n,this.editing);return g===p?p:o`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${g}</div>${h()}</ha-card>`}}if(this.single)return o`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${Yi(n,t.format,Se(t),{uid:this.uid,entity:n.weatherEntity,station:n.station,tab:this.tab,onTab:this.setTab})}</ha-card>`;if(!this.tile)return o`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${l()}</ha-card>`;let u=t.tile_blocks?.length?t.tile_blocks:t.show_bulletin===!1?["events"]:Ti;return o`<ha-card>
      <div @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.up} @pointercancel=${this.cancelPress} @pointerleave=${this.cancelPress}
        @contextmenu=${this.noMenu} @keydown=${this.tileKey}>
        ${Si(n,d,{open:this.unfolded,tapTarget:this.tapTarget,holdTarget:m,blocks:u,tab:this.tab,onTab:this.setTab})}</div>
      ${h()}
    </ha-card>`}renderProblem(t){return o`<ha-card><div class="nw-problem" role="status"><ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
      <div><b>${r(t.title)}</b>${t===ln.error&&this.failure?o`<p class="failure">« ${this.failure} »</p>`:p}<p>${r(t.text)}</p>${t.links?o`<div class="links">${t.links.map(([n,a],s)=>o`<a class=${s?"second":""} href=${a}
        target=${a.startsWith("/")?p:"_blank"} rel="noopener noreferrer" @click=${this.follow}>${r(n)}</a>`)}</div>`:p}</div></div></ha-card>`}go(t){history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}))}get holdTarget(){return this.target(this.config?.hold_action??(this.weatherPath?"page":"popup"))}get tapTarget(){return this.target(this.config?.tap_action??"toggle")}target(t){return t==="none"?"none":t==="toggle"?this.tile?"toggle":"card":t==="page"&&this.weatherPath?"page":"card"}get weatherPath(){let t=this.config?.weather_path;return t?.startsWith("/")&&!t.startsWith("//")?t:void 0}tileCard(){return this.renderRoot.querySelector(".nw-tilecard")}stopRing(){this.press&&(clearTimeout(this.press.timer),cancelAnimationFrame(this.press.frame),this.tileCard()?.classList.remove("pressing"))}toggle(){this.open=!this.open;try{localStorage.setItem(this.key(),this.open?"1":"0")}catch{}}act(t){let n=this.weatherPath;t==="toggle"?this.toggle():t==="page"&&n?this.go(n):t==="card"&&(this.dialogOpen=!0)}};W.styles=[mi,fi,We,Ei,Ii,Xi,nn,Qi,Mi,qi,Ji,Wi,C`
    :host { display:block; }
    :host([hidden]) { display:none; }
    /* Animations switched off: the alert halo stays still too, in the tile, the window and the scrolling bubble. */
    :host([still]) { --nw-motion:paused; }
    /* Frosted glass switched off: no blur anywhere (it costs a lot on slow devices), a more opaque glass keeps the text readable. */
    :host([flat]) { --nw-blur:none; --nw-frost:none; --nw-glass-clear:color-mix(in srgb, var(--nw-bg) 86%, transparent); --nw-glass-strong:color-mix(in srgb, var(--nw-bg) 92%, transparent); }
    ha-card { padding:0; overflow:hidden; container-type:inline-size; }
    /* Loading: a few grey lines in the card's shape, a light sweeping over them (like Hestia Confort's sensors at start-up). */
    .nw-wait { position:relative; overflow:hidden; display:grid; grid-template-columns:32px minmax(0,1fr); align-items:center; gap:12px 12px;
      min-height:96px; padding:16px; box-sizing:border-box; background:var(--nw-bg); }
    .nw-wait i { display:block; height:10px; border-radius:var(--nw-radius-pill); background:color-mix(in srgb, var(--nw-fg) 9%, transparent); }
    .nw-wait i.dot { width:32px; height:32px; border-radius:10px; }
    .nw-wait i:nth-child(2) { width:45%; height:14px; }
    .nw-wait i:nth-child(3) { grid-column:1/-1; width:80%; }
    .nw-wait i:nth-child(4) { grid-column:1/-1; width:55%; }
    .nw-wait.line { min-height:56px; padding:12px 14px; }
    .nw-wait.line i:nth-child(n+3) { display:none; }
    .nw-wait::after { content:''; position:absolute; inset:0; pointer-events:none;
      background:linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--nw-fg) 9%, transparent) 50%, transparent 70%);
      transform:translateX(-100%); animation:nw-shimmer 1.6s ease-in-out infinite; }
    :host([still]) .nw-wait::after { display:none; }
    @media (prefers-reduced-motion:reduce) { .nw-wait::after { display:none; } }
    @keyframes nw-shimmer { to { transform:translateX(100%); } }
    .nw-problem { display:flex; gap:14px; align-items:flex-start; padding:18px 20px; color:var(--nw-fg); font-size:var(--nw-fs-text); line-height:1.5; }
    .nw-problem > ha-icon { --mdc-icon-size:28px; color:var(--nw-accent); flex:none; }
    .nw-problem b { font-size:var(--nw-fs-title); }
    .nw-problem p { margin:4px 0 10px; color:var(--nw-fg2); }
    .nw-problem a { display:inline-block; padding:6px 14px; border-radius:var(--nw-radius-pill); background:var(--nw-accent); color:var(--nw-bg);
      font-weight:600; text-decoration:none; font-size:var(--nw-fs-small); }
    .nw-problem .links { display:flex; flex-wrap:wrap; gap:8px; }
    .nw-problem .failure { color:var(--nw-fg); font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:var(--nw-fs-small); word-break:break-word; }
    .nw-problem a.second { background:none; color:var(--nw-accent); box-shadow:inset 0 0 0 1px var(--nw-line); }
    dialog.nw-dialog { border:0; padding:0; width:min(1180px, 96vw); max-height:92vh; border-radius:16px; overflow:auto; overscroll-behavior:contain;
      background:var(--nw-bg); color:var(--nw-fg); box-shadow:0 24px 80px #0005; }
    dialog.nw-dialog::backdrop { background:#0b1520aa; backdrop-filter:blur(2px); }
    .nw-dialog > header { position:sticky; top:0; z-index:3; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px;
      background:var(--nw-bg); border-bottom:1px solid var(--nw-line-soft); font-size:var(--nw-fs-text); }
    .nw-dialog > header button { border:1px solid var(--nw-line); background:var(--nw-bg); border-radius:var(--nw-radius-pill); padding:5px 14px; cursor:pointer; font-size:var(--nw-fs-small); font-weight:600; }
    @media (max-width:600px) { dialog.nw-dialog { width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; margin:0; } }
    /* Full screen on a phone, the app may draw under the system bars: room to scroll the last section above them. */
    @media (max-width:600px) { dialog.nw-dialog > .nw-full { padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 72px); } }
  `],$([R({attribute:!1})],W.prototype,"hass",2),$([R({attribute:!1})],W.prototype,"editMode",2),$([R({attribute:!1})],W.prototype,"preview",2),$([j()],W.prototype,"config",2),$([j()],W.prototype,"tab",2),$([j()],W.prototype,"view",2),$([j()],W.prototype,"problem",2),$([j()],W.prototype,"open",2),$([j()],W.prototype,"dialogOpen",2),$([j()],W.prototype,"folded",2),W=$([Q("niak-weather-card")],W);var fa=["full","tile","intermediate","mini","comfort","rain","wind","pressure","lightning","air","forecast","alert"],Nt=e=>e==="full"?"niak-weather-card":`niak-weather-${e==="intermediate"?"tile-open":e}-card`,dn=e=>Nt(e).replace("niak-","hestia-");for(let e of fa){let i=Nt(e);e!=="full"&&!customElements.get(i)&&customElements.define(i,class extends W{static getStubConfig(){return{type:"custom:niak-weather-card",format:e}}setConfig(n){super.setConfig({format:e,...n})}});let t=dn(e);customElements.get(t)||customElements.define(t,class extends W{static getStubConfig(){return e==="full"?{type:"custom:hestia-weather-card"}:{type:"custom:hestia-weather-card",format:e}}setConfig(n){super.setConfig(e==="full"?n:{format:e,...n})}})}var ga=[["full",f("Hestia - M\xE9t\xE9o"),f("La page m\xE9t\xE9o compl\xE8te ou la tuile qui se d\xE9plie. Le format se choisit dans les r\xE9glages.")],["comfort",f("Hestia - \xC0 la pi\xE8ce"),f("Une seule partie : ressenti, pluie, vent, pression, \xE9clairs, air et pollens ou pr\xE9visions.")],["mini",f("Hestia - Petite carte"),f("Une seule ligne, ou une alerte visible seulement en cas de vigilance.")]];bi();window.customCards=window.customCards||[];for(let[e,i,t]of ga){let n=dn(e);window.customCards.some(a=>a.type===n||a.type===Nt(e))||window.customCards.push({type:n,name:r(i),description:r(t),preview:!0})}})();
