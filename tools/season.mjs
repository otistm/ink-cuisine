// A bot sets up a restaurant and plays whole seasons at phone size, with the game clock run fast, and fails on any error.
// It seats guests, takes orders, serves, takes bills, clears tables, and spends in the office between weeks.
// Run: npm run season                 (3 seasons, random choices, prints each week)
//      npm run season -- 10 human     (10 seasons at a person's pace: one tap every 0.7 seconds)
//      npm run season -- 5 human 1.2  (a slower person: one tap every 1.2 seconds)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const seasons = +process.argv[2] || 3, human = process.argv[3] === 'human', pace = +process.argv[4] || .7;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_CERT|ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${port}/play/`);
await page.waitForTimeout(300);
const tally = {};
for (let n = 0; n < seasons; n++) {
  const result = await page.evaluate(async ([human, pace]) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let taps = 0;
    const click = sel => { if (taps <= 0) return false; const el = document.querySelector(sel); if (el && !el.disabled) { el.click(); taps--; return true } return false };
    const ui = sel => { taps = 99; const r = click(sel); taps = 0; return r };
    const log = [];
    localStorage.removeItem('inkcuisine-run'); titleScreen(); ui('[data-act="new"]');
    // set up: a random cuisine, vibe, chef and team
    ui('[data-act="next"]');
    for (const step of [1, 2, 3]) { ui(`[data-act="pick"][data-i="${Math.floor(Math.random() * [0, CUISINES, VIBES, CHEFS][step].length)}"]`); ui('[data-act="next"]') }
    ui(`[data-act="sous"][data-i="${Math.floor(Math.random() * SOUS.length)}"]`); ui(`[data-act="foh"][data-i="${Math.floor(Math.random() * FOH.length)}"]`); ui('[data-act="next"]');
    // the menu: take each pitch, push a couple
    for (let i = 0; i < MENU_SLOTS.length; i++) { ui(`[data-act="ws"][data-i="${i}"]`); if (Math.random() < .4) ui('[data-act="push"]'); if (S.ws.cur.fail) ui('[data-act="another"]'); ui('[data-act="accept"]') }
    const setup = `${CUISINES[S.cuisine].k}/${VIBES[S.vibe].k}/${CHEFS[S.chef].short}/${SOUS[S.sous].short}/${FOH[S.foh].short}`;
    if (!ui('[data-act="opening"]')) return { log, setup, end: 'could not open: ' + S.mode };
    for (let guard = 0; guard < 30; guard++) {
      if (!ui('[data-act="start"]')) return { log, setup, end: 'no start button on ' + S.mode };
      while (S.mode === 'play') {
        const steps = human ? Math.round(pace * 10) : 4; for (let k = 0; k < steps; k++) { S.clock += .1; tickService(.1); }
        taps = human ? 1 : 99;
        // most urgent first: food on the pass, bills, orders, clearing, then seating
        const st = S.tables.map((_, i) => tableState(i));
        const order = ['up', 'bill', 'order', 'dirty'];
        for (const k of order) st.forEach((x, i) => { if (x.k === k) click(`.table[data-t="${i}"]`) });
        if (S.door.length) click('.guest');
        await sleep(0);
      }
      await sleep(900);
      if (S.mode !== 'summary') return { log, setup, end: 'stuck in ' + S.mode };
      const wk = { week: S.week + 1, covers: S.covers, walked: S.walked, stars: S.served ? (S.starSum / S.served).toFixed(1) : '-', take: S.take, buzz: Math.round(S.buzz), rank: rank(), insp: S.scores.length > S.scoresStart ? S.scores[S.scores.length - 1].score : '' };
      log.push(wk);
      ui('[data-act="books"]'); wk.till = S.till;
      if (ui('[data-act="broke"]')) return { log, setup, end: 'broke' };
      if (ui('[data-act="guide"]')) { const stars = scr.querySelectorAll('.bigstars .star path[style*="fill:var(--ink)"]').length; return { log, setup, end: 'stars ' + stars } }
      if (!ui('[data-act="office"]')) return { log, setup, end: 'no office on ' + S.mode };
      // spend: kitchen and tables first, then the room; keep a cushion for wages
      const cushion = wages() + START.rent + 150;
      ui('[data-act="hire"]');
      for (const k of ['line', 'table', 'porter', 'decor', 'lamp', 'somm', 'table', 'decor']) {
        const u = UPGRADES.find(x => x.k === k), lvl = u.max ? S.up[k] | 0 : S.up[k] ? 1 : 0, cost = u.costs ? u.costs[lvl] : u.cost;
        if ((u.max ? lvl < u.max : !lvl) && S.till - (cost || 0) - (u.wage || 0) * 2 > cushion) ui(`[data-act="up"][data-k="${k}"]`);
      }
      ui('[data-act="office"]'); ui('[data-act="menuboard"]');
      // rework the weakest dish if the chef has ideas
      if (S.ideas) { let lo = 0; S.menu.forEach((d, i) => { if (quality(d) < quality(S.menu[lo])) lo = i }); ui(`[data-act="ws"][data-i="${lo}"]`); if (quality(S.ws.cur) > quality(S.menu[lo])) ui('[data-act="accept"]'); else ui('[data-act="wsback"]') }
      ui('[data-act="office"]'); ui('[data-act="city"]'); ui('[data-act="office"]');
      ui('[data-act="nextweek"]');
    }
    return { log, setup, end: 'too many weeks' };
  }, [human, pace]);
  console.log(`season ${n + 1}: ${result.setup}`);
  for (const d of result.log) console.log(`  week ${d.week}  covers ${String(d.covers).padStart(2)}  walked ${String(d.walked).padStart(2)}  stars ${d.stars}  took $${String(d.take).padStart(4)}  bank $${String(d.till).padStart(5)}  buzz ${String(d.buzz).padStart(2)}  ${d.rank}th${d.insp !== '' ? '  inspected: ' + d.insp : ''}`);
  console.log(`  → ${result.end}`);
  tally[result.end.startsWith('stars') ? result.end : result.end] = (tally[result.end] || 0) + 1;
  if (!/^stars|^broke/.test(result.end)) errors.push('season ' + (n + 1) + ': ' + result.end);
}
await browser.close(); server.close();
console.log(Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join(', '));
if (errors.length) { console.error('Errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
