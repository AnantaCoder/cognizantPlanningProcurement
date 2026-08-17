import os
import sys
import pandas as pd

# Add current directory to path so we can import engines
sys.path.append(os.path.dirname(__file__))

from engines.data_cleaner import DataQualityEngine
from engines.risk_ml_model import AIRiskPredictionEngine
from engines.pulp_optimizer import MultiObjectiveAllocationEngine

def demonstrate_optimizer():
    print("="*60)
    print("PROCUREMENT OPTIMIZER DEMONSTRATION")
    print("="*60)
    
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    print("\n1. Initializing Data Engine...")
    data_cleaner = DataQualityEngine(data_dir)
    
    print("\n2. Initializing AI Risk Engine (Loading pre-trained models)...")
    risk_engine = AIRiskPredictionEngine(data_cleaner.cleaned_dfs)
    
    print("\n3. Initializing PuLP Optimizer Engine...")
    optimizer_engine = MultiObjectiveAllocationEngine(data_cleaner.cleaned_dfs, risk_engine)
    
    print("\n4. Running Multi-Objective Linear Programming Allocation...")
    print("   Objective: Minimize (Cost + Risk Penalty + Delay Penalty + Quality Penalty)")
    print("   Constraints: Capacity Limits, Max Dependency %, Contract Fulfillment, Net Demand")
    
    # We select a sample material to optimize. 
    # Let's get the first material in the master list.
    mats = data_cleaner.get_df("material_master.csv")
    if mats.empty:
        print("Error: No materials found in data.")
        return
        
    sample_mat = mats.iloc[0]["Material_ID"]
    sample_mat_name = mats.iloc[0]["Material_Name"]
    
    print(f"\nTarget Material: {sample_mat} ({sample_mat_name})")
    
    # Run the optimizer
    result = optimizer_engine.optimize_allocation(
        material_id=sample_mat,
        demand_multiplier=1.0,
        risk_weight=0.40,
        max_supplier_dependency_pct=60.0,
        enforce_contracts=True
    )
    
    print("\n" + "="*60)
    print("OPTIMIZATION RESULTS")
    print("="*60)
    print(f"Status: {result['optimization_status']}")
    print(f"Total Procurement Requirement: {result['summary']['total_procurement_requirement']} units")
    print(f"Total Allocated: {result['summary']['total_allocated_quantity']} units")
    print(f"Total Procurement Cost: ${result['summary']['total_procurement_cost_usd']:,.2f}")
    print(f"Average Weighted Risk: {result['summary']['average_weighted_risk']}%")
    print(f"Supplier Dependency Concentration: {result['summary']['supplier_dependency_pct']}% ({result['summary']['supplier_dependency_risk']})")
    
    print("\n--- ALLOCATION BREAKDOWN ---")
    for alloc in result['allocations']:
        print(f"\nSupplier: {alloc['supplier_name']} ({alloc['supplier_id']}, {alloc['country']})")
        print(f"  Allocated Qty: {alloc['allocated_quantity']:,} units ({alloc['allocation_percentage']}%)")
        print(f"  Spend: ${alloc['total_spend']:,.2f} @ ${alloc['unit_price']}/unit")
        print(f"  Capacity Utilized: {alloc['capacity_utilization_pct']}%")
        print(f"  AI Risk Class: {alloc['risk_class']} (Prob: {alloc['risk_probability']}%)")

if __name__ == "__main__":
    demonstrate_optimizer()
