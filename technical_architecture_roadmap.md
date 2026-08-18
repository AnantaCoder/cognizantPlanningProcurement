# Technical Architecture & Future Enhancement Roadmap

This document provides a deep technical dive into the 5 phases of the S&OP and Procurement platform. For each phase, it outlines the **Current Technical Implementation** (what is currently built and functioning in the prototype) and the **Future Roadmap** (how this phase can be scaled and enhanced for an enterprise production environment).

---

## 🏗️ Phase 1: Foundation (Data Ingestion & Integrity)

### Current Technical Implementation
* **Data Layer:** The system ingests 13 relational datasets via flat CSV files (Demand, Product Master, Plant Capacity, etc.) representing a snapshot of enterprise data.
* **Cleaning Engine:** Implemented a pandas-driven preprocessing pipeline that executes upon load. 
* **Techniques Used:** 
  * Automatically drops duplicate primary keys.
  * Uses **Median Imputation** for missing continuous variables (e.g., filling a missing financial score with the dataset median) to ensure mathematical models don't fail on `null` constraints.
  * Uses **Interquartile Range (IQR)** to detect and clip extreme outliers that would otherwise skew the linear programming solver.

### Future Enhancements (Production Scaling)
* **Real-time Data Streaming:** Replace static CSV uploads with event-driven data streaming (e.g., Apache Kafka or AWS Kinesis) for live inventory updates.
* **Direct ERP/Data Warehouse Integration:** Connect directly to Snowflake, Databricks, or SAP HANA via APIs rather than relying on flat-file extracts.
* **Advanced Imputation:** Upgrade from simple median imputation to **K-Nearest Neighbors (KNN) Imputation**, which intelligently predicts what a missing value should be based on similar suppliers/materials.

---

## 📈 Phase 2: Demand Intelligence (Unconstraining & MRP)

### Current Technical Implementation
* **Censored Demand Engine:** Implemented mathematical reconstruction to fix the "under-forecasting trap." When `is_stockout == 1`, the system replaces the `$0` sales figure with a reconstructed demand integer. It calculates this using localized non-stockout rolling averages multiplied by 52-week category seasonality indices.
* **MRP Math Engine:** A deterministic logic engine (`demand_engine.py`) that calculates the exact procurement need using the formula: `Net Requirement = Gross Requirement - Current Factory Inventory - Confirmed Incoming Supply`.

### Future Enhancements (Production Scaling)
* **Live ML Forecasting:** Currently, the baseline forecast is fed via a file (`demand_forecast.csv`). In the future, we will build a live Time-Series Forecasting model (using **Facebook Prophet**, **ARIMA**, or an **LSTM Neural Network**) to dynamically predict future demand based purely on historical sales.
* **Exogenous Variable Integration:** Feed macroeconomic data (inflation rates, regional weather patterns, social media trends) into the demand forecasting model to make it hyper-responsive to global events.

---

## 🧠 Phase 3: AI Supplier Risk Prediction

### Current Technical Implementation
* **Dual-Model ML Architecture (`risk_ml_model.py`):**
  * **Model 1 (Classification):** A `GradientBoostingClassifier` trained on 8 historical features (Defect Rate, Capacity Utilization, On-Time Delivery, etc.) to predict the *Probability of Disruption*.
  * **Model 2 (Regression):** A `RandomForestRegressor` that predicts the exact *magnitude* of the disruption (e.g., "Expected Delay: 2.5 weeks").
* **NLG Explanations:** The system uses rule-based Natural Language Generation to translate the ML feature importances into readable English (e.g., "Risk flagged due to 92% capacity pressure").

### Future Enhancements (Production Scaling)
* **Geopolitical NLP Sentiment Engine:** Integrate an NLP (Natural Language Processing) web-scraper that reads global news APIs (Reuters, Bloomberg) in real-time. If it detects news about a port strike in a supplier's region, it instantly bumps their Risk Probability score.
* **IoT Telemetry Tracking:** Connect to live maritime APIs to track the exact GPS coordinates of shipping containers, adjusting the Random Forest delay prediction dynamically while the ship is in transit.

---

## ⚙️ Phase 4: Multi-Objective Allocation

### Current Technical Implementation
* **Linear Programming Solver (`pulp_optimizer.py`):** Utilizes the open-source **PuLP API** powered by the **CBC (COIN-OR Branch and Cut)** backend solver.
* **Objective Function:** Designed to minimize the `Total Effective Cost`, taking the Base Unit Price and adding dollar-value penalties for the AI-predicted Risk Probability, Delay Weeks, and Defect Rates.
* **Constraints Engine:** Strictly enforces Demand Satisfaction (Allocations == Net Requirement), Supplier Max Capacities, and a Maximum Dependency Constraint (no supplier gets >60% of the volume).

### Future Enhancements (Production Scaling)
* **Commercial Enterprise Solvers:** While CBC is great for prototypes, scaling to tens of thousands of SKUs and millions of variables requires swapping the CBC backend out for a commercial solver like **Gurobi** or **IBM CPLEX** for lightning-fast enterprise performance.
* **Stochastic Optimization:** Upgrade from deterministic linear programming to *stochastic* programming. Instead of optimizing for fixed numbers, the solver will optimize against a range of uncertainties (e.g., "Supplier A's capacity is between 3k and 4k").
* **Carbon Tracking Objective:** Add a new penalty variable into the objective function to minimize **Scope 3 Carbon Emissions**, legally enforcing sustainability goals alongside cost and risk.

---

## 🚀 Phase 5: Execution & Governance

### Current Technical Implementation
* **Scenario Simulation UI:** The frontend allows executives to run dynamic "What-If" scenarios. Clicking "Simulate Disruption" instantly alters the LP constraints (setting a supplier's capacity to 0) and re-runs the PuLP solver to output the financial delta.
* **PO Payload Generation:** The optimal allocations are formatted into JSON-ready Purchase Order structures.

### Future Enhancements (Production Scaling)
* **Bi-Directional ERP Write-Back:** Build out outbound API connectors. Once an executive approves the PuLP allocations, the system will automatically push the POs into SAP Ariba or Oracle ERP via REST APIs, which will then generate and fire EDIs directly to the suppliers.
* **Automated Approval Workflows:** Implement Role-Based Access Control (RBAC). If the PuLP solver's total cost is under a certain financial threshold, the POs are executed autonomously. If it exceeds the threshold (or if the dependency risk is flagged as CRITICAL), it requires a human-in-the-loop multi-signature approval.
