import express from 'express';
import cors from 'cors';
import {
  calcKPIs, revenueByCategory, demandForecast, stockoutRiskByCategory,
  inventoryHeatmap, managerActions, modelPerformance, featureImportance,
  whatIfDiscount, whatIfSupplierDelay, whatIfFestival,
} from './dataService.js';

const app = express();
app.use(cors());
app.use(express.json());

const wrap = fn => (req, res) => {
  try { res.json(fn(req)); }
  catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
};

const filters = req => ({
  startDate: req.query.startDate || '',
  endDate:   req.query.endDate   || '',
  city:      req.query.city      || '',
  store:     req.query.store     || '',
  category:  req.query.category  || '',
});

app.get('/api/kpis',              wrap(req => calcKPIs(filters(req))));
app.get('/api/revenue-by-category', wrap(req => revenueByCategory(filters(req))));
app.get('/api/demand-forecast',   wrap(req => demandForecast(filters(req))));
app.get('/api/stockout-risk',     wrap(req => stockoutRiskByCategory(filters(req))));
app.get('/api/inventory-heatmap', wrap(req => inventoryHeatmap(filters(req))));
app.get('/api/manager-actions',   wrap(req => managerActions(filters(req))));
app.get('/api/model-performance', wrap(() => modelPerformance()));
app.get('/api/feature-importance', wrap(() => featureImportance()));

app.get('/api/what-if/discount', wrap(req => whatIfDiscount(parseFloat(req.query.discount) || 0)));
app.get('/api/what-if/supplier-delay', wrap(req => whatIfSupplierDelay(parseFloat(req.query.days) || 0)));
app.get('/api/what-if/festival', wrap(req => whatIfFestival(parseFloat(req.query.intensity) || 1)));

// Purchase Order endpoint
app.post('/api/purchase-order', (req, res) => {
  const { store_id, product_id, reorderQty, product, store } = req.body;
  if (!store_id || !product_id) return res.status(400).json({ error: 'Missing store_id or product_id' });
  const po = {
    po_id: `PO-${Date.now()}`,
    store_id, product_id, product, store,
    quantity: reorderQty,
    status: 'Submitted',
    created_at: new Date().toISOString(),
  };
  console.log('Purchase Order Created:', po);
  res.json({ success: true, po });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`StockSense API running on http://localhost:${PORT}`));
