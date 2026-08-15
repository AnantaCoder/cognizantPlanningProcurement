import React from 'react';
import { useSOP } from '../context/SOPContext';
import {
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isLoading,
    activeLayer,
    setActiveLayer,
    reloadDatasets,
    optimizationSummary
  } = useSOP();



  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">


      {/* Main Brand & Actions Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center shadow-inner border border-slate-700/50 text-slate-200 font-bold tracking-widest relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10 font-serif">TW</span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-medium bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-wide">
                TRENDWEAR S&OP INTELLIGENCE PLATFORM
              </h1>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                <span className="text-[9px] font-medium text-brand-300 uppercase tracking-widest">
                  Integrated S&OP
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-light">
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


    </header>
  );
};
