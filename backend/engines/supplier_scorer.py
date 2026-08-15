import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class SupplierEvaluationEngine:
    def __init__(self, cleaned_dfs: Dict[str, pd.DataFrame]):
        self.df_suppliers = cleaned_dfs.get("supplier_master.csv", pd.DataFrame())
        self.df_capacity = cleaned_dfs.get("supplier_capacity.csv", pd.DataFrame())
        self.df_prices = cleaned_dfs.get("material_price.csv", pd.DataFrame())
        self.df_lead_times = cleaned_dfs.get("lead_time.csv", pd.DataFrame())
        self.df_perf = cleaned_dfs.get("supplier_performance.csv", pd.DataFrame())
        self.df_deliv = cleaned_dfs.get("delivery_history.csv", pd.DataFrame())
        self.df_qual = cleaned_dfs.get("quality_history.csv", pd.DataFrame())
        self.df_disrupt = cleaned_dfs.get("disruption_history.csv", pd.DataFrame())
        self.df_materials = cleaned_dfs.get("material_master.csv", pd.DataFrame())

    def evaluate_suppliers(self,
                           material_id: Optional[str] = None,
                           cost_weight: float = 0.30,
                           quality_weight: float = 0.20,
                           delivery_weight: float = 0.25,
                           reliability_weight: float = 0.15,
                           capacity_weight: float = 0.10) -> Dict[str, Any]:
        
        # Normalize weights
        total_w = cost_weight + quality_weight + delivery_weight + reliability_weight + capacity_weight
        if total_w > 0:
            w_cost = cost_weight / total_w
            w_qual = quality_weight / total_w
            w_deliv = delivery_weight / total_w
            w_rel = reliability_weight / total_w
            w_cap = capacity_weight / total_w
        else:
            w_cost, w_qual, w_deliv, w_rel, w_cap = 0.3, 0.2, 0.25, 0.15, 0.10

        # Filter capacity/prices by material if provided
        cap_df = self.df_capacity.copy()
        price_df = self.df_prices.copy()
        if material_id and material_id != "ALL":
            cap_df = cap_df[cap_df["Material_ID"] == material_id]
            price_df = price_df[price_df["Material_ID"] == material_id]

        # Calculate supplier level aggregates from historical tables
        # 1. Delivery performance
        deliv_agg = self.df_deliv.groupby("Supplier_ID").agg(
            total_deliveries=("Delivery_ID", "count"),
            on_time_deliveries=("On_Time_Flag", "sum"),
            avg_actual_lead_time=("Actual_Lead_Time_Weeks", "mean"),
            avg_delay_days=("Delay_Days", "mean")
        ).reset_index()
        deliv_agg["on_time_rate"] = (deliv_agg["on_time_deliveries"] / deliv_agg["total_deliveries"].clip(lower=1) * 100.0).round(1)

        # 2. Quality performance
        qual_agg = self.df_qual.groupby("Supplier_ID").agg(
            total_inspections=("Inspection_ID", "count"),
            passed_inspections=("Passed_Flag", "sum"),
            avg_defect_rate=("Defect_Rate", "mean")
        ).reset_index()
        qual_agg["quality_pass_rate"] = (qual_agg["passed_inspections"] / qual_agg["total_inspections"].clip(lower=1) * 100.0).round(1)

        # 3. Disruptions count
        disrupt_agg = self.df_disrupt.groupby("Supplier_ID").agg(
            disruption_events=("Disruption_ID", "count"),
            avg_duration_weeks=("Duration_Weeks", "mean")
        ).reset_index()

        # 4. Capacity & Price aggregates
        cap_agg = cap_df.groupby("Supplier_ID").agg(
            total_capacity=("Max_Weekly_Capacity", "sum"),
            materials_count=("Material_ID", "nunique")
        ).reset_index()

        price_agg = price_df.groupby("Supplier_ID").agg(
            avg_unit_price=("Base_Unit_Price", "mean")
        ).reset_index()

        # Merge into master
        master = self.df_suppliers.copy()
        if material_id and material_id != "ALL":
            # Only include suppliers that supply this material
            approved_sups = cap_df["Supplier_ID"].unique()
            master = master[master["Supplier_ID"].isin(approved_sups)]

        master = master.merge(deliv_agg, on="Supplier_ID", how="left")
        master = master.merge(qual_agg, on="Supplier_ID", how="left")
        master = master.merge(disrupt_agg, on="Supplier_ID", how="left")
        master = master.merge(cap_agg, on="Supplier_ID", how="left")
        master = master.merge(price_agg, on="Supplier_ID", how="left")

        # Fill defaults
        master["on_time_rate"] = master["on_time_rate"].fillna(85.0)
        master["quality_pass_rate"] = master["quality_pass_rate"].fillna(92.0)
        master["avg_actual_lead_time"] = master["avg_actual_lead_time"].fillna(3.5).round(1)
        master["disruption_events"] = master["disruption_events"].fillna(0).astype(int)
        master["avg_duration_weeks"] = master["avg_duration_weeks"].fillna(0.0).round(1)
        master["total_capacity"] = master["total_capacity"].fillna(25000).astype(int)
        master["avg_unit_price"] = master["avg_unit_price"].fillna(50.0).round(2)
        master["materials_count"] = master["materials_count"].fillna(1).astype(int)
        master["on_time_deliveries"] = master["on_time_deliveries"].fillna(0).astype(int)
        master["total_deliveries"] = master["total_deliveries"].fillna(0).astype(int)
        master["total_inspections"] = master["total_inspections"].fillna(0).astype(int)
        master["passed_inspections"] = master["passed_inspections"].fillna(0).astype(int)
        master["avg_defect_rate"] = master["avg_defect_rate"].fillna(0.0).round(3)

        # Normalize component scores (0 to 100)
        min_p, max_p = master["avg_unit_price"].min(), master["avg_unit_price"].max()
        if max_p > min_p:
            master["cost_score"] = (100.0 - ((master["avg_unit_price"] - min_p) / (max_p - min_p) * 60.0)).round(1)
        else:
            master["cost_score"] = 85.0

        master["delivery_score"] = master["on_time_rate"]
        master["quality_score"] = master["quality_pass_rate"]

        # Reliability score = 100 - (disruptions * 15 + delay_penalty)
        master["reliability_score"] = np.clip(100.0 - (master["disruption_events"] * 18.0) - (master["avg_actual_lead_time"] * 3.0), 30.0, 99.0).round(1)

        # Capacity score
        max_cap = master["total_capacity"].max()
        master["capacity_score"] = (master["total_capacity"] / max(1, max_cap) * 100.0).round(1)

        # Compute dynamic overall composite score
        master["overall_score"] = (
            (master["cost_score"] * w_cost) +
            (master["quality_score"] * w_qual) +
            (master["delivery_score"] * w_deliv) +
            (master["reliability_score"] * w_rel) +
            (master["capacity_score"] * w_cap)
        ).round(1)

        # Classify Risk Level
        master["risk_class"] = master["overall_score"].apply(
            lambda s: "LOW" if s >= 85 else ("MEDIUM" if s >= 72 else ("HIGH" if s >= 55 else "CRITICAL"))
        )

        results = master.replace({np.nan: None}).sort_values("overall_score", ascending=False).to_dict(orient="records")

        return {
            "weights_used": {
                "cost_weight": round(w_cost, 2),
                "quality_weight": round(w_qual, 2),
                "delivery_weight": round(w_deliv, 2),
                "reliability_weight": round(w_rel, 2),
                "capacity_weight": round(w_cap, 2)
            },
            "total_suppliers": len(results),
            "suppliers": results
        }

    def get_supplier_detail(self, supplier_id: str) -> Dict[str, Any]:
        """Provides full historical profile and drilldown for a selected supplier."""
        sup = self.df_suppliers[self.df_suppliers["Supplier_ID"] == supplier_id]
        if len(sup) == 0:
            return {"error": "Supplier not found"}

        sup_info = sup.iloc[0].to_dict()

        # Approved materials
        caps = self.df_capacity[self.df_capacity["Supplier_ID"] == supplier_id]
        if len(caps) > 0 and len(self.df_materials) > 0:
            caps = caps.merge(self.df_materials[["Material_ID", "Material_Name", "Category", "Standard_Cost"]], on="Material_ID", how="left")
            prices = self.df_prices[self.df_prices["Supplier_ID"] == supplier_id]
            caps = caps.merge(prices[["Material_ID", "Base_Unit_Price"]], on="Material_ID", how="left")
        approved_materials = caps.fillna("").to_dict(orient="records")

        # Historical performance trend
        perf = self.df_perf[self.df_perf["Supplier_ID"] == supplier_id].sort_values("Week")
        perf_trend = perf.replace({np.nan: None}).to_dict(orient="records")

        # Historical deliveries sample
        delivs = self.df_deliv[self.df_deliv["Supplier_ID"] == supplier_id].sort_values("Actual_Delivery_Date", ascending=False).head(25)
        deliv_list = delivs.replace({np.nan: None}).to_dict(orient="records")

        # Quality inspections sample
        quals = self.df_qual[self.df_qual["Supplier_ID"] == supplier_id].sort_values("Inspection_ID", ascending=False).head(25)
        qual_list = quals.replace({np.nan: None}).to_dict(orient="records")

        # Disruptions
        disrupts = self.df_disrupt[self.df_disrupt["Supplier_ID"] == supplier_id]
        disrupts = disrupts.replace({np.nan: None}).to_dict(orient="records")

        return {
            "supplier_profile": sup_info,
            "approved_materials": approved_materials,
            "performance_trend": perf_trend,
            "recent_deliveries": deliv_list,
            "quality_inspections": qual_list,
            "disruptions": disrupts
        }
