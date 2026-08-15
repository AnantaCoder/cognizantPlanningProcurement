import React, { useState, useCallback } from 'react';
import { SlidersHorizontal, Play, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { simulateScenario } from '../services/api';

interface Props {
  selectedMaterial: string;
  onAllocationsChange: (allocs: any[]) => void;
  onNavigate: (page: string) => void;
}

export const ScenarioSimPage: React.FC<Props> = ({ selectedMaterial, onAllocationsChange, onNavigate }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    scenario_type: 'custom',
    demand_change_pct: 0,
    disrupted_supplier_id: '',
    supplier_capacity_reduction_pct: 0,
    lead_time_increase_pct: 0,
    material_price_increase_pct: 0,
    risk_weight: 0.40,
    max_supplier_dependency_pct: 60,
  });

  const applyPreset = (type: string) => {
    if (type === 'supplier_disruption') setParams(p => ({ ...p, scenario_type: 'supplier_disruption', disrupted_supplier_id: 'SUP-004', supplier_capacity_reduction_pct: 50, demand_change_pct: 0 }));
    else if (type === 'demand_spike_20') setParams(p => ({ ...p, scenario_type: 'demand_spike_20', demand_change_pct: 20, disrupted_supplier_id: '', supplier_capacity_reduction_pct: 0 }));
    else if (type === 'demand_spike_30') setParams(p => ({ ...p, scenario_type: 'demand_spike_30', demand_change_pct: 30, disrupted_supplier_id: '', supplier_capacity_reduction_pct: 0 }));
    else setParams(p => ({ ...p, scenario_type: 'custom' }));
  };

  const runScenario = useCallback(() => {
    setLoading(true);
    simulateScenario({
      ...params,
      material_id: selectedMaterial !== 'ALL' ? selectedMaterial : null,
    }).then(res => {
      setResult(res);
      if (res.scenario_allocations) onAllocationsChange(res.scenario_allocations);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  }, [params, selectedMaterial, onAllocationsChange]);

  const getDeltaIcon = (status: string) => {
    if (status === 'Positive') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    if (status === 'Negative') return <TrendingUp className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-med">STAGE 06A: SCENARIO SIMULATION</span>
            <span className="text-xs text-slate-400 font-mono">What-If Stress Testing</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Procurement Scenario Simulation & What-If Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">Each scenario fully re-optimizes through Demand → Risk → PuLP Solver → Allocation with zero caching.</p>
        </div>
        <button onClick={() => onNavigate('purchase-orders')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 self-start">
          <span>View Purchase Orders</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scenario Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'normal', label: '📊 Normal Baseline', cls: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400' },
          { id: 'supplier_disruption', label: '⚡ Supplier Disruption', cls: 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:border-rose-400' },
          { id: 'demand_spike_20', label: '📈 Demand Spike +20%', cls: 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400' },
          { id: 'demand_spike_30', label: '🚀 Demand Spike +30%', cls: 'bg-orange-950/40 border-orange-500/40 text-orange-300 hover:border-orange-400' },
          { id: 'custom', label: '🔧 Custom Scenario', cls: 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500' },
        ].map(pr => (
          <button key={pr.id} onClick={() => applyPreset(pr.id)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${pr.cls} ${params.scenario_type === pr.id ? 'ring-1 ring-white/30' : ''}`}>
            {pr.label}
          </button>
        ))}
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">What-If Control Panel</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Demand Change %</label>
            <div className="flex items-center gap-2">
              <input type="range" min={-30} max={50} step={5} value={params.demand_change_pct}
                onChange={e => setParams(p => ({ ...p, demand_change_pct: parseInt(e.target.value) }))}
                className="flex-1 accent-indigo-500" />
              <span className={`font-mono text-sm font-bold w-14 text-right ${params.demand_change_pct > 0 ? 'text-rose-400' : params.demand_change_pct < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {params.demand_change_pct > 0 ? '+' : ''}{params.demand_change_pct}%
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Disrupted Supplier ID</label>
            <input type="text" placeholder="e.g. SUP-004, SUP-014"
              value={params.disrupted_supplier_id}
              onChange={e => setParams(p => ({ ...p, disrupted_supplier_id: e.target.value, scenario_type: 'supplier_disruption' }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Supplier Capacity Reduction %</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} step={10} value={params.supplier_capacity_reduction_pct}
                onChange={e => setParams(p => ({ ...p, supplier_capacity_reduction_pct: parseInt(e.target.value) }))}
                className="flex-1 accent-rose-500" />
              <span className="font-mono text-sm font-bold text-rose-400 w-12 text-right">-{params.supplier_capacity_reduction_pct}%</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Lead Time Increase %</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={60} step={5} value={params.lead_time_increase_pct}
                onChange={e => setParams(p => ({ ...p, lead_time_increase_pct: parseInt(e.target.value) }))}
                className="flex-1 accent-amber-500" />
              <span className="font-mono text-sm font-bold text-amber-400 w-12 text-right">+{params.lead_time_increase_pct}%</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Risk Weight (LP λ)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.1} max={0.9} step={0.05} value={params.risk_weight}
                onChange={e => setParams(p => ({ ...p, risk_weight: parseFloat(e.target.value) }))}
                className="flex-1 accent-cyan-500" />
              <span className="font-mono text-sm font-bold text-cyan-400 w-10 text-right">{(params.risk_weight * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Max Supplier Dependency %</label>
            <div className="flex items-center gap-2">
              <input type="range" min={20} max={100} step={5} value={params.max_supplier_dependency_pct}
                onChange={e => setParams(p => ({ ...p, max_supplier_dependency_pct: parseInt(e.target.value) }))}
                className="flex-1 accent-purple-500" />
              <span className="font-mono text-sm font-bold text-purple-400 w-10 text-right">{params.max_supplier_dependency_pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <button onClick={runScenario} disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Running Scenario...</span></>
              : <><Play className="w-4 h-4" /><span>RUN SCENARIO & COMPARE WITH BASELINE</span></>}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
          Configure a scenario above and click <strong className="text-rose-300">RUN SCENARIO</strong> to see Baseline vs Scenario comparison.
        </div>
      )}

      {result && (
        <>
          {/* Side-by-Side KPI Comparison */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Baseline vs Scenario Impact Analysis ({result.scenario_metadata.scenario_type})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {result.comparison_kpis.map((kpi: any) => (
                <div key={kpi.metric} className={`p-3.5 rounded-xl border ${kpi.status === 'Positive' ? 'bg-emerald-950/30 border-emerald-500/30' : kpi.status === 'Negative' ? 'bg-rose-950/30 border-rose-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">{kpi.metric}</div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">Baseline</div>
                      <div className="text-xs font-bold text-slate-300">{typeof kpi.baseline === 'number' ? kpi.baseline.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.baseline} {kpi.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Scenario</div>
                      <div className={`text-xs font-bold ${kpi.status === 'Positive' ? 'text-emerald-400' : kpi.status === 'Negative' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {typeof kpi.scenario === 'number' ? kpi.scenario.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.scenario} {kpi.unit}
                      </div>
                    </div>
                  </div>
                  <div className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${kpi.status === 'Positive' ? 'text-emerald-400' : kpi.status === 'Negative' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {getDeltaIcon(kpi.status)}
                    <span>{kpi.delta > 0 ? '+' : ''}{typeof kpi.delta === 'number' ? kpi.delta.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.delta} {kpi.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Allocation Comparison Bar Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Supplier Volume Shift — Baseline vs Scenario</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.supplier_comparison.slice(0, 10)} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="supplier_name" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => v.split(' ')[0]} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="baseline_qty" name="Baseline Qty" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scenario_qty" name="Scenario Qty" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Supplier Change Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Supplier-Level Delta Impact</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Baseline Qty</th>
                    <th>Scenario Qty</th>
                    <th>Volume Δ</th>
                    <th>Spend Δ</th>
                    <th>Risk Class</th>
                  </tr>
                </thead>
                <tbody>
                  {result.supplier_comparison.map((sc: any) => (
                    <tr key={sc.supplier_id}>
                      <td>
                        <div className="font-semibold text-xs text-white">{sc.supplier_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sc.supplier_id}</div>
                      </td>
                      <td className="font-mono text-xs text-slate-300">{sc.baseline_qty?.toLocaleString()}</td>
                      <td className="font-mono text-xs font-bold text-white">{sc.scenario_qty?.toLocaleString()}</td>
                      <td className={`font-mono text-xs font-semibold ${sc.qty_change > 0 ? 'text-rose-400' : sc.qty_change < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {sc.qty_change > 0 ? '+' : ''}{sc.qty_change?.toLocaleString()}
                      </td>
                      <td className={`font-mono text-xs ${sc.scenario_spend > sc.baseline_spend ? 'text-rose-300' : 'text-emerald-300'}`}>
                        ${sc.scenario_spend?.toLocaleString()}
                      </td>
                      <td>
                        <span className={sc.risk_class === 'LOW' ? 'badge-low' : sc.risk_class === 'MEDIUM' ? 'badge-med' : sc.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                          {sc.risk_class}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
