import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Radio, 
  Cpu, 
  Award, 
  BrainCircuit, 
  GitFork, 
  SlidersHorizontal, 
  FileText, 
  RefreshCw, 
  FileSpreadsheet,
  HelpCircle,
  ShieldAlert,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenLineage: () => void;
}

export const Layout: React.FC<Props> = ({ children, currentPage, onNavigate, onOpenLineage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'OVERVIEW' },
    { id: 'data', label: 'Data & Quality', icon: Database, category: 'FOUNDATION' },
    { id: 'demand', label: 'Demand Signal', icon: Radio, category: 'PIPELINE' },
    { id: 'procurement', label: 'Procurement Planning', icon: Cpu, category: 'PIPELINE' },
    { id: 'suppliers', label: 'Supplier Evaluation', icon: Award, category: 'INTELLIGENCE' },
    { id: 'risk', label: 'AI Risk Prediction', icon: BrainCircuit, category: 'INTELLIGENCE' },
    { id: 'allocation', label: 'Supplier Allocation', icon: GitFork, category: 'OPTIMIZATION' },
    { id: 'scenarios', label: 'Scenario Simulation', icon: SlidersHorizontal, category: 'DECISION SUPPORT' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText, category: 'EXECUTION' },
    { id: 'feedback', label: 'Feedback Loop', icon: RefreshCw, category: 'CONTINUOUS LEARNING' },
    { id: 'report', label: 'Executive Report', icon: FileSpreadsheet, category: 'GOVERNANCE' },
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#070b14] text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#0a101f] border-r border-slate-800/80 flex flex-col z-40 shrink-0`}>
        {/* Brand */}
        <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight whitespace-nowrap">
                  PROCUREMENT RISK
                </h1>
                <p className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider whitespace-nowrap">
                  INTELLIGENCE PLATFORM
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const prevItem = navItems[idx - 1];
            const showCategory = !prevItem || prevItem.category !== item.category;

            return (
              <React.Fragment key={item.id}>
                {showCategory && !isCollapsed && (
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1 whitespace-nowrap overflow-hidden">
                    {item.category}
                  </div>
                )}
                {showCategory && isCollapsed && (
                  <div className="h-4" />
                )}
                <button
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 text-cyan-300 shadow-md font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Engine status footer */}
        <div className="p-4 border-t border-slate-800 bg-[#070d18] text-xs flex flex-col gap-2">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  PuLP LP Optimizer
                </span>
                <span className="font-mono text-emerald-400 font-semibold truncate">CBC Online</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  AI Risk Engine
                </span>
                <span className="font-mono text-cyan-400 font-semibold truncate">Active</span>
              </div>
              <button
                onClick={onOpenLineage}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 border border-slate-700 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">How is it calculated?</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="PuLP LP Optimizer: CBC Online" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="AI Risk Engine: Active" />
              <button
                onClick={onOpenLineage}
                title="How is it calculated?"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 bg-[#0a101f]/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">PR 1: S&OP / Procurement Automation</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-mono font-medium">
              Multi-Objective LP Solver Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>All procurement operational data is synthetic demonstration data.</span>
            </div>
            <button
              onClick={onOpenLineage}
              className="text-xs text-slate-300 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data Lineage</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
