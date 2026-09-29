const BASE = 'http://localhost:4000';

function qs(params = {}) {
  const p = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return p.length ? '?' + p.join('&') : '';
}

export async function apiFetch(path, params = {}) {
  const res = await fetch(`${BASE}${path}${qs(params)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function createPurchaseOrder(body) {
  const res = await fetch(`${BASE}/purchase-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PO error ${res.status}`);
  return res.json();
}
