import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import io

class PurchaseOrderEngine:
    def __init__(self, cleaned_dfs: Dict[str, pd.DataFrame]):
        self.df_materials = cleaned_dfs.get("material_master.csv", pd.DataFrame())
        self.df_suppliers = cleaned_dfs.get("supplier_master.csv", pd.DataFrame())
        self.df_lead_times = cleaned_dfs.get("lead_time.csv", pd.DataFrame())
        self.df_contracts = cleaned_dfs.get("contract_commitments.csv", pd.DataFrame())

    def generate_purchase_orders(self, allocations: List[Dict[str, Any]], plant_id: Optional[str] = None) -> Dict[str, Any]:
        """Generates operational Purchase Orders from multi-objective allocation results."""
        pos = []
        today = datetime.now()
        target_plant = plant_id if (plant_id and plant_id != "ALL") else "PLANT-01"

        po_idx = 1001
        total_spend = 0.0
        total_qty = 0.0
        risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

        for alloc in allocations:
            qty = alloc.get("allocated_quantity", 0.0)
            if qty <= 0:
                continue

            s_id = alloc["supplier_id"]
            m_id = alloc["material_id"]
            u_price = alloc.get("unit_price", 50.0)
            cost = alloc.get("total_spend", qty * u_price)
            risk_class = alloc.get("risk_class", "LOW")
            risk_prob = alloc.get("risk_probability", 20.0)

            # Lookup lead time
            lts = self.df_lead_times[(self.df_lead_times["Supplier_ID"] == s_id) & (self.df_lead_times["Material_ID"] == m_id)]
            lt_weeks = int(lts["Quoted_Lead_Time_Weeks"].mean()) if len(lts) > 0 else 3

            # Dates
            order_date = today
            expected_delivery_date = order_date + timedelta(weeks=lt_weeks)
            required_date = order_date + timedelta(weeks=lt_weeks + (0 if risk_class in ["HIGH", "CRITICAL"] else 1))

            # Contract lookup
            ctrs = self.df_contracts[(self.df_contracts["Supplier_ID"] == s_id) & (self.df_contracts["Material_ID"] == m_id)]
            ctr_ref = ctrs["Contract_ID"].values[0] if len(ctrs) > 0 else f"CTR-STD-{s_id[4:]}"

            # Delivery risk flag
            is_overdue_risk = expected_delivery_date > required_date or risk_class in ["HIGH", "CRITICAL"]

            po_id = f"PO-2026-REC-{po_idx}"
            po_idx += 1

            total_spend += cost
            total_qty += qty
            risk_counts[risk_class] = risk_counts.get(risk_class, 0) + 1

            pos.append({
                "po_id": po_id,
                "supplier_id": s_id,
                "supplier_name": alloc.get("supplier_name", s_id),
                "material_id": m_id,
                "material_name": self.df_materials[self.df_materials["Material_ID"] == m_id]["Material_Name"].values[0] if len(self.df_materials[self.df_materials["Material_ID"] == m_id]) > 0 else m_id,
                "plant_id": target_plant,
                "quantity": qty,
                "unit_price": u_price,
                "total_cost": round(cost, 2),
                "order_date": order_date.strftime("%Y-%m-%d"),
                "expected_delivery_date": expected_delivery_date.strftime("%Y-%m-%d"),
                "required_date": required_date.strftime("%Y-%m-%d"),
                "lead_time_weeks": lt_weeks,
                "risk_class": risk_class,
                "risk_probability": risk_prob,
                "delivery_risk_flag": "FLAGGED (LATE RISK)" if is_overdue_risk else "HEALTHY",
                "contract_reference": ctr_ref,
                "status": "Ready for Transmission"
            })

        return {
            "summary": {
                "total_purchase_orders": len(pos),
                "total_order_quantity": round(total_qty, 2),
                "total_procurement_spend_usd": round(total_spend, 2),
                "risk_breakdown": risk_counts,
                "plant_destination": target_plant
            },
            "purchase_orders": pos
        }

    def export_pos_to_csv(self, pos: List[Dict[str, Any]]) -> str:
        """Converts generated purchase orders into CSV text format."""
        if not pos:
            return "PO_ID,Supplier_ID,Supplier_Name,Material_ID,Plant_ID,Quantity,Unit_Price,Total_Cost,Order_Date,Expected_Delivery_Date,Required_Date,Risk_Class,Contract_Ref\n"
        
        df = pd.DataFrame(pos)
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()
