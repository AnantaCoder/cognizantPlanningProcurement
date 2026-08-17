import nbformat as nbf
import os

nb = nbf.v4.new_notebook()

text_1 = """\
# Supplier Risk Prediction Model Training

This notebook demonstrates the process of training the Machine Learning models used in the Procurement Intelligence Platform.
We use a **Gradient Boosting Classifier** to predict the probability of a supplier disruption and a **Random Forest Regressor** to predict the expected delay in weeks.

Let's begin by importing the necessary libraries and loading the synthetic historical data.
"""

code_1 = """\
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

# Path to the data directory
data_dir = '../backend/data'

print("Loading data...")
df_suppliers = pd.read_csv(os.path.join(data_dir, "supplier_master.csv"))
df_deliv = pd.read_csv(os.path.join(data_dir, "delivery_history.csv"))
df_qual = pd.read_csv(os.path.join(data_dir, "quality_history.csv"))
df_disrupt = pd.read_csv(os.path.join(data_dir, "disruption_history.csv"))
df_perf = pd.read_csv(os.path.join(data_dir, "supplier_performance.csv"))

print(f"Loaded {len(df_suppliers)} suppliers.")
"""

text_2 = """\
## Feature Engineering
We extract historical metrics for each supplier to serve as features for our models.
These features include on-time delivery rate, lead-time variability, defect rate, and financial stability score.
"""

code_2 = """\
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

    # Determine target labels
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

df_train = pd.DataFrame(records)
df_train.head()
"""

text_3 = """\
## Model Training & Evaluation
We split the data into training and testing sets, then train our models.
Note: Since the synthetic dataset is very small for demonstration purposes, we evaluate on the training set if necessary to avoid splitting errors.
"""

code_3 = """\
feature_names = [
    "on_time_rate", "avg_delay_days", "lead_time_variability",
    "defect_rate", "disruption_count", "capacity_utilization",
    "financial_score", "esg_score"
]

X = df_train[feature_names]
y_class = df_train["target_disrupted"]
y_delay = df_train["target_delay_weeks"]

if len(X) < 10:
    print("Dataset too small for train/test split. Using full dataset for evaluation.")
    X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = X, X, y_class, y_class, y_delay, y_delay
else:
    X_train, X_test, y_class_train, y_class_test, y_delay_train, y_delay_test = train_test_split(
        X, y_class, y_delay, test_size=0.2, random_state=42
    )

print("--- Training Risk Probability Classifier ---")
classifier = GradientBoostingClassifier(n_estimators=50, random_state=42)

if len(np.unique(y_class_train)) < 2:
    # Inject fake class for the sake of sklearn fitting if only 1 class exists in demo data
    fake_X = X_train.iloc[0:1].copy()
    fake_y = pd.Series([1 if y_class_train.iloc[0] == 0 else 0])
    classifier.fit(pd.concat([X_train, fake_X]), pd.concat([y_class_train, fake_y]))
else:
    classifier.fit(X_train, y_class_train)

y_class_pred = classifier.predict(X_test)
print(f"Classifier Accuracy: {accuracy_score(y_class_test, y_class_pred):.4f}")
print(f"Classifier F1 Score: {f1_score(y_class_test, y_class_pred, average='weighted', zero_division=0):.4f}")

print("\\n--- Training Delay Regressor ---")
delay_regressor = RandomForestRegressor(n_estimators=40, random_state=42)
delay_regressor.fit(X_train, y_delay_train)

y_delay_pred = delay_regressor.predict(X_test)
print(f"Regressor Mean Absolute Error (MAE): {mean_absolute_error(y_delay_test, y_delay_pred):.4f} weeks")
print(f"Regressor Mean Squared Error (MSE): {mean_squared_error(y_delay_test, y_delay_pred):.4f}")
"""

text_4 = """\
## Exporting the Models
We train the final models on the entire dataset and save them using `joblib` so that they can be loaded by the backend engine dynamically.
"""

code_4 = """\
import joblib

ml_models_dir = '../backend/ml_models'
os.makedirs(ml_models_dir, exist_ok=True)

print("Retraining on full dataset...")
if len(np.unique(y_class)) < 2:
    fake_X = X.iloc[0:1].copy()
    fake_y = pd.Series([1 if y_class.iloc[0] == 0 else 0])
    classifier.fit(pd.concat([X, fake_X]), pd.concat([y_class, fake_y]))
else:
    classifier.fit(X, y_class)
    
delay_regressor.fit(X, y_delay)

clf_path = os.path.join(ml_models_dir, "risk_classifier.joblib")
reg_path = os.path.join(ml_models_dir, "delay_regressor.joblib")

joblib.dump(classifier, clf_path)
joblib.dump(delay_regressor, reg_path)

print(f"Models saved successfully to:\\n{clf_path}\\n{reg_path}")
"""

nb['cells'] = [
    nbf.v4.new_markdown_cell(text_1),
    nbf.v4.new_code_cell(code_1),
    nbf.v4.new_markdown_cell(text_2),
    nbf.v4.new_code_cell(code_2),
    nbf.v4.new_markdown_cell(text_3),
    nbf.v4.new_code_cell(code_3),
    nbf.v4.new_markdown_cell(text_4),
    nbf.v4.new_code_cell(code_4)
]

output_path = os.path.join(os.path.dirname(__file__), 'Model_Training_Demonstration.ipynb')
with open(output_path, 'w') as f:
    nbf.write(nb, f)

print(f"Notebook created at: {output_path}")
