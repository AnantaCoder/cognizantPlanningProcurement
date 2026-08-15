import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from 'recharts';
import type { DashboardData } from '../types';
import { fetchDashboard } from '../services/api';
import { ArchitectureWorkflow } from '../components/ArchitectureWorkflow';

interface Props {
  selectedMaterial: string;
  selectedPlant: string;
  selectedSeason: string;
  onNavigate: (page: string) => void;
  onSelectSupplier: (supId: string) => void;
  onOpenLineage: () => void;
}

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f43f5e',
  CRITICAL: '#a855f7'
};

export const DashboardPage: React.FC<Props> = ({
  selectedMaterial,
  selectedPlant,
  selectedSeason,
  onNavigate,
  onSelectSupplier,
  onOpenLineage
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboard({ material_id: selectedMaterial, plant_id: selectedPlant, season: selectedSeason })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedMaterial, selectedPlant, selectedSeason]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Calculating real-time multi-objective procurement telemetry...
      </div>
    );
  }

  const kpis = data.kpis;
  const pieData = Object.entries(data.risk_distribution).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-6">
      {/* Workflow Navigation */}
      <ArchitectureWorkflow activeStage="dashboard" onNavigate={onNavigate} />

      {/* Hero Welcome & Value Proposition */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                Autonomous S&OP Sourcing
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time Decision Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Executive Procurement & Supplier Risk Intelligence
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Dynamically balancing <span className="text-cyan-300 font-semibold">Cost Efficiency</span>, <span className="text-rose-300 font-semibold">Disruption Risk</span>, <span className="text-amber-300 font-semibold">Capacity Constraints</span>, and <span className="text-emerald-300 font-semibold">Lead Times</span> using AI ML Disruption Prediction and PuLP Linear Programming.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('allocation')}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize Allocation</span>
            </button>
            <button
              onClick={() => onNavigate('scenarios')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Simulate Scenarios
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {/* Total Material Requirement */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Gross Requirement</span>
            <Package className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {kpis.total_material_requirement?.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-300 font-mono mt-0.5">Units demanded</div>
        </div>

        {/* Net Procurement Requirement */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Net Requirement</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-indigo-300 mt-1">
            {kpis.net_procurement_requirement?.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Post inventory offset</div>
        </div>

        {/* Total Spend */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Total Spend</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            ${(kpis.total_procurement_cost_usd / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Multi-supplier optimal</div>
        </div>

        {/* Average Risk */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Average Risk</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {kpis.average_supplier_risk_pct}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{kpis.high_risk_suppliers_count} high-risk vendors</div>
        </div>

        {/* Expected Delay */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Expected Delay</span>
            <Clock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-300 mt-1">
            {kpis.expected_delivery_delay_weeks} wks
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lead-time variance</div>
        </div>

        {/* Supplier Dependency */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Max Concentration</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300 mt-1">
            {kpis.supplier_dependency_pct}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{kpis.supplier_dependency_risk}</div>
        </div>
      </div>

      {/* Central Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Demand Signal Trend (Area Chart) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Material Demand Signal & Inventory Balance Trend
              </h3>
              <p className="text-[11px] text-slate-400">Weekly Gross Requirement vs Current Inventory vs Net Need</p>
            </div>
            <button
              onClick={() => onNavigate('demand')}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              View Signal <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.demand_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="Week" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(w) => `W${w}`} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Gross_Material_Requirement" stroke="#0ea5e9" fillOpacity={1} fill="url(#grossGrad)" name="Gross Requirement" />
                <Area type="monotone" dataKey="Net_Procurement_Requirement" stroke="#6366f1" fillOpacity={1} fill="url(#netGrad)" name="Net Requirement" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Disruption Risk Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                AI Supplier Risk Profile
              </h3>
              <p className="text-[11px] text-slate-400">ML Disruption Probability Tiers</p>
            </div>
            <button
              onClick={() => onNavigate('risk')}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Risk Matrix <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">LOW: {data.risk_distribution.LOW}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">MED: {data.risk_distribution.MEDIUM}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">HIGH: {data.risk_distribution.HIGH}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-300">CRIT: {data.risk_distribution.CRITICAL}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Objective Optimization Results Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Multi-Objective Optimal Sourcing Allocations (PuLP LP Solution)
            </h3>
            <p className="text-[11px] text-slate-400">
              Balanced allocation splits preventing single-supplier risk concentration
            </p>
          </div>
          <button
            onClick={() => onNavigate('allocation')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Adjust LP Constraints <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Material</th>
                <th>Allocated Qty</th>
                <th>Volume Share</th>
                <th>Unit Price</th>
                <th>Total Spend</th>
                <th>Capacity Util</th>
                <th>Risk Tier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.allocations.slice(0, 8).map((a) => (
                <tr key={`${a.supplier_id}-${a.material_id}`}>
                  <td>
                    <button
                      onClick={() => onSelectSupplier(a.supplier_id)}
                      className="font-semibold text-cyan-300 hover:underline text-left"
                    >
                      {a.supplier_name}
                    </button>
                    <div className="text-[10px] text-slate-400 font-mono">{a.supplier_id} • {a.country}</div>
                  </td>
                  <td className="font-mono text-xs text-slate-300">{a.material_id}</td>
                  <td className="font-mono font-semibold text-white">{a.allocated_quantity?.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-cyan-400 h-full rounded-full" 
                          style={{ width: `${a.allocation_percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-300">{a.allocation_percentage}%</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">${a.unit_price?.toFixed(2)}</td>
                  <td className="font-mono font-semibold text-emerald-400">${a.total_spend?.toLocaleString()}</td>
                  <td>
                    <span className={a.capacity_pressure_flag.includes('HIGH') ? 'badge-med' : 'text-xs text-slate-300 font-mono'}>
                      {a.capacity_utilization_pct}%
                    </span>
                  </td>
                  <td>
                    <span className={
                      a.risk_class === 'LOW' ? 'badge-low' :
                      a.risk_class === 'MEDIUM' ? 'badge-med' :
                      a.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'
                    }>
                      {a.risk_class} ({a.risk_probability}%)
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onSelectSupplier(a.supplier_id)}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
