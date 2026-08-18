# Judge Q&A Preparation Guide

During your presentation, judges will test your understanding of both the **business (Supply Chain)** logic and the **engineering (Technical)** implementation. 

This document provides the most likely questions they will ask, along with strong, confident answers designed for a Team Leader and Systems Architect.

---

## 🏗️ Technical & Architecture Questions

### 1. Why did you choose FastAPI for the backend instead of Flask or Django?
**The Trap:** They want to see if you just picked a random framework or if there was an architectural reason.
**Your Answer:** 
> "We chose FastAPI specifically for its asynchronous processing capabilities and speed. Supply chain optimization—specifically running PuLP Linear Programming and XGBoost ML models simultaneously—is computationally heavy. FastAPI allows us to handle these concurrent operations without blocking the main thread, making our 'What-If' scenario recalculations almost instant."

### 2. Why use XGBoost / Gradient Boosting for Risk Prediction instead of Deep Learning / Neural Networks?
**The Trap:** Buzzword checking. Neural networks sound cool, but are bad for this specific task.
**Your Answer:**
> "Neural networks are great for images and text, but for structured, tabular supply chain data (like delivery times, defect rates, and capacities), tree-based models like XGBoost and Gradient Boosting mathematically outperform them. More importantly, XGBoost gives us *Feature Importance*—meaning we can explain exactly *why* the AI flagged a supplier as risky. In enterprise procurement, you can't rely on a 'black box'; buyers need to know the 'why'."

### 3. How does your PuLP Optimization Engine actually work? Why not just write a script that sorts suppliers by price?
**The Trap:** Checking if you understand Linear Programming vs. simple heuristics (greedy algorithms).
**Your Answer:**
> "A simple sorting script falls into the 'cheapest supplier trap.' It might buy everything from the cheapest supplier, completely ignoring the fact that they have an 80% risk of disruption. 
> Our PuLP engine runs a Mixed-Integer Linear Programming solver. Our objective function mathematically minimizes: **(Unit Price) + (Risk Penalty) + (Delay Penalty) + (Quality Penalty)**. It guarantees the mathematically optimal split across multiple suppliers while strictly adhering to capacity limits and Minimum Order Quantities (MOQs)."

### 4. How are you handling Data Quality and missing data? 
*(Referencing your Phase 1 Architecture)*
**The Trap:** Real enterprise data is always messy. They want to know your system doesn't crash on bad data.
**Your Answer:**
> "We built a dedicated Pandas preprocessing pipeline that runs upon data ingestion. It handles duplicates, but more importantly, it handles missing continuous variables using **Median Imputation**. For example, if a supplier is missing a financial stability score, the system injects the dataset median so the ML models don't crash on a `null` value. It ensures mathematical continuity."

---

## 📦 Supply Chain & Business Logic Questions

### 5. What exactly is NPR and why is it the core of your platform?
**The Trap:** Testing your fundamental supply chain knowledge.
**Your Answer:**
> "NPR stands for **Net Procurement Requirement**. It's the formula that keeps a company from going bankrupt due to excess inventory. 
> `NPR = Gross Material Requirement - Current Inventory - Confirmed Incoming Supply`. 
> Our system calculates this precisely. By netting out what we already hold in the warehouse and what's currently on ships, we only spend capital on what we *strictly* need."

### 6. Why use a simple Gaussian Distribution for baseline demand instead of an AI model?
**The Trap:** Testing if you know when *not* to use AI.
**Your Answer:**
> "We use AI heavily for Risk Prediction, but for baseline demand of established products, real-world supply chains follow standard normal (Gaussian) distributions. Using a highly complex AI for baseline demand often leads to 'overfitting'—where the model chases random market noise. Gaussian distribution gives us a highly stable, mathematically proven baseline that we then adjust with our seasonal multipliers. It's about using the right mathematical tool for the right job."

### 7. How does this platform handle the "Cheapest Supplier Trap"?
**The Trap:** Checking the business value of your optimization engine.
**Your Answer:**
> "The cheapest supplier trap happens when procurement buys solely on invoice price, but ends up paying millions in expedited air-freight when that cheap supplier delays the shipment. 
> We solve this by calculating the **Total Landed Risk-Adjusted Cost**. If Supplier B is $2 cheaper per unit, but our XGBoost model flags them with an 85% disruption probability, our PuLP solver applies a mathematical penalty to their cost. The engine will automatically reallocate the volume to a slightly more expensive, but highly reliable Supplier A, saving the business money in the long run."

### 8. What happens if a massive disruption occurs—like a port strike or typhoon?
**The Trap:** Testing the agility of the system.
**Your Answer:**
> "Traditional supply chains take days or weeks of spreadsheet math to recover from a massive disruption. In our platform, a planner simply opens the **What-If Scenario Simulation**. They input that the primary supplier's capacity just dropped by 80%. Our FastAPI backend instantly feeds this new constraint into the PuLP solver, which recalculates the entire global allocation and spits out the most cost-effective backup plan in seconds."

---

### 💡 General Tips for Answering:
1. **Don't Be Afraid of the Math:** If they ask a tough question, fall back on the math. Remind them that the system relies on statistical formulas and linear programming, not just "magic AI."
2. **"Yes, and...":** If a judge points out a flaw (e.g., "What about sudden viral trends?"), agree with them and point to the future roadmap. *"That's a great point. Currently, we use Gaussian baselines and seasonal multipliers, but addressing viral trends is exactly why we have GenAI integration and IoT tracking on our Future Roadmap."*
