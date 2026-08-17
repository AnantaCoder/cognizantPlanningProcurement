import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

def train_and_save_models():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, "backend", "data")
    ml_models_dir = os.path.join(base_dir, "backend", "ml_models")
    
    os.makedirs(ml_models_dir, exist_ok=True)
    
    print(f"Loading data from {data_dir}...")
    try:
        df_suppliers = pd.read_csv(os.path.join(data_dir, "supplier_master.csv"))
        df_deliv = pd.read_csv(os.path.join(data_dir, "delivery_history.csv"))
        df_qual = pd.read_csv(os.path.join(data_dir, "quality_history.csv"))
        df_disrupt = pd.read_csv(os.path.join(data_dir, "disruption_history.csv"))
        df_perf = pd.read_csv(os.path.join(data_dir, "supplier_performance.csv"))
    except Exception as e:
        print(f"Error loading CSV files: {e}")
        print("Please ensure you have generated the mock data by running backend/data_generator.py first.")
        return

    print("Extracting features from historical logs...")
    records = []
    for s_id in df_suppliers["Supplier_ID"].unique():
        delivs = df_deliv[df_deliv["Supplier_ID"] == s_id]
        quals = df_qual[df_qual["Supplier_ID"] == s_id]
        disrupts = df_disrupt[df_disrupt["Supplier_ID"] == s_id]
        perf = df_perf[df_perf["Supplier_ID"] == s_id]
        sup = df_suppliers[df_suppliers["Supplier_ID"] == s_id].iloc[0]

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
        print("No valid records found for training.")
        return

    df_train = pd.DataFrame(records)
    
    feature_names = [
        "on_time_rate", "avg_delay_days", "lead_time_variability",
        "defect_rate", "disruption_count", "capacity_utilization",
        "financial_score", "esg_score"
    ]
    
    X = df_train[feature_names]
    y_class = df_train["target_disrupted"]
    y_delay = df_train["target_delay_weeks"]
    
    # We will evaluate on the training set if the dataset is too small
    if len(X) < 10:
        X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = X, X, y_class, y_class, y_delay, y_delay
    else:
        # Check if we have multiple classes in both sets, else just use the whole set
        if len(y_class.unique()) > 1:
            try:
                X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = train_test_split(
                    X, y_class, y_delay, test_size=0.2, random_state=42, stratify=y_class
                )
            except ValueError:
                X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = train_test_split(
                    X, y_class, y_delay, test_size=0.2, random_state=42
                )
        else:
            X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = train_test_split(
                X, y_class, y_delay, test_size=0.2, random_state=42
            )
    
    print("\n--- Training Supplier Risk Probability Model ---")
    classifier = GradientBoostingClassifier(n_estimators=50, random_state=42)
    # Check if multiple classes are present for training
    if len(np.unique(y_class_train)) < 2:
        print("Warning: Only one class found in target. The classifier might not learn properly.")
        # We can still fit if we enforce at least 2 classes, but sklearn will raise an error.
        # So we inject a fake row with the opposite class.
        fake_X = X_train.iloc[0:1].copy()
        fake_y = pd.Series([1 if y_class_train.iloc[0] == 0 else 0])
        X_train_mod = pd.concat([X_train, fake_X])
        y_class_train_mod = pd.concat([y_class_train, fake_y])
        classifier.fit(X_train_mod, y_class_train_mod)
    else:
        classifier.fit(X_train, y_class_train)
    
    y_class_pred = classifier.predict(X_test)
    acc = accuracy_score(y_class_test, y_class_pred)
    f1 = f1_score(y_class_test, y_class_pred, average='weighted', zero_division=0)
    
    print(f"Classifier Accuracy: {acc:.4f}")
    print(f"Classifier F1 Score: {f1:.4f}")
    
    print("\n--- Training Supplier Delay Prediction Model ---")
    delay_regressor = RandomForestRegressor(n_estimators=40, random_state=42)
    delay_regressor.fit(X_train, y_delay_train)
    
    y_delay_pred = delay_regressor.predict(X_test)
    mae = mean_absolute_error(y_delay_test, y_delay_pred)
    mse = mean_squared_error(y_delay_test, y_delay_pred)
    
    print(f"Regressor Mean Absolute Error: {mae:.4f} weeks")
    print(f"Regressor Mean Squared Error: {mse:.4f}")
    
    # Retrain on full dataset for production
    print("\nRetraining models on full dataset for production use...")
    if len(np.unique(y_class)) < 2:
        fake_X = X.iloc[0:1].copy()
        fake_y = pd.Series([1 if y_class.iloc[0] == 0 else 0])
        X_mod = pd.concat([X, fake_X])
        y_class_mod = pd.concat([y_class, fake_y])
        classifier.fit(X_mod, y_class_mod)
    else:
        classifier.fit(X, y_class)
        
    delay_regressor.fit(X, y_delay)
    
    clf_path = os.path.join(ml_models_dir, "risk_classifier.joblib")
    reg_path = os.path.join(ml_models_dir, "delay_regressor.joblib")
    
    joblib.dump(classifier, clf_path)
    joblib.dump(delay_regressor, reg_path)
    
    print(f"Saved risk_classifier to {clf_path}")
    print(f"Saved delay_regressor to {reg_path}")
    
if __name__ == "__main__":
    train_and_save_models()
