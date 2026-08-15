import type {
  FabricRequirementRow,
  ProductMasterRow,
  ForecastPoint,
  FabricShortageForecast
} from './types';

/**
 * Explodes SKU-level Demand Forecasts into Fabric Requirements (BOM Explosion)
 * and evaluates fabric inventory waterfall and shortage risk.
 */
export function calculateFabricRequirements(
  skuForecastMap: Map<string, ForecastPoint[]>,
  productMap: Map<string, ProductMasterRow>,
  fabricMap: Map<string, FabricRequirementRow>,
  horizonWeeks = 52
): FabricShortageForecast[] {
  const fabricDemandMeters = new Map<string, number[]>();
  const fabricAffectedSkus = new Map<string, Set<string>>();

  // Initialize fabric demand arrays
  fabricMap.forEach((_, code) => {
    fabricDemandMeters.set(code, Array(horizonWeeks).fill(0));
    fabricAffectedSkus.set(code, new Set<string>());
  });

  // Aggregate demand per fabric per week
  skuForecastMap.forEach((forecastPoints, skuId) => {
    const product = productMap.get(skuId);
    if (!product) return;

    const fabric = fabricMap.get(product.fabric_code);
    if (!fabric) return;

    const fabArray = fabricDemandMeters.get(fabric.fabric_code);
    if (!fabArray) return;

    fabricAffectedSkus.get(fabric.fabric_code)?.add(skuId);

    const scrapMultiplier = 1 + (fabric.scrap_rate_pct / 100);
    const metersPerGarment = fabric.unit_meters_per_garment;

    for (let w = 0; w < Math.min(horizonWeeks, forecastPoints.length); w++) {
      const units = forecastPoints[w].forecast_units;
      const meters = units * metersPerGarment * scrapMultiplier;
      fabArray[w] += meters;
    }
  });

  // Calculate inventory waterfall per fabric
  const results: FabricShortageForecast[] = [];

  fabricMap.forEach((fabric, fabricCode) => {
    const weeklyDemand = fabricDemandMeters.get(fabricCode) || Array(horizonWeeks).fill(0);
    const endingInventory: number[] = [];
    let currentStock = fabric.current_on_hand_meters;
    let stockoutWeek: number | null = null;
    let totalShortageMeters = 0;

    // Model scheduled receipts: on-order arriving around supplier lead time
    const arrivalWeek = Math.max(1, Math.min(horizonWeeks - 1, fabric.supplier_lead_time_weeks));

    for (let w = 0; w < horizonWeeks; w++) {
      let receipts = 0;
      if (w === arrivalWeek - 1) {
        receipts = fabric.on_order_meters;
      }

      currentStock = currentStock + receipts - weeklyDemand[w];
      endingInventory.push(Math.round(currentStock));

      if (currentStock < 0) {
        if (stockoutWeek === null) {
          stockoutWeek = w + 1; // 1-indexed week
        }
        totalShortageMeters += Math.abs(currentStock);
      }
    }

    const scrapMultiplier = 1 + (fabric.scrap_rate_pct / 100);
    const affectedUnits = Math.round(totalShortageMeters / (fabric.unit_meters_per_garment * scrapMultiplier));
    const avgMsrp = 65; // average apparel garment price
    const revenueAtRisk = affectedUnits * avgMsrp;

    results.push({
      fabric_code: fabric.fabric_code,
      fabric_name: fabric.fabric_name,
      supplier_name: fabric.supplier_name,
      supplier_lead_time_weeks: fabric.supplier_lead_time_weeks,
      current_on_hand_meters: fabric.current_on_hand_meters,
      on_order_meters: fabric.on_order_meters,
      cost_per_meter: fabric.cost_per_meter,
      weeklyDemandMeters: weeklyDemand.map(v => Math.round(v)),
      weeklyEndingInventoryMeters: endingInventory,
      stockoutWeek,
      totalMetersShortage: Math.round(totalShortageMeters),
      shortageCost: Math.round(totalShortageMeters * fabric.cost_per_meter),
      affectedGarmentUnits: affectedUnits,
      revenueAtRisk: Math.round(revenueAtRisk)
    });
  });

  // Sort by revenue at risk descending
  results.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

  return results;
}
