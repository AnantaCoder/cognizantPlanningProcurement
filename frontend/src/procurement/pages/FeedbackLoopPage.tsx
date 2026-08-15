import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { fetchFeedbackMetrics, recalibrateModel } from '../services/api';

export const FeedbackLoopPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibMsg, setRecalibMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbackMetrics()
      .then(res => { setData(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const handleRecalibrate = () => {
    setRecalibrating(true);
    recalibrateModel().then(res => {
      setRecalibMsg(res.message);
      setRecalibrating(false);
    }).catch(() => setRecalibrating(false));
  };

  if (loading || !data) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-3" />
      Loading continuous learning telemetry...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-low">CONTINUOUS LEARNING</span>
            <span className="text-xs text-slate-400 font-mono">Closed-Loop Feedback Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Model Feedback Loop & Continuous Learning</h1>
          <p className="text-xs text-slate-400 mt-0.5">{data.summary.feedback_loop_description}</p>
        </div>
        <button onClick={handleRecalibrate} disabled={recalibrating}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 self-start disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${recalibrating ? 'animate-spin' : ''}`} />
          {recalibrating ? 'Recalibrating Model...' : 'Trigger Model Recalibration'}
        </button>
      </div>

      {recalibMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>{recalibMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Prediction Accuracy</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{data.summary.model_prediction_accuracy_pct}%</div>
          <div className="text-[10px] text-slate-500 font-mono">Delivery outcome prediction</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Mean Absolute Error</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">{data.summary.mean_absolute_error_weeks} wks</div>
          <div className="text-[10px] text-slate-500 font-mono">Delay prediction MAE</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">RMSE</div>
          <div className="text-xl font-bold text-white mt-1">{data.summary.root_mean_square_error_weeks} wks</div>
          <div className="text-[10px] text-slate-500 font-mono">Root Mean Square Error</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Lead-Time Drift</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{data.summary.average_lead_time_drift_weeks} wks</div>
          <div className="text-[10px] text-slate-500 font-mono">Quoted vs actual variance</div>
        </div>
      </div>

      {/* Model accuracy timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Model Accuracy Improvement Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.accuracy_timeline} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} domain={[75, 100]} unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} unit="w" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="accuracy_pct" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Accuracy %" />
                <Line yAxisId="right" type="monotone" dataKey="mae_weeks" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="MAE (wks)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Supplier Performance Shift (Pre vs Post Recalibration)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.supplier_performance_shifts} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="supplier_id" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="previous_otd_rate" name="Prev OTD %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current_otd_rate" name="Current OTD %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Predicted vs Actual Comparison */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Predicted vs Actual Delivery Comparison (Historical Sample)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Supplier</th>
                <th>Predicted Delay</th>
                <th>Actual Delay</th>
                <th>Prediction Error</th>
                <th>Actual Disruption?</th>
                <th>Accuracy Status</th>
              </tr>
            </thead>
            <tbody>
              {data.comparisons.map((c: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-[10px] text-cyan-300">{c.delivery_id}</td>
                  <td>
                    <div className="text-xs text-white">{c.supplier_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{c.supplier_id}</div>
                  </td>
                  <td className="font-mono text-xs text-amber-300">{c.predicted_delay_weeks} wks</td>
                  <td className="font-mono text-xs text-white">{c.actual_delay_weeks} wks</td>
                  <td className={`font-mono text-xs font-semibold ${c.prediction_error_weeks <= 0.5 ? 'text-emerald-400' : c.prediction_error_weeks <= 1.2 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {c.prediction_error_weeks} wks
                  </td>
                  <td>
                    <span className={c.actual_disruption_flag.includes('Disrupted') ? 'badge-high' : 'badge-low'}>
                      {c.actual_disruption_flag}
                    </span>
                  </td>
                  <td>
                    <span className={c.status === 'Accurate' ? 'badge-low' : c.status === 'Minor Drift' ? 'badge-med' : 'badge-high'}>
                      {c.status}
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
