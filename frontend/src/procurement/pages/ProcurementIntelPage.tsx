import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  ArrowRight,
  ShieldAlert,
  Calculator
} from 'lucide-react';
import type { ProcurementIntelData } from '../types';
import { fetchProcurementIntelligence } from '../services/api';

interface Props {
  selectedMaterial: string;
  selectedPlant: string;
  onNavigate: (page: string) => void;
}

export const ProcurementIntelPage: React.FC<Props> = ({
  selectedMaterial,
  selectedPlant,
  onNavigate
}) => {
  const [data, setData] = useState<ProcurementIntelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bufferDays, setBufferDays] = useState<number>(7);

  useEffect(() => {
    setLoading(true);
    fetchProcurementIntelligence({
      material_id: selectedMaterial,
      plant_id: selectedPlant,
      lead_time_buffer_days: bufferDays
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedMaterial, selectedPlant, bufferDays]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Evaluating lead times, net procurement requirements, and arrival deadlines...
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
            <span className="badge-low">STAGE 02: PROCUREMENT INTELLIGENCE</span>
            <span className="text-xs text-slate-400 font-mono">Net Calculation & Timing</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Procurement Intelligence & Order Timing Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculating net requirements and flagging lead-time delivery bottlenecks before stockouts occur.
          </p>
        </div>

        <button
          onClick={() => onNavigate('suppliers')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>Evaluate Suppliers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Formula & Rule Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase mb-1">
            <Calculator className="w-4 h-4" />
            Net Procurement Formula
          </div>
          <div className="font-mono text-amber-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            Net Req = Gross Demand - Current Inventory - Incoming Supply
          </div>
          <p className="text-[11px] text-slate-400 mt-1">If Net &le; 0, immediate procurement is bypassed.</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase mb-1">
            <Clock className="w-4 h-4" />
            Order Placement Timing Formula
          </div>
          <div className="font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            Recommended Order Date = Required Date - Supplier Lead Time
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Flags DELIVERY RISK if Expected Arrival &gt; Required Date.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Evaluated Materials</div>
          <div className="text-lg font-bold text-white mt-1">{sum.total_materials_evaluated}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Across plants</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Net Order Volume</div>
          <div className="text-lg font-bold text-indigo-300 mt-1">{sum.total_net_procurement_volume?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Units required</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Urgent PO Actions</div>
          <div className="text-lg font-bold text-rose-400 mt-1">{sum.urgent_action_required_count}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Lead time risk</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Capital Risk Exposure</div>
          <div className="text-lg font-bold text-amber-300 mt-1">${(sum.capital_risk_exposure_usd / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">At-risk inventory value</div>
        </div>
      </div>

      {/* Material Procurement Timing Schedule Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Procurement Timing & Delivery Risk Matrix
            </h3>
            <p className="text-[11px] text-slate-400">Calculated order placement deadlines and projected lead times</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Safety Buffer:</span>
            <select
              value={bufferDays}
              onChange={(e) => setBufferDays(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (Standard)</option>
              <option value={14}>14 Days (Conservative)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Plant</th>
                <th>Net Requirement</th>
                <th>Lead Time</th>
                <th>Recommended Order</th>
                <th>Expected Arrival</th>
                <th>Required Date</th>
                <th>Delivery Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.slice(0, 25).map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="font-semibold text-white text-xs">{item.material_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{item.material_id} • {item.criticality}</div>
                  </td>
                  <td className="font-mono text-xs text-slate-300">{item.plant_id}</td>
                  <td className="font-mono font-bold text-indigo-300 text-xs">
                    {item.net_requirement?.toLocaleString()} {item.unit_of_measure}
                  </td>
                  <td className="font-mono text-xs text-slate-300">{item.avg_lead_time_weeks} wks</td>
                  <td className="font-mono text-xs text-cyan-300">{item.recommended_order_date}</td>
                  <td className="font-mono text-xs text-slate-300">{item.expected_arrival_date}</td>
                  <td className="font-mono text-xs text-slate-400">{item.required_date}</td>
                  <td>
                    <span className={
                      item.delivery_risk_flag.includes('HIGH') ? 'badge-high' :
                      (item.delivery_risk_flag.includes('MEDIUM') ? 'badge-med' : 'badge-low')
                    }>
                      {item.delivery_risk_flag}
                    </span>
                  </td>
                  <td>
                    <span className="text-[11px] text-slate-300">
                      {item.procurement_status}
                    </span>
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
