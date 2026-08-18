# End-to-End Platform Roadmap: AI-Driven S&OP and Procurement

This document outlines the step-by-step flow of the prototype. Use this as your "script" or roadmap when presenting the architecture to stakeholders. It contains technical breakdowns, AI definitions, and practical examples for each phase.

---

## 🏗️ Phase 1: Foundation (Data Ingestion & Integrity)
**Goal:** Ensure the mathematical engines and ML models are fed with clean, reliable data.

1. **Multi-Source Ingestion (Layer 1):** 
   - The platform ingests 13 disparate datasets (CSV feeds) covering everything from historical retail demand and product margins to supplier lead times, plant capacities, and historical delivery logs.
2. **Automated Data Cleaning (Stage 00):** 
   - Raw data is rarely perfect. The engine automatically runs an integrity audit. 
   - **Operations performed:** Drops duplicate records, imputes missing values, and filters out extreme mathematical outliers using IQR techniques.
   > **💡 Example:** If a supplier's "Financial Stability Score" is blank in the raw feed, the system automatically imputes (fills in) the median score of 80 to keep the AI models running smoothly.

---

## 📈 Phase 2: Demand Intelligence
**Goal:** Figure out exactly how much raw material we actually need, based on reality, not flawed historical data.

3. **Censored Demand Unconstraining (Layer 2):**
   - **The Problem:** Historical sales data is flawed by stockouts (the "under-forecasting trap").
   - **The Solution (Mathematical Reconstruction):** When a product hits `0` inventory (stockout), sales drop to `0`. The engine identifies these stockout periods and mathematically reconstructs the "True Latent Demand." It calculates what the sales *would have been* using a localized rolling average of non-stockout days, modulated by 52-week seasonality multipliers and promotional indices.
   > **💡 Example:** We ran out of Winter Jackets on Wednesday. The raw data says we sold `0` on Thursday and Friday. Instead of forecasting `0` for next year, the Unconstraining Engine reconstructs those days to show `250` units of demand, saving us from under-ordering next season.

4. **Material Requirements Planning (Layer 3):**
   - The unconstrained demand is translated into a **Gross Material Requirement**.
   - The system applies the core MRP formula: `Net Requirement = Gross Requirement - Current Factory Inventory - Confirmed Incoming Supply`.

---

## 🧠 Phase 3: AI Supplier Risk Prediction
**Goal:** Evaluate which suppliers are safe to use before we assign them millions of dollars in orders.

5. **Machine Learning Evaluation (Layer 4):**
   - The engine utilizes a **Dual-Model AI Architecture**:
     - **Model 1: Gradient Boosting Classifier:** This predicts the *Probability of a Supply Chain Disruption*. (e.g., "85% chance of disruption").
     - **Model 2: Random Forest Regressor:** Yes, a Random Forest is used here! While the classifier predicts *if* a disruption will happen, the Random Forest Regressor predicts the *magnitude* of the disruption. It analyzes historical delay days and predicts exactly **how many weeks late** the shipment will be (e.g., "Predicted Delay: 2.5 weeks").
   - **Data Inputs:** The models analyze 8 historical features (Defect Rate, Capacity Utilization, On-Time Delivery, etc.).
   > **💡 Example:** Supplier "GlobalTex" is bidding on a contract. The AI sees they are running at 92% capacity. The Gradient Boosting model flags them as **CRITICAL RISK (88% probability)**, and the Random Forest predicts a **2.5 week delay**. 

---

## ⚙️ Phase 4: Multi-Objective Allocation
**Goal:** Decide exactly how to split the purchase orders across multiple suppliers to balance cost, risk, and capacity perfectly.

6. **The PuLP Mathematical Solver (Layer 5):**
   - **What is PuLP?** PuLP is a Python API for **Linear Programming (LP)**. The actual calculation backend it uses is CBC (COIN-OR Branch and Cut solver).
   - **What is Linear Programming?** It is a mathematical method used to find the best possible outcome (like maximum profit or lowest cost) in a mathematical model whose requirements are represented by linear relationships. It replaces human guesswork with absolute mathematical certainty.
   - **The Formula (Objective Function):** The solver minimizes the Total Effective Cost.
     `Min Σ (Effective Unit Cost × Quantity Allocated)`
     Where `Effective Unit Cost = Base Price + Risk Penalty + Delay Penalty + Quality Penalty`.
   - **The Constraints:** It must purchase the exact Net Requirement, respect factory capacity limits, and prevent single-source dependency (e.g., max 60% per supplier).
   > **💡 Example:** We need `10,000` yards. Supplier A is cheap ($10) but High Risk. Supplier B is expensive ($15) but reliable. PuLP calculates the risk penalties, mapping them onto a geometric hyperplane, and legally decides to buy `6,000` from B and `4,000` from A, giving us the mathematically perfect compromise.

---

## 🚀 Phase 5: Execution & Governance
**Goal:** Turn math into action and provide executive oversight.

7. **Purchase Order Execution (The Next Step):**
   - The mathematically perfect allocations from the PuLP solver are instantly converted into formal Purchase Orders (POs) in the prototype UI.
   - **Real-World Next Step:** In a production environment, this platform connects via API to a company's ERP system (like SAP Ariba, Oracle, or Microsoft Dynamics). The finalized PO data payload is transmitted to the ERP, which then automatically emails or sends an EDI (Electronic Data Interchange) document directly to the suppliers to officially trigger the manufacturing process.

8. **What-If Scenario Simulation (Governance):**
   - Executives can stress-test the supply chain dynamically.
   - **How it works (The Breakdown):**
     1. **The Trigger:** An executive clicks "Simulate Disruption" for Supplier X in the dashboard (e.g., simulating a shipping lane closure).
     2. **Constraint Update:** The system dynamically alters the math constraints (setting Supplier X's capacity to 0).
     3. **Solver Re-run:** The PuLP Linear Programming solver re-runs the entire complex mathematical optimization in milliseconds.
     4. **Delta Comparison:** The UI instantly outputs the "Delta"—the financial difference between the original plan and the new backup plan, showing exactly how much the crisis will cost the company and where the backup orders were safely routed.
