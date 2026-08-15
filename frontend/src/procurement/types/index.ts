export interface FilterOptions {
  materials: { Material_ID: string; Material_Name: string; Category: string }[];
  suppliers: { Supplier_ID: string; Supplier_Name: string; Country: string }[];
  plants: { Plant_ID: string; Plant_Name: string }[];
  seasons: string[];
  risk_classes: string[];
  max_week: number;
}

export interface DashboardData {
  kpis: {
    total_material_requirement: number;
    net_procurement_requirement: number;
    total_procurement_cost_usd: number;
    average_supplier_risk_pct: number;
    high_risk_suppliers_count: number;
    expected_delivery_delay_weeks: number;
    supplier_dependency_pct: number;
    supplier_dependency_risk: string;
    active_suppliers_count: number;
    quality_pass_rate_pct: number;
    on_time_delivery_rate_pct: number;
  };
  demand_trend: {
    Week: number;
    Gross_Material_Requirement: number;
    Current_Inventory: number;
    Net_Procurement_Requirement: number;
  }[];
  plant_distribution: {
    Plant_ID: string;
    Gross_Material_Requirement: number;
    Net_Procurement_Requirement: number;
  }[];
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  allocations: AllocationItem[];
  cost_vs_risk_matrix: CostVsRiskPoint[];
  data_lineage: {
    metric: string;
    formula: string;
    description: string;
  }[];
  data_disclaimer: string;
}

export interface AllocationItem {
  supplier_id: string;
  supplier_name: string;
  country: string;
  material_id: string;
  allocated_quantity: number;
  allocation_percentage: number;
  unit_price: number;
  total_spend: number;
  supplier_capacity: number;
  capacity_utilization_pct: number;
  capacity_pressure_flag: string;
  risk_probability: number;
  risk_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predicted_delay_weeks: number;
}

export interface CostVsRiskPoint {
  supplier_id: string;
  supplier_name: string;
  country: string;
  unit_cost: number;
  risk_probability: number;
  risk_class: string;
  capacity: number;
  allocated_volume: number;
  quadrant: string;
}

export interface DataQualityReport {
  summary: {
    total_raw_records: number;
    total_cleaned_records: number;
    total_missing_values: number;
    total_duplicates: number;
    total_outliers: number;
    total_issues_resolved: number;
    overall_data_quality_score: number;
    status: string;
    disclaimer: string;
  };
  file_metrics: {
    filename: string;
    raw_records: number;
    cleaned_records: number;
    missing_values: number;
    duplicates: number;
    outliers: number;
    invalid_refs: number;
    quality_score: number;
  }[];
  issues_resolved: {
    dataset: string;
    issue_type: string;
    severity: string;
    count: number;
    description: string;
    remediation: string;
  }[];
  pipeline_stages: {
    stage: string;
    records: number;
    status: string;
    desc: string;
  }[];
}

export interface DemandSignalData {
  summary: {
    total_skus_active: number;
    total_materials_required: number;
    total_forecast_production: number;
    total_gross_material_requirement: number;
    total_current_inventory: number;
    total_confirmed_incoming_supply: number;
    total_net_procurement_requirement: number;
    demand_signal_formula: string;
  };
  weekly_trend: any[];
  plant_distribution: any[];
  material_breakdown: any[];
  seasonal_breakdown: any[];
  detailed_records: any[];
}

export interface ProcurementIntelData {
  summary: {
    total_materials_evaluated: number;
    total_net_procurement_volume: number;
    urgent_action_required_count: number;
    capital_risk_exposure_usd: number;
    lead_time_buffer_days: number;
  };
  items: {
    material_id: string;
    material_name: string;
    plant_id: string;
    category: string;
    unit_of_measure: string;
    criticality: string;
    gross_requirement: number;
    current_inventory: number;
    confirmed_supply: number;
    net_requirement: number;
    avg_lead_time_weeks: number;
    required_date: string;
    recommended_order_date: string;
    expected_arrival_date: string;
    delivery_risk_flag: string;
    predicted_delay_weeks: number;
    procurement_status: string;
  }[];
}

export interface SupplierEvalData {
  weights_used: {
    cost_weight: number;
    quality_weight: number;
    delivery_weight: number;
    reliability_weight: number;
    capacity_weight: number;
  };
  total_suppliers: number;
  suppliers: any[];
}

export interface AIRiskData {
  summary: {
    total_suppliers_analyzed: number;
    average_risk_probability: number;
    high_risk_supplier_count: number;
    class_distribution: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
    thresholds: {
      low: number;
      medium: number;
      high: number;
    };
  };
  feature_importances: Record<string, number>;
  supplier_risk_predictions: {
    supplier_id: string;
    supplier_name: string;
    country: string;
    tier: string;
    risk_probability: number;
    risk_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    predicted_delay_weeks: number;
    on_time_rate: number;
    defect_rate: number;
    disruptions_count: number;
    capacity_utilization: number;
    financial_score: number;
    ai_explanation: string;
    reasons_list: string[];
  }[];
}

export interface ScenarioResult {
  scenario_metadata: {
    scenario_type: string;
    demand_change_pct: number;
    disrupted_supplier_id?: string;
    supplier_capacity_reduction_pct: number;
    lead_time_increase_pct: number;
    price_increase_pct: number;
  };
  comparison_kpis: {
    metric: string;
    baseline: number;
    scenario: number;
    delta: number;
    delta_pct?: number;
    unit: string;
    status: 'Positive' | 'Negative' | 'Neutral';
  }[];
  supplier_comparison: {
    supplier_id: string;
    supplier_name: string;
    baseline_qty: number;
    scenario_qty: number;
    qty_change: number;
    baseline_spend: number;
    scenario_spend: number;
    risk_class: string;
  }[];
  baseline_summary: any;
  scenario_summary: any;
  scenario_allocations: AllocationItem[];
}

export interface PurchaseOrdersData {
  summary: {
    total_purchase_orders: number;
    total_order_quantity: number;
    total_procurement_spend_usd: number;
    risk_breakdown: Record<string, number>;
    plant_destination: string;
  };
  purchase_orders: {
    po_id: string;
    supplier_id: string;
    supplier_name: string;
    material_id: string;
    material_name: string;
    plant_id: string;
    quantity: number;
    unit_price: number;
    total_cost: number;
    order_date: string;
    expected_delivery_date: string;
    required_date: string;
    lead_time_weeks: number;
    risk_class: string;
    risk_probability: number;
    delivery_risk_flag: string;
    contract_reference: string;
    status: string;
  }[];
}

export interface FeedbackData {
  summary: {
    mean_absolute_error_weeks: number;
    root_mean_square_error_weeks: number;
    average_lead_time_drift_weeks: number;
    model_prediction_accuracy_pct: number;
    recalibration_status: string;
    feedback_loop_description: string;
  };
  comparisons: any[];
  supplier_performance_shifts: any[];
  accuracy_timeline: any[];
}

export interface ExecutiveReportData {
  metadata: {
    material_id: string;
    material_name: string;
    plant_id: string;
    season: string;
    demand_multiplier: number;
    risk_weight: number;
  };
  kpis: {
    total_requirement_units: number;
    total_procurement_cost_usd: number;
    average_supplier_risk_pct: number;
    expected_delay_weeks: number;
    supplier_dependency_pct: number;
    suppliers_allocated_count: number;
  };
  executive_briefing: {
    problem: string;
    root_cause: string;
    business_impact: string;
    recommended_action: string;
    why_this_decision: string;
    expected_impact: string;
    governance: {
      owner: string;
      priority: string;
      approval_status: string;
      review_cycle: string;
    };
  };
  allocations_table: AllocationItem[];
  cost_vs_risk_matrix: CostVsRiskPoint[];
}
