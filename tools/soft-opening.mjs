// A bot sets up a restaurant as a brand-new player, then plays the soft opening start to finish at phone size, in real
// time, closing the chef's tips as they finish. Fails if it gets stuck, doesn't land on week 1, or anything errors.
// Run: npm run tutorial
// Add "shots" to save a screenshot of every tip in screenshots/: npm run tutorial -- shots
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const shots = process.argv.includes('shots');
if (shots) await mkdir(join(root, 'screenshots'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: shots ? 2 : 1, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
if (!shots) await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${server.address().port}/play/`);
await page.waitForTimeout(600);
// set up as a new player: take the defaults, and the first pitch for every dish
const offered = await page.evaluate(() => {
  const ui = sel => { const el = document.querySelector(sel); if (el && !el.disabled) { el.click(); return true } return false };
  ui('[data-act="new"]'); for (let i = 0; i < 5; i++) ui('[data-act="next"]');
  for (let i = 0; i < MENU_SLOTS.length; i++) { ui(`[data-act="ws"][data-i="${i}"]`); ui('[data-act="accept"]') }
  ui('[data-act="opening"]');
  return [...document.querySelectorAll('.screen .btn')].map(b => b.textContent);
});
if (offered[0] !== 'Soft opening') errors.push('a new player should be offered the soft opening, saw ' + offered.join(' / '));
const till = await page.evaluate(() => S.till);
await page.click('[data-act="tut"]');
const seen = new Set(), t0 = Date.now();
let end = '';
while (Date.now() - t0 < 180000) {
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ mode: S.mode, text: (document.querySelector('#coach p') || {}).textContent }));
  if (st.mode === 'intro') { end = 'week 1'; break; }
  if (st.text && !seen.has(st.text)) {
    seen.add(st.text); console.log(`  ${seen.size}. ${st.text}`);
    if (shots) { await page.waitForTimeout(700); await page.screenshot({ path: join(root, 'screenshots', `tut-${seen.size}.png`) }); }
  }
  await page.evaluate(() => {
    const click = sel => { const el = document.querySelector(sel); if (el) { el.click(); return true } return false };
    if (click('#coach .cx')) return;
    const st = S.tables.map((_, i) => tableState(i));
    for (const k of ['up', 'bill', 'order', 'dirty']) { const i = st.findIndex(x => x.k === k); if (i >= 0) return click(`.table[data-t="${i}"]`) }
    if (S.door.length) click('.guest');
  });
}
const done = await page.evaluate(() => [BEST.tutDone, S.week, S.till, S.scores.length, !!loadRun()]);
await browser.close(); server.close();
if (end !== 'week 1') errors.push('the soft opening got stuck (' + seen.size + ' tips seen)');
else if (!done[0] || done[1] !== 0 || done[2] !== till || done[3] !== 0 || !done[4]) errors.push('finished, but did not land on a fresh week 1: ' + done);
else console.log(`ok: soft opening finished in ${Math.round((Date.now() - t0) / 1000)} s, ${seen.size} tips, on to week 1`);
if (errors.length) { console.error('Errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
