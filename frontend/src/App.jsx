import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './FilterContext';
import Landing from './pages/Landing';
import DashboardLayout from './pages/DashboardLayout';
import Home from './pages/Home';
import DemandIntelligence from './pages/DemandIntelligence';
import InventoryRisk from './pages/InventoryRisk';
import ManagerActionCentre from './pages/ManagerActionCentre';
import ModelPerformance from './pages/ModelPerformance';
import Explainability from './pages/Explainability';
import WhatIfAnalysis from './pages/WhatIfAnalysis';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="demand"   element={<DemandIntelligence />} />
            <Route path="risk"     element={<InventoryRisk />} />
            <Route path="actions"  element={<ManagerActionCentre />} />
            <Route path="model"    element={<ModelPerformance />} />
            <Route path="explain"  element={<Explainability />} />
            <Route path="whatif"   element={<WhatIfAnalysis />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FilterProvider>
    </BrowserRouter>
  );
}
