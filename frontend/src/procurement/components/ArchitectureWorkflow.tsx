import React from 'react';
import { 
  Radio, 
  Cpu, 
  Award, 
  BrainCircuit, 
  GitFork, 
  FileText, 
  SlidersHorizontal, 
  RefreshCw, 
  ArrowRight,
  ArrowDown
} from 'lucide-react';

interface Props {
  activeStage?: string;
  onNavigate?: (page: string) => void;
}

export const ArchitectureWorkflow: React.FC<Props> = ({ activeStage = 'dashboard', onNavigate }) => {
  const stages = [
    { id: 'demand', title: 'DEMAND SIGNAL', sub: 'SKU & Plant Requirements', icon: Radio, page: 'demand' },
    { id: 'procurement', title: 'PROCUREMENT INTEL', sub: 'Net Requirement & Timing', icon: Cpu, page: 'procurement' },
    { id: 'suppliers', title: 'SUPPLIER EVALUATION', sub: 'Multi-Criteria Scoring', icon: Award, page: 'suppliers' },
    { id: 'risk', title: 'AI RISK PREDICTION', sub: 'ML Disruption & Delay', icon: BrainCircuit, page: 'risk' },
    { id: 'allocation', title: 'MULTI-OBJECTIVE ALLOCATION', sub: 'PuLP Linear Optimizer', icon: GitFork, page: 'allocation' },
  ];

  const downstream = [
    { id: 'scenarios', title: 'SCENARIO SIMULATION', sub: 'Disruption & Spike Testing', icon: SlidersHorizontal, page: 'scenarios' },
    { id: 'purchase-orders', title: 'PURCHASE ORDERS', sub: 'Risk-Flagged PO Generation', icon: FileText, page: 'purchase-orders' },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl mb-6 shadow-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            End-to-End Decision Architecture Flow (Click Stage to Jump)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          AI Risk Prediction ──► PuLP Multi-Objective Optimization ──► Closed-Loop Telemetry
        </span>
      </div>

      {/* Main Linear Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isActive = activeStage === st.id;
          return (
            <React.Fragment key={st.id}>
              <button
                onClick={() => onNavigate && onNavigate(st.page)}
                className={`flex flex-col items-start p-3 rounded-xl transition-all duration-200 text-left border ${
                  isActive
                    ? 'bg-cyan-950/60 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700/60 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">STAGE 0{idx + 1}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white leading-snug">{st.title}</div>
                <div className="text-[10px] text-slate-400 truncate w-full mt-0.5">{st.sub}</div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Downstream Branches & Feedback Loop */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Downstream branches */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 font-semibold">
            <ArrowDown className="w-3 h-3 text-cyan-400" /> Allocation Execution:
          </span>
          <div className="flex gap-2">
            {downstream.map(ds => {
              const Icon = ds.icon;
              const isActive = activeStage === ds.id;
              return (
                <button
                  key={ds.id}
                  onClick={() => onNavigate && onNavigate(ds.page)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-950/70 border-indigo-400 text-indigo-200 shadow-md'
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{ds.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Loop Badge */}
        <button
          onClick={() => onNavigate && onNavigate('feedback')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs transition-all ${
            activeStage === 'feedback'
              ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
              : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-emerald-400" />
          <span className="font-semibold">CONTINUOUS LEARNING FEEDBACK LOOP</span>
          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
            Actuals ➔ Risk Model Update
          </span>
        </button>
      </div>
    </div>
  );
};
