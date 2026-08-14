import React from 'react';
import { useSOP } from '../context/SOPContext';
import {
  Database,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Compass,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    data,
    isLoading,
    activeLayer,
    setActiveLayer,
    reloadDatasets,
    optimizationSummary
  } = useSOP();

  const layers = [
    { id: 1, name: '1. Business Data Inputs', icon: Database, desc: 'CSVs & Master Records' },
    { id: 2, name: '2. Data Quality & Hygiene', icon: ShieldCheck, desc: 'Censored Demand Unconstraining' },
    { id: 3, name: '3. AI Demand Planning', icon: TrendingUp, desc: 'Holt-Winters & Multi-Model' },
    { id: 4, name: '4. Supply Reconciliation', icon: Boxes, desc: 'BOM Fabric & Plant RCCP' },
    { id: 5, name: '5. Executive S&OP & Actions', icon: Compass, desc: 'Optimizer & What-If Studio' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      {/* Top Notification / Disclaimer Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Historical demand foundation:</span>
          <span>M5 Forecasting dataset (retail sales patterns adapted to apparel)</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">TrendWear operational attributes are synthetic and created for demonstration.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span>Records: <strong className="text-brand-400">{data?.summary.totalRecords.toLocaleString() || '280,800'}</strong></span>
          <span>SKUs: <strong className="text-slate-200">{data?.summary.totalSkus || '1,080'}</strong></span>
          <span>Plants: <strong className="text-slate-200">{data?.summary.totalPlants || '12'}</strong></span>
          <span>Fabrics: <strong className="text-slate-200">{data?.summary.totalFabrics || '24'}</strong></span>
        </div>
      </div>

      {/* Main Brand & Actions Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold tracking-wider">
            TW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                TRENDWEAR S&OP INTELLIGENCE PLATFORM
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase">
                Integrated S&OP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              End-to-End Demand Forecasting, Capacity Rough-Cut & Production Optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {optimizationSummary && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-400">OTIF Service Level:</span>
              <strong className="text-emerald-400 font-mono">{optimizationSummary.serviceLevelPct}%</strong>
            </div>
          )}

          <button
            onClick={() => reloadDatasets()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="Reload CSV Datasets from runtime files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            <span>{isLoading ? 'Computing...' : 'Reload Data'}</span>
          </button>
        </div>
      </div>

      {/* 5-Layer Interactive Navigation Tabs */}
      <div className="border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="S&OP Layers">
            {layers.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className="font-semibold leading-tight">{layer.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal hidden lg:block">{layer.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
