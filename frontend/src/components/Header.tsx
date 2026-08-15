import React from 'react';
import { useSOP } from '../context/SOPContext';
import {
  Sparkles,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isLoading,
    activePage,
    setActivePage,
    reloadDatasets,
    optimizationSummary,
    setLineageModalOpen
  } = useSOP();

  const pipelineStages = [
    { id: 'data-quality', label: '1. Data Quality' },
    { id: 'demand-planning', label: '2. Demand Plan' },
    { id: 'supply-capacity', label: '3. Capacity RCCP' },
    { id: 'material-requirement', label: '4. Material Bridge', isBridge: true },
    { id: 'procurement-intel', label: '5. Procurement' },
    { id: 'risk-prediction', label: '6. AI Risk' },
    { id: 'supplier-allocation', label: '7. PuLP Solver' },
    { id: 'purchase-orders', label: '8. Purchase Orders' },
    { id: 'scenario-sim', label: '9. Scenarios' },
    { id: 'executive-sop', label: '10. Executive Brief' }
  ];

  return (
    <header className="bg-[#040810] border-b border-slate-800 sticky top-0 z-50 shadow-2xl shrink-0">
      {/* Main Brand & Actions Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 text-white font-black text-sm tracking-wider">
            TW
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                TRENDWEAR S&OP INTELLIGENCE PLATFORM
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                P2 + PR1 Unified
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-normal">
              Integrated Demand, Rough-Cut Capacity, Material Explosion & Multi-Objective Supplier Allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {optimizationSummary && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 text-[11px]">Solver OTIF:</span>
              <strong className="text-emerald-400 font-mono text-xs">{optimizationSummary.serviceLevelPct}%</strong>
            </div>
          )}

          <button
            onClick={() => setLineageModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 text-xs font-medium transition-colors"
            title="View mathematical formulas and data lineage"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Data Lineage</span>
          </button>

          <button
            onClick={() => reloadDatasets()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            title="Reload S&OP and Procurement datasets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Recalculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* End-to-End Pipeline Interactive Stepper */}
      <div className="bg-[#070d1a] border-t border-slate-800/80 py-1.5 px-4 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto flex items-center gap-1 text-[10px] font-mono min-w-max">
          <span className="text-slate-400 uppercase font-semibold mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Pipeline:</span>
          </span>

          {pipelineStages.map((stage, idx) => {
            const isActive = activePage === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setActivePage(stage.id)}
                  className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                    isActive
                      ? stage.isBridge
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : stage.isBridge
                      ? 'text-indigo-300 hover:bg-indigo-950/50 bg-indigo-950/30 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{stage.label}</span>
                </button>
                {idx < pipelineStages.length - 1 && (
                  <span className="text-slate-700 select-none">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
};

