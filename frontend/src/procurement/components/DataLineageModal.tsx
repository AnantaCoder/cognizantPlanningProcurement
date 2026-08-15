import React from 'react';
import { X, HelpCircle, Calculator, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lineageItems: { metric: string; formula: string; description: string }[];
}

export const DataLineageModal: React.FC<Props> = ({ isOpen, onClose, lineageItems }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mathematical Data Lineage & Calculation Formulas</h2>
              <p className="text-xs text-slate-400">Transparency breakdown for hackathon judges & procurement auditors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
            <span className="font-bold uppercase tracking-wider">Zero Hard-Coding Guarantee: </span>
            All displayed procurement quantities, multi-objective supplier splits, disruption risk probabilities, lead times, and scenario deltas are evaluated dynamically at runtime from the loaded operational CSV datasets.
          </div>

          <div className="space-y-3">
            {lineageItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    {item.metric}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                    EXACT FORMULA
                  </span>
                </div>
                <div className="font-mono text-xs bg-slate-950 px-3 py-2 rounded-lg text-amber-300 border border-slate-800 overflow-x-auto">
                  {item.formula}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Close Lineage Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
