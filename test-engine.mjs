// Node-side test harness for the pricing engine inside client.js (ESM).
// Stubs window.__ModuleLoader__ and react, then exercises computePricing.
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let captured = null;
globalThis.window = {
  __ModuleLoader__: {
    load(spec) { captured = spec; },
  },
};

await import(pathToFileURL(path.join(__dirname, 'client.js')).href);

assert(captured, 'client.js must register a module');
assert.strictEqual(captured.id, '@alcoholl/pricing-evaluator');

const ReactStub = {
  createElement: (t, p, ...c) => ({ t, p, c }),
  useState: (init) => [init, () => {}],
  useEffect: () => {},
  useMemo: (f) => f(),
  useRef: () => ({ current: null }),
};
const mod = captured.factory((name) => {
  if (name === 'react') return ReactStub;
  throw new Error('unexpected require: ' + name);
});

const { computePricing } = mod.__test;

/* ---------- case 1: offline bubble-tea shop ---------- */
const offline = computePricing({
  mode: 'offline', productType: 'drink', salesMode: 'retail', channel: 'hub',
  baseCost: '6', qty: '5000', market: '18',
  rentPerSqm: '120', area: '30', utilities: '1500', staff: '3', salary: '5000', laborMisc: '2000',
});
assert.strictEqual(offline.ok, true, JSON.stringify(offline.errors));
assert.strictEqual(offline.resolved.fixedCost, Math.round(3600 + 1500 + 3 * 5000 * 1.35 + 2000), 'fixed cost');
assert.strictEqual(offline.resolved.unitCost, 6);
assert(offline.suggested.profit > 0, 'offline case should be profitable, got ' + JSON.stringify(offline.suggested));
assert(offline.suggested.p >= 6 && offline.suggested.p <= 18 * 1.9, 'price within scan range');
assert(offline.curve.length > 50, 'curve has points');
for (const d of offline.curve) assert(d.profit <= offline.optimal.profit + 1e-6, 'optimum is max profit');
console.log('[offline] suggested =', offline.suggested.p, 'profit =', offline.suggested.profit,
  'beQty =', offline.breakEven.qty, 'range =', offline.range, 'elastic =', offline.resolved.elastic);

/* ---------- case 2: online apparel on Taobao ---------- */
const online = computePricing({
  mode: 'online', productType: 'apparel', salesMode: 'retail', channel: 'taobao',
  baseCost: '30', qty: '800', market: '99',
  shipping: '6', packing: '1.5', promo: '8000', staff: '1', salary: '6000', laborMisc: '3000',
});
assert.strictEqual(online.ok, true, JSON.stringify(online.errors));
assert.strictEqual(online.resolved.unitCost, 37.5);
assert(Math.abs(online.resolved.feeRate - 6.6) < 0.01, 'taobao fee 6% + 0.6% payment');
assert(online.suggested.profit > 0, 'online case should be profitable, got ' + JSON.stringify(online.suggested));
console.log('[online] suggested =', online.suggested.p, 'profit =', online.suggested.profit,
  'beQty =', online.breakEven.qty, 'range =', online.range, 'elastic =', online.resolved.elastic);

/* ---------- case 3: pathological — very high fixed cost, no profit ---------- */
const losing = computePricing({
  mode: 'offline', productType: 'food', salesMode: 'retail', channel: 'community',
  baseCost: '8', qty: '50', market: '20',
  rentPerSqm: '500', area: '200', utilities: '8000', staff: '10', salary: '8000', laborMisc: '50000',
});
assert(losing.maxProfit < 0, 'should lose money');
assert(losing.warnings.includes('warnAllLoss'));
console.log('[losing] maxProfit =', losing.maxProfit, 'warnings =', losing.warnings);

/* ---------- case 4: missing market & qty → auto estimates + warnings ---------- */
const auto = computePricing({
  mode: 'online', productType: 'beauty', salesMode: 'premium', channel: 'douyin',
  baseCost: '25', qty: '', market: '',
  shipping: '4', packing: '2', promo: '3000', staff: '0', salary: '0', laborMisc: '1000',
});
assert.strictEqual(auto.ok, true);
assert(auto.resolved.marketMissing && auto.resolved.qtyMissing);
assert(auto.warnings.includes('warnAutoMarket') && auto.warnings.includes('warnAutoQty'));
console.log('[auto] market =', auto.resolved.market, 'qty =', auto.resolved.baseQty, 'suggested =', auto.suggested && auto.suggested.p);

/* ---------- case 5: wholesale vs mall channel differ ---------- */
const whole = computePricing({
  mode: 'offline', productType: 'retail', salesMode: 'volume', channel: 'wholesale',
  baseCost: '5', qty: '30000', market: '9', rentPerSqm: '60', area: '100',
  utilities: '3000', staff: '4', salary: '6000', laborMisc: '5000',
});
const mall = computePricing({
  mode: 'offline', productType: 'retail', salesMode: 'volume', channel: 'mall',
  baseCost: '5', qty: '9000', market: '9', rentPerSqm: '200', area: '80',
  utilities: '3000', staff: '4', salary: '6000', laborMisc: '5000',
});
assert(whole.resolved.elastic > mall.resolved.elastic, 'wholesale more price sensitive');
assert(whole.suggested.p <= mall.suggested.p, 'wholesale price lower');
console.log('[channels] wholesale p =', whole.suggested.p, 'mall p =', mall.suggested.p);

/* ---------- case 6: volume vs premium ---------- */
const vol = computePricing({
  mode: 'online', productType: 'home', salesMode: 'volume', channel: 'pdd',
  baseCost: '20', qty: '2000', market: '60', shipping: '8', packing: '2',
  promo: '4000', staff: '1', salary: '5000', laborMisc: '1500',
});
const prem = computePricing({
  mode: 'online', productType: 'home', salesMode: 'premium', channel: 'pdd',
  baseCost: '20', qty: '2000', market: '60', shipping: '8', packing: '2',
  promo: '4000', staff: '1', salary: '5000', laborMisc: '1500',
});
assert(vol.suggested.p < prem.suggested.p, 'premium mode prices higher');
console.log('[modes] volume p =', vol.suggested.p, 'premium p =', prem.suggested.p);

/* ---------- case 7: psychological price near optimum ---------- */
const psy = computePricing({
  mode: 'offline', productType: 'drink', salesMode: 'retail', channel: 'street',
  baseCost: '3', qty: '8000', market: '12', rentPerSqm: '80', area: '20',
  utilities: '800', staff: '2', salary: '4500', laborMisc: '1000',
});
assert(psy.suggested && psy.optimal, 'has optimum');
assert(Math.abs(psy.suggested.p - psy.optimal.p) <= Math.max(1, psy.optimal.p * 0.05), 'nice price stays near optimum');
console.log('[psy] optimal =', psy.optimal.p, 'suggested =', psy.suggested.p, 'profit =', psy.suggested.profit);

/* ---------- case 8: numeric input validation ---------- */
const bad = computePricing({ mode: 'online', productType: 'food', salesMode: 'retail', channel: 'taobao', baseCost: '-5', qty: '100', market: '10' });
assert(!bad.ok && bad.errors.includes('errCost'));

const badRent = computePricing({ mode: 'offline', productType: 'food', salesMode: 'retail', channel: 'hub', baseCost: '5', qty: '100', market: '10', rentPerSqm: 'abc', area: '50' });
assert(!badRent.ok && badRent.errors.includes('errRent'), JSON.stringify(badRent.errors));

/* ---------- case 9: unit cost far above market → empty scan → warn ---------- */
const impossible = computePricing({ mode: 'online', productType: 'food', salesMode: 'retail', channel: 'taobao', baseCost: '100', qty: '100', market: '20' });
assert.strictEqual(impossible.optimal, null);
assert(impossible.curve.length === 0);
assert(impossible.warnings.includes('warnAllLoss'));
console.log('[impossible] optimal =', impossible.optimal, 'warnings =', impossible.warnings);

console.log('\nAll engine tests passed');
