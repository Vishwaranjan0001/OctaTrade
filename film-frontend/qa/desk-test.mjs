// End-to-end test of app.html against the real OctaTrade backend (through server.mjs).
// Creates a throwaway local test account (credentials saved in qa/test-account.json), then walks
// every page: dashboard (info only), wallet deposit, trade (invalid + valid orders, live fill),
// portfolio, orders filters, watchlist add/remove, markets, stock, analytics, activity,
// notifications, profile and settings (dark theme).
// Usage: PW_FROM=islands/package.json node qa/desk-test.mjs [--width 1440 --height 900] [--out qa/desk]
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const width = Number(arg('width', 1440)), height = Number(arg('height', 900));
const out = arg('out', 'qa/desk');
const base = arg('url', 'http://localhost:8787/app.html');
const require = createRequire(process.env.PW_FROM || join(process.cwd(), 'package.json'));
const { chromium } = require('playwright-core');
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
mkdirSync(out, { recursive: true });

const stamp = Date.now().toString(36);
const account = { name: 'Film Test', email: `film.test.${stamp}@octatrade.test`, password: `test-${stamp}-pw` };
writeFileSync(join(out, '..', 'test-account.json'), JSON.stringify({ note: 'Throwaway local test account created by qa/desk-test.mjs', ...account }, null, 2));

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const shot = (n) => page.screenshot({ path: join(out, n + '.png'), fullPage: true });
const goto = async (h) => { await page.evaluate((x) => (location.hash = x), h); await page.waitForTimeout(900); };
const text = (sel) => page.textContent(sel);
const hold = async (ms = 1300) => {
  const b = page.locator('#ticket-card [data-rb="hold"] button').first();
  await b.waitFor({ state: 'visible', timeout: 5000 });
  await b.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(250);
  const box = await b.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up();
};
const wallet = () => page.evaluate(() => fetch('/api/wallet', { headers: { Authorization: 'Bearer ' + localStorage.getItem('octa.film.token') } }).then((r) => r.json()));

await page.goto(base, { waitUntil: 'networkidle' });
check('backend banner hidden', await page.locator('#backend-banner').isHidden());
check('ticket hidden on sign-in', await page.locator('#ticket-card').isHidden());

// register
await page.click('#tab-register');
await page.fill('#auth-form input[name=name]', account.name);
await page.fill('#auth-form input[name=email]', account.email);
await page.fill('#auth-form input[name=password]', 'short');
await page.click('#auth-submit');
check('short password rejected', (await text('#auth-err')).includes('8 characters'));
await page.fill('#auth-form input[name=password]', account.password);
await page.click('#auth-submit');
await page.waitForSelector('#shell:not([hidden])', { timeout: 15000 });
await page.waitForTimeout(1500);

// dashboard is information only
check('dashboard shown', await page.locator('[data-view=dashboard]').isVisible());
const dashForms = await page.locator('[data-view=dashboard] form, [data-view=dashboard] #ticket-card').count();
check('dashboard has no order or deposit form', dashForms === 0, `${dashForms} forms`);
check('ticket hidden on dashboard', await page.locator('#ticket-card').isHidden());
check('metric cards are React SpotlightCards', (await page.locator('[data-view=dashboard] .metric-mount .spotlight-card').count()) === 4);
check('ticker shown on dashboard', await page.locator('.ticker').isVisible());
check('dashboard chart is lightweight-charts', (await page.locator('#d-chart canvas').count()) > 0);
await page.waitForFunction(() => document.querySelectorAll('.ticker .tk-item').length > 0, null, { timeout: 20000 });
check('live ticker (ScrollVelocity) shows prices', true);
await shot('01-dashboard');

// wallet deposit
const w0 = await wallet();
check('new wallet starts at ₹1,00,000', w0.availableBalancePaise === 10000000);
await goto('#wallet');
await page.click('.chip[data-amt="100000"]');
await page.click('#dep-submit');
await page.waitForFunction(() => document.querySelectorAll('#w-rows tr:not(.empty)').length >= 1, null, { timeout: 15000 });
const w1 = await wallet();
check('deposit adds exactly ₹1,00,000', w1.availableBalancePaise - w0.availableBalancePaise === 10000000);
await shot('02-wallet');

// trade
await goto('#trade/TCS.NS');
check('ticker hidden off the dashboard', await page.locator('.ticker').isHidden());
check('ticket on trade page', await page.locator('[data-view=trade] #ticket-card').isVisible());
await page.waitForFunction(() => (document.querySelector('.t-price')?.textContent || '').includes('₹'), null, { timeout: 15000 });
await page.click('#ticket-card .side-toggle label:last-child');
await page.fill('#o-symbol', 'INFY');
await page.fill('#o-qty', '5');
check('sell uses HoldButton', await page.locator('#order-submit').isHidden());
await hold();
check('sell without holdings blocked', (await text('#order-err')).includes('do not hold'));
await page.click('#ticket-card .side-toggle label:first-child');
await page.fill('#o-qty', '0');
await page.click('#order-submit');
check('zero quantity blocked', (await text('#order-err')).includes('whole number'));
await page.fill('#o-symbol', 'TCS');
await page.fill('#o-qty', '2');
await page.waitForTimeout(1000);
check('candles are lightweight-charts', (await page.locator('#candles canvas').count()) > 0);
check('quantity slider (ElasticSlider) shown', (await page.locator('#ticket-card .elastic-slider').count()) === 1);
await page.click('#order-submit');
let status = '';
try {
  await page.waitForFunction(() => /COMPLETED|REJECTED/.test(document.querySelector('#t-orders tr td:last-child')?.textContent || ''), null, { timeout: 30000 });
} catch { /* reported below */ }
status = (await text('#t-orders tr td:last-child')) || '';
check('order settled live on trade page', /COMPLETED|REJECTED/.test(status), status.trim());
const n = await page.evaluate(() => fetch('/api/orders', { headers: { Authorization: 'Bearer ' + localStorage.getItem('octa.film.token') } }).then((r) => r.json()).then((d) => d.orders.length));
check('exactly one buy order placed', n === 1, `${n} orders`);
check('socket connected', (await page.getAttribute('#conn', 'data-state')) === 'on');
await page.waitForTimeout(2500);
await page.click('#ticket-card .side-toggle label:last-child');
await page.fill('#o-qty', '1');
await page.waitForTimeout(300);
await hold();
await page.waitForFunction(() => [...document.querySelectorAll('#t-orders tr')].some((r) => r.textContent.includes('SELL') && /COMPLETED|REJECTED/.test(r.textContent)), null, { timeout: 30000 }).catch(() => {});
const sold = await page.evaluate(() => [...document.querySelectorAll('#t-orders tr')].find((r) => r.textContent.includes('SELL'))?.textContent || '');
check('hold-to-sell places a sell that settles', /COMPLETED/.test(sold), sold.replace(/\s+/g, ' ').trim() || ('ticket says: ' + (await text('#order-err'))));
await page.click('#ticket-card .side-toggle label:first-child');
await shot('03-trade');

// portfolio
await goto('#portfolio');
await page.waitForTimeout(800);
const prow = await page.locator('#p-rows tr:not(.empty)').count();
check('portfolio shows the position', prow === 1, `${prow} rows`);
check('growth chart is lightweight-charts', (await page.locator('#p-growth canvas').count()) > 0);
await page.click('.sortable button[data-sort="symbol"]');
check('positions sortable', (await page.getAttribute('.sortable button[data-sort="symbol"]', 'data-dir')) === 'desc');
await shot('04-portfolio');

// orders filters
await goto('#orders');
await page.click('#o-tabs [data-tab="rejected"]');
const rej = await page.locator('#o-rows tr[data-order]').count();
await page.click('#o-tabs [data-tab="executed"]');
const exe1 = await page.locator('#o-rows tr[data-order]').count();
check('order tabs filter', rej + exe1 === 2, `rejected ${rej}, executed ${exe1}`);
await page.click('#o-tabs [data-tab="all"]');
await page.click('#o-rows tr[data-order]');
check('order detail opens', await page.locator('#o-rows tr.detail').isVisible());
await shot('05-orders');

// watchlist
await goto('#watchlist');
await page.fill('#wl-add-input', 'WIPRO');
await page.click('#wl-add button[type=submit]');
await page.waitForFunction(() => document.querySelector('#wl-rows').textContent.includes('WIPRO.NS'), null, { timeout: 15000 });
check('watchlist add', true);
const errBefore = errors.length; // the backend answers 502 for an unknown symbol: expected here
await page.fill('#wl-add-input', 'NOTAREALSYMBOLX');
await page.click('#wl-add button[type=submit]');
await page.waitForFunction(() => document.querySelector('#wl-err').textContent.length > 0, null, { timeout: 15000 });
check('watchlist rejects unknown symbol', (await text('#wl-err')).includes('No quote'));
errors.splice(errBefore);
await page.click('#wl-rows [data-unwatch="WIPRO.NS"]');
await page.waitForTimeout(500);
check('watchlist remove', !(await text('#wl-rows')).includes('WIPRO.NS'));
await shot('06-watchlist');

// markets + stock
await goto('#markets');
await page.waitForTimeout(1500);
check('markets tiles use GlareHover', (await page.locator('#mk-tiles .tile-glare .tile').count()) >= 1);
await page.fill('#mk-input', 'INFY');
await page.click('#mk-form button');
await page.waitForTimeout(1500);
check('stock page opens', (await text('#s-sym-h')).includes('INFY.NS'));
check('ticket on stock page', await page.locator('[data-view=stock] #ticket-card').isVisible());
await shot('07-stock');

// analytics, activity, notifications, profile, settings
await goto('#analytics');
check('analytics risk observations', (await page.locator('#a-obs li').count()) >= 2);
check('no scheduler metrics', !(await page.content()).includes('scheduler/metrics'));
await shot('08-analytics');
await goto('#activity');
check('activity is an AnimatedList', (await page.locator('[data-id=ac-list] .animated-list__item').count()) >= 3);
await shot('09-activity');
await goto('#notifications');
check('notifications recorded (AnimatedList)', (await page.locator('[data-id=n-list] .animated-list__item').count()) >= 2);
await goto('#profile');
check('profile email', (await text('#pr-email')) === account.email);
await goto('#settings');
await page.click('[data-theme-opt="dark"]');
check('dark theme applies', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
await goto('#dashboard');
await shot('10-dashboard-dark');
await goto('#settings');
await page.click('[data-theme-opt="light"]');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check('no horizontal overflow', overflow <= 0, `${overflow}px`);
check('no console errors', errors.length === 0, errors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
