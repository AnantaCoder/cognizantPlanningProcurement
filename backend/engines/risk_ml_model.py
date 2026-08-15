import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class AIRiskPredictionEngine:
    def __init__(self, cleaned_dfs: Dict[str, pd.DataFrame]):
        self.df_suppliers = cleaned_dfs.get("supplier_master.csv", pd.DataFrame())
        self.df_capacity = cleaned_dfs.get("supplier_capacity.csv", pd.DataFrame())
        self.df_deliv = cleaned_dfs.get("delivery_history.csv", pd.DataFrame())
        self.df_qual = cleaned_dfs.get("quality_history.csv", pd.DataFrame())
        self.df_disrupt = cleaned_dfs.get("disruption_history.csv", pd.DataFrame())
        self.df_perf = cleaned_dfs.get("supplier_performance.csv", pd.DataFrame())
        self.df_materials = cleaned_dfs.get("material_master.csv", pd.DataFrame())

        self.classifier = GradientBoostingClassifier(n_estimators=50, random_state=42)
        self.delay_regressor = RandomForestRegressor(n_estimators=40, random_state=42)
        self.feature_names = [
            "on_time_rate", "avg_delay_days", "lead_time_variability",
            "defect_rate", "disruption_count", "capacity_utilization",
            "financial_score", "esg_score"
        ]
        self.feature_importances: Dict[str, float] = {}
        self.train_models()

    def train_models(self):
        """Prepares training features from historical logs and trains the ML models."""
        records = []
        for s_id in self.df_suppliers["Supplier_ID"].unique():
            # Get historical delivery stats
            delivs = self.df_deliv[self.df_deliv["Supplier_ID"] == s_id]
            quals = self.df_qual[self.df_qual["Supplier_ID"] == s_id]
            disrupts = self.df_disrupt[self.df_disrupt["Supplier_ID"] == s_id]
            perf = self.df_perf[self.df_perf["Supplier_ID"] == s_id]
            sup = self.df_suppliers[self.df_suppliers["Supplier_ID"] == s_id].iloc[0]

            if len(delivs) == 0:
                continue

            otd = (delivs["On_Time_Flag"].mean()) * 100.0
            avg_delay = float(delivs["Delay_Days"].mean())
            lt_var = float(delivs["Actual_Lead_Time_Weeks"].std()) if len(delivs) > 1 else 0.5
            defect = float(quals["Defect_Rate"].mean()) * 100.0 if len(quals) > 0 else 2.0
            disrupt_count = len(disrupts)
            cap_util = float(perf["Capacity_Utilization_Rate"].mean()) * 100.0 if len(perf) > 0 else 80.0
            fin_score = float(sup.get("Financial_Stability_Score", 80.0))
            esg = float(sup.get("ESG_Score", 75.0))

            # Disruption label (1 if disrupted or severe delay/quality failure)
            is_disrupted = 1 if (disrupt_count >= 2 or otd < 80.0 or defect > 5.0 or avg_delay > 4.0) else 0
            predicted_delay = max(0.2, (avg_delay / 7.0) + (disrupt_count * 0.6))

            records.append({
                "Supplier_ID": s_id,
                "on_time_rate": otd,
                "avg_delay_days": avg_delay,
                "lead_time_variability": lt_var,
                "defect_rate": defect,
                "disruption_count": disrupt_count,
                "capacity_utilization": cap_util,
                "financial_score": fin_score,
                "esg_score": esg,
                "target_disrupted": is_disrupted,
                "target_delay_weeks": predicted_delay
            })

        if not records:
            return

        df_train = pd.DataFrame(records)
        X = df_train[self.feature_names]
        y_class = df_train["target_disrupted"]
        y_delay = df_train["target_delay_weeks"]

        self.classifier.fit(X, y_class)
        self.delay_regressor.fit(X, y_delay)

        # Extract normalized feature importances
        raw_imp = self.classifier.feature_importances_
        self.feature_importances = {
            name: round(float(imp * 100.0), 1) for name, imp in zip(self.feature_names, raw_imp)
        }

    def predict_supplier_risks(self, 
                               material_id: Optional[str] = None,
                               low_threshold: float = 25.0,
                               med_threshold: float = 50.0,
                               high_threshold: float = 75.0) -> Dict[str, Any]:
        """Predicts disruption probability, delay in weeks, risk class, and generates natural language explanations."""
        supplier_risks = []

        # Filter by material if specified
        valid_suppliers = self.df_suppliers["Supplier_ID"].tolist()
        if material_id and material_id != "ALL":
            caps = self.df_capacity[self.df_capacity["Material_ID"] == material_id]
            valid_suppliers = caps["Supplier_ID"].unique().tolist()

        for s_id in valid_suppliers:
            sup_rows = self.df_suppliers[self.df_suppliers["Supplier_ID"] == s_id]
            if len(sup_rows) == 0:
                continue
            sup = sup_rows.iloc[0]

            delivs = self.df_deliv[self.df_deliv["Supplier_ID"] == s_id]
            quals = self.df_qual[self.df_qual["Supplier_ID"] == s_id]
            disrupts = self.df_disrupt[self.df_disrupt["Supplier_ID"] == s_id]
            perf = self.df_perf[self.df_perf["Supplier_ID"] == s_id]

            otd = float(delivs["On_Time_Flag"].mean() * 100.0) if len(delivs) > 0 else 85.0
            avg_delay = float(delivs["Delay_Days"].mean()) if len(delivs) > 0 else 2.0
            lt_var = float(delivs["Actual_Lead_Time_Weeks"].std()) if len(delivs) > 1 else 0.5
            defect = float(quals["Defect_Rate"].mean() * 100.0) if len(quals) > 0 else 2.0
            disrupt_count = len(disrupts)
            cap_util = float(perf["Capacity_Utilization_Rate"].mean() * 100.0) if len(perf) > 0 else 80.0
            fin_score = float(sup.get("Financial_Stability_Score", 80.0))
            esg = float(sup.get("ESG_Score", 75.0))

            feat_df = pd.DataFrame([{
                "on_time_rate": otd,
                "avg_delay_days": avg_delay,
                "lead_time_variability": lt_var,
                "defect_rate": defect,
                "disruption_count": disrupt_count,
                "capacity_utilization": cap_util,
                "financial_score": fin_score,
                "esg_score": esg
            }])

            # Predict probability
            prob = float(self.classifier.predict_proba(feat_df)[0][1] * 100.0)
            # Smooth with heuristics
            prob = np.clip(prob + (disrupt_count * 8.0) + (100.0 - otd) * 0.25 - (fin_score - 75.0) * 0.2, 5.0, 95.0)
            prob = round(float(prob), 1)

            # Predict delay weeks
            delay_weeks = round(float(self.delay_regressor.predict(feat_df)[0]), 1)

            # Determine Risk Class
            if prob >= high_threshold:
                risk_class = "CRITICAL" if prob >= 85.0 else "HIGH"
            elif prob >= med_threshold:
                risk_class = "HIGH"
            elif prob >= low_threshold:
                risk_class = "MEDIUM"
            else:
                risk_class = "LOW"

            # Generate dynamic data-driven WHY explanations
            reasons = []
            if otd < 80.0:
                reasons.append(f"On-time delivery dropped to {otd:.1f}% (industry benchmark >= 95%).")
            if lt_var > 1.2:
                reasons.append(f"High lead-time variance of {lt_var:.2f} weeks across maritime/air routes.")
            if disrupt_count >= 1:
                reasons.append(f"{disrupt_count} historical operational disruptions logged in past 24 months.")
            if cap_util > 90.0:
                reasons.append(f"Operating under severe capacity pressure ({cap_util:.1f}% utilization).")
            if defect > 3.0:
                reasons.append(f"Quality defect rate elevated at {defect:.2f}%.")
            if fin_score < 70.0:
                reasons.append(f"Financial stability index flagged at {fin_score:.1f}/100.")
            
            if not reasons:
                reasons.append("Consistent on-time deliveries, low variance, and stable operational profile.")

            supplier_risks.append({
                "supplier_id": s_id,
                "supplier_name": sup["Supplier_Name"],
                "country": sup["Country"],
                "tier": sup["Supplier_Tier"],
                "risk_probability": prob,
                "risk_class": risk_class,
                "predicted_delay_weeks": delay_weeks,
                "on_time_rate": round(otd, 1),
                "defect_rate": round(defect, 2),
                "disruptions_count": disrupt_count,
                "capacity_utilization": round(cap_util, 1),
                "financial_score": fin_score,
                "ai_explanation": " | ".join(reasons),
                "reasons_list": reasons
            })

        # Summary KPIs
        avg_risk = round(float(np.mean([s["risk_probability"] for s in supplier_risks])), 1) if supplier_risks else 0.0
        high_risk_count = sum(1 for s in supplier_risks if s["risk_class"] in ["HIGH", "CRITICAL"])
        class_dist = {
            "LOW": sum(1 for s in supplier_risks if s["risk_class"] == "LOW"),
            "MEDIUM": sum(1 for s in supplier_risks if s["risk_class"] == "MEDIUM"),
            "HIGH": sum(1 for s in supplier_risks if s["risk_class"] == "HIGH"),
            "CRITICAL": sum(1 for s in supplier_risks if s["risk_class"] == "CRITICAL")
        }

        return {
            "summary": {
                "total_suppliers_analyzed": len(supplier_risks),
                "average_risk_probability": avg_risk,
                "high_risk_supplier_count": high_risk_count,
                "class_distribution": class_dist,
                "thresholds": {
                    "low": low_threshold,
                    "medium": med_threshold,
                    "high": high_threshold
                }
            },
            "feature_importances": self.feature_importances,
            "supplier_risk_predictions": sorted(supplier_risks, key=lambda x: x["risk_probability"], reverse=True)
        }
