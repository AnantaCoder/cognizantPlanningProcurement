import React, { useState, useCallback } from 'react';
import { FileSpreadsheet, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Users, DollarSign, Clock, ShieldAlert, BarChart3, Target } from 'lucide-react';
import { fetchExecutiveReport } from '../services/api';

interface Props {
  selectedMaterial: string;
  selectedPlant: string;
  selectedSeason: string;
}

export const ExecutiveReportPage: React.FC<Props> = ({ selectedMaterial, selectedPlant, selectedSeason }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [demandMult, setDemandMult] = useState(1.0);
  const [riskWeight, setRiskWeight] = useState(0.40);

  const generate = useCallback(() => {
    setLoading(true);
    fetchExecutiveReport({
      material_id: selectedMaterial !== 'ALL' ? selectedMaterial : undefined,
      plant_id: selectedPlant !== 'ALL' ? selectedPlant : undefined,
      season: selectedSeason !== 'ALL' ? selectedSeason : undefined,
      demand_multiplier: demandMult,
      risk_weight: riskWeight,
    }).then(res => { setReport(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedMaterial, selectedPlant, selectedSeason, demandMult, riskWeight]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">EXECUTIVE GOVERNANCE</span>
            <span className="text-xs text-slate-400 font-mono">Board-Ready Procurement Strategy</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Procurement Strategy Report</h1>
          <p className="text-xs text-slate-400 mt-0.5">AI-generated recommended procurement plan with course of action, root causes, and business impact narrative.</p>
        </div>
      </div>

      {/* Report Parameters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Report Generation Parameters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Demand Scenario</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.7} max={2.0} step={0.05} value={demandMult}
                onChange={e => setDemandMult(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-500" />
              <span className="font-mono text-xs font-bold text-cyan-300 w-14 text-right">{(demandMult * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Risk Sensitivity (λ)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.1} max={0.9} step={0.05} value={riskWeight}
                onChange={e => setRiskWeight(parseFloat(e.target.value))}
                className="flex-1 accent-rose-500" />
              <span className="font-mono text-xs font-bold text-rose-300 w-10 text-right">{(riskWeight * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex items-end">
            <div className="text-xs text-slate-400">
              <div className="font-semibold text-slate-300">Material: <span className="text-cyan-300">{selectedMaterial === 'ALL' ? 'All Materials' : selectedMaterial}</span></div>
              <div className="font-semibold text-slate-300">Plant: <span className="text-cyan-300">{selectedPlant === 'ALL' ? 'All Plants' : selectedPlant}</span></div>
              <div className="font-semibold text-slate-300">Season: <span className="text-cyan-300">{selectedSeason === 'ALL' ? 'All Seasons' : selectedSeason}</span></div>
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={generate} disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50">
              {loading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating...</span></>
                : <><Sparkles className="w-3.5 h-3.5" /><span>GENERATE EXECUTIVE REPORT</span></>}
            </button>
          </div>
        </div>
      </div>

      {!report && !loading && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p>Configure parameters above and click <strong className="text-cyan-300">GENERATE EXECUTIVE REPORT</strong> to produce a board-ready procurement strategy.</p>
        </div>
      )}

      {report && (
        <>
          {/* Report Header */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-indigo-950/30">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-white">PROCUREMENT STRATEGY BRIEF</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>Material: <strong className="text-cyan-300">{report.metadata.material_name}</strong></span>
                  <span>•</span>
                  <span>Plant: <strong className="text-cyan-300">{report.metadata.plant_id}</strong></span>
                  <span>•</span>
                  <span>Season: <strong className="text-cyan-300">{report.metadata.season}</strong></span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${report.executive_briefing.governance.priority.includes('HIGH') ? 'badge-high' : 'badge-med'}`}>
                {report.executive_briefing.governance.priority}
              </span>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Total Requirement', val: report.kpis.total_requirement_units?.toLocaleString(), icon: BarChart3, color: 'text-white' },
                { label: 'Procurement Cost', val: `$${(report.kpis.total_procurement_cost_usd / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-400' },
                { label: 'Avg Supplier Risk', val: `${report.kpis.average_supplier_risk_pct}%`, icon: ShieldAlert, color: 'text-amber-400' },
                { label: 'Expected Delay', val: `${report.kpis.expected_delay_weeks} wks`, icon: Clock, color: 'text-rose-400' },
                { label: 'Max Concentration', val: `${report.kpis.supplier_dependency_pct}%`, icon: AlertTriangle, color: 'text-purple-300' },
                { label: 'Suppliers Used', val: report.kpis.suppliers_allocated_count, icon: Users, color: 'text-cyan-300' },
              ].map(k => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                    <div className="text-[10px] text-slate-400 mb-0.5">{k.label}</div>
                    <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Briefing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: '⚠ PROBLEM STATEMENT', content: report.executive_briefing.problem, color: 'border-rose-500/30 bg-rose-950/20 text-rose-200' },
              { label: '🔍 ROOT CAUSE ANALYSIS', content: report.executive_briefing.root_cause, color: 'border-amber-500/30 bg-amber-950/20 text-amber-200' },
              { label: '📉 BUSINESS IMPACT', content: report.executive_briefing.business_impact, color: 'border-purple-500/30 bg-purple-950/20 text-purple-200' },
              { label: '✅ RECOMMENDED ACTION', content: report.executive_briefing.recommended_action, color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200' },
            ].map(card => (
              <div key={card.label} className={`p-5 rounded-2xl border ${card.color}`}>
                <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{card.label}</div>
                <p className="text-sm leading-relaxed">{card.content}</p>
              </div>
            ))}
          </div>

          {/* WHY THIS DECISION — The Core Business Story */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 bg-cyan-950/20">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">💡 RECOMMENDED PROCUREMENT STRATEGY — WHY THIS DECISION?</div>
            <p className="text-sm text-slate-200 leading-relaxed mb-4">{report.executive_briefing.why_this_decision}</p>
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">EXPECTED IMPACT</div>
              <p className="text-xs text-emerald-200 leading-relaxed">{report.executive_briefing.expected_impact}</p>
            </div>
          </div>

          {/* Governance Footer */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 mb-0.5">Owner</div>
              <div className="font-semibold text-white">{report.executive_briefing.governance.owner}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">Priority</div>
              <span className={report.executive_briefing.governance.priority.includes('HIGH') ? 'badge-high' : 'badge-med'}>
                {report.executive_briefing.governance.priority}
              </span>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">Approval Status</div>
              <div className="font-semibold text-amber-300">{report.executive_briefing.governance.approval_status}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">Review Cycle</div>
              <div className="font-semibold text-slate-200">{report.executive_briefing.governance.review_cycle}</div>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Optimal Allocation Detail (From LP Solver)</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Allocated Qty</th>
                    <th>Volume %</th>
                    <th>Unit Price</th>
                    <th>Total Spend</th>
                    <th>Risk Class</th>
                    <th>Risk Prob.</th>
                  </tr>
                </thead>
                <tbody>
                  {report.allocations_table.map((a: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <div className="font-semibold text-xs text-cyan-300">{a.supplier_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.supplier_id} · {a.country}</div>
                      </td>
                      <td className="font-mono font-bold text-white text-xs">{a.allocated_quantity?.toLocaleString()}</td>
                      <td className="font-mono text-xs text-cyan-300">{a.allocation_percentage}%</td>
                      <td className="font-mono text-xs">${a.unit_price?.toFixed(2)}</td>
                      <td className="font-mono text-xs font-semibold text-emerald-400">${a.total_spend?.toLocaleString()}</td>
                      <td>
                        <span className={a.risk_class === 'LOW' ? 'badge-low' : a.risk_class === 'MEDIUM' ? 'badge-med' : a.risk_class === 'HIGH' ? 'badge-high' : 'badge-critical'}>
                          {a.risk_class}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{a.risk_probability}%</td>
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
