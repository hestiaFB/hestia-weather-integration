// Home Assistant frontend#53890: wait for the final custom element registry.
while (!customElements.get('home-assistant')) {
  await customElements.whenDefined('home-assistant');
}
"use strict";(()=>{var Mi=Object.defineProperty;var Ri=Object.getOwnPropertyDescriptor;var k=(e,n,t,i)=>{for(var a=i>1?void 0:i?Ri(n,t):n,s=e.length-1,l;s>=0;s--)(l=e[s])&&(a=(i?l(n,t,a):l(a))||a);return i&&a&&Mi(n,t,a),a};var Be=globalThis,De=Be.ShadowRoot&&(Be.ShadyCSS===void 0||Be.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ht=Symbol(),Yt=new WeakMap,ke=class{constructor(n,t,i){if(this._$cssResult$=!0,i!==ht)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=n,this.t=t}get styleSheet(){let n=this.o,t=this.t;if(De&&n===void 0){let i=t!==void 0&&t.length===1;i&&(n=Yt.get(t)),n===void 0&&((this.o=n=new CSSStyleSheet).replaceSync(this.cssText),i&&Yt.set(t,n))}return n}toString(){return this.cssText}},Ne=e=>new ke(typeof e=="string"?e:e+"",void 0,ht),T=(e,...n)=>{let t=e.length===1?e[0]:n.reduce((i,a,s)=>i+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[s+1],e[0]);return new ke(t,e,ht)},Zt=(e,n)=>{if(De)e.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of n){let i=document.createElement("style"),a=Be.litNonce;a!==void 0&&i.setAttribute("nonce",a),i.textContent=t.cssText,e.appendChild(i)}},mt=De?e=>e:e=>e instanceof CSSStyleSheet?(n=>{let t="";for(let i of n.cssRules)t+=i.cssText;return Ne(t)})(e):e;var{is:ji,defineProperty:Wi,getOwnPropertyDescriptor:qi,getOwnPropertyNames:Fi,getOwnPropertySymbols:Oi,getPrototypeOf:Bi}=Object,Ie=globalThis,Xt=Ie.trustedTypes,Di=Xt?Xt.emptyScript:"",Ni=Ie.reactiveElementPolyfillSupport,Ae=(e,n)=>e,Ce={toAttribute(e,n){switch(n){case Boolean:e=e?Di:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,n){let t=e;switch(n){case Boolean:t=e!==null;break;case Number:t=e===null?null:Number(e);break;case Object:case Array:try{t=JSON.parse(e)}catch{t=null}}return t}},He=(e,n)=>!ji(e,n),en={attribute:!0,type:String,converter:Ce,reflect:!1,useDefault:!1,hasChanged:He};Symbol.metadata??=Symbol("metadata"),Ie.litPropertyMetadata??=new WeakMap;var X=class extends HTMLElement{static addInitializer(n){this._$Ei(),(this.l??=[]).push(n)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(n,t=en){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(n)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(n,t),!t.noAccessor){let i=Symbol(),a=this.getPropertyDescriptor(n,i,t);a!==void 0&&Wi(this.prototype,n,a)}}static getPropertyDescriptor(n,t,i){let{get:a,set:s}=qi(this.prototype,n)??{get(){return this[t]},set(l){this[t]=l}};return{get:a,set(l){let c=a?.call(this);s?.call(this,l),this.requestUpdate(n,c,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(n){return this.elementProperties.get(n)??en}static _$Ei(){if(this.hasOwnProperty(Ae("elementProperties")))return;let n=Bi(this);n.finalize(),n.l!==void 0&&(this.l=[...n.l]),this.elementProperties=new Map(n.elementProperties)}static finalize(){if(this.hasOwnProperty(Ae("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ae("properties"))){let t=this.properties,i=[...Fi(t),...Oi(t)];for(let a of i)this.createProperty(a,t[a])}let n=this[Symbol.metadata];if(n!==null){let t=litPropertyMetadata.get(n);if(t!==void 0)for(let[i,a]of t)this.elementProperties.set(i,a)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let a=this._$Eu(t,i);a!==void 0&&this._$Eh.set(a,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(n){let t=[];if(Array.isArray(n)){let i=new Set(n.flat(1/0).reverse());for(let a of i)t.unshift(mt(a))}else n!==void 0&&t.push(mt(n));return t}static _$Eu(n,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof n=="string"?n.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(n=>this.enableUpdating=n),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(n=>n(this))}addController(n){(this._$EO??=new Set).add(n),this.renderRoot!==void 0&&this.isConnected&&n.hostConnected?.()}removeController(n){this._$EO?.delete(n)}_$E_(){let n=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(n.set(i,this[i]),delete this[i]);n.size>0&&(this._$Ep=n)}createRenderRoot(){let n=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Zt(n,this.constructor.elementStyles),n}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(n=>n.hostConnected?.())}enableUpdating(n){}disconnectedCallback(){this._$EO?.forEach(n=>n.hostDisconnected?.())}attributeChangedCallback(n,t,i){this._$AK(n,i)}_$ET(n,t){let i=this.constructor.elementProperties.get(n),a=this.constructor._$Eu(n,i);if(a!==void 0&&i.reflect===!0){let s=(i.converter?.toAttribute!==void 0?i.converter:Ce).toAttribute(t,i.type);this._$Em=n,s==null?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(n,t){let i=this.constructor,a=i._$Eh.get(n);if(a!==void 0&&this._$Em!==a){let s=i.getPropertyOptions(a),l=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:Ce;this._$Em=a;let c=l.fromAttribute(t,s.type);this[a]=c??this._$Ej?.get(a)??c,this._$Em=null}}requestUpdate(n,t,i,a=!1,s){if(n!==void 0){let l=this.constructor;if(a===!1&&(s=this[n]),i??=l.getPropertyOptions(n),!((i.hasChanged??He)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(n)&&!this.hasAttribute(l._$Eu(n,i))))return;this.C(n,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(n,t,{useDefault:i,reflect:a,wrapped:s},l){i&&!(this._$Ej??=new Map).has(n)&&(this._$Ej.set(n,l??t??this[n]),s!==!0||l!==void 0)||(this._$AL.has(n)||(this.hasUpdated||i||(t=void 0),this._$AL.set(n,t)),a===!0&&this._$Em!==n&&(this._$Eq??=new Set).add(n))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let n=this.scheduleUpdate();return n!=null&&await n,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[a,s]of this._$Ep)this[a]=s;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[a,s]of i){let{wrapped:l}=s,c=this[a];l!==!0||this._$AL.has(a)||c===void 0||this.C(a,void 0,s,c)}}let n=!1,t=this._$AL;try{n=this.shouldUpdate(t),n?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw n=!1,this._$EM(),i}n&&this._$AE(t)}willUpdate(n){}_$AE(n){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(n)),this.updated(n)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(n){return!0}update(n){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(n){}firstUpdated(n){}};X.elementStyles=[],X.shadowRootOptions={mode:"open"},X[Ae("elementProperties")]=new Map,X[Ae("finalized")]=new Map,Ni?.({ReactiveElement:X}),(Ie.reactiveElementVersions??=[]).push("2.1.2");var gt=globalThis,tn=e=>e,Ve=gt.trustedTypes,nn=Ve?Ve.createPolicy("lit-html",{createHTML:e=>e}):void 0,wt="$lit$",ee=`lit$${Math.random().toFixed(9).slice(2)}$`,bt="?"+ee,Ii=`<${bt}>`,ce=document,Se=()=>ce.createComment(""),_e=e=>e===null||typeof e!="object"&&typeof e!="function",vt=Array.isArray,dn=e=>vt(e)||typeof e?.[Symbol.iterator]=="function",ft=`[ 	
\f\r]`,Te=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,an=/-->/g,rn=/>/g,le=RegExp(`>|${ft}(?:([^\\s"'>=/]+)(${ft}*=${ft}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),sn=/'/g,on=/"/g,cn=/^(?:script|style|textarea|title)$/i,xt=e=>(n,...t)=>({_$litType$:e,strings:n,values:t}),o=xt(1),F=xt(2),er=xt(3),pe=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),ln=new WeakMap,de=ce.createTreeWalker(ce,129);function pn(e,n){if(!vt(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return nn!==void 0?nn.createHTML(n):n}var un=(e,n)=>{let t=e.length-1,i=[],a,s=n===2?"<svg>":n===3?"<math>":"",l=Te;for(let c=0;c<t;c++){let d=e[c],u,w,f=-1,h=0;for(;h<d.length&&(l.lastIndex=h,w=l.exec(d),w!==null);)h=l.lastIndex,l===Te?w[1]==="!--"?l=an:w[1]!==void 0?l=rn:w[2]!==void 0?(cn.test(w[2])&&(a=RegExp("</"+w[2],"g")),l=le):w[3]!==void 0&&(l=le):l===le?w[0]===">"?(l=a??Te,f=-1):w[1]===void 0?f=-2:(f=l.lastIndex-w[2].length,u=w[1],l=w[3]===void 0?le:w[3]==='"'?on:sn):l===on||l===sn?l=le:l===an||l===rn?l=Te:(l=le,a=void 0);let g=l===le&&e[c+1].startsWith("/>")?" ":"";s+=l===Te?d+Ii:f>=0?(i.push(u),d.slice(0,f)+wt+d.slice(f)+ee+g):d+ee+(f===-2?c:g)}return[pn(e,s+(e[t]||"<?>")+(n===2?"</svg>":n===3?"</math>":"")),i]},Pe=class e{constructor({strings:n,_$litType$:t},i){let a;this.parts=[];let s=0,l=0,c=n.length-1,d=this.parts,[u,w]=un(n,t);if(this.el=e.createElement(u,i),de.currentNode=this.el.content,t===2||t===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(a=de.nextNode())!==null&&d.length<c;){if(a.nodeType===1){if(a.hasAttributes())for(let f of a.getAttributeNames())if(f.endsWith(wt)){let h=w[l++],g=a.getAttribute(f).split(ee),x=/([.?@])?(.*)/.exec(h);d.push({type:1,index:s,name:x[2],strings:g,ctor:x[1]==="."?Ke:x[1]==="?"?Ge:x[1]==="@"?Je:he}),a.removeAttribute(f)}else f.startsWith(ee)&&(d.push({type:6,index:s}),a.removeAttribute(f));if(cn.test(a.tagName)){let f=a.textContent.split(ee),h=f.length-1;if(h>0){a.textContent=Ve?Ve.emptyScript:"";for(let g=0;g<h;g++)a.append(f[g],Se()),de.nextNode(),d.push({type:2,index:++s});a.append(f[h],Se())}}}else if(a.nodeType===8)if(a.data===bt)d.push({type:2,index:s});else{let f=-1;for(;(f=a.data.indexOf(ee,f+1))!==-1;)d.push({type:7,index:s}),f+=ee.length-1}s++}}static createElement(n,t){let i=ce.createElement("template");return i.innerHTML=n,i}};function ue(e,n,t=e,i){if(n===pe)return n;let a=i!==void 0?t._$Co?.[i]:t._$Cl,s=_e(n)?void 0:n._$litDirective$;return a?.constructor!==s&&(a?._$AO?.(!1),s===void 0?a=void 0:(a=new s(e),a._$AT(e,t,i)),i!==void 0?(t._$Co??=[])[i]=a:t._$Cl=a),a!==void 0&&(n=ue(e,a._$AS(e,n.values),a,i)),n}var Ue=class{constructor(n,t){this._$AV=[],this._$AN=void 0,this._$AD=n,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(n){let{el:{content:t},parts:i}=this._$AD,a=(n?.creationScope??ce).importNode(t,!0);de.currentNode=a;let s=de.nextNode(),l=0,c=0,d=i[0];for(;d!==void 0;){if(l===d.index){let u;d.type===2?u=new be(s,s.nextSibling,this,n):d.type===1?u=new d.ctor(s,d.name,d.strings,this,n):d.type===6&&(u=new Qe(s,this,n)),this._$AV.push(u),d=i[++c]}l!==d?.index&&(s=de.nextNode(),l++)}return de.currentNode=ce,a}p(n){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(n,i,t),t+=i.strings.length-2):i._$AI(n[t])),t++}},be=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(n,t,i,a){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=n,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let n=this._$AA.parentNode,t=this._$AM;return t!==void 0&&n?.nodeType===11&&(n=t.parentNode),n}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(n,t=this){n=ue(this,n,t),_e(n)?n===p||n==null||n===""?(this._$AH!==p&&this._$AR(),this._$AH=p):n!==this._$AH&&n!==pe&&this._(n):n._$litType$!==void 0?this.$(n):n.nodeType!==void 0?this.T(n):dn(n)?this.k(n):this._(n)}O(n){return this._$AA.parentNode.insertBefore(n,this._$AB)}T(n){this._$AH!==n&&(this._$AR(),this._$AH=this.O(n))}_(n){this._$AH!==p&&_e(this._$AH)?this._$AA.nextSibling.data=n:this.T(ce.createTextNode(n)),this._$AH=n}$(n){let{values:t,_$litType$:i}=n,a=typeof i=="number"?this._$AC(n):(i.el===void 0&&(i.el=Pe.createElement(pn(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{let s=new Ue(a,this),l=s.u(this.options);s.p(t),this.T(l),this._$AH=s}}_$AC(n){let t=ln.get(n.strings);return t===void 0&&ln.set(n.strings,t=new Pe(n)),t}k(n){vt(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,a=0;for(let s of n)a===t.length?t.push(i=new e(this.O(Se()),this.O(Se()),this,this.options)):i=t[a],i._$AI(s),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(n=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);n!==this._$AB;){let i=tn(n).nextSibling;tn(n).remove(),n=i}}setConnected(n){this._$AM===void 0&&(this._$Cv=n,this._$AP?.(n))}},he=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(n,t,i,a,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=n,this.name=t,this._$AM=a,this.options=s,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=p}_$AI(n,t=this,i,a){let s=this.strings,l=!1;if(s===void 0)n=ue(this,n,t,0),l=!_e(n)||n!==this._$AH&&n!==pe,l&&(this._$AH=n);else{let c=n,d,u;for(n=s[0],d=0;d<s.length-1;d++)u=ue(this,c[i+d],t,d),u===pe&&(u=this._$AH[d]),l||=!_e(u)||u!==this._$AH[d],u===p?n=p:n!==p&&(n+=(u??"")+s[d+1]),this._$AH[d]=u}l&&!a&&this.j(n)}j(n){n===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,n??"")}},Ke=class extends he{constructor(){super(...arguments),this.type=3}j(n){this.element[this.name]=n===p?void 0:n}},Ge=class extends he{constructor(){super(...arguments),this.type=4}j(n){this.element.toggleAttribute(this.name,!!n&&n!==p)}},Je=class extends he{constructor(n,t,i,a,s){super(n,t,i,a,s),this.type=5}_$AI(n,t=this){if((n=ue(this,n,t,0)??p)===pe)return;let i=this._$AH,a=n===p&&i!==p||n.capture!==i.capture||n.once!==i.once||n.passive!==i.passive,s=n!==p&&(i===p||a);a&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,n),this._$AH=n}handleEvent(n){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,n):this._$AH.handleEvent(n)}},Qe=class{constructor(n,t,i){this.element=n,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(n){ue(this,n)}},hn={M:wt,P:ee,A:bt,C:1,L:un,R:Ue,D:dn,V:ue,I:be,H:he,N:Ge,U:Je,B:Ke,F:Qe},Hi=gt.litHtmlPolyfillSupport;Hi?.(Pe,be),(gt.litHtmlVersions??=[]).push("3.3.3");var mn=(e,n,t)=>{let i=t?.renderBefore??n,a=i._$litPart$;if(a===void 0){let s=t?.renderBefore??null;i._$litPart$=a=new be(n.insertBefore(Se(),s),s,void 0,t??{})}return a._$AI(e),a};var yt=globalThis,D=class extends X{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let n=super.createRenderRoot();return this.renderOptions.renderBefore??=n.firstChild,n}update(n){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(n),this._$Do=mn(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return pe}};D._$litElement$=!0,D.finalized=!0,yt.litElementHydrateSupport?.({LitElement:D});var Vi=yt.litElementPolyfillSupport;Vi?.({LitElement:D});(yt.litElementVersions??=[]).push("4.2.2");var Ui={attribute:!0,type:String,converter:Ce,reflect:!1,hasChanged:He},Ki=(e=Ui,n,t)=>{let{kind:i,metadata:a}=t,s=globalThis.litPropertyMetadata.get(a);if(s===void 0&&globalThis.litPropertyMetadata.set(a,s=new Map),i==="setter"&&((e=Object.create(e)).wrapped=!0),s.set(t.name,e),i==="accessor"){let{name:l}=t;return{set(c){let d=n.get.call(this);n.set.call(this,c),this.requestUpdate(l,d,e,!0,c)},init(c){return c!==void 0&&this.C(l,void 0,e,c),c}}}if(i==="setter"){let{name:l}=t;return function(c){let d=this[l];n.call(this,c),this.requestUpdate(l,d,e,!0,c)}}throw Error("Unsupported decorator location: "+i)};function E(e){return(n,t)=>typeof t=="object"?Ki(e,n,t):((i,a,s)=>{let l=a.hasOwnProperty(s);return a.constructor.createProperty(s,i),l?Object.getOwnPropertyDescriptor(a,s):void 0})(e,n,t)}function P(e){return E({...e,state:!0,attribute:!1})}var J=e=>n=>{customElements.get(e)||customElements.define(e,n)};var Gi={comfort:["feel","gauge","factors","extras"],rain:["ahead","now","chart","stats"],wind:["ahead","now","chart","stats"],pressure:["ahead","now","chart","stats"],lightning:["ahead","now","radar","stats"],air:["air_today","pollen_today","air_tomorrow","pollen_tomorrow"],forecast:["hours","days"]};function ze(e){let n=Gi[e.format??"full"]??[];if(!e.card_blocks)return n;let t=e.card_blocks.filter(i=>n.includes(i));return t.length||!e.card_blocks.length?t:n}function Ze(e){return{hero:e.banner_blocks!==void 0||e.show_synthesis!==!1,banner:e.banner_blocks??(e.show_synthesis===!1?[]:[...e.show_bulletin===!1?[]:["bulletin"],"events"]),today:e.today_blocks??(e.show_today===!1?[]:["comfort","rain","wind","pressure","lightning","extras","air"]),forecasts:e.forecast_blocks??(e.show_predictions===!1?[]:["hours","days",...e.show_atmo_tomorrow===!1?[]:["air"]])}}function Ee(e){let n={...e};n.mode==="compact"&&n.show_predictions===void 0&&(n.show_predictions=!1),delete n.mode;let t=n.full_blocks;if(Array.isArray(t)){let i=["bulletin","events","moments","forecast"],a=t.includes("air");n.banner_blocks??=t.filter(s=>i.includes(s)),n.today_blocks??=t.includes("today")?["comfort","rain","wind","pressure","extras",...a?["air"]:[]]:[],n.forecast_blocks??=t.includes("predictions")?["hours","days",...a?["air"]:[]]:[]}delete n.full_blocks,delete n.air_blocks,delete n.lightning_distance_entity,delete n.comfort_entity,delete n.air_quality_entity,delete n.model_entity,delete n.forecast_entity,delete n.air_path;for(let i of["humidex_entity","humidex_perception_entity","thermal_dew_point_entity","heat_index_entity","absolute_humidity_entity","thermal_perception_entity","thermal_device_id"])delete n[i];return n}var fn={banner_blocks:["bulletin","events","moments","forecast"],today_blocks:["comfort","rain","wind","pressure","lightning","extras","air"],forecast_blocks:["hours","days","air"]};function gn(e,n,t){let i=l=>{let c=t.indexOf(l);return c<0?t.length:c},a=new Set(n.filter(l=>!e.includes(l))),s=n.filter(l=>!a.has(l));for(let l of a){let c=s.length;for(;c>0&&i(s[c-1])>i(l);)c--;s.splice(c,0,l)}return s}function Ji(e,n){let t=e.periods?.find(i=>i.period===n);return t?{...e,period:n,series:t.series,low:t.low,top:t.top,stats:t.stats}:{...e,period:"6h"}}function Qi(e,n){let t=e.periods?.find(i=>i.period===n);return t?{...e,period:n,mean:t.mean,gust:t.gust,top:t.top}:{...e,period:"6h"}}function Yi(e,n){let t=e.periods?.find(i=>i.period===n);return t?{...e,period:n,days:t.days,total:t.total,totalPartial:t.partial}:{...e,period:"7d"}}function wn(e,n,t){let i=!t&&!!n.banner_blocks,a=t||i||n.smart_brief!==!1&&n.show_synthesis!==!1,s=l=>n.show_atmo_details===!1?l.map(c=>({...c,details:[],updated:""})):l;return{...e,brief:a?e.brief:void 0,alerts:a?e.alerts:[],points:a?e.points:[],timeline:a?e.timeline:[],bulletin:n.show_bulletin===!1&&!(t&&n.tile_blocks?.length)&&!i?void 0:e.bulletin,pressure:e.pressure&&Ji(e.pressure,n.pressure_span??"6h"),wind:e.wind&&Qi(e.wind,n.wind_span??"6h"),rain:e.rain&&Yi(e.rain,n.rain_span??"7d"),air:{today:s(e.air.today),tomorrow:n.show_atmo_tomorrow===!1&&!n.forecast_blocks&&n.format!=="air"?[]:s(e.air.tomorrow)}}}var bn=String.raw`/* CHARTE COMMUNE HESTIA — jetons et pièces partagés par toutes les cartes Hestia.
   Valeurs reprises de la carte Hestia Weather (card/src/ui/charter.ts), qui fait référence.
   Modifier ICI, puis recopier avec charte/copier.sh dans chaque carte : jamais directement dans une brique. */
:host {
  /* Couleurs du thème Home Assistant, avec replis. */
  --nw-fg: var(--primary-text-color, #212121);
  --nw-fg2: var(--secondary-text-color, #727272);
  --nw-bg: var(--ha-card-background, var(--card-background-color, #fff));
  --nw-accent: var(--primary-color, #03a9f4);
  /* Contours et arrondis : un seul arrondi pour toutes les boîtes, un pour les pastilles. */
  --nw-line: color-mix(in srgb, var(--nw-fg) 13%, transparent);
  --nw-line-soft: color-mix(in srgb, var(--nw-fg) 8%, transparent);
  --nw-radius-card: var(--ha-card-border-radius, 12px);
  --nw-radius: 14px;
  --nw-radius-pill: 999px;
  --nw-glass-strong: color-mix(in srgb, var(--nw-bg) 84%, transparent);
  --nw-blur: blur(6px) saturate(1.2);
  /* Verre dépoli posé sur le fond coloré (frise de Weather, échelle de Confort) : plus clair, plus flou. */
  --nw-glass-clear: color-mix(in srgb, var(--nw-bg) 45%, transparent);
  --nw-frost: blur(14px) saturate(1.6);
  --nw-frame-line: color-mix(in srgb, var(--nw-fg) 16%, transparent);
  --nw-pad-panel: 18px 20px;
  /* Sept tailles de texte, rien d'autre (échelle C, 3 novembre) : étiquette 11 · secondaire 12 · texte et titre de case 14 ·
     titre de carte et de section 17 · valeur de case 21 · conseil et valeur vedette 34 · température 58. */
  --nw-fs-label: 11px; --nw-fs-small: 12px; --nw-fs-text: 14px; --nw-fs-title: 17px; --nw-fs-case: 21px; --nw-fs-value: 34px; --nw-fs-temp: 58px;
  --nw-label-spacing: .6px;
  /* Couleurs de sens, palette « Aube » (OKLCH, même clarté et même saturation). Un thème peut les remplacer. */
  --nw-rain: var(--hestia-rain-color, oklch(.8 .07 190));
  --nw-wind: var(--hestia-wind-color, oklch(.79 .075 280));
  --nw-heat: var(--hestia-heat-color, oklch(.83 .085 42));
  --nw-cold: var(--hestia-cold-color, oklch(.85 .05 220));
  --nw-calm: var(--hestia-calm-color, oklch(.83 .075 150));
  --nw-pressure: var(--hestia-pressure-color, oklch(.78 .07 315));
  --nw-level1: var(--hestia-level1-color, oklch(.88 .1 96));
  --nw-level2: var(--hestia-level2-color, oklch(.81 .105 64));
  --nw-level3: var(--hestia-level3-color, oklch(.74 .115 18));
  /* Couleurs d'état, communes à toutes les cartes : elles disent s'il y a quelque chose à FAIRE, pas où tombe une mesure.
     Bleu tout va bien · vert bénéfice à saisir ou en cours · orange geste utile maintenant · rouge urgent ·
     ambre mesure hors de votre plage, sans geste demandé · gris (texte secondaire) à vérifier.
     La vigilance météo garde sa propre échelle jaune / orange / rouge (--nw-level1 à 3). */
  --nw-ok: var(--hestia-ok-color, var(--nw-cold));
  --nw-benefit: var(--hestia-benefit-color, var(--nw-calm));
  --nw-act: var(--hestia-act-color, var(--nw-level2));
  --nw-alert: var(--hestia-alert-color, var(--nw-level3));
  --nw-watch: var(--hestia-watch-color, oklch(.84 .13 86));
  /* Part de couleur dans un texte coloré : 34 % reste lisible (contraste 4,5:1). */
  --nw-ink: 34%;
  --nw-ease: cubic-bezier(.2, .8, .2, 1);
  --nw-expand: .45s;
}
button { font:inherit; color:inherit; }
button:focus-visible { outline:2px solid var(--nw-accent); outline-offset:2px; }
.sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
/* Étiquette en petites capitales, une seule taille partout (style Trait, 3 novembre). */
.nw-label { font-size:var(--nw-fs-label); line-height:14px; font-weight:650; letter-spacing:.08em; text-transform:uppercase; color:var(--nw-fg2); white-space:nowrap; }
/* Texte coloré toujours lisible : la couleur de sens mélangée au texte. */
.nw-ink { font-size:var(--nw-fs-small); font-weight:600; color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }
/* Pastille de source : une seule règle. */
.nw-badge { display:inline-flex; align-items:center; font-size:var(--nw-fs-small); line-height:18px; font-weight:500; white-space:nowrap; padding:3px 10px;
  border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:color-mix(in srgb, var(--nw-bg) 70%, transparent); color:var(--nw-fg);
  max-width:100%; overflow:hidden; text-overflow:ellipsis; box-sizing:border-box; }
/* Pastille d'info teintée. */
.nw-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-small); line-height:18px; font-weight:600;
  white-space:nowrap; border:1px solid transparent; background:color-mix(in oklab, var(--c) 24%, transparent); color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }
.nw-chips { display:flex; flex-wrap:wrap; gap:8px; }
/* ---------- Structure commune des cartes (style Trait, 3 novembre) : la même dans Weather, Confort et les prochaines briques. ---------- */
/* La carte : Manrope, angles de 22 px ; la surface teintée des panneaux. */
ha-card { font-family:Manrope, var(--ha-font-family-body, Roboto), system-ui, sans-serif; line-height:1.5; border-radius:22px;
  --nw-surface:color-mix(in srgb, var(--nw-fg) 3.5%, var(--nw-bg)); }
/* Le titre de la carte (« Synthèse », le nom de la pièce) et la grande température fine. */
.nw-title { margin:0; font-size:var(--nw-fs-title); line-height:1.25; font-weight:700; letter-spacing:-.02em; }
/* La lecture (3 novembre) : la grande température, son unité en exposant hors du bloc des chiffres, le mini–maxi aligné à droite
   sur la fin des chiffres (après la virgule, avant « °C »). La même dans Weather et Confort (hestia-lecture.ts). */
.nw-reading { display:inline-grid; justify-items:end; padding-right:26px; }
.nw-reading .nw-temp { position:relative; }
.nw-reading .nw-temp sup { position:absolute; left:100%; top:.3em; margin-left:3px; font-size:var(--nw-fs-text); line-height:1; font-weight:500; letter-spacing:0; color:var(--nw-fg2); }
.nw-reading-tap { all:unset; cursor:pointer; border-radius:8px; }
.nw-reading-tap:focus-visible { outline:2px solid var(--nw-accent); outline-offset:2px; }
.nw-reading-more { margin-top:4px; font-size:var(--nw-fs-small); color:var(--nw-fg2); white-space:nowrap; }
.nw-range { margin-top:4px; font-size:var(--nw-fs-small); font-weight:500; color:var(--nw-fg2); font-variant-numeric:tabular-nums; white-space:nowrap; }
/* 58 px au plus, plus petite dans une carte étroite (15 % de sa largeur) : le titre et son « i » gardent leur ligne. */
.nw-temp { font-size:min(var(--nw-fs-temp), 15cqi); font-weight:300; letter-spacing:-.05em; line-height:1; font-variant-numeric:tabular-nums; }
/* Le titre d'une section (« Aujourd'hui », « Maintenant ») : en clair, son résumé à côté, le chevron rond à droite s'il se replie. */
.nw-section-head { display:flex; align-items:center; gap:10px; min-width:0; }
.nw-section-head h2 { margin:0; font-size:var(--nw-fs-title); line-height:1.3; font-weight:700; letter-spacing:-.2px; }
.nw-section-head .nw-sum { flex:1; min-width:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
/* Le panneau : une surface teintée, sans contour, arrondie dans l'arrondi de la carte. */
.nw-panel { min-width:0; box-sizing:border-box; padding:14px 16px; border:0; border-radius:16px; background:var(--nw-surface); }
/* Son en-tête : un pictogramme au trait, le titre et son « i », un mot ou des onglets à droite. */
.nw-panel-head { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-width:0; }
.nw-panel-icon { display:grid; place-items:center; flex:none; color:var(--nw-fg2); }
.nw-panel-icon ha-icon { --mdc-icon-size:18px; display:flex; } .nw-panel-icon svg { width:18px; height:18px; }
.nw-panel-head h3 { display:flex; align-items:center; gap:8px; margin:0; min-width:0; font-size:var(--nw-fs-text); line-height:1.3; font-weight:650; letter-spacing:0; white-space:nowrap; }
.nw-panel-head h3 > span { overflow:hidden; text-overflow:ellipsis; }
.nw-panel-head .aside { margin-left:auto; font-size:var(--nw-fs-small); line-height:1.4; font-weight:500; color:var(--nw-fg2); }
.nw-panel-head .seg { margin-left:auto; }
/* La grande valeur fine et son unité ; la phrase grise qui la suit. */
.nw-value { display:flex; align-items:baseline; gap:5px; }
.nw-value b { font-size:var(--nw-fs-value); font-weight:300; letter-spacing:-.04em; line-height:1.1; font-variant-numeric:tabular-nums; }
.nw-value > span, .nw-value b small { font-size:var(--nw-fs-text); line-height:1.1; font-weight:500; letter-spacing:0; color:var(--nw-fg2); }
/* Dans une grille de petites cases (.nw-cases), la valeur passe à 21 demi-gras : la grande valeur fine reste à la case pleine largeur. */
.nw-cases .nw-value b { font-size:var(--nw-fs-case); font-weight:600; letter-spacing:-.015em; line-height:1.2; }
.nw-say { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
/* Les chiffres sous un panneau : leur nom en petits mots simples, jamais coupés, la valeur en gras. */
.nw-stats { display:grid; grid-template-columns:repeat(var(--n, 3), minmax(0,1fr)); gap:8px; margin-top:auto; padding-top:10px; border-top:1px solid color-mix(in srgb, var(--nw-fg) 6%, transparent); }
.nw-stats > * { display:flex; flex-direction:column; gap:2px; min-width:0; }
.nw-stats > * > :first-child { font-size:var(--nw-fs-label); line-height:1.35; font-weight:500; letter-spacing:0; text-transform:none; color:var(--nw-fg2); white-space:normal; }
.nw-stats b { font-size:var(--nw-fs-text); line-height:1.35; font-weight:650; font-variant-numeric:tabular-nums; }
/* Légende : toujours centrée sous son graphique. */
.nw-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:6px 16px; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
.nw-legend span { display:inline-flex; align-items:center; gap:6px; }
/* Une valeur posée sur un graphique. */
.nw-pill { position:absolute; transform:translate(-50%, -130%); font-size:var(--nw-fs-small); font-weight:700; padding:2px 8px; border-radius:var(--nw-radius-pill);
  background:var(--nw-bg); border:1px solid var(--nw-line); box-shadow:0 2px 6px #0001; white-space:nowrap; }
/* Bouton « i » (3 novembre) : un petit disque gris, sans contour ; la lettre est dessinée ici, la même dans toutes les cartes.
   Le bouton reste vide (son aria-label dit ce qu'il explique). */
.nw-info { display:inline-grid; place-items:center; width:18px; height:18px; min-height:0; margin:0; padding:0; flex:none; border-radius:50%; border:0;
  background:color-mix(in srgb, var(--nw-fg) 6%, transparent); color:var(--nw-fg2); cursor:pointer; font:700 var(--nw-fs-label)/1 Manrope, system-ui, sans-serif; }
.nw-info::before { content:'i'; }
.nw-info > * { display:none; }
.nw-info:hover { color:var(--nw-fg); background:color-mix(in srgb, var(--nw-fg) 10%, transparent); }
/* Section repliable : étiquette, résumé, chevron rond (vers le bas replié, vers le haut ouvert). */
.nw-fold-head { display:flex; align-items:center; gap:10px; width:100%; border:0; background:none; padding:0; cursor:pointer; text-align:left; }
.nw-fold-head .nw-sum { flex:1; min-width:0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
.nw-chevron { display:grid; place-items:center; width:30px; height:30px; flex:none; border-radius:50%; border:1px solid var(--nw-line); transition:transform var(--nw-expand) var(--nw-ease); }
.nw-fold-head[aria-expanded="true"] .nw-chevron { transform:rotate(180deg); }
/* Survol d'une section : pas de bandeau gris, c'est le chevron qui s'allume et le titre qui se renforce. */
.nw-fold-head:hover { background:none; }
.nw-chevron { transition:transform var(--nw-expand) var(--nw-ease), background .2s, border-color .2s; }
.nw-fold-head:hover .nw-chevron { background:color-mix(in srgb, var(--nw-fg) 8%, transparent); border-color:color-mix(in srgb, var(--nw-fg) 32%, transparent); }
.nw-fold-head:hover .nw-label { color:var(--nw-fg); }
@media (prefers-reduced-motion:reduce) { .nw-chevron { transition:none; } }
/* Cadre de verre dépoli (le fil de Weather, le bandeau de Confort) : verre clair, liseré net, angles de 16 px, jamais d'ombre.
   Le réglage « Effet de verre » décoché (:host([flat])) le rend opaque et sans flou. */
.nw-glass { background:var(--nw-glass-clear); backdrop-filter:var(--nw-frost); -webkit-backdrop-filter:var(--nw-frost);
  border:1px solid var(--nw-frame-line, color-mix(in srgb, var(--nw-fg) 16%, transparent)); border-radius:16px; box-shadow:none; }
/* Le même cadre, plus opaque, quand il porte les chiffres clés sur un ciel clair (« En ce moment ») : ils restent lisibles. */
.nw-glass.nw-glass-solid { background:color-mix(in srgb, var(--nw-bg) 68%, transparent); }
:host([flat]) { --nw-blur:none; --nw-frost:none; --nw-glass-clear:var(--nw-bg); --nw-glass-strong:var(--nw-bg); }

/* ---------- Le petit rond de valeur (3 novembre) : la valeur sur une piste (échelles) et la bulle affichée du fil. ---------- */
.nw-dot { position:absolute; z-index:3; width:8px; height:8px; margin-left:-4px; border-radius:50%; background:var(--nw-fg); box-shadow:0 0 0 1.5px var(--nw-bg); }
.nw-dot::after { content:''; position:absolute; inset:-2px; border-radius:50%; border:1.5px solid var(--nw-fg);
  animation:nw-ripple 2.4s var(--nw-ease) infinite; animation-play-state:var(--nw-motion, running); }
@keyframes nw-ripple { from { transform:scale(.6); opacity:.9; } to { transform:scale(2.2); opacity:0; } }

/* ---------- L'échelle façon fil (3 novembre, maquettes/planche-echelles.html) : Ressenti de Weather, température de Confort. ----------
   Une piste en relief découpée en tronçons nommés ; la valeur dans une bulle teintée de son tronçon (--tone), un trait fin jusqu'à la piste,
   le petit rond sur la piste ; les repères dessous (ligne basse) ou dessus (ligne haute) ; le min–max en fin trait ; un repère creux (dehors). */
.nw-scale { position:relative; height:84px; margin:0 6px; }
.nw-scale-lane { position:absolute; left:0; right:0; top:44px; height:18px; display:flex; gap:3px; }
.nw-scale-part { display:grid; place-items:center; min-width:0; overflow:hidden; border-radius:6px; font-style:normal; transform-origin:left; container-type:inline-size;
  background:linear-gradient(180deg, color-mix(in oklab, var(--tone) 85%, #fff), color-mix(in oklab, var(--tone) 78%, transparent));
  box-shadow:inset 0 1px 0 rgb(255 255 255 / .35), inset 0 -1px 0 rgb(0 0 0 / .08); animation:nw-grow .52s var(--nw-ease) both; animation-delay:calc(var(--n, 0) * 90ms); }
.nw-scale-part:first-child { border-radius:9px 6px 6px 9px; } .nw-scale-part:last-child { border-radius:6px 9px 9px 6px; } .nw-scale-part:only-child { border-radius:9px; }
.nw-scale-part span { font-size:var(--nw-fs-label); line-height:1; font-weight:700; letter-spacing:.02em; color:rgb(20 26 45 / .72); white-space:nowrap; }
@container (max-width:62px) { .nw-scale-part span { display:none; } }
.nw-scale-part.wl { place-items:center start; padding-left:10px; } .nw-scale-part.wr { place-items:center end; padding-right:10px; }
@keyframes nw-grow { from { transform:scaleX(0); } }
/* La bulle peut être un bouton (un appui ouvre le détail) : la règle passe devant celles des boutons d'une brique. */
.nw-scale .nw-scale-pin { --tx:-50%; position:absolute; min-height:0; margin:0; font-family:inherit; top:8px; z-index:2; display:inline-flex; align-items:center; padding:3px 9px; border:0; border-radius:var(--nw-radius-pill);
  white-space:nowrap; font-size:var(--nw-fs-small); font-weight:700; line-height:18px; font-variant-numeric:tabular-nums; color:var(--nw-fg); transform:translateX(var(--tx)) translateY(-2px) scale(1.04);
  background:color-mix(in oklab, var(--tone) 55%, var(--nw-bg)); box-shadow:0 0 0 1px var(--nw-line), 0 4px 10px -4px rgb(0 0 0 / .35); animation:nw-pop .3s var(--nw-ease) .2s both; }
.nw-scale .nw-scale-pin.edge-l { --tx:-14px; } .nw-scale .nw-scale-pin.edge-r { --tx:calc(-100% + 14px); }
@keyframes nw-pop { from { opacity:0; transform:translateX(var(--tx)) translateY(6px) scale(.92); } }
.nw-scale-stem { position:absolute; top:31px; z-index:1; width:1.5px; height:13px; margin-left:-.75px; background:color-mix(in oklab, var(--tone) 70%, var(--nw-fg)); }
.nw-scale .nw-dot { top:49px; }
.nw-scale-span { position:absolute; top:37px; height:3px; border-radius:2px; background:color-mix(in srgb, var(--nw-fg) 45%, transparent); }
.nw-scale-span::before, .nw-scale-span::after { content:''; position:absolute; top:-2px; width:1.5px; height:7px; border-radius:1px; background:inherit; }
.nw-scale-span::before { left:0; } .nw-scale-span::after { right:0; }
.nw-scale .nw-scale-mk { position:absolute; top:48px; z-index:2; width:10px; height:10px; min-height:0; margin:0 0 0 -5px; padding:0; box-sizing:border-box; border-radius:50%; background:var(--nw-bg); border:2px solid var(--nw-fg2); }
.nw-scale-lb { position:absolute; top:66px; translate:-50% 0; font-size:var(--nw-fs-label); line-height:16px; color:var(--nw-fg2); white-space:nowrap; font-variant-numeric:tabular-nums; }
.nw-scale-lb.up { top:22px; } .nw-scale-lb.first { translate:0 0; } .nw-scale-lb.last { translate:-100% 0; } .nw-scale-lb b { color:var(--nw-fg); font-weight:650; }
@media (prefers-reduced-motion:reduce) { .nw-scale-part, .nw-scale-pin, .nw-dot::after { animation:none; } }

/* ---------- Flèches et chevrons (3 novembre, maquettes/planche-fleches.html) : un seul dessin au trait, posé par la charte. ----------
   La tendance (.nw-trend) ne s'affiche que si la mesure monte ou baisse vraiment ; « stable » garde sa place sans rien montrer.
   Sa couleur : vert, elle revient vers votre plage ; orange, elle s'en éloigne ; gris sinon. Elle glisse d'un cran en apparaissant, jamais en boucle.
   Le vent prend la même flèche, tournée vers où il va (--r). Le chevron (.nw-chev) ouvre et replie ; il tourne d'un quart en s'ouvrant. */
.nw-trend, .nw-chev { display:inline-block; flex:none; background:currentColor; vertical-align:-1px; transform:rotate(var(--r, 0deg));
  -webkit-mask:var(--nw-glyph) center / contain no-repeat; mask:var(--nw-glyph) center / contain no-repeat; }
.nw-trend { width:12px; height:12px; color:var(--nw-fg2);
  --nw-glyph:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 10.5V1.8M2.4 5.2 6 1.6l3.6 3.6'/%3E%3C/svg%3E");
  animation:nw-nudge .5s var(--nw-ease) both; }
.nw-trend[data-way="down"] { --r:180deg; }
.nw-trend[data-way="stable"] { visibility:hidden; animation:none; }
/* Après une grande valeur, « stable » ne laisse pas même de place ; dans une liste, il la garde pour l'alignement. */
.nw-value .nw-trend[data-way="stable"] { display:none; }
.nw-trend[data-tone="better"] { color:color-mix(in oklab, var(--nw-calm) 75%, var(--nw-fg)); }
.nw-trend[data-tone="worse"] { color:color-mix(in oklab, var(--nw-level2) 80%, var(--nw-fg)); }
@keyframes nw-nudge { from { opacity:0; translate:0 3px; } }
.nw-trend[data-way="down"] { animation-name:nw-nudge-down; } @keyframes nw-nudge-down { from { opacity:0; translate:0 -3px; } }
.nw-chev { width:14px; height:14px; color:var(--nw-fg2); transition:transform .22s var(--nw-ease);
  --nw-glyph:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 6l6 6-6 6'/%3E%3C/svg%3E"); }
.nw-chev.open, [aria-expanded="true"] > .nw-chev, details[open] > summary .nw-chev { --r:90deg; }
/* Le vent : la même flèche, tournée vers où il va, à sa couleur, sans entrée animée. */
.nw-trend.wind { width:10px; height:10px; color:color-mix(in oklab, var(--nw-wind) 70%, var(--nw-fg)); animation:none; }
/* Une flèche suivie de mots ou d'un chiffre gris (« +4,4 °C/h », « s'approchent ») : sur une ligne, un petit écart. */
.nw-say:has(> .nw-trend) { display:inline-flex; align-items:center; gap:5px; }
/* Dans le bouton rond d'une section, le chevron pointe vers le bas ; c'est le bouton qui tourne en s'ouvrant. */
.nw-chevron .nw-chev { --r:90deg; }
@media (prefers-reduced-motion:reduce) { .nw-trend { animation:none; } .nw-chev { transition:none; } }


/* ---------- Le Ressenti (3 novembre, maquettes/maquette-ressenti-piece.html) : celui de Weather dehors, celui d'une pièce de Confort. ----------
   La valeur et son mot, l'échelle, puis ce qui joue en cases délimitées : leur titre, leur effet en un mot teinté, la valeur, une note.
   Quatre cases par ligne dans une carte large, ou --nw-ff-cols. */
.nw-feel-row { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px 12px; }
.nw-feel-word { font-size:var(--nw-fs-text); font-weight:650; }
.nw-feel-say { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
.nw-feel-ends { display:flex; justify-content:space-between; margin:2px 6px 0; font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
.nw-feel-factors { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
@container (min-width:600px) { .nw-feel-factors { grid-template-columns:repeat(var(--nw-ff-cols, 4), minmax(0,1fr)); } }
.nw-feel-factors > * { container-type:inline-size; display:grid; gap:2px; align-content:start; padding:10px 12px; border-radius:12px; min-width:0;
  background:var(--nw-bg); border:1px solid color-mix(in srgb, var(--nw-fg) 14%, transparent); }
.nw-ff-head { display:flex; justify-content:space-between; align-items:center; gap:6px; font-size:var(--nw-fs-small); color:var(--nw-fg2); min-width:0; }
.nw-ff-t { display:flex; align-items:center; gap:6px; min-width:0; line-height:1.3; }
.nw-ff-t ha-icon, .nw-ff-t svg { flex:none; } .nw-ff-head ha-icon { --mdc-icon-size:15px; } .nw-ff-t svg { width:15px; height:15px; }
/* Une case étroite : l'effet sous le titre, dans toutes les cases pareil. */
@container (max-width:150px) { .nw-ff-head { flex-direction:column; align-items:flex-start; gap:4px; } }
.nw-ff-eff { flex:none; padding:0 6px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-label); font-weight:700; white-space:nowrap;
  background:color-mix(in oklab, var(--c) 28%, transparent); color:color-mix(in oklab, var(--c) 40%, var(--nw-fg)); }
.nw-feel-factors b { font-size:var(--nw-fs-title); font-weight:500; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.nw-feel-factors small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
.nw-feel-why { padding:10px 12px; border-radius:12px; background:var(--nw-bg); border:1px solid var(--nw-line); font-size:var(--nw-fs-text); }
.nw-feel-why p { margin:4px 0; } .nw-feel-why .ex { color:var(--nw-fg2); }
`;var ve=Ne(bn.replace(/:host \{[\s\S]*?\n\}\n/,"")),vn=T`
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
    --nw-fs-label: 11px; --nw-fs-small: 12px; --nw-fs-text: 14px; --nw-fs-title: 17px; --nw-fs-case: 21px; --nw-fs-value: 34px; --nw-fs-temp: 58px;
    --nw-label-spacing: .6px;

    /* Meaning colours, « Aube » palette: OKLCH, same lightness and chroma, only the hue changes, so they always match.
       Pastel for surfaces; text in these colours uses the ink mix below, darker on light themes, lighter on dark ones. */
    --nw-rain: var(--hestia-rain-color, oklch(.8 .07 190));
    --nw-wind: var(--hestia-wind-color, oklch(.79 .075 280));
    --nw-heat: var(--hestia-heat-color, oklch(.83 .085 42));
    --nw-cold: var(--hestia-cold-color, oklch(.85 .05 220));
    --nw-calm: var(--hestia-calm-color, oklch(.83 .075 150));
    --nw-pressure: var(--hestia-pressure-color, oklch(.78 .07 315));
    --nw-level1: var(--hestia-level1-color, oklch(.88 .1 96));
    --nw-level2: var(--hestia-level2-color, oklch(.81 .105 64));
    --nw-level3: var(--hestia-level3-color, oklch(.74 .115 18));
    /* How much of the meaning colour goes into a coloured text: 34 % keeps even the light yellow readable (contrast 4.5:1) on its tinted pill. */
    --nw-ink: 34%;

    /* Motion */
    --nw-ease: cubic-bezier(.2, .8, .2, 1);
    --nw-expand: .45s;
  }
`,xn=T`
  ha-icon { display:flex; line-height:0; }
  button { font:inherit; color:inherit; }
  [data-entity] { cursor:pointer; }
  [data-entity]:focus-visible, button:focus-visible { outline:2px solid var(--nw-accent); outline-offset:2px; }
  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }


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
  .nw-now { display:flex; flex-direction:column; align-items:flex-end; text-align:right; gap:2px; }
  /* The tile's figures over the sky keep a soft halo; the banner's sit in the charter's glass frame, without it. */
  .nw-now:not(.nw-glass) { text-shadow:0 0 14px var(--nw-bg), 0 0 5px var(--nw-bg), 0 0 2px var(--nw-bg); }
  .nw-now .nw-label { color:color-mix(in srgb, var(--nw-fg) 75%, transparent); }
  .nw-now :is(.nw-chip, .nw-badge) { text-shadow:none; color:var(--nw-fg); background:color-mix(in srgb, var(--nw-bg) 86%, transparent); border-color:var(--nw-line); backdrop-filter:var(--nw-blur); }
  .nw-now .nw-chip ha-icon { color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .nw-now .cond { display:flex; align-items:center; gap:6px; font-weight:650; font-size:var(--nw-fs-text); }
  .nw-now .cond ha-icon { --mdc-icon-size:17px; }
  /* The tile's temperature; the full card's is the charter's .nw-temp. */
  .nw-now .temp:not(.nw-temp) { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-1px; line-height:1.05; white-space:nowrap; }
  .nw-now .temp small { font-size:var(--nw-fs-text); font-weight:400; vertical-align:super; margin-left:2px; letter-spacing:0; }
  /* Today's low and high: a quiet line under the temperature. */
  .nw-now .range { display:flex; gap:10px; font-size:var(--nw-fs-small); font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap;
    color:color-mix(in srgb, currentColor 82%, transparent); }
  /* Storm and downpour clouds stay dark whatever the theme: the text on them turns white, the pills keep the theme. */
  .dark-sky .nw-now:not(.nw-glass) { color:#fff; text-shadow:0 1px 5px #0b1a2b99; }
  .dark-sky .nw-now:not(.nw-glass) .nw-label { color:rgba(255,255,255,.88); }

  .nw-sub { margin:-8px 0 0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-empty { margin:0; padding:14px 0; text-align:center; font-size:var(--nw-fs-small); color:var(--nw-fg2); }

  /* Legend: always centred under its chart. */
  .nw-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:6px 16px; font-size:var(--nw-fs-small); color:var(--nw-fg2); margin-top:auto; }
  .nw-legend span { display:inline-flex; align-items:center; gap:6px; }
  .nw-legend i { width:14px; height:4px; border-radius:2px; background:var(--c); }
  .nw-legend i.sq { width:10px; height:10px; border-radius:3px; }
  .nw-legend i.dash { background:repeating-linear-gradient(90deg, color-mix(in oklab, var(--c) 60%, transparent) 0 3px, transparent 3px 5px); }

  /* A panel's look is the charter's (.nw-panel); its parts one under the other, 14 px apart. */
  .nw-panel { display:flex; flex-direction:column; gap:14px; }
  /* Main value of a panel: the figure is the charter's .nw-value; here its row and caption. Panels, heads, labels, stats: the shared charter. */
  .metric-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px 14px; }
  .metric { display:flex; flex-direction:column; gap:4px; min-width:0; border:0; background:none; padding:0; text-align:left; }
  .metric small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .metric small b { color:var(--nw-fg); }

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

  /* The « i » button comes from the shared charter (hestia-charte); its explanation bubble: one sentence, then an example. */
  .nw-pop { position:fixed; inset:auto; margin:0; width:min(320px, calc(100vw - 24px)); max-height:min(70vh, 480px); overflow:auto; box-sizing:border-box;
    padding:12px 14px; border-radius:var(--nw-radius); border:1px solid var(--nw-line); background:var(--nw-bg); color:var(--nw-fg);
    box-shadow:0 12px 32px #0b1a2b26; font-size:var(--nw-fs-text); line-height:1.45; font-weight:400;
    white-space:normal; text-align:left; letter-spacing:0; text-transform:none; text-shadow:none; }
  .nw-pop > b { display:block; margin-bottom:4px; }
  .nw-pop .ex { margin-top:8px; padding-top:8px; border-top:1px solid var(--nw-line); font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-pop .ex::before { content:var(--nw-example-word, 'Exemple'); display:block; font-size:var(--nw-fs-label); font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; margin-bottom:2px; }
  .nw-pop a { color:var(--nw-accent); }
`,yn=T`
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
`;function $n(e){let n=e.low!==void 0&&e.high!==void 0?`${e.low} \u2013 ${e.high}\xB0`:e.low??e.high?`${e.low??e.high}\xB0`:"",t=o`<b class="nw-temp" aria-label=${e.label??p}>${e.value}<sup>${e.unit}</sup></b>`;return o`<div class="nw-reading">
    ${e.onTap?o`<button type="button" class="nw-reading-tap" title=${e.tapTitle??p} @click=${e.onTap}>${t}</button>`:t}
    ${n?o`<span class="nw-range" title=${e.rangeTitle??p} aria-label=${e.rangeTitle??p}>${n}</span>`:p}
    ${e.more?o`<span class="nw-reading-more">${e.more}</span>`:p}
  </div>`}var kn={Lieu:"Place",Format:"Format","Ciel anim\xE9 et halos":"Animated sky and halos","Qualit\xE9 des animations":"Animation quality","Effet verre d\xE9poli":"Frosted glass effect","Bandeau (synth\xE8se et m\xE9t\xE9o du moment)":"Banner (summary and current weather)","Bulletin du jour":"Today\u2019s bulletin","Alertes et \xE9v\xE9nements":"Alerts and events","Section Aujourd\u2019hui":"Today section","Aujourd\u2019hui repli\xE9 au d\xE9part":"Today folded at first","Section Pr\xE9visions":"Forecast section","Pr\xE9visions repli\xE9es au d\xE9part":"Forecast folded at first","D\xE9tail des polluants et des pollens":"Pollutant and pollen details","Air et pollens de demain":"Tomorrow\u2019s air and pollen","Page \xE0 ouvrir":"Page to open","Contenu de la tuile d\xE9pli\xE9e":"Unfolded tile content","Pr\xE9visions affich\xE9es au d\xE9part":"Forecast shown at first","Contenu du bandeau":"Banner content","Contenu d\u2019Aujourd\u2019hui":"Today content","Contenu des Pr\xE9visions":"Forecast content","Appui long":"Long press",Appui:"Tap","Courbe de pression":"Pressure chart","Courbe du vent":"Wind chart","Barres de pluie":"Rain bars","Heure dans le bandeau":"Time in the banner","Coup\xE9es, le ciel et les halos restent fixes.":"Off, the sky and the halos stay still.","All\xE9g\xE9e : moins de gouttes, de flocons et de nuages.":"Light: fewer drops, flakes and clouds.","Le flou demande beaucoup de ressources : \xE0 couper sur un appareil lent. Coup\xE9, le verre devient plus opaque.":"The blur takes a lot of power: switch it off on a slow device. Off, the glass becomes more opaque.","La vigilance, l\u2019alerte mesur\xE9e chez vous et la frise des \xE9v\xE9nements. Coup\xE9, la frise ne montre que le ciel pr\xE9vu.":"The weather warning, the alert measured at home and the events timeline. Off, the timeline only shows the forecast sky.","Le chemin de la page, par exemple /meteo ou /lovelace/meteo.":"The page\u2019s path, for example /weather or /lovelace/weather.","Cochez ce qui s\u2019affiche quand la tuile est d\xE9pli\xE9e, et faites glisser pour changer l\u2019ordre.":"Tick what shows when the tile is unfolded, and drag to change the order.","Le bandeau et son ciel anim\xE9 restent toujours, avec le lieu, la vigilance et la m\xE9t\xE9o du moment. Cochez ce qu\u2019il montre en dessous, dans l\u2019ordre.":"The banner and its animated sky always stay, with the place, the weather warning and the current weather. Tick what it shows below, in order.","Tout d\xE9cocher retire la section.":"Untick everything to remove the section.","Un appui sur Heures ou Jours change l\u2019affichage ; ce choix est gard\xE9 sur chaque appareil.":"A tap on Hours or Days switches the view; the choice is kept on each device.","Sur plusieurs jours, on voit mieux arriver une d\xE9pression ou un anticyclone.":"Over several days, a low or a high is easier to see coming.","24 heures et 30 jours demandent un pluviom\xE8tre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours.":"24 hours and 30 days need a rain gauge whose statistics Home Assistant keeps; otherwise the card shows 7 days.","L\u2019heure de l\u2019appareil, mise \xE0 jour chaque minute.":"The device\u2019s time, updated every minute.","Compl\xE8te : la page m\xE9t\xE9o":"Full: the weather page","Tuile : une bande qui se d\xE9plie d\u2019un appui":"Tile: a band that unfolds with a tap","Tuile d\xE9pli\xE9e : la m\xEAme, ouverte au d\xE9part":"Unfolded tile: the same, open at first","Mini : une seule ligne":"Mini: a single line","Pr\xE9visions : les heures et les jours":"Forecast: the hours and the days","Pluie : \xE0 venir et tomb\xE9e":"Rain: coming and fallen","Alerte : visible seulement en cas de vigilance ou d\u2019alerte":"Alert: only shown during a weather warning or an alert","\xC9v\xE9nements (la frise)":"Events (the timeline)","Les prochains moments (soir, nuit, matin\u2026)":"The coming moments (evening, night, morning\u2026)","Pr\xE9visions (heures ou jours)":"Forecast (hours or days)",Heures:"Hours",Jours:"Days","D\xE9plier ou replier la tuile":"Unfold or fold the tile","Ouvrir la m\xE9t\xE9o compl\xE8te en fen\xEAtre":"Open the full weather in a window","Ouvrir une page":"Open a page",Rien:"Nothing","Visuel et performance":"Look and performance",Standard:"Standard",All\u00E9g\u00E9e:"Light",Fonctionnalit\u00E9s:"Features",Contenu:"Content","6 derni\xE8res heures":"Last 6 hours","24 derni\xE8res heures":"Last 24 hours","2 derniers jours":"Last 2 days","7 derniers jours":"Last 7 days","30 derniers jours":"Last 30 days","Bandeau intelligent":"Smart banner","Pr\xE9visions en tuiles (heures ou jours)":"Forecast tiles (hours or days)",Masqu\u00E9e:"Hidden","Sous le titre, en grand":"Under the title, large","Au-dessus de \xAB En ce moment \xBB":"Above \u201CRight now\u201D","Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)":"Chips (humidity, dew, sun\u2026)","Air et pollens du jour":"Today\u2019s air and pollen","24 derni\xE8res heures (une barre par heure)":"Last 24 hours (one bar an hour)","30 derniers jours (une barre par jour)":"Last 30 days (one bar a day)","Les 18 prochaines heures":"The next 18 hours","Les 7 prochains jours":"The next 7 days","Air et pollens":"Air and pollen","L\u2019int\xE9gration Hestia Weather ne r\xE9pond pas : la carte en a besoin depuis la version 2.0.":"The Hestia Weather integration does not answer: the card needs it since version 2.0.","D\xE9j\xE0 t\xE9l\xE9charg\xE9e ?":"Already downloaded?","Ajoutez-la":"Add it","Sinon,":"Otherwise,","installez-la":"install it","Ajoutez l\u2019int\xE9gration Hestia Weather : Param\xE8tres \u2192 Appareils et services.":"Add the Hestia Weather integration: Settings \u2192 Devices & services.","Lieu :":"Place:","Les sources (pr\xE9visions, station, air et pollens) se r\xE8glent dans":"The sources (forecast, station, air and pollen) are set in","l\u2019int\xE9gration Hestia Weather":"the Hestia Weather integration","Hestia Weather a besoin de son int\xE9gration":"Hestia Weather needs its integration","Depuis la version 2.0, la carte re\xE7oit ses calculs de l\u2019int\xE9gration Hestia Weather. D\xE9j\xE0 t\xE9l\xE9charg\xE9e depuis HACS ? Ajoutez-la dans Param\xE8tres \u2192 Appareils et services. Sinon, installez-la depuis HACS, red\xE9marrez Home Assistant, puis ajoutez-la. D\xE9j\xE0 ajout\xE9e ? Elle n\u2019a pas d\xE9marr\xE9 : les journaux disent pourquoi (Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB).":"Since version 2.0, the card gets its figures from the Hestia Weather integration. Already downloaded from HACS? Add it in Settings \u2192 Devices & services. Otherwise, install it from HACS, restart Home Assistant, then add it. Already added? It did not start: the logs say why (Settings \u2192 System \u2192 Logs, search for \u201Cweather\u201D).","Ajouter l\u2019int\xE9gration":"Add the integration","L\u2019installer":"Install it","Ajoutez l\u2019int\xE9gration Hestia Weather":"Add the Hestia Weather integration","Elle est install\xE9e mais pas encore configur\xE9e. Elle peut reprendre les r\xE9glages de vos cartes.":"It is installed but not set up yet. It can take over your cards\u2019 settings.","Choisissez un lieu":"Choose a place","Plusieurs lieux Hestia Weather sont configur\xE9s : choisissez celui de cette carte dans ses r\xE9glages.":"Several Hestia Weather places are set up: choose this card\u2019s place in its settings.","Lieu introuvable":"Place not found","Le lieu de cette carte n\u2019existe plus : choisissez-en un autre dans ses r\xE9glages.":"This card\u2019s place no longer exists: choose another one in its settings.","Rechargez la page":"Reload the page","L\u2019int\xE9gration Hestia Weather vient d\u2019\xEAtre mise \xE0 jour : rechargez la page pour afficher sa carte.":"The Hestia Weather integration has just been updated: reload the page to show its card.","L\u2019int\xE9gration Hestia Weather a renvoy\xE9 une erreur":"The Hestia Weather integration returned an error","Les journaux de Home Assistant disent pourquoi : Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB.":"Home Assistant\u2019s logs say why: Settings \u2192 System \u2192 Logs, search for \u201Cweather\u201D.","Voir les journaux":"See the logs","Chargement de la m\xE9t\xE9o":"Loading the weather",M\u00E9t\u00E9o:"Weather","M\xE9t\xE9o \xE0 {place}":"Weather in {place}",Fermer:"Close","Hestia - M\xE9t\xE9o":"Hestia - Weather",Maintenant:"Now",maintenant:"now",minuit:"midnight",midi:"noon","N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO":"N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW","Vent du {from} jusqu\u2019\xE0 {speed} km/h":"Wind from {from} up to {speed} km/h","Vent jusqu\u2019\xE0 {speed} km/h":"Wind up to {speed} km/h","Vent du {from} {speed} km/h":"Wind from {from} {speed} km/h","Vent {speed} km/h":"Wind {speed} km/h",", rafales {gust} km/h":", gusts {gust} km/h","Qu\u2019est-ce que : {title} ?":"What is: {title}?",Exemple:"Example","{label} : {text}":"{label}: {text}"," ; ":"; ","concentration indisponible":"concentration unavailable","donn\xE9es anciennes":"old data","Pr\xE9vision non disponible":"Forecast not available","Indice non configur\xE9":"Index not set up","Donn\xE9es anciennes":"Old data","\xC9v\xE9nement signal\xE9":"Event reported","Air ext\xE9rieur demain":"Outdoor air tomorrow","Air ext\xE9rieur aujourd\u2019hui":"Outdoor air today","Pollens demain":"Pollen tomorrow","Pollens aujourd\u2019hui":"Pollen today","Air ext\xE9rieur":"Outdoor air",Pollens:"Pollen",Demain:"Tomorrow","Niveau {value} sur {scale}":"Level {value} of {scale}","Code 7 \xB7 hors \xE9chelle":"Code 7 \xB7 off the scale","Indice pollen non fourni":"Pollen index not given","Niveau indisponible":"Level unavailable","Atmo France ne fournit pas d\u2019indice pollen exploitable pour demain \xE0 cet endroit.":"Atmo France gives no usable pollen index for tomorrow at this place.","Une concentration \xE0 0 peut \xEAtre une valeur r\xE9elle ou remplacer une donn\xE9e manquante chez Atmo France. Elle ne permet pas, \xE0 elle seule, de conclure \xE0 une absence de pollen.":"A concentration of 0 may be a real value or stand for missing data at Atmo France. On its own, it does not mean there is no pollen.","Publication Atmo : {date}.":"Published by Atmo: {date}.","Mise \xE0 jour {source} : {date}.":"Updated by {source}: {date}.","Certaines donn\xE9es sont anciennes : \xE0 v\xE9rifier dans l\u2019int\xE9gration.":"Some data is old: check it in the integration.","appui pour la page m\xE9t\xE9o":"tap for the weather page","appui pour la carte compl\xE8te":"tap for the full card","Aucune alerte en ce moment.":"No alert right now.","Cette carte reste cach\xE9e tant que tout est calme.":"This card stays hidden while all is calm.","Alertes m\xE9t\xE9o : appui pour la carte compl\xE8te":"Weather alerts: tap for the full card","Pr\xE9visions affich\xE9es":"Forecast shown","Pr\xE9visions indisponibles pour le moment.":"Forecast unavailable for now.","Pas de pluie avant {hour}":"No rain before {hour}","Pas de pluie pr\xE9vue d\u2019ici 18 h":"No rain expected in the next 18 hours","dans l\u2019heure":"within the hour","sur 6 h":"over 6 hours","\xE0 partir de {hour}":"from {hour}","\xC0 venir":"Coming up","au plus sur 6 h":"at most over 6 hours","en rafales":"in gusts","vent fort \xE0 partir de {hour}":"strong wind from {hour}","Votre fournisseur m\xE9t\xE9o ne pr\xE9voit pas la pression.":"Your weather provider does not forecast the pressure.","Pression stable sur 6 h":"Steady pressure over 6 hours","vers {hour}":"around {hour}","Orage pr\xE9vu vers {hour}":"Storm expected around {hour}","Pas d\u2019orage pr\xE9vu d\u2019ici 6 h":"No storm expected in the next 6 hours","\xC0 venir : le vent le plus fort des 6 heures":"Coming up: the strongest wind of the next 6 hours","\xC0 venir : la pression des 6 heures, si votre fournisseur la pr\xE9voit":"Coming up: the pressure of the next 6 hours, if your provider forecasts it","\xC0 venir : un orage pr\xE9vu dans les 6 heures":"Coming up: a storm expected within 6 hours",Pr\u00E9visions:"Forecast","18 prochaines heures":"Next 18 hours","Temp\xE9ratures de {low} \xE0 {high} \xB0C":"Temperatures from {low} to {high} \xB0C",", pluie jusqu\u2019\xE0 {mm} mm par heure":", rain up to {mm} mm an hour",", pas de pluie pr\xE9vue":", no rain expected","{n} prochains jours":"Next {n} days","Aujourd\u2019hui":"Today","aujourd\u2019hui":"today","Mesures et ressenti":"Measurements and feel","Conditions actuelles":"Current conditions","Vigilance officielle":"Official warning",Synth\u00E8se:"Summary","La m\xE9t\xE9o du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.":"Today\u2019s weather in one sentence, with what matters now and what is coming.","\xC0 v\xE9rifier":"To check","\xAB Pluie ce soir, puis \xE9claircies demain matin. \xBB":"\u201CRain this evening, then sunny spells tomorrow morning.\u201D","La temp\xE9rature monte":"The temperature is rising","La temp\xE9rature baisse":"The temperature is falling","page m\xE9t\xE9o":"weather page","carte compl\xE8te":"full card",replier:"fold",d\u00E9plier:"unfold","Les prochains moments":"The coming moments","Pr\xE9vu aujourd\u2019hui : {range}":"Expected today: {range}","mini {t} \xB0C":"low {t} \xB0C","maxi {t} \xB0C":"high {t} \xB0C","En ce moment":"Right now","Temp\xE9rature indisponible":"Temperature unavailable","{source} : {t} degr\xE9s Celsius":"{source}: {t} degrees Celsius",\u00C9v\u00E9nements:"Events","appui pour {goal}":"tap to {goal}","appui long pour {goal}":"long press to {goal}","Appui : {goal}":"Tap: {goal}","Appui long : {goal}":"Long press: {goal}",Pluie:"Rain",Vent:"Wind",Pression:"Pressure",Ressenti:"Feels like","\u22122 j":"\u22122 d","\u22121 j":"\u22121 d","\u22127 j":"\u22127 d","\u221230 j":"\u221230 d","\u221215 j":"\u221215 d","{gap} \xB0C par rapport au thermom\xE8tre":"{gap} \xB0C compared with the thermometer","{gap} \xB0C par rapport \xE0 la temp\xE9rature du bulletin":"{gap} \xB0C compared with the forecast temperature","C\u2019est la temp\xE9rature que le corps per\xE7oit. L\u2019humidit\xE9 et le soleil la font monter, le vent la fait baisser.":"It is the temperature the body feels. Humidity and sun push it up, wind brings it down.","C\u2019est une estimation, pas un indice officiel.":"It is an estimate, not an official index.","En savoir plus":"Learn more","En ce moment : {example}.":"Right now: {example}.","25 \xB0C au thermom\xE8tre dans un air tr\xE8s humide se ressentent comme 30 \xB0C.":"25 \xB0C on the thermometer in very humid air feels like 30 \xB0C.","en ce moment":"right now","Pluie des {period}":"Rain, {period}",indisponible:"unavailable","au moins {mm} mm":"at least {mm} mm","Vent des {period}, moyennes et rafales":"Wind, {period}, mean and gusts","Pression des {period}":"Pressure, {period}","Contenu de la carte":"Card content","Cochez ce que la carte montre.":"Tick what the card shows.","Ressenti : la temp\xE9rature per\xE7ue":"Feels like: the temperature you feel","Vent : le vent du moment et sa courbe":"Wind: the wind now and its chart","Pression : la pression et sa courbe":"Pressure: the pressure and its chart","Air et pollens : aujourd\u2019hui et demain":"Air and pollen: today and tomorrow","Le ressenti et son explication":"Feels like, and why","La jauge de \u22125 \xE0 45 \xB0C":"The gauge from \u22125 to 45 \xB0C","Ce qui le fait varier (humidit\xE9, vent, soleil)":"What changes it (humidity, wind, sun)","\xC0 venir : la prochaine heure et les 6 heures":"To come: the next hour and the next 6 hours","Tomb\xE9e aujourd\u2019hui, et en ce moment":"Fallen today, and right now","Les barres de pluie":"The rain bars","Les cumuls":"The totals","Le vent du moment et sa direction":"The wind now and its direction","La courbe":"The chart","Rafales, direction et maximum du jour":"Gusts, direction and today\u2019s maximum","La pression et sa tendance":"The pressure and its trend","Les valeurs pass\xE9es, le minimum et le maximum":"Past values, the minimum and the maximum","Rien \xE0 afficher : cochez au moins un \xE9l\xE9ment dans les r\xE9glages de la carte.":"Nothing to show: tick at least one item in the card\u2019s settings.","Ressenti indisponible pour le moment.":"Feels like unavailable for now.","Pluie indisponible pour le moment.":"Rain unavailable for now.","Vent indisponible pour le moment.":"Wind unavailable for now.","Pression indisponible pour le moment.":"Pressure unavailable for now.","Air et pollens indisponibles pour le moment.":"Air and pollen unavailable for now.","Type de carte":"Card type","Grandes cartes : la page m\xE9t\xE9o et la tuile":"Large cards: the weather page and the tile","Petites cartes : une ligne ou une alerte":"Small cards: one line or an alert","Hestia - \xC0 la pi\xE8ce":"Hestia - Single card","Hestia - Petite carte":"Hestia - Small card","La page m\xE9t\xE9o compl\xE8te ou la tuile qui se d\xE9plie. Le format se choisit dans les r\xE9glages.":"The full weather page or the tile that unfolds. The format is chosen in the settings.","Une seule ligne, ou une alerte visible seulement en cas de vigilance.":"A single line, or an alert shown only during a warning.","Cartes \xE0 la pi\xE8ce : ressenti, pluie, vent, pression, \xE9clairs, air, pr\xE9visions":"Single cards: feels like, rain, wind, pressure, lightning, air, forecast","Une seule partie : ressenti, pluie, vent, pression, \xE9clairs, air et pollens ou pr\xE9visions.":"A single part: feels like, rain, wind, pressure, lightning, air and pollen, or forecast.","Seulement en cas d\u2019orage":"Only during a storm","Cach\xE9e tant qu\u2019aucun orage n\u2019est \xE0 moins de 30 km ; visible pendant la modification du tableau de bord.":"Hidden while no storm is within 30 km; shown while the dashboard is edited.","\xC9clairs : le radar des orages (Blitzortung)":"Lightning: the storm radar (Blitzortung)","L\u2019\xE9clair le plus proche et sa direction":"The nearest strike and its direction","Le radar et le niveau":"The radar and the level","Les comptes (heure, 10 minutes, mois)":"The counts (hour, 10 minutes, month)","\xC9clairs (avec Blitzortung)":"Lightning (with Blitzortung)",Calme:"Calm",Secteur:"Area",Proche:"Close","Sur vous":"Overhead","{n} \xE9clairs":"{n} strikes","{n} \xE9clair":"{n} strike","\xC9clairs de la derni\xE8re heure autour de chez vous":"Lightning of the last hour around your home",N:"N",E:"E",S:"S",O:"W","Niveau : {step}":"Level: {step}",\u00C9clairs:"Lightning","ce mois":"this month","\xC0 moins de {km} km.":"Within {km} km.","Dans l\u2019heure":"Last hour","En 10 min":"Last 10 min","Ce mois":"This month",Dernier:"Last","il y a {n} min":"{n} min ago","Derni\xE8re heure \xB7 en rouge, les 10 derni\xE8res minutes":"Last hour \xB7 in red, the last 10 minutes","Cette carte montre les \xE9clairs autour de chez vous gr\xE2ce \xE0 Blitzortung, un r\xE9seau de d\xE9tecteurs b\xE9n\xE9voles. Installez l\u2019extension depuis HACS, puis choisissez-la dans les r\xE9glages de Hestia Weather.":"This card shows lightning around your home thanks to Blitzortung, a network of volunteer detectors. Install the extension from HACS, then choose it in the Hestia Weather settings.","Installer Blitzortung":"Install Blitzortung","R\xE9glages de Hestia Weather":"Hestia Weather settings","Source : {source}":"Source: {source}","sans effet":"no effect",r\u00E9chauffe:"warms",refroidit:"cools",attention:"watch out","{value} au ressenti":"{value} on the feel",Humidit\u00E9:"Humidity",Soleil:"Sun","Point de ros\xE9e":"Dew point","la nuit, il ne r\xE9chauffe pas":"it does not warm at night","ne r\xE9chauffe pas":"does not warm","air tr\xE8s lourd":"very muggy air","air lourd":"muggy air","gel\xE9e blanche possible":"white frost possible","sans g\xEAne":"comfortable","comme la temp\xE9rature":"same as the temperature","Jour affich\xE9":"Day shown","air humide":"humid air","air sec":"dry air","Maint.":"Now","n\u2019ajoute rien":"adds nothing","\xE9chelle de {month}":"{month} scale","\xE9chelle d\u2019{month}":"{month} scale","comme la temp\xE9rature : pas de vent pour l\u2019abaisser":"same as the temperature: no wind to lower it","du nord":"from the north","du nord-est":"from the north-east","d\u2019est":"from the east","du sud-est":"from the south-east","du sud":"from the south","du sud-ouest":"from the south-west","d\u2019ouest":"from the west","du nord-ouest":"from the north-west","{mm} mm d\u2019ici 6 h":"{mm} mm within 6 h","pas de pluie avant {hour}":"no rain before {hour}","rien d\u2019ici 18 h":"none within 18 h","Glissez le doigt sur la courbe pour lire chaque heure.":"Slide a finger along the curve to read each hour.","Touchez un jour pour voir son d\xE9tail.":"Tap a day to see its details.","maint.":"now","Vent en km/h":"Wind in km/h","Froid intense":"Intense cold",Froid:"Cold",Frais:"Cool",Agr\u00E9able:"Pleasant",Chaud:"Hot","Tr\xE8s chaud":"Very hot","Chaleur intense":"Intense heat","seuils du ressenti":"feel thresholds","Ressenti {t} \xB0C":"Feels like {t} \xB0C","Cadre de \xAB En ce moment \xBB":"\xAB Now \xBB frame","Un cadre de verre derri\xE8re la temp\xE9rature, pour la lire sur le ciel anim\xE9.":"A glass frame behind the temperature, to read it over the animated sky.",Opaque:"Opaque",Transparent:"Clear","Sans cadre":"No frame"};var An={Lieu:"Ort",Format:"Format","Ciel anim\xE9 et halos":"Animierter Himmel und Lichth\xF6fe","Qualit\xE9 des animations":"Qualit\xE4t der Animationen","Effet verre d\xE9poli":"Milchglas-Effekt","Bandeau (synth\xE8se et m\xE9t\xE9o du moment)":"Banner (Zusammenfassung und aktuelles Wetter)","Bulletin du jour":"Tagesbericht","Alertes et \xE9v\xE9nements":"Warnungen und Ereignisse","Section Aujourd\u2019hui":"Bereich \u201EHeute\u201C","Aujourd\u2019hui repli\xE9 au d\xE9part":"\u201EHeute\u201C anfangs eingeklappt","Section Pr\xE9visions":"Bereich \u201EVorhersage\u201C","Pr\xE9visions repli\xE9es au d\xE9part":"Vorhersage anfangs eingeklappt","D\xE9tail des polluants et des pollens":"Details zu Schadstoffen und Pollen","Air et pollens de demain":"Luft und Pollen morgen","Page \xE0 ouvrir":"Seite, die ge\xF6ffnet wird","Contenu de la tuile d\xE9pli\xE9e":"Inhalt der ausgeklappten Kachel","Pr\xE9visions affich\xE9es au d\xE9part":"Vorhersage anfangs angezeigt","Contenu du bandeau":"Inhalt des Banners","Contenu d\u2019Aujourd\u2019hui":"Inhalt von \u201EHeute\u201C","Contenu des Pr\xE9visions":"Inhalt der Vorhersage","Appui long":"Langer Druck",Appui:"Tippen","Courbe de pression":"Luftdruckkurve","Courbe du vent":"Windkurve","Barres de pluie":"Regenbalken","Heure dans le bandeau":"Uhrzeit im Banner","Coup\xE9es, le ciel et les halos restent fixes.":"Ausgeschaltet bleiben Himmel und Lichth\xF6fe statisch.","All\xE9g\xE9e : moins de gouttes, de flocons et de nuages.":"Reduziert: weniger Tropfen, Flocken und Wolken.","Le flou demande beaucoup de ressources : \xE0 couper sur un appareil lent. Coup\xE9, le verre devient plus opaque.":"Die Unsch\xE4rfe braucht viel Leistung: auf einem langsamen Ger\xE4t ausschalten. Ausgeschaltet wird das Glas undurchsichtiger.","La vigilance, l\u2019alerte mesur\xE9e chez vous et la frise des \xE9v\xE9nements. Coup\xE9, la frise ne montre que le ciel pr\xE9vu.":"Die amtliche Warnung, die bei Ihnen gemessene Warnung und die Ereignis-Zeitleiste. Ausgeschaltet zeigt die Zeitleiste nur den vorhergesagten Himmel.","Le chemin de la page, par exemple /meteo ou /lovelace/meteo.":"Der Pfad der Seite, zum Beispiel /wetter oder /lovelace/wetter.","Cochez ce qui s\u2019affiche quand la tuile est d\xE9pli\xE9e, et faites glisser pour changer l\u2019ordre.":"W\xE4hlen Sie aus, was bei ausgeklappter Kachel erscheint, und ziehen Sie, um die Reihenfolge zu \xE4ndern.","Le bandeau et son ciel anim\xE9 restent toujours, avec le lieu, la vigilance et la m\xE9t\xE9o du moment. Cochez ce qu\u2019il montre en dessous, dans l\u2019ordre.":"Das Banner mit seinem animierten Himmel bleibt immer, mit Ort, Warnung und aktuellem Wetter. W\xE4hlen Sie aus, was darunter erscheint, in dieser Reihenfolge.","Tout d\xE9cocher retire la section.":"Wenn Sie alles abw\xE4hlen, verschwindet der Bereich.","Un appui sur Heures ou Jours change l\u2019affichage ; ce choix est gard\xE9 sur chaque appareil.":"Ein Tippen auf Stunden oder Tage wechselt die Ansicht; die Wahl wird auf jedem Ger\xE4t gespeichert.","Sur plusieurs jours, on voit mieux arriver une d\xE9pression ou un anticyclone.":"\xDCber mehrere Tage erkennt man ein Tief oder Hoch fr\xFCher.","24 heures et 30 jours demandent un pluviom\xE8tre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours.":"24 Stunden und 30 Tage setzen einen Regenmesser voraus, dessen Statistiken Home Assistant speichert; sonst zeigt die Karte 7 Tage.","L\u2019heure de l\u2019appareil, mise \xE0 jour chaque minute.":"Die Uhrzeit des Ger\xE4ts, jede Minute aktualisiert.","Compl\xE8te : la page m\xE9t\xE9o":"Vollst\xE4ndig: die Wetterseite","Tuile : une bande qui se d\xE9plie d\u2019un appui":"Kachel: ein Streifen, der sich per Tippen ausklappt","Tuile d\xE9pli\xE9e : la m\xEAme, ouverte au d\xE9part":"Ausgeklappte Kachel: dieselbe, anfangs ge\xF6ffnet","Mini : une seule ligne":"Mini: nur eine Zeile","Pr\xE9visions : les heures et les jours":"Vorhersage: die Stunden und die Tage","Pluie : \xE0 venir et tomb\xE9e":"Regen: kommend und gefallen","Alerte : visible seulement en cas de vigilance ou d\u2019alerte":"Warnung: nur sichtbar bei einer Warnung","\xC9v\xE9nements (la frise)":"Ereignisse (die Zeitleiste)","Les prochains moments (soir, nuit, matin\u2026)":"Die n\xE4chsten Tageszeiten (Abend, Nacht, Morgen \u2026)","Pr\xE9visions (heures ou jours)":"Vorhersage (Stunden oder Tage)",Heures:"Stunden",Jours:"Tage","D\xE9plier ou replier la tuile":"Kachel aus- oder einklappen","Ouvrir la m\xE9t\xE9o compl\xE8te en fen\xEAtre":"Vollst\xE4ndiges Wetter in einem Fenster \xF6ffnen","Ouvrir une page":"Eine Seite \xF6ffnen",Rien:"Nichts","Visuel et performance":"Optik und Leistung",Standard:"Standard",All\u00E9g\u00E9e:"Reduziert",Fonctionnalit\u00E9s:"Funktionen",Contenu:"Inhalt","6 derni\xE8res heures":"Letzte 6 Stunden","24 derni\xE8res heures":"Letzte 24 Stunden","2 derniers jours":"Letzte 2 Tage","7 derniers jours":"Letzte 7 Tage","30 derniers jours":"Letzte 30 Tage","Bandeau intelligent":"Intelligentes Banner","Pr\xE9visions en tuiles (heures ou jours)":"Vorhersage in Kacheln (Stunden oder Tage)",Masqu\u00E9e:"Ausgeblendet","Sous le titre, en grand":"Unter dem Titel, gro\xDF","Au-dessus de \xAB En ce moment \xBB":"\xDCber \u201EIm Moment\u201C","Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)":"Chips (Luftfeuchtigkeit, Taupunkt, Sonne \u2026)","Air et pollens du jour":"Luft und Pollen heute","24 derni\xE8res heures (une barre par heure)":"Letzte 24 Stunden (ein Balken pro Stunde)","30 derniers jours (une barre par jour)":"Letzte 30 Tage (ein Balken pro Tag)","Les 18 prochaines heures":"Die n\xE4chsten 18 Stunden","Les 7 prochains jours":"Die n\xE4chsten 7 Tage","Air et pollens":"Luft und Pollen","L\u2019int\xE9gration Hestia Weather ne r\xE9pond pas : la carte en a besoin depuis la version 2.0.":"Die Integration Hestia Weather antwortet nicht: Die Karte ben\xF6tigt sie seit Version 2.0.","D\xE9j\xE0 t\xE9l\xE9charg\xE9e ?":"Schon heruntergeladen?","Ajoutez-la":"F\xFCgen Sie sie hinzu","Sinon,":"Andernfalls","installez-la":"installieren Sie sie","Ajoutez l\u2019int\xE9gration Hestia Weather : Param\xE8tres \u2192 Appareils et services.":"F\xFCgen Sie die Integration Hestia Weather hinzu: Einstellungen \u2192 Ger\xE4te & Dienste.","Lieu :":"Ort:","Les sources (pr\xE9visions, station, air et pollens) se r\xE8glent dans":"Die Quellen (Vorhersage, Wetterstation, Luft und Pollen) werden eingestellt in","l\u2019int\xE9gration Hestia Weather":"der Integration Hestia Weather","Hestia Weather a besoin de son int\xE9gration":"Hestia Weather braucht seine Integration","Depuis la version 2.0, la carte re\xE7oit ses calculs de l\u2019int\xE9gration Hestia Weather. D\xE9j\xE0 t\xE9l\xE9charg\xE9e depuis HACS ? Ajoutez-la dans Param\xE8tres \u2192 Appareils et services. Sinon, installez-la depuis HACS, red\xE9marrez Home Assistant, puis ajoutez-la. D\xE9j\xE0 ajout\xE9e ? Elle n\u2019a pas d\xE9marr\xE9 : les journaux disent pourquoi (Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB).":"Seit Version 2.0 erh\xE4lt die Karte ihre Berechnungen von der Integration Hestia Weather. Schon \xFCber HACS heruntergeladen? F\xFCgen Sie sie unter Einstellungen \u2192 Ger\xE4te & Dienste hinzu. Andernfalls installieren Sie sie \xFCber HACS, starten Home Assistant neu und f\xFCgen sie dann hinzu. Schon hinzugef\xFCgt? Dann hat sie nicht gestartet: Das Protokoll nennt den Grund (Einstellungen \u2192 System \u2192 Protokolle, nach \u201Eweather\u201C suchen).","Ajouter l\u2019int\xE9gration":"Integration hinzuf\xFCgen","L\u2019installer":"Installieren","Ajoutez l\u2019int\xE9gration Hestia Weather":"Integration Hestia Weather hinzuf\xFCgen","Elle est install\xE9e mais pas encore configur\xE9e. Elle peut reprendre les r\xE9glages de vos cartes.":"Sie ist installiert, aber noch nicht eingerichtet. Sie kann die Einstellungen Ihrer Karten \xFCbernehmen.","Choisissez un lieu":"W\xE4hlen Sie einen Ort","Plusieurs lieux Hestia Weather sont configur\xE9s : choisissez celui de cette carte dans ses r\xE9glages.":"Es sind mehrere Hestia-Weather-Orte eingerichtet: W\xE4hlen Sie in den Einstellungen den Ort dieser Karte.","Lieu introuvable":"Ort nicht gefunden","Le lieu de cette carte n\u2019existe plus : choisissez-en un autre dans ses r\xE9glages.":"Der Ort dieser Karte existiert nicht mehr: W\xE4hlen Sie in den Einstellungen einen anderen.","Rechargez la page":"Seite neu laden","L\u2019int\xE9gration Hestia Weather vient d\u2019\xEAtre mise \xE0 jour : rechargez la page pour afficher sa carte.":"Die Integration Hestia Weather wurde gerade aktualisiert: Laden Sie die Seite neu, um ihre Karte anzuzeigen.","L\u2019int\xE9gration Hestia Weather a renvoy\xE9 une erreur":"Die Integration Hestia Weather hat einen Fehler gemeldet","Les journaux de Home Assistant disent pourquoi : Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB.":"Das Protokoll von Home Assistant nennt den Grund: Einstellungen \u2192 System \u2192 Protokolle, nach \u201Eweather\u201C suchen.","Voir les journaux":"Protokolle ansehen","Chargement de la m\xE9t\xE9o":"Wetter wird geladen",M\u00E9t\u00E9o:"Wetter","M\xE9t\xE9o \xE0 {place}":"Wetter in {place}",Fermer:"Schlie\xDFen","Hestia - M\xE9t\xE9o":"Hestia - Wetter",Maintenant:"Jetzt",maintenant:"jetzt",minuit:"Mitternacht",midi:"Mittag","N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO":"N NNO NO ONO O OSO SO SSO S SSW SW WSW W WNW NW NNW","Vent du {from} jusqu\u2019\xE0 {speed} km/h":"Wind aus {from} bis {speed} km/h","Vent jusqu\u2019\xE0 {speed} km/h":"Wind bis {speed} km/h","Vent du {from} {speed} km/h":"Wind aus {from} {speed} km/h","Vent {speed} km/h":"Wind {speed} km/h",", rafales {gust} km/h":", B\xF6en {gust} km/h","Qu\u2019est-ce que : {title} ?":"Was ist: {title}?",Exemple:"Beispiel","{label} : {text}":"{label}: {text}"," ; ":"; ","concentration indisponible":"Konzentration nicht verf\xFCgbar","donn\xE9es anciennes":"veraltete Daten","Pr\xE9vision non disponible":"Vorhersage nicht verf\xFCgbar","Indice non configur\xE9":"Index nicht eingerichtet","Donn\xE9es anciennes":"Veraltete Daten","\xC9v\xE9nement signal\xE9":"Ereignis gemeldet","Air ext\xE9rieur demain":"Au\xDFenluft morgen","Air ext\xE9rieur aujourd\u2019hui":"Au\xDFenluft heute","Pollens demain":"Pollen morgen","Pollens aujourd\u2019hui":"Pollen heute","Air ext\xE9rieur":"Au\xDFenluft",Pollens:"Pollen",Demain:"Morgen","Niveau {value} sur {scale}":"Stufe {value} von {scale}","Code 7 \xB7 hors \xE9chelle":"Code 7 \xB7 au\xDFerhalb der Skala","Indice pollen non fourni":"Pollenindex nicht geliefert","Niveau indisponible":"Stufe nicht verf\xFCgbar","Atmo France ne fournit pas d\u2019indice pollen exploitable pour demain \xE0 cet endroit.":"Atmo France liefert f\xFCr morgen an diesem Ort keinen verwertbaren Pollenindex.","Une concentration \xE0 0 peut \xEAtre une valeur r\xE9elle ou remplacer une donn\xE9e manquante chez Atmo France. Elle ne permet pas, \xE0 elle seule, de conclure \xE0 une absence de pollen.":"Eine Konzentration von 0 kann ein echter Wert sein oder bei Atmo France einen fehlenden Wert ersetzen. F\xFCr sich allein beweist sie nicht, dass keine Pollen vorhanden sind.","Publication Atmo : {date}.":"Ver\xF6ffentlicht von Atmo: {date}.","Mise \xE0 jour {source} : {date}.":"Aktualisiert von {source}: {date}.","Certaines donn\xE9es sont anciennes : \xE0 v\xE9rifier dans l\u2019int\xE9gration.":"Einige Daten sind veraltet: bitte in der Integration pr\xFCfen.","appui pour la page m\xE9t\xE9o":"Tippen f\xFCr die Wetterseite","appui pour la carte compl\xE8te":"Tippen f\xFCr die vollst\xE4ndige Karte","Aucune alerte en ce moment.":"Momentan keine Warnung.","Cette carte reste cach\xE9e tant que tout est calme.":"Diese Karte bleibt ausgeblendet, solange alles ruhig ist.","Alertes m\xE9t\xE9o : appui pour la carte compl\xE8te":"Wetterwarnungen: Tippen f\xFCr die vollst\xE4ndige Karte","Pr\xE9visions affich\xE9es":"Angezeigte Vorhersage","Pr\xE9visions indisponibles pour le moment.":"Vorhersage derzeit nicht verf\xFCgbar.","Pas de pluie avant {hour}":"Kein Regen vor {hour}","Pas de pluie pr\xE9vue d\u2019ici 18 h":"Kein Regen in den n\xE4chsten 18 Stunden erwartet","dans l\u2019heure":"innerhalb einer Stunde","sur 6 h":"in 6 Stunden","\xE0 partir de {hour}":"ab {hour}","\xC0 venir":"Demn\xE4chst","au plus sur 6 h":"h\xF6chstens in 6 Stunden","en rafales":"in B\xF6en","vent fort \xE0 partir de {hour}":"starker Wind ab {hour}","Votre fournisseur m\xE9t\xE9o ne pr\xE9voit pas la pression.":"Ihr Wetterdienst sagt den Luftdruck nicht vorher.","Pression stable sur 6 h":"Stabiler Luftdruck in 6 Stunden","vers {hour}":"gegen {hour}","Orage pr\xE9vu vers {hour}":"Gewitter gegen {hour} erwartet","Pas d\u2019orage pr\xE9vu d\u2019ici 6 h":"Kein Gewitter in den n\xE4chsten 6 Stunden erwartet","\xC0 venir : le vent le plus fort des 6 heures":"Demn\xE4chst: der st\xE4rkste Wind der n\xE4chsten 6 Stunden","\xC0 venir : la pression des 6 heures, si votre fournisseur la pr\xE9voit":"Demn\xE4chst: der Luftdruck der n\xE4chsten 6 Stunden, wenn Ihr Wetterdienst ihn vorhersagt","\xC0 venir : un orage pr\xE9vu dans les 6 heures":"Demn\xE4chst: ein Gewitter in den n\xE4chsten 6 Stunden",Pr\u00E9visions:"Vorhersage","18 prochaines heures":"N\xE4chste 18 Stunden","Temp\xE9ratures de {low} \xE0 {high} \xB0C":"Temperaturen von {low} bis {high} \xB0C",", pluie jusqu\u2019\xE0 {mm} mm par heure":", Regen bis zu {mm} mm pro Stunde",", pas de pluie pr\xE9vue":", kein Regen erwartet","{n} prochains jours":"N\xE4chste {n} Tage","Aujourd\u2019hui":"Heute","aujourd\u2019hui":"heute","Mesures et ressenti":"Messwerte und gef\xFChlte Temperatur","Conditions actuelles":"Aktuelle Bedingungen","Vigilance officielle":"Amtliche Warnung",Synth\u00E8se:"Zusammenfassung","La m\xE9t\xE9o du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.":"Das Wetter des Tages in einem Satz, mit dem, was jetzt z\xE4hlt und was kommt.","\xC0 v\xE9rifier":"Zu pr\xFCfen","\xAB Pluie ce soir, puis \xE9claircies demain matin. \xBB":"\u201EHeute Abend Regen, morgen fr\xFCh dann Aufheiterungen.\u201C","La temp\xE9rature monte":"Die Temperatur steigt","La temp\xE9rature baisse":"Die Temperatur sinkt","page m\xE9t\xE9o":"Wetterseite","carte compl\xE8te":"vollst\xE4ndige Karte",replier:"einklappen",d\u00E9plier:"ausklappen","Les prochains moments":"Die n\xE4chsten Tageszeiten","Pr\xE9vu aujourd\u2019hui : {range}":"Heute erwartet: {range}","mini {t} \xB0C":"Tief {t} \xB0C","maxi {t} \xB0C":"Hoch {t} \xB0C","En ce moment":"Im Moment","Temp\xE9rature indisponible":"Temperatur nicht verf\xFCgbar","{source} : {t} degr\xE9s Celsius":"{source}: {t} Grad Celsius",\u00C9v\u00E9nements:"Ereignisse","appui pour {goal}":"Tippen: {goal}","appui long pour {goal}":"Langer Druck: {goal}","Appui : {goal}":"Tippen: {goal}","Appui long : {goal}":"Langer Druck: {goal}",Pluie:"Regen",Vent:"Wind",Pression:"Luftdruck",Ressenti:"Gef\xFChlt","\u22122 j":"\u22122 T","\u22121 j":"\u22121 T","\u22127 j":"\u22127 T","\u221230 j":"\u221230 T","\u221215 j":"\u221215 T","{gap} \xB0C par rapport au thermom\xE8tre":"{gap} \xB0C im Vergleich zum Thermometer","{gap} \xB0C par rapport \xE0 la temp\xE9rature du bulletin":"{gap} \xB0C im Vergleich zur Temperatur im Bericht","C\u2019est la temp\xE9rature que le corps per\xE7oit. L\u2019humidit\xE9 et le soleil la font monter, le vent la fait baisser.":"Das ist die Temperatur, die der K\xF6rper wahrnimmt. Luftfeuchtigkeit und Sonne lassen sie steigen, Wind l\xE4sst sie sinken.","C\u2019est une estimation, pas un indice officiel.":"Das ist eine Sch\xE4tzung, kein offizieller Index.","En savoir plus":"Mehr erfahren","En ce moment : {example}.":"Im Moment: {example}.","25 \xB0C au thermom\xE8tre dans un air tr\xE8s humide se ressentent comme 30 \xB0C.":"25 \xB0C auf dem Thermometer f\xFChlen sich in sehr feuchter Luft wie 30 \xB0C an.","en ce moment":"im Moment","Pluie des {period}":"Regen, {period}",indisponible:"nicht verf\xFCgbar","au moins {mm} mm":"mindestens {mm} mm","Vent des {period}, moyennes et rafales":"Wind, {period}, Mittelwerte und B\xF6en","Pression des {period}":"Luftdruck, {period}","Contenu de la carte":"Inhalt der Karte","Cochez ce que la carte montre.":"W\xE4hlen Sie aus, was die Karte zeigt.","Ressenti : la temp\xE9rature per\xE7ue":"Gef\xFChlt: die wahrgenommene Temperatur","Vent : le vent du moment et sa courbe":"Wind: der aktuelle Wind und seine Kurve","Pression : la pression et sa courbe":"Luftdruck: der Druck und seine Kurve","Air et pollens : aujourd\u2019hui et demain":"Luft und Pollen: heute und morgen","Le ressenti et son explication":"Die gef\xFChlte Temperatur und ihre Erkl\xE4rung","La jauge de \u22125 \xE0 45 \xB0C":"Die Skala von \u22125 bis 45 \xB0C","Ce qui le fait varier (humidit\xE9, vent, soleil)":"Was sie beeinflusst (Luftfeuchtigkeit, Wind, Sonne)","\xC0 venir : la prochaine heure et les 6 heures":"Demn\xE4chst: die n\xE4chste Stunde und die n\xE4chsten 6 Stunden","Tomb\xE9e aujourd\u2019hui, et en ce moment":"Heute gefallen und im Moment","Les barres de pluie":"Die Regenbalken","Les cumuls":"Die Summen","Le vent du moment et sa direction":"Der aktuelle Wind und seine Richtung","La courbe":"Die Kurve","Rafales, direction et maximum du jour":"B\xF6en, Richtung und Tagesh\xF6chstwert","La pression et sa tendance":"Der Luftdruck und sein Trend","Les valeurs pass\xE9es, le minimum et le maximum":"Die vergangenen Werte, das Minimum und das Maximum","Rien \xE0 afficher : cochez au moins un \xE9l\xE9ment dans les r\xE9glages de la carte.":"Nichts anzuzeigen: W\xE4hlen Sie in den Karteneinstellungen mindestens ein Element aus.","Ressenti indisponible pour le moment.":"Gef\xFChlte Temperatur derzeit nicht verf\xFCgbar.","Pluie indisponible pour le moment.":"Regen derzeit nicht verf\xFCgbar.","Vent indisponible pour le moment.":"Wind derzeit nicht verf\xFCgbar.","Pression indisponible pour le moment.":"Luftdruck derzeit nicht verf\xFCgbar.","Air et pollens indisponibles pour le moment.":"Luft und Pollen derzeit nicht verf\xFCgbar.","Type de carte":"Kartentyp","Grandes cartes : la page m\xE9t\xE9o et la tuile":"Gro\xDFe Karten: die Wetterseite und die Kachel","Petites cartes : une ligne ou une alerte":"Kleine Karten: eine Zeile oder eine Warnung","Hestia - \xC0 la pi\xE8ce":"Hestia - Einzelkarte","Hestia - Petite carte":"Hestia - Kleine Karte","La page m\xE9t\xE9o compl\xE8te ou la tuile qui se d\xE9plie. Le format se choisit dans les r\xE9glages.":"Die vollst\xE4ndige Wetterseite oder die Kachel, die sich ausklappt. Das Format wird in den Einstellungen gew\xE4hlt.","Une seule ligne, ou une alerte visible seulement en cas de vigilance.":"Eine einzelne Zeile oder eine Warnung, die nur bei einer Warnlage sichtbar ist.","Cartes \xE0 la pi\xE8ce : ressenti, pluie, vent, pression, \xE9clairs, air, pr\xE9visions":"Einzelkarten: gef\xFChlte Temperatur, Regen, Wind, Luftdruck, Blitze, Luft, Vorhersage","Une seule partie : ressenti, pluie, vent, pression, \xE9clairs, air et pollens ou pr\xE9visions.":"Nur ein Teil: gef\xFChlte Temperatur, Regen, Wind, Luftdruck, Blitze, Luft und Pollen oder Vorhersage.","Seulement en cas d\u2019orage":"Nur bei Gewitter","Cach\xE9e tant qu\u2019aucun orage n\u2019est \xE0 moins de 30 km ; visible pendant la modification du tableau de bord.":"Ausgeblendet, solange kein Gewitter n\xE4her als 30 km ist; sichtbar, w\xE4hrend das Dashboard bearbeitet wird.","\xC9clairs : le radar des orages (Blitzortung)":"Blitze: das Gewitterradar (Blitzortung)","L\u2019\xE9clair le plus proche et sa direction":"Der n\xE4chste Blitz und seine Richtung","Le radar et le niveau":"Das Radar und die Stufe","Les comptes (heure, 10 minutes, mois)":"Die Z\xE4hler (Stunde, 10 Minuten, Monat)","\xC9clairs (avec Blitzortung)":"Blitze (mit Blitzortung)",Calme:"Ruhig",Secteur:"In der Gegend",Proche:"Nah","Sur vous":"Direkt \xFCber Ihnen","{n} \xE9clairs":"{n} Blitze","{n} \xE9clair":"{n} Blitz","\xC9clairs de la derni\xE8re heure autour de chez vous":"Blitze der letzten Stunde rund um Ihr Zuhause",N:"N",E:"O",S:"S",O:"W","Niveau : {step}":"Stufe: {step}",\u00C9clairs:"Blitze","ce mois":"diesen Monat","\xC0 moins de {km} km.":"Im Umkreis von {km} km.","Dans l\u2019heure":"Letzte Stunde","En 10 min":"Letzte 10 Min.","Ce mois":"Diesen Monat",Dernier:"Letzter","il y a {n} min":"vor {n} Min.","Derni\xE8re heure \xB7 en rouge, les 10 derni\xE8res minutes":"Letzte Stunde \xB7 rot: die letzten 10 Minuten","Cette carte montre les \xE9clairs autour de chez vous gr\xE2ce \xE0 Blitzortung, un r\xE9seau de d\xE9tecteurs b\xE9n\xE9voles. Installez l\u2019extension depuis HACS, puis choisissez-la dans les r\xE9glages de Hestia Weather.":"Diese Karte zeigt die Blitze rund um Ihr Zuhause dank Blitzortung, einem Netz ehrenamtlich betriebener Detektoren. Installieren Sie die Erweiterung \xFCber HACS und w\xE4hlen Sie sie dann in den Einstellungen von Hestia Weather aus.","Installer Blitzortung":"Blitzortung installieren","R\xE9glages de Hestia Weather":"Einstellungen von Hestia Weather","Source : {source}":"Quelle: {source}","sans effet":"ohne Wirkung",r\u00E9chauffe:"w\xE4rmt",refroidit:"k\xFChlt",attention:"Achtung","{value} au ressenti":"{value} gef\xFChlt",Humidit\u00E9:"Feuchte",Soleil:"Sonne","Point de ros\xE9e":"Taupunkt","la nuit, il ne r\xE9chauffe pas":"nachts w\xE4rmt sie nicht","ne r\xE9chauffe pas":"w\xE4rmt nicht","air tr\xE8s lourd":"sehr schw\xFCle Luft","air lourd":"schw\xFCle Luft","gel\xE9e blanche possible":"Raureif m\xF6glich","sans g\xEAne":"angenehm","comme la temp\xE9rature":"wie die Temperatur","Jour affich\xE9":"Angezeigter Tag","air humide":"feuchte Luft","air sec":"trockene Luft","Maint.":"Jetzt","n\u2019ajoute rien":"\xE4ndert nichts","\xE9chelle de {month}":"Skala f\xFCr {month}","\xE9chelle d\u2019{month}":"Skala f\xFCr {month}","comme la temp\xE9rature : pas de vent pour l\u2019abaisser":"wie die Temperatur: kein Wind, der sie senkt","du nord":"aus Nord","du nord-est":"aus Nordost","d\u2019est":"aus Ost","du sud-est":"aus S\xFCdost","du sud":"aus S\xFCd","du sud-ouest":"aus S\xFCdwest","d\u2019ouest":"aus West","du nord-ouest":"aus Nordwest","{mm} mm d\u2019ici 6 h":"{mm} mm in den n\xE4chsten 6 Std.","pas de pluie avant {hour}":"kein Regen vor {hour}","rien d\u2019ici 18 h":"nichts in den n\xE4chsten 18 Std.","Glissez le doigt sur la courbe pour lire chaque heure.":"Fahren Sie mit dem Finger \xFCber die Kurve, um jede Stunde zu lesen.","Touchez un jour pour voir son d\xE9tail.":"Tippen Sie auf einen Tag, um die Details zu sehen.","maint.":"jetzt","Vent en km/h":"Wind in km/h","Froid intense":"Starke K\xE4lte",Froid:"Kalt",Frais:"K\xFChl",Agr\u00E9able:"Angenehm",Chaud:"Hei\xDF","Tr\xE8s chaud":"Sehr hei\xDF","Chaleur intense":"Starke Hitze","seuils du ressenti":"Schwellen des Gef\xFChlten","Ressenti {t} \xB0C":"Gef\xFChlt {t} \xB0C","Cadre de \xAB En ce moment \xBB":"Rahmen von \xAB Jetzt \xBB","Un cadre de verre derri\xE8re la temp\xE9rature, pour la lire sur le ciel anim\xE9.":"Ein Glasrahmen hinter der Temperatur, damit sie \xFCber dem animierten Himmel lesbar bleibt.",Opaque:"Deckend",Transparent:"Durchsichtig","Sans cadre":"Ohne Rahmen"};var Cn={en:kn,de:An},Le="fr",$t="fr-FR";function Me(e,n){let t=(e??"").toLowerCase().split("-")[0],i=t==="fr"?"fr":Cn[t]?t:"en",a=i==="fr"?"fr-FR":n||e||"en",s=i!==Le||a!==$t;return Le=i,$t=a,s}function Tn(){let e;try{e=document.querySelector("home-assistant")?.hass?.language}catch{}try{e??=JSON.parse(localStorage.getItem("selectedLanguage")??"null")??void 0}catch{}Me(e||document.documentElement.lang||navigator.language)}var ie=()=>$t;function r(e,n){let t=Le==="fr"?e:Cn[Le]?.[e]??e;return n?t.replace(/\{(\w+)\}/g,(i,a)=>a in n?String(n[a]):i):t}var me=e=>Le==="fr"?`${e} h`:`${String(e).padStart(2,"0")}:00`,fe=e=>e===0?r("minuit"):e===12?r("midi"):me(e),Y=(e,n)=>r("{label} : {text}",{label:e,text:n}),b=e=>e;var Sn=new Map,_n=new Map;function Pn(e,n={}){let t=JSON.stringify([e,n]),i=Sn.get(t);return i||Sn.set(t,i=new Intl.DateTimeFormat(e,n)),i}function zn(e,n={}){let t=JSON.stringify([e,n]),i=_n.get(t);return i||_n.set(t,i=new Intl.NumberFormat(e,n)),i}var $=(e,n=1,t=!1)=>zn(ie(),{maximumFractionDigits:n,minimumFractionDigits:t?n:0}).format(e),Xe=e=>e.replace(/(\d) (°C|km\/h|mm|%|hPa)/g,"$1\xA0$2"),ge=e=>`--c:var(--nw-${e})`;var te=e=>e??p,R=e=>o`<span class="nw-label">${e}</span>`;function j(e){return o`<span class="nw-chip" style=${ge(e.theme)} data-entity=${te(e.entity)} role=${e.entity?"button":p} tabindex=${e.entity?0:p}>
    <ha-icon icon=${e.icon}></ha-icon>${e.value?o`<b>${e.value}</b>`:p}${e.label}</span>`}function Ln(e,n=""){return o`<p class=${`nw-bubble ${n}`} data-theme=${e.theme??p} style=${e.theme?ge(e.theme):p}>
    <ha-icon icon=${e.icon}></ha-icon><span class="nw-label">${e.label}</span><b title=${e.text}>${e.text}</b></p>`}function Mn(e,n=""){return o`<p class=${`nw-bubble nw-bubble--alert nw-level${e.level} ${n}`} role="status">
    <ha-icon icon=${e.icon}></ha-icon>${e.label?o`<span class="nw-label">${e.label}</span>`:p}<b title=${e.text}>${e.text}</b></p>`}function we(e){return o`<p class=${`nw-alert nw-level${e.level}`} role="status" title=${e.source} data-entity=${te(e.entity)}>
    <span class="dot"><ha-icon icon=${e.icon}></ha-icon></span><span>${e.label?o`<b>${e.label}<span class="sep"> · </span></b>`:p}${e.text}</span></p>`}var Zi=e=>r("N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO").split(" ")[Math.round((e%360+360)%360/22.5)%16];function xe(e,n,t,i=!1){let a=n===void 0?"":Zi(n),s=i?a?r("Vent du {from} jusqu\u2019\xE0 {speed} km/h",{from:a,speed:e}):r("Vent jusqu\u2019\xE0 {speed} km/h",{speed:e}):a?r("Vent du {from} {speed} km/h",{from:a,speed:e}):r("Vent {speed} km/h",{speed:e});return t===void 0?s:`${s}${r(", rafales {gust} km/h",{gust:t})}`}var et=e=>o`<i class="nw-trend wind" aria-hidden="true" style=${`--r:${Math.round(e+180)}deg`}></i>`;function Re(e,n){return o`<button class="nw-info" type="button" popovertarget=${e} aria-label=${r("Qu\u2019est-ce que : {title} ?",{title:n.title})} @click=${En}></button>
    <div class="nw-pop" id=${e} popover style=${`--nw-example-word:"${r("Exemple")}"`} @toggle=${Xi} @click=${En}><b>${n.title}</b>${n.text}${n.example?o`<div class="ex">${n.example}</div>`:p}</div>`}var En=e=>e.stopPropagation();function Xi(e){let n=e.currentTarget;if(e.newState!=="open")return;let t=n.getRootNode().querySelector(`[popovertarget="${n.id}"]`);if(!t)return;let i=t.getBoundingClientRect();n.style.top=`${Math.max(8,Math.min(i.bottom+8,innerHeight-n.offsetHeight-8))}px`,n.style.left=`${Math.max(8,Math.min(i.left-12,innerWidth-n.offsetWidth-8))}px`}var ea=(e,n,t)=>Re(`src-${e.normalize("NFD").replace(/[^\w]+/g,"-").toLowerCase()}`,{title:n,text:r("Source : {source}",{source:t})});function N(e,n,t,i,a,s={}){return o`<header class="nw-panel-head"><span class="nw-panel-icon" style=${ge(n)}><ha-icon icon=${e}></ha-icon></span>
    <h3><span>${t}</span>${a??(i?ea(s.key??t,t,i):p)}</h3>${s.aside?o`<span class="aside">${s.aside}</span>`:p}${s.end??p}</header>`}var Rn=e=>(...n)=>({_$litDirective$:e,values:n}),tt=class{constructor(n){}get _$AU(){return this._$AM._$AU}_$AT(n,t,i){this._$Ct=n,this._$AM=t,this._$Ci=i}_$AS(n,t){return this.update(n,t)}update(n,t){return this.render(...t)}};var{I:ls}=hn;var ta={},jn=(e,n=ta)=>e._$AH=n;var kt=Rn(class extends tt{constructor(){super(...arguments),this.key=p}render(e,n){return this.key=e,n}update(e,[n,t]){return n!==this.key&&(jn(e),this.key=n),t}});var Wn=5e3,na=e=>`--tone:var(--nw-${"official"in e||"alert"in e&&e.alert?`level${Math.min(3,Math.max(1,e.level))}`:e.theme??(e.level>=2?`level${Math.min(3,e.level)}`:"calm")})`,ae=class extends D{constructor(){super(...arguments);this.points=[];this.index=0;this.leaving=!1}connectedCallback(){super.connectedCallback(),this.leaving=!1,this.timer=setInterval(()=>this.next(),Wn)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.timer),clearTimeout(this.swap)}willUpdate(t){if(!t.has("points"))return;let i=this.points.findIndex(a=>a.text===this.shown);if(i>=0){this.index=i;return}if(this.shown===void 0||this.reduced){this.index=0;return}this.leaving=!0,clearTimeout(this.swap),this.swap=setTimeout(()=>{this.index=0,this.leaving=!1},300)}get reduced(){return matchMedia("(prefers-reduced-motion: reduce)").matches}next(){let t=this.getRootNode().host;if(this.points.length<2||document.hidden||t?.matches(":hover, :focus-within"))return;let i=()=>{this.index=(this.index+1)%this.points.length,this.leaving=!1};if(this.reduced){i();return}this.leaving=!0,this.swap=setTimeout(i,350)}render(){let t=this.points[this.index%Math.max(1,this.points.length)];if(this.shown=t?.text,!t)return p;let i=this.index%this.points.length;return o`<div class="say nw-glass" aria-hidden="true" style=${na(t)}>
      ${kt(i,o`<div class=${`item${this.leaving?" out":""}`}><span class="badge"><ha-icon icon=${t.icon}></ha-icon></span>
        <div class="txt">${t.label?o`<div class="when">${t.label}</div>`:p}<div class="x" title=${t.text}>${t.text}</div></div></div>`)}
      ${this.points.length>1?o`<span class="progress" style=${`--step:${Wn}ms`}>${this.points.map((a,s)=>s===i?kt(`on-${i}`,o`<i class="on"></i>`):o`<i class=${s<i?"done":""}></i>`)}</span>`:p}</div>
      <ul class="sr">${this.points.map(a=>o`<li>${a.label?Y(a.label,a.text):a.text}</li>`)}</ul>`}};ae.styles=[ve,T`
    :host { display:block; min-width:0; color:var(--nw-fg); }
    ha-icon { display:flex; line-height:0; }
    /* The timeline's frame is the charter's glass (.nw-glass): no shadow nor halo. */
    .say { display:flex; align-items:center; gap:12px; padding:12px 14px; box-sizing:border-box; }
    .item { flex:1; min-width:0; display:flex; align-items:center; gap:12px; animation:swap .28s var(--nw-ease) both; transition:opacity .3s, transform .3s; }
    .item.out { opacity:0; transform:translateY(-6px); }
    @keyframes swap { from { opacity:0; transform:translateY(8px); } }
    .badge { display:grid; place-items:center; width:36px; height:36px; flex:none; border-radius:11px; background:color-mix(in oklab, var(--tone) 34%, transparent); }
    .badge ha-icon { --mdc-icon-size:18px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .txt { min-width:0; }
    .when { font-size:var(--nw-fs-label); line-height:14px; letter-spacing:.08em; text-transform:uppercase; font-weight:650; white-space:nowrap; color:var(--nw-fg2); }
    .x { font-size:var(--nw-fs-text); line-height:20px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    /* One bar per point, narrower when there are many: on a phone, eight points never push the tile past its frame. */
    .progress { display:flex; gap:4px; flex:0 1 auto; min-width:0; align-self:flex-start; margin-top:6px; }
    .progress i { position:relative; flex:0 1 16px; min-width:6px; height:3px; border-radius:2px; background:var(--nw-line); overflow:hidden; }
    .progress i.done { background:color-mix(in srgb, var(--nw-fg2) 60%, transparent); }
    .progress i.on::after { content:''; position:absolute; inset:0; background:var(--nw-fg2); transform-origin:left; animation:fill var(--step) linear forwards; animation-play-state:var(--nw-motion, running); }
    @keyframes fill { from { transform:scaleX(0); } }
    @media (prefers-reduced-motion:reduce) { .item { animation:none; transition:none; } .progress i.on::after { animation:none; } }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
  `],k([E({attribute:!1})],ae.prototype,"points",2),k([P()],ae.prototype,"index",2),k([P()],ae.prototype,"leaving",2),ae=k([J("hestia-ticker")],ae);var re=3600,ia=1200,aa=re,qn=18*re,ra=3*re,sa={sunny:"sun","clear-night":"night",partlycloudy:"partly",cloudy:"cloud",fog:"fog",rainy:"rain",pouring:"rain",lightning:"storm","lightning-rainy":"storm",snowy:"snow","snowy-rainy":"snow",hail:"hail",windy:"wind","windy-variant":"wind",exceptional:"cloud"},oa=e=>e.condition==="sunny"&&e.night?"night":sa[e.condition]??"cloud",Fn=fe,je=e=>Math.min(3,Math.max(1,e));function At(e,n,t,i,a){let s=t.filter(m=>m.time!==void 0),l=s[s.length-1],c=Math.max(ra,Math.min(qn,l?l.time+re-i:qn)),d=m=>Math.max(0,Math.min(1,(m-i)/c)),u=(m,v)=>({at:m,clock:v??(m===void 0?"":Fn(new Date(m*1e3).getHours())),now:m===void 0||m<=i+ia}),w=m=>({label:m.label,icon:m.icon,text:m.text,theme:m.theme,alert:m.alert||m.level>=2?je(m.level):void 0,...u(m.at,m.clock)}),f=n.filter(m=>!m.official).map(m=>({label:m.label??r("Maintenant"),icon:m.icon,text:m.text,alert:je(m.level),...u(m.at,m.clock)})),h=a?a.map(w):[...f,...e.map(w)],g=[...h.filter(m=>m.now),...h.filter(m=>!m.now).sort((m,v)=>m.at-v.at)],x=(m,v,A)=>{let M=Math.max(0,...m.map(H=>g[H].alert??0));return{items:m,x:d(v),clock:A,theme:g[m[0]].theme,alert:M?je(M):void 0}},y=g.flatMap((m,v)=>m.now?[v]:[]),S=[];g.forEach((m,v)=>{if(m.now)return;let A=S[S.length-1];A&&m.at-g[A[0]].at<aa?A.push(v):S.push([v])});let O=[...y.length?[x(y,i,r("Maintenant"))]:[],...S.map(m=>x(m,g[m[0]].at,g[m[0]].clock))],C=[];for(let m of s){let v=Math.max(m.time,i),A=Math.min(m.time+re,i+c);if(A<=v)continue;let M=oa(m),H=C[C.length-1];H&&H.kind===M&&(M!=="partly"||H.icon===m.icon)?H.flex+=A-v:C.push({kind:M,icon:m.icon,flex:A-v})}let W=C.reduce((m,v)=>m+v.flex,0);for(let m=C.length-1;m>=0&&C.length>1;m--)C[m].flex>=W*.03||(C[m?m-1:1].flex+=C[m].flex,C.splice(m,1));let z=[{x:0,text:r("Maintenant"),edge:"first"}];for(let m=1;m*3*re<=c+1;m++){let v=i+m*3*re,A=s.find(M=>Math.abs(M.time-v)<=re/2);A&&z.push({x:d(A.time),text:Fn(A.hour),edge:d(A.time)>.97?"last":void 0})}let B=n.filter(m=>m.official),U=s.find(m=>m.hour===0&&m.time>i)?.time,K=B.length?{to:U===void 0?1:d(U),level:je(Math.max(...B.map(m=>m.level)))}:void 0;return{items:g,groups:O,segments:C,marks:z,band:K}}var We=4500,la=9e3,On=300,nt=6,Ct=7,Bn=e=>`--tone:var(--nw-${e.theme??(e.alert?`level${e.alert}`:"calm")})`,da=e=>e.stopPropagation(),G=class extends D{constructor(){super(...arguments);this.points=[];this.alerts=[];this.hours=[];this.index=0;this.paused=!1;this.step=We;this.frise=At([],[],[],0);this.built=0;this.due=0;this.left=We;this.pause=t=>{t.pointerType==="touch"||this.paused||(this.paused=!0,clearTimeout(this.timer),this.left=Math.max(300,this.due-Date.now()))};this.resume=t=>{t.pointerType==="touch"||!this.paused||t.type==="pointerleave"&&this.matches(":focus-within")||(this.paused=!1,this.due=Date.now()+this.left,this.timer=setTimeout(()=>this.next(),this.left))}}connectedCallback(){super.connectedCallback(),this.schedule(We),this.hasUpdated&&this.observe()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timer),clearTimeout(this.leave),this.resize?.disconnect()}willUpdate(t){let i=Date.now()/1e3;if(!t.has("points")&&!t.has("alerts")&&!t.has("hours")&&!t.has("timeline")&&i-this.built<On)return;let a=this.frise.items[this.index]?.text;this.frise=At(this.points,this.alerts,this.hours,i,this.timeline),this.built=i;let s=this.frise.items.findIndex(l=>l.text===a);this.index=s>=0?s:0,this.leaving=void 0}firstUpdated(){this.observe()}updated(){this.layout()}observe(){let t=this.renderRoot.querySelector(".track");!t||typeof ResizeObserver>"u"||(this.resize?.disconnect(),this.resize=new ResizeObserver(()=>this.layout()),this.resize.observe(t))}schedule(t){clearTimeout(this.timer),this.step=t,this.left=t,this.due=Date.now()+t,this.paused||(this.timer=setTimeout(()=>this.next(),t))}next(){Date.now()/1e3-this.built>=On&&this.requestUpdate();let t=this.frise.items.length;if(t<2||document.hidden){this.schedule(We);return}this.show((this.index+1)%t,We)}show(t,i){t!==this.index&&(this.leaving=this.index,this.index=t,clearTimeout(this.leave),this.leave=setTimeout(()=>{this.leaving=void 0},460)),this.schedule(i)}pick(t){let i=t.items.indexOf(this.index);this.show(i<0?t.items[0]:t.items[(i+1)%t.items.length],la)}layout(){let t=this.renderRoot.querySelector(".track"),i=t?.clientWidth;if(!t||!i)return;let a=[...t.querySelectorAll(".pin")];t.classList.remove("compact"),(f=>f.reduce((h,g)=>h+g.offsetWidth+nt,-nt)<=i+2*Ct)(a)||t.classList.add("compact");let l=a.map(f=>f.offsetWidth),c=a.map(f=>Number(f.dataset.x)*i);c.forEach((f,h)=>{c[h]=Math.max(f,l[h]/2-Ct,h?c[h-1]+(l[h-1]+l[h])/2+nt:-1/0)});for(let f=c.length-1;f>=0;f--)c[f]=Math.min(c[f],f===c.length-1?i-l[f]/2+Ct:c[f+1]-(l[f+1]+l[f])/2-nt);a.forEach((f,h)=>{f.style.left=`${Math.round(c[h])}px`;let g=Number(f.dataset.x)*i-c[h],x=l[h]/2-6;f.style.setProperty("--sx",`${Math.round(Math.max(-x,Math.min(x,g)))}px`)}),t.querySelectorAll(".seg").forEach(f=>f.classList.toggle("tight",f.clientWidth<28));let d=[...this.renderRoot.querySelectorAll(".hours span")];if(d.forEach(f=>f.classList.remove("hide")),d.length<3)return;let u=d[d.length-1].getBoundingClientRect(),w=d[0].getBoundingClientRect();for(let f of d.slice(1,-1)){let h=f.getBoundingClientRect();h.left<w.right+18||h.right>u.left-18?f.classList.add("hide"):w=h}}render(){let{items:t,groups:i,segments:a,marks:s,band:l}=this.frise;if(!t.length&&!a.length)return p;let c=d=>d.now||!d.clock?d.label:`${d.label} \xB7 ${d.clock}`;return o`<div class=${`panel nw-glass${this.paused?" paused":""}`} @pointerenter=${this.pause} @pointerleave=${this.resume} @focusin=${this.pause} @focusout=${this.resume}>
      ${t.length?o`<div class="head" aria-hidden="true">
        <div class="say">${t.map((d,u)=>o`<div class=${`item${u===this.index?" on":u===this.leaving?" off":""}${d.alert?" al":""}`}
          style=${`${Bn(d)}${d.alert?`;--al:var(--nw-level${d.alert})`:""}`}>
          <span class="badge"><ha-icon icon=${d.icon}></ha-icon></span><div><div class="when">${c(d)}</div><div class="x" title=${d.text}>${d.text}</div></div></div>`)}</div>
        ${t.length>1?o`<div class="progress" style=${`--step:${this.step}ms`}>${t.map((d,u)=>o`<i class=${u===this.index?"on":u<this.index?"done":""}></i>`)}</div>`:p}
      </div>`:p}
      <div class=${`track${i.length?"":" bare"}`}>
        <div class="chips">${i.map((d,u)=>{let w=d.items.includes(this.index),f=t[w?this.index:d.items[0]],h=d.items;return o`<button type="button" class=${`pin${w?" on":""}${d.alert?" al":""}`} data-x=${d.x}
            style=${`left:${(d.x*100).toFixed(2)}%;--k:${u};${Bn(f)}${d.alert?`;--al:var(--nw-level${d.alert})`:""}`}
            aria-label=${d.items.map(g=>Y(c(t[g]),t[g].text)).join(r(" ; "))} @click=${()=>this.pick(d)} @pointerdown=${da}>
            <span class="chip">${h.map(g=>o`<ha-icon class=${w&&d.items.length>1?g===this.index?"cur":"dim":""} icon=${t[g].icon}></ha-icon>`)}${d.clock===r("Maintenant")?p:o`<span class="clock">${d.clock}</span>`}${d.items.length>1?o`<span class="count">${d.items.length}</span>`:p}</span>
            <span class="stem"></span></button>`})}</div>
        ${l?o`<i class="vigil" style=${`width:${(l.to*100).toFixed(2)}%;--al:var(--nw-level${l.level})`}></i>`:p}
        <div class="lane">${a.length?a.map((d,u)=>o`<span class=${`seg s-${d.kind}`} style=${`flex:${d.flex};--n:${u}`}><ha-icon icon=${d.icon}></ha-icon></span>`):o`<span class="seg s-cloud" style="flex:1"></span>`}</div>
        <span class="needle"></span>
        ${(()=>{let d=i.find(u=>u.items.includes(this.index));return d&&d.x>0?o`<i class="nw-dot mark" style=${`left:${(d.x*100).toFixed(2)}%`}></i>`:p})()}
      </div>
      ${a.length?o`<div class="hours" aria-hidden="true">${s.map(d=>o`<span class=${d.edge??""} style=${`left:${(d.x*100).toFixed(2)}%`}>${d.text}</span>`)}</div>`:p}
      <ul class="sr">${t.map(d=>o`<li>${Y(c(d),d.text)}</li>`)}</ul>
    </div>`}};G.styles=[ve,T`
    :host { display:block; min-width:0; color:var(--nw-fg); }
    ha-icon { display:flex; line-height:0; }
    button { font:inherit; color:inherit; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
    /* Frosted glass: clear enough to see the animated sky through it, blurred enough to keep the text readable.
       A crisp outline and no shadow around it: its edge never looks blurred (2 November). */
    /* Measured on the maquette (3 November): the sentence 63 px high, labels 22 px under it and 10 px above the track,
       the track 18 px high and 16 px inside the frame, the hours 6 px under it. */
    /* The frame is the charter's glass (.nw-glass); only its padding here. */
    .panel { position:relative; padding:0 0 11px; }

    /* The sentence: one point at a time, sliding up. */
    .head { display:flex; align-items:center; gap:12px; padding:12px 14px 11px; }
    /* Clipped for the slide, so it starts 3 px further left: the outline of the badge stays whole. */
    .say { position:relative; flex:1; min-width:0; height:40px; overflow:hidden; margin-left:-3px; }
    .item { position:absolute; inset:0 0 0 3px; display:flex; gap:12px; align-items:center; opacity:0; translate:0 100%; transition:opacity .45s var(--nw-ease), translate .45s var(--nw-ease); }
    .item.on { opacity:1; translate:0 0; } .item.off { opacity:0; translate:0 -100%; }
    .item > div { min-width:0; }
    /* The point on show (2 November): a large tinted icon, the time in small grey capitals, the sentence in bold. */
    .when { font-size:var(--nw-fs-label); line-height:14px; letter-spacing:.08em; text-transform:uppercase; font-weight:650; white-space:nowrap; color:var(--nw-fg2); }
    .x { font-size:var(--nw-fs-text); line-height:20px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .badge { display:grid; place-items:center; width:36px; height:36px; flex:none; border-radius:11px; background:color-mix(in oklab, var(--tone) 34%, transparent); }
    .badge ha-icon { --mdc-icon-size:18px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .item.al .badge { background:color-mix(in oklab, var(--al) 40%, transparent); }
    .item.al .badge ha-icon { color:color-mix(in oklab, var(--al) 30%, var(--nw-fg)); }
    /* One bar per point: the one on show fills while it stays. */
    .progress { display:flex; gap:4px; flex:none; }
    .progress i { position:relative; width:16px; height:3px; border-radius:2px; background:var(--nw-line); overflow:hidden; }
    .progress i.done { background:color-mix(in srgb, var(--nw-fg2) 60%, transparent); }
    .progress i.on::after { content:''; position:absolute; inset:0; background:var(--nw-fg2); transform-origin:left; animation:fill var(--step) linear forwards; }
    .paused .progress i.on::after { animation-play-state:paused; }
    @keyframes fill { from { transform:scaleX(0); } }

    /* The track (« météo incrustée », 2 November): labels raised above it on a long stem, the forecast sky inlaid as segments
       with their pictogram, the dot of now on the left, the official vigilance as a hatched band over it until it ends. */
    .track { position:relative; height:74px; margin:0 16px; }
    .track.bare { height:26px; margin-top:8px; }
    .chips { position:absolute; inset:0 0 auto; height:56px; z-index:1; }
    .pin { position:absolute; top:22px; display:flex; flex-direction:column; align-items:center; translate:-50% 0; border:0; background:none; padding:0; cursor:pointer;
      animation:pop .3s var(--nw-ease) both; animation-delay:calc(120ms + var(--k, 0) * 60ms); }
    @keyframes pop { from { opacity:0; transform:translateY(6px) scale(.92); } }
    .pin:focus-visible { outline:none; } .pin:focus-visible .chip { outline:2px solid var(--nw-accent); outline-offset:2px; }
    /* A label: one pill tinted with its point, its icons (two at most) plain, its time, how many share it. */
    .chip { position:relative; display:flex; gap:4px; align-items:center; padding:3px 8px 3px 6px; border-radius:var(--nw-radius-pill);
      white-space:nowrap; font-size:var(--nw-fs-small); line-height:16px; font-weight:650; font-variant-numeric:tabular-nums;
      background:color-mix(in oklab, var(--tone) 30%, var(--nw-bg)); box-shadow:0 0 0 1px var(--nw-line);
      transition:background .26s var(--nw-ease), transform .26s var(--nw-ease), box-shadow .26s var(--nw-ease); }
    .chip ha-icon { --mdc-icon-size:14px; transition:opacity .26s, transform .26s var(--nw-ease); }
    /* Several points in one label: the one on show, above in the sentence, is larger and lit; the others step back. */
    .chip ha-icon.cur { --mdc-icon-size:17px; color:color-mix(in oklab, var(--tone) 35%, var(--nw-fg)); }
    .chip ha-icon.dim { opacity:.45; }
    /* The stem reaches the track from the label on show only; it grows with the label lifting, so they never part. */
    /* The stem: hidden under the labels at rest; from the label on show it runs into the track. */
    .stem { translate:var(--sx, 0) 0; width:1.5px; height:10px; background:color-mix(in oklab, var(--tone) 70%, var(--nw-fg)); opacity:0; transition:opacity .2s, height .26s var(--nw-ease), margin .26s var(--nw-ease); }
    .pin.on .stem { opacity:1; height:14px; margin-top:-4px; }
    .pin.on .chip { background:color-mix(in oklab, var(--tone) 55%, var(--nw-bg)); transform:translateY(-4px) scale(1.06);
      box-shadow:0 0 0 1px var(--nw-line), 0 4px 10px -4px rgb(0 0 0 / .35); }
    .count { display:grid; place-items:center; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; border-radius:8px;
      font-size:var(--nw-fs-label); font-weight:700; background:var(--nw-fg); color:var(--nw-bg); }
    /* A label holding an alert: the alert's outline, no coloured halo (neutral shadows only, 2 November). */
    /* A label holding an alert keeps the same neutral outline: its icon says it (as the maquette). */
    .lane { position:absolute; left:0; right:0; top:56px; height:18px; display:flex; gap:3px; }
    .track.bare .lane { top:4px; }
    /* Each segment inlaid: a slight relief (light above, shade below), grown from now on arrival. */
    .seg { display:grid; place-items:center; min-width:0; height:100%; overflow:hidden; border-radius:6px; transform-origin:left;
      background:linear-gradient(180deg, color-mix(in oklab, var(--tone) 85%, #fff), color-mix(in oklab, var(--tone) 78%, transparent));
      box-shadow:inset 0 1px 0 rgb(255 255 255 / .35), inset 0 -1px 0 rgb(0 0 0 / .08);
      animation:grow .52s var(--nw-ease) both; animation-delay:calc(var(--n, 0) * 90ms); }
    @keyframes grow { from { transform:scaleX(0); } }
    .seg:first-child { border-radius:9px 6px 6px 9px; } .seg:last-child { border-radius:6px 9px 9px 6px; } .seg:only-child { border-radius:9px; }
    .seg ha-icon { --mdc-icon-size:15px; color:rgb(20 26 45 / .72); }
    .vigil { position:absolute; left:0; top:49px; height:4px; border-radius:3px; pointer-events:none;
      background:repeating-linear-gradient(135deg, var(--al) 0 6px, color-mix(in oklab, var(--al) 55%, transparent) 6px 10px); }
    .seg.tight ha-icon { display:none; }
    .s-sun { --tone:var(--nw-heat); } .s-night { --tone:color-mix(in oklab, var(--nw-pressure) 70%, var(--nw-cold)); }
    .s-partly { --tone:color-mix(in oklab, var(--nw-cold) 60%, var(--nw-heat)); } .s-cloud { --tone:color-mix(in srgb, var(--nw-fg2) 35%, var(--nw-bg)); }
    .s-rain { --tone:var(--nw-rain); } .s-storm { --tone:var(--nw-pressure); } .s-snow { --tone:var(--nw-cold); } .s-wind { --tone:var(--nw-wind); }
    .s-hail { --tone:color-mix(in oklab, var(--nw-cold) 55%, var(--nw-pressure)); } .s-fog { --tone:color-mix(in srgb, var(--nw-fg2) 22%, var(--nw-bg)); }
    .compact .clock { display:none; }
    /* Now: a dot at the start of the track, with a ring that widens slowly. */
    .needle { position:absolute; left:0; top:58px; z-index:2; width:14px; height:14px; margin-left:-7px; border-radius:50%; background:var(--nw-fg); box-shadow:0 0 0 3px var(--nw-bg); }
    .needle::after { content:''; position:absolute; inset:-3px; border-radius:50%; border:2px solid var(--nw-fg);
      animation:ripple 2.4s var(--nw-ease) infinite; animation-play-state:var(--nw-motion, running); }
    /* The value's dot is the charter's (.nw-dot): only where it sits on this track. */
    .mark { top:61px; }
    @keyframes ripple { from { transform:scale(.6); opacity:.9; } to { transform:scale(2.2); opacity:0; } }
    .track.bare .needle { top:6px; }
    .hours { position:relative; height:16px; margin:6px 16px 0; font-size:var(--nw-fs-label); line-height:16px; color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
    .hours span { position:absolute; translate:-50% 0; white-space:nowrap; }
    .hours span.first { translate:0 0; } .hours span.last { translate:-100% 0; } .hours span.hide { visibility:hidden; }
    @media (prefers-reduced-motion:reduce) {
      .item, .chip, .stem { transition:none; } .progress i.on::after, .pin, .seg, .needle::after { animation:none; }
    }
  `],k([E({attribute:!1})],G.prototype,"points",2),k([E({attribute:!1})],G.prototype,"alerts",2),k([E({attribute:!1})],G.prototype,"hours",2),k([E({attribute:!1})],G.prototype,"timeline",2),k([P()],G.prototype,"index",2),k([P()],G.prototype,"leaving",2),k([P()],G.prototype,"paused",2),k([P()],G.prototype,"step",2),G=k([J("hestia-frise")],G);var In=["bulletin","events"];function it(e,n){return e==="page"?r("page m\xE9t\xE9o"):e==="card"?r("carte compl\xE8te"):n?r("replier"):r("d\xE9plier")}function Tt(e,n,t,i=p,a=""){return o`<div class="nw-tile" title=${a||p}>${R(e)}<ha-icon icon=${n}></ha-icon><strong>${t}</strong>${i}</div>`}var St=(e,n=.1)=>e>=n?o`<span class="nw-ink" style=${ge("rain")}>${$(e)} mm</span>`:o`<span class="nw-ink">&nbsp;</span>`;function Dn(e,n,t){if(e===void 0)return o`<span class="tile-wind">&nbsp;</span>`;let i=xe($(e,0),n,t!==void 0&&t>e?$(t,0):void 0);return o`<span class="tile-wind" title=${i} aria-label=${i}>${n===void 0?p:et(n)}${$(e,0)}</span>`}var ca=e=>e.tmin===void 0?"\u2014":e.tmin===e.tmax?`${e.tmin} \xB0C`:`${e.tmin}\u2013${e.tmax} \xB0C`,_t=e=>e.bulletin?.periods.length?o`<div class="block">${R(r("Les prochains moments"))}<div class="moments">${e.bulletin.periods.map(n=>Tt(n.label,n.icon,ca(n),o`<small>${n.phrase}</small>${n.rain>=1?St(n.rain):p}`,n.text))}</div></div>`:p;function Pt(e,n,t,i=r("Pr\xE9visions")){let a=e.hours.slice(0,12).filter(d=>d.temperature!==void 0),s=e.days.slice(0,5);if(!a.length&&!s.length)return p;let l=a.length?s.length?n:"hours":"days",c=d=>u=>{u.stopPropagation(),t(d)};return o`<div class="block"><div class="block-title">${R(i)}
      ${a.length&&s.length?o`<span class="seg" role="group" aria-label=${r("Pr\xE9visions affich\xE9es")}>
        <button type="button" aria-pressed=${l==="hours"} @click=${c("hours")} @pointerdown=${Nn}>${r("Heures")}</button>
        <button type="button" aria-pressed=${l==="days"} @click=${c("days")} @pointerdown=${Nn}>${r("Jours")}</button></span>`:p}</div>
    ${l==="hours"?o`<div class="hours">${a.map(d=>Tt(me(d.hour),d.icon,`${$(d.temperature,0)}\xB0`,o`${St(d.precipitation)}${Dn(d.wind,d.bearing,d.gust)}`,d.conditionLabel))}</div>`:o`<div class="days">${s.map(d=>Tt(d.label,d.icon,d.high===void 0?"\u2014":`${d.high}\xB0`,o`<span class="lo">${d.low===void 0?"":`${d.low}\xB0`}</span>${St(d.rain)}${Dn(d.wind,d.bearing,d.gust)}`,d.conditionLabel))}</div>`}</div>`}var Nn=e=>e.stopPropagation();function pa(e){let n=e.days.find(i=>i.today);if(!n||n.low===void 0&&n.high===void 0)return p;let t=r("Pr\xE9vu aujourd\u2019hui : {range}",{range:[n.low===void 0?"":r("mini {t} \xB0C",{t:n.low}),n.high===void 0?"":r("maxi {t} \xB0C",{t:n.high})].filter(Boolean).join(", ")});return o`<span class="range" title=${t} aria-label=${t}>${n.low===void 0||n.high===void 0?o`<span>${n.low??n.high}°</span>`:o`<span>${n.low} – ${n.high}°</span>`}</span>`}function zt(e,n,t=p,i=p,a="opaque"){let s=e.now,l=e.days.find(d=>d.today),c=d=>d===void 0?void 0:`${d}`;return o`<div class=${`nw-now${n&&a!=="none"?` nw-glass${a==="clear"?"":" nw-glass-solid"}`:""}`}>${i}${n?R(r("En ce moment")):p}
    <span class="cond" data-entity=${s.conditionEntity??p} title=${s.source}><ha-icon icon=${s.icon}></ha-icon>${s.label}</span>
    ${s.temperature===void 0?o`<span class="cond">${r("Temp\xE9rature indisponible")}</span>`:n?o`<div data-entity=${s.temperatureEntity??p} title=${s.temperatureSource}>${$n({value:$(s.temperature),unit:"\xB0C",low:c(l?.low),high:c(l?.high),label:r("{source} : {t} degr\xE9s Celsius",{source:s.temperatureSource,t:$(s.temperature)}),more:t===p?void 0:t})}</div>`:o`<span class="temp" data-entity=${s.temperatureEntity??p} title=${s.temperatureSource} aria-label=${r("{source} : {t} degr\xE9s Celsius",{source:s.temperatureSource,t:$(s.temperature)})}>${$(s.temperature)}<small>°C</small></span>`}
    ${n?p:pa(e)}${n&&s.temperature!==void 0?p:t}</div>`}var Et=e=>e.points.length||e.alerts.length||e.hours.length||e.timeline?.length?o`<div class="nw-events">${R(r("\xC9v\xE9nements"))}<hestia-frise .points=${e.points} .alerts=${e.alerts} .hours=${e.hours} .timeline=${e.timeline}></hestia-frise></div>`:p;function Hn(e,n,t){let i=e.alerts.filter(h=>h.official),[a,...s]=i,c=[...[...e.alerts.filter(h=>!h.official),...s].map(h=>({...h,alert:!0})),...e.points],d=e.bulletin?.summary,u=[["tap",t.tapTarget],["hold",t.holdTarget]].filter(([,h])=>h!=="none"),w=t.tapTarget==="toggle"||t.holdTarget==="toggle",f=u.filter(([h,g])=>h!=="tap"||g!=="toggle");return o`<div class=${`nw-tilecard${t.open?" open":""}${w?"":" fixed"}${e.now.darkSky?" dark-sky":""}${c.length?"":" quiet"}`}
      role="button" tabindex="0" aria-expanded=${w?t.open:p}
      aria-label=${`${e.location?r("M\xE9t\xE9o \xE0 {place}",{place:e.location}):r("M\xE9t\xE9o")}${u.length?` : ${u.map(([h,g])=>h==="tap"?r("appui pour {goal}",{goal:it(g,t.open)}):r("appui long pour {goal}",{goal:it(g,t.open)})).join(", ")}`:""}`}>
    <div class="sky" aria-hidden="true">${n}</div><div class="veil" aria-hidden="true"></div><i class="press-ring" aria-hidden="true"></i>
    <div class="top">
      <div class="meta">${e.location?o`<span class="place">${e.location}</span>`:p}${a?we(a):p}
        ${s.map(h=>o`<div class="reveal"><div>${we(h)}</div></div>`)}</div>
      <div class="brief"><div><div>${c.length?o`<hestia-ticker .points=${c}></hestia-ticker>`:p}</div></div></div>
      ${zt(e,!1)}
    </div>
    <div class="grabber" aria-hidden="true"><i></i></div>
    <div class="more" ?inert=${!t.open}><div><div class="more-in">
      ${t.blocks.map(h=>h==="bulletin"?d?o`<div class="bulletin">${R(r("Bulletin du jour"))}<p class="nw-bulletin">${Xe(d)}</p></div>`:p:h==="events"?Et(e):h==="moments"?_t(e):Pt(e,t.tab,t.onTab))}
      <div class="foot"><span>${e.forecastSource}${e.now.temperatureSource!==e.forecastSource?` \xB7 ${e.now.temperatureSource.toLowerCase()}`:""}</span>
        ${f.length?o`<span>${f.map(([h,g])=>h==="tap"?r("Appui : {goal}",{goal:it(g,!0)}):r("Appui long : {goal}",{goal:it(g,!0)})).join(" \xB7 ")}</span>`:p}</div>
    </div></div></div>
  </div>`}var Vn=T`
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
  .brief > div { display:grid; grid-template-rows:1fr; grid-template-columns:minmax(0, 1fr); transition:grid-template-rows var(--nw-expand) var(--nw-ease), opacity .25s; }
  /* Its column never grows past the tile: the ticker's sentence shortens instead (3 November, a phone 375 px wide). */
  .brief > div > div { min-height:0; min-width:0; overflow:clip; overflow-clip-margin:18px; }
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
`;function ua(e){return{move:i=>{let a=i.currentTarget,s=a.getBoundingClientRect(),l=e.length,c=Math.round(Math.min(1,Math.max(0,(i.clientX-s.left)/s.width))*(l-1)),d=e[c],u=c/(l-1)*s.width,w=a.querySelector(".fc-scrub"),f=a.querySelector(".fc-tip");!w||!f||(w.style.left=`${u}px`,f.textContent=[c?me(d.hour):r("Maintenant"),d.temperature===void 0?"":`${$(d.temperature,0)} \xB0C`,d.precipitation>=.1?`${$(d.precipitation)} mm`:"",d.wind===void 0?"":xe($(d.wind,0),d.bearing)].filter(Boolean).join(" \xB7 "),f.style.left=`${Math.min(s.width-f.offsetWidth/2,Math.max(f.offsetWidth/2,u))}px`,a.classList.add("scrubbing"))},leave:i=>i.currentTarget.classList.remove("scrubbing")}}function Lt(e,n,t,i){let a=e.map((m,v)=>({h:m,i:v})).filter(m=>m.h.temperature!==void 0);if(a.length<3)return p;let s=e.length,l=100/(s-1),c=m=>m*l,d=a.map(m=>m.h.temperature),u=Math.min(...d)-1.5,w=Math.max(...d)+1.5,f=m=>(1-(m-u)/(w-u))*64+14,h=a.map(m=>[c(m.i),f(m.h.temperature)]),g=h.map(([m,v],A)=>A?`C${h[A-1][0]+(m-h[A-1][0])/2} ${h[A-1][1]} ${h[A-1][0]+(m-h[A-1][0])/2} ${v} ${m} ${v}`:`M${m} ${v}`).join(" "),x=a.reduce((m,v)=>v.h.temperature>m.h.temperature?v:m),y=a.reduce((m,v)=>v.h.temperature<m.h.temperature?v:m),S=Math.max(2,...e.map(m=>m.precipitation)),O=e.some(m=>m.precipitation>=.1),C=[];e.forEach((m,v)=>{if(!m.night)return;let A=C.at(-1);A&&A[1]===v-1?A[1]=v:C.push([v,v])});let W=e.map((m,v)=>v).filter(m=>m%3===0),z=m=>{let v=f(m.h.temperature);return o`<span class=${`pill${v<30?" low":""}`} style=${`left:${Math.min(94,Math.max(6,c(m.i)))}%;top:${v}%`}>${$(m.h.temperature,0)}°</span>`},B=`${i}-fs`,U=`${i}-fa`,K=ua(e);return o`<section class="nw-panel" aria-label=${r("18 prochaines heures")}>${N("mdi:thermometer","wind",r("18 prochaines heures"),n)}
    <div class="fc" @pointermove=${K.move} @pointerdown=${K.move} @pointerleave=${K.leave}>
      <div class="fc-plot" role="img" aria-label=${`${r("Temp\xE9ratures de {low} \xE0 {high} \xB0C",{low:$(y.h.temperature,0),high:$(x.h.temperature,0)})}${O?r(", pluie jusqu\u2019\xE0 {mm} mm par heure",{mm:$(Math.max(...e.map(m=>m.precipitation)))}):r(", pas de pluie pr\xE9vue")}`}>
        ${C.map(([m,v])=>{let A=Math.max(0,c(m)-l/2),M=Math.min(100,c(v)+l/2);return o`<i class="fc-night" style=${`left:${A}%;width:${M-A}%`}></i>`})}
        ${e.map((m,v)=>m.precipitation>=.1?o`<i class="fc-bar" style=${`left:calc(${c(v)}% - 5px);height:${Math.max(4,m.precipitation/S*20)}%`}></i>`:p)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>
          <linearGradient id=${B} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)"/><stop offset=".5" stop-color="var(--nw-calm)"/><stop offset="1" stop-color="var(--nw-cold)"/></linearGradient>
          <linearGradient id=${U} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)" stop-opacity=".22"/><stop offset="1" stop-color="var(--nw-cold)" stop-opacity="0"/></linearGradient></defs>
          ${F`<path d=${`${g} L${h.at(-1)[0]} 82 L${h[0][0]} 82Z`} fill=${`url(#${U})`}/><path class="fc-line" d=${g} stroke=${`url(#${B})`}/>`}</svg>
        <i class="fc-dot" style=${`left:${h[0][0]}%;top:${h[0][1]}%`}></i>
        ${z(x)}${y.i!==x.i&&$(y.h.temperature,0)!==$(x.h.temperature,0)?z(y):p}
      </div>
      <i class="fc-scrub"></i><span class="fc-tip"></span>
      <div class="fc-hours" data-entity=${t}>${W.map(m=>{let v=e[m];return o`<div style=${`left:${c(m)}%`} title=${v.conditionLabel}><span>${m?me(v.hour):r("Maint.")}</span><ha-icon icon=${v.icon}></ha-icon>
          ${v.wind===void 0?p:o`<span class="fc-wind" title=${xe($(v.wind,0),v.bearing,v.gust!==void 0&&v.gust>v.wind?$(v.gust,0):void 0)}>${v.bearing===void 0?p:et(v.bearing)}${$(v.wind,0)}</span>`}</div>`})}</div>
      ${e.some(m=>m.wind!==void 0)?o`<p class="fc-unit">${r("Vent en km/h")}</p>`:p}
    </div>
    <p class="fc-hint">${r("Glissez le doigt sur la courbe pour lire chaque heure.")}</p>
  </section>`}function ha(e){let n=e.filter(c=>c.temperature!==void 0);if(n.length<3)return p;let t=n.map(c=>c.temperature),i=Math.min(...t)-1,a=Math.max(...t)+1,s=n.map((c,d)=>[d/(n.length-1)*300,42-(c.temperature-i)/(a-i)*34]),l=s.map(([c,d],u)=>u?`C${(s[u-1][0]+c)/2} ${s[u-1][1]} ${(s[u-1][0]+c)/2} ${d} ${c} ${d}`:`M${c} ${d}`).join(" ");return o`<svg class="dx-curve" viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden="true">${F`<path d=${l} fill="none" stroke="var(--nw-heat)" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`}</svg>
    <div class="dx-axis">${[n[0],n[Math.floor(n.length/2)],n.at(-1)].map(c=>o`<span>${me(c.hour)}</span>`)}</div>`}function Mt(e,n,t,i=[],a){if(!e.length)return p;let s=e.flatMap(h=>h.low??h.high??[]),l=e.flatMap(h=>h.high??h.low??[]),c=Math.min(...s),d=Math.max(...l,c+1),u=h=>(h-c)/(d-c)*100,w=Math.max(0,e.findIndex(h=>h.today)),f=h=>{if(h.low===void 0||h.high===void 0)return p;let g=u(h.low),x=Math.max(2,u(h.high)-u(h.low)),y=h.today&&a!==void 0&&h.high>h.low?Math.min(100,Math.max(0,(a-h.low)/(h.high-h.low)*100)):void 0;return o`<i style=${`left:${g}%;width:${x}%;background-size:${(100/x*100).toFixed(1)}% 100%;background-position:${x>=100?0:(g/(100-x)*100).toFixed(1)}% 0`}>${y===void 0?p:o`<b style=${`left:${y}%`}></b>`}</i>`};return o`<section class="nw-panel" aria-label=${r("{n} prochains jours",{n:e.length})}>${N("mdi:white-balance-sunny","wind",r("{n} prochains jours",{n:e.length}),n)}
    <div class="wk">${e.map((h,g)=>o`<details>
      <summary aria-label=${`${h.label} : ${h.conditionLabel}`}><span class=${`day${h.today?" today":""}`}>${h.label}</span>
        <ha-icon icon=${h.icon} title=${h.conditionLabel}></ha-icon>
        <span class="rain">${h.rain>=.1?o`<ha-icon icon="mdi:water-outline"></ha-icon>${$(h.rain)} mm`:""}</span>
        <span class="lo">${h.low===void 0?"":`${h.low}\xB0`}</span>
        <span class="track">${f(h)}</span>
        <span class="hi">${h.high===void 0?"\u2014":`${h.high}\xB0`}</span>
        <i class="nw-chev"></i></summary>
      <div class="dx">${ha(i.filter(x=>x.day===g-w))}
        <p>${[h.conditionLabel,h.wind===void 0?"":xe(h.wind,h.bearing,h.gust!==void 0&&h.gust>h.wind?h.gust:void 0,!0),h.rain>=.1?Y(r("Pluie"),`${$(h.rain)} mm`):""].filter(Boolean).join(" \xB7 ")}</p></div>
    </details>`)}</div>
    <p class="fc-hint">${r("Touchez un jour pour voir son d\xE9tail.")}</p>
  </section>`}function Un(e,n,t,i,a=["hours","days","air"]){let s=a.map(c=>c==="hours"?Lt(e.hours,e.provider,n,t):c==="days"?Mt(e.days,e.provider,n,e.hours,e.now.temperature):p).filter(c=>c!==p),l=a.some(c=>c!=="air");return o`${s.length?o`<div class=${`panels${s.length===1?" single":""}`}>${s}</div>`:l?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:p}${a.includes("air")?i:p}`}var Kn=T`
  /* Hours and days one under the other, full width (2 November, as the maquette). */
  .panels { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; align-items:stretch; }
  .fc-hint { margin:0; text-align:center; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  /* 18 hours */
  .fc { position:relative; display:grid; grid-template-rows:150px auto; gap:8px; touch-action:pan-y; cursor:crosshair; }
  .fc-plot { position:relative; }
  .fc-night { position:absolute; top:0; bottom:18%; background:color-mix(in srgb, var(--nw-fg) 5%, transparent); }
  .fc-plot svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .fc-line { fill:none; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
  .fc-bar { position:absolute; bottom:0; width:10px; border-radius:3px; background:var(--nw-rain); }
  .fc-dot { position:absolute; width:10px; height:10px; margin:-5px 0 0 -5px; box-sizing:border-box; border-radius:50%; background:var(--nw-bg); border:2px solid var(--nw-fg); }
  .fc-scrub { position:absolute; top:0; height:150px; width:2px; margin-left:-1px; background:var(--nw-fg); opacity:0; transition:opacity .15s; pointer-events:none; }
  .fc-tip { position:absolute; top:-6px; translate:-50% 0; white-space:nowrap; font-size:var(--nw-fs-small); font-weight:650; padding:4px 9px; border-radius:10px;
    background:var(--nw-fg); color:var(--nw-bg); pointer-events:none; opacity:0; transition:opacity .15s; }
  .fc.scrubbing .fc-scrub { opacity:.8; } .fc.scrubbing .fc-tip { opacity:1; }
  /* Each tick sits exactly under its point of the curve: the hour, then its sky. */
  .fc-hours { position:relative; height:56px; }
  .fc-wind { display:inline-flex; align-items:center; gap:3px; margin-top:2px; font-size:var(--nw-fs-label); color:var(--nw-fg2); white-space:nowrap; }
  .fc-unit { margin:0; text-align:right; font-size:var(--nw-fs-label); color:var(--nw-fg2); }
  .fc-hours > div { position:absolute; top:0; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:2px;
    font-size:var(--nw-fs-label); color:var(--nw-fg2); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .fc-hours > div:first-child { transform:none; align-items:flex-start; }
  .fc-hours > div:last-child:not(:first-child) { transform:translateX(-100%); align-items:flex-end; }
  .fc-hours ha-icon { --mdc-icon-size:15px; }
  /* 7 days: one row each, a bar on the week's scale, a tap opens the day. */
  .wk { display:grid; }
  .wk details + details { border-top:1px solid color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .wk summary { display:grid; grid-template-columns:44px 22px 72px 28px minmax(40px,1fr) 28px 14px; align-items:center; gap:8px; padding:8px 2px;
    list-style:none; cursor:pointer; font-size:var(--nw-fs-text); font-variant-numeric:tabular-nums; }
  .wk summary::-webkit-details-marker { display:none; }
  .wk .day { font-weight:650; }
  .wk .day.today { color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); }
  .wk summary > ha-icon { --mdc-icon-size:20px; color:var(--nw-fg2); }
  .wk .lo { color:var(--nw-fg2); text-align:right; } .wk .hi { font-weight:650; }
  .wk .rain { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; font-size:var(--nw-fs-small); color:color-mix(in oklab, var(--nw-rain) 45%, var(--nw-fg)); } /* the charter's rain, enough of the text in it to read on a light card */
  .wk .rain ha-icon { --mdc-icon-size:13px; }
  .wk .track { position:relative; height:6px; border-radius:9px; background:color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .wk .track > i { position:absolute; top:0; bottom:0; border-radius:9px;
    background-image:linear-gradient(90deg, var(--nw-cold), var(--nw-calm) 45%, var(--nw-level2) 75%, var(--nw-heat)); background-repeat:no-repeat; }
  .wk .track b { position:absolute; top:50%; width:10px; height:10px; margin:-5px 0 0 -5px; box-sizing:border-box; border-radius:50%; background:var(--nw-bg); box-shadow:0 0 0 2px var(--nw-fg); }
  .wk .dx { padding:0 2px 10px; }
  .wk .dx p { margin:6px 0 0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .dx-curve { display:block; width:100%; height:46px; overflow:visible; }
  .dx-axis { display:flex; justify-content:space-between; font-size:var(--nw-fs-label); color:var(--nw-fg2); }
  @container (max-width:420px) { .wk summary { grid-template-columns:34px 18px 66px 24px minmax(30px,1fr) 26px 12px; gap:5px; } .wk .rain { font-size:var(--nw-fs-label); } }
  @media (prefers-reduced-motion:reduce) { .fc-scrub, .fc-tip { transition:none; } }
`;function Gn(e,n){let t=e.now,i=e.alerts.find(s=>s.official)??e.alerts[0],a=e.location?r("M\xE9t\xE9o \xE0 {place}",{place:e.location}):r("M\xE9t\xE9o");return o`<div class=${`nw-mini${n==="none"?" still":""}`} role=${n==="none"?"group":"button"} tabindex=${n==="none"?-1:0}
      aria-label=${n==="none"?a:Y(a,n==="page"?r("appui pour la page m\xE9t\xE9o"):r("appui pour la carte compl\xE8te"))}>
    <ha-icon class="mini-icon" icon=${t.icon}></ha-icon>
    <span class="mini-temp">${t.temperature===void 0?"\u2014":$(t.temperature)}<small>°C</small></span>
    <span class="mini-text"><b>${t.label}</b>${e.location?o`<span>${e.location}</span>`:p}</span>
    ${i?we(i):p}
  </div>`}function Rt(e){return{alerts:e.alerts,points:e.points.filter(n=>n.level>=2&&n.group!=="official")}}function Jn(e,n){let{alerts:t,points:i}=Rt(e);return!t.length&&!i.length?n?o`<div class="nw-alertcard quiet-card"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><b>${r("Aucune alerte en ce moment.")}</b> ${r("Cette carte reste cach\xE9e tant que tout est calme.")}</span></div>`:p:o`<div class="nw-alertcard" role="button" tabindex="0" aria-label=${r("Alertes m\xE9t\xE9o : appui pour la carte compl\xE8te")}>
    ${e.location?o`<span class="place">${e.location}</span>`:p}
    ${t.map(a=>Mn(a))}${i.map(a=>Ln(a))}
  </div>`}function Qn(e,n,t,i,a,s=["hours","days"]){let l=s.includes("hours")&&e.hours.some(f=>f.temperature!==void 0),c=s.includes("days")&&e.days.length>0,d=l?c?n:"hours":"days",u=f=>h=>{h.stopPropagation(),t(f)},w=!l&&!c?p:d==="hours"?Lt(e.hours,e.provider,i,a):Mt(e.days,e.provider,i,e.hours,e.now.temperature);return o`<div class="nw-forecastcard">
    <div class="fcard-head"><span class="fcard-title"><b>${r("Pr\xE9visions")}</b>${e.location?o`<span>${e.location}</span>`:p}</span>
      ${l&&c?o`<span class="seg" role="group" aria-label=${r("Pr\xE9visions affich\xE9es")}>
        <button type="button" aria-pressed=${d==="hours"} @click=${u("hours")}>${r("Heures")}</button>
        <button type="button" aria-pressed=${d==="days"} @click=${u("days")}>${r("Jours")}</button></span>`:p}</div>
    ${w===p?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:w}
  </div>`}function jt(e){let n=e.hours,t=a=>n.slice(0,a).reduce((s,l)=>s+(l.precipitation??0),0),i=n.find(a=>a.precipitation>=.3);return{hour:t(1),six:t(6),next:i?fe(i.hour):void 0}}function Yn(e){let n=jt(e),t=e.hours.length?n.six<.1?o`<div class="nw-chips">${j({theme:"calm",icon:"mdi:weather-partly-cloudy",label:n.next?r("Pas de pluie avant {hour}",{hour:n.next}):r("Pas de pluie pr\xE9vue d\u2019ici 18 h")})}</div>`:o`<div class="nw-chips">${j({theme:"rain",icon:"mdi:timer-sand",value:`${$(n.hour)} mm`,label:r("dans l\u2019heure")})}
        ${j({theme:"rain",icon:"mdi:weather-pouring",value:`${$(n.six)} mm`,label:r("sur 6 h")})}
        ${n.next&&n.hour<.1?j({theme:"rain",icon:"mdi:clock-outline",label:r("\xE0 partir de {hour}",{hour:n.next})}):p}</div>`:o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`;return o`<div class="rain-ahead">${R(r("\xC0 venir"))}${t}</div>`}function ma(e){let n=e.hours.slice(0,6),t=a=>a.reduce((s,l)=>l===void 0?s:Math.max(s??l,l),void 0),i=n.find(a=>(a.wind??0)>=30||(a.gust??0)>=40);return{wind:t(n.map(a=>a.wind)),gust:t(n.map(a=>a.gust)),strong:i?fe(i.hour):void 0}}function Zn(e){let n=ma(e),t=n.strong?"wind":"calm",i=n.wind===void 0&&n.gust===void 0?o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`:o`<div class="nw-chips">${n.wind===void 0?p:j({theme:t,icon:"mdi:weather-windy",value:`${$(n.wind,0)} km/h`,label:r("au plus sur 6 h")})}
        ${n.gust===void 0?p:j({theme:t,icon:"mdi:weather-windy-variant",value:`${$(n.gust,0)} km/h`,label:r("en rafales")})}
        ${n.strong?j({theme:"wind",icon:"mdi:clock-outline",label:r("vent fort \xE0 partir de {hour}",{hour:n.strong})}):p}</div>`;return o`<div class="rain-ahead">${R(r("\xC0 venir"))}${i}</div>`}function fa(e){let n=e.hours.slice(0,7).filter(a=>a.pressure!==void 0);if(n.length<2)return;let t=n[0],i=n[n.length-1];return{change:i.pressure-t.pressure,last:i.pressure,hour:fe(i.hour)}}function Xn(e,n=!1){let t=fa(e);if(!t&&!n)return p;let i=s=>`${s>0?"+":s<0?"\u2212":""}${$(Math.abs(s))} hPa`,a=t?o`<div class="nw-chips">${j({theme:Math.abs(t.change)>=4?"pressure":"calm",icon:"mdi:gauge",value:Math.abs(t.change)<1?void 0:i(t.change),label:Math.abs(t.change)<1?r("Pression stable sur 6 h"):r("sur 6 h")})}
        ${j({theme:"pressure",icon:"mdi:gauge",value:`${$(t.last,0)} hPa`,label:r("vers {hour}",{hour:t.hour})})}</div>`:o`<p class="nw-empty">${r("Votre fournisseur m\xE9t\xE9o ne pr\xE9voit pas la pression.")}</p>`;return o`<div class="rain-ahead">${R(r("\xC0 venir"))}${a}</div>`}var ga=["lightning","lightning-rainy","hail"];function ei(e){let n=e.hours.slice(0,6).find(i=>ga.includes(i.condition)),t=e.hours.length?o`<div class="nw-chips">${n?j({theme:"level2",icon:"mdi:weather-lightning",label:r("Orage pr\xE9vu vers {hour}",{hour:fe(n.hour)})}):j({theme:"calm",icon:"mdi:weather-partly-cloudy",label:r("Pas d\u2019orage pr\xE9vu d\u2019ici 6 h")})}</div>`:o`<p class="nw-empty">${r("Pr\xE9visions indisponibles pour le moment.")}</p>`;return o`<div class="rain-ahead">${R(r("\xC0 venir"))}${t}</div>`}var ti=T`
  .nw-mini { display:flex; align-items:center; gap:10px; padding:10px 14px; min-height:56px; box-sizing:border-box; cursor:pointer; color:var(--nw-fg); }
  .nw-mini.still { cursor:default; }
  .nw-mini:focus-visible, .nw-alertcard:focus-visible { outline:2px solid var(--nw-accent); outline-offset:-2px; }
  .mini-icon { --mdc-icon-size:30px; color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); flex:none; }
  .mini-temp { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-.6px; white-space:nowrap; line-height:1; }
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
`;var at={6:["calm","calm","level1","level2","level3","pressure"],4:["calm","level1","level2","level3"]},qe=(e,n)=>e&&!e.stale&&e.value!==void 0&&e.value<=n&&(n!==6||e.value>=1)?e.value:void 0;function wa(e,n){let t=qe(e,n),i=at[n]??at[6],a=163.4,s=t===void 0?"transparent":`var(--nw-${i[Math.max(0,Math.min(i.length-1,t-(n===6?1:0)))]})`,l=t===void 0?0:Math.max(.04,t/n);return o`<svg class="disc" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="none" stroke="color-mix(in oklab,var(--nw-fg) 8%,transparent)" stroke-width="7"/>
    ${F`<circle cx="32" cy="32" r="26" fill="none" stroke=${s} stroke-width="7" stroke-linecap="round" stroke-dasharray=${`${(l*a).toFixed(1)} ${a}`} transform="rotate(-90 32 32)"/>`}
    <text x="32" y="38" text-anchor="middle" style="font-size:var(--nw-fs-title)" font-weight="300" fill="currentColor">${t??"\u2013"}</text></svg>`}function ni(e,n){let t=at[n]??at[6],i=e.details.map(a=>{let s=qe(a.reading,n),l=s===void 0?"transparent":`var(--nw-${t[Math.max(0,Math.min(t.length-1,s-(n===6?1:0)))]})`,c=ba(a),d=c.charAt(0).toLocaleLowerCase(ie())+c.slice(1);return o`<div data-entity=${a.reading.entityId}><span>${a.label}</span><i><b style=${`width:${s?Math.max(6,s/n*100):0}%;--c:${l}`}></b></i><span>${d}</span></div>`});return i.length?o`<div class="aq-bars">${i}</div>`:p}function ba(e){let n=e.reading,t=e.concentration,i=s=>s.value===void 0?r("concentration indisponible"):`${$(s.value,2)}${s.unit?` ${s.unit}`:""}`;return`${n.unit!==void 0?i(n):`${n.label}${t?` \xB7 ${i(t)}`:""}`}${n.stale?` \xB7 ${r("donn\xE9es anciennes")}`:""}`}function rt(e,n=p){let t=e.kind==="air",i=e.primary,a=e.scale??6,s=qe(i,a),l=a===6,c=e.source??(l?"Atmo France":"Polleninformation"),d=e.worse?qe(e.worse.reading,a)??0:0,u=!t&&l&&e.tomorrow&&!i?.stale&&i?.unavailableReason==="no_index",w=!t&&l&&e.details.some(g=>g.concentration?.value===0&&qe(g.reading,a)===void 0),f=!t&&e.details.length>0,h=u?r("Pr\xE9vision non disponible"):i?i.stale?r("Donn\xE9es anciennes"):i.value===7?r("\xC9v\xE9nement signal\xE9"):i.label:r("Indice non configur\xE9");return o`<section class="nw-panel" aria-label=${t?r(e.tomorrow?"Air ext\xE9rieur demain":"Air ext\xE9rieur aujourd\u2019hui"):r(e.tomorrow?"Pollens demain":"Pollens aujourd\u2019hui")}>
    ${N(t?"mdi:air-filter":"mdi:flower-pollen-outline","calm",t?r("Air ext\xE9rieur"):r("Pollens"),e.updated?`${c} \xB7 ${l&&!e.source?r("Publication Atmo : {date}.",{date:e.updated}):r("Mise \xE0 jour {source} : {date}.",{source:c,date:e.updated})}`:c,void 0,{key:`${e.kind}-${e.tomorrow}`,end:n})}
    ${n!==p?e.zone?o`<p class="nw-sub">${e.zone}</p>`:p:o`<p class="nw-sub">${e.tomorrow?r("Demain"):r("Aujourd\u2019hui")}${e.zone?` \xB7 ${e.zone}`:""}</p>`}
    <div class=${`aq${f?" pollen":""}`}><div class="aq-main" data-entity=${i?.entityId??p} role=${i?"button":p} tabindex=${i?0:p}>${wa(i,a)}
      <div class="txt"><strong>${h}</strong>
        <small>${s!==void 0?r("Niveau {value} sur {scale}",{value:s,scale:a}):i?.value===7&&l?r("Code 7 \xB7 hors \xE9chelle"):u?r("Indice pollen non fourni"):r("Niveau indisponible")}</small></div></div>
      ${f?ni(e,a):p}</div>${f?p:ni(e,a)}
    ${u?o`<p class="availability-note">${r("Atmo France ne fournit pas d\u2019indice pollen exploitable pour demain \xE0 cet endroit.")}</p>`:p}
    ${e.worse?o`<div class="nw-chips">${j({theme:`level${Math.min(3,Math.max(1,d-(l?2:1)))}`,icon:"mdi:alert-circle-outline",value:e.worse.label,label:e.worse.reading.label.toLowerCase(),entity:e.worse.reading.entityId})}</div>`:p}
    ${w?o`<p class="availability-note">${r("Une concentration \xE0 0 peut \xEAtre une valeur r\xE9elle ou remplacer une donn\xE9e manquante chez Atmo France. Elle ne permet pas, \xE0 elle seule, de conclure \xE0 une absence de pollen.")}</p>`:p}
    ${e.stale?o`<p class="availability-note">${r("Certaines donn\xE9es sont anciennes : \xE0 v\xE9rifier dans l\u2019int\xE9gration.")}</p>`:p}
  </section>`}var ii=e=>e.length?o`<div class="panels-two">${e.map(n=>rt(n))}</div>`:p,Wt=e=>e.stopPropagation();function ai(e,n){let t=["air","pollen"].flatMap(i=>{let a=e.today.find(u=>u.kind===i),s=e.tomorrow.find(u=>u.kind===i),l=n.tomorrow[i]&&s?s:a??s;if(!l)return[];let c=u=>w=>{Wt(w),n.onDay(i,u)},d=a&&s?o`<span class="seg air-days" role="group" aria-label=${r("Jour affich\xE9")}>
      <button type="button" aria-pressed=${!l.tomorrow} @click=${c(!1)} @pointerdown=${Wt}>${r("Aujourd\u2019hui")}</button>
      <button type="button" aria-pressed=${l.tomorrow} @click=${c(!0)} @pointerdown=${Wt}>${r("Demain")}</button></span>`:p;return[rt(l,d)]});return t.length?o`<div class="panels-two">${t}</div>`:p}var ri=T`
  .panels-two { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; align-items:stretch; }
  .panels-two > :only-child { grid-column:1/-1; }
  @container (max-width:640px) { .panels-two { grid-template-columns:minmax(0,1fr); } }
  .availability-note { color:var(--nw-fg2); font-size:var(--nw-fs-small); line-height:1.5; }
  .air-days { margin-left:auto; }
  /* Air: the ring and its word, then the pollutants' bars under them. Pollens: the ring beside the species' bars. */
  .aq.pollen { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:16px; }
  .aq-main { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:16px; }
  .aq.pollen .aq-main { grid-template-columns:auto; }
  .aq.pollen .aq-main .txt { display:none; }
  .aq .disc { width:64px; height:64px; }
  .aq .txt { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .aq strong { font-size:var(--nw-fs-title); font-weight:650; }
  .aq small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .aq-bars { display:grid; gap:6px; min-width:0; }
  .aq-bars > div { display:grid; grid-template-columns:minmax(56px,auto) minmax(40px,1fr) auto; align-items:center; gap:8px; font-size:var(--nw-fs-text); }
  .aq-bars i { position:relative; display:block; height:5px; border-radius:9px; overflow:hidden; background:color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .aq-bars b { position:absolute; inset:0 auto 0 0; border-radius:9px; background:var(--c); }
  .aq-bars span:last-child { color:var(--nw-fg2); font-size:var(--nw-fs-small); text-align:right; white-space:nowrap; }
`;var qt=(...e)=>Math.max(0,...e.flatMap(n=>n.length?[n[n.length-1][0]]:[])),st=(e,n,t=0)=>48-(e-t)/Math.max(1e-6,n-t)*44;function ot(e,n,t,i=0,a=21600){let s=[],l=[];for(let c of e)c[1]===null?(l.length>1&&s.push(l),l=[]):l.push(c);return l.length>1&&s.push(l),s.map(c=>{let d=c.map(([g,x])=>({x:(g-(t-a))/a*100,y:st(x,n,i)})),u=d.slice(1).map((g,x)=>(g.y-d[x].y)/(g.x-d[x].x)),w=d.map((g,x)=>x===0?u[0]:x===d.length-1?u.at(-1):u[x-1]*u[x]<=0?0:2/(1/u[x-1]+1/u[x]));u.forEach((g,x)=>{if(g===0){w[x]=0,w[x+1]=0;return}let y=Math.hypot(w[x]/g,w[x+1]/g);y>3&&(w[x]*=3/y,w[x+1]*=3/y)});let f=g=>g.toFixed(2),h=`M${f(d[0].x)},${f(d[0].y)}`;for(let g=1;g<d.length;g++){let x=d[g-1],y=d[g],S=(y.x-x.x)/3;h+=` C${f(x.x+S)},${f(x.y+w[g-1]*S)} ${f(y.x-S)},${f(y.y-w[g]*S)} ${f(y.x)},${f(y.y)}`}return{line:h,area:`${h} L${f(d.at(-1).x)},50 L${f(d[0].x)},50 Z`}})}function Ft(e,n,t,i,a=21600){let s=e.filter(w=>w[1]!==null);if(s.length<2)return[];let l=s.reduce((w,f)=>f[1]>w[1]?f:w),c=s.reduce((w,f)=>f[1]<w[1]?f:w),d=w=>Math.min(92,Math.max(8,(w-(n-a))/a*100)),u=([w,f])=>({x:d(w),y:t(f)/50*100,text:i(f)});return l[1]-c[1]<1?[]:i(l[1])===i(c[1])?[u(l)]:[u(l),u(c)]}var lt=[[b("Calme"),"calm"],[b("Secteur"),"level1"],[b("Proche"),"level2"],[b("Sur vous"),"level3"]],Dt=50,_=100,Z=82,Fe=e=>Math.sqrt(Math.min(e,Dt)/Dt)*Z,Ot=(e,n)=>!e||e.has(n),va=e=>e<10?"var(--nw-level3)":e<30?"var(--nw-level2)":"var(--nw-level1)",Bt=(e,n)=>r(n>1?"{n} \xE9clairs":"{n} \xE9clair",{n:e});function xa(e){let n=(l,c)=>[_+Fe(l)*Math.sin(c*Math.PI/180),_-Fe(l)*Math.cos(c*Math.PI/180)],t=e.strikes.filter(l=>l[2]!==null),i=[...new Set(e.strikes.filter(l=>l[2]===null).map(l=>Math.round(l[1])))],a=t.at(-1),s=a&&a[0]<10?n(a[1],a[2]):void 0;return o`<svg class="lz-radar" viewBox="-14 -14 228 228" role="img" aria-label=${r("\xC9clairs de la derni\xE8re heure autour de chez vous")}>
    ${F`<circle cx=${_} cy=${_} r=${Z} fill="color-mix(in oklab, var(--nw-wind) 8%, transparent)"/>
    <line x1=${_} y1=${_-Z} x2=${_} y2=${_+Z} stroke="var(--nw-line-soft)"/><line x1=${_-Z} y1=${_} x2=${_+Z} y2=${_} stroke="var(--nw-line-soft)"/>
    ${[10,30,50].map(l=>F`<circle class=${l===30?"ring near":"ring"} cx=${_} cy=${_} r=${Fe(l)}/>
      <text class="km" x=${_+3} y=${_-Fe(l)+10}>${l}</text>`)}
    <text x=${_} y=${_-Z-5}>${r("N")}</text><text x=${_+Z+9} y=${_+4}>${r("E")}</text>
    <text x=${_} y=${_+Z+14}>${r("S")}</text><text x=${_-Z-9} y=${_+4}>${r("O")}</text>
    ${i.map(l=>F`<circle class="unplaced" cx=${_} cy=${_} r=${Fe(l)}/>`)}
    ${t.map(([l,c,d])=>{let[u,w]=n(c,d);return F`<circle cx=${u.toFixed(1)} cy=${w.toFixed(1)} r=${l<10?4:3} fill=${va(l)} opacity=${Math.max(.4,1-l/70).toFixed(2)}/>`})}
    ${s?F`<circle class="lz-pulse" cx=${s[0].toFixed(1)} cy=${s[1].toFixed(1)} r="4"/>`:p}
    <circle cx=${_} cy=${_} r="5" fill="var(--nw-bg)" stroke="var(--nw-fg)" stroke-width="2"/>`}</svg>`}var ya=e=>o`<div class="lz-level" role="img" aria-label=${r("Niveau : {step}",{step:r(lt[e][0])})}>
  ${[3,2,1,0].map(n=>o`<div class=${n===e?"on":""}><i class=${n<=e?"lit":""} style=${`--c:var(--nw-${lt[e][1]})`}></i>${R(r(lt[n][0]))}</div>`)}</div>`;function dt(e,n,t=p){let i=N("mdi:flash",lt[e.available?e.step:0][1],r("\xC9clairs"),e.source),a=e.month===void 0?p:j({theme:"calm",icon:"mdi:calendar-month",value:$(e.month,0),label:r("ce mois")});if(!e.available||!e.hourCount)return o`<section class="nw-panel" aria-label=${r("\xC9clairs")}>${i}${t}
    <div class="lz-calm" data-entity=${te(e.entity)}><p><b>${e.headline}</b>${e.available&&!e.hourCount?o` ${r("\xC0 moins de {km} km.",{km:Dt})}`:p}</p>${e.available?a:p}</div></section>`;let s=e.trend==="approche"?o`<span class="nw-say lz-move"><i class="nw-trend" data-way="down" data-tone="worse"></i>${e.movement}</span>`:e.trend==="eloigne"?o`<span class="nw-say lz-move"><i class="nw-trend" data-way="up" data-tone="better"></i>${e.movement}</span>`:p,l=[[r("Dans l\u2019heure"),Bt(e.hourCount,e.hourCount)],[r("En 10 min"),Bt(e.recentCount,e.recentCount)],e.month!==void 0?[r("Ce mois"),Bt($(e.month,0),e.month)]:[r("Dernier"),r("il y a {n} min",{n:Math.max(1,e.lastMinutes??1)})]];return o`<section class="nw-panel" aria-label=${r("\xC9clairs")}>${i}${t}
    ${Ot(n,"now")?o`<div class="metric-row"><div class="metric" data-entity=${te(e.entity)}>
        <div class="nw-value"><b>${e.nearest===void 0?"\u2014":$(Math.max(1,e.nearest),0)}</b><span>km</span></div>
        <small><b>${e.headline}</b>${e.direction?` \xB7 ${e.direction}`:""}</small></div>${s}</div>`:p}
    ${Ot(n,"radar")?o`<div class="mini lz"><div class="mini-top">${r("Derni\xE8re heure \xB7 en rouge, les 10 derni\xE8res minutes")}</div>
        <div class="lz-body">${xa(e)}${ya(e.step)}</div></div>`:p}
    ${Ot(n,"stats")?o`<div class="nw-stats">${l.map(([c,d])=>o`<div>${R(c)}<b>${d}</b></div>`)}</div>`:p}
  </section>`}var si=T`
  .lz-body { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
  .lz-radar { width:100%; max-width:160px; aspect-ratio:1; justify-self:center; overflow:visible; }
  .lz-radar .ring { fill:none; stroke:var(--nw-line); }
  .lz-radar .ring.near { stroke:color-mix(in oklab, var(--nw-level2) 75%, transparent); stroke-dasharray:3 3; }
  .lz-radar .unplaced { fill:none; stroke:var(--nw-level1); stroke-opacity:.5; stroke-dasharray:1 3; }
  .lz-radar text { font-size:var(--nw-fs-small); font-weight:700; fill:var(--nw-fg2); text-anchor:middle; }
  .lz-radar text.km { font-size:var(--nw-fs-label); font-weight:600; text-anchor:start; }
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
`;var $a=(e,n)=>(Math.min(e.hi,Math.max(e.lo,n))-e.lo)/(e.hi-e.lo)*100;function oi(e){let n=g=>$a(e,g),t=e.value===void 0?void 0:n(e.value),i=e.parts.map((g,x)=>{let y=n(g.to)-n(g.from),S=t===void 0?-1:(t-n(g.from))/(y||1),O=S>.2&&S<.8?S<.5?" wr":" wl":"";return o`<i class=${`nw-scale-part${O}`} style=${`flex:${y};--tone:${g.tone};--n:${x}`}>${g.word?o`<span>${g.word}</span>`:p}</i>`}),a=e.value===void 0?"var(--nw-fg2)":(e.parts.find(g=>e.value>=g.from&&e.value<g.to)??(e.value<e.lo?e.parts[0]:e.parts[e.parts.length-1]))?.tone??"var(--nw-fg2)",s=[e.lo,...e.parts.slice(1).map(g=>g.from),e.hi].filter((g,x,y)=>y.indexOf(g)===x).map(g=>({value:g,text:e.degree(g),row:"down",strong:g!==e.lo&&g!==e.hi})),l=e.outside,c=[...l?[{value:l.value,text:o`<b>${l.label}</b>`,row:"down",strong:!0,chars:12}]:[],...s,...e.marks??[]],d=t===void 0?[]:[[t-10,t+10,"up"]],u=c.map(g=>({...g,x:n(g.value)})).sort((g,x)=>Number(x.strong??!0)-Number(g.strong??!0)).flatMap(g=>{let x=g.chars??(typeof g.text=="string"?g.text.length:6),y=x*6.6/320*100/2+1.5,S=B=>d.every(([U,K,m])=>m!==B||g.x+y<U||g.x-y>K),O=g.row??"up",C=O==="up"?"down":"up",W=S(O)?O:(g.strong??!0)&&S(C)?C:null;if(!W)return[];d.push([g.x-y,g.x+y,W]);let z=g.x<4?" first":g.x>96?" last":"";return[o`<span class=${`nw-scale-lb${W==="up"?" up":""}${z}`} style=${`left:${z===" first"?0:z===" last"?100:g.x.toFixed(2)}%`}>${g.text}</span>`]}),w=t===void 0?"":t<10?" edge-l":t>90?" edge-r":"",f=t===void 0?"":`left:${t.toFixed(2)}%;--tone:${a}`,h=l?l.onTap?o`<button type="button" class="nw-scale-mk" style=${`left:${n(l.value).toFixed(2)}%`} title=${l.title??l.label} aria-label=${l.title??l.label} @click=${l.onTap}></button>`:o`<span class="nw-scale-mk" style=${`left:${n(l.value).toFixed(2)}%`}></span>`:p;return o`<div class="nw-scale" role="img" aria-label=${e.label}>
    <div class="nw-scale-lane">${i}</div>
    ${e.span?o`<div class="nw-scale-span" style=${`left:${n(e.span[0]).toFixed(2)}%;width:${(n(e.span[1])-n(e.span[0])).toFixed(2)}%`}></div>`:p}
    ${h}
    ${e.dots??p}
    ${t===void 0?p:o`<i class="nw-scale-stem" style=${f}></i><i class="nw-dot" style=${`left:${t.toFixed(2)}%`}></i>
      ${e.onValue?o`<button type="button" class=${`nw-scale-pin${w}`} style=${f} title=${e.valueTitle??""} @click=${e.onValue}>${e.valueText}</button>`:o`<span class=${`nw-scale-pin${w}`} style=${f}>${e.valueText}</span>`}`}
    ${u}
  </div>`}var di=e=>e.map(n=>o`<span class=${`pill${n.y<30?" low":""}`} style=${`left:${n.x}%;top:${n.y}%`}>${n.text}</span>`),Nt=e=>e.length?o`<div class="nw-stats">${e.map(n=>o`<div data-entity=${te(n.entity)}>${R(n.label)}<b>${n.value}</b></div>`)}</div>`:p,ci={"6h":{span:6*3600,title:b("6 derni\xE8res heures"),axis:["\u22126 h","\u22123 h"]},"1d":{span:86400,title:b("24 derni\xE8res heures"),axis:["\u221224 h","\u221212 h"]},"2d":{span:2*86400,title:b("2 derniers jours"),axis:[b("\u22122 j"),b("\u22121 j")]},"7d":{span:7*86400,title:b("7 derniers jours"),axis:[b("\u22127 j"),""]}},pi=e=>o`<div class="mini-axis"><span>${r(e.axis[0])}</span><span>${r(e.axis[1])}</span><span>${r("maint.")}</span></div>`,ka={"24h":{title:b("24 derni\xE8res heures"),axis:["\u221224 h","\u221212 h",b("maintenant")]},"7d":{title:b("7 derniers jours")},"30d":{title:b("30 derniers jours"),axis:[b("\u221230 j"),b("\u221215 j"),b("aujourd\u2019hui")]}},Q=(e,n)=>!e||e.has(n),ui=(e,n,t)=>[F`<defs><linearGradient id=${t} x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color=${n} stop-opacity=".3"/><stop offset="1" stop-color=${n} stop-opacity="0"/></linearGradient></defs>`,...e.map(i=>F`
  <path d=${i.area} fill=${`url(#${t})`}/>
  <path d=${i.line} fill="none" stroke=${n} stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`)],li={winter:[-15,20],spring:[-5,30],summer:[5,40],autumn:[-10,25]},Aa=["mdi:water-percent","mdi:thermometer-water","mdi:solar-power-variant-outline","mdi:sun-wireless-outline","mdi:brightness-5"],hi=e=>e.filter(n=>!Aa.includes(n.icon)),se=(e,n)=>e.find(t=>t.icon===n),Oe=e=>{let n=e===void 0?NaN:parseFloat(e.replace("\u2212","-").replace(",",".").replace(/[^\d.+-]/g,""));return Number.isFinite(n)?n:void 0},Ca=e=>e===void 0?"":e>=70?r("air humide"):e<=35?r("air sec"):"";function Ta(e,n){let t={effect:r("sans effet"),theme:"calm"},i=(y,S)=>y?{effect:(Oe(y.value)??0)>0?r("r\xE9chauffe"):r("refroidit"),theme:(Oe(y.value)??0)>0?"heat":"cold",note:r("{value} au ressenti",{value:y.value??""})}:{...t,note:S},a=se(e.factors,"mdi:weather-windy"),s=se(e.factors,"mdi:water-percent"),l=se(e.factors,"mdi:white-balance-sunny"),c=se(e.factors,"mdi:weather-night"),d=se(n.extras,"mdi:water-percent"),u=se(n.extras,"mdi:solar-power-variant-outline"),w=se(n.extras,"mdi:sun-wireless-outline"),f=se(n.extras,"mdi:thermometer-water"),h=Oe(f?.value),g=!l&&!(Oe(u?.value)??0);return[{icon:"mdi:weather-windy",title:r("Vent"),value:n.wind===void 0?void 0:`${$(n.wind,0)} km/h`,...i(a,r("n\u2019ajoute rien"))},{icon:"mdi:water-percent",title:r("Humidit\xE9"),value:d?.value,...i(s,e.humidity||Ca(Oe(d?.value)))},{icon:g?"mdi:weather-night":"mdi:white-balance-sunny",title:r("Soleil"),value:g?void 0:u?.value,...i(l??c,g?r("la nuit, il ne r\xE9chauffe pas"):w?`${w.label} \xB7 ${w.value}`:r("ne r\xE9chauffe pas"))},{icon:"mdi:thermometer-water",title:r("Point de ros\xE9e"),value:f?.value,...h===void 0?{...t,note:""}:h>=18?{effect:r("attention"),theme:h>=20?"level2":"level1",note:h>=20?r("air tr\xE8s lourd"):r("air lourd")}:h<=1&&(e.temperature??99)<=5?{effect:r("attention"),theme:"level1",note:r("gel\xE9e blanche possible")}:{...t,note:r("sans g\xEAne")}}].filter(y=>y.value!==void 0||y.effect!==t.effect||y.title===r("Soleil")&&g)}var Sa=[[-99,-13,b("Froid intense"),"color-mix(in oklab,var(--nw-cold) 70%,var(--nw-wind))"],[-13,0,b("Froid"),"var(--nw-cold)"],[0,9,b("Frais"),"color-mix(in oklab,var(--nw-cold) 45%,var(--nw-calm))"],[9,26,b("Agr\xE9able"),"var(--nw-calm)"],[26,32,b("Chaud"),"var(--nw-level2)"],[32,38,b("Tr\xE8s chaud"),"var(--nw-heat)"],[38,99,b("Chaleur intense"),"var(--nw-level3)"]],_a=e=>`${e<0?"\u2212":""}${Math.abs(e)}\xB0`;function Pa(e,n,t,i){let a=Sa.filter(([s,l])=>l>n&&s<t).map(([s,l,c,d])=>({from:Math.max(s,n),to:Math.min(l,t),word:r(c),tone:d}));return o`${oi({lo:n,hi:t,parts:a,value:e,valueText:`${$(e)} \xB0C`,label:r("Ressenti {t} \xB0C",{t:$(e)}),degree:_a})}
    <div class="feel-ends"><span>${i}</span><span>${r("seuils du ressenti")}</span></div>`}function It(e,n,t,i,a,s=p){let[l,c]=li[i.season.season]??li.autumn,d=e.gap===void 0||Math.abs(e.gap)<.1?r("comme la temp\xE9rature"):r(t?"{gap} \xB0C par rapport au thermom\xE8tre":"{gap} \xB0C par rapport \xE0 la temp\xE9rature du bulletin",{gap:`${e.gap>0?"+":"\u2212"}${$(Math.abs(e.gap))}`}),u=Re(`${n}-feel`,{title:r("Ressenti"),text:o`${r("C\u2019est la temp\xE9rature que le corps per\xE7oit. L\u2019humidit\xE9 et le soleil la font monter, le vent la fait baisser.")}
      ${r("C\u2019est une estimation, pas un indice officiel.")} <a href="https://github.com/hestiaFB/hestia-weather-integration/blob/main/docs/ressenti.md" target="_blank" rel="noopener noreferrer">${r("En savoir plus")}</a>
      <div class="ex">${r("Source : {source}",{source:e.source})}</div>`,example:e.example?r("En ce moment : {example}.",{example:e.example}):r("25 \xB0C au thermom\xE8tre dans un air tr\xE8s humide se ressentent comme 30 \xB0C.")}),w=Q(a,"factors")?Ta(e,i):[],f=new Intl.DateTimeFormat(ie(),{month:"long"}).format(new Date),h=/^[aeiouy]/i.test(f)?r("\xE9chelle d\u2019{month}",{month:f}):r("\xE9chelle de {month}",{month:f}),g=!e.factors.some(x=>x.icon==="mdi:weather-windy")&&i.wind!==void 0&&i.wind<5;return o`<section class="nw-panel" aria-label=${r("Ressenti")}>${N("mdi:thermometer","heat",r("Ressenti"),e.source,u,{aside:r("maintenant")})}
    ${Q(a,"feel")?o`<div class="feel-row" data-entity=${te(e.entity)}><div class="nw-value"><b>${$(e.feels)}</b><span>°C</span></div>
      ${e.word?o`<span class="feel-word">${e.word}</span>`:p}<span class="feel-say">${g&&d===r("comme la temp\xE9rature")?r("comme la temp\xE9rature : pas de vent pour l\u2019abaisser"):d}</span></div>`:p}
    ${Q(a,"gauge")?Pa(e.feels,l,c,h):p}
    ${w.length?o`<div class="feel-factors">${w.map(x=>o`<div>
      <span class="ff-head"><span class="ff-t"><ha-icon icon=${x.icon}></ha-icon>${x.title}</span><span class="ff-eff" style=${`--c:var(--nw-${x.theme})`}>${x.effect}</span></span>
      <b>${x.value?.replace(/^-/,"\u2212")??"\u2014"}</b>${x.note?o`<small>${x.note}</small>`:p}</div>`)}</div>`:p}
    ${s}
  </section>`}function Ht(e,n,t=p,i=""){let a=Math.max(1,...(e.days??[]).map(w=>w.value??0)),s=ka[e.period??"7d"],l=(e.days?.length??0)>7,c=l?(e.days??[]).reduce((w,f)=>(f.value??0)>(w?.value??0)?f:w,void 0):void 0,d=w=>e.period==="24h"?w.label:e.period==="30d"?`${w.label}/${w.date.slice(5,7)}`:w.date,u=e.rate!==void 0&&e.rate>0?j({theme:"rain",icon:"mdi:weather-rainy",value:`${$(e.rate)} mm/h`,label:r("en ce moment"),entity:e.rateEntity}):e.status?j({theme:"rain",icon:"mdi:weather-rainy",label:e.status}):p;return o`<section class="nw-panel" aria-label=${r("Pluie")}>${N("mdi:weather-rainy","rain",r("Pluie"),e.source)}${t}
    ${Q(n,"now")?o`<div class="metric-row"><div class="metric" data-entity=${e.entity}>
      ${e.text?o`<div class="nw-value"><b class="word">${e.text}</b></div>`:o`<div class="nw-value"><b>${e.value===void 0?"\u2014":$(e.value,1,!0)}</b><span>${e.unit}</span></div>`}<small>${[e.label,i].filter(Boolean).join(" \xB7 ")}</small></div>${u}</div>`:p}
    ${Q(n,"chart")?o`<div class="mini" title=${e.daysNote}><div class="mini-top">${r(s.title)} · ${e.total===void 0?"mm":`${e.totalPartial?"\u2265 ":""}${$(e.total)} mm`}</div>
      ${e.days?o`<div class=${`bars${l?" dense":""}`} style=${`--n:${e.days.length}`} role="img" aria-label=${r("Pluie des {period}",{period:r(s.title)})}>${e.days.map(w=>o`<div title=${Y(d(w),w.value===void 0?r("indisponible"):w.partial?r("au moins {mm} mm",{mm:$(w.value)}):`${$(w.value)} mm`)}>
          <span>${w.value===void 0?l?"":"\u2014":w.value&&(!l||w===c)?`${w.partial?"\u2265 ":""}${$(w.value)}`:""}</span>
          <i class=${w.value?"":"zero"} style=${`height:${w.value?Math.max(12,w.value/a*74):5}%`}></i></div>`)}</div>
        ${s.axis?o`<div class="mini-axis">${s.axis.map(w=>R(r(w)))}</div>`:o`<div class="bars-axis">${e.days.map(w=>R(w.label.replace(".","")))}</div>`}`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${Q(n,"stats")?Nt(e.stats):p}
  </section>`}function Vt(e,n,t,i=p){let a="var(--nw-wind)",s=qt(e.mean,e.gust),l=ci[e.period??"6h"],c=ot(e.mean,e.top,s,0,l.span),d=ot(e.gust,e.top,s,0,l.span);return o`<section class="nw-panel" aria-label=${r("Vent")}>${N("mdi:weather-windy","wind",r("Vent"),e.source)}${i}
    ${Q(t,"now")?o`<div class="metric-row"><div class="metric" data-entity=${e.entity}><div class="nw-value"><b>${e.value===void 0?"\u2014":$(e.value,0)}</b><span>km/h</span></div>
      <small>${[e.description||e.label,e.bearing===void 0?"":Ea(e.bearing)].filter(Boolean).join(" \xB7 ")}</small></div>
      ${e.status?j({theme:"wind",icon:"mdi:weather-windy",label:e.status}):p}</div>`:p}
    ${Q(t,"chart")?o`<div class="mini"><div class="mini-top">${r(l.title)} · km/h</div>
      ${c.length||d.length?o`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${r("Vent des {period}, moyennes et rafales",{period:r(l.title)})}>
          ${d.map(u=>F`<path d=${u.line} fill="none" stroke="color-mix(in oklab,var(--nw-wind) 55%,transparent)" stroke-width="2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`)}
          ${ui(c,a,`${n}-fill-wind`)}</svg>${di(Ft(e.mean,s,u=>st(u,e.top),u=>$(u,0),l.span))}</div>${pi(l)}`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${Q(t,"stats")?Nt(e.stats):p}
  </section>`}function Ut(e,n,t,i=p){let a=ci[e.period??"6h"],s=qt(e.series),l=ot(e.series,e.top,s,e.low,a.span),c=e.series.flatMap(([,u])=>u===null?[]:[u]),d=c.length>1&&Math.max(...c)-Math.min(...c)<=1;return o`<section class="nw-panel" aria-label=${r("Pression")}>${N("mdi:gauge","pressure",r("Pression"),e.source)}${i}
    ${Q(t,"now")?o`<div class="metric-row"><div class="metric" data-entity=${te(e.entity)}><div class="nw-value"><b>${e.value===void 0?"\u2014":$(e.value,0)}</b><span>hPa</span></div>
      <small>${d&&e.trend?`${e.trend.label} \xB7 ${e.description}`:e.description}</small></div>${e.trend&&!d?o`<span class="nw-say p-trend"><i class="nw-trend" data-way=${/down|baisse/.test(e.trend.icon+e.trend.label)?"down":"up"}></i>${e.trend.value?o`<b>${e.trend.value}</b> `:p}${e.trend.label}</span>`:p}</div>`:p}
    ${Q(t,"chart")?o`<div class="mini"><div class="mini-top">${r(a.title)} · hPa</div>
      ${l.length?o`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${r("Pression des {period}",{period:r(a.title)})}>${ui(l,"var(--nw-pressure)",`${n}-fill-pressure`)}</svg>${di(Ft(e.series,s,u=>st(u,e.top,e.low),u=>$(u,0),a.span))}</div>${pi(a)}`:o`<p class="nw-empty">${e.empty}</p>`}</div>`:p}
    ${Q(t,"stats")&&!d?Nt(e.stats):p}
  </section>`}var za=[b("du nord"),b("du nord-est"),b("d\u2019est"),b("du sud-est"),b("du sud"),b("du sud-ouest"),b("d\u2019ouest"),b("du nord-ouest")],Ea=e=>r(za[Math.round((e%360+360)%360/45)%8]),Kt=e=>({wind:e.wind?.value,extras:e.extras,season:e.season.info}),La=["comfort","rain","wind","pressure","lightning","extras","air"];function mi(e,n,t,i,a=La){let s=jt(e),l=e.hours.length?s.six>=.1?r("{mm} mm d\u2019ici 6 h",{mm:$(s.six)}):s.next?r("pas de pluie avant {hour}",{hour:s.next}):r("rien d\u2019ici 18 h"):"",c=f=>f==="rain"?e.rain&&Ht(e.rain,void 0,p,l):f==="wind"?e.wind&&Vt(e.wind,n):f==="pressure"?e.pressure&&Ut(e.pressure,n):f==="lightning"?e.lightning&&dt(e.lightning):void 0,d=[],u=[],w=()=>{u.length&&d.push(o`<div class=${`grid3 n${u.length}`}>${u}</div>`),u=[]};for(let f of a){let h=c(f);if(h){u.push(h);continue}w(),f==="comfort"&&e.comfort&&d.push(It(e.comfort,n,t,Kt(e)));let g=e.comfort&&a.includes("comfort")?[]:e.extras;f==="extras"&&g.length&&d.push(o`<div class="nw-chips extras">${g.map(j)}</div>`),f==="air"&&d.push(i)}return w(),o`${d}`}var fi=T`
  /* Three panels: one column on a phone, two then three as the card widens; the third never leaves a hole. */
  .grid3 { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
  @container (min-width:560px) { .grid3 { grid-template-columns:repeat(2, minmax(0,1fr)); } .grid3.n3 > :last-child, .grid3.n1 > * { grid-column:1/-1; } }
  @container (min-width:640px) { .grid3.n3 { grid-template-columns:repeat(3, minmax(0,1fr)); } .grid3.n3 > :last-child { grid-column:auto; } }
  .extras { justify-content:center; }
  .metric .word { font-size:var(--nw-fs-title); letter-spacing:-.2px; }
  .compass { width:72px; height:72px; flex:none; }
  /* The feel (2 November): the value and its word, the season's scale, then what plays on it in four delimited tiles. */
  .feel-row { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px 12px; }
  .feel-word { font-size:var(--nw-fs-text); font-weight:650; }
  .feel-say { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .feel-ends { display:flex; justify-content:space-between; margin:2px 6px 0; font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
  .feel-factors { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  @container (min-width:600px) { .feel-factors { grid-template-columns:repeat(4, minmax(0,1fr)); } }
  .feel-factors > div { container-type:inline-size; display:grid; gap:2px; align-content:start; padding:10px 12px; border-radius:12px; min-width:0;
    background:var(--nw-bg); border:1px solid color-mix(in srgb, var(--nw-fg) 14%, transparent); }
  /* The title stays on one line: when the effect does not fit beside it, it goes under. */
  /* As the maquette: the effect stays on the title's line; a long title (« Point de rosée ») wraps rather than it. */
  .ff-head { display:flex; justify-content:space-between; align-items:center; gap:6px; font-size:var(--nw-fs-small); color:var(--nw-fg2); min-width:0; }
  .ff-t { display:flex; align-items:center; gap:6px; min-width:0; line-height:1.3; }
  .ff-t ha-icon { flex:none; }
  .ff-head ha-icon { --mdc-icon-size:15px; }
  /* A narrow tile: the effect under the title in every tile alike, rather than over it. */
  @container (max-width:150px) { .ff-head { flex-direction:column; align-items:flex-start; gap:4px; } }
  .ff-eff { flex:none; padding:0 6px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-label); font-weight:700; white-space:nowrap;
    background:color-mix(in oklab, var(--c) 28%, transparent); color:color-mix(in oklab, var(--c) 40%, var(--nw-fg)); }
  .feel-factors b { font-size:var(--nw-fs-title); font-weight:500; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
  .feel-factors small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  /* Rain of the last seven days: the value on each bar. */
  .bars, .bars-axis { display:grid; grid-template-columns:repeat(var(--n, 7), 1fr); gap:6px; }
  .bars.dense { gap:2px; }
  .bars.dense span { overflow:visible; white-space:nowrap; }
  .bars { align-items:end; height:66px; }
  .bars > div { display:flex; flex-direction:column; justify-content:flex-end; height:100%; gap:3px; }
  .bars span { font-size:var(--nw-fs-label); font-weight:700; text-align:center; line-height:1; min-height:12px; white-space:nowrap; }
  .bars i { display:block; border-radius:5px 5px 2px 2px; background:color-mix(in oklab, var(--nw-rain) 80%, transparent); min-height:3px; }
  .bars i.zero { background:color-mix(in oklab, var(--nw-line) 80%, transparent); }
  .bars-axis { text-align:center; }
  .bars-axis .nw-label { font-size:var(--nw-fs-label); letter-spacing:.02em; }
  .bars:not(.dense), .bars-axis { gap:3px; }
`;var Ma="/config/integrations/integration/hestia_weather";function Ra(e,n){let t=i=>{let[a,s]=i.split("_");return(s==="today"?e.air.today:s==="tomorrow"?e.air.tomorrow:[]).find(l=>l.kind===a)};return n.map(t).filter(i=>!!i)}function gi(e,n,t,i){if(n==="forecast")return Qn(e,i.tab,i.onTab,i.entity,i.uid,t);let a=new Set(t),s=c=>o`<p class="nw-empty">${c}</p>`,l;if(!t.length)l=s(r("Rien \xE0 afficher : cochez au moins un \xE9l\xE9ment dans les r\xE9glages de la carte."));else if(n==="comfort"){let c=a.has("factors")?hi(e.extras):e.extras,d=a.has("extras")&&c.length?o`<div class="nw-chips extras">${c.map(j)}</div>`:p;l=e.comfort?It(e.comfort,i.uid,i.station,Kt(e),a,d):s(r("Ressenti indisponible pour le moment."))}else if(n==="rain"){let c=a.has("ahead")?Yn(e):p;l=e.rain?Ht(e.rain,a,c):o`<section class="nw-panel" aria-label=${r("Pluie")}>${N("mdi:weather-rainy","rain",r("Pluie"),e.provider)}${c===p?s(r("Pluie indisponible pour le moment.")):c}</section>`}else if(n==="wind"){let c=a.has("ahead")?Zn(e):p;l=e.wind?Vt(e.wind,i.uid,a,c):c===p?s(r("Vent indisponible pour le moment.")):o`<section class="nw-panel" aria-label=${r("Vent")}>${N("mdi:weather-windy","wind",r("Vent"),e.provider)}${c}</section>`}else if(n==="pressure"){let c=a.has("ahead")?Xn(e,a.size===1):p;l=e.pressure?Ut(e.pressure,i.uid,a,c):c===p?s(r("Pression indisponible pour le moment.")):o`<section class="nw-panel" aria-label=${r("Pression")}>${N("mdi:gauge","pressure",r("Pression"),e.provider)}${c}</section>`}else if(n==="lightning")l=e.lightning?dt(e.lightning,a,a.has("ahead")?ei(e):p):o`<section class="nw-panel lz-missing" aria-label=${r("\xC9clairs")}>${N("mdi:flash","wind",r("\xC9clairs"),"Blitzortung")}
        <p>${r("Cette carte montre les \xE9clairs autour de chez vous gr\xE2ce \xE0 Blitzortung, un r\xE9seau de d\xE9tecteurs b\xE9n\xE9voles. Installez l\u2019extension depuis HACS, puis choisissez-la dans les r\xE9glages de Hestia Weather.")}</p>
        <div class="links"><a href="https://github.com/mrk-its/homeassistant-blitzortung" target="_blank" rel="noopener noreferrer">${r("Installer Blitzortung")}</a>
          <a class="second" href=${Ma}>${r("R\xE9glages de Hestia Weather")}</a></div></section>`;else{let c=Ra(e,t);l=c.length?o`<div class="panels-two">${c.map(d=>rt(d))}</div>`:s(r("Air et pollens indisponibles pour le moment."))}return o`<div class=${`nw-single ${n}`}>${l}</div>`}var wi=T`
  .nw-single { padding:14px 16px 16px; color:var(--nw-fg); }
  .nw-single .nw-panel { border:0; padding:0; background:none; }
  .nw-single .extras { justify-content:flex-start; }
  .lz-missing p { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); line-height:1.5; }
  .lz-missing .links { display:flex; flex-wrap:wrap; gap:8px; }
  .lz-missing a { display:inline-block; padding:6px 14px; border-radius:var(--nw-radius-pill); background:var(--nw-accent); color:var(--nw-bg); font-weight:600; text-decoration:none; font-size:var(--nw-fs-small); }
  .lz-missing a.second { background:none; color:var(--nw-accent); box-shadow:inset 0 0 0 1px var(--nw-line); }
  .nw-single.air .panels-two { gap:24px 20px; }
  .nw-single .lz-radar { max-width:210px; }
`;var ye=class extends D{constructor(){super(...arguments);this.now=new Date;this.tick=()=>{this.now=new Date,clearTimeout(this.timer),this.timer=setTimeout(this.tick,6e4-this.now.getSeconds()*1e3-this.now.getMilliseconds()+50)}}connectedCallback(){super.connectedCallback(),this.tick()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timer)}render(){return o`<time datetime=${this.now.toISOString()}>${Pn(ie(),{hour:"2-digit",minute:"2-digit"}).format(this.now)}</time>`}};ye.styles=T`
    :host { display:block; font-variant-numeric:tabular-nums; line-height:1; }
    time { font:inherit; }
  `,k([P()],ye.prototype,"now",2),ye=k([J("hestia-clock")],ye);var ja=[{key:"official",title:b("Vigilance officielle")},{key:"now",title:b("Maintenant")},{key:"future",title:b("\xC0 venir")},{key:"environment",title:b("Air et pollens")}];function Wa(e,n){let t=e.brief,i=t?ja.map(a=>({...a,signals:t.signals.filter(s=>s.group===a.key&&(s.severity>0||e.points.some(l=>l.text===s.text)))})).filter(a=>a.signals.length):[];return Re(`${n}-brief`,{title:r("Synth\xE8se"),text:o`${r("La m\xE9t\xE9o du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.")}
      ${i.map(a=>o`<div class="brief-group">${R(r(a.title))}<ul>${a.signals.map(s=>o`<li data-entity=${s.entity??p}>
        <ha-icon icon=${s.icon}></ha-icon><span>${s.text}</span></li>`)}</ul></div>`)}
      ${t?.caveats.length?o`<div class="brief-group">${R(r("\xC0 v\xE9rifier"))}<ul>${t.caveats.map(a=>o`<li><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${a}</span></li>`)}</ul></div>`:p}`,example:r("\xAB Pluie ce soir, puis \xE9claircies demain matin. \xBB")})}function bi(e,n,t,i,a,s="none",l="opaque"){let c=e.now.trend===void 0||Math.abs(e.now.trend)<.5?p:o`<span class="now-trend nw-say"
    title=${e.now.trend>0?r("La temp\xE9rature monte"):r("La temp\xE9rature baisse")}><i class="nw-trend" data-way=${e.now.trend>0?"up":"down"}></i>${e.now.trend>0?"+":"\u2212"}${$(Math.abs(e.now.trend))} °C/h</span>`,d=e.season.news?o`<span class="nw-chip" style=${ge("calm")} title=${e.season.tip}><ha-icon icon=${e.season.info.icon}></ha-icon>${e.season.news}</span>`:p,u=e.alerts.filter(h=>h.official),w=Gt(e),f=i[0]==="bulletin"?i.slice(1):i;return o`<section class=${`nw-hero${e.now.darkSky?" dark-sky":""}`} aria-label=${r("Synth\xE8se")}>
    <div class="sky" aria-hidden="true">${n}</div><div class="veil" aria-hidden="true"></div>
    <header class="fm-head"><h2 class="nw-title">${r("Synth\xE8se")}</h2>${Wa(e,t)}<span>${[e.location,e.dateLabel].filter(Boolean).join(" \xB7 ")}</span>${d}</header>
    <div class="hero-main">
      ${s==="left"?o`<hestia-clock class="hero-clock"></hestia-clock>`:p}
      ${u.length?o`<div class="nw-alerts">${u.map(h=>we(h))}</div>`:p}
      ${i[0]==="bulletin"?w:p}
    </div>
    ${zt(e,!0,c,s==="right"?o`<hestia-clock class="now-clock"></hestia-clock>`:p,l)}
    ${f.length?o`<div class="hero-blocks">${f.map(a)}</div>`:p}
  </section>`}var Gt=e=>e.bulletin?o`${R(r("Bulletin du jour"))}<p class="nw-bulletin">${Xe(e.bulletin.summary)}</p>`:p,vi=T`
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
  .now-trend { display:inline-flex; align-items:center; gap:5px; font-variant-numeric:tabular-nums; }
  /* « Sans cadre »: no frame behind the figures, only a fine, tight shadow around the letters and icons, almost an outline,
     in the theme's background (dark behind light text, light behind dark text; dark on a storm sky's white text). */
  .nw-hero > .nw-now:not(.nw-glass) { --halo:color-mix(in srgb, var(--nw-bg) 85%, transparent);
    text-shadow:0 0 1px var(--halo), 0 0 2px var(--halo), 0 1px 3px var(--halo); }
  .nw-hero.dark-sky > .nw-now:not(.nw-glass) { --halo:rgb(11 26 43 / .7); }
  .nw-hero > .nw-now:not(.nw-glass) :is(ha-icon, .nw-trend) { filter:drop-shadow(0 0 1px var(--halo)) drop-shadow(0 1px 2px var(--halo)); }
  .nw-hero .nw-bulletin { animation:nw-rise .7s var(--nw-ease) both; }
  @keyframes nw-rise { from { opacity:0; filter:blur(3px); } }
  .nw-hero > .nw-now { grid-area:now; align-self:start; gap:4px; }
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
    /* On a phone, as the folded tile (3 November): the title on the left, « En ce moment » in a small glass frame on the right,
       the sun moved between them so the sky stays in sight; the text below sits on the card's background, readable on any sky. */
    .nw-hero { grid-template-areas:"head now" "main main" "blocks blocks"; column-gap:12px; padding:16px 14px 18px; --nw-orb-x:44%; --nw-orb-y:56px; }
    .nw-hero > .fm-head { align-self:start; row-gap:2px; }
    .nw-hero > .fm-head > span:not(.nw-chevron):not(.nw-chip):not(.nw-sum) { flex:1 0 100%; }
    .nw-hero > .nw-now > .nw-label { display:none; }
    .nw-hero > .nw-now .nw-temp { font-size:var(--nw-fs-value); }
    .nw-hero .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 85%, transparent) 22%,
      color-mix(in srgb, var(--nw-bg) 30%, transparent) 42%, transparent 60%); }
    /* Under the frame, whatever its height (a clock above it, a long condition): the bulletin and the blocks over a fading veil. */
    .nw-hero::after { content:''; position:absolute; grid-row:main-start / -1; grid-column:1 / -1; top:-30px; bottom:-18px; left:-14px; right:-14px;
      z-index:-1; pointer-events:none; background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--nw-bg) 90%, transparent) 40px); }
  }
`;function xi(e,n,t,i,a){let s=i.folded[e],l=c=>{c instanceof KeyboardEvent&&c.key!=="Enter"&&c.key!==" "||(c.preventDefault(),i.onFold(e))};return o`<section class=${`fm-section${s?" folded":""}`} aria-labelledby=${`${i.uid}-${e}`}>
    <header class="fm-head nw-section-head nw-fold-head" role="button" tabindex="0" aria-expanded=${!s} @click=${l} @keydown=${l}>
      <h2 id=${`${i.uid}-${e}`}>${n}</h2><span class="nw-sum">${t}</span>
      <span class="nw-chevron" aria-hidden="true"><i class="nw-chev"></i></span></header>
    ${s?p:o`<div class="fm-body">${a()}</div>`}
  </section>`}function yi(e,n){let{hero:t,banner:i,today:a,forecasts:s}=n.sections,l=c=>c==="bulletin"?o`<div class="hero-bulletin">${Gt(e)}</div>`:c==="events"?Et(e):c==="moments"?_t(e):Pt(e,n.tab,n.onTab);return o`<div class="nw-full">
    ${t?bi(e,n.sky,n.uid,i,l,n.clock,n.nowFrame):p}
    ${a.length?xi("today",r("Aujourd\u2019hui"),e.comfort?r("Mesures et ressenti"):r("Conditions actuelles"),n,()=>mi(e,n.uid,n.station,ai(e.air,n.air),a)):p}
    ${s.length?xi("predictions",r("Pr\xE9visions"),e.forecastSource,n,()=>Un(e,n.entity,n.uid,a.includes("air")?p:ii(e.air.tomorrow),s)):p}
  </div>`}var $i=T`
  .nw-full { container-type:inline-size; color:var(--nw-fg); }
  .fm-section { padding:20px 24px 24px; border-top:1px solid var(--nw-line-soft); }
  .nw-full > .fm-section:first-child { border-top:0; }
  .fm-head { display:flex; align-items:center; gap:10px; min-width:0; }
  .fm-section > .fm-head { cursor:pointer; user-select:none; -webkit-user-select:none; border-radius:var(--nw-radius); }
  .fm-head:focus-visible { outline:2px solid var(--nw-accent); outline-offset:4px; }
  .fm-head > span:not(.nw-chevron):not(.nw-chip):not(.nw-sum) { font-size:var(--nw-fs-small); color:var(--nw-fg2); flex:1; min-width:0; }
  .fm-body { display:grid; gap:16px; margin-top:16px; }
  @container (max-width:560px) { .fm-section { padding:16px 14px 18px; } }
`;var ki=T`
  /* The card, its panels, heads, labels, values and stats come from the shared charter (hestia-charte); here only what is Weather's. */
  ha-card { --nw-ease:cubic-bezier(.23,1,.32,1); }
  .mini-axis { font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }

  /* « En ce moment »: a soft veil behind it, so leaves, rain and snow never cross the figures; no source pill (in its tooltip). */
  /* « En ce moment » in the charter's glass frame (3 November): readable over leaves, rain and clouds, without a shadow. */
  .nw-hero > .nw-now.nw-glass { padding:10px 12px 10px 14px; gap:4px; }
  /* Smaller on a phone, next to the title: the sky keeps its room. */
  @container (max-width:650px) { .nw-hero > .nw-now.nw-glass { padding:8px 10px 8px 12px; gap:2px; } }

  /* Large figures: thin and tight (Manrope 300, the variable font). */
  .nw-now .temp:not(.nw-temp) { font-weight:300; letter-spacing:-.05em; }
  .mini-temp { font-weight:300; letter-spacing:-.04em; }
  .nw-tile strong { font-weight:650; }

  /* Motion: brief entrances without blur, nothing moves while the card is out of view. */
  @keyframes nw-rise { from { opacity:0; transform:translateY(6px); } }
  .nw-hero .nw-bulletin { animation-duration:.3s; }
  :host([offscreen]) *, :host([offscreen]) *::before, :host([offscreen]) *::after { animation-play-state:paused !important; }
  /* The same for the timeline and the radar, drawn in their own shadow: they read --nw-motion. */
  :host([offscreen]) { --nw-motion:paused; }
`;function Ai(e){if(typeof IntersectionObserver>"u")return()=>{};let n=new IntersectionObserver(t=>{for(let i of t)e.toggleAttribute("offscreen",!i.isIntersecting)});return n.observe(e),()=>{n.disconnect(),e.removeAttribute("offscreen")}}var Ci=[{d:"M58 0 43 40 61 52 35 88 49 97 24 144 37 151 12 217M43 40 23 56 34 67 17 91M35 88 72 107 64 121 88 147",delay:0},{d:"M42 0 62 35 48 52 81 87 67 102 92 153 80 171 104 216M62 35 85 40 81 58 105 80",delay:-2.1},{d:"M70 0 52 30 66 44 40 78 58 86 30 130 44 136 26 190M52 30 34 42 40 56M40 78 18 96",delay:-4.2}];var qa=40,Fa=70,Oa=25,Ti=45,Ba=0,L=class extends D{constructor(){super(...arguments);this.uid=`sky${++Ba}`;this.condition="unknown";this.phase="unknown";this.quality="standard";this.animated=!0;this.wind=0;this.gust=0;this.detail="";this.season="";this.visible=!1;this.pageVisible=!0;this.visibility=()=>{this.pageVisible=!document.hidden}}connectedCallback(){super.connectedCallback(),this.visibility(),document.addEventListener("visibilitychange",this.visibility),typeof IntersectionObserver<"u"?(this.observer=new IntersectionObserver(t=>{this.visible=t.some(i=>i.isIntersecting)}),this.observer.observe(this)):this.visible=!0}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.removeEventListener("visibilitychange",this.visibility)}cloud(t){return o`<div class=${`cloud ${t}`}><svg viewBox="0 0 180 112" aria-hidden="true">
      <path class="cloud-rear" d="M42 103C21 103 7 90 7 70C7 53 17 40 33 36C35 16 50 5 69 5C91 5 107 19 109 40C116 37 123 36 130 36C154 36 172 51 172 73C172 92 157 103 137 103Z"/>
      <path class="cloud-near" d="M38 103C26 103 19 95 19 84C19 73 27 65 36 64C38 52 47 45 59 45C72 45 82 54 83 65C99 62 116 72 116 85C116 96 108 103 94 103Z"/>
    </svg></div>`}stars(t){return Array.from({length:t},(i,a)=>{let s=2.2+a*7%10*.26;return o`<i class=${`star${a%6===0?" bright":""}`} style=${`--sx:${48+a*37%50}%;--sy:${4+a*53%62}%;--ss:${1.2+a%4*.5}px;--st:${s}s;--sd:${-(a*.73%s)}s`}></i>`})}fog(){let t=this.detail,i=this.quality==="low",a=t==="dense"||t==="freezing-fog",s=this.phase==="day"||this.phase==="twilight",l=(d,u,w,f,h,g)=>o`<div class=${`fog-band depth-${h}`} style=${`--fy:${u}%;--fl:${w}%;--fw:${f}%;--fd:${13+d*3}s;--fdelay:${-d*2.7}s;--dir:${d%2?-1:1}${g?`;--fh:${g}%`:""}`}><svg viewBox="0 0 600 60" preserveAspectRatio="none"><path d="M0 34C60 16 130 20 190 30S330 48 400 32 520 14 600 28V60H0Z"/></svg></div>`;if(t==="mist")return o`${s?o`<div class="orb sun"><i></i></div>`:o`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer">${Array.from({length:i?3:6},(d,u)=>o`<div class="mist-thread" style=${`--fy:${30+u*11}%;--fl:${[-8,20,-15,26,4,-20][u]}%;--fw:${[90,70,110,64,96,80][u]}%;--fd:${16+u*3}s;--fdelay:${-u*3.1}s;--dir:${u%2?-1:1}`}></div>`)}</div>`;if(t==="patches")return o`${s?o`<div class="orb sun"><i></i></div>`:o`<div class="orb moon"><i></i><b></b></div>`}
      <div class="fog-layer patches">${[[0,52,-14,56,2,44],[1,60,36,50,2,40],[2,48,66,52,2,46],[3,68,10,60,1,34]].slice(0,i?2:4).map(([d,u,w,f,h,g])=>l(d,u,w,f,h,g))}</div>`;let c=i?a?4:3:a?7:5;return o`${s&&!a?o`<div class="fog-sun"></div>`:p}${a?o`<div class="fog-wall"></div>`:p}
      <div class="fog-layer">${Array.from({length:c},(d,u)=>l(u,(a?2:6)+u*(a?12:16),[-10,18,-25,30,0,-15,22][u],[120,95,140,85,130,110,100][u],u%3))}</div>
      ${t==="freezing-fog"?o`<div class="ice-air">${Array.from({length:i?8:22},(d,u)=>o`<i style=${`--x:${(u*37+5)%96}%;--y:${8+u*53%80}%;--t:${2.4+u%5*.5}s;--dl:-${u*.7%3}s`}></i>`)}</div>`:p}`}ice(t){return o`<div class=${`ice ${t}`}>${Array.from({length:this.quality==="low"?4:10},(i,a)=>o`<i style=${`--x:${4+(a*17*37+11)%92}%;--dl:-${(a*37+11)%30/10}s`}></i>`)}</div>`}windLines(t=!1){let i=Math.max(this.gust,this.wind*1.6)>=100,a=this.quality==="low"?t?2:4:t?5:i?14:10,s=["M0 20C60 8 120 30 180 18S300 6 400 20","M0 14C80 24 160 4 240 16S340 26 400 12","M0 18C90 10 170 26 260 16C320 10 350 0 340 -8C332 -16 316 -8 324 2","M0 22C70 14 140 24 210 16S330 8 400 18","M0 16C100 22 200 8 290 18C340 24 372 12 364 2C358 -6 344 0 350 8"],l=t?[0,1,3]:[0,1,2,3,4];return o`<div class="wind">${Array.from({length:a},(c,d)=>{let u=(t?3.6:i?1.5:2.3)+d*37%9/10;return o`<div class="wind-line" style=${`--wy:${8+d*29%80}%;--wx:${-10+d*41%45}%;--ww:${55+d*23%45}%;--wt:${u}s;--wd:${-(d*1.7%u).toFixed(2)}s;--wo:${(t?.45:.55)+d%3*(t?.12:.2)}`}>
        <svg viewBox="0 -20 400 50" preserveAspectRatio="none"><path d=${s[l[d%l.length]]}/></svg></div>`})}</div>`}cirrus(){return o`<div class="veil-wash"></div>${[0,1,2].slice(0,this.quality==="low"?2:3).map(t=>o`<div class=${`cirrus c${t}`}></div>`)}`}static flake(t){let i="";for(let a=0;a<6;a++){let s=a*Math.PI/3,l=Math.cos(s),c=Math.sin(s),d=y=>[l*y,c*y],[u,w]=d(t);i+=`M0 0L${u.toFixed(1)} ${w.toFixed(1)}`;for(let[y,S]of[[.42,.3],[.68,.22]]){let[O,C]=d(t*y);for(let W of[-1,1]){let z=s+W*Math.PI/4;i+=`M${O.toFixed(1)} ${C.toFixed(1)}l${(Math.cos(z)*t*S).toFixed(1)} ${(Math.sin(z)*t*S).toFixed(1)}`}}let[f,h]=d(t*.24),[g,x]=[Math.cos(s+Math.PI/3)*t*.24,Math.sin(s+Math.PI/3)*t*.24];i+=`M${f.toFixed(1)} ${h.toFixed(1)}L${(Math.cos(s+Math.PI/6)*t*.36).toFixed(1)} ${(Math.sin(s+Math.PI/6)*t*.36).toFixed(1)}L${g.toFixed(1)} ${x.toFixed(1)}`}return i}static planeTint(t,i){let a=[["#d9a531","#e8b84a","#c76a26"],["#8f9e3e","#e29a34","#b5502a"],["#b64a2b","#c9572f","#7f2c1f"]][t];return F`<linearGradient id=${`nw-plane-${t}-${i}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color=${a[0]}/><stop offset=".55" stop-color=${a[1]}/><stop offset="1" stop-color=${a[2]}/></linearGradient>`}frostPane(){let t=[[372,34,58,.9,8,0],[300,18,34,.75,-12,.8],[404,112,30,.7,20,1.6],[246,52,22,.55,4,2.2],[330,88,18,.6,-6,1.2],[214,16,15,.45,14,2.8],[388,158,13,.45,-10,3.2],[270,108,11,.4,0,2],[176,40,12,.35,22,3.6],[140,12,9,.3,-14,4]],i=[[350,70,16],[262,30,10],[396,60,9],[220,78,7]],a=[[318,52],[244,10],[402,22],[286,74],[196,58]];return o`<svg class="frost-pane" viewBox="0 0 420 170" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
      <defs><radialGradient id=${`nw-bokeh-${this.uid}`}><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${i.map(([s,l,c],d)=>F`<circle class="frost-bokeh" fill=${`url(#nw-bokeh-${this.uid})`} cx=${s} cy=${l} r=${c} style=${`--fd:${d*1.1}s`}/>`)}
      ${t.map(([s,l,c,d,u,w])=>F`<g transform=${`translate(${s} ${l}) rotate(${u})`}><path class="frost-flake" style=${`--fo:${d};--fd:${w}s;stroke-width:${Math.max(1.2,c*.11)}`} d=${L.flake(c)}/></g>`)}
      ${a.map(([s,l],c)=>F`<path class="frost-spark" style=${`--fd:${c*.7}s`} transform=${`translate(${s} ${l})`} d="M0 -6L1.2 -1.2L6 0L1.2 1.2L0 6L-1.2 1.2L-6 0L-1.2 -1.2Z"/>`)}
    </svg>`}static petal(t){return o`<svg class=${`petal petal-${t}`} viewBox="0 0 12 12"><path d="M6 0C10 3 10 9 6 12C2 9 2 3 6 0Z"/></svg>`}static plane(t,i){return o`<svg class=${`plane plane-${t}`} viewBox="0 0 44 44"><defs>${L.planeTint(t,i)}</defs>
      <path class="stem" d="M22 30.5Q23 37 21 42.5"/><path class="blade" fill=${`url(#nw-plane-${t}-${i})`} d="M22 32Q14 34 8 31L4 28.5L7.5 27Q11 25.5 10 22.5L4.5 21L6.5 19.5L1 13L4.5 12.5L3 9Q8 9 10.5 12L11.5 10Q14.5 13 16 16Q15.3 11 16.8 7.6L15.4 6.2L18.8 5.3Q20.8 3.6 22 1Q23.2 3.6 25.2 5.3L28.6 6.2L27.2 7.6Q28.7 11 28 16Q29.5 13 32.5 10L33.5 12Q36 9 41 9L39.5 12.5L43 13L37.5 19.5L39.5 21L34 22.5Q33 25.5 36.5 27L40 28.5L36 31Q30 34 22 32Z"/><path class="veins" d="M22 31V4M22 31Q14 22 3.5 10M22 31Q30 22 40.5 10M22 31Q14 29 5 28.5M22 31Q30 29 39 28.5M22 19L17 13.5M22 19L27 13.5M22 12L19 8.5M22 12L25 8.5M13.5 21.5L8.5 18.5M30.5 21.5L35.5 18.5M10 17L6.5 12.5M34 17L37.5 12.5"/></svg>`}static seed(){return o`<svg class="seed" viewBox="0 0 24 30"><path class="seed-stem" d="M12 29V12"/><ellipse class="seed-body" cx="12" cy="27.5" rx="1.3" ry="2.4"/>
      <path class="seed-rays" d="M12 12L3 6M12 12L5 3M12 12L8 1M12 12L12 0M12 12L16 1M12 12L19 3M12 12L21 6M12 12L1 10M12 12L23 10"/></svg>`}static leaf(t){return o`<svg class=${t?"dry":"gleaf"} viewBox="0 0 28 18"><path d="M2 9C8-2 21 1 27 4C23 17 9 20 2 9Z"/><path d="M0 10 22 6"/></svg>`}blown(t,i){let a=t==="seed"?1.5:t==="petal"?1.15:1,s=t==="plane"?1.4:1;return Array.from({length:this.quality==="low"?2:i},(l,c)=>{let d=h=>{let g=Math.sin((c+1)*91.7+h*47.3)*24634.6345;return g-Math.floor(g)},u=(3.2+d(1)*2.6)*a,w=t==="leaf"||t==="dry",f=t==="petal"?L.petal(c%2):t==="plane"?L.plane(c%3,this.uid):t==="seed"?L.seed():L.leaf(t==="dry");return o`<div class="leaf-track" style=${`--leaf-top:${(18+d(2)*62).toFixed(0)}%;--leaf-delay:${(-d(3)*u).toFixed(2)}s;--leaf-time:${u.toFixed(2)}s`}><div class="leaf-bob" style=${`--bob:${((.7+d(4)*.9)*a).toFixed(2)}s;--lamp:${((6+d(5)*14)*a).toFixed(0)}px;--bd:${(-d(6)*1.5).toFixed(2)}s`}><div class=${`leaf k-${t}`} style=${`--spin:${((.9+d(7)*1.4)*s).toFixed(2)}s;--ls:${(.7+d(8)*.55).toFixed(2)};--lh:${w?((d(9)-.5)*50).toFixed(0):0}deg;--dir:${d(10)<.5?"normal":"reverse"}`}>${f}</div></div></div>`})}seasonal(t,i,a,s,l){let c=this.quality==="low",d=t||i,u=!d&&!s;if(l)return this.season==="spring"?u?this.blown("petal",7):p:this.season==="summer"?u?this.blown("seed",6):p:this.season==="autumn"?!i&&!s?this.blown("plane",5):p:this.season==="winter"?o`${this.frostPane()}${u?this.blown("dry",3):p}`:u?this.blown("leaf",5):p;let w=a||this.wind>=30||this.gust>=Ti,f=(h,g)=>Array.from({length:c?2:h},(x,y)=>o`<div class=${`drift${w?" drift--gusty":""}`} style=${`--dx:${46+y*23%50}%;--dt:${(w?5:11)+y*7%(w?4:7)}s;--dd:${-(y*3.1)%11}s;--rest:${12+y*29%70}%;--sw:${2.6+y%3*.5}s`}><i>${g(y)}</i></div>`);return this.season==="spring"&&!d&&!a&&!s?f(6,h=>L.petal(h%2)):this.season==="autumn"&&!["snowy","snowy-rainy","hail"].includes(this.condition)?f(5,h=>L.plane(h%3,this.uid)):this.season==="summer"&&this.phase==="day"&&["sunny","partlycloudy"].includes(this.condition)?o`<div class="heat">${Array.from({length:c?3:7},(h,g)=>o`<div class="heat-plume" style=${`--hx:${47+g*13%46}%;--hh:${70+g*17%45}px;--hd:${-(g*.9)%4.2}s;--hs:${1.6+g%3*.35}s`}><svg viewBox="0 0 24 120" preserveAspectRatio="none"><defs><linearGradient id=${`nw-heat-${g}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="heat-stop" stop-opacity="0"/><stop offset=".35" class="heat-stop" stop-opacity=".6"/><stop offset="1" class="heat-stop" stop-opacity="0"/></linearGradient></defs><path stroke=${`url(#nw-heat-${g})`} d="M12 120C4 104 20 92 12 76S4 48 12 32S20 10 12 0"/></svg></div>`)}</div>`:this.season==="winter"?this.frostPane():p}render(){let t=this.detail,i=this.quality==="low",a=t==="freezing-rain",s=t==="storm-hail",l=t==="storm-risk",c=["showers","showers-light","snow-showers","sleet-showers","storm-showers"].includes(t),d=["rainy","pouring","lightning-rainy","snowy-rainy","hail"].includes(this.condition)||s,u=this.condition==="hail"||s,w=["snowy","snowy-rainy"].includes(this.condition)&&!a||u,f=["lightning","lightning-rainy"].includes(this.condition),h=f&&!l,g=this.condition==="fog",x=!g&&!["sunny","clear-night","unknown","exceptional"].includes(this.condition),y=["sunny","clear-night","partlycloudy","windy"].includes(this.condition)||c||l,S=["windy","windy-variant"].includes(this.condition)||this.wind>=qa||this.gust>=Fa,O=!S&&(this.wind>=Oa||this.gust>=Ti),C=this.condition==="pouring",W=C||h&&t!=="storm-showers"||u||t==="overcast",z=i?t==="heavy-snow"?14:t==="flurries"?5:8:C?80:u?18:t==="drizzle"?30:t==="showers-light"?20:d?52:t==="flurries"?22:t==="heavy-snow"?160:w?90:20,B=S?-150:C?-85:-38,U=(v,A=z)=>Array.from({length:A},(M,H)=>{let q=V=>{let ne=Math.sin((H+1)*12.9898+V*78.233+v.length*3.1)*43758.5453;return ne-Math.floor(ne)},pt=`--x:${(q(1)*104-2).toFixed(1)}%;--rest:${(q(2)*88).toFixed(0)}%`;if(v==="rain"){let V=q(3)<.45?0:q(3)<.82?1:2,ne=(C?.45:t==="drizzle"?1.5:.8)*(.85+q(4)*.35)*(1+(2-V)*.18),$e=(C?34:t==="drizzle"?10:a?16:22)*(.55+q(5)*.7)*(.7+V*.2),ut=(C?2.4:t==="drizzle"?1.3:1.9)*(.75+V*.2),Li=(S?24:C?15:t==="drizzle"?5:9)+(q(6)-.5)*5;return o`<i class=${`particle rain depth-${V}`} style=${`${pt};--delay:${(-q(7)*ne).toFixed(2)}s;--duration:${ne.toFixed(2)}s;--len:${$e.toFixed(1)}px;--w:${ut.toFixed(2)}px;--rot:${Li.toFixed(1)}deg;--o:${(.5+V*.18+q(8)*.2).toFixed(2)};--drift:${B+(q(9)-.5)*20}px`}></i>`}if(v==="snow"){let V=i?q(3)<.6?1:2:q(3)<.4?0:q(3)<.75?1:q(3)<.93?2:3,ne=[13,10.5,8.5,7][V]*(.85+q(4)*.3)*(t==="heavy-snow"?.6:1),$e=[[2,3.4],[3,5],[4.5,6.5],[6.5,9.5]][V],ut=$e[0]+q(5)*($e[1]-$e[0]);return o`<i class=${`particle snow depth-${V}`} style=${`${pt};--delay:${(-q(7)*ne).toFixed(2)}s;--duration:${ne.toFixed(2)}s;--size:${ut.toFixed(1)}px;--o:${([.5,.62,.72,.78][V]+q(8)*.18).toFixed(2)};--blur:${[.3,.2,.5,1.1][V]}px;--amp:${([3,5,8,11][V]*(.6+q(9)*.8)).toFixed(1)}px;--sw:${(2.2+q(10)*2.5).toFixed(2)}s`}></i>`}let Qt=1.9+H*37%8/10,Ei=4+H%3;return o`<i class=${`particle ${v} depth-${H%3}`} style=${`${pt};--delay:${-(H*13%37)/37*Qt}s;--duration:${Qt}s;--size:${Ei}px;--drift:${B}px;--dx:${(H%2?1:-1)*(5+(H*5*37+11)%8)}px`}></i>`}),K=v=>a?this.ice("glaze"):o`<div class="wet"></div>${t==="drizzle"?p:Array.from({length:i?Math.min(v,5):v},(A,M)=>o`<i class="splash" style=${`--x:${4+(M*11*37+11)%92}%;--d:${1.1+(M*37+11)%7/10}s;--dl:-${(M*3*37+11)%150/100}s`}></i>`)}`,m=o`${d?U("rain",u&&!i?18:z):p}${w?U(u?"hailstone":"snow",u&&!i?s?22:30:z):p}
        ${d?K(C?18:u?8:t==="showers-light"?6:14):p}`;return o`<div class=${`scene ${this.phase} ${this.condition}${t?` detail-${t}`:""}${S?" gale":""}${this.season?` season-${this.season}`:""}`} style=${`--play:${this.animated&&this.visible&&this.pageVisible?"running":"paused"};--cloud-duration:${S?6:Math.max(11,28-Math.min(Math.max(this.wind,0),60)/2.5)}s`} ?data-still=${!this.animated}>
      <div class="weather-art">${this.condition!=="unknown"&&this.condition!=="exceptional"?o`
        ${this.phase==="night"&&y?this.stars(this.quality==="low"?8:this.condition==="partlycloudy"&&t!=="few"?12:24):p}
        ${y?this.phase==="night"?o`<div class="orb moon"><i></i><b></b></div>`:o`<div class="orb sun"><i></i></div>`:p}
        ${W?o`<div class="overcast"></div>${this.cloud("heavy-left")}${i?p:this.cloud("heavy-right")}${t==="overcast"&&!i?this.cloud("back"):p}`:t==="veil"?this.cirrus():t==="few"?this.cloud("front"):x?o`${this.cloud("back")}${this.cloud("front")}${i?p:this.cloud("small")}`:p}
        ${g?this.fog():p}
        ${t==="freezing-fog"?this.ice("rime"):p}
        ${this.condition!=="unknown"?this.seasonal(d,w,f,g,S):p}
        ${c?o`<div class="burst">${m}</div>`:m}
        ${this.condition==="snowy"&&t!=="flurries"?o`<div class="snowbank"><svg viewBox="0 0 400 20" preserveAspectRatio="none"><defs><linearGradient id=${`nw-snowbank-${this.uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe9f4"/></linearGradient></defs>
          <path fill=${`url(#nw-snowbank-${this.uid})`} d="M0 20V11C22 6 40 13 66 9S112 4 140 9 190 14 222 8 276 4 306 10 360 13 400 8V20Z"/></svg>
          ${Array.from({length:i?3:8},(v,A)=>o`<i style=${`--x:${6+(A*13*37+11)%88}%;--dl:-${(A*37+11)%26/10}s`}></i>`)}</div>`:p}
        ${S?this.windLines():O?this.windLines(!0):p}
        ${f?o`${h?Ci.map((v,A)=>o`<div class=${`bolt b${A+1}`} style=${`animation-delay:${v.delay}s`}><svg viewBox="0 0 120 220"><path d=${v.d}/></svg></div>`):p}
          ${Ci.map((v,A)=>o`<div class=${`flash f${A+1}`} style=${`animation-delay:${v.delay}s`}></div>`)}`:p}
      `:p}</div>
    </div>`}};L.styles=T`
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
      .cloud.heavy-left {left:auto;right:30%;width:220px;}.cloud.heavy-right {left:auto;right:-20%;width:240px;}
      .orb {left:var(--nw-orb-x,auto);right:12%;top:var(--nw-orb-y,36px);}.cloud.back {left:auto;right:22%;top:20px;width:170px;}.cloud.front {left:auto;right:0;top:90px;width:150px;}.cloud.small {left:auto;right:-12%;top:6px;width:120px;}
      .bolt.b1 {left:auto;right:18%;}.bolt.b2 {left:auto;right:2%;}.bolt.b3 {left:auto;right:42%;}
      .flash.f1 {--fx:70%;}.flash.f2 {--fx:94%;}.flash.f3 {--fx:48%;}
      .fog-sun {left:auto;right:14%;}
      .frost-pane {width:70%;height:150px;}
    }
    @media(prefers-reduced-motion:reduce) {.scene *,.scene *::before,.scene *::after{animation:none!important;}.snowbank{scale:1 1;}.particle{translate:0 var(--rest);}.drift{top:var(--rest);}.frost-bokeh{opacity:.6;}.bolt.b1{opacity:.8;}.flash{opacity:0;}.burst{opacity:1;}.wind-line{-webkit-mask-position:50% 0;mask-position:50% 0;}}
  `,k([E()],L.prototype,"condition",2),k([E()],L.prototype,"phase",2),k([E()],L.prototype,"quality",2),k([E({type:Boolean})],L.prototype,"animated",2),k([E({type:Number})],L.prototype,"wind",2),k([E({type:Number})],L.prototype,"gust",2),k([E()],L.prototype,"detail",2),k([E()],L.prototype,"season",2),k([P()],L.prototype,"visible",2),k([P()],L.prototype,"pageVisible",2),L=k([J("hestia-weather-sky")],L);var Da={format:"full",show_synthesis:!0,show_bulletin:!0,show_today:!0,show_predictions:!0,collapse_today:!1,collapse_predictions:!1,smart_brief:!0,weather_animations:!0,weather_animation_quality:"standard",show_atmo_details:!0,show_atmo_tomorrow:!0,glass_effect:!0,tile_blocks:["bulletin","events"],forecast_tab:"hours",pressure_span:"6h",wind_span:"6h",rain_span:"7d",clock:"none",now_frame:"opaque"},Na={entry_id:b("Lieu"),format:b("Format"),weather_animations:b("Ciel anim\xE9 et halos"),weather_animation_quality:b("Qualit\xE9 des animations"),glass_effect:b("Effet verre d\xE9poli"),show_synthesis:b("Bandeau (synth\xE8se et m\xE9t\xE9o du moment)"),show_bulletin:b("Bulletin du jour"),smart_brief:b("Alertes et \xE9v\xE9nements"),show_today:b("Section Aujourd\u2019hui"),collapse_today:b("Aujourd\u2019hui repli\xE9 au d\xE9part"),show_predictions:b("Section Pr\xE9visions"),collapse_predictions:b("Pr\xE9visions repli\xE9es au d\xE9part"),show_atmo_details:b("D\xE9tail des polluants et des pollens"),show_atmo_tomorrow:b("Air et pollens de demain"),weather_path:b("Page \xE0 ouvrir"),tile_blocks:b("Contenu de la tuile d\xE9pli\xE9e"),card_blocks:b("Contenu de la carte"),hide_when_calm:b("Seulement en cas d\u2019orage"),forecast_tab:b("Pr\xE9visions affich\xE9es au d\xE9part"),banner_blocks:b("Contenu du bandeau"),today_blocks:b("Contenu d\u2019Aujourd\u2019hui"),forecast_blocks:b("Contenu des Pr\xE9visions"),hold_action:b("Appui long"),tap_action:b("Appui"),pressure_span:b("Courbe de pression"),wind_span:b("Courbe du vent"),rain_span:b("Barres de pluie"),clock:b("Heure dans le bandeau"),now_frame:b("Cadre de \xAB En ce moment \xBB")},Ia={weather_animations:b("Coup\xE9es, le ciel et les halos restent fixes."),weather_animation_quality:b("All\xE9g\xE9e : moins de gouttes, de flocons et de nuages."),glass_effect:b("Le flou demande beaucoup de ressources : \xE0 couper sur un appareil lent. Coup\xE9, le verre devient plus opaque."),smart_brief:b("La vigilance, l\u2019alerte mesur\xE9e chez vous et la frise des \xE9v\xE9nements. Coup\xE9, la frise ne montre que le ciel pr\xE9vu."),weather_path:b("Le chemin de la page, par exemple /meteo ou /lovelace/meteo."),tile_blocks:b("Cochez ce qui s\u2019affiche quand la tuile est d\xE9pli\xE9e, et faites glisser pour changer l\u2019ordre."),banner_blocks:b("Le bandeau et son ciel anim\xE9 restent toujours, avec le lieu, la vigilance et la m\xE9t\xE9o du moment. Cochez ce qu\u2019il montre en dessous, dans l\u2019ordre."),card_blocks:b("Cochez ce que la carte montre."),hide_when_calm:b("Cach\xE9e tant qu\u2019aucun orage n\u2019est \xE0 moins de 30 km ; visible pendant la modification du tableau de bord."),today_blocks:b("Tout d\xE9cocher retire la section."),forecast_blocks:b("Tout d\xE9cocher retire la section."),forecast_tab:b("Un appui sur Heures ou Jours change l\u2019affichage ; ce choix est gard\xE9 sur chaque appareil."),pressure_span:b("Sur plusieurs jours, on voit mieux arriver une d\xE9pression ou un anticyclone."),rain_span:b("24 heures et 30 jours demandent un pluviom\xE8tre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours."),clock:b("L\u2019heure de l\u2019appareil, mise \xE0 jour chaque minute."),now_frame:b("Un cadre de verre derri\xE8re la temp\xE9rature, pour la lire sur le ciel anim\xE9.")},Si="/config/integrations/integration/hestia_weather",ct={large:["full","tile","intermediate"],piece:["comfort","rain","wind","pressure","lightning","air","forecast"],small:["mini","alert"]},Jt=(e="full")=>Object.keys(ct).find(n=>ct[n].includes(e))??"large",oe=class extends D{constructor(){super(...arguments);this.asked=!1;this.computeLabel=t=>t.title??(t.name==="hold_action"&&this.tapped?r("Appui"):r(Na[t.name]??t.name));this.computeHelper=t=>r(Ia[t.name]??"");this.follow=t=>{t.preventDefault(),history.pushState(null,"",t.currentTarget.getAttribute("href")??Si),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}))}}get small(){return!!this.config?.format&&this.config.format!=="full"}get tapped(){return this.config?.format==="mini"||this.config?.format==="alert"}setConfig(t){let i=Ee(t);this.config&&JSON.stringify(i)===JSON.stringify(this.config)||(this.config=i)}shouldUpdate(t){return t.has("hass")&&this.hass&&Me(this.hass.language,this.hass.locale?.language)?!0:(t.has("hass")&&!this.asked&&this.hass&&(this.asked=!0,this.hass.callWS({type:"hestia_weather/entries"}).then(i=>{this.entries=i},()=>{this.entries=null})),!(t.size===1&&t.has("hass")))}changed(t){if(t.stopPropagation(),!this.config)return;let i={...t.detail.value};i.kind&&i.kind!==Jt(this.config.format)&&(i.format=ct[i.kind][0]),delete i.kind,i.format&&i.format!==this.config.format&&(delete i.card_blocks,delete this.config.card_blocks);for(let[a,s]of Object.entries(fn)){let l=i[a],c=this.config[a]??[];Array.isArray(l)&&(i[a]=gn(c,l,s))}this.config=Ee({...this.config,...i}),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:!0,composed:!0}))}schema(){let t=(...m)=>m.map(v=>({name:v,selector:{boolean:{}}})),i=(m,v,A,M=!1)=>({type:"expandable",name:"",title:m,icon:v,flatten:!0,expanded:M,schema:A}),a={name:"kind",title:r("Type de carte"),required:!0,selector:{select:{mode:"list",options:[{value:"large",label:r("Grandes cartes : la page m\xE9t\xE9o et la tuile")},{value:"piece",label:r("Cartes \xE0 la pi\xE8ce : ressenti, pluie, vent, pression, \xE9clairs, air, pr\xE9visions")},{value:"small",label:r("Petites cartes : une ligne ou une alerte")}]}}},s=[{value:"full",label:r("Compl\xE8te : la page m\xE9t\xE9o")},{value:"tile",label:r("Tuile : une bande qui se d\xE9plie d\u2019un appui")},{value:"intermediate",label:r("Tuile d\xE9pli\xE9e : la m\xEAme, ouverte au d\xE9part")},{value:"mini",label:r("Mini : une seule ligne")},{value:"comfort",label:r("Ressenti : la temp\xE9rature per\xE7ue")},{value:"rain",label:r("Pluie : \xE0 venir et tomb\xE9e")},{value:"wind",label:r("Vent : le vent du moment et sa courbe")},{value:"pressure",label:r("Pression : la pression et sa courbe")},{value:"lightning",label:r("\xC9clairs : le radar des orages (Blitzortung)")},{value:"air",label:r("Air et pollens : aujourd\u2019hui et demain")},{value:"forecast",label:r("Pr\xE9visions : les heures et les jours")},{value:"alert",label:r("Alerte : visible seulement en cas de vigilance ou d\u2019alerte")}],l=ct[Jt(this.config?.format)],c=[a,{name:"format",required:!0,selector:{select:{mode:"dropdown",options:l.map(m=>s.find(v=>v.value===m))}}}],d={name:"tile_blocks",selector:{select:{multiple:!0,reorder:!0,mode:"list",options:[{value:"bulletin",label:r("Bulletin du jour")},{value:"events",label:r("\xC9v\xE9nements (la frise)")},{value:"moments",label:r("Les prochains moments (soir, nuit, matin\u2026)")},{value:"forecast",label:r("Pr\xE9visions (heures ou jours)")}]}}},u={name:"forecast_tab",selector:{select:{mode:"dropdown",options:[{value:"hours",label:r("Heures")},{value:"days",label:r("Jours")}]}}},w=this.config?.format==="tile"||this.config?.format==="intermediate",f=this.config?.hold_action??(this.config?.weather_path?"page":"popup"),h=w?this.config?.tap_action??"toggle":void 0,g=m=>({name:m,required:!0,selector:{select:{mode:"dropdown",options:[...w?[{value:"toggle",label:r("D\xE9plier ou replier la tuile")}]:[],{value:"popup",label:r("Ouvrir la m\xE9t\xE9o compl\xE8te en fen\xEAtre")},{value:"page",label:r("Ouvrir une page")},{value:"none",label:r("Rien")}]}}}),x=[...w?[g("tap_action")]:[],g("hold_action"),...f==="page"||h==="page"?[{name:"weather_path",selector:{text:{}}}]:[]],y=this.entries&&this.entries.length>1?[{name:"entry_id",selector:{select:{options:this.entries.map(m=>({value:m.entry_id,label:m.title}))}}}]:[],S=i(r("Visuel et performance"),"mdi:palette-outline",[...t("weather_animations"),{name:"weather_animation_quality",required:!0,selector:{select:{mode:"dropdown",options:[{value:"standard",label:r("Standard")},{value:"low",label:r("All\xE9g\xE9e")}]}}},...t("glass_effect")],!0),O=[["6h",r("6 derni\xE8res heures")],["1d",r("24 derni\xE8res heures")],["2d",r("2 derniers jours")],["7d",r("7 derniers jours")]],C=(m,v)=>({name:m,required:!0,selector:{select:{mode:"dropdown",options:v.map(([A,M])=>({value:A,label:M}))}}}),W=this.config?.format;if(W==="mini"||W==="alert")return[...y,...c,i(r("Fonctionnalit\xE9s"),"mdi:tune-variant",x,!0)];let z=(m,v=!1)=>({name:"card_blocks",selector:{select:{multiple:!0,reorder:v,mode:"list",options:m.map(([A,M])=>({value:A,label:M}))}}}),B=(m,...v)=>[...y,...c,i(r("Contenu"),"mdi:view-list-outline",[m,...v],!0)],U=this.config?ze(this.config):[];if(W==="comfort")return B(z([["feel",r("Le ressenti et son explication")],["gauge",r("La jauge de \u22125 \xE0 45 \xB0C")],["factors",r("Ce qui le fait varier (humidit\xE9, vent, soleil)")],["extras",r("Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)")]]));if(W==="rain")return B(z([["ahead",r("\xC0 venir : la prochaine heure et les 6 heures")],["now",r("Tomb\xE9e aujourd\u2019hui, et en ce moment")],["chart",r("Les barres de pluie")],["stats",r("Les cumuls")]]),C("rain_span",[["24h",r("24 derni\xE8res heures (une barre par heure)")],["7d",r("7 derniers jours")],["30d",r("30 derniers jours (une barre par jour)")]]));if(W==="wind")return B(z([["ahead",r("\xC0 venir : le vent le plus fort des 6 heures")],["now",r("Le vent du moment et sa direction")],["chart",r("La courbe")],["stats",r("Rafales, direction et maximum du jour")]]),C("wind_span",O));if(W==="pressure")return B(z([["ahead",r("\xC0 venir : la pression des 6 heures, si votre fournisseur la pr\xE9voit")],["now",r("La pression et sa tendance")],["chart",r("La courbe")],["stats",r("Les valeurs pass\xE9es, le minimum et le maximum")]]),C("pressure_span",O));if(W==="lightning")return B(z([["ahead",r("\xC0 venir : un orage pr\xE9vu dans les 6 heures")],["now",r("L\u2019\xE9clair le plus proche et sa direction")],["radar",r("Le radar et le niveau")],["stats",r("Les comptes (heure, 10 minutes, mois)")]]),...t("hide_when_calm"));if(W==="air")return B(z([["air_today",r("Air ext\xE9rieur aujourd\u2019hui")],["pollen_today",r("Pollens aujourd\u2019hui")],["air_tomorrow",r("Air ext\xE9rieur demain")],["pollen_tomorrow",r("Pollens demain")]],!0),...t("show_atmo_details"));if(W==="forecast")return B(z([["hours",r("Les 18 prochaines heures")],["days",r("Les 7 prochains jours")]]),...U.includes("hours")&&U.includes("days")?[u]:[]);if(this.small)return[...y,...c,S,i(r("Contenu"),"mdi:view-list-outline",[d,...(this.config?.tile_blocks??[]).includes("forecast")?[u]:[]],!0),i(r("Fonctionnalit\xE9s"),"mdi:tune-variant",x)];let K=(m,v)=>({name:m,selector:{select:{multiple:!0,reorder:!0,mode:"list",options:v.map(([A,M])=>({value:A,label:M}))}}});return[...y,...c,S,i(r("Bandeau intelligent"),"mdi:view-day-outline",[K("banner_blocks",[["bulletin",r("Bulletin du jour")],["events",r("\xC9v\xE9nements (la frise)")],["moments",r("Les prochains moments (soir, nuit, matin\u2026)")],["forecast",r("Pr\xE9visions en tuiles (heures ou jours)")]]),C("clock",[["none",r("Masqu\xE9e")],["left",r("Sous le titre, en grand")],["right",r("Au-dessus de \xAB En ce moment \xBB")]]),C("now_frame",[["opaque",r("Opaque")],["clear",r("Transparent")],["none",r("Sans cadre")]])],!0),i(r("Aujourd\u2019hui"),"mdi:calendar-today",[K("today_blocks",[["rain",r("Pluie")],["wind",r("Vent")],["pressure",r("Pression")],["lightning",r("\xC9clairs (avec Blitzortung)")],["comfort",r("Ressenti")],["extras",r("Pastilles (humidit\xE9, ros\xE9e, soleil\u2026)")],["air",r("Air et pollens du jour")]]),C("rain_span",[["24h",r("24 derni\xE8res heures (une barre par heure)")],["7d",r("7 derniers jours")],["30d",r("30 derniers jours (une barre par jour)")]]),C("wind_span",O),C("pressure_span",O),...t("collapse_today")]),i(r("Pr\xE9visions"),"mdi:calendar-week",[K("forecast_blocks",[["hours",r("Les 18 prochaines heures")],["days",r("Les 7 prochains jours")],["air",r("Air et pollens de demain")]]),...t("collapse_predictions")]),i(r("Air et pollens"),"mdi:flower-pollen-outline",t("show_atmo_details"))]}render(){if(!this.config||!this.hass)return p;let t=Ze(this.config),i={...this.config.show_bulletin===!1?{tile_blocks:["events"]}:{},banner_blocks:t.banner,today_blocks:t.today,forecast_blocks:t.forecasts,card_blocks:ze(this.config)},a={tap_action:"toggle",hold_action:this.config.weather_path?"page":"popup"},s=Object.fromEntries(Object.entries({...Da,...a,...i,...this.config,kind:Jt(this.config.format)}).filter(([c])=>c!=="type")),l=this.entries?.length===1?this.entries[0]:void 0;return o`
      ${this.entries===null?o`<p class="note warn">${r("L\u2019int\xE9gration Hestia Weather ne r\xE9pond pas : la carte en a besoin depuis la version 2.0.")}
          ${r("D\xE9j\xE0 t\xE9l\xE9charg\xE9e ?")} <a href="/config/integrations/dashboard/add?domain=hestia_weather" @click=${this.follow}>${r("Ajoutez-la")}</a>.
          ${r("Sinon,")} <a href="https://github.com/hestiaFB/hestia-weather-integration#installation" target="_blank" rel="noopener noreferrer">${r("installez-la")}</a>.</p>`:this.entries?.length===0?o`<p class="note warn">${r("Ajoutez l\u2019int\xE9gration Hestia Weather : Param\xE8tres \u2192 Appareils et services.")}</p>`:o`<p class="note">${l?o`${r("Lieu :")} <b>${l.title}</b>. `:p}${r("Les sources (pr\xE9visions, station, air et pollens) se r\xE8glent dans")}
          <a href=${Si} @click=${this.follow}>${r("l\u2019int\xE9gration Hestia Weather")}</a>.</p>`}
      <ha-form .hass=${this.hass} .data=${s} .schema=${this.schema()} .computeLabel=${this.computeLabel} .computeHelper=${this.computeHelper} @value-changed=${this.changed}></ha-form>`}};oe.styles=T`
    .note { color:var(--secondary-text-color); font-size:var(--nw-fs-small,12px); line-height:1.6; margin:0 0 16px; }
    .note.warn { color:var(--primary-text-color); }
    a { color:var(--primary-color); }
  `,k([E({attribute:!1})],oe.prototype,"hass",2),k([P()],oe.prototype,"config",2),k([P()],oe.prototype,"entries",2),oe=k([J("hestia-weather-card-editor")],oe);var _i=500,Va=matchMedia("(pointer: coarse)"),Ua=0;if(!document.getElementById("hestia-hub-fonts")){let e=document.createElement("style");e.id="hestia-hub-fonts",e.textContent=[400,500,600,700].map(n=>`@font-face{font-family:Manrope;src:url('/hestia_weather-assets/manrope-${n}.ttf');font-weight:${n};font-display:swap}`).join(""),document.head.append(e)}if(!document.getElementById("hestia-light-fonts")){let e=document.createElement("style");e.id="hestia-light-fonts",e.textContent="@font-face{font-family:Manrope;src:url('/hestia_weather-assets/manrope-variable.ttf') format('truetype');font-weight:200 300;font-display:swap}",document.head.append(e)}var Pi={missing:{title:b("Hestia Weather a besoin de son int\xE9gration"),text:b("Depuis la version 2.0, la carte re\xE7oit ses calculs de l\u2019int\xE9gration Hestia Weather. D\xE9j\xE0 t\xE9l\xE9charg\xE9e depuis HACS ? Ajoutez-la dans Param\xE8tres \u2192 Appareils et services. Sinon, installez-la depuis HACS, red\xE9marrez Home Assistant, puis ajoutez-la. D\xE9j\xE0 ajout\xE9e ? Elle n\u2019a pas d\xE9marr\xE9 : les journaux disent pourquoi (Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB)."),links:[[b("Ajouter l\u2019int\xE9gration"),"/config/integrations/dashboard/add?domain=hestia_weather"],[b("L\u2019installer"),"https://github.com/hestiaFB/hestia-weather-integration#installation"]]},not_configured:{title:b("Ajoutez l\u2019int\xE9gration Hestia Weather"),text:b("Elle est install\xE9e mais pas encore configur\xE9e. Elle peut reprendre les r\xE9glages de vos cartes."),links:[[b("Ajouter l\u2019int\xE9gration"),"/config/integrations/dashboard/add?domain=hestia_weather"]]},choose_entry:{title:b("Choisissez un lieu"),text:b("Plusieurs lieux Hestia Weather sont configur\xE9s : choisissez celui de cette carte dans ses r\xE9glages.")},not_found:{title:b("Lieu introuvable"),text:b("Le lieu de cette carte n\u2019existe plus : choisissez-en un autre dans ses r\xE9glages.")},version:{title:b("Rechargez la page"),text:b("L\u2019int\xE9gration Hestia Weather vient d\u2019\xEAtre mise \xE0 jour : rechargez la page pour afficher sa carte.")},error:{title:b("L\u2019int\xE9gration Hestia Weather a renvoy\xE9 une erreur"),text:b("Les journaux de Home Assistant disent pourquoi : Param\xE8tres \u2192 Syst\xE8me \u2192 Journaux, cherchez \xAB weather \xBB."),links:[[b("Voir les journaux"),"/config/logs"]]}},I=class extends D{constructor(){super(...arguments);this.editMode=!1;this.preview=!1;this.tab="hours";this.failure="";this.open=!1;this.dialogOpen=!1;this.folded={today:!1,predictions:!1};this.airTomorrow={air:!1,pollen:!1};this.uid=`nw${++Ua}`;this.setTab=t=>{this.tab=t;try{localStorage.setItem(`hestia-weather:tab:${this.config?.entry_id??""}`,t)}catch{}};this.picker=!1;this.follow=t=>{let i=t.currentTarget.getAttribute("href");i?.startsWith("/")&&(t.preventDefault(),this.go(i))};this.down=t=>{let i=this.tileCard();if(t.button!==0||!i)return;this.cancelPress();let a=i.querySelector(".press-ring"),s=i.getBoundingClientRect(),l=performance.now();a?.style.setProperty("left",`${t.clientX-s.left}px`),a?.style.setProperty("top",`${t.clientY-s.top}px`);let c=()=>{let u=Math.min(1,(performance.now()-l)/_i);a?.style.setProperty("--p",String(u)),i.classList.toggle("pressing",u>.15),u<1&&this.press&&(this.press.frame=requestAnimationFrame(c))},d=this.holdTarget!=="none";this.press={x:t.clientX,y:t.clientY,long:!1,frame:d?requestAnimationFrame(c):0,timer:setTimeout(()=>{!this.press||!d||(this.press.long=!0,this.stopRing(),this.act(this.holdTarget))},_i)}};this.move=t=>{this.press&&Math.hypot(t.clientX-this.press.x,t.clientY-this.press.y)>10&&this.cancelPress()};this.up=()=>{let t=this.press;this.cancelPress(),t&&!t.long&&this.act(this.tapTarget)};this.cancelPress=()=>{this.stopRing(),this.press=void 0};this.noMenu=t=>t.preventDefault();this.tileKey=t=>{t.target!==this.tileCard()||!["Enter"," "].includes(t.key)||(t.preventDefault(),this.act(t.shiftKey?this.holdTarget:this.tapTarget))};this.tap=t=>{t.target.closest("dialog")||this.act(this.holdTarget)};this.tapKey=t=>{!["Enter"," "].includes(t.key)||t.target.closest("dialog")||this.holdTarget==="none"||(t.preventDefault(),this.act(this.holdTarget))};this.closeDialog=()=>{this.renderRoot.querySelector("dialog")?.close()};this.openEntity=t=>{let i=t.composedPath().find(a=>a instanceof HTMLElement&&a.hasAttribute("data-entity"));!i||i.closest(".nw-tilecard")||(this.closeDialog(),this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:i.getAttribute("data-entity")},bubbles:!0,composed:!0})))};this.entityKey=t=>{!["Enter"," "].includes(t.key)||!(t.target instanceof HTMLElement)||!t.target.hasAttribute("data-entity")||(t.preventDefault(),this.openEntity(t))}}setConfig(t){let i=Ee(t),a=this.config;a&&JSON.stringify(a)===JSON.stringify(i)||(this.config=i,(!a||a.collapse_today!==i.collapse_today||a.collapse_predictions!==i.collapse_predictions)&&(this.folded={today:i.collapse_today===!0,predictions:i.collapse_predictions===!0}),(!a||a.format!==i.format||a.entry_id!==i.entry_id)&&(this.open=this.remembered(i)),(!a||a.forecast_tab!==i.forecast_tab||a.entry_id!==i.entry_id)&&(this.tab=this.rememberedTab(i)),a&&a.entry_id!==i.entry_id&&(this.unsubscribe(),this.view=void 0,this.problem=void 0))}static getStubConfig(){return{type:"custom:hestia-weather-card"}}static getConfigElement(){return document.createElement("hestia-weather-card-editor")}getCardSize(){return this.config?this.config.format==="mini"?1:this.config.format==="alert"?this.view&&this.hasAlert(this.view)?2:0:this.config.format==="forecast"||this.config.format==="rain"||this.config.format==="air"?5:this.single?this.config.format==="comfort"?3:4:this.tile?this.unfolded?7:2:Math.max(1,(this.config.show_synthesis===!1?0:4)+(this.config.show_today===!1?0:5)+(this.config.show_predictions===!1?0:4)):10}getGridOptions(){let t=this.config?.format;return t==="mini"?{columns:12,rows:1,min_columns:3}:this.tile||this.single||t==="alert"?{columns:12,rows:"auto",min_columns:6}:{columns:"full",rows:"auto"}}get single(){return["comfort","rain","wind","pressure","lightning","air","forecast"].includes(this.config?.format??"")}calm(t){return this.config?.format==="lightning"&&this.config.hide_when_calm===!0&&!!t.lightning&&t.lightning.step===0}get unfolded(){return this.tapTarget==="toggle"||this.holdTarget==="toggle"?this.open:this.config?.format==="intermediate"}get tile(){return this.config?.format==="tile"||this.config?.format==="intermediate"}hasAlert(t){let{alerts:i,points:a}=Rt(t);return i.length+a.length>0}rememberedTab(t){try{let i=localStorage.getItem(`hestia-weather:tab:${t.entry_id??""}`);if(i==="hours"||i==="days")return i}catch{}return t.forecast_tab??"hours"}key(t=this.config){return`hestia-weather:open:${t.format}:${t.entry_id??t.weather_entity??""}`}remembered(t){try{let i=localStorage.getItem(this.key(t));if(i!==null)return i==="1"}catch{}return t.format==="intermediate"}connectedCallback(){super.connectedCallback(),this.picker=this.inPicker(),this.subscribe(),this.unwatch=Ai(this)}inPicker(){for(let t=this;t;t=t.parentNode??(t instanceof ShadowRoot?t.host:null))if(t instanceof HTMLElement&&t.localName==="hui-card-picker")return!0;return!1}get editing(){return this.editMode||this.preview||this.picker}disconnectedCallback(){super.disconnectedCallback(),this.unwatch?.(),this.cancelPress(),this.unsubscribe()}shouldUpdate(t){(t.has("hass")||t.has("config"))&&this.subscribe();let i=this.hass&&`${this.hass.language}|${this.hass.locale?.language??""}`;return i&&i!==this.language?(this.language=i,Me(this.hass.language,this.hass.locale?.language),!0):!(t.size===1&&t.has("hass"))}updated(){this.toggleAttribute("hidden",!!this.view&&!this.editing&&(this.config?.format==="alert"&&!this.hasAlert(this.view)||this.calm(this.view))),this.toggleAttribute("still",this.config?.weather_animations===!1),this.toggleAttribute("flat",this.config?.glass_effect===!1);let t=this.renderRoot.querySelector("dialog");t&&this.dialogOpen&&!t.open&&t.showModal()}subscribe(){let t=this.hass?.connection,i=this.config;if(!t||!i||!this.isConnected)return;let a=`${i.entry_id??""}|${this.hass?.language??""}`;if(this.subscription&&this.subscribedTo===a)return;this.unsubscribe(),this.subscribedTo=a;let s=t.subscribeMessage(l=>this.receive(l),{type:"hestia_weather/subscribe",language:this.hass?.language,...i.entry_id?{entry_id:i.entry_id}:{}});this.subscription=s,s.catch(l=>{if(this.subscription!==s)return;this.subscription=void 0;let c=l?.code;this.failure=[l?.message,c].filter(Boolean).join(" \xB7 "),this.problem=c==="not_configured"||c==="choose_entry"||c==="not_found"?c:!c||c==="unknown_command"?"missing":"error",c!=="choose_entry"&&this.retryLater(c==="unknown_command"?3e4:5e3)})}receive(t){if("reload"in t){this.unsubscribe(),this.retryLater(2e3);return}if(t.version!==1){this.problem="version";return}this.problem=void 0,this.view=t.view}unsubscribe(){clearTimeout(this.retry);let t=this.subscription;this.subscription=void 0,this.subscribedTo=void 0,t?.then(i=>i()).catch(()=>{})}retryLater(t){clearTimeout(this.retry),this.retry=setTimeout(()=>this.subscribe(),t)}render(){if(!this.config)return p;if(this.problem&&!this.view)return this.renderProblem(Pi[this.problem]);if(!this.view)return o`<ha-card><div class=${`nw-wait${this.config.format==="mini"?" line":""}`} role="status" aria-label=${r("Chargement de la m\xE9t\xE9o")}>
      <i class="dot"></i><i></i><i></i><i></i></div></ha-card>`;let t=this.config,i=wn(this.view,t,this.tile),s=i.wind?.gust.at(-1)?.[1]??i.hours[0]?.gust??0,l=o`<hestia-weather-sky .condition=${i.now.condition} .phase=${i.now.phase} .animated=${t.weather_animations!==!1}
      .quality=${t.weather_animation_quality??(this.tile&&Va.matches?"low":"standard")} .wind=${i.now.wind??0} .gust=${s} .detail=${i.now.detail??""} .season=${i.season.info.season}></hestia-weather-sky>`,c=()=>yi(i,{sky:l,uid:this.uid,entity:i.weatherEntity,station:i.station,sections:Ze(t),tab:this.tab,onTab:this.setTab,clock:t.clock,nowFrame:t.now_frame,folded:this.folded,onFold:h=>{this.folded={...this.folded,[h]:!this.folded[h]}},air:{tomorrow:this.airTomorrow,onDay:(h,g)=>{this.airTomorrow={...this.airTomorrow,[h]:g}}}}),d=`${r("M\xE9t\xE9o")}${i.location?` \xB7 ${i.location}`:""}`,u=()=>this.dialogOpen?o`<dialog class="nw-dialog" aria-label=${d} @close=${()=>{this.dialogOpen=!1}} @click=${this.openEntity} @keydown=${this.entityKey}>
        <header><b>${d}</b><button type="button" @click=${this.closeDialog}>${r("Fermer")}</button></header>${c()}</dialog>`:p,w=this.holdTarget;switch(t.format){case"mini":return o`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${Gn(i,w)}</div>${u()}</ha-card>`;case"alert":{let h=Jn(i,this.editing);return h===p?p:o`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${h}</div>${u()}</ha-card>`}}if(this.single)return o`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${gi(i,t.format,ze(t),{uid:this.uid,entity:i.weatherEntity,station:i.station,tab:this.tab,onTab:this.setTab})}</ha-card>`;if(!this.tile)return o`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${c()}</ha-card>`;let f=t.tile_blocks?.length?t.tile_blocks:t.show_bulletin===!1?["events"]:In;return o`<ha-card>
      <div @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.up} @pointercancel=${this.cancelPress} @pointerleave=${this.cancelPress}
        @contextmenu=${this.noMenu} @keydown=${this.tileKey}>
        ${Hn(i,l,{open:this.unfolded,tapTarget:this.tapTarget,holdTarget:w,blocks:f,tab:this.tab,onTab:this.setTab})}</div>
      ${u()}
    </ha-card>`}renderProblem(t){return o`<ha-card><div class="nw-problem" role="status"><ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
      <div><b>${r(t.title)}</b>${t===Pi.error&&this.failure?o`<p class="failure">« ${this.failure} »</p>`:p}<p>${r(t.text)}</p>${t.links?o`<div class="links">${t.links.map(([i,a],s)=>o`<a class=${s?"second":""} href=${a}
        target=${a.startsWith("/")?p:"_blank"} rel="noopener noreferrer" @click=${this.follow}>${r(i)}</a>`)}</div>`:p}</div></div></ha-card>`}go(t){history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}))}get holdTarget(){return this.target(this.config?.hold_action??(this.weatherPath?"page":"popup"))}get tapTarget(){return this.target(this.config?.tap_action??"toggle")}target(t){return t==="none"?"none":t==="toggle"?this.tile?"toggle":"card":t==="page"&&this.weatherPath?"page":"card"}get weatherPath(){let t=this.config?.weather_path;return t?.startsWith("/")&&!t.startsWith("//")?t:void 0}tileCard(){return this.renderRoot.querySelector(".nw-tilecard")}stopRing(){this.press&&(clearTimeout(this.press.timer),cancelAnimationFrame(this.press.frame),this.tileCard()?.classList.remove("pressing"))}toggle(){this.open=!this.open;try{localStorage.setItem(this.key(),this.open?"1":"0")}catch{}}act(t){let i=this.weatherPath;t==="toggle"?this.toggle():t==="page"&&i?this.go(i):t==="card"&&(this.dialogOpen=!0)}};I.styles=[vn,ve,xn,yn,Vn,ti,vi,$i,fi,Kn,ri,wi,si,ki,T`
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
  `],k([E({attribute:!1})],I.prototype,"hass",2),k([E({attribute:!1})],I.prototype,"editMode",2),k([E({attribute:!1})],I.prototype,"preview",2),k([P()],I.prototype,"config",2),k([P()],I.prototype,"tab",2),k([P()],I.prototype,"view",2),k([P()],I.prototype,"problem",2),k([P()],I.prototype,"open",2),k([P()],I.prototype,"dialogOpen",2),k([P()],I.prototype,"folded",2),k([P()],I.prototype,"airTomorrow",2),I=k([J("hestia-weather-card")],I);var Ka=["full","tile","intermediate","mini","comfort","rain","wind","pressure","lightning","air","forecast","alert"],zi=e=>e==="full"?"hestia-weather-card":`hestia-weather-${e==="intermediate"?"tile-open":e}-card`;for(let e of Ka){let n=zi(e);e!=="full"&&!customElements.get(n)&&customElements.define(n,class extends I{static getStubConfig(){return{type:"custom:hestia-weather-card",format:e}}setConfig(t){super.setConfig({format:e,...t})}})}var Ga=[["full",b("Hestia - M\xE9t\xE9o"),b("La page m\xE9t\xE9o compl\xE8te ou la tuile qui se d\xE9plie. Le format se choisit dans les r\xE9glages.")],["comfort",b("Hestia - \xC0 la pi\xE8ce"),b("Une seule partie : ressenti, pluie, vent, pression, \xE9clairs, air et pollens ou pr\xE9visions.")],["mini",b("Hestia - Petite carte"),b("Une seule ligne, ou une alerte visible seulement en cas de vigilance.")]];Tn();window.customCards=window.customCards||[];for(let[e,n,t]of Ga){let i=zi(e);window.customCards.some(a=>a.type===i)||window.customCards.push({type:i,name:r(n),description:r(t),preview:!0})}})();
