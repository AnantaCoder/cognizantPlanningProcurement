# Cognizant Planning & Procurement Prototype

An advanced AI-driven, multi-backend Sales and Operations Planning (S&OP) and Procurement system. This prototype orchestrates everything from raw data ingestion and S&OP planning down to AI-predicted supplier risk evaluation and mathematically optimized Purchase Order (PO) allocations.

---

## 📖 Overview

The Cognizant Planning & Procurement prototype tackles the "under-forecasting trap" and supply chain disruptions by breaking the architecture down into three focused domains:

1. **Planning System (P2):** Establishes the data foundation by ingesting demand signals, sanitizing data, calculating gross material requirements, and managing internal supply/inventory buffers.
2. **Middleware & Governance:** The critical bridge that processes net material requirements, manages scenario/disruption testing (What-If analysis), and hosts the Executive Dashboard.
3. **Procurement System (PR1):** Handles vendor evaluations, leverages Machine Learning to assess supplier disruption risks, runs Multi-Objective Solvers (PuLP) to allocate volume, and prepares final PO execution payloads.

## ✨ Key Features & Technical Highlights

* **Censored Demand Engine:** Reconstructs historical stockout periods mathematically using rolling averages and seasonality indices to prevent under-forecasting.
* **AI Supplier Risk Prediction:** Employs a Dual-Model ML architecture:
  * *Classification Model* (GradientBoosting) to predict disruption probability based on metrics like Defect Rates and Capacity Utilization.
  * *Regression Model* (RandomForest) to predict the exact magnitude of supply delays.
  * *Natural Language Generation (NLG)* to provide English explanations for risk flags.
* **Multi-Objective Allocation (PuLP Solver):** A linear programming engine that minimizes total effective costs (base price + AI risk penalties + defect penalties) while strictly enforcing volume capacities and maximum supplier dependency limits.
* **Dynamic Scenario Simulation:** Enables executives to simulate real-world disruptions (e.g., Supplier Capacity drops to 0) to instantly re-calculate optimal PO allocations and understand financial deltas.
* **Automated Data Cleaning:** Implements pandas-driven pipelines executing Median Imputation for missing values and Interquartile Range (IQR) strategies for outlier detection on CSV datasets.

## 🏗️ Architecture Structure

The repository is structured to simulate a microservice-like environment tailored for S&OP optimization:

* `frontend/`: The user interface and Executive Dashboard for interacting with simulations and reviewing PO allocations.
* `backend/`: The core API layers that manage the P2, Middleware, and PR1 operational logic.
* `model_training/`: The machine learning pipeline, including model architecture, training data processing, and inference endpoints.
* *Detailed Documentation:* Refer to `WORKFLOW.md` and `technical_architecture_roadmap.md` for in-depth mermaid diagrams, component breakdowns, and the enterprise scaling roadmap.

## 🚀 Getting Started

*(Instructions for local setup, environment installation, and running the prototype should be placed here depending on the active stack, e.g., Python requirements, Node.js installation, etc.)*

### Prerequisites
* Python 3.x for Backend and AI Models
* Node.js / NPM for the Frontend
* Additional requirements found in `backend/requirements.txt` (or equivalent) and `frontend/package.json`.

### Local Execution
1. Install backend dependencies and run the server.
2. Install frontend dependencies and start the UI server.
3. Access the Executive Dashboard via your local browser.

---

## 🔮 Future Roadmap (Enterprise Scale)
The prototype is designed with an upgrade path toward full enterprise capability, including:
* Transitioning from static CSV ingestion to live data streaming via Kafka/Kinesis.
* Swapping CBC solvers for enterprise engines like Gurobi or IBM CPLEX.
* Integrating Bi-Directional ERP Write-Back for SAP Ariba/Oracle to execute POs automatically.
* Enhancing AI models with NLP sentiment analysis on global news and IoT maritime tracking.

*(See `technical_architecture_roadmap.md` for full roadmap details)*
