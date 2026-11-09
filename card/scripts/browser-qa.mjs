// Browser checks of the real bundle, with the shared demonstration data (demo/demo-hass.js):
// layout at three widths and two themes, accessibility, gestures, the full card window, folding sections, the « i » bubbles and the editor.
//   npm run test:browser
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import * as mdi from '@mdi/js';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { serveDemoView } from './demo-view.mjs';
import { spawnSync } from 'node:child_process';

const out = 'test-results'; mkdirSync(out, { recursive: true });
const files = { '/': ['text/html; charset=utf-8', 'scripts/visual/harness.html'], '/card.js': ['text/javascript', '../custom_components/hestia_weather/frontend/hestia-weather-card.js'], '/demo-hass.js': ['text/javascript', 'demo/demo-hass.js'], '/panel.js': ['text/javascript', '../custom_components/hestia_weather/frontend/panel.js'] };
const icons = JSON.stringify(mdi);
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname, file = files[path];
  if (path === '/demo/view') return serveDemoView(req, res);
  if (path === '/icons.json') { res.setHeader('Content-Type', 'application/json'); res.end(icons); }
  // The panel's fonts, served by the integration under /hestia_weather-assets/ in Home Assistant.
  else if (/^\/hestia_weather-assets\/manrope-[\w-]+\.(ttf|woff2)$/.test(path)) { res.setHeader('Content-Type', path.endsWith('.woff2') ? 'font/woff2' : 'font/ttf'); res.end(readFileSync(`../custom_components/hestia_weather/frontend/${path.split('/').pop()}`)); }
  // The panel's pieces loaded when needed (socle 1.23), beside panel.js in Home Assistant.
  else if (/^\/hub-[\w-]+\.js$/.test(path)) { res.setHeader('Content-Type', 'text/javascript'); res.end(readFileSync(`../custom_components/hestia_weather/frontend${path}`)); }
  else if (file) { res.setHeader('Content-Type', file[0]); res.end(readFileSync(file[1])); }
  else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1300, height: 1000 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const report = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
/** Shows a scenario of demo-hass in the bench page and waits for forecasts, history and icons. */
const show = async s => { await page.evaluate(s => window.show(s), s); await sleep(250); };
const inCard = (fn, arg) => page.evaluate(([source, arg]) => new Function('root', 'card', 'arg', `return (${source})(root, card, arg)`)(document.querySelector('hestia-weather-card').shadowRoot, document.querySelector('hestia-weather-card'), arg), [fn.toString(), arg]);

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.ready);

  // 1. Layout: nothing wider than the card, at phone, tablet and desktop widths, in both themes, in every format.
  report.layout = [];
  for (const theme of ['light', 'dark']) for (const width of [375, 768, 1180]) for (const format of ['tile', 'intermediate', 'full']) {
    for (const condition of ['partlycloudy', 'pouring']) {
      await show({ format, width, theme, condition, vigilance: condition === 'pouring' ? 'Orange' : undefined, animated: false });
      const overflow = await inCard(root => {
        const host = root.host.getBoundingClientRect();
        // The timeline draws in its own shadow root: its labels and hours are checked too. A scrolling line runs inside its clipped frame.
        const all = [...root.querySelectorAll('*'), ...[...root.querySelectorAll('hestia-frise')].flatMap(f => [...f.shadowRoot.querySelectorAll('*')])];
        return all.filter(e => { const r = e.getBoundingClientRect(); return r.width && !e.closest('.sky, dialog, .press-ring, hestia-weather-marquee .run') && (r.right > host.right + 1 || r.left < host.left - 1); })
          .map(e => e.className || e.tagName).slice(0, 5);
      });
      assert.deepEqual(overflow, [], `Overflow ${format} ${width} ${theme} ${condition}`);
      report.layout.push(`${format} ${width} ${theme} ${condition}`);
    }
  }

  // 2. Accessibility of each format (axe: serious and critical issues).
  report.axe = {};
  // Without motion: labels and lines fade in and slide, and their contrast must be read once they are there, not half transparent.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const format of ['tile', 'full']) {
    await show({ format, width: format === 'full' ? 1180 : 680, condition: 'rainy', vigilance: 'Jaune', animated: false });
    const result = await new AxeBuilder({ page }).include('#stage').disableRules(['region']).analyze();
    const serious = result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')}`);
    assert.deepEqual(serious, [], `Accessibility ${format}`);
    report.axe[format] = result.violations.length;
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // 3. The tile: a tap unfolds it and is remembered; a long press opens the full card over the page; the keyboard does both.
  await page.evaluate(() => localStorage.clear());
  await show({ format: 'tile', width: 680, condition: 'pouring', vigilance: 'Jaune', animated: false });
  // Without a weather page of its own, a long press opens the full card over the page.
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'), { weather_path, ...config } = c.config; c.setConfig(config); }); await sleep(50);
  const tile = page.locator('hestia-weather-card .nw-tilecard');
  const state = () => inCard(root => ({ open: root.querySelector('.nw-tilecard').classList.contains('open'), expanded: root.querySelector('.nw-tilecard').getAttribute('aria-expanded'),
    dialog: !!root.querySelector('dialog')?.open, inert: root.querySelector('.more').inert }));
  assert.deepEqual(await state(), { open: false, expanded: 'false', dialog: false, inert: true }, 'Tile starts folded');
  // A scrolling line carries a hidden second copy of its words: only what is read aloud counts.
  const folded = await inCard(root => ({ top: [...root.querySelectorAll('.meta .nw-alert')].map(a => { const c = a.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); }),
    ticker: root.querySelector('hestia-ticker').points.map(p => ['official' in p, p.official ?? false]) }));
  assert.deepEqual(folded.top, ['Vigilance jaune · Orages'], 'Folded: the official vigilance stays on top, as a compact pill');
  assert.deepEqual(folded.ticker[0], [true, false], 'Folded: what the station measures leads the scrolling bubble, in alert style');
  await tile.click({ position: { x: 120, y: 30 } }); await sleep(600);
  assert.deepEqual(await state(), { open: true, expanded: 'true', dialog: false, inert: false }, 'Tap unfolds');
  // Unfolded, the timeline takes over from the bubble: the measured alert leads the « Maintenant » label, with its halo, the vigilance rings the track.
  const frise = await inCard(root => { const f = root.querySelector('hestia-frise').shadowRoot, pin = f.querySelector('.pin');
    return { bubble: getComputedStyle(root.querySelector('.brief > div')).opacity, first: pin.getAttribute('aria-label').split(' ; ')[0], alert: pin.classList.contains('al'),
      title: root.querySelector('.nw-events .nw-label')?.textContent, ring: !!f.querySelector('.ring'), lane: f.querySelectorAll('.seg').length > 0 }; });
  // The vigilance has its pill above: no ring on the track.
  assert.deepEqual({ ...frise, first: frise.first.startsWith('Maintenant : Forte pluie') }, { bubble: '0', first: true, alert: true, title: 'Événements', ring: false, lane: true }, 'Unfolded: the timeline');
  assert.equal(await page.evaluate(() => Object.entries(localStorage).find(([k]) => k.startsWith('hestia-weather:open:tile'))?.[1]), '1', 'Unfolded state remembered');
  // A tap on a label of the timeline shows its point and does not fold the tile.
  await page.locator('hestia-weather-card hestia-frise .pin').last().click(); await sleep(100);
  assert.equal((await state()).open, true, 'A label of the timeline does not fold the tile');
  // Long press.
  const box = await tile.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 30); await page.mouse.down(); await sleep(650); await page.mouse.up(); await sleep(300);
  const dialog = await inCard(root => { const d = root.querySelector('dialog'); return { open: d?.open, sections: [...d.querySelectorAll('.fm-section h2')].map(h => h.textContent), tile: root.querySelector('.nw-tilecard').classList.contains('open') }; });
  assert.deepEqual(dialog, { open: true, sections: ['Aujourd’hui', 'Prévisions'], tile: true }, 'Long press opens the full card, the tile stays as it was');
  report.dialogScreenshot = `${out}/qa-dialog.png`; await page.screenshot({ path: report.dialogScreenshot });
  // A value opens its sensor's details, after closing the window (Home Assistant's window would be hidden under it).
  const detail = await page.evaluate(async () => {
    const card = document.querySelector('hestia-weather-card'); let id;
    card.addEventListener('hass-more-info', e => { id = e.detail.entityId; }, { once: true });
    card.shadowRoot.querySelector('dialog .nw-panel [data-entity]').click(); await new Promise(r => setTimeout(r, 50));
    return { id, open: !!card.shadowRoot.querySelector('dialog')?.open };
  });
  assert.ok(detail.id?.startsWith('sensor.'), 'A value opens its sensor'); assert.equal(detail.open, false, 'The window closes first');
  // Keyboard: Enter folds, Shift+Enter opens the full card, Escape closes it.
  await tile.focus(); await page.keyboard.press('Enter'); await sleep(100);
  assert.equal((await state()).open, false, 'Enter folds');
  await page.keyboard.press('Shift+Enter');
  // A slow machine (the release build) may take longer than 200 ms to open the window: wait for it, up to 2 s.
  for (let i = 0; i < 20 && !(await state()).dialog; i++) await sleep(100);
  assert.equal((await state()).dialog, true, 'Shift+Enter opens the full card');
  await page.keyboard.press('Escape'); await sleep(200);
  assert.equal((await state()).dialog, false, 'Escape closes it');
  // With a weather page, the long press goes there.
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, weather_path: '/meteo' }); });
  const went = page.evaluate(() => new Promise(r => window.addEventListener('location-changed', () => r(location.pathname), { once: true })));
  await page.mouse.move(box.x + 100, box.y + 30); await page.mouse.down(); await sleep(650); await page.mouse.up();
  assert.equal(await went, '/meteo', 'Long press opens the weather page when one is set');
  await page.evaluate(() => history.replaceState(null, '', '/'));
  report.tile = 'ok';

  // 4. The intermediate format starts unfolded.
  await page.evaluate(() => localStorage.clear());
  await show({ format: 'intermediate', width: 680, animated: false });
  assert.equal((await state()).open, true, 'Intermediate starts unfolded');

  // 5. Full card: sections fold with a tap on their title; their starting state comes from the settings.
  await show({ format: 'full', width: 1180, animated: false });
  const sections = () => inCard(root => [...root.querySelectorAll('.fm-section')].map(s => s.classList.contains('folded')));
  assert.deepEqual(await sections(), [false, false], 'Unfolded by default');
  await page.locator('hestia-weather-card .fm-section .fm-head').first().click(); await sleep(50);
  assert.deepEqual(await sections(), [true, false], 'A tap on the title folds');
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, collapse_predictions: true }); }); await sleep(50);
  assert.deepEqual(await sections(), [false, true], 'collapse_predictions folds Prévisions at first');
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, collapse_predictions: false }); }); await sleep(50);

  // 6. The « i » bubbles open inside the screen, on a phone too.
  for (const width of [375, 1180]) {
    await page.setViewportSize({ width: Math.max(width + 40, 420), height: 900 });
    await show({ format: 'full', width, animated: false });
    for (const id of ['brief', 'feel']) {
      const button = page.locator(`hestia-weather-card [popovertarget$="-${id}"]`);
      await button.scrollIntoViewIfNeeded(); await button.click(); await sleep(80);
      const pop = await inCard((root, card, id) => { const p = root.querySelector(`[id$="-${id}"]`), r = p.getBoundingClientRect();
        return { open: p.matches(':popover-open'), inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, text: p.textContent.replace(/\s+/g, ' ') }; }, id);
      assert.equal(pop.open && pop.inside, true, `« i » ${id} at ${width}`);
      if (id === 'feel') assert.match(pop.text, /En ce moment : .* = .* °C ressentis/, 'The feel bubble shows today’s calculation');
      await page.keyboard.press('Escape');
    }
  }
  await page.setViewportSize({ width: 1300, height: 1000 });

  // 7. The charter: one radius, one source pill, the meaning colours from the tokens.
  await show({ format: 'full', width: 1180, condition: 'rainy', animated: false });
  const charter = await inCard(root => {
    const style = s => getComputedStyle(s);
    const badges = [...root.querySelectorAll('.nw-badge')].map(b => [style(b).fontSize, style(b).paddingTop, style(b).borderTopLeftRadius].join(' '));
    // The panels take the common charter's radius (hestia-charte.css), the tiles and bubbles the card's own: one each.
    const radii = [...root.querySelectorAll('.nw-panel')].map(p => style(p).borderTopLeftRadius);
    const small = [...root.querySelectorAll('.nw-tile, .nw-bubble')].map(p => style(p).borderTopLeftRadius);
    const texts = [...root.querySelectorAll('.nw-full *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const sizes = new Set(texts.map(e => style(e).fontSize));
    // Which element has a size off the scale, to find it at once.
    const off = texts.filter(e => !['11px', '12px', '14px', '17px', '34px', '58px'].includes(style(e).fontSize)).map(e => `${e.className || e.tagName} ${style(e).fontSize}`).slice(0, 5);
    root.host.style.setProperty('--hestia-rain-color', 'rgb(255, 0, 0)');
    const themed = style(root.querySelector('.fc-bar, .bars i:not(.zero)')).backgroundColor;
    root.host.style.removeProperty('--hestia-rain-color');
    return { badges: [...new Set(badges)], radii: [...new Set(radii)], small: [...new Set(small)], sizes: [...sizes].sort(), off, themed };
  });
  // The sources moved behind the « i » of each panel (2 November): a pill left, if any, has one style.
  assert.ok(charter.badges.length <= 1, `One source pill style: ${charter.badges}`);
  assert.deepEqual(charter.radii, ['16px'], 'One radius for every panel');
  assert.ok(charter.small.length <= 1, `One radius for the tiles and bubbles: ${charter.small}`);
  assert.ok(charter.sizes.every(s => ['11px', '12px', '14px', '17px', '34px', '58px'].includes(s)), `Six text sizes only: ${charter.sizes} (${charter.off.join(', ')})`);
  assert.match(charter.themed, /255, 0, 0|oklab|color\(srgb 1 0 0/, 'A theme can recolour rain');
  report.charter = charter;

  // 8. Two cards on one page never share their chart gradients.
  const ids = await page.evaluate(async () => {
    const stage = document.getElementById('stage'), second = document.createElement('hestia-weather-card'), first = document.querySelector('hestia-weather-card');
    second.setConfig(first.config); second.hass = first.hass; stage.append(second); await second.updateComplete; await new Promise(r => setTimeout(r, 250));
    const all = [first, second].flatMap(c => [...c.shadowRoot.querySelectorAll('linearGradient')].map(g => g.id));
    second.remove(); return all;
  });
  assert.equal(new Set(ids).size, ids.length, 'Unique gradient names');

  // 9. The editor shows the settings of the chosen format.
  const editor = await page.evaluate(async () => {
    if (!customElements.get('ha-form')) customElements.define('ha-form', class extends HTMLElement {});
    const names = schema => schema.flatMap(f => f.schema ? names(f.schema) : [f.name]);
    const run = async format => {
      const e = document.createElement('hestia-weather-card-editor'); document.body.append(e);
      e.hass = document.querySelector('hestia-weather-card').hass; e.setConfig({ type: 'custom:hestia-weather-card', weather_entity: 'weather.demo', format });
      await e.updateComplete; await new Promise(r => setTimeout(r, 50));
      const forms = [...e.shadowRoot.querySelectorAll('ha-form')].flatMap(f => names(f.schema ?? []));
      e.remove(); return forms;
    };
    return { full: await run('full'), tile: await run('tile'), mini: await run('mini'), temperature: await run('temperature') };
  });
  for (const name of ['collapse_today', 'collapse_predictions']) assert.ok(editor.full.includes(name), `Full card setting ${name}`);
  // The tile's own settings: its blocks and its long press (the page's path only shows once « Ouvrir une page » is chosen).
  assert.ok(editor.tile.includes('hold_action') && editor.tile.includes('tile_blocks') && !editor.tile.includes('collapse_today'), 'Tile settings');
  // The Temperature card's own settings (issue #21): its parts, its period, its titles.
  assert.ok(['card_blocks', 'temperature_span', 'show_title', 'tap_action', 'hold_action'].every(n => editor.temperature.includes(n)), 'Temperature settings');
  // The Mini's own settings: its values and its alerts (issue #22).
  assert.ok(editor.mini.includes('mini_values') && editor.mini.includes('mini_alerts') && editor.mini.includes('hold_action'), 'Mini settings');
  report.editor = editor;

  // 10. Without the integration, or before it is set up, the card says what to do instead of staying empty.
  const problems = await page.evaluate(async () => {
    const stage = document.getElementById('stage'), result = {};
    for (const code of ['unknown_command', 'not_configured', 'choose_entry', 'unknown_error']) {
      const card = document.createElement('hestia-weather-card'); stage.replaceChildren(card);
      card.setConfig({ type: 'custom:hestia-weather-card' });
      card.hass = { states: {}, language: 'fr', locale: { language: 'fr' }, callWS: async () => ({}), connection: { subscribeMessage: () => Promise.reject({ code, message: 'Erreur de test' }) } };
      await new Promise(r => setTimeout(r, 50)); await card.updateComplete;
      const root = card.shadowRoot;
      result[code] = [root.querySelector('.nw-problem b')?.textContent, ...[...root.querySelectorAll('.nw-problem a')].map(a => a.getAttribute('href')),
        ...(root.querySelector('.failure') ? [root.querySelector('.failure').textContent] : [])];
    }
    stage.replaceChildren(); return result;
  });
  assert.deepEqual(problems, {
    // Downloaded but not added, the integration is not started either: the message offers to add it first, then to install it.
    unknown_command: ['Hestia Weather a besoin de son intégration', '/config/integrations/dashboard/add?domain=hestia_weather', 'https://github.com/hestiaFB/hestia-weather-integration#installation'],
    not_configured: ['Ajoutez l’intégration Hestia Weather', '/config/integrations/dashboard/add?domain=hestia_weather'],
    choose_entry: ['Choisissez un lieu'],
    // Any other answer is the integration's own error: shown as it is, with the way to the logs.
    unknown_error: ['L’intégration Hestia Weather a renvoyé une erreur', '/config/logs', '« Erreur de test · unknown_error »'] }, 'Messages without the integration');
  report.problems = problems;

  // 11. The card loaded twice (one from HACS next to the integration's): nothing breaks, each kind is offered once.
  //     And the rain panel says nothing about rain while it is dry.
  await show({ format: 'full', width: 1180, condition: 'sunny', animated: false });
  assert.equal(await inCard(root => root.querySelectorAll('[aria-label="Pluie"] .nw-chip').length), 0, 'No « no rain » chip while dry');
  await page.evaluate(() => import('/card.js?twice'));
  const offered = await page.evaluate(() => window.customCards.map(c => c.type));
  assert.deepEqual(offered, ['hestia-weather-card', 'hestia-weather-comfort-card', 'hestia-weather-mini-card'], 'Three cards in « Add card », one per kind');
  assert.equal(new Set(offered).size, offered.length, 'Each kind offered once, though the card loaded twice');
  await show({ format: 'tile', width: 768, condition: 'sunny', animated: false });
  assert.ok(await inCard(root => !!root.querySelector('.hero-main, .nw-tile, ha-card')), 'The card still draws after loading twice');
  report.twice = offered;

  // A missing Atmo forecast is distinct from a source error; zero concentrations stay factual.
  const atmoScenario = JSON.parse(readFileSync('../tests/fixtures/atmo-pollen-missing-tomorrow.json'));
  const atmoView = scenario => {
    const result = spawnSync('python3', ['../scripts/view_cli.py'], { input: JSON.stringify(scenario), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  let atmoResponse = atmoView(atmoScenario);
  assert.equal(JSON.parse(atmoResponse).view.air.tomorrow[0].primary.unavailableReason, 'no_index');
  await page.route('**/demo/view', route => route.fulfill({ contentType: 'application/json', body: atmoResponse }));
  for (const width of [375, 1180]) {
    await page.setViewportSize({ width, height: 1100 });
    await show({ format: 'full', width, animated: false });
    // One pollen panel, today first; its « Demain » tab shows tomorrow's (2 November).
    const today = page.locator('hestia-weather-card').locator('section[aria-label="Pollens aujourd’hui"]');
    assert.ok((await today.textContent()).includes('Très faible'));
    assert.ok(!(await today.textContent()).includes('peut être une valeur réelle'), 'Valid level and genuine zero are kept');
    await today.getByRole('button', { name: 'Demain' }).click();
    const forecast = page.locator('hestia-weather-card').locator('section[aria-label="Pollens demain"]');
    assert.ok((await forecast.textContent()).includes('Prévision non disponible'));
    assert.ok((await forecast.textContent()).includes('Atmo France ne fournit pas d’indice pollen exploitable pour demain'));
    assert.ok((await forecast.innerText()).includes('0 µg/m³'), 'Zero concentration is preserved');
    assert.ok((await forecast.innerText()).includes('peut être une valeur réelle ou remplacer une donnée manquante'));
    const overflow = await forecast.evaluate(e => {
      const card = e.getRootNode().host.getBoundingClientRect();
      return [...e.querySelectorAll('*')].some(n => n.getBoundingClientRect().right > card.right + 1);
    });
    assert.equal(overflow, false, `Atmo message overflow at ${width}`);
    await forecast.screenshot({ path: `${out}/atmo-pollen-missing-${width}.png` });
  }
  const failedScenario = structuredClone(atmoScenario);
  failedScenario.states['sensor.pollen_j_1'].state = 'unavailable';
  atmoResponse = atmoView(failedScenario);
  await show({ format: 'full', width: 1180, animated: false });
  await page.locator('hestia-weather-card').locator('section[aria-label="Pollens aujourd’hui"]').getByRole('button', { name: 'Demain' }).click();
  assert.ok(!(await page.locator('hestia-weather-card').locator('section[aria-label="Pollens demain"]').textContent()).includes('Prévision non disponible'), 'Unavailable source is not presented as an Atmo code 0');
  await page.unroute('**/demo/view');
  report.atmoMissingForecast = 'Atmo code 0, genuine zero concentrations and unavailable entities remain distinct, mobile and desktop';

  // Swiss providers travel through the Python engine and the real card bundle, at mobile and desktop widths.
  const swiss = spawnSync('python3', ['../scripts/view_cli.py'], {
    input: readFileSync('../tests/fixtures/swiss-weather.json'), encoding: 'utf8',
  });
  assert.equal(swiss.status, 0, swiss.stderr);
  const swissView = JSON.parse(swiss.stdout).view;
  assert.equal(swissView.air.today[0].source, 'Swiss Pollen');
  assert.equal(swissView.air.tomorrow.length, 0);
  await page.route('**/demo/view', route => route.fulfill({ contentType: 'application/json', body: swiss.stdout }));
  for (const width of [375, 1180]) {
    await show({ format: 'full', width, animated: false });
    const text = await inCard(root => root.textContent);
    assert.ok(text.includes('MétéoSuisse') && text.includes('5/5'), 'Native Swiss danger degree stays visible');
    assert.ok(text.includes('crues') || text.includes('Crues'), 'Swiss warning phenomena');
    assert.ok(text.includes('Hêtre'), 'Swiss pollen species');
    const overflow = await inCard(root => {
      const host = root.host.getBoundingClientRect();
      return [...root.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width && !e.closest('.sky, dialog, .press-ring, hestia-weather-marquee .run') && (r.right > host.right + 1 || r.left < host.left - 1);
      }).map(e => e.className || e.tagName).slice(0, 5);
    });
    assert.deepEqual(overflow, [], `Swiss card overflow at ${width}`);
    await page.screenshot({ path: `${out}/swiss-${width}.png`, fullPage: true });
  }
  await page.unroute('**/demo/view');
  report.swiss = 'MeteoSwiss degree 5, Swiss Pollen, mobile and desktop';

  const kleenex = spawnSync('python3', ['../scripts/view_cli.py'], {
    input: readFileSync('../tests/fixtures/kleenex-weather.json'), encoding: 'utf8',
  });
  assert.equal(kleenex.status, 0, kleenex.stderr);
  const pollenView = JSON.parse(kleenex.stdout).view;
  assert.equal(pollenView.air.today[0].primary.value, 4);
  assert.equal(pollenView.air.tomorrow[0].primary.value, 3);
  await page.route('**/demo/view', route => route.fulfill({ contentType: 'application/json', body: kleenex.stdout }));
  for (const width of [375, 1180]) {
    await show({ format: 'full', width, animated: false });
    assert.ok((await inCard(root => root.textContent)).includes('Kleenex / Scottex'));
    await page.screenshot({ path: `${out}/kleenex-${width}.png`, fullPage: true });
  }
  await page.unroute('**/demo/view');
  report.kleenex = 'Current levels and dated tomorrow forecast';

  const labels = spawnSync('python3', ['-c', 'import sys,json; sys.path.insert(0,"../custom_components/hestia_weather"); from engine import polleninfo; print(json.dumps([{"value":p,"label":polleninfo.source_label(p),"available":True} for p in ("atmo",*polleninfo.PROVIDERS)]))'], { encoding: 'utf8' });
  assert.equal(labels.status, 0, labels.stderr);
  const choices = JSON.parse(labels.stdout);
  await page.evaluate(async choices => {
    await import('/panel.js');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--primary-background-color', '#f1f3f6');
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const panel = document.createElement('hestia-weather-setup');
    panel.places = { places: [], can_add: true };
    panel.hass = { themes: { darkMode: false }, callWS: async () => ({}) };
    panel.editing = true; panel.stage = 3;
    panel.draft = { weather_entity: 'weather.home' };
    panel.view = { title: 'Gardanne', pollen: {
      value: 'kleenex_pollenradar', sources: choices, area: '', areas: [], risk: null,
      station: 'home', stations: [{ value: 'home', label: 'Kleenex Pollen Radar (Gardanne)' }],
      species: [{ id: 'sensor.trees', label: 'Arbres', state: 'Très élevé', chosen: true, available: true }],
    }};
    stage.append(panel);
    await panel.updateComplete;
  }, choices);
  for (const width of [375, 1180]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.evaluate(width => { document.querySelector('hestia-weather-setup').style.cssText = `display:block;width:${width - 48}px`; }, width);
    const panel = page.locator('hestia-weather-setup');
    await panel.getByText(/Kleenex \/ Scottex \(France, Italie, Pays-Bas, Royaume-Uni, Irlande, États-Unis\)/).waitFor();
    assert.equal(await panel.locator('select').inputValue(), 'home');
    const overflow = await page.evaluate(() => {
      const panel = document.querySelector('hestia-weather-setup'), host = panel.getBoundingClientRect();
      // The tabs' bar scrolls sideways on a phone: its tabs may go past the edge.
      return [...panel.shadowRoot.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width && !e.closest('.nk-tabs') && (r.right > host.right + 1 || r.left < host.left - 1);
      }).map(e => e.className || e.tagName).slice(0, 5);
    });
    assert.deepEqual(overflow, [], `Pollen source country labels overflow at ${width}`);
    await panel.screenshot({ path: `${out}/pollen-countries-${width}.png` });
  }
  report.pollenCountries = 'Country labels and Kleenex location fit mobile and desktop';

  // 12a. The Mini (issue #22): every value chosen, at three widths; the values scroll when they do not fit, nothing leaves the card,
  //      the temperature stays whole; only the official vigilance by default.
  await page.setViewportSize({ width: 1300, height: 1000 });
  const minis = [];
  for (const width of [640, 380, 230]) {
    await show({ format: 'mini', width, condition: 'pouring', vigilance: undefined, animated: false });
    await page.evaluate(() => { const c = document.querySelector('hestia-weather-card');
      c.setConfig({ ...c.config, mini_values: ['feel', 'wind', 'gust', 'rain', 'humidity', 'pressure', 'uv', 'temperature'] }); });
    await sleep(300);
    minis.push(await inCard(root => {
      const card = root.querySelector('ha-card').getBoundingClientRect(), mini = root.querySelector('.nw-mini'), temp = root.querySelector('.mini-t'), vals = root.querySelector('.mini-vals');
      const out = [...root.querySelectorAll('.nw-mini *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && !e.closest('hestia-weather-marquee .run') && (r.right > card.right + 1 || r.left < card.left - 1); });
      return { out: out.map(e => e.className || e.tagName), overflow: mini.scrollWidth > mini.clientWidth + 1, temp: !!temp && temp.getBoundingClientRect().right <= card.right,
        values: root.querySelectorAll('.mini-vals .run:first-child .mini-val').length, moving: !!vals?.hasAttribute('moving'), shown: !!vals && getComputedStyle(vals).display !== 'none' };
    }));
  }
  for (const [i, m] of minis.entries()) { assert.deepEqual(m.out, [], `Mini ${i}: ${m.out}`); assert.equal(m.overflow, false); assert.equal(m.temp, true); }
  assert.ok(minis[0].values >= 5, `Mini values ${minis[0].values}`);
  assert.equal(minis[1].moving, true, 'The values scroll on a phone');
  assert.equal(minis[2].shown, false, 'No values at 230 px');
  await page.locator('#stage').screenshot({ path: `${out}/mini.png` });
  // A vigilance: on the line by default, in its colour.
  await show({ format: 'mini', width: 380, condition: 'pouring', vigilance: 'Orange', animated: false });
  const vigil = await inCard(root => ({ alerting: !!root.querySelector('.nw-mini.alerting'), words: root.querySelector('.mini-text b')?.textContent.replace(/\s+/g, ' ').trim() }));
  assert.equal(vigil.alerting, true);
  assert.match(vigil.words, /Vigilance orange/);
  report.mini = 'Every value at 640, 380 and 230 px, scrolling, the temperature whole, the official vigilance';

  // 12b. Température (issue #21): the temperature and the humidity, each with its curve and extremes; nothing wider than the card,
  //      at a phone's width and a computer's, in both themes; without titles, no panel head.
  for (const theme of ['light', 'dark']) for (const width of [375, 1180]) {
    await show({ format: 'temperature', width, theme, condition: 'partlycloudy', animated: false });
    const t = await inCard(root => {
      const host = root.host.getBoundingClientRect();
      const out = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > host.right + 1 || r.left < host.left - 1); });
      return { out: out.map(e => e.className || e.tagName).slice(0, 5), panels: root.querySelectorAll('.nw-single.temperature .nw-panel').length,
        curves: root.querySelectorAll('.nw-single.temperature .mini-plot svg').length, ahead: !!root.querySelector('.nw-single.temperature .rain-ahead .nw-chip') };
    });
    assert.deepEqual(t.out, [], `Overflow temperature ${width} ${theme}`);
    assert.equal(t.panels, 2); assert.equal(t.curves, 2); assert.equal(t.ahead, true);
  }
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, show_title: false }); });
  await sleep(200);
  assert.equal(await inCard(root => [...root.querySelectorAll('.nw-panel-head')].filter(h => getComputedStyle(h).display !== 'none').length), 0, 'Untitled');
  await page.locator('#stage').screenshot({ path: `${out}/temperature.png` });
  report.temperature = 'Temperature and humidity, curves and extremes, phone and computer, both themes, without titles';

  // 12c. Cards on their own (issue #24): nothing by default; a tap set to « forecast » opens Home Assistant's window of the weather
  //      entity; a value keeps opening its own sensor; a long press set to « popup » opens the full weather over the page.
  const infos = [];
  await page.exposeFunction('nwInfo', id => infos.push(id)).catch(() => {});
  await page.evaluate(() => { if (!window.nwListening) { window.nwListening = true; document.addEventListener('hass-more-info', e => window.nwInfo(e.detail.entityId)); } });
  // The timeline's own pins answer a press themselves (they show their point): the press is made on its lane, the sky to come.
  const pressOn = async (selector, hold = false) => {
    const box = await page.evaluate(sel => { const root = document.querySelector('hestia-weather-card').shadowRoot;
      const el = sel === 'lane' ? root.querySelector('hestia-frise').shadowRoot.querySelector('.lane') : root.querySelector(sel); const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, selector);
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(hold ? 700 : 60); await page.mouse.up(); await sleep(150);
  };
  await show({ format: 'events', width: 380, condition: 'rainy', animated: false });
  await pressOn('lane');
  assert.deepEqual(infos, [], 'Nothing by default');
  assert.equal(await inCard(root => root.querySelector('ha-card').classList.contains('nw-pressable')), false);
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, tap_action: 'forecast', hold_action: 'popup' }); });
  await sleep(200);
  await pressOn('lane');
  assert.deepEqual(infos, ['weather.demo'], 'A tap on the timeline opens the forecast');
  await pressOn('lane', true);
  assert.equal(await inCard(root => !!root.querySelector('dialog[open]')), true, 'A long press opens the full weather');
  await inCard(root => root.querySelector('dialog').close());
  await show({ format: 'pressure', width: 380, condition: 'rainy', animated: false });
  await page.evaluate(() => { const c = document.querySelector('hestia-weather-card'); c.setConfig({ ...c.config, tap_action: 'forecast' }); });
  await sleep(200); infos.length = 0;
  await page.evaluate(() => document.querySelector('hestia-weather-card').shadowRoot.querySelector('[data-entity="sensor.pressure"]').scrollIntoView());
  await pressOn('[data-entity="sensor.pressure"]');
  assert.deepEqual(infos, ['sensor.pressure'], 'A value opens its sensor, not the forecast');
  report.presses = 'Nothing by default; tap to the forecast; a value keeps its sensor; long press to the full weather';

  // 12. Records (issue #17): this month alone, the station's hour on the line of its day, two cards side by side ending level.
  await page.setViewportSize({ width: 1300, height: 1000 });
  const records = await page.evaluate(async () => {
    document.documentElement.classList.remove('dark');
    const count = (year, month) => ({ year, month, mean: null, best: [year, 2026], partial: false, since: '2025-12-01' });
    const station = { since: '2025-12-01', marks: {
      chaleur: { ever: [42.4, '2026-06-24', 16], year: [42.4, '2026-06-24', 16], month: [18.4, '2026-11-03', 15] },
      froid: { ever: [-8.2, '2026-01-04', 5], year: [-8.2, '2026-01-04', 5], month: [2.1, '2026-11-08', 6] },
      rafale: { ever: [143, '2026-01-09', 3], year: [143, '2026-01-09', 3], month: null },
      pluie: { ever: [24.1, '2026-05-05', null], year: [24.1, '2026-05-05', null], month: null } },
      counts: { jours_gel: count(12, 0), jours_chauds: count(68, 0), nuits_tropicales: count(18, 0), jours_canicule: count(0, 0) } };
    const lieu = { since: '1940-01-01', marks: {
      chaleur: { ever: [40.2, '2019-07-25', null], year: [39.8, '2026-06-24', null], month: [17.9, '2026-11-03', null] },
      froid: { ever: [-19.2, '1987-01-17', null], year: [-7, '2026-01-01', null], month: [1.4, '2026-11-08', null] },
      rafale: { ever: [131, '1999-12-26', null], year: [84, '2026-10-23', null], month: [52, '2026-11-02', null] },
      pluie: { ever: [49.9, '1965-08-07', null], year: [24.7, '2026-05-05', null], month: [8.2, '2026-11-01', null] } },
      counts: { jours_gel: count(13, 0), jours_chauds: count(52, 0), nuits_tropicales: count(27, 0) } };
    const hass = { states: {}, language: 'fr', locale: { language: 'fr' }, callWS: async () => [], connection: { subscribeMessage: async (callback, message) => {
      setTimeout(() => callback({ version: 1, station, lieu, loading: [] }), 20); return async () => {}; } } };
    const stage = document.getElementById('stage'); stage.replaceChildren();
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:12px;width:1040px'; stage.append(row);
    const cards = ['station', 'lieu', 'station'].map((records_source, i) => {
      const box = document.createElement('div'); box.style.cssText = 'flex:1 1 0;min-width:0;display:flex;flex-direction:column';
      const card = document.createElement('hestia-weather-card');
      card.setConfig({ type: 'custom:hestia-weather-card', format: 'records', records_source, records_period: i === 2 ? 'month' : 'both' });
      card.hass = hass;
      if (i < 2) { box.append(card); row.append(box); } else { card.style.width = '380px'; stage.append(card); }
      return card;
    });
    await new Promise(r => setTimeout(r, 400));
    const [a, b, month] = cards.map(c => c.shadowRoot);
    const h = root => root.querySelector('ha-card').getBoundingClientRect().height;
    const text = e => e?.textContent.replace(/\s+/g, ' ').trim();
    return { heights: [h(a), h(b)], hour: text(a.querySelector('.rk-row .rk-d')), brokenHour: !!a.querySelector('.rk-row .rk-d br'),
      title: text(month.querySelector('.nw-title')), values: [...month.querySelectorAll('.rk-row .rk-v')].map(text), columns: !!month.querySelector('.rk-cols'),
      counts: [...month.querySelectorAll('.rk-counts b')].map(text), chips: month.querySelectorAll('.nw-chip').length };
  });
  assert.ok(Math.abs(records.heights[0] - records.heights[1]) < 1, `Records cards side by side: ${records.heights}`);
  assert.equal(records.hour, '24 juin · vers 16 h');
  assert.equal(records.brokenHour, false);
  assert.match(records.title, /novembre 2026/);
  assert.deepEqual(records.values, ['18,4°C', '2,1°C', '—', '—']);
  assert.equal(records.columns, false);
  assert.deepEqual(records.counts, ['0 j', '0 j', '0 j', '0 j']);
  assert.equal(records.chips, 0, 'No « Nouveau » on this month’s records');
  await page.locator('#stage').screenshot({ path: `${out}/records.png` });
  report.records = 'This month alone, the hour on the line of the day, two cards side by side ending level';

  assert.deepEqual(errors, [], 'Browser errors');
  writeFileSync(`${out}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(`Contrôles navigateur réussis : ${report.layout.length} mises en page, accessibilité, gestes, fenêtre complète, sections repliables, bulles « i », charte, éditeur.`);
} finally { await browser.close(); server.close(); }
