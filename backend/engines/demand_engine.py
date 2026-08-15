import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class DemandSignalEngine:
    def __init__(self, cleaned_dfs: Dict[str, pd.DataFrame]):
        self.df_demand = cleaned_dfs.get("demand_forecast.csv", pd.DataFrame())
        self.df_materials = cleaned_dfs.get("material_master.csv", pd.DataFrame())
        self.df_lead_times = cleaned_dfs.get("lead_time.csv", pd.DataFrame())
        self.df_suppliers = cleaned_dfs.get("supplier_master.csv", pd.DataFrame())

    def get_demand_signal(self, 
                          material_id: Optional[str] = None,
                          sku_id: Optional[str] = None,
                          plant_id: Optional[str] = None,
                          season: Optional[str] = None,
                          week: Optional[int] = None) -> Dict[str, Any]:
        
        df = self.df_demand.copy()

        # Apply global filters
        if material_id and material_id != "ALL":
            df = df[df["Material_ID"] == material_id]
        if sku_id and sku_id != "ALL":
            df = df[df["SKU_ID"] == sku_id]
        if plant_id and plant_id != "ALL":
            df = df[df["Plant_ID"] == plant_id]
        if season and season != "ALL":
            df = df[df["Season"] == season]
        if week and week > 0:
            df = df[df["Week"] == week]

        # Calculate high level metrics
        total_forecast_demand = int(df["Forecast_Demand"].sum()) if len(df) > 0 else 0
        total_prod_qty = int(df["Production_Requirement"].sum()) if len(df) > 0 else 0
        total_gross_req = round(float(df["Gross_Material_Requirement"].sum()), 2) if len(df) > 0 else 0.0
        total_current_inv = round(float(df["Current_Inventory"].sum()), 2) if len(df) > 0 else 0.0
        total_confirmed_supply = round(float(df["Confirmed_Incoming_Supply"].sum()), 2) if len(df) > 0 else 0.0
        total_net_req = round(float(df["Net_Procurement_Requirement"].sum()), 2) if len(df) > 0 else 0.0

        # Weekly Material Requirement Trend (aggregate by week)
        weekly_trend = (
            df.groupby("Week")
            .agg({
                "Gross_Material_Requirement": "sum",
                "Current_Inventory": "sum",
                "Net_Procurement_Requirement": "sum"
            })
            .reset_index()
            .sort_values("Week")
            .to_dict(orient="records")
        )

        # Plant-wise Requirement
        plant_req = (
            df.groupby("Plant_ID")
            .agg({
                "Gross_Material_Requirement": "sum",
                "Net_Procurement_Requirement": "sum"
            })
            .reset_index()
            .to_dict(orient="records")
        )

        # Material Demand Breakdown (top 15 materials in filter)
        mat_summary = (
            df.groupby("Material_ID")
            .agg({
                "Gross_Material_Requirement": "sum",
                "Current_Inventory": "sum",
                "Confirmed_Incoming_Supply": "sum",
                "Net_Procurement_Requirement": "sum"
            })
            .reset_index()
            .sort_values("Net_Procurement_Requirement", ascending=False)
            .head(15)
        )
        # Merge with material name
        if len(mat_summary) > 0 and len(self.df_materials) > 0:
            mat_summary = mat_summary.merge(
                self.df_materials[["Material_ID", "Material_Name", "Category", "Unit_Of_Measure", "Criticality"]],
                on="Material_ID",
                how="left"
            )
        mat_breakdown = mat_summary.fillna("").to_dict(orient="records")

        # Seasonal Requirement Breakdown
        seasonal_req = (
            df.groupby("Season")
            .agg({
                "Gross_Material_Requirement": "sum",
                "Net_Procurement_Requirement": "sum"
            })
            .reset_index()
            .to_dict(orient="records")
        )

        # Detailed Demand Records (sample latest 100 for display)
        sample_records = df.sort_values("Week", ascending=False).head(100)
        if len(sample_records) > 0 and len(self.df_materials) > 0:
            sample_records = sample_records.merge(
                self.df_materials[["Material_ID", "Material_Name", "Unit_Of_Measure", "Criticality"]],
                on="Material_ID",
                how="left"
            )
        
        records_list = sample_records.fillna("").to_dict(orient="records")

        return {
            "summary": {
                "total_skus_active": df["SKU_ID"].nunique(),
                "total_materials_required": df["Material_ID"].nunique(),
                "total_forecast_production": total_prod_qty,
                "total_gross_material_requirement": total_gross_req,
                "total_current_inventory": total_current_inv,
                "total_confirmed_incoming_supply": total_confirmed_supply,
                "total_net_procurement_requirement": total_net_req,
                "demand_signal_formula": "Net Requirement = max(0, Gross Material Requirement - Current Inventory - Confirmed Incoming Supply)"
            },
            "weekly_trend": weekly_trend[-52:], # last 52 weeks or current window
            "plant_distribution": plant_req,
            "material_breakdown": mat_breakdown,
            "seasonal_breakdown": seasonal_req,
            "detailed_records": records_list
        }

    def get_procurement_intelligence(self,
                                     material_id: Optional[str] = None,
                                     plant_id: Optional[str] = None,
                                     lead_time_buffer_days: int = 7) -> Dict[str, Any]:
        """Calculates Gross vs Net procurement requirements, lead times, order dates, and delivery risk flags."""
        df = self.df_demand.copy()
        if material_id and material_id != "ALL":
            df = df[df["Material_ID"] == material_id]
        if plant_id and plant_id != "ALL":
            df = df[df["Plant_ID"] == plant_id]

        # Aggregate net requirement by Material and Plant
        mat_plant_req = (
            df.groupby(["Material_ID", "Plant_ID"])
            .agg({
                "Gross_Material_Requirement": "sum",
                "Current_Inventory": "sum",
                "Confirmed_Incoming_Supply": "sum",
                "Net_Procurement_Requirement": "sum"
            })
            .reset_index()
        )

        if len(mat_plant_req) == 0:
            return {"items": [], "summary": {}}

        # Merge with Material Master
        mat_plant_req = mat_plant_req.merge(
            self.df_materials[["Material_ID", "Material_Name", "Unit_Of_Measure", "Criticality", "Standard_Cost"]],
            on="Material_ID",
            how="left"
        )

        # Merge with Lead Time data
        items = []
        today = datetime.now()

        total_net = 0.0
        urgent_count = 0
        total_risk_exposure = 0.0

        for _, row in mat_plant_req.iterrows():
            m_id = row["Material_ID"]
            p_id = row["Plant_ID"]
            net_req = float(row["Net_Procurement_Requirement"])
            total_net += net_req

            # Find matching lead times from lead_time.csv
            lts = self.df_lead_times[(self.df_lead_times["Material_ID"] == m_id) & (self.df_lead_times["Plant_ID"] == p_id)]
            avg_lt_weeks = float(lts["Quoted_Lead_Time_Weeks"].mean()) if len(lts) > 0 else 4.0

            random_lead_offset = int(avg_lt_weeks + 2)
            required_date = today + timedelta(weeks=random_lead_offset)
            recommended_order_date = required_date - timedelta(weeks=int(avg_lt_weeks))
            expected_arrival_date = today + timedelta(weeks=int(avg_lt_weeks))

            # Delivery risk flag
            is_risk = expected_arrival_date > required_date
            delay_days = max(0, (expected_arrival_date - required_date).days)
            delay_weeks = round(delay_days / 7.0, 1)

            if net_req > 0 and (is_risk or delay_days > 0 or avg_lt_weeks >= 6):
                urgent_count += 1
                total_risk_exposure += net_req * float(row.get("Standard_Cost", 20.0))

            procurement_status = "No Action (Covered)" if net_req <= 0 else ("Urgent Procurement" if is_risk or avg_lt_weeks >= 6 else "Standard Procurement")

            items.append({
                "material_id": m_id,
                "material_name": row.get("Material_Name", m_id),
                "plant_id": p_id,
                "category": row.get("Category", "General"),
                "unit_of_measure": row.get("Unit_Of_Measure", "Units"),
                "criticality": row.get("Criticality", "Medium"),
                "gross_requirement": round(float(row["Gross_Material_Requirement"]), 2),
                "current_inventory": round(float(row["Current_Inventory"]), 2),
                "confirmed_supply": round(float(row["Confirmed_Incoming_Supply"]), 2),
                "net_requirement": round(net_req, 2),
                "avg_lead_time_weeks": round(avg_lt_weeks, 1),
                "required_date": required_date.strftime("%Y-%m-%d"),
                "recommended_order_date": recommended_order_date.strftime("%Y-%m-%d"),
                "expected_arrival_date": expected_arrival_date.strftime("%Y-%m-%d"),
                "delivery_risk_flag": "HIGH RISK" if is_risk else ("MEDIUM RISK" if avg_lt_weeks >= 5 else "ON TRACK"),
                "predicted_delay_weeks": delay_weeks,
                "procurement_status": procurement_status
            })

        return {
            "summary": {
                "total_materials_evaluated": len(items),
                "total_net_procurement_volume": round(total_net, 2),
                "urgent_action_required_count": urgent_count,
                "capital_risk_exposure_usd": round(total_risk_exposure, 2),
                "lead_time_buffer_days": lead_time_buffer_days
            },
            "items": sorted(items, key=lambda x: x["net_requirement"], reverse=True)[:50]
        }
