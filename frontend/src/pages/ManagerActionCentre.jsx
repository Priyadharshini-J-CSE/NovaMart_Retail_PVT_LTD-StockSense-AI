import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFilters } from '../FilterContext';
import { useApi } from '../useApi';
import { Loading, ErrorState, Empty } from '../components/States';
import RiskBadge from '../components/RiskBadge';
import { createPurchaseOrder } from '../api';

export default function ManagerActionCentre() {
  const { filters } = useFilters();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [storeFilter, setStoreFilter]   = useState(params.get('store') || '');
  const [catFilter, setCatFilter]       = useState(params.get('category') || '');
  const [poStatus, setPoStatus]         = useState({});

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setStoreFilter(p.get('store') || '');
    setCatFilter(p.get('category') || '');
  }, [location.search]);

  const apiParams = {
    startDate: filters.startDate,
    endDate:   filters.endDate,
    city:      filters.city,
    store:     storeFilter,
    category:  catFilter,
  };
  const { data, loading, error } = useApi('/api/manager-actions', apiParams);

  const handleOrder = async (row) => {
    const key = `${row.store_id}|${row.product_id}`;
    setPoStatus(s => ({ ...s, [key]: 'loading' }));
    try {
      const res = await createPurchaseOrder({
        store_id: row.store_id, product_id: row.product_id,
        reorderQty: row.reorderQty, product: row.product, store: row.store,
      });
      setPoStatus(s => ({ ...s, [key]: `PO Created: ${res.po.po_id}` }));
    } catch (e) {
      setPoStatus(s => ({ ...s, [key]: 'Error: ' + e.message }));
    }
  };

  const filtered = data?.filter(r => {
    if (storeFilter && r.store !== storeFilter) return false;
    if (catFilter   && r.category !== catFilter) return false;
    return true;
  }) || [];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Manager Action Centre</div>
        <div className="section-sub">Reorder recommendations and purchase order management</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Filter by store city…"
          value={storeFilter}
          onChange={e => setStoreFilter(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Filter by category…"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={inputStyle}
        />
        {(storeFilter || catFilter) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setStoreFilter(''); setCatFilter(''); }}>
            Clear filters
          </button>
        )}
        {(storeFilter || catFilter) && (
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>
            Filtered: {storeFilter || 'All stores'} × {catFilter || 'All categories'}
          </span>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? <Empty /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Recommended Qty</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const key = `${row.store_id}|${row.product_id}`;
                  const status = poStatus[key];
                  return (
                    <tr key={key}>
                      <td style={{ fontWeight: 600 }}>{row.store}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.product}</td>
                      <td><span style={{ fontSize: 11, color: 'var(--text2)' }}>{row.category}</span></td>
                      <td><RiskBadge risk={row.risk} /></td>
                      <td style={{ color: row.currentStock <= row.reorderLevel ? 'var(--red)' : 'var(--text)' }}>
                        {row.currentStock}
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{row.reorderLevel}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.reorderQty}</td>
                      <td style={{ fontSize: 11, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.reason}
                      </td>
                      <td>
                        {status ? (
                          <span style={{ fontSize: 11, color: status.startsWith('PO') ? 'var(--green)' : 'var(--red)' }}>
                            {status}
                          </span>
                        ) : row.risk === 'High' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => handleOrder(row)}>
                            Raise Order Today
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => handleOrder(row)}>
                            Schedule Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'var(--bg3)',
  border: '1px solid var(--border2)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '7px 12px',
  fontSize: 12,
  outline: 'none',
  minWidth: 180,
};
