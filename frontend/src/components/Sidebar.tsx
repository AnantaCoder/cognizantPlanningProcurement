import React, { useState } from 'react';
import { useSOP } from '../context/SOPContext';
import {
  Database,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Compass,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeLayer, setActiveLayer } = useSOP();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const layers = [
    { id: 1, name: 'Business Data', icon: Database, desc: 'CSVs & Master Records' },
    { id: 2, name: 'Data Quality', icon: ShieldCheck, desc: 'Demand Unconstraining' },
    { id: 3, name: 'AI Demand', icon: TrendingUp, desc: 'Holt-Winters & Multi-Model' },
    { id: 4, name: 'Supply Recon', icon: Boxes, desc: 'BOM Fabric & Plant RCCP' },
    { id: 5, name: 'Exec S&OP', icon: Compass, desc: 'Optimizer & What-If' },
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto hidden md:flex shrink-0 transition-all duration-300`}
    >
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            S&OP Layers
          </h2>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1" aria-label="S&OP Layers">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'items-start gap-3'} p-3 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
              title={isCollapsed ? layer.name : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mt-0.5'} ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              {!isCollapsed && (
                <div>
                  <div className="text-sm font-semibold leading-tight">{layer.name}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">{layer.desc}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
