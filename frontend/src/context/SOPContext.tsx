import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadAllSOPDatasets,
  parseCsvFile
} from '../engine/dataLoader';
import type { LoadedDataState } from '../engine/dataLoader';
import type {
  SKUForecastResult,
  FabricShortageForecast,
  PlantCapacityForecast,
  ScenarioDefinition,
  ScenarioResult,
  ExecutiveActionItem,
  ForecastPoint
} from '../engine/types';
import { reconstructUnconstrainedDemand } from '../engine/demandUnconstraining';
import { generateSkuForecast } from '../engine/forecasting';
import type { ForecastAdjustments } from '../engine/forecasting';
import { calculateFabricRequirements } from '../engine/bomExplosion';
import { calculatePlantCapacityLoads } from '../engine/capacityEngine';
import { runOptimizationSolver } from '../engine/optimizationSolver';
import type { OptimizationResultSummary } from '../engine/optimizationSolver';
import { PRESET_SCENARIOS, simulateScenario } from '../engine/scenarioEngine';
import { generateExecutiveActions } from '../engine/actionEngine';

interface SOPContextType {
  data: LoadedDataState | null;
  isLoading: boolean;
  loadingStep: string;
  loadingProgress: number;
  activeLayer: number;
  setActiveLayer: (layer: number) => void;
  
  // Layer 3 Demand State
  selectedSkuId: string;
  setSelectedSkuId: (skuId: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  skuForecast: SKUForecastResult | null;
  forecastAdjustments: ForecastAdjustments;
  setForecastAdjustments: React.Dispatch<React.SetStateAction<ForecastAdjustments>>;
  
  // Layer 4 Supply State
  fabricShortages: FabricShortageForecast[];
  plantLoads: PlantCapacityForecast[];
  
  // Layer 5 Optimization & Scenarios
  selectedScenario: ScenarioDefinition;
  setSelectedScenario: (s: ScenarioDefinition) => void;
  scenarioResults: ScenarioResult[];
  activeScenarioResult: ScenarioResult | null;
  customScenario: ScenarioDefinition;
  setCustomScenario: React.Dispatch<React.SetStateAction<ScenarioDefinition>>;
  
  optimizationSummary: OptimizationResultSummary | null;
  isOptimizing: boolean;
  runOptimizer: (selectedSkus?: string[], horizon?: number) => void;
  
  // Executive Playbook Actions
  executiveActions: ExecutiveActionItem[];
  applyActionSimulation: (action: ExecutiveActionItem) => void;
  
  // Data upload / reload
  reloadDatasets: () => Promise<void>;
  handleCsvUpload: (fileType: string, content: string) => Promise<void>;
}

const SOPContext = createContext<SOPContextType | null>(null);

export const SOPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<LoadedDataState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Initializing TrendWear S&OP Platform...');
  const [loadingProgress, setLoadingProgress] = useState(5);
  const [activeLayer, setActiveLayer] = useState(1); // Default to Business Data Layer

  const [selectedSkuId, setSelectedSkuId] = useState<string>('TW-TOP-0001');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [forecastAdjustments, setForecastAdjustments] = useState<ForecastAdjustments>({
    promotionalLiftMultiplier: 1.0,
    priceElasticityFactor: -1.2,
    priceDeltaPct: 0,
    categoryTrendOverridePct: 0
  });

  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition>(PRESET_SCENARIOS[0]);
  const [customScenario, setCustomScenario] = useState<ScenarioDefinition>({
    ...PRESET_SCENARIOS[0],
    id: 'custom_scenario',
    name: 'Custom Parameterized Scenario'
  });

  const [optimizationSummary, setOptimizationSummary] = useState<OptimizationResultSummary | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initial Data Load
  const initLoad = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadAllSOPDatasets((step, pct) => {
        setLoadingStep(step);
        setLoadingProgress(pct);
      });
      setData(loaded);
      
      // Set initial SKU to first in master
      if (loaded.productMaster.length > 0) {
        setSelectedSkuId(loaded.productMaster[0].sku_id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load S&OP datasets:', err);
      setLoadingStep('Error loading datasets. Please check network/files.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initLoad();
  }, [initLoad]);

  // Compute SKU Forecast on demand
  const skuForecast = useMemo<SKUForecastResult | null>(() => {
    if (!data || !selectedSkuId) return null;
    const product = data.skuMap.get(selectedSkuId);
    if (!product) return null;

    const rawHistory = data.demandBySku.get(selectedSkuId) || [];
    const seasonCurve = data.categorySeasonalityMap.get(product.category);
    
    // Step 1: Censored Demand Unconstraining
    const unconstrained = reconstructUnconstrainedDemand(rawHistory, product, seasonCurve);
    
    // Step 2: AI Forecasting Models
    return generateSkuForecast(unconstrained.unconstrainedPoints, product, forecastAdjustments, 52);
  }, [data, selectedSkuId, forecastAdjustments]);

  // Precompute forecast map for all / top SKUs for BOM & Plant load calculations
  const globalSkuForecastMap = useMemo(() => {
    if (!data) return new Map<string, ForecastPoint[]>();
    const map = new Map<string, ForecastPoint[]>();

    // Process top 120 key representative SKUs across all categories for lightning-fast 60fps aggregate reconciliation
    const activeSkus = data.productMaster.slice(0, 120);
    activeSkus.forEach(product => {
      const history = data.demandBySku.get(product.sku_id) || [];
      const seasonCurve = data.categorySeasonalityMap.get(product.category);
      const unconstrained = reconstructUnconstrainedDemand(history, product, seasonCurve);
      const forecast = generateSkuForecast(unconstrained.unconstrainedPoints, product, forecastAdjustments, 52);
      map.set(product.sku_id, forecast.futureForecast);
    });

    return map;
  }, [data, forecastAdjustments]);

  // Compute Layer 4: Fabric BOM requirements
  const fabricShortages = useMemo<FabricShortageForecast[]>(() => {
    if (!data || globalSkuForecastMap.size === 0) return [];
    return calculateFabricRequirements(globalSkuForecastMap, data.skuMap, data.fabricMap, 52);
  }, [data, globalSkuForecastMap]);

  // Compute Layer 4: Plant Capacity loads
  const plantLoads = useMemo<PlantCapacityForecast[]>(() => {
    if (!data || globalSkuForecastMap.size === 0) return [];
    return calculatePlantCapacityLoads(globalSkuForecastMap, data.skuMap, data.plantMap, 52);
  }, [data, globalSkuForecastMap]);

  // Run Optimization Solver
  const runOptimizer = useCallback((selectedSkus?: string[], horizon = 12) => {
    if (!data || globalSkuForecastMap.size === 0) return;
    setIsOptimizing(true);

    setTimeout(() => {
      const targetSkus = selectedSkus && selectedSkus.length > 0
        ? selectedSkus
        : Array.from(globalSkuForecastMap.keys()).slice(0, 30);

      const result = runOptimizationSolver(
        globalSkuForecastMap,
        data.skuMap,
        data.plantMap,
        data.fabricMap,
        {
          selectedSkuIds: targetSkus,
          objective: 'max_profit',
          allowOvertime: true,
          overtimeCostMultiplier: 1.5,
          airFreightExpediteCostPerMeter: 2.5,
          serviceLevelTargetPct: 95
        },
        horizon
      );

      setOptimizationSummary(result);
      setIsOptimizing(false);
    }, 150);
  }, [data, globalSkuForecastMap]);

  // Trigger initial optimization run once data is ready
  useEffect(() => {
    if (data && globalSkuForecastMap.size > 0 && !optimizationSummary) {
      runOptimizer();
    }
  }, [data, globalSkuForecastMap, optimizationSummary, runOptimizer]);

  // Compute Scenarios side-by-side results
  const scenarioResults = useMemo<ScenarioResult[]>(() => {
    if (!data || globalSkuForecastMap.size === 0) return [];
    return PRESET_SCENARIOS.map(scen => 
      simulateScenario(scen, globalSkuForecastMap, data.skuMap, data.plantMap, data.fabricMap, 12)
    );
  }, [data, globalSkuForecastMap]);

  const activeScenarioResult = useMemo<ScenarioResult | null>(() => {
    if (!data || globalSkuForecastMap.size === 0) return null;
    return simulateScenario(selectedScenario, globalSkuForecastMap, data.skuMap, data.plantMap, data.fabricMap, 12);
  }, [data, globalSkuForecastMap, selectedScenario]);

  // Compute Layer 5: Executive Actions
  const executiveActions = useMemo<ExecutiveActionItem[]>(() => {
    if (!fabricShortages.length || !plantLoads.length) return [];
    const serviceLevel = optimizationSummary ? optimizationSummary.serviceLevelPct : 91.5;
    const revAtRisk = fabricShortages.reduce((acc, f) => acc + f.revenueAtRisk, 0);
    return generateExecutiveActions(fabricShortages, plantLoads, serviceLevel, revAtRisk);
  }, [fabricShortages, plantLoads, optimizationSummary]);

  // Apply Action into Live Simulation
  const applyActionSimulation = useCallback((action: ExecutiveActionItem) => {
    if (action.simulatedScenarioPatch) {
      const updatedScenario: ScenarioDefinition = {
        ...selectedScenario,
        ...action.simulatedScenarioPatch,
        name: `${selectedScenario.name} (+ Action: ${action.title})`
      };
      setSelectedScenario(updatedScenario);
    }
    // Re-run optimization solver with action simulated
    runOptimizer();
  }, [selectedScenario, runOptimizer]);

  // Handle custom CSV Upload
  const handleCsvUpload = useCallback(async (fileType: string, content: string) => {
    if (!data) return;
    try {
      setIsLoading(true);
      setLoadingStep(`Processing uploaded ${fileType}...`);
      const parsed = await parseCsvFile<any>(content, true);

      if (fileType === 'product_master') {
        const productMaster = parsed.map(r => ({
          sku_id: String(r.sku_id),
          style_name: String(r.style_name),
          category: String(r.category),
          subcategory: String(r.subcategory || ''),
          fabric_code: String(r.fabric_code),
          primary_plant_id: String(r.primary_plant_id),
          secondary_plant_id: String(r.secondary_plant_id),
          sewing_minutes: Number(r.sewing_minutes || 15),
          cut_minutes: Number(r.cut_minutes || 4),
          unit_cost: Number(r.unit_cost || 10),
          wholesale_price: Number(r.wholesale_price || 20),
          msrp: Number(r.msrp || 40),
          target_margin_pct: Number(r.target_margin_pct || 60),
          lead_time_weeks: Number(r.lead_time_weeks || 10),
          moq_units: Number(r.moq_units || 500),
          safety_stock_days: Number(r.safety_stock_days || 30)
        }));
        const newMap = new Map(productMaster.map(p => [p.sku_id, p]));
        setData(prev => prev ? { ...prev, productMaster, skuMap: newMap } : null);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error parsing uploaded CSV:', err);
      setIsLoading(false);
    }
  }, [data]);

  return (
    <SOPContext.Provider
      value={{
        data,
        isLoading,
        loadingStep,
        loadingProgress,
        activeLayer,
        setActiveLayer,
        selectedSkuId,
        setSelectedSkuId,
        selectedCategory,
        setSelectedCategory,
        skuForecast,
        forecastAdjustments,
        setForecastAdjustments,
        fabricShortages,
        plantLoads,
        selectedScenario,
        setSelectedScenario,
        scenarioResults,
        activeScenarioResult,
        customScenario,
        setCustomScenario,
        optimizationSummary,
        isOptimizing,
        runOptimizer,
        executiveActions,
        applyActionSimulation,
        reloadDatasets: initLoad,
        handleCsvUpload
      }}
    >
      {children}
    </SOPContext.Provider>
  );
};

export const useSOP = () => {
  const context = useContext(SOPContext);
  if (!context) {
    throw new Error('useSOP must be used within an SOPProvider');
  }
  return context;
};
