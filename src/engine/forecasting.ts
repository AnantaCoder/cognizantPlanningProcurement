import type {
  UnconstrainedPoint,
  ForecastPoint,
  ForecastModelMetrics,
  SKUForecastResult,
  ProductMasterRow
} from './types';

export interface ForecastAdjustments {
  promotionalLiftMultiplier: number; // e.g. 1.0 (default), 1.25 (+25%)
  priceElasticityFactor: number;     // e.g. -1.2
  priceDeltaPct: number;             // e.g. 0% or -10%
  categoryTrendOverridePct: number;  // e.g. +5%
}

/**
 * Computes model evaluation metrics on historical backtest
 */
function calculateMetrics(actuals: number[], predictions: number[]): ForecastModelMetrics {
  let sumAbsError = 0;
  let sumActual = 0;
  let sumSquaredError = 0;
  let sumError = 0;
  let sumApe = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    const err = act - pred;
    const absErr = Math.abs(err);

    sumAbsError += absErr;
    sumActual += act;
    sumSquaredError += err * err;
    sumError += err;

    if (act > 0) {
      sumApe += (absErr / act);
      validCount++;
    }
  }

  const wmape = sumActual > 0 ? (sumAbsError / sumActual) * 100 : 0;
  const mape = validCount > 0 ? (sumApe / validCount) * 100 : 0;
  const rmse = actuals.length > 0 ? Math.sqrt(sumSquaredError / actuals.length) : 0;
  const mad = actuals.length > 0 ? sumAbsError / actuals.length : 1;
  const bias = actuals.length > 0 ? sumError / actuals.length : 0;
  const trackingSignal = mad > 0 ? sumError / mad : 0;

  return {
    wmape: parseFloat(wmape.toFixed(2)),
    mape: parseFloat(mape.toFixed(2)),
    rmse: parseFloat(rmse.toFixed(2)),
    bias: parseFloat(bias.toFixed(2)),
    trackingSignal: parseFloat(trackingSignal.toFixed(2))
  };
}

/**
 * Holt-Winters Multiplicative Triple Exponential Smoothing
 * Seasonality Period = 52 weeks
 */
function computeHoltWinters(
  series: number[],
  alpha = 0.25,
  beta = 0.05,
  gamma = 0.35,
  period = 52,
  horizon = 52
): { fitted: number[]; future: number[] } {
  const n = series.length;
  if (n < period * 2) {
    // Fallback if not enough periods
    const mean = series.reduce((a, b) => a + b, 0) / Math.max(1, series.length);
    return {
      fitted: series.map(() => mean),
      future: Array(horizon).fill(mean)
    };
  }

  // Initial Level L0 & Trend B0
  let L = series.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let B = (series.slice(period, period * 2).reduce((a, b) => a + b, 0) - series.slice(0, period).reduce((a, b) => a + b, 0)) / (period * period);

  // Initial seasonal indices S
  const S: number[] = [];
  for (let i = 0; i < period; i++) {
    S[i] = series[i] / Math.max(1, L);
  }

  const fitted: number[] = [];

  for (let t = 0; t < n; t++) {
    const y = series[t];
    const sIdx = t % period;
    const prevL = L;
    const prevB = B;
    const prevS = S[sIdx];

    const currentFitted = (prevL + prevB) * prevS;
    fitted.push(Math.max(0, currentFitted));

    // Update equations
    L = alpha * (y / Math.max(0.01, prevS)) + (1 - alpha) * (prevL + prevB);
    B = beta * (L - prevL) + (1 - beta) * prevB;
    S[sIdx] = gamma * (y / Math.max(0.01, L)) + (1 - gamma) * prevS;
  }

  const future: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const sIdx = (n + h - 1) % period;
    const fVal = (L + h * B) * (S[sIdx] || 1.0);
    future.push(Math.max(0, Math.round(fVal)));
  }

  return { fitted, future };
}

/**
 * Croston's Method for Intermittent / Lumpy Demand
 */
function computeCroston(
  series: number[],
  alpha = 0.2,
  horizon = 52
): { fitted: number[]; future: number[] } {
  let z = series.find(v => v > 0) || 10; // demand level
  let p = 1; // interval
  let q = 1; // time since last non-zero demand

  const fitted: number[] = [];

  for (let t = 0; t < series.length; t++) {
    const y = series[t];
    const forecast = p > 0 ? z / p : 0;
    fitted.push(Math.max(0, forecast));

    if (y > 0) {
      z = alpha * y + (1 - alpha) * z;
      p = alpha * q + (1 - alpha) * p;
      q = 1;
    } else {
      q += 1;
    }
  }

  const futureVal = p > 0 ? Math.round(z / p) : 0;
  const future = Array(horizon).fill(Math.max(0, futureVal));

  return { fitted, future };
}

/**
 * Dampened Trend Exponential Smoothing
 */
function computeDampenedTrend(
  series: number[],
  alpha = 0.3,
  beta = 0.1,
  phi = 0.92,
  horizon = 52
): { fitted: number[]; future: number[] } {
  let L = series[0] || 20;
  let B = (series[1] || 20) - L;
  const fitted: number[] = [];

  for (let t = 0; t < series.length; t++) {
    const y = series[t];
    const currentFitted = L + phi * B;
    fitted.push(Math.max(0, currentFitted));

    const prevL = L;
    L = alpha * y + (1 - alpha) * (prevL + phi * B);
    B = beta * (L - prevL) + (1 - beta) * phi * B;
  }

  const future: number[] = [];
  let currentL = L;
  let currentB = B;
  for (let h = 1; h <= horizon; h++) {
    let dampFactor = 0;
    for (let i = 1; i <= h; i++) {
      dampFactor += Math.pow(phi, i);
    }
    const val = currentL + dampFactor * currentB;
    future.push(Math.max(0, Math.round(val)));
  }

  return { fitted, future };
}

/**
 * Main SKU-level Demand Forecasting Engine
 */
export function generateSkuForecast(
  unconstrainedPoints: UnconstrainedPoint[],
  product: ProductMasterRow,
  adjustments: ForecastAdjustments = {
    promotionalLiftMultiplier: 1.0,
    priceElasticityFactor: -1.2,
    priceDeltaPct: 0,
    categoryTrendOverridePct: 0
  },
  horizonWeeks = 52
): SKUForecastResult {
  const demandSeries = unconstrainedPoints.map(p => p.unconstrained_demand);

  // 1. Compute models
  const hw = computeHoltWinters(demandSeries, 0.25, 0.05, 0.35, 52, horizonWeeks);
  const croston = computeCroston(demandSeries, 0.2, horizonWeeks);
  const dampened = computeDampenedTrend(demandSeries, 0.3, 0.1, 0.92, horizonWeeks);

  // 2. Metrics calculation on backtest
  const hwMetrics = calculateMetrics(demandSeries, hw.fitted);
  const crostonMetrics = calculateMetrics(demandSeries, croston.fitted);
  const dampenedMetrics = calculateMetrics(demandSeries, dampened.fitted);

  // 3. Ensemble calculation: weights inversely proportional to WMAPE
  const wHW = 1 / Math.max(1, hwMetrics.wmape);
  const wCR = 1 / Math.max(1, crostonMetrics.wmape);
  const wDT = 1 / Math.max(1, dampenedMetrics.wmape);
  const totalWeight = wHW + wCR + wDT;

  const weightHW = wHW / totalWeight;
  const weightCR = wCR / totalWeight;
  const weightDT = wDT / totalWeight;

  const ensembleFitted = demandSeries.map((_, i) => {
    return (hw.fitted[i] * weightHW) + (croston.fitted[i] * weightCR) + (dampened.fitted[i] * weightDT);
  });
  const ensembleMetrics = calculateMetrics(demandSeries, ensembleFitted);

  // 4. Select best model
  const models: Array<{ name: SKUForecastResult['bestModel']; wmape: number }> = [
    { name: 'Holt-Winters', wmape: hwMetrics.wmape },
    { name: 'Croston', wmape: crostonMetrics.wmape },
    { name: 'Dampened Trend', wmape: dampenedMetrics.wmape },
    { name: 'Ensemble', wmape: ensembleMetrics.wmape }
  ];
  models.sort((a, b) => a.wmape - b.wmape);
  const bestModel = models[0].name;

  // 5. Price elasticity and promotional adjustment
  const elasticityMultiplier = 1 + (adjustments.priceElasticityFactor * (adjustments.priceDeltaPct / 100));
  const trendMultiplier = 1 + (adjustments.categoryTrendOverridePct / 100);
  const combinedMultiplier = adjustments.promotionalLiftMultiplier * elasticityMultiplier * trendMultiplier;

  // 6. Build future forecast horizon points
  const lastPoint = unconstrainedPoints[unconstrainedPoints.length - 1];
  const startYear = lastPoint ? lastPoint.year : 2025;
  const startWeek = lastPoint ? lastPoint.week_number : 52;

  let totalForecastUnits = 0;
  let totalForecastRev = 0;

  const futureForecast: ForecastPoint[] = [];

  for (let h = 0; h < horizonWeeks; h++) {
    const rawWeekNum = startWeek + h + 1;
    const yearOffset = Math.floor((rawWeekNum - 1) / 52);
    const weekNumber = ((rawWeekNum - 1) % 52) + 1;
    const year = startYear + yearOffset;
    const weekId = `${year}W${String(weekNumber).padStart(2, '0')}`;

    const hwVal = hw.future[h] || 0;
    const crVal = croston.future[h] || 0;
    const dtVal = dampened.future[h] || 0;
    const ensVal = Math.round(hwVal * weightHW + crVal * weightCR + dtVal * weightDT);

    // Primary forecast selection
    let baseVal = ensVal;
    if (bestModel === 'Holt-Winters') baseVal = hwVal;
    else if (bestModel === 'Croston') baseVal = crVal;
    else if (bestModel === 'Dampened Trend') baseVal = dtVal;

    const adjustedUnits = Math.max(0, Math.round(baseVal * combinedMultiplier));
    const stdDev = Math.max(3, hwMetrics.rmse);
    const upper95 = Math.round(adjustedUnits + 1.96 * stdDev);
    const lower95 = Math.max(0, Math.round(adjustedUnits - 1.96 * stdDev));

    const revenue = adjustedUnits * product.msrp;
    totalForecastUnits += adjustedUnits;
    totalForecastRev += revenue;

    futureForecast.push({
      week_id: weekId,
      week_number: weekNumber,
      year,
      forecast_units: adjustedUnits,
      upper_95: upper95,
      lower_95: lower95,
      holt_winters: Math.round(hwVal * combinedMultiplier),
      croston: Math.round(crVal * combinedMultiplier),
      dampened_trend: Math.round(dtVal * combinedMultiplier),
      ensemble: Math.round(ensVal * combinedMultiplier),
      promotional_lift: adjustments.promotionalLiftMultiplier,
      revenue
    });
  }

  return {
    sku_id: product.sku_id,
    style_name: product.style_name,
    category: product.category,
    forecastHistory: unconstrainedPoints,
    futureForecast,
    metrics: {
      holtWinters: hwMetrics,
      croston: crostonMetrics,
      dampenedTrend: dampenedMetrics,
      ensemble: ensembleMetrics
    },
    bestModel,
    total52WeekForecast: totalForecastUnits,
    total52WeekRevenue: totalForecastRev
  };
}
