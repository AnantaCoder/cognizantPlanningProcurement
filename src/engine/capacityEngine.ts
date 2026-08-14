import type {
  PlantCapacityRow,
  ProductMasterRow,
  ForecastPoint,
  PlantCapacityForecast
} from './types';

/**
 * Calculates Multi-Plant Capacity Loading & Overload Risk
 */
export function calculatePlantCapacityLoads(
  skuForecastMap: Map<string, ForecastPoint[]>,
  productMap: Map<string, ProductMasterRow>,
  plantMap: Map<string, PlantCapacityRow>,
  horizonWeeks = 52
): PlantCapacityForecast[] {
  const plantHoursRequired = new Map<string, number[]>();

  plantMap.forEach((_, plantId) => {
    plantHoursRequired.set(plantId, Array(horizonWeeks).fill(0));
  });

  // Map SKU demand to primary plants
  skuForecastMap.forEach((forecastPoints, skuId) => {
    const product = productMap.get(skuId);
    if (!product) return;

    const plant = plantMap.get(product.primary_plant_id);
    if (!plant) return;

    const plantHours = plantHoursRequired.get(plant.plant_id);
    if (!plantHours) return;

    const efficiency = plant.labor_efficiency_pct / 100;
    const stdHoursPerUnit = (product.sewing_minutes / 60) / Math.max(0.5, efficiency);

    for (let w = 0; w < Math.min(horizonWeeks, forecastPoints.length); w++) {
      const units = forecastPoints[w].forecast_units;
      plantHours[w] += units * stdHoursPerUnit;
    }
  });

  const results: PlantCapacityForecast[] = [];

  plantMap.forEach((plant, plantId) => {
    const weeklyRequired = plantHoursRequired.get(plantId) || Array(horizonWeeks).fill(0);
    const standardSew = plant.weekly_sew_hours;
    const maxSew = standardSew * (1 + (plant.max_overtime_pct / 100));

    let sumUtil = 0;
    let overloadCount = 0;
    let totalOtHours = 0;
    const weeklyUtil: number[] = [];

    for (let w = 0; w < horizonWeeks; w++) {
      const req = weeklyRequired[w];
      const utilPct = standardSew > 0 ? (req / standardSew) * 100 : 0;
      weeklyUtil.push(parseFloat(utilPct.toFixed(1)));
      sumUtil += utilPct;

      if (req > standardSew) {
        overloadCount++;
        const otHours = Math.min(req - standardSew, maxSew - standardSew);
        totalOtHours += Math.max(0, otHours);
      }
    }

    const avgUtil = parseFloat((sumUtil / horizonWeeks).toFixed(1));
    const overtimeRate = plant.hourly_labor_rate * 1.5;
    const overtimeCost = Math.round(totalOtHours * overtimeRate);

    results.push({
      plant_id: plant.plant_id,
      plant_name: plant.plant_name,
      country: plant.country,
      standardSewHours: standardSew,
      maxSewHours: Math.round(maxSew),
      weeklyRequiredSewHours: weeklyRequired.map(v => Math.round(v)),
      weeklyUtilizationPct: weeklyUtil,
      averageUtilizationPct: avgUtil,
      overloadWeeksCount: overloadCount,
      totalOvertimeHours: Math.round(totalOtHours),
      overtimeCost
    });
  });

  // Sort by average utilization descending (bottleneck plants first)
  results.sort((a, b) => b.averageUtilizationPct - a.averageUtilizationPct);

  return results;
}
