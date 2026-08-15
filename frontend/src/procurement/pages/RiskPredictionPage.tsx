import React, { useEffect, useState, useCallback } from 'react';
import { BrainCircuit, AlertTriangle, ShieldCheck, ShieldAlert, Zap, Info, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import type { AIRiskData } from '../types';
import { fetchRiskPrediction } from '../services/api';
import { SupplierDetailModal } from '../components/SupplierDetailModal';

interface Props {
  selectedMaterial: string;
  onNavigate: (page: string) => void;
}

const RISK_COLORS: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', CRITICAL: '#a855f7' };

export const RiskPredictionPage: React.FC<Props> = ({ selectedMaterial, onNavigate }) => {
  const [data, setData] = useState<AIRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState({ low: 25, med: 50, high: 75 });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchRiskPrediction({
      material_id: selectedMaterial,
      low_threshold: thresholds.low,
      med_threshold: thresholds.med,
      high_threshold: thresholds.high,
    }).then(res => { setData(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedMaterial, thresholds]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
      Training Gradient Boosting classifier and generating risk predictions...
    </div>
  );

  const sum = data.summary;
  const preds = data.supplier_risk_predictions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-high">STAGE 04: AI RISK PREDICTION</span>
            <span className="text-xs text-slate-400 font-mono">Gradient Boosting + Random Forest</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Supplier Risk Prediction Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">ML model trained on historical delivery delays, quality failures, capacity utilization, and disruption events.</p>
        </div>
        <button onClick={() => onNavigate('allocation')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 self-start">
          <span>Run Optimization</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Risk Class Threshold Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configurable Risk Classification Thresholds</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { key: 'low', label: 'LOW → MEDIUM Threshold', color: 'text-emerald-400 accent-emerald-500' },
            { key: 'med', label: 'MEDIUM → HIGH Threshold', color: 'text-amber-400 accent-amber-500' },
            { key: 'high', label: 'HIGH → CRITICAL Threshold', color: 'text-rose-400 accent-rose-500' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={10} max={90} step={5}
                  value={thresholds[key as keyof typeof thresholds]}
                  onChange={e => setThresholds(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                  className={`flex-1 ${color}`}
                />
                <span className={`font-mono text-sm font-bold ${color.split(' ')[0]} w-10 text-right`}>
                  {thresholds[key as keyof typeof thresholds]}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Suppliers Analyzed</div>
          <div className="text-xl font-bold text-white mt-1">{sum.total_suppliers_analyzed}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Avg Risk Probability</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{sum.average_risk_probability}%</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">High/Critical Risk Vendors</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{sum.high_risk_supplier_count}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Class Distribution</div>
          <div className="text-xs font-mono mt-2 space-y-0.5">
            {Object.entries(sum.class_distribution).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className={`font-semibold ${k === 'LOW' ? 'text-emerald-400' : k === 'MEDIUM' ? 'text-amber-400' : k === 'HIGH' ? 'text-rose-400' : 'text-purple-400'}`}>{k}:</span>
                <span className="text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Supplier Risk Probability Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={preds.slice(0, 12)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="supplier_id" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v: any) => [`${v.toFixed(1)}%`, 'Risk Probability']} />
                <Bar dataKey="risk_probability" radius={[4, 4, 0, 0]} name="Risk Probability">
                  {preds.slice(0, 12).map((p, i) => (
                    <Cell key={i} fill={RISK_COLORS[p.risk_class] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">AI Feature Importance (Model Explainability)</h3>
          <div className="space-y-2.5">
            {Object.entries(data.feature_importances).sort(([, a], [, b]) => b - a).map(([feat, imp]) => (
              <div key={feat} className="flex items-center gap-3">
                <span className="text-[11px] text-slate-300 w-40 truncate font-mono">{feat.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${imp}%` }} />
                </div>
                <span className="font-mono text-xs text-cyan-300 w-10 text-right">{imp.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier Risk Cards with AI WHY Explanations */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          AI Risk Predictions — Click High-Risk Cards for Root Cause Explanation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {preds.map(sup => (
            <div
              key={sup.supplier_id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                sup.risk_class === 'LOW' ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400' :
                sup.risk_class === 'MEDIUM' ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400' :
                sup.risk_class === 'HIGH' ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400' :
                'bg-purple-950/20 border-purple-500/40 hover:border-purple-400'
              }`}
              onClick={() => setExpandedId(expandedId === sup.supplier_id ? null : sup.supplier_id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-xs text-white">{sup.supplier_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{sup.supplier_id} • {sup.country}</div>
                </div>
                <span className={sup.risk_class === 'LOW' ? 'badge-low' : sup.risk_class === 'MEDIUM' ? 'badge-med' : sup.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                  {sup.risk_class}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <div className="text-slate-400">Risk Probability</div>
                  <div className="font-bold text-lg" style={{ color: RISK_COLORS[sup.risk_class] }}>{sup.risk_probability}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Predicted Delay</div>
                  <div className="font-bold text-lg text-white">{sup.predicted_delay_weeks} wks</div>
                </div>
                <div>
                  <div className="text-slate-400">On-Time Rate</div>
                  <div className={`font-semibold ${sup.on_time_rate >= 90 ? 'text-emerald-400' : sup.on_time_rate >= 78 ? 'text-amber-400' : 'text-rose-400'}`}>{sup.on_time_rate}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Disruptions</div>
                  <div className={`font-semibold ${sup.disruptions_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{sup.disruptions_count} events</div>
                </div>
              </div>

              {/* Expandable WHY block */}
              {expandedId === sup.supplier_id && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] font-bold text-cyan-300 uppercase mb-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" /> AI Explanation — Root Cause Factors
                  </div>
                  <ul className="space-y-1">
                    {sup.reasons_list.map((r, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">▸</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedSupplierId(sup.supplier_id); }}
                    className="mt-2 text-[11px] text-cyan-400 hover:underline"
                  >
                    View Full Supplier Profile →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SupplierDetailModal supplierId={selectedSupplierId} onClose={() => setSelectedSupplierId(null)} />
    </div>
  );
};
