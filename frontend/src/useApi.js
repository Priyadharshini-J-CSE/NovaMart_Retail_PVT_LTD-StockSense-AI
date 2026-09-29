import { useState, useEffect, useRef } from 'react';
import { apiFetch } from './api';

export function useApi(path, params = {}) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const key = path + JSON.stringify(params);
  const prevKey = useRef(null);

  useEffect(() => {
    if (prevKey.current === key) return;
    prevKey.current = key;
    setLoading(true);
    setError(null);
    apiFetch(path, params)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [key]);

  return { data, loading, error };
}
