import React, { useEffect, useState } from 'react';
import { X, Truck, Award, ShieldCheck, AlertTriangle, Package, Calendar, Activity, CheckCircle, Clock } from 'lucide-react';
import { fetchSupplierDetail } from '../services/api';

interface Props {
  supplierId: string | null;
  onClose: () => void;
}

export const SupplierDetailModal: React.FC<Props> = ({ supplierId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supplierId) return;
    setLoading(true);
    fetchSupplierDetail(supplierId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [supplierId]);

  if (!supplierId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {loading ? 'Loading Supplier...' : data?.supplier_profile?.Supplier_Name}
                </h2>
                <span className="font-mono text-xs bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                  {supplierId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {data?.supplier_profile?.Country} • {data?.supplier_profile?.Region} • {data?.supplier_profile?.Supplier_Tier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
              Loading supplier audit telemetry...
            </div>
          ) : data?.error ? (
            <div className="text-rose-400 text-sm">{data.error}</div>
          ) : (
            <>
              {/* Profile Card & Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Overall Rating
                  </div>
                  <div className="text-lg font-bold text-white">{data?.supplier_profile?.Overall_Rating} / 5.0</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Est. {data?.supplier_profile?.Established_Year}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Financial Stability
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{data?.supplier_profile?.Financial_Stability_Score} / 100</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ESG Score: {data?.supplier_profile?.ESG_Score}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-cyan-400" /> Approved Materials
                  </div>
                  <div className="text-lg font-bold text-cyan-300">{data?.approved_materials?.length || 0} Materials</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Contract active</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Disruption Events
                  </div>
                  <div className={`text-lg font-bold ${data?.disruptions?.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {data?.disruptions?.length || 0} Logged
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Past 24 months</div>
                </div>
              </div>

              {/* Certifications & Compliance */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400">Quality Certifications: </span>
                  <span className="font-mono text-cyan-300 font-semibold">{data?.supplier_profile?.Certifications}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Primary Contact: <span className="text-slate-300">{data?.supplier_profile?.Primary_Contact}</span>
                </div>
              </div>

              {/* Approved Materials Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" /> Approved Materials & Capacity
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Material ID</th>
                        <th>Material Name</th>
                        <th>Category</th>
                        <th>Max Weekly Capacity</th>
                        <th>Base Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.approved_materials?.map((m: any) => (
                        <tr key={m.Material_ID}>
                          <td className="font-mono text-cyan-300 text-xs">{m.Material_ID}</td>
                          <td className="font-medium text-white">{m.Material_Name}</td>
                          <td className="text-slate-400 text-xs">{m.Category}</td>
                          <td className="font-mono text-xs">{m.Max_Weekly_Capacity?.toLocaleString()} units</td>
                          <td className="font-mono text-emerald-400 text-xs font-semibold">${m.Base_Unit_Price?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disruptions History */}
              {data?.disruptions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Historical Disruption Logs
                  </h3>
                  <div className="space-y-2">
                    {data.disruptions.map((d: any) => (
                      <div key={d.Disruption_ID} className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs">
                        <div className="flex items-center justify-between font-semibold text-rose-300 mb-1">
                          <span>{d.Disruption_Type} ({d.Disruption_ID})</span>
                          <span>Start: {d.Start_Date} • Duration: {d.Duration_Weeks} wks</span>
                        </div>
                        <p className="text-slate-300">{d.Root_Cause}</p>
                        <div className="mt-1 text-[11px] text-rose-400">
                          Capacity Impact: -{d.Capacity_Impact_Pct}% • Status: {d.Resolution_Status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Deliveries */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Historical Deliveries Sample (Last 25)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Delivery ID</th>
                        <th>PO ID</th>
                        <th>Promised Date</th>
                        <th>Actual Date</th>
                        <th>Actual LT</th>
                        <th>Delay Days</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recent_deliveries?.map((del: any) => (
                        <tr key={del.Delivery_ID}>
                          <td className="font-mono text-slate-400 text-xs">{del.Delivery_ID}</td>
                          <td className="font-mono text-xs">{del.PO_ID}</td>
                          <td className="text-xs text-slate-300">{del.Promised_Date}</td>
                          <td className="text-xs text-slate-300">{del.Actual_Delivery_Date}</td>
                          <td className="font-mono text-xs">{del.Actual_Lead_Time_Weeks} wks</td>
                          <td className={`font-mono text-xs font-semibold ${del.Delay_Days > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {del.Delay_Days} days
                          </td>
                          <td>
                            <span className={del.On_Time_Flag ? 'badge-low' : 'badge-high'}>
                              {del.On_Time_Flag ? 'ON TIME' : 'DELAYED'}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Supplier Profile
          </button>
        </div>
      </div>
    </div>
  );
};
