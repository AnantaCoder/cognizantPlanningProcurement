export interface HistoricalDemandRow {
  sku_id: string;
  week_id: string;
  year: number;
  week_number: number;
  sales_units: number;
  price: number;
  is_promo: number;
  is_stockout: number;
  inventory_eow: number;
}

export interface ProductMasterRow {
  sku_id: string;
  style_name: string;
  category: string;
  subcategory: string;
  fabric_code: string;
  primary_plant_id: string;
  secondary_plant_id: string;
  sewing_minutes: number;
  cut_minutes: number;
  unit_cost: number;
  wholesale_price: number;
  msrp: number;
  target_margin_pct: number;
  lead_time_weeks: number;
  moq_units: number;
  safety_stock_days: number;
}

export interface PlantCapacityRow {
  plant_id: string;
  plant_name: string;
  country: string;
  region: string;
  weekly_cut_hours: number;
  weekly_sew_hours: number;
  weekly_finish_hours: number;
  max_overtime_pct: number;
  hourly_labor_rate: number;
  labor_efficiency_pct: number;
}

export interface FabricRequirementRow {
  fabric_code: string;
  fabric_name: string;
  supplier_name: string;
  supplier_country: string;
  supplier_lead_time_weeks: number;
  moq_meters: number;
  cost_per_meter: number;
  current_on_hand_meters: number;
  on_order_meters: number;
  reorder_point_meters: number;
  unit_meters_per_garment: number;
  scrap_rate_pct: number;
}

export interface SellThroughRow {
  category: string;
  channel: string;
  full_price_sell_through_pct: number;
  first_markdown_sell_through_pct: number;
  final_clearance_pct: number;
  return_rate_pct: number;
  avg_days_to_sell: number;
}

export interface SeasonalityRow {
  category: string;
  multipliers: number[]; // 52 weeks
}

export interface DatasetSummary {
  totalRecords: number;
  totalSkus: number;
  totalWeeks: number;
  totalPlants: number;
  totalFabrics: number;
  totalCategories: number;
  totalHistoricalUnits: number;
  totalHistoricalRevenue: number;
  stockoutIncidents: number;
  stockoutRatePct: number;
  loadedAt: Date;
}

export interface UnconstrainedPoint {
  week_id: string;
  week_number: number;
  year: number;
  sales_units: number;
  is_stockout: boolean;
  unconstrained_demand: number;
  lost_sales_units: number;
  lost_revenue: number;
}

export interface ForecastPoint {
  week_id: string;
  week_number: number;
  year: number;
  forecast_units: number;
  upper_95: number;
  lower_95: number;
  holt_winters: number;
  croston: number;
  dampened_trend: number;
  ensemble: number;
  promotional_lift: number;
  revenue: number;
}

export interface ForecastModelMetrics {
  wmape: number;
  mape: number;
  rmse: number;
  bias: number;
  trackingSignal: number;
}

export interface SKUForecastResult {
  sku_id: string;
  style_name: string;
  category: string;
  forecastHistory: UnconstrainedPoint[];
  futureForecast: ForecastPoint[];
  metrics: {
    holtWinters: ForecastModelMetrics;
    croston: ForecastModelMetrics;
    dampenedTrend: ForecastModelMetrics;
    ensemble: ForecastModelMetrics;
  };
  bestModel: 'Holt-Winters' | 'Croston' | 'Dampened Trend' | 'Ensemble';
  total52WeekForecast: number;
  total52WeekRevenue: number;
}

export interface FabricShortageForecast {
  fabric_code: string;
  fabric_name: string;
  supplier_name: string;
  supplier_lead_time_weeks: number;
  current_on_hand_meters: number;
  on_order_meters: number;
  cost_per_meter: number;
  weeklyDemandMeters: number[]; // 52 weeks
  weeklyEndingInventoryMeters: number[];
  stockoutWeek: number | null; // first week inventory drops below 0
  totalMetersShortage: number;
  shortageCost: number;
  affectedGarmentUnits: number;
  revenueAtRisk: number;
}

export interface PlantCapacityForecast {
  plant_id: string;
  plant_name: string;
  country: string;
  standardSewHours: number;
  maxSewHours: number;
  weeklyRequiredSewHours: number[]; // 52 weeks
  weeklyUtilizationPct: number[];
  averageUtilizationPct: number;
  overloadWeeksCount: number;
  totalOvertimeHours: number;
  overtimeCost: number;
}

export interface OptimizationParams {
  selectedSkuIds: string[];
  objective: 'max_profit' | 'min_cost' | 'max_service_level';
  allowOvertime: boolean;
  overtimeCostMultiplier: number;
  airFreightExpediteCostPerMeter: number;
  serviceLevelTargetPct: number;
}

export interface OptimizedAllocation {
  sku_id: string;
  week_number: number;
  plant_id: string;
  demand_units: number;
  allocated_units: number;
  unmet_units: number;
  overtime_units: number;
  fabric_consumed_meters: number;
  production_cost: number;
  revenue: number;
  profit: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  demandMultiplier: number; // e.g. 1.25 for +25%
  plantCapacityMultipliers: Record<string, number>; // plant_id -> factor (e.g. 0.6 for -40%)
  fabricLeadTimeDeltaWeeks: number; // e.g. +4
  overtimePremiumMultiplier: number;
  allowExpediteFreight: boolean;
}

export interface ScenarioResult {
  scenarioId: string;
  name: string;
  totalDemandUnits: number;
  totalSuppliedUnits: number;
  unmetDemandUnits: number;
  serviceLevelPct: number; // OTIF
  totalRevenue: number;
  totalCost: number;
  grossMarginPct: number;
  fabricStockoutCount: number;
  plantOverloadWeeks: number;
  revenueAtRisk: number;
}

export interface ExecutiveActionItem {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPPORTUNITY';
  category: 'FABRIC_PROCUREMENT' | 'PLANT_CAPACITY' | 'INVENTORY_REBALANCE' | 'DEMAND_SHAPING';
  title: string;
  description: string;
  affectedEntities: string[]; // SKU IDs, Plant IDs, Fabric Codes
  timeline: string;
  financialImpact: {
    revenueProtected: number;
    costToImplement: number;
    netBenefit: number;
    roiPct: number;
  };
  suggestedAction: string;
  simulatedScenarioPatch?: Partial<ScenarioDefinition>;
}

export interface SOPConsensusWeek {
  week_number: number;
  week_id: string;
  unconstrained_demand_units: number;
  constrained_supply_units: number;
  gap_units: number;
  gross_revenue: number;
  production_cost: number;
  gross_profit: number;
  inventory_eow_units: number;
  plant_utilization_avg_pct: number;
  fabric_shortage_meters: number;
}
