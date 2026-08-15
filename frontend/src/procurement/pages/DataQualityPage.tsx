import React, { useEffect, useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  ArrowRight,
  Filter,
  Eye
} from 'lucide-react';
import type { DataQualityReport } from '../types';
import { fetchDataQuality, fetchRawTablePreview } from '../services/api';

export const DataQualityPage: React.FC = () => {
  const [data, setData] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string>('demand_forecast.csv');
  const [rawTable, setRawTable] = useState<any>(null);
  const [loadingRaw, setLoadingRaw] = useState<boolean>(false);

  useEffect(() => {
    fetchDataQuality()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLoadingRaw(true);
    fetchRawTablePreview(selectedFile, 30)
      .then((res) => {
        setRawTable(res);
        setLoadingRaw(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingRaw(false);
      });
  }, [selectedFile]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Auditing data quality and running cleaning pipelines...
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
            <span className="badge-low">STAGE 00: DATA INTEGRITY</span>
            <span className="text-xs text-slate-400 font-mono">13 CSV Relational Feeds</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Procurement Data Quality & Automated Cleaning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Detecting and resolving data imperfections (null values, duplicates, outliers, foreign key gaps) prior to mathematical optimization.
          </p>
        </div>

        {/* Quality Score Badge */}
        <div className="glass-panel px-5 py-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Data Quality Index
            </div>
            <div className="text-2xl font-black text-white">
              {sum.overall_data_quality_score}%
            </div>
            <div className="text-[10px] text-slate-400">{sum.status}</div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages Visual */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          End-to-End Data Cleaning Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {data.pipeline_stages.map((stage, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">STEP {idx + 1}</span>
                <span className="badge-low text-[10px]">{stage.status}</span>
              </div>
              <div className="text-xs font-bold text-white mb-1">{stage.stage}</div>
              <p className="text-[11px] text-slate-400 leading-snug">{stage.desc}</p>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                {stage.records.toLocaleString()} records processed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Raw Records</div>
          <div className="text-lg font-bold text-white mt-1">{sum.total_raw_records?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">13 Datasets</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Cleaned & Validated</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{sum.total_cleaned_records?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">100% Ready</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Missing Values Imputed</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{sum.total_missing_values?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Median filled</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Duplicates Removed</div>
          <div className="text-lg font-bold text-indigo-400 mt-1">{sum.total_duplicates?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Deduped</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Outliers Clipped</div>
          <div className="text-lg font-bold text-rose-400 mt-1">{sum.total_outliers?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">5x IQR filtered</div>
        </div>
      </div>

      {/* Dataset Health Metrics & Issues Resolved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Breakdown Table */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Operational Datasets Audit Status
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Dataset CSV</th>
                  <th>Raw</th>
                  <th>Clean</th>
                  <th>Missing</th>
                  <th>Dups</th>
                  <th>Health Score</th>
                </tr>
              </thead>
              <tbody>
                {data.file_metrics.map((f) => (
                  <tr key={f.filename}>
                    <td className="font-mono text-xs text-cyan-300">{f.filename}</td>
                    <td className="font-mono text-xs">{f.raw_records.toLocaleString()}</td>
                    <td className="font-mono text-xs font-semibold text-emerald-400">{f.cleaned_records.toLocaleString()}</td>
                    <td className="font-mono text-xs text-amber-300">{f.missing_values}</td>
                    <td className="font-mono text-xs text-indigo-300">{f.duplicates}</td>
                    <td>
                      <span className="badge-low">{f.quality_score}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resolved Issues Log */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Detected Imperfections & Remediation Actions
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {data.issues_resolved.map((iss, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-cyan-300 font-mono">{iss.dataset}</span>
                  <span className={iss.severity === 'Critical' ? 'badge-critical' : (iss.severity === 'High' ? 'badge-high' : 'badge-med')}>
                    {iss.issue_type} ({iss.count})
                  </span>
                </div>
                <p className="text-slate-300 mb-1.5">{iss.description}</p>
                <div className="text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{iss.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data Preview Explorer */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Relational CSV Data Explorer
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Select Dataset:</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {data.file_metrics.map((f) => (
                <option key={f.filename} value={f.filename}>
                  {f.filename} ({f.cleaned_records} records)
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingRaw ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading dataset rows...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
            <table className="w-full data-table">
              <thead>
                <tr>
                  {rawTable?.columns.map((c: string) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawTable?.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx}>
                    {rawTable.columns.map((col: string) => (
                      <td key={col} className="font-mono text-xs">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
