import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    startDate: '2026-08-01',
    endDate:   '2026-09-19',
    city:      '',
  });
  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>;
}

export const useFilters = () => useContext(Ctx);
