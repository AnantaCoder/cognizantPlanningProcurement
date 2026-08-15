import React, { useState, Suspense, lazy } from 'react';
import { SOPProvider, useSOP } from './context/SOPContext';

const ProcurementApp = lazy(() => import('./procurement/ProcurementApp'));
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DataInputsView } from './components/Layer1DataInputs/DataInputsView';
import { DataQualityView } from './components/Layer2DataQuality/DataQualityView';
import { DemandPlanningView } from './components/Layer3DemandPlanning/DemandPlanningView';
import { SupplyReconciliationView } from './components/Layer4SupplyReconciliation/SupplyReconciliationView';
import { ExecutiveSOPView } from './components/Layer5ExecutiveSOP/ExecutiveSOPView';

const SOPAppContent: React.FC = () => {
  const { activeLayer } = useSOP();


  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden pt-3">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeLayer === 1 && <DataInputsView />}
            {activeLayer === 2 && <DataQualityView />}
            {activeLayer === 3 && <DemandPlanningView />}
            {activeLayer === 4 && <SupplyReconciliationView />}
            {activeLayer === 5 && <ExecutiveSOPView />}
          </main>

          <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500 shrink-0">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
              <span>TrendWear S&OP Intelligence Platform • Hackathon Prototype</span>
              <span className="font-mono text-[11px] text-slate-400">
                100% Calculated Dynamic S&OP Engine (Zero Hardcoding)
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeModule, setActiveModule] = useState<'planning' | 'procurement'>('planning');

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Global Module Switcher Header */}
      <header className="bg-[#040810] border-b border-slate-800 z-[60] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-brand-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10 text-white font-bold text-sm tracking-wider">
              SCM
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-extrabold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                Planning and Procurement
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] hidden sm:block mt-0.5">
                Supply Chain Management
              </span>
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800/80">
            <button
              onClick={() => setActiveModule('planning')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeModule === 'planning'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              S&OP Planning
            </button>
            <button
              onClick={() => setActiveModule('procurement')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeModule === 'procurement'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              Procurement & Risk
            </button>
          </div>
        </div>
      </header>

      {/* Main Module Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeModule === 'planning' ? (
          <SOPProvider>
            <SOPAppContent />
          </SOPProvider>
        ) : (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-[#070b14]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <div className="text-cyan-400 text-sm font-mono font-bold animate-pulse">Loading Procurement Intelligence...</div>
              </div>
            </div>
          }>
            <ProcurementApp />
          </Suspense>
        )}
      </div>
    </div>
  );
}
