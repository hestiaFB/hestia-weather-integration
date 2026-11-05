import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from './ui/define';
import { cardBlocks, cleanConfig, sections } from './config';
import { displayed } from './display';
import { bubbles, pieces, tokens, shared } from './ui/charter';
import { DEFAULT_BLOCKS, renderTile, tileStyles, type PressTarget } from './views/tile';
import { alertItems, compactStyles, renderAlert, renderMini } from './views/compact';
import { renderSingle, singleStyles, type SingleFormat } from './views/single';
import { fullStyles, renderFull, type SectionId } from './views/full';
import { heroStyles } from './views/hero';
import { todayStyles } from './views/today';
import { forecastStyles } from './views/forecasts';
import { airStyles } from './views/air';
import { lightningStyles } from './views/lightning';
import { traitStyles } from './ui/trait';
import { marqueeStyles } from './ui/marquee';
import { watchOffscreen } from './ui/offscreen';
import './ui/weather-sky';
import './editor/hestia-weather-card-editor';
import { VIEW_VERSION, type ViewMessage, type WeatherView } from './view';
import type { HomeAssistant, PressAction, WeatherCardConfig } from './types';
import { fr, guessLanguage, setLanguage, t } from './i18n';

const HOLD_MS = 500;
/** Phones and tablets: unless set otherwise, the tile's sky is lightened (fewer drops, clouds and leaves); its drawing is scaled down there anyway. */
const LIGHT_SKY = matchMedia('(pointer: coarse)');
let instances = 0;
// Manrope, the cards' font (the « Trait » style), declared once in the page from the integration's files, as the hub does;
// its light weights, for the large thin figures, from the variable font.
if (!document.getElementById('hestia-hub-fonts')) {
  const style = document.createElement('style'); style.id = 'hestia-hub-fonts';
  style.textContent = [400, 500, 600, 700].map((w) => `@font-face{font-family:Manrope;src:url('/hestia_weather-assets/manrope-${w}.ttf');font-weight:${w};font-display:swap}`).join('');
  document.head.append(style);
}
if (!document.getElementById('hestia-light-fonts')) {
  const style = document.createElement('style'); style.id = 'hestia-light-fonts';
  style.textContent = "@font-face{font-family:Manrope;src:url('/hestia_weather-assets/manrope-variable.ttf') format('truetype');font-weight:200 300;font-display:swap}";
  document.head.append(style);
}

/** Why there is no weather to show, and what to do about it. Written in French, shown through t(). */
type Problem = 'missing' | 'not_configured' | 'choose_entry' | 'not_found' | 'version' | 'error';
const PROBLEMS: Record<Problem, { title: string; text: string; links?: [string, string][] }> = {
  // Home Assistant only starts an integration once it is added: downloaded from HACS but not added yet, it does not answer either.
  missing: { title: fr('Hestia Weather a besoin de son intégration'),
    text: fr('Depuis la version 2.0, la carte reçoit ses calculs de l’intégration Hestia Weather. Déjà téléchargée depuis HACS ? Ajoutez-la dans Paramètres → Appareils et services. Sinon, installez-la depuis HACS, redémarrez Home Assistant, puis ajoutez-la. Déjà ajoutée ? Elle n’a pas démarré : les journaux disent pourquoi (Paramètres → Système → Journaux, cherchez « weather »).'),
    links: [[fr('Ajouter l’intégration'), '/config/integrations/dashboard/add?domain=hestia_weather'], [fr('L’installer'), 'https://github.com/hestiaFB/hestia-weather-integration#installation']] },
  not_configured: { title: fr('Ajoutez l’intégration Hestia Weather'),
    text: fr('Elle est installée mais pas encore configurée. Elle peut reprendre les réglages de vos cartes.'),
    links: [[fr('Ajouter l’intégration'), '/config/integrations/dashboard/add?domain=hestia_weather']] },
  choose_entry: { title: fr('Choisissez un lieu'), text: fr('Plusieurs lieux Hestia Weather sont configurés : choisissez celui de cette carte dans ses réglages.') },
  not_found: { title: fr('Lieu introuvable'), text: fr('Le lieu de cette carte n’existe plus : choisissez-en un autre dans ses réglages.') },
  version: { title: fr('Rechargez la page'), text: fr('L’intégration Hestia Weather vient d’être mise à jour : rechargez la page pour afficher sa carte.') },
  // The integration answered, with an error: say which, it tells what went wrong.
  error: { title: fr('L’intégration Hestia Weather a renvoyé une erreur'),
    text: fr('Les journaux de Home Assistant disent pourquoi : Paramètres → Système → Journaux, cherchez « weather ».'), links: [[fr('Voir les journaux'), '/config/logs']] },
};

@define('hestia-weather-card')
export class HestiaWeatherCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  /** Set by Home Assistant while the dashboard is edited, and in the card picker: the alert card then shows when it would hide. */
  @property({ attribute: false }) public editMode = false;
  @property({ attribute: false }) public preview = false;
  @state() private config?: WeatherCardConfig;
  /** The forecasts on the hours or the days (remembered on this device). */
  @state() private tab: 'hours' | 'days' = 'hours';
  /** What the integration computed, as it last sent it. */
  @state() private view?: WeatherView;
  @state() private problem?: Problem;
  /** The integration's own words when it answered with an error. */
  private failure = '';
  /** The tile is unfolded (remembered on this device). */
  @state() private open = false;
  /** The full card is shown over the page, after a long press on the tile. */
  @state() private dialogOpen = false;
  @state() private folded: Record<SectionId, boolean> = { today: false, predictions: false };
  /** The air and pollens panels show tomorrow (a tap on their tab). */
  @state() private airTomorrow: Record<'air' | 'pollen', boolean> = { air: false, pollen: false };
  private readonly uid = `nw${++instances}`;
  private subscription?: Promise<() => Promise<void>>;
  private subscribedTo?: string;
  private retry?: ReturnType<typeof setTimeout>;
  private press?: { x: number; y: number; long: boolean; timer: ReturnType<typeof setTimeout>; frame: number };

  public setConfig(config: WeatherCardConfig): void {
    const next = cleanConfig(config), old = this.config;
    if (old && JSON.stringify(old) === JSON.stringify(next)) return;
    this.config = next;
    if (!old || old.collapse_today !== next.collapse_today || old.collapse_predictions !== next.collapse_predictions)
      this.folded = { today: next.collapse_today === true, predictions: next.collapse_predictions === true };
    if (!old || old.format !== next.format || old.entry_id !== next.entry_id) this.open = this.remembered(next);
    if (!old || old.forecast_tab !== next.forecast_tab || old.entry_id !== next.entry_id) this.tab = this.rememberedTab(next);
    // Another place: its own view, from a new subscription.
    if (old && old.entry_id !== next.entry_id) { this.unsubscribe(); this.view = undefined; this.problem = undefined; }
  }
  public static getStubConfig(): WeatherCardConfig { return { type: 'custom:hestia-weather-card' }; }
  public static getConfigElement(): HTMLElement { return document.createElement('hestia-weather-card-editor'); }
  public getCardSize(): number {
    if (!this.config) return 10;
    if (this.config.format === 'mini') return 1;
    if (this.config.format === 'alert') return this.view && this.hasAlert(this.view) ? 2 : 0;
    if (this.config.format === 'forecast' || this.config.format === 'rain' || this.config.format === 'air') return 5;
    if (this.single) return this.config.format === 'comfort' ? 3 : 4;
    if (this.tile) return this.unfolded ? 7 : 2;
    return Math.max(1, (this.config.show_synthesis === false ? 0 : 4) + (this.config.show_today === false ? 0 : 5) + (this.config.show_predictions === false ? 0 : 4));
  }
  public getGridOptions() {
    const format = this.config?.format;
    if (format === 'mini') return { columns: 12, rows: 1, min_columns: 3 };
    return this.tile || this.single || format === 'alert' ? { columns: 12, rows: 'auto', min_columns: 6 } : { columns: 'full', rows: 'auto' };
  }
  /** One part of the full card on its own: the feel, the rain, the wind, the pressure, the air and pollens, the forecasts. */
  private get single(): boolean { return ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'air', 'forecast'].includes(this.config?.format ?? ''); }
  /** The lightning card set to show only storms, while none is within 30 km. */
  private calm(v: WeatherView): boolean { return this.config?.format === 'lightning' && this.config.hide_when_calm === true && !!v.lightning && v.lightning.step === 0; }

  /** A tile that no press folds stays as its format starts, whatever was remembered. */
  private get unfolded(): boolean {
    return this.tapTarget === 'toggle' || this.holdTarget === 'toggle' ? this.open : this.config?.format === 'intermediate';
  }
  /** Tile and intermediate formats: one band that unfolds. */
  private get tile(): boolean { return this.config?.format === 'tile' || this.config?.format === 'intermediate'; }
  private hasAlert(v: WeatherView): boolean { const { alerts, points } = alertItems(v); return alerts.length + points.length > 0; }
  private rememberedTab(config: WeatherCardConfig): 'hours' | 'days' {
    try { const v = localStorage.getItem(`hestia-weather:tab:${config.entry_id ?? ''}`); if (v === 'hours' || v === 'days') return v; } catch { /* private browsing */ }
    return config.forecast_tab ?? 'hours';
  }
  private setTab = (tab: 'hours' | 'days') => {
    this.tab = tab;
    try { localStorage.setItem(`hestia-weather:tab:${this.config?.entry_id ?? ''}`, tab); } catch { /* private browsing */ }
  };
  private key(config = this.config!) { return `hestia-weather:open:${config.format}:${config.entry_id ?? config.weather_entity ?? ''}`; }
  private remembered(config: WeatherCardConfig): boolean {
    try { const v = localStorage.getItem(this.key(config)); if (v !== null) return v === '1'; } catch { /* private browsing */ }
    return config.format === 'intermediate';
  }

  public connectedCallback(): void { super.connectedCallback(); this.picker = this.inPicker(); this.subscribe(); this.unwatch = watchOffscreen(this); }
  /** Stops watching whether the card is in view (its animations pause out of view). */
  private unwatch?: () => void;
  /** In the « Add card » window Home Assistant flags nothing: the card finds the window among its ancestors. */
  private picker = false;
  private inPicker(): boolean {
    for (let node: Node | null = this; node; node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null))
      if (node instanceof HTMLElement && node.localName === 'hui-card-picker') return true;
    return false;
  }
  /** Being edited or chosen: the alert card shows what it would hide. */
  private get editing(): boolean { return this.editMode || this.preview || this.picker; }
  public disconnectedCallback(): void { super.disconnectedCallback(); this.unwatch?.(); this.cancelPress(); this.unsubscribe(); }
  /** The language this card was last drawn in: Home Assistant's changes, the card redraws in it. */
  private language?: string;
  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has('hass') || changed.has('config')) this.subscribe();
    const language = this.hass && `${this.hass.language}|${this.hass.locale?.language ?? ''}`;
    if (language && language !== this.language) { this.language = language; setLanguage(this.hass!.language, this.hass!.locale?.language); return true; }
    // Home Assistant pushes every state change: the card only redraws when the integration sends a new view.
    return !(changed.size === 1 && changed.has('hass'));
  }
  protected updated(): void {
    // The alert card takes no room while all is calm, except while the dashboard is being edited.
    this.toggleAttribute('hidden', !!this.view && !this.editing && (this.config?.format === 'alert' && !this.hasAlert(this.view) || this.calm(this.view)));
    this.toggleAttribute('still', this.config?.weather_animations === false);
    this.toggleAttribute('flat', this.config?.glass_effect === false);
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>('dialog');
    if (dialog && this.dialogOpen && !dialog.open) dialog.showModal();
  }

  /** One live subscription to the integration's view of this card's place. */
  private subscribe(): void {
    const connection = this.hass?.connection, config = this.config;
    if (!connection || !config || !this.isConnected) return;
    // The integration writes the view in this user's language: another language, another subscription.
    const place = `${config.entry_id ?? ''}|${this.hass?.language ?? ''}`;
    if (this.subscription && this.subscribedTo === place) return;
    this.unsubscribe();
    this.subscribedTo = place;
    const subscription = connection.subscribeMessage<ViewMessage | { version: number; reload: true }>(m => this.receive(m),
      { type: 'hestia_weather/subscribe', language: this.hass?.language, ...(config.entry_id ? { entry_id: config.entry_id } : {}) });
    this.subscription = subscription;
    subscription.catch((error: { code?: string; message?: string }) => {
      if (this.subscription !== subscription) return;
      this.subscription = undefined;
      const code = error?.code;
      // Only an unknown command means the integration is not running; any other answer is an error of its own.
      this.failure = [error?.message, code].filter(Boolean).join(' · ');
      this.problem = code === 'not_configured' || code === 'choose_entry' || code === 'not_found' ? code : !code || code === 'unknown_command' ? 'missing' : 'error';
      // Home Assistant may still be starting, or the place being set up: try again, less often when nothing answers.
      if (code !== 'choose_entry') this.retryLater(code === 'unknown_command' ? 30_000 : 5_000);
    });
  }
  private receive(message: ViewMessage | { version: number; reload: true }): void {
    if ('reload' in message) { this.unsubscribe(); this.retryLater(2_000); return; }
    if (message.version !== VIEW_VERSION) { this.problem = 'version'; return; }
    this.problem = undefined;
    this.view = message.view;
  }
  private unsubscribe(): void {
    clearTimeout(this.retry);
    const subscription = this.subscription;
    this.subscription = undefined; this.subscribedTo = undefined;
    void subscription?.then(stop => stop()).catch(() => { /* already closed */ });
  }
  private retryLater(delay: number): void {
    clearTimeout(this.retry);
    this.retry = setTimeout(() => this.subscribe(), delay);
  }

  protected render() {
    if (!this.config) return nothing;
    if (this.problem && !this.view) return this.renderProblem(PROBLEMS[this.problem]);
    // While the integration answers: the outline of a card, with a light sweeping over it.
    if (!this.view) return html`<ha-card><div class=${`nw-wait${this.config.format === 'mini' ? ' line' : ''}`} role="status" aria-label=${t('Chargement de la météo')}>
      <i class="dot"></i><i></i><i></i><i></i></div></ha-card>`;
    const config = this.config, view = displayed(this.view, config, this.tile);
    // Gusts for the sky: the station's last measure, else the forecast for this hour.
    const measured = view.wind?.gust.at(-1)?.[1];
    const gust = measured ?? view.hours[0]?.gust ?? 0;
    const sky = html`<hestia-weather-sky .condition=${view.now.condition} .phase=${view.now.phase} .animated=${config.weather_animations !== false}
      .quality=${config.weather_animation_quality ?? (this.tile && LIGHT_SKY.matches ? 'low' : 'standard')} .wind=${view.now.wind ?? 0} .gust=${gust} .detail=${view.now.detail ?? ''} .season=${view.season.info.season}></hestia-weather-sky>`;
    const full = () => renderFull(view, { sky, uid: this.uid, entity: view.weatherEntity, station: view.station,
      sections: sections(config), tab: this.tab, onTab: this.setTab, clock: config.clock, nowFrame: config.now_frame,
      folded: this.folded, onFold: id => { this.folded = { ...this.folded, [id]: !this.folded[id] }; },
      air: { tomorrow: this.airTomorrow, onDay: (kind, tomorrow) => { this.airTomorrow = { ...this.airTomorrow, [kind]: tomorrow }; } } });
    const title = `${t('Météo')}${view.location ? ` · ${view.location}` : ''}`;
    const dialog = () => this.dialogOpen ? html`<dialog class="nw-dialog" aria-label=${title} @close=${() => { this.dialogOpen = false; }} @click=${this.openEntity} @keydown=${this.entityKey}>
        <header><b>${title}</b><button type="button" @click=${this.closeDialog}>${t('Fermer')}</button></header>${full()}</dialog>` : nothing;
    const holdTarget = this.holdTarget;
    switch (config.format) {
      case 'mini':
        return html`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${renderMini(view, holdTarget)}</div>${dialog()}</ha-card>`;
      case 'alert': {
        const body = renderAlert(view, this.editing);
        return body === nothing ? nothing : html`<ha-card><div @click=${this.tap} @keydown=${this.tapKey}>${body}</div>${dialog()}</ha-card>`;
      }
    }
    if (this.single) return html`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${renderSingle(view, config.format as SingleFormat, cardBlocks(config),
      { uid: this.uid, entity: view.weatherEntity, station: view.station, tab: this.tab, onTab: this.setTab })}</ha-card>`;
    if (!this.tile) return html`<ha-card @click=${this.openEntity} @keydown=${this.entityKey}>${full()}</ha-card>`;
    const blocks = config.tile_blocks?.length ? config.tile_blocks : config.show_bulletin === false ? ['events' as const] : DEFAULT_BLOCKS;
    return html`<ha-card>
      <div @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.up} @pointercancel=${this.cancelPress} @pointerleave=${this.cancelPress}
        @contextmenu=${this.noMenu} @keydown=${this.tileKey}>
        ${renderTile(view, sky, { open: this.unfolded, tapTarget: this.tapTarget, holdTarget, blocks, tab: this.tab, onTab: this.setTab })}</div>
      ${dialog()}
    </ha-card>`;
  }

  private renderProblem(p: (typeof PROBLEMS)[Problem]) {
    return html`<ha-card><div class="nw-problem" role="status"><ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
      <div><b>${t(p.title)}</b>${p === PROBLEMS.error && this.failure ? html`<p class="failure">« ${this.failure} »</p>` : nothing}<p>${t(p.text)}</p>${p.links ? html`<div class="links">${p.links.map(([label, href], i) => html`<a class=${i ? 'second' : ''} href=${href}
        target=${href.startsWith('/') ? nothing : '_blank'} rel="noopener noreferrer" @click=${this.follow}>${t(label)}</a>`)}</div>` : nothing}</div></div></ha-card>`;
  }
  /** A link inside Home Assistant opens there, without reloading the page. */
  private follow = (e: MouseEvent) => {
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
    if (!href?.startsWith('/')) return;
    e.preventDefault(); this.go(href);
  };
  private go(path: string): void {
    history.pushState(null, '', path);
    window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
  }

  /** What a long press on the tile (a tap on mini and alert) does: the full card, the user's weather page, fold or unfold, or nothing. */
  private get holdTarget(): PressTarget { return this.target(this.config?.hold_action ?? (this.weatherPath ? 'page' : 'popup')); }
  /** What a tap on the tile does; unfolding unless chosen otherwise. */
  private get tapTarget(): PressTarget { return this.target(this.config?.tap_action ?? 'toggle'); }
  private target(action: PressAction): PressTarget {
    if (action === 'none') return 'none';
    // Only the tile folds; a page without a valid path falls back to the full card rather than doing nothing.
    if (action === 'toggle') return this.tile ? 'toggle' : 'card';
    return action === 'page' && this.weatherPath ? 'page' : 'card';
  }
  private get weatherPath(): string | undefined {
    const path = this.config?.weather_path;
    return path?.startsWith('/') && !path.startsWith('//') ? path : undefined;
  }
  private tileCard() { return this.renderRoot.querySelector<HTMLElement>('.nw-tilecard'); }
  /** Tap and long press (½ s): what each is set to do. Sliding cancels both. */
  private down = (e: PointerEvent) => {
    const card = this.tileCard();
    if (e.button !== 0 || !card) return;
    this.cancelPress();
    const ring = card.querySelector<HTMLElement>('.press-ring'), r = card.getBoundingClientRect(), start = performance.now();
    ring?.style.setProperty('left', `${e.clientX - r.left}px`); ring?.style.setProperty('top', `${e.clientY - r.top}px`);
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / HOLD_MS);
      ring?.style.setProperty('--p', String(p)); card.classList.toggle('pressing', p > .15);
      if (p < 1 && this.press) this.press.frame = requestAnimationFrame(tick);
    };
    // Without a long press to give, a press is only a tap: no ring fills up.
    const holdable = this.holdTarget !== 'none';
    this.press = { x: e.clientX, y: e.clientY, long: false, frame: holdable ? requestAnimationFrame(tick) : 0,
      timer: setTimeout(() => { if (!this.press || !holdable) return; this.press.long = true; this.stopRing(); this.act(this.holdTarget); }, HOLD_MS) };
  };
  private move = (e: PointerEvent) => { if (this.press && Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > 10) this.cancelPress(); };
  private up = () => { const press = this.press; this.cancelPress(); if (press && !press.long) this.act(this.tapTarget); };
  private stopRing() {
    if (!this.press) return;
    clearTimeout(this.press.timer); cancelAnimationFrame(this.press.frame);
    this.tileCard()?.classList.remove('pressing');
  }
  private cancelPress = () => { this.stopRing(); this.press = undefined; };
  /** A long press on a phone also opens the browser menu: not on the card. */
  private noMenu = (e: Event) => e.preventDefault();
  private tileKey = (e: KeyboardEvent) => {
    if (e.target !== this.tileCard() || !['Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    this.act(e.shiftKey ? this.holdTarget : this.tapTarget);
  };
  /** Mini and alert: a tap opens the full card (or the weather page). */
  private tap = (e: Event) => { if (!(e.target as HTMLElement).closest('dialog')) this.act(this.holdTarget); };
  private tapKey = (e: KeyboardEvent) => {
    if (!['Enter', ' '].includes(e.key) || (e.target as HTMLElement).closest('dialog') || this.holdTarget === 'none') return;
    e.preventDefault(); this.act(this.holdTarget);
  };
  private toggle() {
    this.open = !this.open;
    try { localStorage.setItem(this.key(), this.open ? '1' : '0'); } catch { /* private browsing */ }
  }
  private act(target: PressTarget) {
    const path = this.weatherPath;
    if (target === 'toggle') this.toggle();
    else if (target === 'page' && path) this.go(path);
    else if (target === 'card') this.dialogOpen = true;
  }
  private closeDialog = () => { this.renderRoot.querySelector('dialog')?.close(); };
  /** A value of the full card opens its sensor's details, like the rest of Home Assistant. */
  private openEntity = (e: Event) => {
    const target = e.composedPath().find((el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-entity'));
    if (!target || target.closest('.nw-tilecard')) return;
    // Home Assistant's details window would open under ours: close ours first.
    this.closeDialog();
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: target.getAttribute('data-entity') }, bubbles: true, composed: true }));
  };
  private entityKey = (e: KeyboardEvent) => {
    if (!['Enter', ' '].includes(e.key) || !(e.target instanceof HTMLElement) || !e.target.hasAttribute('data-entity')) return;
    e.preventDefault(); this.openEntity(e);
  };

  static styles = [tokens, shared, marqueeStyles, pieces, bubbles, tileStyles, compactStyles, heroStyles, fullStyles, todayStyles, forecastStyles, airStyles, singleStyles, lightningStyles, traitStyles, css`
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
  `];
}

// Each format has its own element (`hestia-weather-<format>-card`, intermediate → `hestia-weather-tile-open-card`): a card written by hand
// with that type keeps its format. Home Assistant's « Add card » window offers three of them, one per kind of card, as the editor
// classes them; the picker takes the type from getStubConfig, so dashboards never depend on these extra names.
const FORMATS: Array<NonNullable<WeatherCardConfig['format']>> = ['full', 'tile', 'intermediate', 'mini', 'comfort', 'rain', 'wind', 'pressure', 'lightning', 'air', 'forecast', 'alert'];
const elementOf = (format: NonNullable<WeatherCardConfig['format']>) => format === 'full' ? 'hestia-weather-card' : `hestia-weather-${format === 'intermediate' ? 'tile-open' : format}-card`;
for (const format of FORMATS) {
  const type = elementOf(format);
  if (format !== 'full' && !customElements.get(type)) customElements.define(type, class extends HestiaWeatherCard {
    public static getStubConfig(): WeatherCardConfig { return { type: 'custom:hestia-weather-card', format }; }
    // Written by hand as its own type, it keeps its format.
    public setConfig(config: WeatherCardConfig): void { super.setConfig({ format, ...config }); }
  });
}
// The list is written once, at load: in the language the page was opened in.
const PICKER: Array<[NonNullable<WeatherCardConfig['format']>, string, string]> = [
  ['full', fr('Hestia - Météo'), fr('La page météo complète ou la tuile qui se déplie. Le format se choisit dans les réglages.')],
  ['comfort', fr('Hestia - À la pièce'), fr('Une seule partie : ressenti, pluie, vent, pression, éclairs, air et pollens ou prévisions.')],
  ['mini', fr('Hestia - Petite carte'), fr('Une seule ligne, ou une alerte visible seulement en cas de vigilance.')],
];
guessLanguage();
window.customCards = window.customCards || [];
for (const [format, name, description] of PICKER) {
  const type = elementOf(format);
  // A card from HACS still installed next to the integration's may have offered them already.
  if (!window.customCards.some(card => card.type === type)) window.customCards.push({ type, name: t(name), description: t(description), preview: true });
}
declare global { interface Window { customCards: Array<Record<string, unknown>>; } }
