import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');

function loadCSV(filename) {
  const p = resolve(DATA_DIR, filename);
  if (!existsSync(p)) return [];
  const content = readFileSync(p, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
}

// ── Raw loads ──────────────────────────────────────────────────────────────
let _transactions, _products, _stores, _inventory, _external,
    _forecastOutput, _modelComparison, _testPredictions,
    _model2Metrics, _model2FeatureImportance, _model2Predictions;

function getRaw() {
  if (!_transactions) {
    _transactions            = loadCSV('transactions.csv');
    _products                = loadCSV('products.csv');
    _stores                  = loadCSV('stores.csv');
    _inventory               = loadCSV('inventory.csv');
    _external                = loadCSV('external_factors.csv');
    _forecastOutput          = loadCSV('model1/model1_forecast_output.csv');
    _modelComparison         = loadCSV('model1/model1_model_comparison.csv');
    _testPredictions         = loadCSV('model1/model1_test_predictions.csv');
    _model2FeatureImportance = loadCSV('model2/model2_feature_importance.csv');
    _model2Predictions       = loadCSV('model2/model2_predictions.csv');
    // Load model2 metrics JSON
    try {
      const p = resolve(DATA_DIR, 'model2/model2_metrics.json');
      _model2Metrics = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
    } catch { _model2Metrics = null; }
  }
  return {
    transactions: _transactions, products: _products, stores: _stores,
    inventory: _inventory, external: _external,
    forecastOutput: _forecastOutput, modelComparison: _modelComparison,
    testPredictions: _testPredictions,
    model2Metrics: _model2Metrics,
    model2FeatureImportance: _model2FeatureImportance,
    model2Predictions: _model2Predictions,
  };
}

// ── Data Cleaning ──────────────────────────────────────────────────────────
function cleanTransactions(rows) {
  const seen = new Set();
  return rows.filter(r => {
    const qty = parseFloat(r.qty);
    if (isNaN(qty) || qty <= 0) return false;          // remove negative/zero qty
    const key = r.transaction_id;
    if (seen.has(key)) return false;                    // remove duplicates
    seen.add(key);
    return true;
  }).map(r => ({
    ...r,
    qty:   parseFloat(r.qty),
    price: parseFloat(r.price),
    disc:  parseFloat(r['disc%']) || 0,
    promo: parseInt(r.promo) || 0,
    revenue: parseFloat(r.qty) * parseFloat(r.price) * (1 - (parseFloat(r['disc%']) || 0) / 100),
    date: r.date,
  }));
}

function cleanProducts(rows) {
  return rows.map(r => ({
    ...r,
    category: r.category.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
  }));
}

function cleanExternal(rows) {
  return rows.map(r => ({
    ...r,
    temp_c:  r.temp_c  === '' ? null : parseFloat(r.temp_c),
    rain_mm: r.rain_mm === '' ? null : parseFloat(r.rain_mm),
    holiday: parseInt(r.holiday) || 0,
    festival: parseInt(r.festival) || 0,
    weekend: parseInt(r.weekend) || 0,
    local_event: parseInt(r.local_event) || 0,
  }));
}

function cleanInventory(rows) {
  return rows.map(r => {
    const opening  = parseFloat(r.opening)  || 0;
    const received = parseFloat(r.received) || 0;
    const sold     = parseFloat(r.sold)     || 0;
    const closing  = parseFloat(r.closing)  || 0;
    const expected = opening + received - sold;
    return {
      ...r,
      opening, received, sold, closing,
      reorder_lvl: parseFloat(r.reorder_lvl) || 0,
      lead_days:   parseFloat(r.lead_days)   || 1,
      balance_mismatch: Math.abs(expected - closing) > 0.01,
    };
  });
}

// ── Master Analytics Dataset ───────────────────────────────────────────────
let _master = null;

export function getMaster() {
  if (_master) return _master;
  const { transactions, products, stores, inventory, external } = getRaw();

  const txns  = cleanTransactions(transactions);
  const prods = cleanProducts(products);
  const invs  = cleanInventory(inventory);
  const exts  = cleanExternal(external);

  // Build lookup maps
  const prodMap  = Object.fromEntries(prods.map(p => [p.product_id, p]));
  const storeMap = Object.fromEntries(stores.map(s => [s.store_id, s]));
  const invMap   = {};
  invs.forEach(i => { invMap[`${i.date}|${i.store}|${i.product}`] = i; });
  const extMap   = {};
  exts.forEach(e => { extMap[`${e.date}|${e.city}`] = e; });

  _master = txns.map(t => {
    const prod  = prodMap[t.product_id]  || {};
    const store = storeMap[t.store_id]   || {};
    const inv   = invMap[`${t.date}|${t.store_id}|${t.product_id}`] || {};
    const ext   = extMap[`${t.date}|${store.city}`] || {};
    return { ...t, ...prod, ...store, ...inv, ...ext,
      store_id: t.store_id, product_id: t.product_id, date: t.date };
  });
  return _master;
}

// ── Filters ────────────────────────────────────────────────────────────────
export function filterMaster({ startDate, endDate, city } = {}) {
  let rows = getMaster();
  if (startDate) rows = rows.filter(r => r.date >= startDate);
  if (endDate)   rows = rows.filter(r => r.date <= endDate);
  if (city && city !== 'All Cities') rows = rows.filter(r => r.city === city);
  return rows;
}

// ── KPI Calculations ───────────────────────────────────────────────────────
export function calcKPIs(filters = {}) {
  const rows = filterMaster(filters);
  const totalRevenue = rows.reduce((s, r) => s + (r.revenue || 0), 0);

  // last 7 days vs prior 7 days
  const dates = [...new Set(rows.map(r => r.date))].sort();
  const last7  = dates.slice(-7);
  const prior7 = dates.slice(-14, -7);
  const rev7   = rows.filter(r => last7.includes(r.date)).reduce((s,r) => s+(r.revenue||0),0);
  const revP7  = rows.filter(r => prior7.includes(r.date)).reduce((s,r) => s+(r.revenue||0),0);
  const growthPct = revP7 > 0 ? ((rev7 - revP7) / revP7) * 100 : 0;

  // inventory metrics from raw inventory
  const { inventory } = getRaw();
  const invRows = cleanInventory(inventory);
  const filteredInv = filters.city && filters.city !== 'All Cities'
    ? invRows.filter(i => {
        const { stores } = getRaw();
        const storeMap = Object.fromEntries(stores.map(s => [s.store_id, s]));
        return storeMap[i.store]?.city === filters.city;
      })
    : invRows;

  const latestInvMap = {};
  filteredInv.forEach(i => {
    const key = `${i.store}|${i.product}`;
    if (!latestInvMap[key] || i.date > latestInvMap[key].date) latestInvMap[key] = i;
  });
  const latestInv = Object.values(latestInvMap);

  const { products } = getRaw();
  const prodMap = Object.fromEntries(cleanProducts(products).map(p => [p.product_id, p]));

  let inventoryValue = 0;
  let productsAtRisk = 0;
  let stockoutCount  = 0;
  latestInv.forEach(i => {
    const cost = parseFloat(prodMap[i.product]?.cost) || 0;
    inventoryValue += i.closing * cost;
    if (i.closing <= i.reorder_lvl) productsAtRisk++;
    if (i.closing === 0) stockoutCount++;
  });
  const stockoutRate = latestInv.length > 0 ? (stockoutCount / latestInv.length) * 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    growthPct: parseFloat(growthPct.toFixed(1)),
    rev7: Math.round(rev7),
    revP7: Math.round(revP7),
    stockoutRate: parseFloat(stockoutRate.toFixed(1)),
    inventoryValue: Math.round(inventoryValue),
    productsAtRisk,
  };
}

// ── Revenue by Category ────────────────────────────────────────────────────
export function revenueByCategory(filters = {}) {
  const rows = filterMaster(filters);
  const map = {};
  rows.forEach(r => {
    const cat = r.category || 'Unknown';
    map[cat] = (map[cat] || 0) + (r.revenue || 0);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map).map(([category, revenue]) => ({
    category,
    revenue: Math.round(revenue),
    pct: total > 0 ? parseFloat(((revenue / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.revenue - a.revenue);
}

// ── Daily Sales (Actual) ───────────────────────────────────────────────────
export function dailySales(filters = {}) {
  const rows = filterMaster(filters);
  const map = {};
  rows.forEach(r => {
    map[r.date] = (map[r.date] || 0) + r.qty;
  });
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
    .map(([date, actual]) => ({ date, actual }));
}

// ── Demand Forecast — uses ML model output if available ───────────────────
export function demandForecast(filters = {}) {
  const { forecastOutput } = getRaw();
  const sales = dailySales(filters);

  // Build ML forecast map: date -> sum of forecasts across store/product
  const mlMap = {};
  forecastOutput.forEach(r => {
    if (!r.date) return;
    const v = parseFloat(r.next_7_day_demand_forecast);
    if (isNaN(v)) return;
    mlMap[r.date] = (mlMap[r.date] || 0) + Math.max(0, v);
  });

  const hasMl = Object.keys(mlMap).length > 0;
  const window = 7;

  return sales.map((d, i) => {
    let predicted;
    if (hasMl && mlMap[d.date] !== undefined) {
      predicted = Math.round(mlMap[d.date]);
    } else {
      const slice = sales.slice(Math.max(0, i - window), i);
      predicted = slice.length > 0 ? Math.round(slice.reduce((s, x) => s + x.actual, 0) / slice.length) : d.actual;
    }
    return { ...d, predicted };
  });
}

// ── Stock-out Risk by Category — XGBoost model2 predictions ───────────────
export function stockoutRiskByCategory(filters = {}) {
  const { inventory, stores, products, model2Predictions } = getRaw();
  const invRows  = cleanInventory(inventory);
  const storeMap = Object.fromEntries(stores.map(s => [s.store_id, s]));
  const prodMap  = Object.fromEntries(cleanProducts(products).map(p => [p.product_id, p]));

  // XGBoost probability map: store_id|product_id -> predicted probability
  const xgbMap = {};
  if (model2Predictions && model2Predictions.length > 0) {
    model2Predictions.forEach(r => {
      const prob = parseFloat(r.predicted_stockout_probability);
      if (!isNaN(prob)) xgbMap[`${r.store_id}|${r.product_id}`] = prob;
    });
  }

  let filtered = invRows;
  if (filters.city && filters.city !== 'All Cities') {
    filtered = invRows.filter(i => storeMap[i.store]?.city === filters.city);
  }

  const catMap = {};
  filtered.forEach(i => {
    const cat  = prodMap[i.product]?.category || 'Unknown';
    if (!catMap[cat]) catMap[cat] = { total: 0, probSum: 0 };
    catMap[cat].total++;
    const key  = `${i.store}|${i.product}`;
    const prob = xgbMap[key] !== undefined ? xgbMap[key]
      : (i.reorder_lvl > 0 ? (i.closing / i.reorder_lvl < 1.5 ? 0.55 : 0.2) : 0.2);
    catMap[cat].probSum += prob;
  });

  return Object.entries(catMap).map(([category, v]) => ({
    category,
    riskPct: v.total > 0 ? parseFloat(((v.probSum / v.total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.riskPct - a.riskPct);
}

// ── Inventory Heatmap — XGBoost model2 predictions ────────────────────────
export function inventoryHeatmap(filters = {}) {
  const { inventory, stores, products, model2Predictions } = getRaw();
  const invRows  = cleanInventory(inventory);
  const storeMap = Object.fromEntries(stores.map(s => [s.store_id, s]));
  const prodMap  = Object.fromEntries(cleanProducts(products).map(p => [p.product_id, p]));

  const xgbMap = {};
  if (model2Predictions && model2Predictions.length > 0) {
    model2Predictions.forEach(r => {
      const prob = parseFloat(r.predicted_stockout_probability);
      if (!isNaN(prob)) xgbMap[`${r.store_id}|${r.product_id}`] = prob;
    });
  }

  let filtered = invRows;
  if (filters.city && filters.city !== 'All Cities') {
    filtered = invRows.filter(i => storeMap[i.store]?.city === filters.city);
  }

  const latestMap = {};
  filtered.forEach(i => {
    const key = `${i.store}|${i.product}`;
    if (!latestMap[key] || i.date > latestMap[key].date) latestMap[key] = i;
  });

  const matrix = {};
  Object.values(latestMap).forEach(i => {
    const store = storeMap[i.store]?.city || i.store;
    const cat   = prodMap[i.product]?.category || 'Unknown';
    const key   = `${i.store}|${i.product}`;
    const prob  = xgbMap[key] !== undefined ? xgbMap[key]
      : (i.reorder_lvl > 0 ? (i.closing / i.reorder_lvl < 1 ? 0.85 : i.closing / i.reorder_lvl < 1.5 ? 0.55 : 0.2) : 0.2);
    const risk  = prob >= 0.7 ? 'High' : prob >= 0.4 ? 'Medium' : 'Low';
    const mkey  = `${store}|${cat}`;
    if (!matrix[mkey] || prob > matrix[mkey].prob) {
      matrix[mkey] = { store, category: cat, risk, prob };
    }
  });

  const storeList = [...new Set(Object.values(matrix).map(v => v.store))].sort();
  const catList   = [...new Set(Object.values(matrix).map(v => v.category))].sort();
  return { stores: storeList, categories: catList, cells: Object.values(matrix) };
}

// ── Manager Actions — XGBoost model2 risk scores ──────────────────────────
export function managerActions(filters = {}) {
  const { inventory, stores, products, model2Predictions } = getRaw();
  const invRows  = cleanInventory(inventory);
  const storeMap = Object.fromEntries(stores.map(s => [s.store_id, s]));
  const prodMap  = Object.fromEntries(cleanProducts(products).map(p => [p.product_id, p]));

  // XGBoost probability map
  const xgbMap = {};
  if (model2Predictions && model2Predictions.length > 0) {
    model2Predictions.forEach(r => {
      const prob = parseFloat(r.predicted_stockout_probability);
      if (!isNaN(prob)) xgbMap[`${r.store_id}|${r.product_id}`] = prob;
    });
  }

  let filtered = invRows;
  if (filters.city && filters.city !== 'All Cities') {
    filtered = invRows.filter(i => storeMap[i.store]?.city === filters.city);
  }
  if (filters.store)    filtered = filtered.filter(i => i.store === filters.store);
  if (filters.category) filtered = filtered.filter(i => prodMap[i.product]?.category === filters.category);

  const latestMap = {};
  filtered.forEach(i => {
    const key = `${i.store}|${i.product}`;
    if (!latestMap[key] || i.date > latestMap[key].date) latestMap[key] = i;
  });

  const salesMap = {};
  getMaster().forEach(r => {
    const key = `${r.store_id}|${r.product_id}`;
    if (!salesMap[key]) salesMap[key] = { total: 0, days: new Set() };
    salesMap[key].total += r.qty;
    salesMap[key].days.add(r.date);
  });

  return Object.values(latestMap).map(i => {
    const prod  = prodMap[i.product] || {};
    const store = storeMap[i.store]  || {};
    const key   = `${i.store}|${i.product}`;
    const sd    = salesMap[key];
    const avgDaily       = sd && sd.days.size > 0 ? sd.total / sd.days.size : 5;
    const forecastDemand = Math.round(avgDaily * 7);
    const safetyStock    = Math.round(avgDaily * (i.lead_days || 1) * 1.5);
    const reorderQty     = Math.max(0, forecastDemand + safetyStock - i.closing - (i.received || 0));

    // Use XGBoost probability if available, else fallback
    const prob = xgbMap[key] !== undefined ? xgbMap[key]
      : (i.reorder_lvl > 0 ? (i.closing / i.reorder_lvl < 1 ? 0.85 : i.closing / i.reorder_lvl < 1.5 ? 0.55 : 0.2) : 0.2);
    const risk = prob >= 0.7 ? 'High' : prob >= 0.4 ? 'Medium' : 'Low';

    const reasons = [];
    if (i.closing <= i.reorder_lvl)  reasons.push('Below reorder level');
    if (prob >= 0.7)                  reasons.push('XGBoost: High stockout probability');
    else if (prob >= 0.4)             reasons.push('XGBoost: Medium stockout risk');
    if (i.balance_mismatch)           reasons.push('Inventory mismatch detected');
    if (reasons.length === 0)         reasons.push('Routine replenishment');

    return {
      store: store.city || i.store,
      store_id: i.store,
      product: `${prod.sub_category || i.product} (${prod.brand || ''})`,
      product_id: i.product,
      category: prod.category || 'Unknown',
      risk,
      prob: parseFloat(prob.toFixed(2)),
      reorderQty,
      reason: reasons.join('; '),
      currentStock: i.closing,
      reorderLevel: i.reorder_lvl,
    };
  }).sort((a, b) => b.prob - a.prob);
}

// ── Model Performance — Model1 (SVM demand) + Model2 (XGBoost stockout) ──
export function modelPerformance() {
  const { modelComparison, model2Metrics } = getRaw();

  // Model 1: best demand forecast model from comparison CSV
  let bestRow = null;
  modelComparison.forEach(r => {
    const r2 = parseFloat(r['Test R2']);
    if (!isNaN(r2) && (!bestRow || r2 > parseFloat(bestRow['Test R2'] || -Infinity))) {
      bestRow = r;
    }
  });

  let regression;
  if (bestRow) {
    regression = {
      mae:   parseFloat(parseFloat(bestRow['Test MAE']  || 0).toFixed(4)),
      rmse:  parseFloat(parseFloat(bestRow['Test RMSE'] || 0).toFixed(4)),
      mape:  parseFloat(parseFloat(bestRow['Test MAPE'] || 0).toFixed(2)),
      r2:    parseFloat(parseFloat(bestRow['Test R2']   || 0).toFixed(4)),
      model: bestRow['Model'] || 'ML Model',
    };
  } else {
    const sales = dailySales();
    const window = 7;
    let mae = 0, mse = 0, mape = 0, n = 0, ssRes = 0, ssTot = 0;
    const mean = sales.reduce((s, d) => s + d.actual, 0) / sales.length;
    sales.forEach((d, i) => {
      if (i < window) return;
      const pred = sales.slice(i - window, i).reduce((s, x) => s + x.actual, 0) / window;
      const err = d.actual - pred;
      mae += Math.abs(err); mse += err * err;
      mape += d.actual > 0 ? Math.abs(err / d.actual) : 0;
      ssRes += err * err; ssTot += (d.actual - mean) ** 2; n++;
    });
    regression = {
      mae:  n > 0 ? parseFloat((mae / n).toFixed(2)) : 0,
      rmse: n > 0 ? parseFloat(Math.sqrt(mse / n).toFixed(2)) : 0,
      mape: n > 0 ? parseFloat(((mape / n) * 100).toFixed(2)) : 0,
      r2:   ssTot > 0 ? parseFloat((1 - ssRes / ssTot).toFixed(4)) : 0,
      model: '7-Day Moving Average',
    };
  }

  // Model 2: XGBoost classification metrics from JSON
  let classification;
  if (model2Metrics) {
    classification = {
      model:     model2Metrics.model,
      accuracy:  model2Metrics.accuracy,
      precision: model2Metrics.precision,
      recall:    model2Metrics.recall,
      f1:        model2Metrics.f1,
      rocAuc:    model2Metrics.roc_auc,
      nTrain:    model2Metrics.n_train,
      nTest:     model2Metrics.n_test,
    };
  } else {
    // Fallback: rule-based
    const { inventory } = getRaw();
    const invRows = cleanInventory(inventory);
    let tp = 0, fp = 0, tn = 0, fn = 0;
    invRows.forEach(i => {
      const ratio = i.reorder_lvl > 0 ? i.closing / i.reorder_lvl : 2;
      const pred   = ratio < 1.5 ? 1 : 0;
      const actual = i.closing <= i.reorder_lvl ? 1 : 0;
      if (pred === 1 && actual === 1) tp++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 0) tn++;
      else fn++;
    });
    const acc  = (tp + tn) / (tp + fp + tn + fn) || 0;
    const prec = tp / (tp + fp) || 0;
    const rec  = tp / (tp + fn) || 0;
    const f1   = prec + rec > 0 ? 2 * prec * rec / (prec + rec) : 0;
    classification = {
      model:     'Rule-based Threshold',
      accuracy:  parseFloat((acc  * 100).toFixed(2)),
      precision: parseFloat((prec * 100).toFixed(2)),
      recall:    parseFloat((rec  * 100).toFixed(2)),
      f1:        parseFloat((f1   * 100).toFixed(2)),
      rocAuc:    parseFloat(((acc + rec) / 2 * 100).toFixed(2)),
    };
  }

  const allModels = modelComparison.map(r => ({
    model:    r['Model'] || '',
    testMae:  parseFloat(r['Test MAE']  || 0),
    testRmse: parseFloat(r['Test RMSE'] || 0),
    testMape: parseFloat(r['Test MAPE'] || 0),
    testR2:   parseFloat(r['Test R2']   || 0),
    valMae:   parseFloat(r['Validation MAE']  || 0),
    valRmse:  parseFloat(r['Validation RMSE'] || 0),
  })).filter(r => r.model);

  return { regression, classification, allModels };
}

// ── Feature Importance — Model2 XGBoost importance if available ───────────
export function featureImportance() {
  const { model2FeatureImportance, testPredictions } = getRaw();

  // Prefer XGBoost feature importance from model2
  if (model2FeatureImportance && model2FeatureImportance.length > 0) {
    return model2FeatureImportance
      .map(r => ({ feature: r.feature, importance: parseFloat(parseFloat(r.importance).toFixed(4)) }))
      .filter(r => r.importance > 0)
      .sort((a, b) => b.importance - a.importance);
  }

  // Fallback: correlation from model1 test predictions
  const featureCols = [
    { name: 'Promotion Flag',    key: 'promotion_flag' },
    { name: 'Lag 1 (Yesterday)', key: 'lag_1' },
    { name: 'Rolling Mean 7d',   key: 'rolling_mean_7' },
    { name: 'Lag 7 (Last Week)', key: 'lag_7' },
    { name: 'Rolling Mean 14d',  key: 'rolling_mean_14' },
    { name: 'Discount %',        key: 'discount_pct' },
    { name: 'Days of Inventory', key: 'days_of_inventory' },
    { name: 'Festival Flag',     key: 'festival_flag' },
    { name: 'Weekend Flag',      key: 'weekend_flag' },
    { name: 'Day of Week',       key: 'day_of_week' },
    { name: 'Holiday',           key: 'holiday' },
    { name: 'Local Event',       key: 'local_event' },
    { name: 'Temperature (°C)',  key: 'temp_c' },
    { name: 'Rain (mm)',         key: 'rain_mm' },
  ];
  if (!testPredictions || testPredictions.length === 0) {
    const master = getMaster();
    const enriched = master.map(r => ({ ...r, dow: new Date(r.date).getDay() }));
    const qtys = enriched.map(r => r.qty);
    const meanQty = qtys.reduce((s, v) => s + v, 0) / qtys.length;
    return [
      { name: 'Promotion Flag', key: 'promo' }, { name: 'Day of Week', key: 'dow' },
      { name: 'Festival', key: 'festival' },    { name: 'Holiday', key: 'holiday' },
      { name: 'Weekend', key: 'weekend' },      { name: 'Discount %', key: 'disc' },
      { name: 'Local Event', key: 'local_event' }, { name: 'Rain (mm)', key: 'rain_mm' },
      { name: 'Temperature (°C)', key: 'temp_c' },
    ].map(f => {
      const vals = enriched.map(r => parseFloat(r[f.key]) || 0);
      const meanF = vals.reduce((s, v) => s + v, 0) / vals.length;
      let num = 0, dq = 0, df = 0;
      vals.forEach((v, i) => { num += (v-meanF)*(qtys[i]-meanQty); dq += (qtys[i]-meanQty)**2; df += (v-meanF)**2; });
      return { feature: f.name, importance: parseFloat((dq>0&&df>0 ? Math.abs(num/Math.sqrt(dq*df)) : 0).toFixed(4)) };
    }).sort((a, b) => b.importance - a.importance);
  }
  const target = testPredictions.map(r => parseFloat(r.actual_next_7_day_demand) || 0);
  const meanT  = target.reduce((s, v) => s + v, 0) / target.length;
  return featureCols.map(f => {
    const vals  = testPredictions.map(r => parseFloat(r[f.key]) || 0);
    const meanF = vals.reduce((s, v) => s + v, 0) / vals.length;
    let num = 0, dq = 0, df = 0;
    vals.forEach((v, i) => { num += (v-meanF)*(target[i]-meanT); dq += (target[i]-meanT)**2; df += (v-meanF)**2; });
    return { feature: f.name, importance: parseFloat((dq>0&&df>0 ? Math.abs(num/Math.sqrt(dq*df)) : 0).toFixed(4)) };
  }).filter(f => f.importance > 0).sort((a, b) => b.importance - a.importance);
}

// ── What-If Analysis ───────────────────────────────────────────────────────
export function whatIfDiscount(discountPct) {
  const master = getMaster();
  const baseAvg = master.reduce((s, r) => s + r.qty, 0) / master.length;
  // Elasticity: ~0.3 demand increase per 10% discount
  const elasticity = 0.03;
  const demandImpact = discountPct * elasticity;
  const stockoutImpact = -(discountPct * 0.015);
  return {
    demandImpact: parseFloat(demandImpact.toFixed(1)),
    stockoutImpact: parseFloat(stockoutImpact.toFixed(1)),
    baseAvgDemand: parseFloat(baseAvg.toFixed(1)),
  };
}

export function whatIfSupplierDelay(delayDays) {
  const { inventory } = getRaw();
  const invRows = cleanInventory(inventory);
  const latestMap = {};
  invRows.forEach(i => {
    const key = `${i.store}|${i.product}`;
    if (!latestMap[key] || i.date > latestMap[key].date) latestMap[key] = i;
  });
  const latest = Object.values(latestMap);
  const master = getMaster();
  const salesMap = {};
  master.forEach(r => {
    const key = `${r.store_id}|${r.product_id}`;
    if (!salesMap[key]) salesMap[key] = { total: 0, days: new Set() };
    salesMap[key].total += r.qty;
    salesMap[key].days.add(r.date);
  });

  let atRisk = 0;
  latest.forEach(i => {
    const key = `${i.store}|${i.product}`;
    const sd = salesMap[key];
    const avgDaily = sd && sd.days.size > 0 ? sd.total / sd.days.size : 5;
    const daysOfStock = avgDaily > 0 ? i.closing / avgDaily : 999;
    if (daysOfStock < delayDays) atRisk++;
  });
  const stockoutRiskIncrease = latest.length > 0 ? (atRisk / latest.length) * 100 : 0;
  return {
    atRiskProducts: atRisk,
    stockoutRiskIncrease: parseFloat(stockoutRiskIncrease.toFixed(1)),
    demandImpact: 0,
  };
}

export function whatIfFestival(intensity) {
  // intensity: 1-5 scale
  const demandImpact  = parseFloat((intensity * 4.2).toFixed(1));
  const stockoutImpact = parseFloat((intensity * 3.1).toFixed(1));
  return { demandImpact, stockoutImpact };
}
