import type {
  ProductMasterRow,
  PlantCapacityRow,
  FabricRequirementRow,
  ForecastPoint,
  OptimizationParams,
  OptimizedAllocation
} from './types';

export interface OptimizationResultSummary {
  allocations: OptimizedAllocation[];
  totalForecastUnits: number;
  totalAllocatedUnits: number;
  totalUnmetUnits: number;
  serviceLevelPct: number;
  totalRevenue: number;
  totalProductionCost: number;
  totalOvertimeCost: number;
  totalProfit: number;
  grossMarginPct: number;
  plantsUtilized: Record<string, { stdHoursUsed: number; otHoursUsed: number; totalCost: number; unitsProduced: number }>;
  fabricsConsumedMeters: Record<string, number>;
  solveTimeMs: number;
}

/**
 * Real-time LP/Heuristic Optimization Solver for Production Allocation & Material Constraints
 */
export function runOptimizationSolver(
  skuForecastMap: Map<string, ForecastPoint[]>,
  productMap: Map<string, ProductMasterRow>,
  plantMap: Map<string, PlantCapacityRow>,
  fabricMap: Map<string, FabricRequirementRow>,
  params: OptimizationParams,
  horizonWeeks = 12 // Default to next quarter (12 weeks) for fast interactive solving
): OptimizationResultSummary {
  const startTime = performance.now();

  const selectedSkus = params.selectedSkuIds && params.selectedSkuIds.length > 0
    ? params.selectedSkuIds
    : Array.from(productMap.keys()).slice(0, 30); // Default to top 30 SKUs

  // Track plant capacity state: week -> plantId -> { availableStdHours, availableOtHours, hourlyRate, otRate }
  const plantCapacityState = new Map<number, Map<string, {
    stdRemaining: number;
    otRemaining: number;
    hourlyRate: number;
    otRate: number;
    stdUsed: number;
    otUsed: number;
    units: number;
    cost: number;
  }>>();

  for (let w = 1; w <= horizonWeeks; w++) {
    const weekMap = new Map<string, any>();
    plantMap.forEach(plant => {
      const std = plant.weekly_sew_hours;
      const ot = params.allowOvertime ? std * (plant.max_overtime_pct / 100) : 0;
      weekMap.set(plant.plant_id, {
        stdRemaining: std,
        otRemaining: ot,
        hourlyRate: plant.hourly_labor_rate,
        otRate: plant.hourly_labor_rate * params.overtimeCostMultiplier,
        stdUsed: 0,
        otUsed: 0,
        units: 0,
        cost: 0
      });
    });
    plantCapacityState.set(w, weekMap);
  }

  // Track fabric stock availability: fabricCode -> currentAvailableMeters
  const fabricStockState = new Map<string, number>();
  fabricMap.forEach(f => {
    // Initial available = On-hand + On-order
    fabricStockState.set(f.fabric_code, f.current_on_hand_meters + f.on_order_meters);
  });

  const fabricsConsumedMeters: Record<string, number> = {};
  fabricMap.forEach(f => { fabricsConsumedMeters[f.fabric_code] = 0; });

  const allocations: OptimizedAllocation[] = [];
  let totalForecastUnits = 0;
  let totalAllocatedUnits = 0;
  let totalUnmetUnits = 0;
  let totalRevenue = 0;
  let totalProductionCost = 0;
  let totalOvertimeCost = 0;
  let totalProfit = 0;

  // Prioritize SKUs by unit margin descending (Knapsack greedy heuristic)
  const skuList = selectedSkus.map(id => productMap.get(id)).filter(Boolean) as ProductMasterRow[];
  skuList.sort((a, b) => (b.msrp - b.unit_cost) - (a.msrp - a.unit_cost));

  skuList.forEach(sku => {
    const forecastPoints = skuForecastMap.get(sku.sku_id) || [];
    const fabric = fabricMap.get(sku.fabric_code);
    const primPlant = plantMap.get(sku.primary_plant_id);
    const secPlant = plantMap.get(sku.secondary_plant_id);

    const scrapMultiplier = fabric ? 1 + (fabric.scrap_rate_pct / 100) : 1.05;
    const metersPerUnit = fabric ? fabric.unit_meters_per_garment * scrapMultiplier : 1.5;

    for (let w = 1; w <= horizonWeeks; w++) {
      const point = forecastPoints[w - 1];
      const demandUnits = point ? point.forecast_units : 0;
      totalForecastUnits += demandUnits;

      if (demandUnits <= 0) continue;

      // Check fabric constraint
      const currentFabricStock = fabric ? (fabricStockState.get(fabric.fabric_code) || 0) : 999999;
      const maxUnitsByFabric = fabric ? Math.floor(currentFabricStock / metersPerUnit) : demandUnits;

      // Feasible units considering material
      let unitsToProduce = Math.min(demandUnits, maxUnitsByFabric);

      let allocatedUnits = 0;
      let otUnits = 0;
      let plantUsedId = sku.primary_plant_id;

      const weekPlants = plantCapacityState.get(w)!;
      const primState = primPlant ? weekPlants.get(primPlant.plant_id) : null;
      const secState = secPlant ? weekPlants.get(secPlant.plant_id) : null;

      const efficiency = primPlant ? (primPlant.labor_efficiency_pct / 100) : 0.9;
      const hoursPerUnit = (sku.sewing_minutes / 60) / Math.max(0.5, efficiency);

      // Attempt Primary Plant Standard Hours
      if (primState && primState.stdRemaining >= hoursPerUnit) {
        const canProduce = Math.min(unitsToProduce, Math.floor(primState.stdRemaining / hoursPerUnit));
        allocatedUnits = canProduce;
        const hrsUsed = canProduce * hoursPerUnit;
        primState.stdRemaining -= hrsUsed;
        primState.stdUsed += hrsUsed;
        primState.units += canProduce;
        const laborCost = hrsUsed * primState.hourlyRate;
        primState.cost += laborCost;
        plantUsedId = primPlant!.plant_id;
      }
      // If remaining demand, attempt Primary Plant Overtime Hours
      else if (primState && params.allowOvertime && primState.otRemaining >= hoursPerUnit) {
        const canProduce = Math.min(unitsToProduce, Math.floor(primState.otRemaining / hoursPerUnit));
        allocatedUnits = canProduce;
        otUnits = canProduce;
        const hrsUsed = canProduce * hoursPerUnit;
        primState.otRemaining -= hrsUsed;
        primState.otUsed += hrsUsed;
        primState.units += canProduce;
        const laborCost = hrsUsed * primState.otRate;
        primState.cost += laborCost;
        totalOvertimeCost += laborCost - (hrsUsed * primState.hourlyRate);
        plantUsedId = primPlant!.plant_id;
      }
      // If still unmet, attempt Secondary Plant
      else if (secState && secState.stdRemaining >= hoursPerUnit) {
        const canProduce = Math.min(unitsToProduce, Math.floor(secState.stdRemaining / hoursPerUnit));
        allocatedUnits = canProduce;
        const hrsUsed = canProduce * hoursPerUnit;
        secState.stdRemaining -= hrsUsed;
        secState.stdUsed += hrsUsed;
        secState.units += canProduce;
        const laborCost = hrsUsed * secState.hourlyRate;
        secState.cost += laborCost;
        plantUsedId = secPlant!.plant_id;
      }

      // Deduct fabric consumed
      const fabricConsumed = allocatedUnits * metersPerUnit;
      if (fabric) {
        fabricStockState.set(fabric.fabric_code, Math.max(0, currentFabricStock - fabricConsumed));
        fabricsConsumedMeters[fabric.fabric_code] = (fabricsConsumedMeters[fabric.fabric_code] || 0) + fabricConsumed;
      }

      const unmet = Math.max(0, demandUnits - allocatedUnits);
      const rev = allocatedUnits * sku.msrp;
      const matCost = fabricConsumed * (fabric ? fabric.cost_per_meter : 5);
      const prodCost = allocatedUnits * sku.unit_cost + matCost;
      const profit = rev - prodCost;

      totalAllocatedUnits += allocatedUnits;
      totalUnmetUnits += unmet;
      totalRevenue += rev;
      totalProductionCost += prodCost;
      totalProfit += profit;

      allocations.push({
        sku_id: sku.sku_id,
        week_number: w,
        plant_id: plantUsedId,
        demand_units: demandUnits,
        allocated_units: allocatedUnits,
        unmet_units: unmet,
        overtime_units: otUnits,
        fabric_consumed_meters: Math.round(fabricConsumed),
        production_cost: Math.round(prodCost),
        revenue: Math.round(rev),
        profit: Math.round(profit)
      });
    }
  });

  const plantsUtilized: Record<string, any> = {};
  plantMap.forEach(p => {
    let totStd = 0;
    let totOt = 0;
    let totCost = 0;
    let totUnits = 0;
    for (let w = 1; w <= horizonWeeks; w++) {
      const state = plantCapacityState.get(w)?.get(p.plant_id);
      if (state) {
        totStd += state.stdUsed;
        totOt += state.otUsed;
        totCost += state.cost;
        totUnits += state.units;
      }
    }
    plantsUtilized[p.plant_id] = {
      stdHoursUsed: Math.round(totStd),
      otHoursUsed: Math.round(totOt),
      totalCost: Math.round(totCost),
      unitsProduced: totUnits
    };
  });

  const serviceLevelPct = totalForecastUnits > 0
    ? parseFloat(((totalAllocatedUnits / totalForecastUnits) * 100).toFixed(1))
    : 100;

  const grossMarginPct = totalRevenue > 0
    ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(1))
    : 0;

  const endTime = performance.now();

  return {
    allocations,
    totalForecastUnits,
    totalAllocatedUnits,
    totalUnmetUnits,
    serviceLevelPct,
    totalRevenue: Math.round(totalRevenue),
    totalProductionCost: Math.round(totalProductionCost),
    totalOvertimeCost: Math.round(totalOvertimeCost),
    totalProfit: Math.round(totalProfit),
    grossMarginPct,
    plantsUtilized,
    fabricsConsumedMeters,
    solveTimeMs: Math.round(endTime - startTime)
  };
}
