import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('Generating TrendWear S&OP Platform CSV Datasets in:', DATA_DIR);

// 1. FABRICS (24 Fabric Types)
const fabrics = [
  { code: 'FAB_COT_01', name: '100% Organic Combed Cotton Jersey 180gsm', supplier: 'Vardhman Textiles', country: 'India', leadTime: 6, moq: 3000, cost: 4.80, onHand: 42000, onOrder: 25000, scrap: 0.05 },
  { code: 'FAB_COT_02', name: 'Supima Cotton Pique 220gsm', supplier: 'Alps Cotton Corp', country: 'India', leadTime: 7, moq: 2500, cost: 6.20, onHand: 28000, onOrder: 15000, scrap: 0.04 },
  { code: 'FAB_TER_01', name: 'Heavyweight Loopback French Terry 380gsm', supplier: 'Pacific Textiles', country: 'Vietnam', leadTime: 8, moq: 2000, cost: 7.90, onHand: 35000, onOrder: 20000, scrap: 0.06 },
  { code: 'FAB_FLC_01', name: 'Recycled Poly Thermal Fleece 320gsm', supplier: 'Formosa Taffeta', country: 'Taiwan', leadTime: 9, moq: 3000, cost: 5.40, onHand: 19000, onOrder: 12000, scrap: 0.05 },
  { code: 'FAB_DEN_01', name: 'Indigo Rope-Dyed Stretch Denim 12oz', supplier: 'Iskur Denim', country: 'Turkey', leadTime: 10, moq: 4000, cost: 6.80, onHand: 54000, onOrder: 30000, scrap: 0.07 },
  { code: 'FAB_DEN_02', name: 'Selvedge Heritage Ring Denim 14oz', supplier: 'Bossa Denim', country: 'Turkey', leadTime: 12, moq: 2000, cost: 9.50, onHand: 16000, onOrder: 8000, scrap: 0.08 },
  { code: 'FAB_TNC_01', name: 'Tencel Modal Satin Twill 160gsm', supplier: 'Lenzing Partner Mill', country: 'Indonesia', leadTime: 7, moq: 2500, cost: 7.10, onHand: 22000, onOrder: 18000, scrap: 0.05 },
  { code: 'FAB_LIN_01', name: 'Normandy Washed Pure Linen 200gsm', supplier: 'LinenMill Portugal', country: 'Portugal', leadTime: 11, moq: 1500, cost: 11.20, onHand: 14000, onOrder: 10000, scrap: 0.06 },
  { code: 'FAB_WOL_01', name: 'Extra-Fine 19.5u Merino Wool Knit', supplier: 'Tollegno 1900', country: 'Italy', leadTime: 14, moq: 1000, cost: 18.50, onHand: 9500, onOrder: 6000, scrap: 0.04 },
  { code: 'FAB_SLK_01', name: 'Mulberry Silk Crepe de Chine 16mm', supplier: 'Hangzhou Silk Union', country: 'China', leadTime: 10, moq: 800, cost: 22.00, onHand: 6200, onOrder: 4000, scrap: 0.05 },
  { code: 'FAB_POL_01', name: 'Recycled Aero-Dri Interlock 150gsm', supplier: 'Toray Industries', country: 'Japan', leadTime: 8, moq: 3500, cost: 4.90, onHand: 38000, onOrder: 22000, scrap: 0.04 },
  { code: 'FAB_NYL_01', name: 'Diamond Ripstop Technical Nylon 70D', supplier: 'Hyosung TNC', country: 'South Korea', leadTime: 9, moq: 2500, cost: 6.60, onHand: 21000, onOrder: 15000, scrap: 0.05 },
  { code: 'FAB_VIS_01', name: 'EcoVero Viscose Chiffon 90gsm', supplier: 'Birla Cellulose', country: 'India', leadTime: 7, moq: 2000, cost: 5.10, onHand: 18500, onOrder: 12000, scrap: 0.06 },
  { code: 'FAB_BMB_01', name: 'Organic Bamboo Spandex Knit 210gsm', supplier: 'Bambrotex', country: 'Vietnam', leadTime: 6, moq: 2500, cost: 5.80, onHand: 31000, onOrder: 16000, scrap: 0.05 },
  { code: 'FAB_CORD_01', name: 'Cotton Corduroy 14-Wale Stretch', supplier: 'Calik Cotton', country: 'Turkey', leadTime: 10, moq: 2000, cost: 7.40, onHand: 15000, onOrder: 9000, scrap: 0.06 },
  { code: 'FAB_CHIN_01', name: 'Combed Cotton Stretch Twill 240gsm', supplier: 'Ha-Meem Textiles', country: 'Bangladesh', leadTime: 7, moq: 4000, cost: 4.50, onHand: 48000, onOrder: 28000, scrap: 0.05 },
  { code: 'FAB_KNT_01', name: 'Cotton-Cashmere Blended Yarn 2/28', supplier: 'Consinee Group', country: 'China', leadTime: 12, moq: 1200, cost: 16.80, onHand: 8500, onOrder: 5000, scrap: 0.04 },
  { code: 'FAB_POPL_01', name: 'Egyptian Giza Poplin 120/2 Thread', supplier: 'Nile Textiles', country: 'Egypt', leadTime: 9, moq: 2000, cost: 8.90, onHand: 17500, onOrder: 11000, scrap: 0.05 },
  { code: 'FAB_SOFT_01', name: 'Modal Micro-Rib 190gsm', supplier: 'Grasim Industries', country: 'India', leadTime: 6, moq: 2500, cost: 5.60, onHand: 29000, onOrder: 18000, scrap: 0.05 },
  { code: 'FAB_CANV_01', name: 'Heavy Cotton Canvas Duck 10oz', supplier: 'Mount Vernon Mills', country: 'USA/Mexico', leadTime: 5, moq: 3000, cost: 5.90, onHand: 24000, onOrder: 14000, scrap: 0.06 },
  { code: 'FAB_SHER_01', name: 'Recycled Sherpa Fleece 360gsm', supplier: 'Eclat Textile', country: 'Taiwan', leadTime: 10, moq: 1800, cost: 8.40, onHand: 13000, onOrder: 7500, scrap: 0.06 },
  { code: 'FAB_SATN_01', name: 'High-Luster Recycled Poly Satin', supplier: 'Shenzhou Intl', country: 'Vietnam', leadTime: 7, moq: 3000, cost: 4.70, onHand: 26000, onOrder: 14000, scrap: 0.05 },
  { code: 'FAB_JACQ_01', name: 'Engineered Jacquard Knit 280gsm', supplier: 'Eurojersey', country: 'Italy', leadTime: 12, moq: 1500, cost: 14.50, onHand: 11000, onOrder: 7000, scrap: 0.05 },
  { code: 'FAB_WPR_01', name: '3-Layer Breathable Waterproof Membrane', supplier: 'Gore Tech Partner', country: 'Germany', leadTime: 14, moq: 1000, cost: 24.50, onHand: 7800, onOrder: 4500, scrap: 0.05 }
];

let fabricCsv = 'fabric_code,fabric_name,supplier_name,supplier_country,supplier_lead_time_weeks,moq_meters,cost_per_meter,current_on_hand_meters,on_order_meters,reorder_point_meters,unit_meters_per_garment,scrap_rate_pct\n';
fabrics.forEach(f => {
  const avgMetersPerGarment = (1.2 + (Math.random() * 0.9)).toFixed(2);
  const reorderPoint = Math.round(f.onHand * 0.45);
  fabricCsv += `${f.code},"${f.name}","${f.supplier}","${f.country}",${f.leadTime},${f.moq},${f.cost.toFixed(2)},${f.onHand},${f.onOrder},${reorderPoint},${avgMetersPerGarment},${(f.scrap * 100).toFixed(1)}\n`;
});
fs.writeFileSync(path.join(DATA_DIR, 'fabric_requirement.csv'), fabricCsv);
console.log('Saved fabric_requirement.csv');

// 2. PLANTS (12 Global Plants)
const plants = [
  { id: 'PLANT_VN_01', name: 'Hanoi Mega Plant', country: 'Vietnam', region: 'Southeast Asia', sewHrs: 45000, cutHrs: 22000, finishHrs: 18000, maxOt: 25, laborRate: 3.80, efficiency: 92 },
  { id: 'PLANT_VN_02', name: 'Ho Chi Minh Performance Hub', country: 'Vietnam', region: 'Southeast Asia', sewHrs: 38000, cutHrs: 19000, finishHrs: 15000, maxOt: 20, laborRate: 4.10, efficiency: 94 },
  { id: 'PLANT_BD_01', name: 'Dhaka Central Facility', country: 'Bangladesh', region: 'South Asia', sewHrs: 55000, cutHrs: 28000, finishHrs: 22000, maxOt: 30, laborRate: 2.40, efficiency: 86 },
  { id: 'PLANT_BD_02', name: 'Chittagong Export Works', country: 'Bangladesh', region: 'South Asia', sewHrs: 48000, cutHrs: 24000, finishHrs: 19000, maxOt: 25, laborRate: 2.30, efficiency: 87 },
  { id: 'PLANT_IN_01', name: 'Tirupur Eco-Knit Mill', country: 'India', region: 'South Asia', sewHrs: 40000, cutHrs: 20000, finishHrs: 16000, maxOt: 20, laborRate: 2.90, efficiency: 90 },
  { id: 'PLANT_IN_02', name: 'Surat Synthetics Center', country: 'India', region: 'South Asia', sewHrs: 32000, cutHrs: 16000, finishHrs: 13000, maxOt: 20, laborRate: 3.10, efficiency: 89 },
  { id: 'PLANT_MX_01', name: 'Puebla Nearshore Express', country: 'Mexico', region: 'Americas', sewHrs: 26000, cutHrs: 14000, finishHrs: 11000, maxOt: 30, laborRate: 6.50, efficiency: 95 },
  { id: 'PLANT_TR_01', name: 'Izmir Denim & Tailoring', country: 'Turkey', region: 'EMEA', sewHrs: 28000, cutHrs: 15000, finishHrs: 12000, maxOt: 25, laborRate: 5.80, efficiency: 93 },
  { id: 'PLANT_PT_01', name: 'Porto Luxury Atelier', country: 'Portugal', region: 'EMEA', sewHrs: 16000, cutHrs: 9000, finishHrs: 8000, maxOt: 15, laborRate: 11.20, efficiency: 97 },
  { id: 'PLANT_ID_01', name: 'Bandung Wovens Complex', country: 'Indonesia', region: 'Southeast Asia', sewHrs: 34000, cutHrs: 17000, finishHrs: 14000, maxOt: 20, laborRate: 3.20, efficiency: 88 },
  { id: 'PLANT_KH_01', name: 'Phnom Penh Apparel Ltd', country: 'Cambodia', region: 'Southeast Asia', sewHrs: 30000, cutHrs: 15000, finishHrs: 12000, maxOt: 20, laborRate: 2.70, efficiency: 85 },
  { id: 'PLANT_LK_01', name: 'Colombo High-Flex Mill', country: 'Sri Lanka', region: 'South Asia', sewHrs: 24000, cutHrs: 12000, finishHrs: 10000, maxOt: 20, laborRate: 3.50, efficiency: 93 }
];

let plantCsv = 'plant_id,plant_name,country,region,weekly_cut_hours,weekly_sew_hours,weekly_finish_hours,max_overtime_pct,hourly_labor_rate,labor_efficiency_pct\n';
plants.forEach(p => {
  plantCsv += `${p.id},"${p.name}","${p.country}","${p.region}",${p.cutHrs},${p.sewHrs},${p.finishHrs},${p.maxOt},${p.laborRate.toFixed(2)},${p.efficiency}\n`;
});
fs.writeFileSync(path.join(DATA_DIR, 'plant_capacity.csv'), plantCsv);
console.log('Saved plant_capacity.csv');

// 3. CATEGORIES & SEASONALITY (18 Categories, 52-week curves)
const categories = [
  { name: 'Tops & Tees', code: 'TOP', baseDemand: 1200, peakWeeks: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27], basePrice: 28, fabricCode: 'FAB_COT_01' },
  { name: 'Polos & Henleys', code: 'POL', baseDemand: 850, peakWeeks: [18, 19, 20, 21, 22, 23, 24, 25, 26], basePrice: 42, fabricCode: 'FAB_COT_02' },
  { name: 'Hoodies & Sweatshirts', code: 'HDY', baseDemand: 950, peakWeeks: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3], basePrice: 65, fabricCode: 'FAB_TER_01' },
  { name: 'Jackets & Windbreakers', code: 'JKT', baseDemand: 600, peakWeeks: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], basePrice: 110, fabricCode: 'FAB_NYL_01' },
  { name: 'Down & Winter Parkas', code: 'PRK', baseDemand: 450, peakWeeks: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2], basePrice: 185, fabricCode: 'FAB_WPR_01' },
  { name: 'Denim Jeans (Slim/Straight)', code: 'DNM', baseDemand: 1100, peakWeeks: [32, 33, 34, 35, 44, 45, 46, 47, 48, 49, 50], basePrice: 78, fabricCode: 'FAB_DEN_01' },
  { name: 'Chinos & Casual Trousers', code: 'CHN', baseDemand: 750, peakWeeks: [12, 13, 14, 15, 33, 34, 35, 36], basePrice: 62, fabricCode: 'FAB_CHIN_01' },
  { name: 'Shorts & Swimwear', code: 'SHT', baseDemand: 800, peakWeeks: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], basePrice: 38, fabricCode: 'FAB_POL_01' },
  { name: 'Dresses & Sundresses', code: 'DRS', baseDemand: 550, peakWeeks: [17, 18, 19, 20, 21, 22, 23, 24, 25], basePrice: 85, fabricCode: 'FAB_VIS_01' },
  { name: 'Linen Shirts & Pants', code: 'LIN', baseDemand: 400, peakWeeks: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28], basePrice: 72, fabricCode: 'FAB_LIN_01' },
  { name: 'Merino Sweaters & Cardigans', code: 'SWT', baseDemand: 500, peakWeeks: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], basePrice: 120, fabricCode: 'FAB_WOL_01' },
  { name: 'Activewear Leggings & Tights', code: 'LGG', baseDemand: 900, peakWeeks: [1, 2, 3, 4, 5, 35, 36, 37, 47, 48], basePrice: 54, fabricCode: 'FAB_POL_01' },
  { name: 'Performance Sports Bras', code: 'BRA', baseDemand: 700, peakWeeks: [1, 2, 3, 4, 5, 18, 19, 20, 35, 36], basePrice: 36, fabricCode: 'FAB_POL_01' },
  { name: 'Loungewear & Joggers', code: 'JOG', baseDemand: 850, peakWeeks: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2], basePrice: 58, fabricCode: 'FAB_SOFT_01' },
  { name: 'Fleece Pullovers & Zips', code: 'FLC', baseDemand: 650, peakWeeks: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51], basePrice: 75, fabricCode: 'FAB_FLC_01' },
  { name: 'Silk & Satin Blouses', code: 'BLS', baseDemand: 320, peakWeeks: [18, 19, 20, 46, 47, 48, 49, 50, 51, 52], basePrice: 135, fabricCode: 'FAB_SLK_01' },
  { name: 'Corduroy Overshirts', code: 'CRD', baseDemand: 380, peakWeeks: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48], basePrice: 82, fabricCode: 'FAB_CORD_01' },
  { name: 'Cashmere Blend Knits', code: 'CSH', baseDemand: 280, peakWeeks: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1], basePrice: 195, fabricCode: 'FAB_KNT_01' }
];

let seasonalityCsv = 'category,' + Array.from({ length: 52 }, (_, i) => `week_${i + 1}`).join(',') + '\n';
const categorySeasonalityMap = {};

categories.forEach(c => {
  const weeklyMultipliers = [];
  for (let w = 1; w <= 52; w++) {
    let mult = 1.0;
    if (c.peakWeeks.includes(w)) {
      // Peak season lift (1.4 to 2.2x)
      mult = 1.45 + 0.55 * Math.sin(((w - c.peakWeeks[0]) / c.peakWeeks.length) * Math.PI);
    } else {
      // Off-peak valley (0.65 to 0.9x)
      mult = 0.72 + 0.18 * Math.cos((w / 52) * 2 * Math.PI);
    }
    // Holiday surge (Black Friday / Cyber Week 47-51)
    if (w >= 47 && w <= 51) {
      mult = Math.max(mult, 1.6 + (w === 48 ? 0.6 : 0.3));
    }
    weeklyMultipliers.push(parseFloat(mult.toFixed(3)));
  }
  categorySeasonalityMap[c.name] = weeklyMultipliers;
  seasonalityCsv += `"${c.name}",${weeklyMultipliers.join(',')}\n`;
});
fs.writeFileSync(path.join(DATA_DIR, 'seasonality.csv'), seasonalityCsv);
console.log('Saved seasonality.csv');

// 4. SELL-THROUGH BENCHMARKS
let sellThroughCsv = 'category,channel,full_price_sell_through_pct,first_markdown_sell_through_pct,final_clearance_pct,return_rate_pct,avg_days_to_sell\n';
const channels = ['E-Commerce Direct', 'Flagship Retail Stores', 'Wholesale Department', 'Outlet Stores'];
categories.forEach(c => {
  channels.forEach(ch => {
    let fp = 65 + Math.random() * 15;
    let md1 = 20 + Math.random() * 10;
    let clr = 100 - fp - md1;
    let ret = ch === 'E-Commerce Direct' ? (22 + Math.random() * 8) : (8 + Math.random() * 6);
    let days = Math.round(45 + Math.random() * 40);
    sellThroughCsv += `"${c.name}","${ch}",${fp.toFixed(1)},${md1.toFixed(1)},${clr.toFixed(1)},${ret.toFixed(1)},${days}\n`;
  });
});
fs.writeFileSync(path.join(DATA_DIR, 'sell_through.csv'), sellThroughCsv);
console.log('Saved sell_through.csv');

// 5. PRODUCT MASTER (1,050 SKUs)
const skus = [];
let productMasterCsv = 'sku_id,style_name,category,subcategory,fabric_code,primary_plant_id,secondary_plant_id,sewing_minutes,cut_minutes,unit_cost,wholesale_price,msrp,target_margin_pct,lead_time_weeks,moq_units,safety_stock_days\n';

const colors = ['Black', 'Navy', 'Heather Grey', 'Optical White', 'Olive Green', 'Burgundy', 'Camel Tan', 'Sage Blue', 'Dusty Rose', 'Charcoal', 'Ecru', 'Forest Pine'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let skuCounter = 1;
const TOTAL_SKUS = 1080;

while (skuCounter <= TOTAL_SKUS) {
  const cat = categories[(skuCounter - 1) % categories.length];
  const color = colors[skuCounter % colors.length];
  const size = sizes[skuCounter % sizes.length];
  const skuId = `TW-${cat.code}-${String(skuCounter).padStart(4, '0')}`;
  const styleName = `${cat.name} ${color} ${size}`;
  const subcat = `${cat.name} Core`;
  
  // Fabric affinity
  const fab = fabrics.find(f => f.code === cat.fabricCode) || fabrics[0];
  
  // Plant affinities
  let primPlant, secPlant;
  if (cat.code === 'TOP' || cat.code === 'POL') {
    primPlant = 'PLANT_IN_01';
    secPlant = 'PLANT_VN_01';
  } else if (cat.code === 'DNM' || cat.code === 'CRD') {
    primPlant = 'PLANT_TR_01';
    secPlant = 'PLANT_BD_02';
  } else if (cat.code === 'JKT' || cat.code === 'PRK') {
    primPlant = 'PLANT_VN_02';
    secPlant = 'PLANT_MX_01';
  } else if (cat.code === 'SWT' || cat.code === 'CSH') {
    primPlant = 'PLANT_PT_01';
    secPlant = 'PLANT_IN_02';
  } else if (cat.code === 'LGG' || cat.code === 'BRA' || cat.code === 'SHT') {
    primPlant = 'PLANT_LK_01';
    secPlant = 'PLANT_VN_02';
  } else {
    primPlant = 'PLANT_BD_01';
    secPlant = 'PLANT_ID_01';
  }
  
  const msrp = cat.basePrice;
  const wholesalePrice = parseFloat((msrp * 0.52).toFixed(2));
  const unitCost = parseFloat((wholesalePrice * 0.42 + (Math.random() * 4)).toFixed(2));
  const marginPct = parseFloat((((msrp - unitCost) / msrp) * 100).toFixed(1));
  
  const sewMins = Math.round(8 + (unitCost * 1.1) + (Math.random() * 4));
  const cutMins = Math.round(3 + (sewMins * 0.25));
  const leadTimeWks = fab.leadTime + 4; // Fabric lead time + 4 wks manufacturing/freight
  const moq = Math.round((500 + Math.random() * 1000) / 100) * 100;
  const safetyDays = Math.round(21 + Math.random() * 21);
  
  skus.push({
    skuId,
    styleName,
    category: cat.name,
    subcat,
    fabricCode: fab.code,
    primPlant,
    secPlant,
    sewMins,
    cutMins,
    unitCost,
    wholesalePrice,
    msrp,
    marginPct,
    leadTimeWks,
    moq,
    safetyDays,
    catIndex: (skuCounter - 1) % categories.length
  });
  
  productMasterCsv += `${skuId},"${styleName}","${cat.name}","${subcat}",${fab.code},${primPlant},${secPlant},${sewMins},${cutMins},${unitCost},${wholesalePrice},${msrp},${marginPct},${leadTimeWks},${moq},${safetyDays}\n`;
  skuCounter++;
}

fs.writeFileSync(path.join(DATA_DIR, 'product_master.csv'), productMasterCsv);
console.log(`Saved product_master.csv (${skus.length} SKUs)`);

// 6. HISTORICAL DEMAND (260 Weeks: 2021-01 to 2025-52)
// Adapted from M5 Retail Demand series dynamics with retail stockout truncation, promo lifts, and seasonality
console.log('Generating 260-week historical demand series...');

// We create 260 weeks for all SKUs. To optimize file size for runtime browser loading while preserving 260 weeks and 1,080 SKUs:
// We produce a rich 260-week history for a primary focus cohort of 120 curated SKUs across all categories (120 * 260 = 31,200 detailed rows)
// and aggregate/sampled representations, OR full 260 weeks for all SKUs formatted concisely!
// Let's write the complete historical demand CSV!
let demandCsv = 'sku_id,week_id,year,week_number,sales_units,price,is_promo,is_stockout,inventory_eow\n';

// Let's generate 260 weeks (5 years: 2021 to 2025)
const WEEKS_COUNT = 260;
let totalDemandRows = 0;

// Curate detailed demand histories for the complete portfolio
skus.forEach((sku, sIdx) => {
  const cat = categories[sku.catIndex];
  const seasonCurve = categorySeasonalityMap[cat.name];
  
  // SKU demand volume tier (Tier 1: High volume runners, Tier 2: Mid volume, Tier 3: Slow / Intermittent)
  const tier = sIdx % 10 < 3 ? 1.8 : (sIdx % 10 < 7 ? 1.0 : 0.4);
  const baseUnits = Math.max(15, Math.round((cat.baseDemand / 18) * tier * (0.8 + Math.random() * 0.4)));
  
  let currentInventory = baseUnits * 6;
  
  for (let w = 1; w <= WEEKS_COUNT; w++) {
    const year = 2021 + Math.floor((w - 1) / 52);
    const weekNum = ((w - 1) % 52) + 1;
    const weekId = `${year}W${String(weekNum).padStart(2, '0')}`;
    
    const seasonMult = seasonCurve[weekNum - 1];
    const yearlyTrend = 1.0 + ((year - 2021) * 0.06); // 6% YoY TrendWear growth
    
    // Promotions (10% chance)
    const isPromo = (weekNum === 48 || weekNum === 49 || weekNum === 20 || (Math.random() < 0.08)) ? 1 : 0;
    const promoLift = isPromo ? (1.35 + Math.random() * 0.3) : 1.0;
    const price = isPromo ? parseFloat((sku.msrp * 0.8).toFixed(2)) : sku.msrp;
    
    // True unconstrained latent demand
    const noise = 0.85 + Math.random() * 0.3;
    let trueDemand = Math.round(baseUnits * seasonMult * yearlyTrend * promoLift * noise);
    
    // For intermittent items (Tier 3)
    if (tier < 0.5 && Math.random() < 0.45) {
      trueDemand = 0;
    }
    
    // Periodic replenishment arrivals (every 4-6 weeks)
    if (w % 5 === 0) {
      currentInventory += baseUnits * 5;
    }
    
    // Check stockout constraint
    let isStockout = 0;
    let salesUnits = trueDemand;
    
    if (currentInventory < trueDemand) {
      salesUnits = Math.max(0, currentInventory);
      isStockout = 1;
      currentInventory = 0;
    } else {
      currentInventory -= salesUnits;
    }
    
    // Write row
    demandCsv += `${sku.skuId},${weekId},${year},${weekNum},${salesUnits},${price},${isPromo},${isStockout},${currentInventory}\n`;
    totalDemandRows++;
  }
});

fs.writeFileSync(path.join(DATA_DIR, 'historical_demand.csv'), demandCsv);
console.log(`Saved historical_demand.csv (${totalDemandRows} records across 260 weeks)`);
console.log('Dataset generation completed successfully!');
