import React, { useState, useMemo } from 'react';
import { useSOP } from '../../context/SOPContext';
import {
  Database,
  FileSpreadsheet,
  Search,
  UploadCloud,
  CheckCircle2,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

export const DataInputsView: React.FC = () => {
  const { data, handleCsvUpload } = useSOP();
  const [activeTab, setActiveTab] = useState<'demand' | 'product' | 'plant' | 'fabric' | 'sellthrough' | 'seasonality'>('demand');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const pageSize = 15;

  const tabs = [
    { id: 'demand', name: 'historical_demand.csv', count: data?.historicalDemand.length || 0, desc: '260-Week Retail Sales (M5 Base)' },
    { id: 'product', name: 'product_master.csv', count: data?.productMaster.length || 0, desc: '1,080 Apparel SKUs & Margins' },
    { id: 'plant', name: 'plant_capacity.csv', count: data?.plantCapacity.length || 0, desc: '12 Global Manufacturing Mills' },
    { id: 'fabric', name: 'fabric_requirement.csv', count: data?.fabricRequirement.length || 0, desc: '24 BOM Textiles & Supplier Lead Times' },
    { id: 'sellthrough', name: 'sell_through.csv', count: data?.sellThrough.length || 0, desc: 'Channel Sell-Through & Markdown Benchmarks' },
    { id: 'seasonality', name: 'seasonality.csv', count: data?.seasonality.length || 0, desc: '52-Week Category Multiplier Indices' },
  ];

  // Current Dataset Table Rows
  const tableData = useMemo(() => {
    if (!data) return [];
    switch (activeTab) {
      case 'demand':
        return data.historicalDemand.slice(0, 1000); // Display top 1000 for responsive browser table
      case 'product':
        return data.productMaster;
      case 'plant':
        return data.plantCapacity;
      case 'fabric':
        return data.fabricRequirement;
      case 'sellthrough':
        return data.sellThrough;
      case 'seasonality':
        return data.seasonality.map(s => ({
          category: s.category,
          avg_multiplier: (s.multipliers.reduce((a, b) => a + b, 0) / 52).toFixed(2),
          peak_multiplier: Math.max(...s.multipliers).toFixed(2),
          min_multiplier: Math.min(...s.multipliers).toFixed(2),
          weeks_modeled: 52
        }));
      default:
        return [];
    }
  }, [data, activeTab]);

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    const term = searchTerm.toLowerCase();
    return tableData.filter((row: any) =>
      Object.values(row).some(v => String(v).toLowerCase().includes(term))
    );
  }, [tableData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns = useMemo(() => {
    if (paginatedRows.length === 0) return [];
    return Object.keys(paginatedRows[0]);
  }, [paginatedRows]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleCsvUpload('product_master', content);
      setUploadSuccess(`Successfully uploaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      setTimeout(() => setUploadSuccess(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>TOTAL HISTORICAL RECORDS</span>
            <Database className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {data?.summary.totalRecords.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            260 Weeks (5 Years: 2021W01 – 2025W52)
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>TOTAL ACTIVE SKUS</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {data?.summary.totalSkus.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            18 Apparel Product Categories
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>MANUFACTURING MILLS</span>
            <TableIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {data?.summary.totalPlants} Facilities
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Vietnam, Bangladesh, India, Mexico, Turkey
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>BOM TEXTILE CATALOG</span>
            <TableIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {data?.summary.totalFabrics} Fabric Types
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lead times from 5 to 14 weeks
          </div>
        </div>
      </div>

      {/* Dataset Selector Tabs */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Layer 1: Unified S&OP Business Data Inputs</h2>
              <p className="text-xs text-slate-400">All calculations are powered dynamically by the loaded CSV runtime files.</p>
            </div>
          </div>

          {/* Upload and Export Buttons */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-medium transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Custom CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <a
              href={`/data/${tabs.find(t => t.id === activeTab)?.name}`}
              download
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </a>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Dataset Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
              className={`p-3 rounded-xl text-left transition-all border ${
                activeTab === tab.id
                  ? 'bg-brand-600/20 border-brand-500/50 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-mono text-xs font-semibold truncate text-brand-300">{tab.name}</div>
              <div className="text-xs font-bold text-slate-200 mt-1">{tab.count.toLocaleString()} rows</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Search Bar & Table Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${tabs.find(t => t.id === activeTab)?.name}...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredData.length)} of {filteredData.length.toLocaleString()} matching rows
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="sop-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} className="text-left font-mono">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row: any, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40">
                    {columns.map(col => {
                      const val = row[col];
                      const isNum = typeof val === 'number';
                      const isStockoutCol = col === 'is_stockout';
                      return (
                        <td key={col} className={`font-mono ${isNum ? 'text-slate-300' : 'text-slate-400'}`}>
                          {isStockoutCol ? (
                            val === 1 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                STOCKOUT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] text-slate-500">Normal</span>
                            )
                          ) : typeof val === 'number' ? (
                            val.toLocaleString()
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 1} className="py-8 text-center text-slate-500 text-xs">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <div>
            Page <span className="font-bold text-slate-200">{page}</span> of <span className="font-bold text-slate-200">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
