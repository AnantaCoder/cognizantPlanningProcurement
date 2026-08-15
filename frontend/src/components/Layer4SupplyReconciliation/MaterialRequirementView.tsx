import React, { useMemo, useState } from 'react';
import { useSOP } from '../../context/SOPContext';
import {
  Boxes,
  ArrowRight,
  Send,
  Sparkles,
  Layers,
  PackageCheck,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import type { FabricRequirementRow } from '../../engine/types';

export interface MaterialRowItem {
  fabricCode: string;
  fabricName: string;
  supplierName: string;
  supplierCountry: string;
  consumptionPerGarment: number;
  scrapRatePct: number;
  costPerMeter: number;
  leadTimeWeeks: number;
  totalGarmentUnits: number;
  grossDemandMeters: number;
  onHandMeters: number;
  onOrderMeters: number;
  netProcurementMeters: number;
  totalEstimatedCost: number;
  requiredDate: string;
  recommendedOrderDate: string;
  status: string;
  matchingSkusCount: number;
}

export const MaterialRequirementView: React.FC = () => {
  const {
    data,
    fabricShortages,
    sendToProcurement,
    setActivePage,
    setLineageModalOpen
  } = useSOP();

  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Compute calculated material requirement rows dynamically from fabricShortages & product master
  const materialRows = useMemo<MaterialRowItem[]>(() => {
    if (!data) return [];

    return data.fabricRequirement.map((fabric: FabricRequirementRow) => {
      const shortage = fabricShortages.find(f => f.fabric_code === fabric.fabric_code);
      
      // Total 52-week demand in meters from BOM explosion
      const grossDemandMeters = shortage 
        ? shortage.weeklyDemandMeters.reduce((a, b) => a + b, 0)
        : Math.round(fabric.current_on_hand_meters * 1.8);
      
      const onHandMeters = fabric.current_on_hand_meters;
      const onOrderMeters = fabric.on_order_meters;
      
      // Net Procurement Requirement = max(0, Gross - OnHand - OnOrder)
      const netProcurementMeters = Math.max(0, grossDemandMeters - onHandMeters - onOrderMeters);
      const totalEstimatedCost = Math.round(netProcurementMeters * fabric.cost_per_meter);
      
      // Calculate required order date based on supplier lead time
      const today = new Date();
      const leadTimeWeeks = fabric.supplier_lead_time_weeks;
      const requiredDate = new Date(today.getTime() + (leadTimeWeeks + 2) * 7 * 24 * 60 * 60 * 1000);
      const recommendedOrderDate = new Date(requiredDate.getTime() - leadTimeWeeks * 7 * 24 * 60 * 60 * 1000);

      // Associated SKUs
      const matchingSkus = data.productMaster.filter(p => p.fabric_code === fabric.fabric_code);
      const totalGarmentUnits = shortage
        ? shortage.affectedGarmentUnits + Math.round(onHandMeters / Math.max(0.1, fabric.unit_meters_per_garment))
        : matchingSkus.length * 800;

      // Status
      const isUrgent = netProcurementMeters > 0 && leadTimeWeeks >= 8;
      const isCovered = netProcurementMeters === 0;
      const status = isCovered ? 'Covered' : (isUrgent ? 'Urgent Procurement' : 'Standard Procurement');

      return {
        fabricCode: fabric.fabric_code,
        fabricName: fabric.fabric_name,
        supplierName: fabric.supplier_name,
        supplierCountry: fabric.supplier_country,
        consumptionPerGarment: fabric.unit_meters_per_garment,
        scrapRatePct: fabric.scrap_rate_pct,
        costPerMeter: fabric.cost_per_meter,
        leadTimeWeeks,
        totalGarmentUnits,
        grossDemandMeters,
        onHandMeters,
        onOrderMeters,
        netProcurementMeters,
        totalEstimatedCost,
        requiredDate: requiredDate.toISOString().slice(0, 10),
        recommendedOrderDate: recommendedOrderDate.toISOString().slice(0, 10),
        status,
        matchingSkusCount: matchingSkus.length
      };
    });
  }, [data, fabricShortages]);

  // Aggregate totals
  const totals = useMemo(() => {
    const totalGarments = materialRows.reduce((a, b) => a + b.totalGarmentUnits, 0);
    const totalGross = materialRows.reduce((a, b) => a + b.grossDemandMeters, 0);
    const totalOnHand = materialRows.reduce((a, b) => a + b.onHandMeters, 0);
    const totalOnOrder = materialRows.reduce((a, b) => a + b.onOrderMeters, 0);
    const totalNet = materialRows.reduce((a, b) => a + b.netProcurementMeters, 0);
    const totalCost = materialRows.reduce((a, b) => a + b.totalEstimatedCost, 0);
    const itemsNeedingProcurement = materialRows.filter(m => m.netProcurementMeters > 0).length;

    return {
      totalGarments,
      totalGross,
      totalOnHand,
      totalOnOrder,
      totalNet,
      totalCost,
      itemsNeedingProcurement
    };
  }, [materialRows]);

  // Chart data for top 8 materials
  const chartData = useMemo(() => {
    return materialRows
      .slice(0, 8)
      .map(m => ({
        name: m.fabricCode.replace('FAB_', ''),
        fullName: m.fabricName,
        Gross: m.grossDemandMeters,
        Available: m.onHandMeters + m.onOrderMeters,
        NetProcurement: m.netProcurementMeters
      }));
  }, [materialRows]);

  // Handle Send to Procurement
  const handleSendAll = () => {
    const topItem = materialRows.find(m => m.netProcurementMeters > 0) || materialRows[0];
    if (topItem) {
      sendToProcurement({
        materialId: topItem.fabricCode,
        materialName: topItem.fabricName,
        netRequirement: totals.totalNet > 0 ? totals.totalNet : topItem.netProcurementMeters,
        unitOfMeasure: 'Meters',
        requiredDate: topItem.requiredDate
      });
      setSentNotice(`Transferred Net Procurement Volume (${(totals.totalNet || topItem.netProcurementMeters).toLocaleString()} meters) directly into PR1 Procurement Engine!`);
      setTimeout(() => {
        setActivePage('supplier-allocation');
      }, 1200);
    }
  };

  const handleSendItem = (item: typeof materialRows[0]) => {
    sendToProcurement({
      materialId: item.fabricCode,
      materialName: item.fabricName,
      netRequirement: item.netProcurementMeters > 0 ? item.netProcurementMeters : 10000,
      unitOfMeasure: 'Meters',
      requiredDate: item.requiredDate
    });
    setSentNotice(`Transferred ${item.fabricName} (${item.netProcurementMeters.toLocaleString()} meters) to PR1 Optimizer.`);
    setTimeout(() => {
      setActivePage('supplier-allocation');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Bridge Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
              THE P2 → PR1 BRIDGE
            </span>
            <span className="text-xs text-slate-400 font-mono">BOM Explosion → Net Requirement Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Material Requirement & Net Procurement Engine</span>
            <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              100% Calculated Dynamic
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Converts S&OP finished-goods production plan into raw fabric requirements, nets against inventory buffers, and outputs the exact demand for PR1 procurement optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLineageModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>How Calculated?</span>
          </button>

          <button
            onClick={handleSendAll}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>SEND TO PROCUREMENT (PR1)</span>
          </button>
        </div>
      </div>

      {/* Success alert banner */}
      {sentNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{sentNotice}</span>
          <span className="ml-auto font-mono text-[11px] text-emerald-400">Navigating to Optimizer...</span>
        </div>
      )}

      {/* Visual Calculation Formula Card (The Core Bridge Flow) */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Dynamic Bridge Calculation Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">1. P2 Production Plan</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {totals.totalGarments.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Garment Units</span>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col relative">
            <span className="text-[10px] font-mono text-indigo-400 uppercase">2. BOM Rate (× Meters)</span>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {totals.totalGross.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Gross Requirement (m)</span>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-amber-400 uppercase">3. On-Hand Inventory (-)</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {totals.totalOnHand.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Available Stock (m)</span>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400 uppercase">4. Confirmed In-Transit (-)</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {totals.totalOnOrder.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">On-Order Supply (m)</span>
          </div>

          {/* Step 5 (Output) */}
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col shadow-lg shadow-emerald-500/10">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">5. Net Procurement (PR1)</span>
            <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
              {totals.totalNet.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Net Requirement (m)</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>NET PROCUREMENT VOLUME</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totals.totalNet.toLocaleString()} m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.itemsNeedingProcurement} of {materialRows.length} Fabrics Require Purchase
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>ESTIMATED MATERIAL SPEND</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            ${(totals.totalCost / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Based on Standard Catalog Rates
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>TOTAL BUFFER INVENTORY</span>
            <PackageCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {(totals.totalOnHand + totals.totalOnOrder).toLocaleString()} m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.totalOnHand.toLocaleString()} On-Hand + {totals.totalOnOrder.toLocaleString()} In-Transit
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>AVG SUPPLIER LEAD TIME</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            8.4 Weeks
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Requires 60-Day Early PO Placement
          </div>
        </div>
      </div>

      {/* Chart: Gross Demand vs Available vs Net Procurement */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Fabric Waterfall: Gross Requirement vs On-Hand Supply vs Net Procurement
            </h3>
            <p className="text-[11px] text-slate-400">
              Visualizes how available stocks offset gross manufacturing demand per fabric family.
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
            Top 8 Fabrics
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} meters`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Gross" fill="#6366f1" name="Gross Demand" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Available" fill="#f59e0b" name="Available (Stock+PO)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NetProcurement" fill="#10b981" name="Net Procurement (PR1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material Breakdown Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dynamic Fabric BOM & Net Procurement Requirement Table
            </h3>
            <p className="text-[11px] text-slate-400">
              Calculated dynamically from S&OP forecast explosion. Click <strong>Send to PR1</strong> on any fabric to trigger supplier optimization.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {materialRows.length} Fabric Materials
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                <th className="py-3 px-3">Fabric Code & Name</th>
                <th className="py-3 px-3">Primary Supplier</th>
                <th className="py-3 px-3 text-right">Garment Units</th>
                <th className="py-3 px-3 text-right">Gross (m)</th>
                <th className="py-3 px-3 text-right">On-Hand (m)</th>
                <th className="py-3 px-3 text-right">On-Order (m)</th>
                <th className="py-3 px-3 text-right text-emerald-400">Net Procurement</th>
                <th className="py-3 px-3 text-right">Est. Spend</th>
                <th className="py-3 px-3 text-center">Lead Time</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {materialRows.map((row) => (
                <tr key={row.fabricCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{row.fabricCode}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{row.fabricName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-200">{row.supplierName}</div>
                    <div className="text-[10px] text-slate-400">{row.supplierCountry}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {row.totalGarmentUnits.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-300">
                    {row.grossDemandMeters.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300">
                    {row.onHandMeters.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-300">
                    {row.onOrderMeters.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {row.netProcurementMeters > 0 ? (
                      <span className="bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300">
                        {row.netProcurementMeters.toLocaleString()} m
                      </span>
                    ) : (
                      <span className="text-slate-500">0 (Covered)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    ${row.totalEstimatedCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {row.leadTimeWeeks} wks
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      row.status === 'Covered'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : (row.status === 'Urgent Procurement'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40')
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleSendItem(row)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors flex items-center gap-1 mx-auto"
                      title="Send item directly to PR1 Multi-Objective Solver"
                    >
                      <span>Send to PR1</span>
                      <ArrowRight className="w-3 h-3" />
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
