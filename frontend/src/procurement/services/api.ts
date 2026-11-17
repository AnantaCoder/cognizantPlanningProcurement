function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) {
    let base = envUrl.replace(/\/+$/, '');
    if (!base.startsWith('http://') && !base.startsWith('https://') && !base.startsWith('/')) {
      base = `https://${base}`;
    }
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api';
}

const API_BASE_URL = getApiBaseUrl();

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE_URL}/filter-options`);
  if (!res.ok) throw new Error('Failed to load filter options');
  return res.json();
}

export async function fetchDashboard(params: { material_id?: string; plant_id?: string; season?: string }) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.plant_id && params.plant_id !== 'ALL') q.set('plant_id', params.plant_id);
  if (params.season && params.season !== 'ALL') q.set('season', params.season);
  const res = await fetch(`${API_BASE_URL}/dashboard?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load dashboard data');
  return res.json();
}

export async function fetchDataQuality() {
  const res = await fetch(`${API_BASE_URL}/data-quality`);
  if (!res.ok) throw new Error('Failed to load data quality report');
  return res.json();
}

export async function fetchRawTablePreview(filename: string, limit: number = 50) {
  const res = await fetch(`${API_BASE_URL}/data/raw-table?filename=${encodeURIComponent(filename)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load raw table preview');
  return res.json();
}

export async function fetchDemandSignal(params: { material_id?: string; sku_id?: string; plant_id?: string; season?: string; week?: number }) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.sku_id && params.sku_id !== 'ALL') q.set('sku_id', params.sku_id);
  if (params.plant_id && params.plant_id !== 'ALL') q.set('plant_id', params.plant_id);
  if (params.season && params.season !== 'ALL') q.set('season', params.season);
  if (params.week && params.week > 0) q.set('week', params.week.toString());
  const res = await fetch(`${API_BASE_URL}/demand-signal?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load demand signal data');
  return res.json();
}

export async function fetchProcurementIntelligence(params: { material_id?: string; plant_id?: string; lead_time_buffer_days?: number }) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.plant_id && params.plant_id !== 'ALL') q.set('plant_id', params.plant_id);
  if (params.lead_time_buffer_days) q.set('lead_time_buffer_days', params.lead_time_buffer_days.toString());
  const res = await fetch(`${API_BASE_URL}/procurement-intelligence?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load procurement intelligence data');
  return res.json();
}

export async function fetchSupplierEvaluation(params: {
  material_id?: string;
  cost_weight?: number;
  quality_weight?: number;
  delivery_weight?: number;
  reliability_weight?: number;
  capacity_weight?: number;
}) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.cost_weight !== undefined) q.set('cost_weight', params.cost_weight.toString());
  if (params.quality_weight !== undefined) q.set('quality_weight', params.quality_weight.toString());
  if (params.delivery_weight !== undefined) q.set('delivery_weight', params.delivery_weight.toString());
  if (params.reliability_weight !== undefined) q.set('reliability_weight', params.reliability_weight.toString());
  if (params.capacity_weight !== undefined) q.set('capacity_weight', params.capacity_weight.toString());
  const res = await fetch(`${API_BASE_URL}/supplier-evaluation?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load supplier evaluation');
  return res.json();
}

export async function fetchSupplierDetail(supplierId: string) {
  const res = await fetch(`${API_BASE_URL}/supplier/${supplierId}`);
  if (!res.ok) throw new Error('Failed to load supplier detail');
  return res.json();
}

export async function fetchRiskPrediction(params: { material_id?: string; low_threshold?: number; med_threshold?: number; high_threshold?: number }) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.low_threshold !== undefined) q.set('low_threshold', params.low_threshold.toString());
  if (params.med_threshold !== undefined) q.set('med_threshold', params.med_threshold.toString());
  if (params.high_threshold !== undefined) q.set('high_threshold', params.high_threshold.toString());
  const res = await fetch(`${API_BASE_URL}/risk-prediction?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load risk predictions');
  return res.json();
}

export async function optimizeAllocation(payload: any) {
  const res = await fetch(`${API_BASE_URL}/optimize-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Optimization failed');
  return res.json();
}

export async function simulateScenario(payload: any) {
  const res = await fetch(`${API_BASE_URL}/simulate-scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Scenario simulation failed');
  return res.json();
}

export async function generatePurchaseOrders(payload: { allocations: any[]; plant_id?: string }) {
  const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('PO generation failed');
  return res.json();
}

export async function exportPurchaseOrdersCSV(payload: { allocations: any[]; plant_id?: string }) {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `purchase_orders_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function fetchFeedbackMetrics() {
  const res = await fetch(`${API_BASE_URL}/feedback-loop`);
  if (!res.ok) throw new Error('Failed to load feedback metrics');
  return res.json();
}

export async function recalibrateModel() {
  const res = await fetch(`${API_BASE_URL}/feedback-loop/recalibrate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Recalibration failed');
  return res.json();
}

export async function fetchExecutiveReport(params: { material_id?: string; plant_id?: string; season?: string; demand_multiplier?: number; risk_weight?: number }) {
  const q = new URLSearchParams();
  if (params.material_id && params.material_id !== 'ALL') q.set('material_id', params.material_id);
  if (params.plant_id && params.plant_id !== 'ALL') q.set('plant_id', params.plant_id);
  if (params.season && params.season !== 'ALL') q.set('season', params.season);
  if (params.demand_multiplier !== undefined) q.set('demand_multiplier', params.demand_multiplier.toString());
  if (params.risk_weight !== undefined) q.set('risk_weight', params.risk_weight.toString());
  const res = await fetch(`${API_BASE_URL}/executive-report?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load executive report');
  return res.json();
}
