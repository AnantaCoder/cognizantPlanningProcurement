import React, { useState, useCallback, useEffect } from 'react';
import { GitFork, RefreshCw, Sparkles, DollarSign, ShieldAlert, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ScatterChart, Scatter, Cell, ZAxis, ReferenceLine
} from 'recharts';
import { optimizeAllocation } from '../services/api';
import { SupplierDetailModal } from '../components/SupplierDetailModal';
import { useSOP } from '../../context/SOPContext';

interface Props {
  selectedMaterial: string;
  selectedPlant: string;
  onAllocationsChange: (allocs: any[]) => void;
  onNavigate: (page: string) => void;
}

export const AllocationPage: React.FC<Props> = ({ selectedMaterial, selectedPlant, onAllocationsChange, onNavigate }) => {
  const { bridgedProcurementItem } = useSOP();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    demand_multiplier: 1.0,
    risk_weight: 0.40,
    max_dependency_pct: 60.0,
    enforce_contracts: true,
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const runOptimizer = useCallback(() => {
    setLoading(true);
    optimizeAllocation({
      material_id: selectedMaterial !== 'ALL' ? selectedMaterial : (bridgedProcurementItem?.materialId || null),
      plant_id: selectedPlant !== 'ALL' ? selectedPlant : null,
      demand_multiplier: params.demand_multiplier,
      risk_weight: params.risk_weight,
      max_supplier_dependency_pct: params.max_dependency_pct,
      enforce_contracts: params.enforce_contracts,
      net_procurement_requirement: bridgedProcurementItem?.netRequirement
    }).then(res => {
      setResult(res);
      onAllocationsChange(res.allocations);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  }, [selectedMaterial, selectedPlant, params, onAllocationsChange, bridgedProcurementItem]);

  // Auto-run optimizer on initial mount
  useEffect(() => {
    runOptimizer();
  }, [runOptimizer]);

  const RISK_COLORS: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', CRITICAL: '#a855f7' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">STAGE 05: MULTI-OBJECTIVE ALLOCATION</span>
            <span className="text-xs text-slate-400 font-mono">PuLP CBC Linear Solver</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Multi-Objective Procurement Allocation Optimizer</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure LP parameters, then click <strong className="text-cyan-300">RUN OPTIMIZER</strong> to compute the optimal cost-risk-balanced supplier split.</p>
        </div>
        <button onClick={() => onNavigate('purchase-orders')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 self-start">
          <span>Generate Purchase Orders</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bridged requirement indicator banner */}
      {bridgedProcurementItem && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/50 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
              P2
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Bridged Demand Signal Active from S&OP BOM Engine:</span>
                <span className="text-indigo-300 font-mono">{bridgedProcurementItem.materialName}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Target Net Procurement Volume:{' '}
                <strong className="text-emerald-400 font-mono">
                  {bridgedProcurementItem.netRequirement.toLocaleString()} {bridgedProcurementItem.unitOfMeasure || 'Meters'}
                </strong>{' '}
                • Target Delivery Date: <span className="font-mono text-cyan-300">{bridgedProcurementItem.requiredDate || 'TBD'}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-semibold">
            PuLP Objective Constrained to Net Req
          </span>
        </div>
      )}

      {/* LP Parameters Control Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">LP Optimizer Parameters</h3>
          <span className="text-[10px] text-slate-400 font-mono ml-auto">min Σ(Cost + λ·Risk + λ·Delay) subject to Capacity, Contracts, Dependency</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Demand Multiplier</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.5} max={2.0} step={0.05} value={params.demand_multiplier}
                onChange={e => setParams(p => ({ ...p, demand_multiplier: parseFloat(e.target.value) }))}
                className="flex-1 accent-cyan-500" />
              <span className="font-mono text-xs font-bold text-cyan-300 w-12 text-right">{(params.demand_multiplier * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Risk Weight (λ)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.1} max={0.9} step={0.05} value={params.risk_weight}
                onChange={e => setParams(p => ({ ...p, risk_weight: parseFloat(e.target.value) }))}
                className="flex-1 accent-rose-500" />
              <span className="font-mono text-xs font-bold text-rose-300 w-10 text-right">{(params.risk_weight * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Max Supplier Dependency %</label>
            <div className="flex items-center gap-2">
              <input type="range" min={20} max={100} step={5} value={params.max_dependency_pct}
                onChange={e => setParams(p => ({ ...p, max_dependency_pct: parseFloat(e.target.value) }))}
                className="flex-1 accent-amber-500" />
              <span className="font-mono text-xs font-bold text-amber-300 w-10 text-right">{params.max_dependency_pct}%</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <label className="text-[11px] font-medium text-slate-400 block mb-2">Contract Enforcement</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setParams(p => ({ ...p, enforce_contracts: !p.enforce_contracts }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${params.enforce_contracts ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${params.enforce_contracts ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-xs text-slate-300">{params.enforce_contracts ? 'Enforced' : 'Relaxed'}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-5">
          <button onClick={runOptimizer} disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> <span>Solving LP...</span></>
              : <><Sparkles className="w-4 h-4" /> <span>RUN MULTI-OBJECTIVE LP OPTIMIZER</span></>}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
          Configure parameters above and click <strong className="text-cyan-300">RUN OPTIMIZER</strong> to compute supplier allocation plan.
        </div>
      )}

      {result && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {[
              { label: 'Total Requirement', val: result.summary.total_procurement_requirement?.toLocaleString(), color: 'text-white', sub: 'Units' },
              { label: 'Total Allocated', val: result.summary.total_allocated_quantity?.toLocaleString(), color: 'text-cyan-300', sub: 'Units' },
              { label: 'Total Cost', val: `$${(result.summary.total_procurement_cost_usd / 1000).toFixed(1)}k`, color: 'text-emerald-400', sub: 'USD' },
              { label: 'Avg Risk', val: `${result.summary.average_weighted_risk}%`, color: 'text-amber-400', sub: 'Probability' },
              { label: 'Expected Delay', val: `${result.summary.expected_delivery_delay_weeks} wks`, color: 'text-rose-400', sub: 'Weighted avg' },
              { label: 'Max Concentration', val: `${result.summary.supplier_dependency_pct}%`, color: 'text-purple-300', sub: result.summary.supplier_dependency_risk },
            ].map(k => (
              <div key={k.label} className="glass-panel p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">{k.label}</div>
                <div className={`text-lg font-bold mt-0.5 ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-500 font-mono">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allocation Bar Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Optimal Supplier Allocation Volume (PuLP Solution)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.allocations.slice(0, 10)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="supplier_id" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="allocated_quantity" name="Allocated Qty" radius={[4, 4, 0, 0]}>
                      {result.allocations.slice(0, 10).map((a: any, i: number) => (
                        <Cell key={i} fill={RISK_COLORS[a.risk_class] ?? '#0ea5e9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost vs Risk Matrix */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Cost vs Risk Procurement Matrix</h3>
              <p className="text-[10px] text-slate-400 mb-3">Bubble = Capacity. Best suppliers cluster: Lower-left (Low Cost + Low Risk)</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="unit_cost" name="Unit Cost" stroke="#64748b" tick={{ fontSize: 9 }} label={{ value: 'Unit Cost ($)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="risk_probability" name="Risk %" stroke="#64748b" tick={{ fontSize: 9 }} label={{ value: 'Risk %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <ZAxis dataKey="capacity" range={[40, 400]} name="Capacity" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs">
                          <p className="font-bold text-white">{payload[0]?.payload?.supplier_name}</p>
                          <p className="text-slate-300">Cost: ${payload[0]?.payload?.unit_cost?.toFixed(2)}</p>
                          <p className="text-slate-300">Risk: {payload[0]?.payload?.risk_probability?.toFixed(1)}%</p>
                          <p className="text-slate-400 text-[10px]">{payload[0]?.payload?.quadrant}</p>
                        </div>
                      ) : null} />
                    <Scatter
                      data={result.cost_vs_risk_matrix}
                      onClick={(d: any) => setSelectedSupplierId(d.supplier_id)}
                    >
                      {result.cost_vs_risk_matrix.map((d: any, i: number) => (
                        <Cell key={i} fill={RISK_COLORS[d.risk_class] ?? '#94a3b8'} fillOpacity={0.75} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Allocation Results Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Optimal Procurement Plan — PuLP LP Solution ({result.optimization_status})
            </h3>
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 mb-4">
              <strong>Optimization Objective:</strong> min Σ(Unit Price + {(params.risk_weight * 100).toFixed(0)}%·Risk Penalty + Delay Penalty + Quality Penalty) — Subject to: Capacity, Contract Min/Max, {params.max_dependency_pct}% Max Dependency, Demand Fulfillment.
              <br /><strong>Key Insight:</strong> System did NOT simply select cheapest suppliers. Volume is split to balance cost with disruption risk.
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
                    <th>Cap. Util %</th>
                    <th>Risk Probability</th>
                    <th>Risk Class</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allocations.map((a: any, i: number) => (
                    <tr key={i} className="cursor-pointer" onClick={() => setSelectedSupplierId(a.supplier_id)}>
                      <td>
                        <div className="font-semibold text-cyan-300 text-xs">{a.supplier_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.supplier_id} · {a.country}</div>
                      </td>
                      <td className="font-mono text-xs text-slate-300">{a.material_id}</td>
                      <td className="font-mono font-bold text-white">{a.allocated_quantity?.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-cyan-400 h-full" style={{ width: `${a.allocation_percentage}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">{a.allocation_percentage}%</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs">${a.unit_price?.toFixed(2)}</td>
                      <td className="font-mono text-xs font-semibold text-emerald-400">${a.total_spend?.toLocaleString()}</td>
                      <td>
                        <span className={a.capacity_utilization_pct >= 90 ? 'badge-high' : a.capacity_utilization_pct >= 70 ? 'badge-med' : 'badge-low'}>
                          {a.capacity_utilization_pct}%
                        </span>
                      </td>
                      <td className="font-mono text-xs" style={{ color: RISK_COLORS[a.risk_class] }}>{a.risk_probability}%</td>
                      <td>
                        <span className={a.risk_class === 'LOW' ? 'badge-low' : a.risk_class === 'MEDIUM' ? 'badge-med' : a.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                          {a.risk_class}
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

      <SupplierDetailModal supplierId={selectedSupplierId} onClose={() => setSelectedSupplierId(null)} />
    </div>
  );
};
