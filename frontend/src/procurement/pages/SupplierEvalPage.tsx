import React, { useEffect, useState, useCallback } from 'react';
import { Award, SlidersHorizontal, ArrowUpRight, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { SupplierEvalData } from '../types';
import { fetchSupplierEvaluation } from '../services/api';
import { SupplierDetailModal } from '../components/SupplierDetailModal';

interface Props {
  selectedMaterial: string;
  onNavigate: (page: string) => void;
}

export const SupplierEvalPage: React.FC<Props> = ({ selectedMaterial, onNavigate }) => {
  const [data, setData] = useState<SupplierEvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState({ cost: 0.30, quality: 0.20, delivery: 0.25, reliability: 0.15, capacity: 0.10 });
  const [sortField, setSortField] = useState<string>('overall_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchSupplierEvaluation({
      material_id: selectedMaterial,
      cost_weight: weights.cost,
      quality_weight: weights.quality,
      delivery_weight: weights.delivery,
      reliability_weight: weights.reliability,
      capacity_weight: weights.capacity,
    }).then(res => { setData(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedMaterial, weights]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = data ? [...data.suppliers].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  }) : [];

  const totalW = weights.cost + weights.quality + weights.delivery + weights.reliability + weights.capacity;

  if (loading || !data) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
      Computing dynamic multi-criteria supplier rankings...
    </div>
  );

  const radarData = sorted.slice(0, 5).map(s => ({
    supplier: s.Supplier_Name?.split(' ')[0],
    Cost: s.cost_score ?? 0,
    Quality: s.quality_score ?? 0,
    Delivery: s.delivery_score ?? 0,
    Reliability: s.reliability_score ?? 0,
    Capacity: s.capacity_score ?? 0,
  }));

  const SortIcon = ({ field }: { field: string }) => (
    sortField === field
      ? sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5 text-cyan-400" /> : <ChevronUp className="w-3 h-3 inline ml-0.5 text-cyan-400" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5 text-slate-600" />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">STAGE 03: SUPPLIER EVALUATION</span>
            <span className="text-xs text-slate-400 font-mono">Dynamic Multi-Criteria Scoring</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Supplier Evaluation & Scorecard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Adjust scoring weights below — all supplier rankings recalculate in real-time from historical performance data.</p>
        </div>
        <button onClick={() => onNavigate('risk')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 self-start">
          <span>Run AI Risk Prediction</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weight Sliders */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Procurement Scoring Weight Adjusters (Live Recalculation)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'cost', label: 'Cost Weight', color: 'text-emerald-400' },
            { key: 'quality', label: 'Quality Weight', color: 'text-cyan-400' },
            { key: 'delivery', label: 'Delivery Weight', color: 'text-indigo-400' },
            { key: 'reliability', label: 'Reliability Weight', color: 'text-amber-400' },
            { key: 'capacity', label: 'Capacity Weight', color: 'text-rose-400' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.05}
                  max={0.60}
                  step={0.05}
                  value={weights[key as keyof typeof weights]}
                  onChange={e => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  className="flex-1 accent-cyan-500"
                />
                <span className={`font-mono text-xs font-bold ${color} w-10 text-right`}>
                  {Math.round((weights[key as keyof typeof weights] / totalW) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Rankings
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Top 5 Supplier Scorecard Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted.slice(0, 8)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="Supplier_Name" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="overall_score" fill="#0ea5e9" name="Overall Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quality_score" fill="#10b981" name="Quality" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delivery_score" fill="#6366f1" name="Delivery" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Multi-Dimension Spider Chart (Top 5 Suppliers)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { subject: 'Cost', A: radarData[0]?.Cost ?? 0, B: radarData[1]?.Cost ?? 0, C: radarData[2]?.Cost ?? 0 },
                { subject: 'Quality', A: radarData[0]?.Quality ?? 0, B: radarData[1]?.Quality ?? 0, C: radarData[2]?.Quality ?? 0 },
                { subject: 'Delivery', A: radarData[0]?.Delivery ?? 0, B: radarData[1]?.Delivery ?? 0, C: radarData[2]?.Delivery ?? 0 },
                { subject: 'Reliability', A: radarData[0]?.Reliability ?? 0, B: radarData[1]?.Reliability ?? 0, C: radarData[2]?.Reliability ?? 0 },
                { subject: 'Capacity', A: radarData[0]?.Capacity ?? 0, B: radarData[1]?.Capacity ?? 0, C: radarData[2]?.Capacity ?? 0 },
              ]}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name={radarData[0]?.supplier} dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Radar name={radarData[1]?.supplier} dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Radar name={radarData[2]?.supplier} dataKey="C" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sortable Supplier Scorecard Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Complete Supplier Scorecard — Click Row to View Profile</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('overall_score')}>Overall Score <SortIcon field="overall_score" /></th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('avg_unit_price')}>Avg Price <SortIcon field="avg_unit_price" /></th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('total_capacity')}>Capacity <SortIcon field="total_capacity" /></th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('on_time_rate')}>On-Time % <SortIcon field="on_time_rate" /></th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('quality_score')}>Quality % <SortIcon field="quality_score" /></th>
                <th className="cursor-pointer hover:text-cyan-300" onClick={() => handleSort('reliability_score')}>Reliability <SortIcon field="reliability_score" /></th>
                <th>Risk Class</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((sup) => (
                <tr key={sup.Supplier_ID} className="cursor-pointer" onClick={() => setSelectedSupplierId(sup.Supplier_ID)}>
                  <td>
                    <div className="font-semibold text-cyan-300 text-xs hover:underline">{sup.Supplier_Name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sup.Supplier_ID} • {sup.Country} • {sup.Supplier_Tier}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${sup.overall_score}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-white">{sup.overall_score?.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-emerald-400">${sup.avg_unit_price?.toFixed(2)}</td>
                  <td className="font-mono text-xs">{sup.total_capacity?.toLocaleString()}</td>
                  <td className={`font-mono text-xs font-semibold ${(sup.on_time_rate ?? 0) >= 90 ? 'text-emerald-400' : (sup.on_time_rate ?? 0) >= 78 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {sup.on_time_rate?.toFixed(1)}%
                  </td>
                  <td className="font-mono text-xs text-cyan-300">{sup.quality_score?.toFixed(1)}%</td>
                  <td className="font-mono text-xs">{sup.reliability_score?.toFixed(1)}</td>
                  <td>
                    <span className={sup.risk_class === 'LOW' ? 'badge-low' : sup.risk_class === 'MEDIUM' ? 'badge-med' : sup.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                      {sup.risk_class}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierDetailModal supplierId={selectedSupplierId} onClose={() => setSelectedSupplierId(null)} />
    </div>
  );
};
