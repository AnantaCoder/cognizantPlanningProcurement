import React, { useState } from 'react';
import { useSOP } from '../context/SOPContext';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Factory,
  Boxes,
  Cpu,
  Award,
  BrainCircuit,
  GitFork,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, setLineageModalOpen } = useSOP();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', step: '01', icon: LayoutDashboard, category: 'OVERVIEW' },
    { id: 'data-quality', label: 'Data Ingestion & Quality', step: '02', icon: ShieldCheck, category: 'FOUNDATION' },
    { id: 'demand-planning', label: 'Demand Forecasting', step: '03', icon: TrendingUp, category: 'P2 DEMAND' },
    { id: 'supply-capacity', label: 'Supply & Plant Capacity', step: '04', icon: Factory, category: 'P2 SUPPLY' },
    { id: 'material-requirement', label: 'Material Requirement', step: '05', icon: Boxes, category: 'P2 → PR1 BRIDGE', isBridge: true },
    { id: 'procurement-intel', label: 'Procurement Planning', step: '06', icon: Cpu, category: 'PR1 INTELLIGENCE' },
    { id: 'supplier-eval', label: 'Supplier Evaluation', step: '07', icon: Award, category: 'PR1 INTELLIGENCE' },
    { id: 'risk-prediction', label: 'AI Supplier Risk', step: '08', icon: BrainCircuit, category: 'PR1 INTELLIGENCE' },
    { id: 'supplier-allocation', label: 'Multi-Objective Solver', step: '09', icon: GitFork, category: 'PR1 OPTIMIZATION' },
    { id: 'purchase-orders', label: 'Purchase Orders', step: '10', icon: FileText, category: 'PR1 EXECUTION' },
    { id: 'scenario-sim', label: 'What-If Scenarios', step: '11', icon: SlidersHorizontal, category: 'GOVERNANCE' },
    { id: 'feedback-loop', label: 'Feedback Loop', step: '12', icon: RefreshCw, category: 'GOVERNANCE' },
    { id: 'executive-sop', label: 'Executive S&OP Plan', step: '13', icon: FileSpreadsheet, category: 'DECISION BRIEF' },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#0a101f] border-r border-slate-800 flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 z-40`}
    >
      {/* Sidebar Header */}
      <div className={`p-3.5 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Decision Pipeline
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5" aria-label="Pipeline Steps">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const prevItem = navItems[idx - 1];
          const showCategory = !prevItem || prevItem.category !== item.category;

          return (
            <React.Fragment key={item.id}>
              {showCategory && !isCollapsed && (
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2.5 pt-3 pb-1 flex items-center justify-between">
                  <span>{item.category}</span>
                  {item.isBridge && (
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 py-0.2 rounded font-mono font-bold">
                      KEY LINK
                    </span>
                  )}
                </div>
              )}
              {showCategory && isCollapsed && <div className="h-3" />}

              <button
                onClick={() => setActivePage(item.id)}
                title={isCollapsed ? `${item.step}. ${item.label}` : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-xl text-left transition-all ${
                  isActive
                    ? item.isBridge
                      ? 'bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/60 text-indigo-200 shadow-md font-semibold'
                      : 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 text-cyan-300 shadow-md font-semibold'
                    : item.isBridge
                    ? 'text-indigo-300/80 hover:text-indigo-200 hover:bg-indigo-950/30 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? item.isBridge ? 'text-indigo-400' : 'text-cyan-400'
                        : item.isBridge ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate font-medium">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    {item.step}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070d18] text-xs shrink-0 flex flex-col gap-1.5">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PuLP CBC Solver
              </span>
              <span className="font-mono text-emerald-400 font-semibold">Active</span>
            </div>
            <button
              onClick={() => setLineageModalOpen(true)}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How Calculated?</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setLineageModalOpen(true)}
            title="How Calculated?"
            className="p-2 rounded-lg bg-slate-800 text-cyan-300 mx-auto"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

