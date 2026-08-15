import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class ScenarioSimulationEngine:
    def __init__(self, optimizer_engine):
        self.optimizer_engine = optimizer_engine

    def run_scenario(self,
                     scenario_type: str = "custom",
                     demand_change_pct: float = 0.0,
                     disrupted_supplier_id: Optional[str] = None,
                     supplier_capacity_reduction_pct: float = 0.0,
                     lead_time_increase_pct: float = 0.0,
                     material_price_increase_pct: float = 0.0,
                     risk_weight: float = 0.40,
                     max_supplier_dependency_pct: float = 60.0,
                     material_id: Optional[str] = None) -> Dict[str, Any]:
        """Simulates Baseline vs Scenario with full PuLP re-optimization and delta metrics."""
        
        # 1. Run Baseline (Normal)
        baseline_res = self.optimizer_engine.optimize_allocation(
            material_id=material_id,
            demand_multiplier=1.0,
            risk_weight=risk_weight,
            max_supplier_dependency_pct=max_supplier_dependency_pct
        )

        # 2. Configure Scenario parameters
        demand_mult = 1.0 + (demand_change_pct / 100.0)
        
        # Presets
        disrupted_sups = []
        cap_overrides = {}

        if scenario_type == "supplier_disruption" or disrupted_supplier_id:
            target_sup = disrupted_supplier_id or "SUP-004"
            red_pct = supplier_capacity_reduction_pct if supplier_capacity_reduction_pct > 0 else 50.0
            if red_pct >= 100.0:
                disrupted_sups.append(target_sup)
            else:
                cap_overrides[target_sup] = max(0.0, 1.0 - (red_pct / 100.0))
        
        elif scenario_type == "demand_spike_20":
            demand_mult = 1.20
        elif scenario_type == "demand_spike_30":
            demand_mult = 1.30

        # Apply manual capacity reduction if passed
        if disrupted_supplier_id and disrupted_supplier_id not in disrupted_sups:
            red_pct = supplier_capacity_reduction_pct if supplier_capacity_reduction_pct > 0 else 50.0
            cap_overrides[disrupted_supplier_id] = max(0.0, 1.0 - (red_pct / 100.0))

        # 3. Run Scenario Optimization
        scenario_res = self.optimizer_engine.optimize_allocation(
            material_id=material_id,
            demand_multiplier=demand_mult,
            risk_weight=risk_weight,
            max_supplier_dependency_pct=max_supplier_dependency_pct,
            supplier_capacity_overrides=cap_overrides,
            disrupted_suppliers=disrupted_sups
        )

        # 4. Calculate Side-by-Side Deltas
        base_sum = baseline_res["summary"]
        scen_sum = scenario_res["summary"]

        cost_diff = round(scen_sum["total_procurement_cost_usd"] - base_sum["total_procurement_cost_usd"], 2)
        cost_diff_pct = round((cost_diff / max(1.0, base_sum["total_procurement_cost_usd"])) * 100.0, 1)

        risk_diff = round(scen_sum["average_weighted_risk"] - base_sum["average_weighted_risk"], 1)
        delay_diff = round(scen_sum["expected_delivery_delay_weeks"] - base_sum["expected_delivery_delay_weeks"], 2)
        vol_diff = round(scen_sum["total_allocated_quantity"] - base_sum["total_allocated_quantity"], 2)

        comparison_kpis = [
            {
                "metric": "Procurement Volume",
                "baseline": base_sum["total_allocated_quantity"],
                "scenario": scen_sum["total_allocated_quantity"],
                "delta": vol_diff,
                "unit": "Units",
                "status": "Neutral"
            },
            {
                "metric": "Total Procurement Cost",
                "baseline": base_sum["total_procurement_cost_usd"],
                "scenario": scen_sum["total_procurement_cost_usd"],
                "delta": cost_diff,
                "delta_pct": cost_diff_pct,
                "unit": "USD",
                "status": "Negative" if cost_diff > 0 else "Positive"
            },
            {
                "metric": "Average Risk Probability",
                "baseline": base_sum["average_weighted_risk"],
                "scenario": scen_sum["average_weighted_risk"],
                "delta": risk_diff,
                "unit": "%",
                "status": "Negative" if risk_diff > 0 else "Positive"
            },
            {
                "metric": "Expected Delivery Delay",
                "baseline": base_sum["expected_delivery_delay_weeks"],
                "scenario": scen_sum["expected_delivery_delay_weeks"],
                "delta": delay_diff,
                "unit": "Weeks",
                "status": "Negative" if delay_diff > 0 else "Positive"
            },
            {
                "metric": "Max Supplier Dependency",
                "baseline": base_sum["supplier_dependency_pct"],
                "scenario": scen_sum["supplier_dependency_pct"],
                "delta": round(scen_sum["supplier_dependency_pct"] - base_sum["supplier_dependency_pct"], 1),
                "unit": "%",
                "status": "Negative" if scen_sum["supplier_dependency_pct"] > 50.0 else "Positive"
            },
            {
                "metric": "Unmet Requirement",
                "baseline": base_sum["unmet_requirement"],
                "scenario": scen_sum["unmet_requirement"],
                "delta": round(scen_sum["unmet_requirement"] - base_sum["unmet_requirement"], 2),
                "unit": "Units",
                "status": "Negative" if scen_sum["unmet_requirement"] > 0 else "Positive"
            }
        ]

        # Allocation comparison by supplier
        base_allocs = {a["supplier_id"]: a for a in baseline_res["allocations"]}
        scen_allocs = {a["supplier_id"]: a for a in scenario_res["allocations"]}
        all_sups = set(base_allocs.keys()).union(set(scen_allocs.keys()))

        supplier_comparison = []
        for s in all_sups:
            b_item = base_allocs.get(s, {})
            s_item = scen_allocs.get(s, {})
            s_name = b_item.get("supplier_name") or s_item.get("supplier_name") or s
            b_qty = b_item.get("allocated_quantity", 0.0)
            sc_qty = s_item.get("allocated_quantity", 0.0)
            
            supplier_comparison.append({
                "supplier_id": s,
                "supplier_name": s_name,
                "baseline_qty": b_qty,
                "scenario_qty": sc_qty,
                "qty_change": round(sc_qty - b_qty, 2),
                "baseline_spend": b_item.get("total_spend", 0.0),
                "scenario_spend": s_item.get("total_spend", 0.0),
                "risk_class": s_item.get("risk_class", b_item.get("risk_class", "LOW"))
            })

        return {
            "scenario_metadata": {
                "scenario_type": scenario_type,
                "demand_change_pct": demand_change_pct,
                "disrupted_supplier_id": disrupted_supplier_id,
                "supplier_capacity_reduction_pct": supplier_capacity_reduction_pct,
                "lead_time_increase_pct": lead_time_increase_pct,
                "price_increase_pct": material_price_increase_pct
            },
            "comparison_kpis": comparison_kpis,
            "supplier_comparison": sorted(supplier_comparison, key=lambda x: x["scenario_qty"], reverse=True),
            "baseline_summary": base_sum,
            "scenario_summary": scen_sum,
            "scenario_allocations": scenario_res["allocations"]
        }
