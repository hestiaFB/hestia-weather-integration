import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../ui/define';
import { BLOCK_ORDERS, cardBlocks, cleanConfig, placeChecked, sections } from '../config';
import type { HomeAssistant, WeatherCardConfig } from '../types';
import { fr, setLanguage, t } from '../i18n';

/** The card's editor: which place, then how to show it. The sources are set in the integration. */
const defaults: Partial<WeatherCardConfig> = { format: 'full', show_synthesis: true, show_bulletin: true, show_today: true, show_predictions: true,
  collapse_today: false, collapse_predictions: false, smart_brief: true, weather_animations: true, weather_animation_quality: 'standard',
  show_atmo_details: true, show_atmo_tomorrow: true, glass_effect: true, tile_blocks: ['bulletin', 'events'], forecast_tab: 'hours', pressure_span: '6h', wind_span: '6h', rain_span: '7d', clock: 'none', now_frame: 'opaque' };
export const labels: Partial<Record<keyof WeatherCardConfig, string>> = {
  entry_id: fr('Lieu'), format: fr('Format'),
  weather_animations: fr('Ciel animé et halos'), weather_animation_quality: fr('Qualité des animations'), glass_effect: fr('Effet verre dépoli'),
  show_synthesis: fr('Bandeau (synthèse et météo du moment)'), show_bulletin: fr('Bulletin du jour'), smart_brief: fr('Alertes et événements'),
  show_today: fr('Section Aujourd’hui'), collapse_today: fr('Aujourd’hui replié au départ'),
  show_predictions: fr('Section Prévisions'), collapse_predictions: fr('Prévisions repliées au départ'),
  show_atmo_details: fr('Détail des polluants et des pollens'), show_atmo_tomorrow: fr('Air et pollens de demain'),
  weather_path: fr('Page à ouvrir'),
  tile_blocks: fr('Contenu de la tuile dépliée'), card_blocks: fr('Contenu de la carte'), hide_when_calm: fr('Seulement en cas d’orage'), forecast_tab: fr('Prévisions affichées au départ'), banner_blocks: fr('Contenu du bandeau'), today_blocks: fr('Contenu d’Aujourd’hui'), forecast_blocks: fr('Contenu des Prévisions'),
  hold_action: fr('Appui long'), tap_action: fr('Appui'), pressure_span: fr('Courbe de pression'), wind_span: fr('Courbe du vent'), rain_span: fr('Barres de pluie'), clock: fr('Heure dans le bandeau'), now_frame: fr('Cadre de « En ce moment »'),
};
/** One line under the settings that need it. */
const helpers: Partial<Record<keyof WeatherCardConfig, string>> = {
  weather_animations: fr('Coupées, le ciel et les halos restent fixes.'),
  weather_animation_quality: fr('Allégée : moins de gouttes, de flocons et de nuages.'),
  glass_effect: fr('Le flou demande beaucoup de ressources : à couper sur un appareil lent. Coupé, le verre devient plus opaque.'),
  smart_brief: fr('La vigilance, l’alerte mesurée chez vous et la frise des événements. Coupé, la frise ne montre que le ciel prévu.'),
  weather_path: fr('Le chemin de la page, par exemple /meteo ou /lovelace/meteo.'),
  tile_blocks: fr('Cochez ce qui s’affiche quand la tuile est dépliée, et faites glisser pour changer l’ordre.'),
  banner_blocks: fr('Le bandeau et son ciel animé restent toujours, avec le lieu, la vigilance et la météo du moment. Cochez ce qu’il montre en dessous, dans l’ordre.'),
  card_blocks: fr('Cochez ce que la carte montre.'),
  hide_when_calm: fr('Cachée tant qu’aucun orage n’est à moins de 30 km ; visible pendant la modification du tableau de bord.'),
  today_blocks: fr('Tout décocher retire la section.'),
  forecast_blocks: fr('Tout décocher retire la section.'),
  forecast_tab: fr('Un appui sur Heures ou Jours change l’affichage ; ce choix est gardé sur chaque appareil.'),
  pressure_span: fr('Sur plusieurs jours, on voit mieux arriver une dépression ou un anticyclone.'),
  rain_span: fr('24 heures et 30 jours demandent un pluviomètre dont Home Assistant garde les statistiques ; sinon, la carte montre 7 jours.'),
  clock: fr('L’heure de l’appareil, mise à jour chaque minute.'),
  now_frame: fr('Un cadre de verre derrière la température, pour la lire sur le ciel animé.'),
};
const SETTINGS = '/config/integrations/integration/hestia_weather';

/** The formats in three kinds, chosen first: the list of formats then holds only that kind's. Each kind opens on its first format. */
type Kind = 'large' | 'piece' | 'small';
type Format = NonNullable<WeatherCardConfig['format']>;
const KINDS: Record<Kind, Format[]> = {
  large: ['full', 'tile', 'intermediate'],
  piece: ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'air', 'forecast'],
  small: ['mini', 'alert'],
};
const kindOf = (format: Format = 'full'): Kind => (Object.keys(KINDS) as Kind[]).find(k => KINDS[k].includes(format)) ?? 'large';

@define('hestia-weather-card-editor')
export class HestiaWeatherCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config?: WeatherCardConfig;
  /** The integration's places; null when the integration does not answer. */
  @state() private entries?: Array<{ entry_id: string; title: string }> | null;
  private asked = false;
  private readonly computeLabel = (item: { name: keyof WeatherCardConfig; title?: string }) =>
    item.title ?? (item.name === 'hold_action' && this.tapped ? t('Appui') : t(labels[item.name] ?? item.name));
  private readonly computeHelper = (item: { name: keyof WeatherCardConfig }) =>
    t(helpers[item.name] ?? '');
  private get small(): boolean { return !!this.config?.format && this.config.format !== 'full'; }
  /** Mini and alert open the full card on a simple tap. */
  private get tapped(): boolean { return this.config?.format === 'mini' || this.config?.format === 'alert'; }

  public setConfig(config: WeatherCardConfig): void {
    const next = cleanConfig(config);
    if (this.config && JSON.stringify(next) === JSON.stringify(this.config)) return;
    this.config = next;
  }
  protected shouldUpdate(changed: Map<PropertyKey, unknown>): boolean {
    // Home Assistant pushes every state change to editors: nothing here depends on them.
    // Its words follow Home Assistant's language, like the card's.
    if (changed.has('hass') && this.hass && setLanguage(this.hass.language, this.hass.locale?.language)) return true;
    if (changed.has('hass') && !this.asked && this.hass) {
      this.asked = true;
      this.hass.callWS<Array<{ entry_id: string; title: string }>>({ type: 'hestia_weather/entries' })
        .then(entries => { this.entries = entries; }, () => { this.entries = null; });
    }
    return !(changed.size === 1 && changed.has('hass'));
  }
  private changed(event: CustomEvent<{ value: Partial<WeatherCardConfig> }>): void {
    event.stopPropagation();
    if (!this.config) return;
    const value = { ...event.detail.value } as Partial<WeatherCardConfig> & { kind?: Kind };
    // Another kind of card: its first format. The kind itself is not a setting of the card.
    if (value.kind && value.kind !== kindOf(this.config.format)) value.format = KINDS[value.kind][0];
    delete value.kind;
    // Another format has other parts: it starts with all of its own.
    if (value.format && value.format !== this.config.format) { delete value.card_blocks; delete this.config.card_blocks; }
    for (const [name, order] of Object.entries(BLOCK_ORDERS) as Array<[keyof WeatherCardConfig, string[]]>) {
      const next = value[name] as string[] | undefined, previous = (this.config[name] ?? []) as string[];
      if (Array.isArray(next)) (value as Record<string, unknown>)[name] = placeChecked(previous, next, order);
    }
    this.config = cleanConfig({ ...this.config, ...value });
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
  }
  /** The place and the format on top, then folding groups: the look and its cost first, then what the card shows. */
  private schema(): unknown[] {
    const toggles = (...names: Array<keyof WeatherCardConfig>) => names.map(name => ({ name, selector: { boolean: {} } }));
    const group = (title: string, icon: string, schema: unknown[], expanded = false) => ({ type: 'expandable', name: '', title, icon, flatten: true, expanded, schema });
    const kinds = { name: 'kind', title: t('Type de carte'), required: true, selector: { select: { mode: 'list', options: [
      { value: 'large', label: t('Grandes cartes : la page météo et la tuile') },
      { value: 'piece', label: t('Cartes à la pièce : ressenti, pluie, vent, pression, éclairs, air, prévisions') },
      { value: 'small', label: t('Petites cartes : une ligne ou une alerte') }] } } };
    const all = [
      { value: 'full', label: t('Complète : la page météo') },
      { value: 'tile', label: t('Tuile : une bande qui se déplie d’un appui') },
      { value: 'intermediate', label: t('Tuile dépliée : la même, ouverte au départ') },
      { value: 'mini', label: t('Mini : une seule ligne') },
      { value: 'comfort', label: t('Ressenti : la température perçue') },
      { value: 'rain', label: t('Pluie : à venir et tombée') },
      { value: 'wind', label: t('Vent : le vent du moment et sa courbe') },
      { value: 'pressure', label: t('Pression : la pression et sa courbe') },
      { value: 'lightning', label: t('Éclairs : le radar des orages (Blitzortung)') },
      { value: 'air', label: t('Air et pollens : aujourd’hui et demain') },
      { value: 'forecast', label: t('Prévisions : les heures et les jours') },
      { value: 'alert', label: t('Alerte : visible seulement en cas de vigilance ou d’alerte') }];
    const listed = KINDS[kindOf(this.config?.format)];
    const format = [kinds, { name: 'format', required: true, selector: { select: { mode: 'dropdown',
      options: listed.map(f => all.find(o => o.value === f)!) } } }];
    const blocks = { name: 'tile_blocks', selector: { select: { multiple: true, reorder: true, mode: 'list', options: [
      { value: 'bulletin', label: t('Bulletin du jour') }, { value: 'events', label: t('Événements (la frise)') },
      { value: 'moments', label: t('Les prochains moments (soir, nuit, matin…)') }, { value: 'forecast', label: t('Prévisions (heures ou jours)') }] } } };
    const tab = { name: 'forecast_tab', selector: { select: { mode: 'dropdown', options: [{ value: 'hours', label: t('Heures') }, { value: 'days', label: t('Jours') }] } } };
    // The tile's tap and long press (a tap on mini and alert, which do not fold): the popup, a page (then its path), fold or unfold, or nothing.
    const foldable = this.config?.format === 'tile' || this.config?.format === 'intermediate';
    const hold = this.config?.hold_action ?? (this.config?.weather_path ? 'page' : 'popup'), tap = foldable ? this.config?.tap_action ?? 'toggle' : undefined;
    const press = (name: 'tap_action' | 'hold_action') => ({ name, required: true, selector: { select: { mode: 'dropdown', options: [
      ...(foldable ? [{ value: 'toggle', label: t('Déplier ou replier la tuile') }] : []),
      { value: 'popup', label: t('Ouvrir la météo complète en fenêtre') }, { value: 'page', label: t('Ouvrir une page') }, { value: 'none', label: t('Rien') }] } } });
    const path = [...(foldable ? [press('tap_action')] : []), press('hold_action'),
      ...(hold === 'page' || tap === 'page' ? [{ name: 'weather_path', selector: { text: {} } }] : [])];
    const place = this.entries && this.entries.length > 1
      ? [{ name: 'entry_id', selector: { select: { options: this.entries.map(e => ({ value: e.entry_id, label: e.title })) } } }] : [];
    const look = group(t('Visuel et performance'), 'mdi:palette-outline', [...toggles('weather_animations'),
      { name: 'weather_animation_quality', required: true, selector: { select: { mode: 'dropdown', options: [{ value: 'standard', label: t('Standard') }, { value: 'low', label: t('Allégée') }] } } },
      ...toggles('glass_effect')], true);
    const spans: Array<[string, string]> = [['6h', t('6 dernières heures')], ['1d', t('24 dernières heures')], ['2d', t('2 derniers jours')], ['7d', t('7 derniers jours')]];
    const choice = (name: string, options: Array<[string, string]>) => ({ name, required: true, selector: { select: { mode: 'dropdown',
      options: options.map(([value, label]) => ({ value, label })) } } });
    // The tile unfolds on a tap and opens the full card on a long press: its own options.
    const kind = this.config?.format;
    if (kind === 'mini' || kind === 'alert') return [...place, ...format, group(t('Fonctionnalités'), 'mdi:tune-variant', path, true)];
    // The cards on their own: what each shows, then its own settings.
    const parts = (options: Array<[string, string]>, reorder = false) => ({ name: 'card_blocks', selector: { select: { multiple: true, reorder, mode: 'list',
      options: options.map(([value, label]) => ({ value, label })) } } });
    const content = (list: unknown, ...more: unknown[]) => [...place, ...format, group(t('Contenu'), 'mdi:view-list-outline', [list, ...more], true)];
    const shown = this.config ? cardBlocks(this.config) : [];
    if (kind === 'comfort') return content(parts([['feel', t('Le ressenti et son explication')], ['gauge', t('La jauge de −5 à 45 °C')],
      ['factors', t('Ce qui le fait varier (humidité, vent, soleil)')], ['extras', t('Pastilles (humidité, rosée, soleil…)')]]));
    if (kind === 'rain') return content(parts([['ahead', t('À venir : la prochaine heure et les 6 heures')], ['now', t('Tombée aujourd’hui, et en ce moment')],
      ['chart', t('Les barres de pluie')], ['stats', t('Les cumuls')]]),
      choice('rain_span', [['24h', t('24 dernières heures (une barre par heure)')], ['7d', t('7 derniers jours')], ['30d', t('30 derniers jours (une barre par jour)')]]));
    if (kind === 'wind') return content(parts([['ahead', t('À venir : le vent le plus fort des 6 heures')], ['now', t('Le vent du moment et sa direction')], ['chart', t('La courbe')],
      ['stats', t('Rafales, direction et maximum du jour')]]), choice('wind_span', spans));
    if (kind === 'pressure') return content(parts([['ahead', t('À venir : la pression des 6 heures, si votre fournisseur la prévoit')], ['now', t('La pression et sa tendance')], ['chart', t('La courbe')],
      ['stats', t('Les valeurs passées, le minimum et le maximum')]]), choice('pressure_span', spans));
    if (kind === 'lightning') return content(parts([['ahead', t('À venir : un orage prévu dans les 6 heures')], ['now', t('L’éclair le plus proche et sa direction')], ['radar', t('Le radar et le niveau')],
      ['stats', t('Les comptes (heure, 10 minutes, mois)')]]), ...toggles('hide_when_calm'));
    if (kind === 'air') return content(parts([['air_today', t('Air extérieur aujourd’hui')], ['pollen_today', t('Pollens aujourd’hui')],
      ['air_tomorrow', t('Air extérieur demain')], ['pollen_tomorrow', t('Pollens demain')]], true), ...toggles('show_atmo_details'));
    if (kind === 'forecast') return content(parts([['hours', t('Les 18 prochaines heures')], ['days', t('Les 7 prochains jours')]]),
      ...(shown.includes('hours') && shown.includes('days') ? [tab] : []));
    if (this.small) return [...place, ...format, look,
      group(t('Contenu'), 'mdi:view-list-outline', [blocks, ...((this.config?.tile_blocks ?? []).includes('forecast') ? [tab] : [])], true),
      group(t('Fonctionnalités'), 'mdi:tune-variant', path)];
    // The full card's three sections, in their fixed order, each with its own blocks only.
    const list = (name: string, options: Array<[string, string]>) => ({ name, selector: { select: { multiple: true, reorder: true, mode: 'list',
      options: options.map(([value, label]) => ({ value, label })) } } });
    return [...place, ...format, look,
      group(t('Bandeau intelligent'), 'mdi:view-day-outline', [list('banner_blocks', [['bulletin', t('Bulletin du jour')], ['events', t('Événements (la frise)')],
        ['moments', t('Les prochains moments (soir, nuit, matin…)')], ['forecast', t('Prévisions en tuiles (heures ou jours)')]]),
        choice('clock', [['none', t('Masquée')], ['left', t('Sous le titre, en grand')], ['right', t('Au-dessus de « En ce moment »')]]),
        choice('now_frame', [['opaque', t('Opaque')], ['clear', t('Transparent')], ['none', t('Sans cadre')]])], true),
      group(t('Aujourd’hui'), 'mdi:calendar-today', [list('today_blocks', [['rain', t('Pluie')], ['wind', t('Vent')], ['pressure', t('Pression')], ['lightning', t('Éclairs (avec Blitzortung)')], ['comfort', t('Ressenti')],
        ['extras', t('Pastilles (humidité, rosée, soleil…)')], ['air', t('Air et pollens du jour')]]),
        choice('rain_span', [['24h', t('24 dernières heures (une barre par heure)')], ['7d', t('7 derniers jours')], ['30d', t('30 derniers jours (une barre par jour)')]]),
        choice('wind_span', spans), choice('pressure_span', spans),
        ...toggles('collapse_today')]),
      group(t('Prévisions'), 'mdi:calendar-week', [list('forecast_blocks', [['hours', t('Les 18 prochaines heures')], ['days', t('Les 7 prochains jours')],
        ['air', t('Air et pollens de demain')]]), ...toggles('collapse_predictions')]),
      group(t('Air et pollens'), 'mdi:flower-pollen-outline', toggles('show_atmo_details'))];
  }
  protected render() {
    if (!this.config || !this.hass) return nothing;
    // An older card shows what its switches allowed: the lists start from there.
    const s = sections(this.config);
    const blocks = { ...(this.config.show_bulletin === false ? { tile_blocks: ['events'] } : {}),
      banner_blocks: s.banner, today_blocks: s.today, forecast_blocks: s.forecasts, card_blocks: cardBlocks(this.config) };
    const presses = { tap_action: 'toggle', hold_action: this.config.weather_path ? 'page' : 'popup' };
    const data = Object.fromEntries(Object.entries({ ...defaults, ...presses, ...blocks, ...this.config, kind: kindOf(this.config.format) }).filter(([key]) => key !== 'type'));
    const one = this.entries?.length === 1 ? this.entries[0] : undefined;
    return html`
      ${this.entries === null ? html`<p class="note warn">${t('L’intégration Hestia Weather ne répond pas : la carte en a besoin depuis la version 2.0.')}
          ${t('Déjà téléchargée ?')} <a href="/config/integrations/dashboard/add?domain=hestia_weather" @click=${this.follow}>${t('Ajoutez-la')}</a>.
          ${t('Sinon,')} <a href="https://github.com/hestiaFB/hestia-weather-integration#installation" target="_blank" rel="noopener noreferrer">${t('installez-la')}</a>.</p>`
        : this.entries?.length === 0 ? html`<p class="note warn">${t('Ajoutez l’intégration Hestia Weather : Paramètres → Appareils et services.')}</p>`
        : html`<p class="note">${one ? html`${t('Lieu :')} <b>${one.title}</b>. ` : nothing}${t('Les sources (prévisions, station, air et pollens) se règlent dans')}
          <a href=${SETTINGS} @click=${this.follow}>${t('l’intégration Hestia Weather')}</a>.</p>`}
      <ha-form .hass=${this.hass} .data=${data} .schema=${this.schema()} .computeLabel=${this.computeLabel} .computeHelper=${this.computeHelper} @value-changed=${this.changed}></ha-form>`;
  }
  /** A link inside Home Assistant opens there, without reloading the page. */
  private follow = (e: MouseEvent) => {
    e.preventDefault();
    history.pushState(null, '', (e.currentTarget as HTMLAnchorElement).getAttribute('href') ?? SETTINGS);
    window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
  };
  static styles = css`
    .note { color:var(--secondary-text-color); font-size:13px; line-height:1.6; margin:0 0 16px; }
    .note.warn { color:var(--primary-text-color); }
    a { color:var(--primary-color); }
  `;
}
