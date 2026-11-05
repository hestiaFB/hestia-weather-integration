// Regression for HA frontend#53890, using HA's actual scoped registry polyfill.
// npm run test:loading [-- /absolute/path/to/another/hestia-card.js]
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium, firefox } from 'playwright';

const bundles = process.argv.slice(2);
if (!bundles.length) {
  const { name } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const domain = name.replace(/-card$/, '').replaceAll('-', '_');
  bundles.push(`../custom_components/${domain}/frontend/${name}.js`);
}
const polyfill = readFileSync(new URL('../node_modules/@webcomponents/scoped-custom-element-registry/scoped-custom-element-registry.min.js', import.meta.url));
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Hestia-FB loading regression</title><home-assistant></home-assistant>'); }
  else if (path === '/polyfill.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(polyfill); }
  else if (path === '/card.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(readFileSync(currentBundle));
  }
  else { res.writeHead(404); res.end(); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let currentBundle = bundles[0];
const engines = process.env.HESTIA_TEST_FIREFOX ? [chromium, firefox] : [chromium];
try {
  for (const engine of engines) {
    const browser = await engine.launch();
    try {
      for (const bundle of [...bundles]) {
        currentBundle = bundle;
        const tags = bundle.includes('weather') ? ['hestia-weather-card'] : [
          'hestia-comfort-card', 'hestia-comfort-home-card', 'hestia-comfort-card-editor',
        ];
        for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
          const context = await browser.newContext({ viewport });
          const errors = [];
          const openPage = async () => {
            const page = await context.newPage();
            page.setDefaultTimeout(10_000);
            page.on('pageerror', e => errors.push(e.message));
            return page;
          };
          let page = await openPage();
          let cachedLoads = 0;
          let load = 0;
          for (const early of [true, true, false]) {
            // Two restored tabs share the HTTP cache, but each needs its own registry.
            if (load++ === 1) page = await openPage();
            await page.goto(origin);
            if (early) {
              // Start as an extra module, before HA replaces customElements.
              const response = page.waitForResponse(r => r.url().includes('/card.js'));
              await page.evaluate(() => { window.cardImport = import('/card.js?v=test'); });
              await response;
              assert.deepEqual(await page.evaluate(() => ({ tags: customElements.get('hestia-weather-card') || customElements.get('hestia-comfort-card'), lit: window.litElementVersions })), { tags: undefined, lit: undefined }, 'Neither Lit nor the card executes early');
            }
            await page.addScriptTag({ url: `${origin}/polyfill.js` });
            await page.evaluate(() => customElements.define('home-assistant', class extends HTMLElement {}));
            if (!early) await page.evaluate(() => { window.cardImport = import('/card.js?v=test'); });
            // A gate stuck on the old registry must fail promptly, not hang the suite.
            await page.waitForFunction(() => !!customElements.get('hestia-weather-card') || !!customElements.get('hestia-comfort-card'));
            await page.evaluate(() => window.cardImport);
            cachedLoads += await page.evaluate(() => Number(performance.getEntriesByType('resource').some(r => r.name.includes('/card.js?v=test') && r.transferSize === 0)));
            await page.evaluate(async tags => {
              const constructors = tags.map(tag => {
                const ctor = customElements.get(tag);
                if (!ctor) throw new Error(`${tag} disappeared after registry replacement`);
                return ctor;
              });
              // A leftover manual resource runs the bundle again, without replacing existing elements.
              await import('/card.js?v=manual-workaround');
              await import('/%63ard.js?v=manual-encoded');
              for (const [index, tag] of tags.entries()) {
                if (customElements.get(tag) !== constructors[index]) throw new Error(`Duplicate resource replaced ${tag}`);
                if (tag.endsWith('-editor')) continue;
                const card = document.createElement(tag);
                card.setConfig({ type: `custom:${tag}` });
                document.body.append(card);
                await card.updateComplete;
                if (!card.shadowRoot?.childElementCount) throw new Error(`${tag} has no rendered content`);
                // Listed once in the card picker.
                if (window.customCards.filter(c => c.type === tag).length !== 1) throw new Error(`${tag} is missing or duplicated in the card picker`);
              }
            }, tags);
            assert.deepEqual(errors, [], 'No browser errors');
          }
          assert.ok(cachedLoads >= 1, 'The restored tab/reload exercised the browser HTTP cache');
          console.log(`${engine.name()} ${viewport.width}px: ${tags.join(', ')}: early load, two tabs, cached reload, dashboard load, duplicate and render OK`);
          await context.close();
        }
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
