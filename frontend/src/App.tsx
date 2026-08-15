import React, { useState, useEffect } from 'react';
import { SOPProvider, useSOP } from './context/SOPContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalFilterBar } from './procurement/components/GlobalFilterBar';
import { DataLineageModal } from './procurement/components/DataLineageModal';
import { SupplierDetailModal } from './procurement/components/SupplierDetailModal';

// P2 Views
import { DataInputsView } from './components/Layer1DataInputs/DataInputsView';
import { DataQualityView } from './components/Layer2DataQuality/DataQualityView';
import { DemandPlanningView } from './components/Layer3DemandPlanning/DemandPlanningView';
import { SupplyReconciliationView } from './components/Layer4SupplyReconciliation/SupplyReconciliationView';
import { MaterialRequirementView } from './components/Layer4SupplyReconciliation/MaterialRequirementView';
import { ExecutiveSOPView } from './components/Layer5ExecutiveSOP/ExecutiveSOPView';

// PR1 Views
import { DashboardPage } from './procurement/pages/DashboardPage';
import { DataQualityPage } from './procurement/pages/DataQualityPage';
import { DemandSignalPage } from './procurement/pages/DemandSignalPage';
import { ProcurementIntelPage } from './procurement/pages/ProcurementIntelPage';
import { SupplierEvalPage } from './procurement/pages/SupplierEvalPage';
import { RiskPredictionPage } from './procurement/pages/RiskPredictionPage';
import { AllocationPage } from './procurement/pages/AllocationPage';
import { ScenarioSimPage } from './procurement/pages/ScenarioSimPage';
import { PurchaseOrdersPage } from './procurement/pages/PurchaseOrdersPage';
import { FeedbackLoopPage } from './procurement/pages/FeedbackLoopPage';
import { ExecutiveReportPage } from './procurement/pages/ExecutiveReportPage';

import { fetchFilterOptions } from './procurement/services/api';
import type { FilterOptions } from './procurement/types';

const LINEAGE_ITEMS = [
  {
    metric: 'Gross Material Requirement',
    formula: 'Production Requirement × BOM Unit Consumption Rate × (1 + Scrap %)',
    description: 'Explodes finished garments forecast into raw fabric demand in linear meters.'
  },
  {
    metric: 'Net Procurement Requirement',
    formula: 'max(0, Gross Material Requirement - Available Inventory - Confirmed Incoming Supply)',
    description: 'Derived directly from S&OP BOM explosion minus on-hand factory buffers and in-transit PO shipments.'
  },
  {
    metric: 'Lead Time Demand & Reorder Point',
    formula: 'Lead Time Demand = Avg Demand × Lead Time; Reorder Point = Lead Time Demand + Safety Stock',
    description: 'Calculates dynamic buffer thresholds based on supplier lead times and historical demand volatility.'
  },
  {
    metric: 'Supplier Disruption Risk Probability',
    formula: 'GradientBoostingClassifier(OTD Rate, Delay Days, LT Variability, Defect Rate, Disruption History, Capacity Util, Financial Stability, ESG)',
    description: 'Machine learning model trained on historical delivery and inspection logs to predict disruption probability.'
  },
  {
    metric: 'Multi-Objective Supplier Allocation',
    formula: 'min Σ(Price × w_cost + Risk × λ_risk + Delay × λ_delay + Defect × λ_qual) s.t. Demand=NetReq, x ≤ Cap, Min/Max Contracts, Max Dependency %',
    description: 'Solved via PuLP Linear Programming (CBC Branch-and-Cut). Balances financial spend, delivery risk, vendor capacity, and multi-sourcing diversification.'
  },
  {
    metric: 'Supplier Composite Score',
    formula: 'w_cost·CostScore + w_qual·QualityRate + w_deliv·OTD_Rate + w_rel·Reliability + w_cap·CapacityScore',
    description: 'Multi-criteria dynamic weighted rating across approved vendors.'
  },
  {
    metric: 'Total Procurement Cost',
    formula: 'Σ (Allocated Quantity × Supplier Unit Price) for all (Supplier, Material) pairs',
    description: 'Calculated directly from PuLP optimal allocation results with zero hard-coding.'
  },
  {
    metric: 'Supplier Dependency Concentration Risk',
    formula: 'max(SupplierAllocation_s) / Total Procurement Requirement × 100%',
    description: 'Concentration index to prevent single-source vendor vulnerability.'
  }
];

const SOPAppContent: React.FC = () => {
  const {
    activePage,
    setActivePage,
    selectedMaterial,
    setSelectedMaterial,
    selectedSKU,
    setSelectedSKU,
    selectedPlant,
    setSelectedPlant,
    selectedSupplier,
    setSelectedSupplier,
    selectedSeason,
    setSelectedSeason,
    selectedRiskClass,
    setSelectedRiskClass,
    resetGlobalFilters,
    sharedAllocations,
    setSharedAllocations,
    lineageModalOpen,
    setLineageModalOpen,
    selectedSupplierModal,
    setSelectedSupplierModal
  } = useSOP();

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  useEffect(() => {
    fetchFilterOptions()
      .then(res => setFilterOptions(res))
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);

  // Filter bar is shown on relevant operational and procurement pages
  const showFilterBar = [
    'dashboard',
    'demand-planning',
    'procurement-intel',
    'supplier-eval',
    'risk-prediction',
    'supplier-allocation',
    'purchase-orders',
    'scenario-sim',
    'executive-sop'
  ].includes(activePage);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            selectedSeason={selectedSeason}
            onNavigate={setActivePage}
            onSelectSupplier={setSelectedSupplierModal}
            onOpenLineage={() => setLineageModalOpen(true)}
          />
        );
      case 'data-quality':
        return (
          <div className="space-y-8">
            <DataQualityView />
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                Raw Operational Datasets Ingestion Audit
              </h3>
              <DataInputsView />
            </div>
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                Comprehensive Data Quality & Imputation Report
              </h3>
              <DataQualityPage />
            </div>
          </div>
        );
      case 'demand-planning':
        return (
          <div className="space-y-6">
            <DemandPlanningView />
          </div>
        );
      case 'supply-capacity':
        return (
          <div className="space-y-6">
            <SupplyReconciliationView />
          </div>
        );
      case 'material-requirement':
        return <MaterialRequirementView />;
      case 'procurement-intel':
        return (
          <ProcurementIntelPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            onNavigate={setActivePage}
          />
        );
      case 'supplier-eval':
        return (
          <SupplierEvalPage
            selectedMaterial={selectedMaterial}
            onNavigate={setActivePage}
          />
        );
      case 'risk-prediction':
        return (
          <RiskPredictionPage
            selectedMaterial={selectedMaterial}
            onNavigate={setActivePage}
          />
        );
      case 'supplier-allocation':
        return (
          <AllocationPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            onAllocationsChange={setSharedAllocations}
            onNavigate={setActivePage}
          />
        );
      case 'purchase-orders':
        return (
          <PurchaseOrdersPage
            allocations={sharedAllocations}
            selectedPlant={selectedPlant}
          />
        );
      case 'scenario-sim':
        return (
          <ScenarioSimPage
            selectedMaterial={selectedMaterial}
            onAllocationsChange={setSharedAllocations}
            onNavigate={setActivePage}
          />
        );
      case 'feedback-loop':
        return <FeedbackLoopPage />;
      case 'executive-sop':
        return (
          <div className="space-y-8">
            <ExecutiveSOPView />
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                Executive Procurement Strategy Briefing & Governance
              </h3>
              <ExecutiveReportPage
                selectedMaterial={selectedMaterial}
                selectedPlant={selectedPlant}
                selectedSeason={selectedSeason}
              />
            </div>
          </div>
        );
      default:
        return <DashboardPage selectedMaterial={selectedMaterial} selectedPlant={selectedPlant} selectedSeason={selectedSeason} onNavigate={setActivePage} onSelectSupplier={setSelectedSupplierModal} onOpenLineage={() => setLineageModalOpen(true)} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {showFilterBar && (
              <GlobalFilterBar
                options={filterOptions}
                selectedMaterial={selectedMaterial}
                onMaterialChange={setSelectedMaterial}
                selectedSKU={selectedSKU}
                onSKUChange={setSelectedSKU}
                selectedPlant={selectedPlant}
                onPlantChange={setSelectedPlant}
                selectedSupplier={selectedSupplier}
                onSupplierChange={setSelectedSupplier}
                selectedSeason={selectedSeason}
                onSeasonChange={setSelectedSeason}
                selectedRiskClass={selectedRiskClass}
                onRiskClassChange={setSelectedRiskClass}
                onReset={resetGlobalFilters}
              />
            )}

            {renderActivePage()}
          </main>

          <footer className="border-t border-slate-800/80 bg-[#040810] py-3 text-center text-xs text-slate-500 shrink-0">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-400">
                TrendWear S&OP + Procurement Decision Platform
              </span>
              <span className="font-mono text-[11px] text-cyan-400">
                100% Dynamically Calculated • PuLP LP Solver • GradientBoosting AI Risk Model
              </span>
            </div>
          </footer>
        </div>
      </div>

      <DataLineageModal
        isOpen={lineageModalOpen}
        onClose={() => setLineageModalOpen(false)}
        lineageItems={LINEAGE_ITEMS}
      />

      <SupplierDetailModal
        supplierId={selectedSupplierModal}
        onClose={() => setSelectedSupplierModal(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SOPProvider>
      <div className="h-screen w-screen overflow-hidden bg-[#070b14]">
        <SOPAppContent />
      </div>
    </SOPProvider>
  );
}

