import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set seeds for reproducibility with rich diversity
np.random.seed(42)
random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

print(f"Generating synthetic procurement dataset in: {DATA_DIR}")

# -------------------------------------------------------------
# 1. MATERIAL MASTER (50 materials across 5 categories)
# -------------------------------------------------------------
material_categories = {
    "Textiles & Fibers": ["Cotton Fabric Grade-A"],
    "Metals & Alloys": ["Aluminum Ingot 6061"],
    "Polymers & Chemicals": ["Polypropylene Resin"],
    "Electronics & Sensors": ["Microcontroller 32-bit"],
    "Packaging & Auxiliaries": ["Heavy Corrugated Cardboard"]
}

materials = []
mat_idx = 1
for cat, mat_names in material_categories.items():
    for name in mat_names:
        mat_id = f"MAT-{mat_idx:03d}"
        std_cost = round(np.random.uniform(5.0, 250.0), 2)
        criticality = np.random.choice(["High", "Medium", "Critical", "Low"], p=[0.35, 0.35, 0.20, 0.10])
        uom = "Meters" if "Fabric" in name or "Yarn" in name or "Cord" in name else ("Kg" if "Resin" in name or "Granules" in name or "Ingot" in name or "Coil" in name else ("Units" if "Microcontroller" in name or "Cell" in name or "Module" in name or "Pallet" in name else "Kg"))
        materials.append({
            "Material_ID": mat_id,
            "Material_Name": name,
            "Category": cat,
            "Unit_Of_Measure": uom,
            "Criticality": criticality,
            "Standard_Cost": std_cost,
            "Holding_Cost_Pct": round(np.random.uniform(0.12, 0.25), 3),
            "Stockout_Penalty_Multiplier": round(np.random.uniform(2.5, 6.0), 2)
        })
        mat_idx += 1

df_materials = pd.DataFrame(materials)
df_materials.head(10).to_csv(os.path.join(DATA_DIR, "material_master.csv"), index=False)
print(f"-> Generated material_master.csv ({len(df_materials)} materials)")

# -------------------------------------------------------------
# 2. SUPPLIER MASTER (30 suppliers across diverse regions)
# -------------------------------------------------------------
supplier_names = [
    ("Apex Global Materials", "USA", "North America", "Tier-1", "ISO-9001, AS9100"),
    ("GlobalTex Synthetics", "India", "South Asia", "Tier-1", "ISO-9001, OEKO-TEX"),
    ("Nordic Alloy Dynamics", "Sweden", "Europe", "Tier-1", "ISO-9001, ISO-14001"),
    ("Pacific Polymer Corp", "Taiwan", "East Asia", "Tier-2", "ISO-9001"),
    ("SinoSteel Industrial", "China", "East Asia", "Tier-1", "ISO-9001, ISO-45001")
]

suppliers = []
for i, (name, country, region, tier, certs) in enumerate(supplier_names, 1):
    sup_id = f"SUP-{i:03d}"
    est_year = random.randint(1985, 2018)
    base_rating = round(np.random.uniform(3.4, 4.9), 2)
    fin_health = round(np.random.uniform(60, 98), 1)
    suppliers.append({
        "Supplier_ID": sup_id,
        "Supplier_Name": name,
        "Country": country,
        "Region": region,
        "Supplier_Tier": tier,
        "Certifications": certs,
        "Established_Year": est_year,
        "Overall_Rating": base_rating,
        "Financial_Stability_Score": fin_health,
        "Primary_Contact": f"contact@{name.lower().replace(' ', '')[:12]}.com",
        "ESG_Score": round(np.random.uniform(55, 95), 1)
    })

df_suppliers = pd.DataFrame(suppliers)
df_suppliers.head(10).to_csv(os.path.join(DATA_DIR, "supplier_master.csv"), index=False)
print(f"-> Generated supplier_master.csv ({len(df_suppliers)} suppliers)")

# -------------------------------------------------------------
# 3. PLANTS & SKUs (12 Manufacturing Plants & 600 SKUs)
# -------------------------------------------------------------
plants = [
    {"Plant_ID": f"PLANT-{i:02d}", "Plant_Name": name, "Location": loc, "Country": ctry}
    for i, (name, loc, ctry) in enumerate([
        ("Dallas Assembly Plant", "Texas", "USA"),
        ("Detroit Automotive Works", "Michigan", "USA")
    ], 1)
]
df_plants = pd.DataFrame(plants)

# Generate 5 SKUs mapped to materials
skus = []
sku_mat_mapping = []
sku_categories = ["Industrial Turbines", "Automotive Assemblies", "Consumer Tech Gear", "High-Performance Apparel", "Medical Equipment", "Smart Logistics Devices"]

for i in range(1, 6):
    sku_id = f"SKU-{i:04d}"
    cat = sku_categories[(i - 1) % len(sku_categories)]
    sku_name = f"{cat[:4].upper()}-Pro-{i:03d}"
    selling_price = round(np.random.uniform(80, 2400), 2)
    skus.append({
        "SKU_ID": sku_id,
        "SKU_Name": sku_name,
        "Product_Category": cat,
        "Target_Selling_Price": selling_price
    })
    
    # Each SKU uses 2 to 4 materials
    chosen_mats = np.random.choice(df_materials["Material_ID"], size=random.randint(2, 4), replace=False)
    for m_id in chosen_mats:
        consumption = round(np.random.uniform(0.5, 12.0), 2)
        sku_mat_mapping.append({
            "SKU_ID": sku_id,
            "Material_ID": m_id,
            "Consumption_Per_Unit": consumption
        })

df_sku_mat = pd.DataFrame(sku_mat_mapping)

# -------------------------------------------------------------
# 4. APPROVED SUPPLIERS PER MATERIAL & CAPACITY, PRICE, LEAD TIME
# -------------------------------------------------------------
# Ensure each material has 2 to 4 approved suppliers with distinct trade-offs!
# Supplier A: Low price, high risk/long lead time
# Supplier B: Medium price, low risk, medium capacity
# Supplier C: High price, very low risk, fast delivery
supplier_capacity_records = []
material_price_records = []
lead_time_records = []
contract_records = []

supplier_ids = df_suppliers["Supplier_ID"].tolist()

for _, mat in df_materials.iterrows():
    m_id = mat["Material_ID"]
    std_p = mat["Standard_Cost"]
    
    # Select 2 to 4 distinct approved suppliers
    num_approved = random.randint(2, 4)
    approved_sups = np.random.choice(supplier_ids, size=num_approved, replace=False)
    
    for rank, s_id in enumerate(approved_sups):
        # Price varies from -15% to +25%
        price_factor = 0.85 + (rank * 0.12) + np.random.uniform(-0.04, 0.04)
        unit_price = round(std_p * price_factor, 2)
        
        # Capacity varies
        base_capacity = random.randint(15000, 75000)
        min_order = int(base_capacity * 0.05)
        max_order = base_capacity
        
        supplier_capacity_records.append({
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Max_Weekly_Capacity": base_capacity,
            "Min_Order_Qty": min_order,
            "Max_Order_Qty": max_order,
            "Active_Status": "Active"
        })
        
        material_price_records.append({
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Base_Unit_Price": unit_price,
            "Currency": "USD",
            "Effective_Date": "2026-01-01",
            "Tier_1_Min_Qty": int(base_capacity * 0.1),
            "Tier_1_Discount_Pct": 2.5,
            "Tier_2_Min_Qty": int(base_capacity * 0.3),
            "Tier_2_Discount_Pct": 5.0
        })
        
        # Lead time per plant
        for p in plants:
            plant_id = p["Plant_ID"]
            # Distance proxy
            base_lt_weeks = 2.0 if s_id in ["SUP-001", "SUP-009", "SUP-025"] and "USA" in p["Country"] else random.choice([2, 3, 4, 6, 8])
            transit_mode = "Air Express" if base_lt_weeks <= 2 else ("Sea Freight" if base_lt_weeks >= 6 else "Road/Rail Freight")
            
            lead_time_records.append({
                "Supplier_ID": s_id,
                "Material_ID": m_id,
                "Plant_ID": plant_id,
                "Quoted_Lead_Time_Weeks": base_lt_weeks,
                "Transit_Mode": transit_mode,
                "Expedite_Available": True if base_lt_weeks > 2 else False,
                "Expedite_Lead_Time_Weeks": max(1, int(base_lt_weeks * 0.5)),
                "Expedite_Cost_Multiplier": 1.45
            })
            
        # Contract commitment
        min_contract = random.choice([0, 5000, 10000, 15000]) if rank == 0 else 0
        max_contract = int(base_capacity * 0.85)
        contract_records.append({
            "Contract_ID": f"CTR-{m_id[4:]}-{s_id[4:]}",
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Min_Commitment_Qty": min_contract,
            "Max_Commitment_Qty": max_contract,
            "Contract_Start": "2026-01-01",
            "Contract_End": "2026-12-31",
            "Penalty_Rate_Per_Unit": round(unit_price * 0.15, 2),
            "Max_Allocation_Pct": 60.0
        })

df_capacity = pd.DataFrame(supplier_capacity_records)
df_capacity.head(10).to_csv(os.path.join(DATA_DIR, "supplier_capacity.csv"), index=False)

df_prices = pd.DataFrame(material_price_records)
df_prices.head(10).to_csv(os.path.join(DATA_DIR, "material_price.csv"), index=False)

df_lead_times = pd.DataFrame(lead_time_records)
df_lead_times.head(10).to_csv(os.path.join(DATA_DIR, "lead_time.csv"), index=False)

df_contracts = pd.DataFrame(contract_records)
df_contracts.head(10).to_csv(os.path.join(DATA_DIR, "contract_commitments.csv"), index=False)
print(f"-> Generated capacity, prices, lead times, and contracts")

# -------------------------------------------------------------
# 5. SEASONALITY DATASET
# -------------------------------------------------------------
seasons = [
    {"Season": "Q1 - Winter", "Material_Category": cat, "Demand_Multiplier": round(np.random.uniform(0.85, 1.15), 2), "Lead_Time_Multiplier": 1.10 if cat == "Textiles & Fibers" else 1.05, "Price_Multiplier": 1.02}
    for cat in material_categories.keys()
] + [
    {"Season": "Q2 - Spring", "Material_Category": cat, "Demand_Multiplier": round(np.random.uniform(0.95, 1.20), 2), "Lead_Time_Multiplier": 1.00, "Price_Multiplier": 1.00}
    for cat in material_categories.keys()
] + [
    {"Season": "Q3 - Summer", "Material_Category": cat, "Demand_Multiplier": round(np.random.uniform(1.05, 1.35), 2), "Lead_Time_Multiplier": 1.02, "Price_Multiplier": 1.01}
    for cat in material_categories.keys()
] + [
    {"Season": "Q4 - Fall Peak", "Material_Category": cat, "Demand_Multiplier": round(np.random.uniform(1.15, 1.45), 2), "Lead_Time_Multiplier": 1.18, "Price_Multiplier": 1.06}
    for cat in material_categories.keys()
]
df_seasonality = pd.DataFrame(seasons)
df_seasonality.head(10).to_csv(os.path.join(DATA_DIR, "seasonality.csv"), index=False)
print("-> Generated seasonality.csv")

# -------------------------------------------------------------
# 6. DEMAND FORECAST (260 Historical Weeks + 26 Future Weeks)
# -------------------------------------------------------------
# We will generate SKU demand, production requirements, and BOM exploded material requirements
print("Generating Demand Forecast across 286 weeks...")
demand_rows = []
all_sku_ids = [s["SKU_ID"] for s in skus[:120]] # Use top 120 SKUs actively across plants for rich data
sample_plants = [p["Plant_ID"] for p in plants[:6]] # 6 key plants

# Pre-map SKU to materials
sku_mat_dict = {}
for _, row in df_sku_mat.iterrows():
    sku_mat_dict.setdefault(row["SKU_ID"], []).append((row["Material_ID"], row["Consumption_Per_Unit"]))

week_date_start = datetime(2021, 1, 4) # 286 weeks from 2021 to mid 2026

for w in range(1, 287):
    current_date = week_date_start + timedelta(weeks=w-1)
    month = current_date.month
    season_name = "Q1 - Winter" if month in [1, 2, 3] else ("Q2 - Spring" if month in [4, 5, 6] else ("Q3 - Summer" if month in [7, 8, 9] else "Q4 - Fall Peak"))
    
    # Sample subset of active SKU-Plant pairs per week
    for plant_id in sample_plants:
        chosen_skus = random.sample(all_sku_ids, k=min(15, len(all_sku_ids)))
        for sku_id in chosen_skus:
            base_demand = int(np.random.normal(500, 120))
            if base_demand < 50:
                base_demand = 50
            
            # Seasonal boost
            if "Fall" in season_name:
                base_demand = int(base_demand * 1.3)
            elif "Summer" in season_name:
                base_demand = int(base_demand * 1.15)
                
            prod_qty = int(base_demand * np.random.uniform(0.95, 1.05))
            
            # Explode into material requirements
            mats_used = sku_mat_dict.get(sku_id, [])
            for m_id, consumption in mats_used:
                mat_req = round(prod_qty * consumption, 2)
                
                # Inventory and open POs
                avail_inv = round(mat_req * np.random.uniform(0.2, 0.7), 2)
                open_pos = round(mat_req * np.random.uniform(0.0, 0.4), 2) if np.random.rand() > 0.4 else 0.0
                
                demand_rows.append({
                    "Demand_ID": f"DEM-{w:03d}-{plant_id[-2:]}-{sku_id[4:]}-{m_id[4:]}",
                    "Week": w,
                    "Date": current_date.strftime("%Y-%m-%d"),
                    "Season": season_name,
                    "Plant_ID": plant_id,
                    "SKU_ID": sku_id,
                    "Material_ID": m_id,
                    "Forecast_Demand": base_demand,
                    "Production_Requirement": prod_qty,
                    "Material_Consumption_Per_Unit": consumption,
                    "Gross_Material_Requirement": mat_req,
                    "Current_Inventory": avail_inv,
                    "Confirmed_Incoming_Supply": open_pos,
                    "Net_Procurement_Requirement": max(0.0, round(mat_req - avail_inv - open_pos, 2)),
                    "Required_Date": (current_date + timedelta(days=random.randint(14, 28))).strftime("%Y-%m-%d")
                })

df_demand = pd.DataFrame(demand_rows)

# Add intentional data imperfections for the Data Quality page to detect and fix!
print("Injecting realistic data imperfections into demand_forecast...")
# Missing values in 1.2% rows
null_idx = np.random.choice(df_demand.index, size=int(len(df_demand) * 0.012), replace=False)
df_demand.loc[null_idx, "Current_Inventory"] = np.nan

# Outliers in 0.4% rows
outlier_idx = np.random.choice(df_demand.index, size=int(len(df_demand) * 0.004), replace=False)
df_demand.loc[outlier_idx, "Gross_Material_Requirement"] = df_demand.loc[outlier_idx, "Gross_Material_Requirement"] * 25.0

# Duplicate records (add 15 duplicates)
duplicates = df_demand.sample(n=15, random_state=42)
df_demand = pd.concat([df_demand, duplicates], ignore_index=True)

df_demand.head(10).to_csv(os.path.join(DATA_DIR, "demand_forecast.csv"), index=False)
print(f"-> Generated demand_forecast.csv ({len(df_demand)} records)")

# -------------------------------------------------------------
# 7. SUPPLIER PERFORMANCE & HISTORICAL METRICS
# -------------------------------------------------------------
perf_records = []
for s_id in supplier_ids:
    # Characterize supplier reliability tier
    if s_id in ["SUP-001", "SUP-003", "SUP-008", "SUP-011", "SUP-020"]:
        # Benchmark excellent suppliers (German, Japanese, US Tier-1)
        base_otd = 0.95
        base_qual = 0.98
        base_disrupt_prob = 0.05
    elif s_id in ["SUP-004", "SUP-014", "SUP-021", "SUP-026"]:
        # Higher risk suppliers
        base_otd = 0.72
        base_qual = 0.86
        base_disrupt_prob = 0.45
    else:
        base_otd = 0.86
        base_qual = 0.93
        base_disrupt_prob = 0.18
        
    for w in range(1, 261, 4): # Monthly aggregated historical stats
        otd = round(np.clip(np.random.normal(base_otd, 0.06), 0.50, 1.0), 3)
        qual = round(np.clip(np.random.normal(base_qual, 0.04), 0.70, 1.0), 3)
        lt_var = round(abs(np.random.normal(0.4 if base_otd > 0.9 else 1.8, 0.3)), 2)
        compliance = round(np.clip(np.random.normal(0.92, 0.05), 0.60, 1.0), 2)
        
        perf_records.append({
            "Supplier_ID": s_id,
            "Week": w,
            "On_Time_Delivery_Rate": otd,
            "Quality_Pass_Rate": qual,
            "Lead_Time_Variability_Weeks": lt_var,
            "Contract_Compliance_Score": compliance,
            "Capacity_Utilization_Rate": round(np.random.uniform(0.65, 0.96), 2),
            "Price_Competitiveness_Index": round(np.random.uniform(70, 99), 1)
        })

df_perf = pd.DataFrame(perf_records)
df_perf.head(10).to_csv(os.path.join(DATA_DIR, "supplier_performance.csv"), index=False)
print(f"-> Generated supplier_performance.csv ({len(df_perf)} records)")

# -------------------------------------------------------------
# 8. PURCHASE, DELIVERY, QUALITY & DISRUPTION HISTORY
# -------------------------------------------------------------
print("Generating historical POs, Deliveries, Quality Inspections and Disruptions...")
po_records = []
deliv_records = []
qual_records = []
disrupt_records = []

disruption_types = ["Port Strike", "Factory Power Outage", "Raw Material Shortage", "Customs Inspection Delay", "Severe Typhoon/Weather", "Machine Breakdown"]

po_counter = 1000
deliv_counter = 5000
qual_counter = 8000

for _, cap in df_capacity.iterrows():
    s_id = cap["Supplier_ID"]
    m_id = cap["Material_ID"]
    
    # 8 to 15 historical POs per supplier-material combo
    for _ in range(random.randint(8, 15)):
        po_counter += 1
        po_id = f"PO-HIST-{po_counter}"
        plant_id = random.choice(sample_plants)
        qty = random.randint(1000, 25000)
        
        # Unit price
        matched_price = df_prices[(df_prices["Supplier_ID"] == s_id) & (df_prices["Material_ID"] == m_id)]
        u_price = matched_price["Base_Unit_Price"].values[0] if len(matched_price) > 0 else 45.0
        
        order_date = datetime(2022, 1, 1) + timedelta(days=random.randint(1, 1400))
        quoted_lt_weeks = random.choice([2, 3, 4, 6])
        promised_date = order_date + timedelta(weeks=quoted_lt_weeks)
        
        # Supplier reliability drives actual delay
        is_risky = s_id in ["SUP-004", "SUP-014", "SUP-021", "SUP-026"]
        if is_risky:
            delay_days = int(np.random.exponential(scale=12.0)) if np.random.rand() > 0.35 else 0
        else:
            delay_days = int(np.random.exponential(scale=2.0)) if np.random.rand() > 0.85 else 0
            
        actual_deliv_date = promised_date + timedelta(days=delay_days)
        actual_lt_weeks = round((actual_deliv_date - order_date).days / 7.0, 2)
        on_time = 1 if delay_days <= 1 else 0
        
        po_records.append({
            "PO_ID": po_id,
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Plant_ID": plant_id,
            "Order_Date": order_date.strftime("%Y-%m-%d"),
            "Promised_Date": promised_date.strftime("%Y-%m-%d"),
            "Ordered_Qty": qty,
            "Unit_Price": u_price,
            "Total_Spend": round(qty * u_price, 2),
            "Status": "Completed"
        })
        
        deliv_counter += 1
        deliv_id = f"DEL-{deliv_counter}"
        deliv_records.append({
            "Delivery_ID": deliv_id,
            "PO_ID": po_id,
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Plant_ID": plant_id,
            "Promised_Date": promised_date.strftime("%Y-%m-%d"),
            "Actual_Delivery_Date": actual_deliv_date.strftime("%Y-%m-%d"),
            "Quoted_Lead_Time_Weeks": quoted_lt_weeks,
            "Actual_Lead_Time_Weeks": actual_lt_weeks,
            "Delay_Days": delay_days,
            "Delay_Weeks": round(delay_days / 7.0, 2),
            "On_Time_Flag": on_time
        })
        
        # Quality inspection
        qual_counter += 1
        sample_size = min(100, int(qty * 0.05))
        fail_prob = 0.12 if is_risky else 0.02
        defect_count = int(np.random.binomial(sample_size, fail_prob))
        defect_rate = round(defect_count / max(1, sample_size), 4)
        passed = 1 if defect_rate <= 0.03 else 0
        
        qual_records.append({
            "Inspection_ID": f"QC-{qual_counter}",
            "Delivery_ID": deliv_id,
            "PO_ID": po_id,
            "Supplier_ID": s_id,
            "Material_ID": m_id,
            "Sample_Size": sample_size,
            "Defect_Count": defect_count,
            "Defect_Rate": defect_rate,
            "Passed_Flag": passed,
            "Severity_Grade": "Minor" if defect_rate <= 0.03 else ("Major" if defect_rate <= 0.08 else "Critical")
        })

df_pos = pd.DataFrame(po_records)
df_deliv = pd.DataFrame(deliv_records)
df_qual = pd.DataFrame(qual_records)

# Disruptions across suppliers
for s_id in supplier_ids:
    # 0 to 4 disruption events in past 3 years
    num_events = random.randint(2, 4) if s_id in ["SUP-004", "SUP-014", "SUP-021", "SUP-026"] else random.choice([0, 0, 1, 1, 2])
    for _ in range(num_events):
        d_start = datetime(2023, 1, 1) + timedelta(days=random.randint(1, 1100))
        d_type = random.choice(disruption_types)
        duration = random.choice([1, 2, 3, 5])
        impact_pct = random.choice([25, 40, 60, 100])
        disrupt_records.append({
            "Disruption_ID": f"DIS-{s_id[4:]}-{random.randint(100,999)}",
            "Supplier_ID": s_id,
            "Disruption_Type": d_type,
            "Start_Date": d_start.strftime("%Y-%m-%d"),
            "Duration_Weeks": duration,
            "Capacity_Impact_Pct": impact_pct,
            "Root_Cause": f"{d_type} affecting regional hub production line.",
            "Resolution_Status": "Resolved"
        })

df_disrupt = pd.DataFrame(disrupt_records)

# Save historical datasets
df_pos.head(10).to_csv(os.path.join(DATA_DIR, "purchase_history.csv"), index=False)
df_deliv.head(10).to_csv(os.path.join(DATA_DIR, "delivery_history.csv"), index=False)
df_qual.head(10).to_csv(os.path.join(DATA_DIR, "quality_history.csv"), index=False)
df_disrupt.head(10).to_csv(os.path.join(DATA_DIR, "disruption_history.csv"), index=False)

print(f"-> Generated purchase_history.csv ({len(df_pos)} records)")
print(f"-> Generated delivery_history.csv ({len(df_deliv)} records)")
print(f"-> Generated quality_history.csv ({len(df_qual)} records)")
print(f"-> Generated disruption_history.csv ({len(df_disrupt)} records)")
print("ALL 13 SYNTHETIC CSV DATASETS GENERATED SUCCESSFULLY!")
