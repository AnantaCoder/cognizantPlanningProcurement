import React from 'react';
import { Filter, RotateCcw, Building2, Package, Layers, Truck, Calendar, ShieldAlert } from 'lucide-react';
import type { FilterOptions } from '../types';

interface Props {
  options: FilterOptions | null;
  selectedMaterial: string;
  onMaterialChange: (val: string) => void;
  selectedSKU: string;
  onSKUChange: (val: string) => void;
  selectedPlant: string;
  onPlantChange: (val: string) => void;
  selectedSupplier: string;
  onSupplierChange: (val: string) => void;
  selectedSeason: string;
  onSeasonChange: (val: string) => void;
  selectedRiskClass: string;
  onRiskClassChange: (val: string) => void;
  onReset: () => void;
}

export const GlobalFilterBar: React.FC<Props> = ({
  options,
  selectedMaterial,
  onMaterialChange,
  selectedSKU,
  onSKUChange,
  selectedPlant,
  onPlantChange,
  selectedSupplier,
  onSupplierChange,
  selectedSeason,
  onSeasonChange,
  selectedRiskClass,
  onRiskClassChange,
  onReset,
}) => {
  const activeCount = [
    selectedMaterial !== 'ALL',
    selectedSKU !== 'ALL',
    selectedPlant !== 'ALL',
    selectedSupplier !== 'ALL',
    selectedSeason !== 'ALL',
    selectedRiskClass !== 'ALL',
  ].filter(Boolean).length;

  return (
    <div className="glass-panel p-4 rounded-xl mb-6 shadow-md border border-slate-800 bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>GLOBAL PROCUREMENT FILTERS</span>
          {activeCount > 0 && (
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
              {activeCount} Active
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Material Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Material
          </label>
          <select
            value={selectedMaterial}
            onChange={(e) => onMaterialChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Materials (50)</option>
            {options?.materials.map((m) => (
              <option key={m.Material_ID} value={m.Material_ID}>
                {m.Material_ID} - {m.Material_Name}
              </option>
            ))}
          </select>
        </div>

        {/* Plant Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <Building2 className="w-3 h-3 text-cyan-400" /> Plant
          </label>
          <select
            value={selectedPlant}
            onChange={(e) => onPlantChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Plants (12)</option>
            {options?.plants.map((p) => (
              <option key={p.Plant_ID} value={p.Plant_ID}>
                {p.Plant_ID} - {p.Plant_Name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <Truck className="w-3 h-3 text-cyan-400" /> Supplier
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Suppliers (30)</option>
            {options?.suppliers.map((s) => (
              <option key={s.Supplier_ID} value={s.Supplier_ID}>
                {s.Supplier_ID} - {s.Supplier_Name}
              </option>
            ))}
          </select>
        </div>

        {/* Season Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <Calendar className="w-3 h-3 text-cyan-400" /> Season
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Seasons</option>
            {options?.seasons.filter(s => s !== 'ALL').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Class Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" /> Risk Tier
          </label>
          <select
            value={selectedRiskClass}
            onChange={(e) => onRiskClassChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">LOW Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="HIGH">HIGH Risk</option>
            <option value="CRITICAL">CRITICAL Risk</option>
          </select>
        </div>

        {/* SKU quick select */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-1">
            <Package className="w-3 h-3 text-cyan-400" /> Target SKU
          </label>
          <select
            value={selectedSKU}
            onChange={(e) => onSKUChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Active SKUs</option>
            {options?.materials ? (
              // Generate standard SKUs from material master or list
              Array.from({ length: 15 }, (_, i) => {
                const skuCode = `SKU-${String(i + 1).padStart(4, '0')}`;
                return (
                  <option key={skuCode} value={skuCode}>
                    {skuCode}
                  </option>
                );
              })
            ) : null}
          </select>
        </div>
      </div>
    </div>
  );
};
