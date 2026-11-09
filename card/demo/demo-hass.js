// Données de démonstration partagées par le banc visuel et la maquette : un faux Home Assistant
// (états, prévisions, vigilance Météo-France, Atmo France) décrit par un « scénario ».
//   scenario = { condition, phase: 'day'|'twilight'|'night', season, vigilance: 'Jaune'|'Orange'|'Rouge', phenomenon,
//                station: false, atmo: false, forecasts: false, unavailable: true, wind, gust, temperature, format, animated }

const PHASES = { day: 35, twilight: 1, night: -20 };
const sensor = (id, value, unit) => ({ entity_id: id, state: String(value), attributes: unit ? { unit_of_measurement: unit } : {} });

/** Ce qui arrive dans les prochaines heures, pour voir la frise se remplir. `base` fixe le temps du moment ; `hour` réécrit l'heure i (i = 0 : dans une heure). */
export const STORIES = {
  orage: { label: 'Orage en fin d’après-midi', base: { condition: 'sunny', phase: 'day', temperature: 27, wind: 10, gust: 18 },
    hour: (i, h, night) => i < 2 ? { ...h, temperature: 27, precipitation: 0, condition: 'sunny' }
      : i <= 4 ? { ...h, temperature: [24, 21, 20][i - 2], precipitation: [2.4, 9, 1.5][i - 2], condition: i === 3 ? 'lightning-rainy' : 'rainy', wind_speed: i === 3 ? 40 : 22, wind_gust_speed: i === 3 ? 80 : 45 }
      : { ...h, temperature: Math.max(15, 19 - (i - 5) * .5), precipitation: 0, condition: night ? 'clear-night' : 'partlycloudy' } },
  gel: { label: 'Nuit de gel', base: { condition: 'clear-night', phase: 'night', temperature: 4, wind: 3, gust: 6 },
    hour: (i, h, night) => ({ ...h, temperature: i <= 9 ? Math.round((4 - .8 * (i + 1)) * 10) / 10 : Math.round((-4 + (i - 9) * 1.4) * 10) / 10, precipitation: 0,
      condition: night ? 'clear-night' : 'sunny', wind_speed: 3, humidity: 82 }) },
  brouillard: { label: 'Brouillard au petit matin', base: { condition: 'partlycloudy', phase: 'twilight', temperature: 13, wind: 4, gust: 8 },
    hour: (i, h, night) => ({ ...h, temperature: i <= 9 ? 13 - .6 * (i + 1) : 7 + (i - 9) * 1.2, precipitation: 0, condition: night ? 'clear-night' : 'partlycloudy',
      wind_speed: 2, humidity: i >= 5 ? 99 : 88 }) },
  demain: { label: 'Forte pluie demain', base: { condition: 'cloudy', phase: 'day', temperature: 17 },
    hour: (i, h) => ({ ...h, precipitation: 0, condition: 'cloudy' }), tomorrow: 32 },
  chargee: { label: 'Journée chargée', base: { condition: 'partlycloudy', phase: 'day', temperature: 16, wind: 12, gust: 25 },
    hour: (i, h, night) => i <= 4 ? { ...h, temperature: [15.5, 14, 12.5, 11.5, 11][i], precipitation: [0, 1.6, 2.2, 7.5, 1][i],
        condition: ['partlycloudy', 'rainy', 'rainy', 'lightning-rainy', 'rainy'][i], wind_gust_speed: i === 3 ? 70 : 30 }
      : { ...h, temperature: i <= 12 ? 10 - (i - 5) * 1.1 : 1.5 + (i - 12) * 1.5, precipitation: 0, condition: night ? 'clear-night' : 'sunny', wind_speed: 4, humidity: 90 },
    tomorrow: 24 },
};
/** Le scénario avec son histoire : le temps du moment vient de l'histoire choisie. */
export const withStory = s => STORIES[s.story] ? { ...s, ...STORIES[s.story].base } : s;

/** Prévisions réalistes : cycle jour/nuit, averse demain matin, 7 jours variés. */
export function demoForecasts(temp, rain, now = new Date(), story) {
  const t0 = new Date(now); t0.setMinutes(0, 0, 0);
  const hourly = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(t0.getTime() + (i + 1) * 3600_000), hr = d.getHours();
    const p = i >= 11 && i <= 17 ? [0.3, 0.8, 1.6, 2.4, 1.8, 1.1, 0.5][i - 11] : i < 2 ? rain : 0;
    return { datetime: d.toISOString(), temperature: Math.round((temp - 4 + 5 * Math.cos((hr - 15) / 24 * 2 * Math.PI)) * 10) / 10, precipitation: p,
      precipitation_probability: p ? 80 : 10, wind_speed: i > 10 ? 18 : 9, wind_bearing: 200,
      condition: p > 3 ? 'pouring' : p ? 'rainy' : (hr >= 20 || hr < 7) ? 'clear-night' : 'partlycloudy' };
  });
  const told = STORIES[story];
  if (told) hourly.forEach((h, i) => { const hr = new Date(h.datetime).getHours(); hourly[i] = told.hour(i, h, hr >= 20 || hr < 7); });
  const dc = ['partlycloudy', 'pouring', 'rainy', 'cloudy', 'sunny', 'sunny', 'partlycloudy'], lo = [16, 15, 13, 12, 11, 12, 13], hi = [25, 21, 19, 20, 22, 23, 22], rr = [0, 18.4, 3.2, 0, 0, 0, 0];
  if (told) { rr[1] = told.tomorrow ?? 0; dc[1] = told.tomorrow ? 'pouring' : 'partlycloudy'; }
  const daily = dc.map((c, i) => ({ datetime: new Date(t0.getTime() + i * 86400_000).toISOString(), condition: c, temperature: hi[i], templow: lo[i], precipitation: rr[i], wind_speed: i === 1 ? 28 : 12, wind_bearing: 200 }));
  return { hourly, daily };
}

/** Valeurs de base d'un scénario : température, pluie en cours, vent. */
export function demoWeather(s) {
  const condition = s.condition ?? 'partlycloudy', night = s.phase === 'night';
  return {
    condition, night,
    temp: s.temperature ?? (condition.startsWith('snow') || condition === 'hail' ? -1.5 : night ? 14.6 : 22.4),
    rain: ['rainy', 'lightning-rainy', 'snowy-rainy'].includes(condition) ? 1.4 : condition === 'pouring' ? 8.2 : 0,
    wind: s.wind ?? (condition.startsWith('windy') ? 42 : 8), gust: s.gust ?? (condition.startsWith('windy') ? 62 : 14),
  };
}

/** Historique simulé de la station (format « minimal_response » de Home Assistant) : vent, rafales, pression, température et pluie du jour. */
export function demoHistory(ids, s, now = new Date()) {
  const { temp, rain, wind } = demoWeather(s), end = now.getTime() / 1000, rows = {};
  const series = (f, hours = 6, step = 300) => Array.from({ length: hours * 3600 / step + 1 }, (_, i) => {
    const lu = end - hours * 3600 + i * step; return { s: String(Math.round(f(i, (end - lu) / 3600) * 10) / 10), lu };
  });
  const mean = i => Math.max(0, wind * (0.75 + 0.3 * Math.sin(i / 9) + 0.1 * Math.sin(i * 1.7)));
  if (ids.includes('sensor.wind')) rows['sensor.wind'] = series(mean);
  if (ids.includes('sensor.gust')) rows['sensor.gust'] = series(i => mean(i) * 1.55 + 4 + 2 * Math.sin(i * 2.3));
  if (ids.includes('sensor.pressure')) rows['sensor.pressure'] = series((i, ago) => 1014 - ago * 0.45 + 0.15 * Math.sin(i / 4));
  // L'après-midi : la température a monté puis redescend un peu ; l'humidité fait l'inverse (carte Température, issue #21).
  if (ids.includes('sensor.temperature')) rows['sensor.temperature'] = series((i, ago) => temp - 2.4 + 3 * Math.sin((6 - ago) / 6 * 2.4) + 0.15 * Math.sin(i * 1.3));
  if (ids.includes('sensor.humidity')) rows['sensor.humidity'] = series((i, ago) => 78 + 9 - 11 * Math.sin((6 - ago) / 6 * 2.4) + 0.6 * Math.sin(i * 1.1));
  // Pluie depuis minuit : le compteur monte dans la journée et revient à zéro à minuit, sur les 7 derniers jours.
  if (ids.includes('sensor.rain_day')) {
    const totals = [0, 2.1, 0, 0, 5.4, 2.1, rain * 2], midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
    rows['sensor.rain_day'] = totals.flatMap((total, d) => {
      const day = midnight.getTime() / 1000 - (6 - d) * 86400;
      return [{ s: '0', lu: day + 60 }, { s: String(Math.round(total * 0.4 * 10) / 10), lu: day + 9 * 3600 }, { s: String(total), lu: Math.min(end - 60, day + 18 * 3600) }]
        .filter(r => r.lu < end);
    });
  }
  return rows;
}

/** Les états Home Assistant d'un scénario : météo, station, vigilance et Atmo. */
export function scenarioStates(s, now = new Date()) {
  const { condition, night, temp, rain, wind, gust } = demoWeather(s);
  const states = {
    'weather.demo': s.unavailable ? { entity_id: 'weather.demo', state: 'unavailable', attributes: { friendly_name: 'Gardanne' } }
      : { entity_id: 'weather.demo', state: condition, attributes: { friendly_name: 'Gardanne', temperature: temp, temperature_unit: '°C', humidity: 74, pressure: 1013,
        wind_speed: wind, wind_gust_speed: gust, wind_bearing: 200, attribution: 'Météo-France', wind_speed_unit: 'km/h', precipitation_unit: 'mm', pressure_unit: 'hPa' } },
    'sun.sun': { entity_id: 'sun.sun', state: night ? 'below_horizon' : 'above_horizon', attributes: { elevation: PHASES[s.phase ?? 'day'] } },
    'sensor.season': sensor('sensor.season', s.season ?? 'autumn'),
  };
  if (s.station !== false) Object.assign(states, {
    'sensor.temperature': sensor('sensor.temperature', temp, '°C'), 'sensor.humidity': sensor('sensor.humidity', 78, '%'),
    'sensor.wind': sensor('sensor.wind', wind, 'km/h'), 'sensor.gust': sensor('sensor.gust', gust, 'km/h'),
    'sensor.rain': sensor('sensor.rain', rain, 'mm/h'), 'sensor.rain_day': sensor('sensor.rain_day', rain * 2, 'mm'),
    'sensor.rain_week': sensor('sensor.rain_week', Math.round((rain * 2 + 9.6) * 10) / 10, 'mm'), 'sensor.rain_month': sensor('sensor.rain_month', Math.round((rain * 2 + 45.4) * 10) / 10, 'mm'),
    'sensor.rain_year': sensor('sensor.rain_year', Math.round((rain * 2 + 534.1) * 10) / 10, 'mm'),
    'sensor.pressure': sensor('sensor.pressure', 1014, 'hPa'), 'sensor.trend': sensor('sensor.trend', -0.4, '°C/h'),
    'sensor.solar': sensor('sensor.solar', night ? 0 : 350, 'W/m²'),
  });
  if (s.vigilance) {
    const attributes = { attribution: 'Data provided by Météo-France', Orages: 'Vert', 'Vent violent': 'Vert', 'Pluie-inondation': 'Vert', Canicule: 'Vert' };
    attributes[s.phenomenon ?? 'Orages'] = s.vigilance;
    states['sensor.vigilance'] = { entity_id: 'sensor.vigilance', state: s.vigilance, last_updated: now.toISOString(), attributes };
  }
  if (s.atmo !== false) {
    const stamp = now.toISOString().slice(0, 19);
    const atmo = (id, v) => ({ entity_id: id, state: String(v), attributes: { 'Nom de la zone': 'Gardanne', 'Date de mise à jour': stamp } });
    Object.assign(states, { 'sensor.atmo_air': atmo('sensor.atmo_air', 2), 'sensor.atmo_air_j1': atmo('sensor.atmo_air_j1', 2),
      'sensor.atmo_pollen': atmo('sensor.atmo_pollen', 1), 'sensor.atmo_pollen_j1': atmo('sensor.atmo_pollen_j1', 2) });
  }
  return states;
}

/** Les réglages de l'intégration pour un scénario (les champs absents imitent une installation minimale). */
export function scenarioSources(s) {
  return { weather_entity: 'weather.demo', location: 'Gardanne', season_entity: 'sensor.season', forecast_source: 'Météo-France',
    ...(s.vigilance ? { vigilance_entity: 'sensor.vigilance' } : {}),
    ...(s.station !== false ? { temperature_entity: 'sensor.temperature', humidity_entity: 'sensor.humidity', wind_speed_entity: 'sensor.wind', wind_gust_entity: 'sensor.gust',
      rain_rate_entity: 'sensor.rain', daily_rain_entity: 'sensor.rain_day', weekly_rain_entity: 'sensor.rain_week', monthly_rain_entity: 'sensor.rain_month',
      yearly_rain_entity: 'sensor.rain_year', pressure_entity: 'sensor.pressure', temperature_trend_entity: 'sensor.trend',
      solar_radiation_entity: 'sensor.solar' } : {}),
    ...(s.atmo !== false ? { atmo_air_entity: 'sensor.atmo_air', atmo_air_tomorrow_entity: 'sensor.atmo_air_j1', atmo_pollen_entity: 'sensor.atmo_pollen',
      atmo_pollen_tomorrow_entity: 'sensor.atmo_pollen_j1', pollen_source: 'atmo' } : { pollen_source: 'none' }),
    ...(s.lightning ? { lightning_entity: 'sensor.blitzortung_distance' } : {}) };
}

/** Tout ce que l'intégration lirait dans Home Assistant pour ce scénario : ce que son moteur reçoit (scripts/view_cli.py). */
export function scenarioData(scenario, now = new Date()) {
  const s = withStory(scenario);
  const { temp, rain } = demoWeather(s), { hourly, daily } = s.forecasts === false ? { hourly: [], daily: [] } : demoForecasts(temp, rain, now, s.story);
  return { options: scenarioSources(s), states: scenarioStates(s, now), hourly, daily,
    history: s.station === false ? {} : demoHistory(['sensor.wind', 'sensor.gust', 'sensor.pressure', 'sensor.temperature', 'sensor.humidity', 'sensor.rain_day'], s, now),
    now: now.toISOString(), time_zone: 'Europe/Paris', latitude: 43.45, elevation: 0,
    ...(s.lightning ? { strikes: demoStrikes(s.lightning), lightning_month: 41 } : {}) };
}

/** Blitzortung's strikes of the last hour, [minutes ago, km, azimuth]: a storm coming closer from the south-west (« approche »),
 *  one overhead (« dessus »), one moving away to the north-east (« loin »), or none (« calme »). */
export function demoStrikes(kind) {
  const [azimuth, distance, n, spread, drift] = { approche: [225, 16, 37, 40, 24], dessus: [40, 5, 64, 120, 10], loin: [60, 38, 22, 30, -15] }[kind] ?? [0, 0, 0, 0, 0];
  let x = 7; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, () => {
    const age = Math.round(rnd() * 58);
    return [age, Math.max(1, Math.round((distance + drift * age / 60 + (rnd() - .5) * 8) * 10) / 10), Math.round((azimuth + (rnd() - .5) * spread + 360) % 360)];
  }).sort((a, b) => b[0] - a[0]);
}

/** Un faux Home Assistant : la vue de l'intégration arrive par la connexion, calculée par son moteur sur le serveur du banc (POST /demo/view). */
export function scenarioHass(s) {
  let ready;
  const first = new Promise(resolve => { ready = resolve; });
  const connection = {
    subscribeMessage: async (callback) => {
      try {
        const response = await fetch('/demo/view', { method: 'POST', body: JSON.stringify({ scenario: s, now: new Date().toISOString(), language: new URLSearchParams(location.search).get('lang') ?? 'fr' }) });
        if (!response.ok) throw new Error(await response.text());
        callback(await response.json());
        return async () => {};
      } finally { ready(); }
    },
  };
  const callWS = async m => m.type === 'hestia_weather/entries' ? [{ entry_id: 'demo', title: 'Gardanne' }] : {};
  // ?lang=en shows the card in another language than French.
  const language = new URLSearchParams(location.search).get('lang') ?? 'fr';
  return { states: scenarioStates(s), language, locale: { language }, connection, callWS, ready: first };
}

/** Les réglages d'affichage de la carte pour un scénario. */
export function scenarioConfig(s) {
  return { type: 'custom:hestia-weather-card', format: s.format ?? 'full', weather_path: '/meteo', weather_animations: s.animated ?? false };
}
