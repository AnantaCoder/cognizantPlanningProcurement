import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { DataLineageModal } from './components/DataLineageModal';
import { SupplierDetailModal } from './components/SupplierDetailModal';
import { DashboardPage } from './pages/DashboardPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { DemandSignalPage } from './pages/DemandSignalPage';
import { ProcurementIntelPage } from './pages/ProcurementIntelPage';
import { SupplierEvalPage } from './pages/SupplierEvalPage';
import { RiskPredictionPage } from './pages/RiskPredictionPage';
import { AllocationPage } from './pages/AllocationPage';
import { ScenarioSimPage } from './pages/ScenarioSimPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { FeedbackLoopPage } from './pages/FeedbackLoopPage';
import { ExecutiveReportPage } from './pages/ExecutiveReportPage';
import { fetchFilterOptions } from './services/api';
import type { FilterOptions } from './types';

const LINEAGE_ITEMS = [
  { metric: 'Net Procurement Requirement', formula: 'max(0, Gross Material Requirement - Current Inventory - Confirmed Incoming Supply)', description: 'Calculated from BOM explosion of production forecast, minus on-hand inventory buffers and confirmed PO deliveries already in transit.' },
  { metric: 'Supplier Risk Probability', formula: 'GradientBoostingClassifier(OTD Rate, Avg Delay Days, LT Variability, Defect Rate, Disruption Count, Capacity Utilization, Financial Score, ESG Score)', description: 'ML model trained from historical delivery, quality, and disruption logs. Risk threshold classification is user-configurable.' },
  { metric: 'Multi-Objective Allocation', formula: 'min Σ(Price × w_cost + Risk × λ + Delay Penalty + Quality Penalty) s.t. Demand=NetReq, x ≤ Capacity, Contract Min/Max, Max Supplier Dependency %', description: 'Solved by PuLP Linear Programming (CBC Branch-and-Cut Solver). Does NOT simply choose cheapest supplier — balances cost, risk, capacity, and diversification.' },
  { metric: 'Supplier Composite Score', formula: 'w_cost × CostScore + w_qual × QualityPassRate + w_deliv × OnTimeRate + w_rel × ReliabilityScore + w_cap × CapacityScore', description: 'Dynamic weighted multi-criteria formula. Weights are adjustable in real-time by procurement managers.' },
  { metric: 'Total Procurement Cost', formula: 'Σ (Allocated Quantity × Supplier Unit Price) for each (Supplier, Material) pair', description: 'Calculated directly from PuLP optimal allocation results — zero hard-coding.' },
  { metric: 'Supplier Dependency Risk', formula: 'max(SupplierAllocation_s) / Total Procurement Requirement × 100%', description: 'Measures concentration risk. A single supplier receiving > 50% flags HIGH DEPENDENCY RISK.' },
  { metric: 'Expected Delivery Delay', formula: 'Weighted Avg Predicted Delay = Σ (PredictedDelay_s × Allocated_s) / Total Allocated', description: 'Volume-weighted average of ML-predicted delivery delays across all allocated suppliers.' },
  { metric: 'Recommended Order Date', formula: 'Required Date - Avg Supplier Lead Time Weeks', description: 'Timing signal that triggers DELIVERY RISK flag if Expected Arrival > Required Date.' },
];

export default function ProcurementApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [lineageOpen, setLineageOpen] = useState(false);
  const [selectedSupplierModal, setSelectedSupplierModal] = useState<string | null>(null);

  // Global filter state
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [selectedSKU, setSelectedSKU] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedRiskClass, setSelectedRiskClass] = useState('ALL');

  // Shared allocations state (propagated from optimizer/scenario to PO page)
  const [sharedAllocations, setSharedAllocations] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterOptions()
      .then(res => setFilterOptions(res))
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);

  const handleReset = () => {
    setSelectedMaterial('ALL');
    setSelectedSKU('ALL');
    setSelectedPlant('ALL');
    setSelectedSupplier('ALL');
    setSelectedSeason('ALL');
    setSelectedRiskClass('ALL');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            selectedSeason={selectedSeason}
            onNavigate={setCurrentPage}
            onSelectSupplier={setSelectedSupplierModal}
            onOpenLineage={() => setLineageOpen(true)}
          />
        );
      case 'data':
        return <DataQualityPage />;
      case 'demand':
        return (
          <DemandSignalPage
            selectedMaterial={selectedMaterial}
            selectedSKU={selectedSKU}
            selectedPlant={selectedPlant}
            selectedSeason={selectedSeason}
            onNavigate={setCurrentPage}
          />
        );
      case 'procurement':
        return (
          <ProcurementIntelPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            onNavigate={setCurrentPage}
          />
        );
      case 'suppliers':
        return (
          <SupplierEvalPage
            selectedMaterial={selectedMaterial}
            onNavigate={setCurrentPage}
          />
        );
      case 'risk':
        return (
          <RiskPredictionPage
            selectedMaterial={selectedMaterial}
            onNavigate={setCurrentPage}
          />
        );
      case 'allocation':
        return (
          <AllocationPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            onAllocationsChange={setSharedAllocations}
            onNavigate={setCurrentPage}
          />
        );
      case 'scenarios':
        return (
          <ScenarioSimPage
            selectedMaterial={selectedMaterial}
            onAllocationsChange={setSharedAllocations}
            onNavigate={setCurrentPage}
          />
        );
      case 'purchase-orders':
        return (
          <PurchaseOrdersPage
            allocations={sharedAllocations}
            selectedPlant={selectedPlant}
          />
        );
      case 'feedback':
        return <FeedbackLoopPage />;
      case 'report':
        return (
          <ExecutiveReportPage
            selectedMaterial={selectedMaterial}
            selectedPlant={selectedPlant}
            selectedSeason={selectedSeason}
          />
        );
      default:
        return <div className="text-slate-400 text-sm">Page not found</div>;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} onOpenLineage={() => setLineageOpen(true)}>
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
          onReset={handleReset}
        />
        {renderPage()}
      </Layout>

      <DataLineageModal isOpen={lineageOpen} onClose={() => setLineageOpen(false)} lineageItems={LINEAGE_ITEMS} />
      <SupplierDetailModal supplierId={selectedSupplierModal} onClose={() => setSelectedSupplierModal(null)} />
    </>
  );
}
