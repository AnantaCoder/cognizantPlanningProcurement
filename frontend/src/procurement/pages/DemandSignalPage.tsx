import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  Layers, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Package, 
  Calculator,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import type { DemandSignalData } from '../types';
import { fetchDemandSignal } from '../services/api';

interface Props {
  selectedMaterial: string;
  selectedSKU: string;
  selectedPlant: string;
  selectedSeason: string;
  onNavigate: (page: string) => void;
}

export const DemandSignalPage: React.FC<Props> = ({
  selectedMaterial,
  selectedSKU,
  selectedPlant,
  selectedSeason,
  onNavigate
}) => {
  const [data, setData] = useState<DemandSignalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchDemandSignal({
      material_id: selectedMaterial,
      sku_id: selectedSKU,
      plant_id: selectedPlant,
      season: selectedSeason
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedMaterial, selectedSKU, selectedPlant, selectedSeason]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Processing BOM explosions and aggregating demand signals...
      </div>
    );
  }

  const sum = data.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">STAGE 01: DEMAND SIGNAL</span>
            <span className="text-xs text-slate-400 font-mono">BOM Explosion Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Procurement Demand Signal & Material Explosion
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Converting SKU master production schedules into raw material requirements across plants and seasons.
          </p>
        </div>

        <button
          onClick={() => onNavigate('procurement')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>Calculate Procurement Timing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Formula & Explanatory Card */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-cyan-300 uppercase">Material Demand Explosion Formula: </span>
            <span className="font-mono text-amber-300">
              Material Requirement = Forecast Production Quantity × Material Consumption per Unit
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Aggregated by Material ➔ Plant ➔ Production Week
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Active SKUs Demanded</div>
          <div className="text-lg font-bold text-white mt-1">{sum.total_skus_active}</div>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Across production lines</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Materials Required</div>
          <div className="text-lg font-bold text-cyan-300 mt-1">{sum.total_materials_required}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Raw feeds</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Gross Material Req</div>
          <div className="text-lg font-bold text-white mt-1">{sum.total_gross_material_requirement?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Total units</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Current Inventory</div>
          <div className="text-lg font-bold text-amber-300 mt-1">{sum.total_current_inventory?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">On-hand buffer</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Net Procurement Need</div>
          <div className="text-lg font-bold text-indigo-400 mt-1">{sum.total_net_procurement_requirement?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Immediate order volume</div>
        </div>
      </div>

      {/* Demand Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Material Requirement Trend */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Weekly Material Demand Trend (Gross vs Net)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly_trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="Week" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(w) => `W${w}`} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Gross_Material_Requirement" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} name="Gross Req" />
                <Area type="monotone" dataKey="Net_Procurement_Requirement" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} name="Net Req" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plant-wise Requirement */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Plant-Wise Material Procurement Requirement
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.plant_distribution} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="Plant_ID" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="Gross_Material_Requirement" fill="#0ea5e9" name="Gross Req" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net_Procurement_Requirement" fill="#6366f1" name="Net Req" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seasonal Breakdown & Material Detail Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seasonal Demand Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Seasonal Requirement Multipliers
          </h3>
          <div className="space-y-2.5">
            {data.seasonal_breakdown.map((s) => (
              <div key={s.Season} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                  <span>{s.Season}</span>
                  <span className="font-mono text-cyan-300">{s.Net_Procurement_Requirement?.toLocaleString()} units</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full" 
                    style={{ width: `${Math.min(100, (s.Net_Procurement_Requirement / (sum.total_net_procurement_requirement || 1)) * 300)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Material Breakdown Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Top Demanded Materials & Inventory Balance
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Material ID</th>
                  <th>Material Name</th>
                  <th>Criticality</th>
                  <th>Gross Req</th>
                  <th>Inventory</th>
                  <th>Net Req</th>
                </tr>
              </thead>
              <tbody>
                {data.material_breakdown.map((m) => (
                  <tr key={m.Material_ID}>
                    <td className="font-mono text-cyan-300 text-xs">{m.Material_ID}</td>
                    <td className="font-medium text-white">{m.Material_Name}</td>
                    <td>
                      <span className={
                        m.Criticality === 'Critical' ? 'badge-critical' :
                        (m.Criticality === 'High' ? 'badge-high' : 'badge-low')
                      }>
                        {m.Criticality}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{m.Gross_Material_Requirement?.toLocaleString()}</td>
                    <td className="font-mono text-xs text-amber-300">{m.Current_Inventory?.toLocaleString()}</td>
                    <td className="font-mono text-xs font-bold text-indigo-300">{m.Net_Procurement_Requirement?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
