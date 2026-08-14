import Papa from 'papaparse';
import type {
  HistoricalDemandRow,
  ProductMasterRow,
  PlantCapacityRow,
  FabricRequirementRow,
  SellThroughRow,
  SeasonalityRow,
  DatasetSummary
} from './types';

export interface LoadedDataState {
  historicalDemand: HistoricalDemandRow[];
  productMaster: ProductMasterRow[];
  plantCapacity: PlantCapacityRow[];
  fabricRequirement: FabricRequirementRow[];
  sellThrough: SellThroughRow[];
  seasonality: SeasonalityRow[];
  summary: DatasetSummary;
  skuMap: Map<string, ProductMasterRow>;
  plantMap: Map<string, PlantCapacityRow>;
  fabricMap: Map<string, FabricRequirementRow>;
  demandBySku: Map<string, HistoricalDemandRow[]>;
  categorySeasonalityMap: Map<string, number[]>;
}

export async function parseCsvFile<T>(urlOrContent: string, isRawString = false): Promise<T[]> {
  if (!isRawString) {
    const response = await fetch(urlOrContent);
    const text = await response.text();
    return new Promise((resolve, reject) => {
      Papa.parse<T>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0 && results.data.length === 0) {
            reject(new Error(results.errors[0].message));
          } else {
            resolve(results.data as T[]);
          }
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  }

  return new Promise((resolve, reject) => {
    Papa.parse<T>(urlOrContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
        } else {
          resolve(results.data as T[]);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export async function loadAllSOPDatasets(
  onProgress?: (step: string, pct: number) => void
): Promise<LoadedDataState> {
  onProgress?.('Loading Product Master...', 15);
  const rawProducts = await parseCsvFile<any>('/data/product_master.csv');
  const productMaster: ProductMasterRow[] = rawProducts.map(r => ({
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

  onProgress?.('Loading Plant Capacity...', 30);
  const rawPlants = await parseCsvFile<any>('/data/plant_capacity.csv');
  const plantCapacity: PlantCapacityRow[] = rawPlants.map(r => ({
    plant_id: String(r.plant_id),
    plant_name: String(r.plant_name),
    country: String(r.country),
    region: String(r.region),
    weekly_cut_hours: Number(r.weekly_cut_hours),
    weekly_sew_hours: Number(r.weekly_sew_hours),
    weekly_finish_hours: Number(r.weekly_finish_hours),
    max_overtime_pct: Number(r.max_overtime_pct),
    hourly_labor_rate: Number(r.hourly_labor_rate),
    labor_efficiency_pct: Number(r.labor_efficiency_pct)
  }));

  onProgress?.('Loading Fabric BOM Requirements...', 45);
  const rawFabrics = await parseCsvFile<any>('/data/fabric_requirement.csv');
  const fabricRequirement: FabricRequirementRow[] = rawFabrics.map(r => ({
    fabric_code: String(r.fabric_code),
    fabric_name: String(r.fabric_name),
    supplier_name: String(r.supplier_name),
    supplier_country: String(r.supplier_country),
    supplier_lead_time_weeks: Number(r.supplier_lead_time_weeks),
    moq_meters: Number(r.moq_meters),
    cost_per_meter: Number(r.cost_per_meter),
    current_on_hand_meters: Number(r.current_on_hand_meters),
    on_order_meters: Number(r.on_order_meters),
    reorder_point_meters: Number(r.reorder_point_meters),
    unit_meters_per_garment: Number(r.unit_meters_per_garment || 1.5),
    scrap_rate_pct: Number(r.scrap_rate_pct || 5)
  }));

  onProgress?.('Loading Sell-Through Benchmarks...', 60);
  const rawSellThrough = await parseCsvFile<any>('/data/sell_through.csv');
  const sellThrough: SellThroughRow[] = rawSellThrough.map(r => ({
    category: String(r.category),
    channel: String(r.channel),
    full_price_sell_through_pct: Number(r.full_price_sell_through_pct),
    first_markdown_sell_through_pct: Number(r.first_markdown_sell_through_pct),
    final_clearance_pct: Number(r.final_clearance_pct),
    return_rate_pct: Number(r.return_rate_pct),
    avg_days_to_sell: Number(r.avg_days_to_sell)
  }));

  onProgress?.('Loading Seasonality Profiles...', 75);
  const rawSeasonality = await parseCsvFile<any>('/data/seasonality.csv');
  const seasonality: SeasonalityRow[] = rawSeasonality.map(r => {
    const multipliers: number[] = [];
    for (let w = 1; w <= 52; w++) {
      multipliers.push(Number(r[`week_${w}`] || 1.0));
    }
    return {
      category: String(r.category),
      multipliers
    };
  });

  onProgress?.('Loading 5-Year M5-Derived Historical Demand (280,000+ records)...', 85);
  const rawDemand = await parseCsvFile<any>('/data/historical_demand.csv');
  const historicalDemand: HistoricalDemandRow[] = rawDemand.map(r => ({
    sku_id: String(r.sku_id),
    week_id: String(r.week_id),
    year: Number(r.year),
    week_number: Number(r.week_number),
    sales_units: Number(r.sales_units || 0),
    price: Number(r.price || 0),
    is_promo: Number(r.is_promo || 0),
    is_stockout: Number(r.is_stockout || 0),
    inventory_eow: Number(r.inventory_eow || 0)
  }));

  onProgress?.('Building S&OP In-Memory Indexes & Validating...', 95);

  // Build high-speed maps
  const skuMap = new Map<string, ProductMasterRow>();
  productMaster.forEach(p => skuMap.set(p.sku_id, p));

  const plantMap = new Map<string, PlantCapacityRow>();
  plantCapacity.forEach(p => plantMap.set(p.plant_id, p));

  const fabricMap = new Map<string, FabricRequirementRow>();
  fabricRequirement.forEach(f => fabricMap.set(f.fabric_code, f));

  const categorySeasonalityMap = new Map<string, number[]>();
  seasonality.forEach(s => categorySeasonalityMap.set(s.category, s.multipliers));

  const demandBySku = new Map<string, HistoricalDemandRow[]>();
  let totalUnits = 0;
  let totalRev = 0;
  let stockouts = 0;
  const uniqueWeeks = new Set<string>();

  historicalDemand.forEach(row => {
    if (!demandBySku.has(row.sku_id)) {
      demandBySku.set(row.sku_id, []);
    }
    demandBySku.get(row.sku_id)!.push(row);
    totalUnits += row.sales_units;
    totalRev += row.sales_units * row.price;
    if (row.is_stockout) stockouts++;
    uniqueWeeks.add(row.week_id);
  });

  const categoriesSet = new Set(productMaster.map(p => p.category));

  const summary: DatasetSummary = {
    totalRecords: historicalDemand.length,
    totalSkus: productMaster.length,
    totalWeeks: uniqueWeeks.size,
    totalPlants: plantCapacity.length,
    totalFabrics: fabricRequirement.length,
    totalCategories: categoriesSet.size,
    totalHistoricalUnits: totalUnits,
    totalHistoricalRevenue: totalRev,
    stockoutIncidents: stockouts,
    stockoutRatePct: parseFloat(((stockouts / Math.max(1, historicalDemand.length)) * 100).toFixed(2)),
    loadedAt: new Date()
  };

  onProgress?.('Dataset Ready!', 100);

  return {
    historicalDemand,
    productMaster,
    plantCapacity,
    fabricRequirement,
    sellThrough,
    seasonality,
    summary,
    skuMap,
    plantMap,
    fabricMap,
    demandBySku,
    categorySeasonalityMap
  };
}
