import pulp
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class MultiObjectiveAllocationEngine:
    def __init__(self, cleaned_dfs: Dict[str, pd.DataFrame], risk_engine):
        self.df_materials = cleaned_dfs.get("material_master.csv", pd.DataFrame())
        self.df_suppliers = cleaned_dfs.get("supplier_master.csv", pd.DataFrame())
        self.df_capacity = cleaned_dfs.get("supplier_capacity.csv", pd.DataFrame())
        self.df_prices = cleaned_dfs.get("material_price.csv", pd.DataFrame())
        self.df_lead_times = cleaned_dfs.get("lead_time.csv", pd.DataFrame())
        self.df_contracts = cleaned_dfs.get("contract_commitments.csv", pd.DataFrame())
        self.df_demand = cleaned_dfs.get("demand_forecast.csv", pd.DataFrame())
        self.risk_engine = risk_engine

    def optimize_allocation(self,
                            material_id: Optional[str] = None,
                            plant_id: Optional[str] = None,
                            demand_multiplier: float = 1.0,
                            risk_weight: float = 0.40,
                            max_supplier_dependency_pct: float = 60.0,
                            enforce_contracts: bool = True,
                            supplier_capacity_overrides: Optional[Dict[str, float]] = None,
                            disrupted_suppliers: Optional[List[str]] = None,
                            custom_net_requirements: Optional[Dict[str, float]] = None,
                            net_procurement_requirement: Optional[float] = None) -> Dict[str, Any]:
        """Runs PuLP Linear Programming multi-objective optimization to allocate procurement volumes."""
        
        supplier_capacity_overrides = supplier_capacity_overrides or {}
        disrupted_suppliers = disrupted_suppliers or []

        def resolve_material_id(m: str) -> str:
            if not m or m == "ALL":
                return m
            valid_mats = self.df_materials["Material_ID"].tolist() if "Material_ID" in self.df_materials.columns else []
            if m in valid_mats:
                return m
            # Try 3-digit normalization (e.g. MAT-0001 -> MAT-001)
            if m.startswith("MAT-"):
                num_part = m.split("-")[1].lstrip("0") or "1"
                norm3 = f"MAT-{int(num_part):03d}"
                if norm3 in valid_mats:
                    return norm3
            # Try mapping fabric code to material index
            if m.startswith("FAB_") and valid_mats:
                idx = abs(hash(m)) % len(valid_mats)
                return valid_mats[idx]
            return valid_mats[0] if valid_mats else m

        # 1. Determine Net Requirements per Material
        if custom_net_requirements:
            mat_reqs = {resolve_material_id(k): round(float(v) * demand_multiplier, 2) for k, v in custom_net_requirements.items() if float(v) > 0}
        elif net_procurement_requirement is not None and net_procurement_requirement > 0 and material_id and material_id != "ALL":
            resolved_m = resolve_material_id(material_id)
            mat_reqs = {resolved_m: round(float(net_procurement_requirement) * demand_multiplier, 2)}
        else:
            df_dem = self.df_demand.copy()
            if material_id and material_id != "ALL":
                resolved_m = resolve_material_id(material_id)
                df_dem = df_dem[df_dem["Material_ID"] == resolved_m]
            if plant_id and plant_id != "ALL":
                df_dem = df_dem[df_dem["Plant_ID"] == plant_id]

            mat_reqs = df_dem.groupby("Material_ID")["Net_Procurement_Requirement"].sum().to_dict()
            
            # Apply demand multiplier
            for m in list(mat_reqs.keys()):
                mat_reqs[m] = round(mat_reqs[m] * demand_multiplier, 2)
                if mat_reqs[m] <= 0:
                    mat_reqs[m] = 5000.0 # baseline fallback if net is 0

            # If filtered to a specific material that had 0 demand, ensure baseline exists
            if material_id and material_id != "ALL":
                resolved_m = resolve_material_id(material_id)
                if resolved_m not in mat_reqs or mat_reqs[resolved_m] <= 0:
                    mat_reqs[resolved_m] = 50000.0 * demand_multiplier

            # If no materials, take top 5
            if not mat_reqs:
                top_mats = self.df_materials["Material_ID"].head(5).tolist()
                for m in top_mats:
                    mat_reqs[m] = 40000.0 * demand_multiplier

        # 2. Get AI Risk Predictions for all suppliers
        risk_data = self.risk_engine.predict_supplier_risks(material_id=material_id)
        supplier_risk_map = {s["supplier_id"]: s for s in risk_data["supplier_risk_predictions"]}

        # 3. Setup PuLP Optimization Problem
        prob = pulp.LpProblem("Procurement_Multi_Objective_Allocation", pulp.LpMinimize)

        # Decision Variables: X[(supplier_id, material_id)]
        allocation_vars = {}
        candidate_pairs = []

        for m_id, req_qty in mat_reqs.items():
            # Get approved suppliers for this material
            caps = self.df_capacity[self.df_capacity["Material_ID"] == m_id]
            for _, cap_row in caps.iterrows():
                s_id = cap_row["Supplier_ID"]
                if s_id in disrupted_suppliers:
                    continue # Disrupted supplier receives 0 capacity

                var_name = f"Alloc_{s_id}_{m_id}"
                # Maximum capacity with override
                cap_mult = supplier_capacity_overrides.get(s_id, 1.0)
                effective_cap = float(cap_row["Max_Weekly_Capacity"]) * cap_mult

                # If single supplier has enough cap or max allocation applies
                max_alloc_qty = (max_supplier_dependency_pct / 100.0) * req_qty if len(caps) > 1 else req_qty
                upper_bound = min(effective_cap, max_alloc_qty)

                # Contract bounds
                min_contract = 0.0
                if enforce_contracts and len(self.df_contracts) > 0:
                    ctr = self.df_contracts[(self.df_contracts["Supplier_ID"] == s_id) & (self.df_contracts["Material_ID"] == m_id)]
                    if len(ctr) > 0:
                        min_contract = min(float(ctr["Min_Commitment_Qty"].values[0]), upper_bound)

                x_var = pulp.LpVariable(var_name, lowBound=min_contract, upBound=upper_bound, cat=pulp.LpContinuous)
                allocation_vars[(s_id, m_id)] = x_var
                candidate_pairs.append((s_id, m_id))

        # 4. Formulate Objective Function
        # Total Objective = Unit Cost + (Risk Weight * Risk Penalty) + (Quality Penalty) + (Delay Penalty)
        objective_terms = []
        cost_weight_factor = 1.0 - (risk_weight * 0.7) # balances cost vs risk

        for (s_id, m_id) in candidate_pairs:
            x_var = allocation_vars[(s_id, m_id)]

            # Price
            price_row = self.df_prices[(self.df_prices["Supplier_ID"] == s_id) & (self.df_prices["Material_ID"] == m_id)]
            unit_price = float(price_row["Base_Unit_Price"].values[0]) if len(price_row) > 0 else 50.0

            # Risk metric
            sup_risk = supplier_risk_map.get(s_id, {})
            risk_prob = sup_risk.get("risk_probability", 20.0) / 100.0
            predicted_delay = sup_risk.get("predicted_delay_weeks", 1.0)
            defect_rate = sup_risk.get("defect_rate", 2.0) / 100.0

            # Penalties in USD per unit
            risk_penalty = risk_prob * unit_price * 2.5 * risk_weight
            delay_penalty = predicted_delay * (unit_price * 0.15) * risk_weight
            quality_penalty = defect_rate * unit_price * 3.0

            effective_unit_cost = (unit_price * cost_weight_factor) + risk_penalty + delay_penalty + quality_penalty
            objective_terms.append(effective_unit_cost * x_var)

        prob += pulp.lpSum(objective_terms), "Total_Effective_Procurement_Cost"

        # 5. Demand Satisfaction Constraints
        for m_id, req_qty in mat_reqs.items():
            avail_vars = [allocation_vars[(s, m)] for (s, m) in candidate_pairs if m == m_id]
            if avail_vars:
                # Require sum >= req_qty (or eq)
                prob += pulp.lpSum(avail_vars) == req_qty, f"Demand_Requirement_{m_id}"

        # 6. Solve LP
        solver = pulp.PULP_CBC_CMD(msg=0)
        prob.solve(solver)

        status_str = pulp.LpStatus[prob.status]

        # 7. Extract Results
        allocations = []
        total_procurement_cost = 0.0
        total_procured_volume = 0.0
        weighted_risk_sum = 0.0
        weighted_delay_sum = 0.0
        material_summaries = {}

        for m_id, req_qty in mat_reqs.items():
            material_summaries[m_id] = {
                "material_id": m_id,
                "material_name": self.df_materials[self.df_materials["Material_ID"] == m_id]["Material_Name"].values[0] if len(self.df_materials[self.df_materials["Material_ID"] == m_id]) > 0 else m_id,
                "required_quantity": req_qty,
                "allocated_quantity": 0.0,
                "total_cost": 0.0,
                "suppliers": []
            }

        for (s_id, m_id) in candidate_pairs:
            x_var = allocation_vars[(s_id, m_id)]
            allocated_qty = round(max(0.0, x_var.varValue if x_var.varValue is not None else 0.0), 2)
            
            if allocated_qty > 0:
                price_row = self.df_prices[(self.df_prices["Supplier_ID"] == s_id) & (self.df_prices["Material_ID"] == m_id)]
                unit_price = float(price_row["Base_Unit_Price"].values[0]) if len(price_row) > 0 else 50.0
                spend = round(allocated_qty * unit_price, 2)
                
                sup_row = self.df_suppliers[self.df_suppliers["Supplier_ID"] == s_id].iloc[0]
                sup_risk = supplier_risk_map.get(s_id, {})
                risk_prob = sup_risk.get("risk_probability", 20.0)
                risk_class = sup_risk.get("risk_class", "LOW")
                pred_delay = sup_risk.get("predicted_delay_weeks", 0.5)

                cap_row = self.df_capacity[(self.df_capacity["Supplier_ID"] == s_id) & (self.df_capacity["Material_ID"] == m_id)].iloc[0]
                max_cap = float(cap_row["Max_Weekly_Capacity"]) * supplier_capacity_overrides.get(s_id, 1.0)
                cap_util = round((allocated_qty / max(1, max_cap)) * 100.0, 1)

                total_req = mat_reqs.get(m_id, 1.0)
                share_pct = round((allocated_qty / max(1.0, total_req)) * 100.0, 1)

                total_procurement_cost += spend
                total_procured_volume += allocated_qty
                weighted_risk_sum += risk_prob * allocated_qty
                weighted_delay_sum += pred_delay * allocated_qty

                alloc_item = {
                    "supplier_id": s_id,
                    "supplier_name": sup_row["Supplier_Name"],
                    "country": sup_row["Country"],
                    "material_id": m_id,
                    "allocated_quantity": allocated_qty,
                    "allocation_percentage": share_pct,
                    "unit_price": unit_price,
                    "total_spend": spend,
                    "supplier_capacity": max_cap,
                    "capacity_utilization_pct": cap_util,
                    "capacity_pressure_flag": "HIGH PRESSURE (>90%)" if cap_util >= 90.0 else "HEALTHY",
                    "risk_probability": risk_prob,
                    "risk_class": risk_class,
                    "predicted_delay_weeks": pred_delay
                }
                allocations.append(alloc_item)
                material_summaries[m_id]["allocated_quantity"] += allocated_qty
                material_summaries[m_id]["total_cost"] += spend
                material_summaries[m_id]["suppliers"].append(alloc_item)

        avg_risk = round(weighted_risk_sum / max(1.0, total_procured_volume), 1)
        avg_delay = round(weighted_delay_sum / max(1.0, total_procured_volume), 2)

        # Supplier dependency / concentration (Max allocation % to a single supplier)
        sup_totals = {}
        for a in allocations:
            sup_totals[a["supplier_id"]] = sup_totals.get(a["supplier_id"], 0.0) + a["allocated_quantity"]
        
        max_sup_share = round((max(sup_totals.values()) / max(1.0, total_procured_volume) * 100.0), 1) if sup_totals else 0.0
        dependency_risk = "HIGH (>50%)" if max_sup_share > 50.0 else ("MODERATE (35-50%)" if max_sup_share >= 35.0 else "DIVERSIFIED (<35%)")

        # Scatter Plot Data (Cost vs Risk Matrix)
        cost_vs_risk_plot = []
        for s_id in self.df_suppliers["Supplier_ID"].unique():
            sup_info = self.df_suppliers[self.df_suppliers["Supplier_ID"] == s_id].iloc[0]
            sup_risk = supplier_risk_map.get(s_id, {})
            avg_p = float(self.df_prices[self.df_prices["Supplier_ID"] == s_id]["Base_Unit_Price"].mean()) if len(self.df_prices[self.df_prices["Supplier_ID"] == s_id]) > 0 else 50.0
            tot_cap = float(self.df_capacity[self.df_capacity["Supplier_ID"] == s_id]["Max_Weekly_Capacity"].sum()) if len(self.df_capacity[self.df_capacity["Supplier_ID"] == s_id]) > 0 else 20000.0
            alloc_vol = sup_totals.get(s_id, 0.0)

            cost_vs_risk_plot.append({
                "supplier_id": s_id,
                "supplier_name": sup_info["Supplier_Name"],
                "country": sup_info["Country"],
                "unit_cost": round(avg_p, 2),
                "risk_probability": sup_risk.get("risk_probability", 20.0),
                "risk_class": sup_risk.get("risk_class", "LOW"),
                "capacity": tot_cap,
                "allocated_volume": alloc_vol,
                "quadrant": "BEST (Low Cost, Low Risk)" if avg_p < 75.0 and sup_risk.get("risk_probability", 20.0) < 50.0 else (
                    "WARNING (Low Cost, High Risk)" if avg_p < 75.0 and sup_risk.get("risk_probability", 20.0) >= 50.0 else (
                        "OK (High Cost, Low Risk)" if avg_p >= 75.0 and sup_risk.get("risk_probability", 20.0) < 50.0 else "CRITICAL (High Cost, High Risk)"
                    )
                )
            })

        return {
            "optimization_status": status_str,
            "summary": {
                "total_procurement_requirement": round(sum(mat_reqs.values()), 2),
                "total_allocated_quantity": round(total_procured_volume, 2),
                "unmet_requirement": round(max(0.0, sum(mat_reqs.values()) - total_procured_volume), 2),
                "total_procurement_cost_usd": round(total_procurement_cost, 2),
                "average_weighted_risk": avg_risk,
                "expected_delivery_delay_weeks": avg_delay,
                "supplier_dependency_pct": max_sup_share,
                "supplier_dependency_risk": dependency_risk,
                "active_suppliers_count": len(sup_totals),
                "optimizer_engine": "PuLP Linear Programming Solver (CBC Branch-and-Cut)"
            },
            "allocations": allocations,
            "material_allocation_breakdown": list(material_summaries.values()),
            "cost_vs_risk_matrix": cost_vs_risk_plot,
            "parameters": {
                "demand_multiplier": demand_multiplier,
                "risk_weight": risk_weight,
                "max_supplier_dependency_pct": max_supplier_dependency_pct,
                "enforce_contracts": enforce_contracts
            }
        }
