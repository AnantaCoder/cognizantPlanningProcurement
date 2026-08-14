import React from 'react';
import { SOPProvider, useSOP } from './context/SOPContext';
import { Header } from './components/Header';
import { DataInputsView } from './components/Layer1DataInputs/DataInputsView';
import { DataQualityView } from './components/Layer2DataQuality/DataQualityView';
import { DemandPlanningView } from './components/Layer3DemandPlanning/DemandPlanningView';
import { SupplyReconciliationView } from './components/Layer4SupplyReconciliation/SupplyReconciliationView';
import { ExecutiveSOPView } from './components/Layer5ExecutiveSOP/ExecutiveSOPView';

const SOPAppContent: React.FC = () => {
  const { activeLayer, isLoading, loadingStep, loadingProgress } = useSOP();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 text-white font-bold text-2xl animate-pulse">
          TW
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-slate-100">
            TRENDWEAR S&OP INTELLIGENCE PLATFORM
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {loadingStep}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-500 max-w-sm">
          Loading 280,000+ M5-derived historical demand records, 1,080 apparel SKUs, 12 manufacturing plants, and 24 fabric BOM matrices...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeLayer === 1 && <DataInputsView />}
        {activeLayer === 2 && <DataQualityView />}
        {activeLayer === 3 && <DemandPlanningView />}
        {activeLayer === 4 && <SupplyReconciliationView />}
        {activeLayer === 5 && <ExecutiveSOPView />}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>TrendWear S&OP Intelligence Platform • Hackathon Prototype</span>
          <span className="font-mono text-[11px] text-slate-400">
            100% Calculated Dynamic S&OP Engine (Zero Hardcoding)
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SOPProvider>
      <SOPAppContent />
    </SOPProvider>
  );
}
