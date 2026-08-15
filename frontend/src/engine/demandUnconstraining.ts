import type { HistoricalDemandRow, UnconstrainedPoint, ProductMasterRow } from './types';

/**
 * Censored Demand Reconstruction Algorithm (Stock-out Unconstraining)
 * Rebuilds true latent demand from truncated sales data during out-of-stock periods.
 */
export function reconstructUnconstrainedDemand(
  history: HistoricalDemandRow[],
  product: ProductMasterRow,
  seasonalityCurve?: number[]
): {
  unconstrainedPoints: UnconstrainedPoint[];
  totalLostSalesUnits: number;
  totalLostRevenue: number;
  unconstrainedUpliftPct: number;
} {
  if (!history || history.length === 0) {
    return {
      unconstrainedPoints: [],
      totalLostSalesUnits: 0,
      totalLostRevenue: 0,
      unconstrainedUpliftPct: 0
    };
  }

  // Sort history chronologically
  const sorted = [...history].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week_number - b.week_number;
  });

  // Calculate overall non-stockout baseline
  const nonStockoutSales = sorted.filter(r => !r.is_stockout && r.sales_units > 0);
  const globalMean = nonStockoutSales.length > 0
    ? nonStockoutSales.reduce((acc, r) => acc + r.sales_units, 0) / nonStockoutSales.length
    : 30;

  let totalLostUnits = 0;
  let totalLostRev = 0;
  let totalActualUnits = 0;
  let totalUnconstrainedUnits = 0;

  const unconstrainedPoints: UnconstrainedPoint[] = sorted.map((row, idx) => {
    const isStockout = row.is_stockout === 1 || (row.inventory_eow === 0 && row.sales_units === 0);
    let unconstrained = row.sales_units;
    const weekIdx = Math.max(0, Math.min(51, row.week_number - 1));
    const seasonFactor = seasonalityCurve && seasonalityCurve[weekIdx] ? seasonalityCurve[weekIdx] : 1.0;

    if (isStockout) {
      // Look at 4-week window around this stockout (prior 2 and next 2 non-stockout weeks)
      const neighborhood: number[] = [];
      for (let offset = -3; offset <= 3; offset++) {
        if (offset === 0) continue;
        const neighbor = sorted[idx + offset];
        if (neighbor && !neighbor.is_stockout && neighbor.sales_units > 0) {
          neighborhood.push(neighbor.sales_units);
        }
      }

      const localBase = neighborhood.length > 0
        ? neighborhood.reduce((a, b) => a + b, 0) / neighborhood.length
        : globalMean;

      // Unconstrained demand estimation with seasonal adjustment
      const estimated = Math.round(localBase * seasonFactor * (row.is_promo ? 1.3 : 1.0));
      unconstrained = Math.max(row.sales_units, estimated);
    }

    const lostUnits = Math.max(0, unconstrained - row.sales_units);
    const lostRev = lostUnits * (row.price || product.msrp);

    totalLostUnits += lostUnits;
    totalLostRev += lostRev;
    totalActualUnits += row.sales_units;
    totalUnconstrainedUnits += unconstrained;

    return {
      week_id: row.week_id,
      week_number: row.week_number,
      year: row.year,
      sales_units: row.sales_units,
      is_stockout: Boolean(isStockout),
      unconstrained_demand: unconstrained,
      lost_sales_units: lostUnits,
      lost_revenue: lostRev
    };
  });

  const unconstrainedUpliftPct = totalActualUnits > 0
    ? parseFloat(((totalLostUnits / totalActualUnits) * 100).toFixed(2))
    : 0;

  return {
    unconstrainedPoints,
    totalLostSalesUnits: totalLostUnits,
    totalLostRevenue: totalLostRev,
    unconstrainedUpliftPct
  };
}
