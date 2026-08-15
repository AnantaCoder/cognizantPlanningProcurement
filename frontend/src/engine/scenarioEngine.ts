import type {
  ScenarioDefinition,
  ScenarioResult,
  ProductMasterRow,
  PlantCapacityRow,
  FabricRequirementRow,
  ForecastPoint
} from './types';
import { runOptimizationSolver } from './optimizationSolver';

export const PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'base_case',
    name: 'Base Case S&OP Plan',
    description: 'Baseline unconstrained demand forecast with standard operating plant capacities and normal textile supplier lead times.',
    demandMultiplier: 1.0,
    plantCapacityMultipliers: {},
    fabricLeadTimeDeltaWeeks: 0,
    overtimePremiumMultiplier: 1.5,
    allowExpediteFreight: false
  },
  {
    id: 'demand_surge_25',
    name: 'Q4 Viral Holiday Surge (+25%)',
    description: 'Demand spikes +25% across Outerwear, Knits, and Holiday styles due to aggressive marketing campaign and viral social trend.',
    demandMultiplier: 1.25,
    plantCapacityMultipliers: {},
    fabricLeadTimeDeltaWeeks: 0,
    overtimePremiumMultiplier: 1.5,
    allowExpediteFreight: false
  },
  {
    id: 'vietnam_disruption',
    name: 'SE Asia Supply Chain Disruption',
    description: 'Port congestion and energy rationing reduces Vietnam plant capacity by 40% while Asian textile lead times stretch by +4 weeks.',
    demandMultiplier: 1.0,
    plantCapacityMultipliers: {
      PLANT_VN_01: 0.60,
      PLANT_VN_02: 0.60,
      PLANT_KH_01: 0.75
    },
    fabricLeadTimeDeltaWeeks: 4,
    overtimePremiumMultiplier: 1.75,
    allowExpediteFreight: false
  },
  {
    id: 'nearshore_fast_track',
    name: 'Nearshore Speed-to-Market Rebalance',
    description: 'Mitigate risk by shifting core production to Puebla (Mexico) and Izmir (Turkey) nearshore hubs with 30% authorized overtime.',
    demandMultiplier: 1.10,
    plantCapacityMultipliers: {
      PLANT_MX_01: 1.30,
      PLANT_TR_01: 1.25,
      PLANT_PT_01: 1.15
    },
    fabricLeadTimeDeltaWeeks: -2,
    overtimePremiumMultiplier: 1.5,
    allowExpediteFreight: true
  }
];

/**
 * Runs What-If Scenario simulation and returns structured comparative KPIs
 */
export function simulateScenario(
  scenario: ScenarioDefinition,
  skuForecastMap: Map<string, ForecastPoint[]>,
  productMap: Map<string, ProductMasterRow>,
  plantMap: Map<string, PlantCapacityRow>,
  fabricMap: Map<string, FabricRequirementRow>,
  horizonWeeks = 12
): ScenarioResult {
  // Apply demand multiplier to forecast map
  const scaledForecastMap = new Map<string, ForecastPoint[]>();
  skuForecastMap.forEach((points, skuId) => {
    scaledForecastMap.set(skuId, points.map(p => ({
      ...p,
      forecast_units: Math.round(p.forecast_units * scenario.demandMultiplier),
      revenue: Math.round(p.forecast_units * scenario.demandMultiplier * (productMap.get(skuId)?.msrp || 50))
    })));
  });

  // Apply plant capacity multipliers
  const scaledPlantMap = new Map<string, PlantCapacityRow>();
  plantMap.forEach((plant, plantId) => {
    const mult = scenario.plantCapacityMultipliers[plantId] || 1.0;
    scaledPlantMap.set(plantId, {
      ...plant,
      weekly_sew_hours: Math.round(plant.weekly_sew_hours * mult),
      weekly_cut_hours: Math.round(plant.weekly_cut_hours * mult)
    });
  });

  // Apply fabric lead time and expedite adjustment
  const scaledFabricMap = new Map<string, FabricRequirementRow>();
  fabricMap.forEach((fabric, code) => {
    const leadTimeAdj = Math.max(1, fabric.supplier_lead_time_weeks + scenario.fabricLeadTimeDeltaWeeks);
    // If expedited freight allowed, simulate 20% buffer arrival
    const bonusStock = scenario.allowExpediteFreight ? Math.round(fabric.on_order_meters * 0.5) : 0;
    scaledFabricMap.set(code, {
      ...fabric,
      supplier_lead_time_weeks: leadTimeAdj,
      current_on_hand_meters: fabric.current_on_hand_meters + bonusStock
    });
  });

  // Run optimization solver with scenario parameters
  const optResult = runOptimizationSolver(
    scaledForecastMap,
    productMap,
    scaledPlantMap,
    scaledFabricMap,
    {
      selectedSkuIds: Array.from(productMap.keys()).slice(0, 50),
      objective: 'max_profit',
      allowOvertime: true,
      overtimeCostMultiplier: scenario.overtimePremiumMultiplier,
      airFreightExpediteCostPerMeter: scenario.allowExpediteFreight ? 2.50 : 0,
      serviceLevelTargetPct: 95
    },
    horizonWeeks
  );

  let plantOverloadWeeks = 0;
  Object.values(optResult.plantsUtilized).forEach(p => {
    if (p.otHoursUsed > 0) plantOverloadWeeks++;
  });

  let fabricStockoutCount = 0;
  scaledFabricMap.forEach((f, code) => {
    const consumed = optResult.fabricsConsumedMeters[code] || 0;
    if (consumed >= (f.current_on_hand_meters + f.on_order_meters)) {
      fabricStockoutCount++;
    }
  });

  const avgMsrp = 65;
  const revenueAtRisk = optResult.totalUnmetUnits * avgMsrp;

  return {
    scenarioId: scenario.id,
    name: scenario.name,
    totalDemandUnits: optResult.totalForecastUnits,
    totalSuppliedUnits: optResult.totalAllocatedUnits,
    unmetDemandUnits: optResult.totalUnmetUnits,
    serviceLevelPct: optResult.serviceLevelPct,
    totalRevenue: optResult.totalRevenue,
    totalCost: optResult.totalProductionCost,
    grossMarginPct: optResult.grossMarginPct,
    fabricStockoutCount,
    plantOverloadWeeks,
    revenueAtRisk
  };
}
