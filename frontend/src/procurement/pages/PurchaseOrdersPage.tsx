import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Download, AlertTriangle, CheckCircle2, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { generatePurchaseOrders, exportPurchaseOrdersCSV } from '../services/api';

interface Props {
  allocations: any[];
  selectedPlant: string;
}

export const PurchaseOrdersPage: React.FC<Props> = ({ allocations, selectedPlant }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const load = useCallback(() => {
    if (!allocations || allocations.length === 0) return;
    setLoading(true);
    generatePurchaseOrders({
      allocations,
      plant_id: selectedPlant !== 'ALL' ? selectedPlant : undefined,
    }).then(res => { setData(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [allocations, selectedPlant]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    if (!allocations || allocations.length === 0) return;
    exportPurchaseOrdersCSV({ allocations, plant_id: selectedPlant !== 'ALL' ? selectedPlant : undefined });
  };

  const filteredPOs = data?.purchase_orders?.filter((po: any) =>
    filterRisk === 'ALL' || po.risk_class === filterRisk
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">STAGE 06B: PURCHASE ORDERS</span>
            <span className="text-xs text-slate-400 font-mono">Risk-Flagged PO Generation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recommended Purchase Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Auto-generated from LP optimal allocation results with risk flags, lead times, and contract references.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={!allocations.length || loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate POs
          </button>
          <button onClick={handleExport} disabled={!data}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {!allocations.length && (
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p>Run <strong className="text-cyan-300">Supplier Allocation Optimizer</strong> or <strong className="text-rose-300">Scenario Simulation</strong> first to generate purchase orders.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
          Generating risk-flagged purchase orders from allocation results...
        </div>
      )}

      {data && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Total POs Generated</div>
              <div className="text-xl font-bold text-white mt-1">{data.summary.total_purchase_orders}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Order Volume</div>
              <div className="text-xl font-bold text-cyan-300 mt-1">{data.summary.total_order_quantity?.toLocaleString()}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Procurement Spend</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">${(data.summary.total_procurement_spend_usd / 1000).toFixed(1)}k</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Risk Breakdown</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(data.summary.risk_breakdown).map(([k, v]) => (
                  <span key={k} className={k === 'LOW' ? 'badge-low' : k === 'MEDIUM' ? 'badge-med' : k === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Filter by Risk:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${filterRisk === r ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
                {r}
              </button>
            ))}
          </div>

          {/* PO Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Purchase Order Recommendations ({filteredPOs.length} POs)</h3>
              <span className="text-[10px] font-mono text-slate-400">Plant: {data.summary.plant_destination}</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[60vh]">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>Supplier</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Cost</th>
                    <th>Order Date</th>
                    <th>Expected Delivery</th>
                    <th>Lead Time</th>
                    <th>Risk Class</th>
                    <th>Delivery Flag</th>
                    <th>Contract Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po: any) => (
                    <tr key={po.po_id}>
                      <td className="font-mono text-xs text-cyan-300">{po.po_id}</td>
                      <td>
                        <div className="font-semibold text-xs text-white">{po.supplier_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{po.supplier_id}</div>
                      </td>
                      <td>
                        <div className="text-xs text-white">{po.material_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{po.material_id}</div>
                      </td>
                      <td className="font-mono font-bold text-white text-xs">{po.quantity?.toLocaleString()}</td>
                      <td className="font-mono text-xs">${po.unit_price?.toFixed(2)}</td>
                      <td className="font-mono text-xs font-semibold text-emerald-400">${po.total_cost?.toLocaleString()}</td>
                      <td className="font-mono text-xs text-slate-300">{po.order_date}</td>
                      <td className="font-mono text-xs text-slate-300">{po.expected_delivery_date}</td>
                      <td className="font-mono text-xs text-slate-300">{po.lead_time_weeks} wks</td>
                      <td>
                        <span className={po.risk_class === 'LOW' ? 'badge-low' : po.risk_class === 'MEDIUM' ? 'badge-med' : po.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                          {po.risk_class}
                        </span>
                      </td>
                      <td>
                        <span className={po.delivery_risk_flag.includes('FLAGGED') ? 'badge-high' : 'badge-low'}>
                          {po.delivery_risk_flag.includes('FLAGGED') ? '⚠ LATE RISK' : '✓ HEALTHY'}
                        </span>
                      </td>
                      <td className="font-mono text-[10px] text-slate-400">{po.contract_reference}</td>
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
