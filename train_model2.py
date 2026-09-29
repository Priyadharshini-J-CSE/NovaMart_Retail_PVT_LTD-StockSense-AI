"""
Model 2 — XGBoost Stock-out Risk Classifier
NovaMart Retail Pvt. Ltd. | StockSense | IntelliData 2026

Target: stockout_flag (binary: 1 = at risk, 0 = safe)
Output files saved to data/model2/
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
    confusion_matrix
)
from xgboost import XGBClassifier

# ── Paths ──────────────────────────────────────────────────────────────────
BASE   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(BASE, 'data')
OUT    = os.path.join(DATA, 'model2')
os.makedirs(OUT, exist_ok=True)

# ── Load CSVs ──────────────────────────────────────────────────────────────
print("Loading data...")
transactions    = pd.read_csv(os.path.join(DATA, 'transactions.csv'))
products        = pd.read_csv(os.path.join(DATA, 'products.csv'))
stores          = pd.read_csv(os.path.join(DATA, 'stores.csv'))
inventory       = pd.read_csv(os.path.join(DATA, 'inventory.csv'))
external        = pd.read_csv(os.path.join(DATA, 'external_factors.csv'))

# ── Data Cleaning ──────────────────────────────────────────────────────────
print("Cleaning data...")

# Transactions: remove duplicates and invalid qty
transactions = transactions.drop_duplicates(subset='transaction_id')
transactions = transactions[transactions['qty'] > 0]
transactions['revenue'] = transactions['qty'] * transactions['price'] * (1 - transactions['disc%'].fillna(0) / 100)

# Products: normalize category casing
products['category'] = products['category'].str.strip().str.title()

# Inventory: flag balance mismatches
inventory['expected_closing'] = inventory['opening'] + inventory['received'] - inventory['sold']
inventory['balance_mismatch'] = (abs(inventory['expected_closing'] - inventory['closing']) > 0.01).astype(int)

# External: fill missing values
external['temp_c']  = external['temp_c'].fillna(external['temp_c'].median())
external['rain_mm'] = external['rain_mm'].fillna(0)

# ── Build daily Store × Product features ──────────────────────────────────
print("Building features...")

# Daily sales aggregation
daily_sales = (
    transactions
    .groupby(['date', 'store_id', 'product_id'])
    .agg(
        daily_qty     = ('qty', 'sum'),
        daily_revenue = ('revenue', 'sum'),
        discount_pct  = ('disc%', 'mean'),
        promotion_flag= ('promo', 'max'),
    )
    .reset_index()
)

# Merge inventory
inv = inventory.rename(columns={'store': 'store_id', 'product': 'product_id'})
df = inv.merge(daily_sales, on=['date', 'store_id', 'product_id'], how='left')
df['daily_qty']      = df['daily_qty'].fillna(0)
df['daily_revenue']  = df['daily_revenue'].fillna(0)
df['discount_pct']   = df['discount_pct'].fillna(0)
df['promotion_flag'] = df['promotion_flag'].fillna(0)

# Merge products
df = df.merge(products[['product_id','category','brand','shelf_life','cost']], on='product_id', how='left')
df = df.rename(columns={'shelf_life': 'shelf_life_days'})

# Merge stores
df = df.merge(stores[['store_id','city','store_type']], on='store_id', how='left')

# Merge external factors
df = df.merge(external, on=['date','city'], how='left')
df['temp_c']      = df['temp_c'].fillna(df['temp_c'].median())
df['rain_mm']     = df['rain_mm'].fillna(0)
df['holiday']     = df['holiday'].fillna(0)
df['festival']    = df['festival'].fillna(0)
df['weekend']     = df['weekend'].fillna(0)
df['local_event'] = df['local_event'].fillna(0)

# ── Date features ──────────────────────────────────────────────────────────
df['date']        = pd.to_datetime(df['date'])
df['day_of_week'] = df['date'].dt.dayofweek
df['month']       = df['date'].dt.month
df['week_no']     = df['date'].dt.isocalendar().week.astype(int)
df['weekend_flag']= df['date'].dt.dayofweek.isin([5, 6]).astype(int)

# ── Inventory-derived features ─────────────────────────────────────────────
df['reorder_gap']            = df['closing'] - df['reorder_lvl']
df['stock_ratio']            = np.where(df['reorder_lvl'] > 0, df['closing'] / df['reorder_lvl'], 2.0)
df['days_of_inventory']      = np.where(df['daily_qty'] > 0, df['closing'] / df['daily_qty'], df['closing'])
df['inventory_to_demand_ratio'] = np.where(df['daily_qty'] > 0, df['closing'] / df['daily_qty'], 999)

# ── Lag features (sort first) ──────────────────────────────────────────────
df = df.sort_values(['store_id', 'product_id', 'date'])
grp = df.groupby(['store_id', 'product_id'])['daily_qty']
df['lag_1']           = grp.shift(1).fillna(0)
df['lag_7']           = grp.shift(7).fillna(0)
df['rolling_mean_7']  = grp.transform(lambda x: x.shift(1).rolling(7,  min_periods=1).mean()).fillna(0)
df['rolling_mean_14'] = grp.transform(lambda x: x.shift(1).rolling(14, min_periods=1).mean()).fillna(0)
df['rolling_std_7']   = grp.transform(lambda x: x.shift(1).rolling(7,  min_periods=1).std()).fillna(0)

# ── Target: stockout_flag ──────────────────────────────────────────────────
# Use a tiered definition to create realistic class distribution:
# 1 = at risk: closing stock < 1.5x reorder level (approaching stockout)
# 0 = safe:    closing stock >= 1.5x reorder level
df['stock_ratio']   = np.where(df['reorder_lvl'] > 0, df['closing'] / df['reorder_lvl'], 2.0)
df['stockout_flag'] = (df['stock_ratio'] < 1.5).astype(int)

# Stockout probability based on stock ratio
df['stockout_probability'] = np.where(
    df['stock_ratio'] < 1.0,  np.clip(0.85 + (1.0 - df['stock_ratio']) * 0.15, 0.7, 1.0),
    np.where(df['stock_ratio'] < 1.5, 0.4 + (1.5 - df['stock_ratio']) * 0.6, 0.2)
)

print(f"Dataset shape: {df.shape}")
print(f"Stockout rate: {df['stockout_flag'].mean():.2%}")

# ── Encode categoricals ────────────────────────────────────────────────────
le_cat       = LabelEncoder()
le_store_type= LabelEncoder()
le_brand     = LabelEncoder()

df['category_enc']   = le_cat.fit_transform(df['category'].fillna('Unknown'))
df['store_type_enc'] = le_store_type.fit_transform(df['store_type'].fillna('Unknown'))
df['brand_enc']      = le_brand.fit_transform(df['brand'].fillna('Unknown'))

# ── Feature matrix ─────────────────────────────────────────────────────────
FEATURES = [
    'day_of_week', 'weekend_flag', 'month', 'week_no',
    'festival', 'holiday', 'local_event', 'weekend',
    'lag_1', 'lag_7', 'rolling_mean_7', 'rolling_mean_14', 'rolling_std_7',
    'days_of_inventory', 'inventory_to_demand_ratio', 'reorder_gap',
    'stock_ratio', 'discount_pct', 'promotion_flag',
    'temp_c', 'rain_mm',
    'category_enc', 'store_type_enc', 'brand_enc',
    'lead_days', 'balance_mismatch',
]

# Drop rows with NaN in features
df_model = df[FEATURES + ['stockout_flag', 'date', 'store_id', 'product_id', 'closing', 'reorder_lvl', 'stockout_probability']].dropna()

X = df_model[FEATURES]
y = df_model['stockout_flag']

print(f"Model dataset: {X.shape[0]} rows, {X.shape[1]} features")
print(f"Class distribution: {y.value_counts().to_dict()}")

# ── Train / Test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
)

# ── XGBoost Classifier ─────────────────────────────────────────────────────
print("\nTraining XGBoost classifier...")

scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)

model = XGBClassifier(
    n_estimators      = 200,
    max_depth         = 5,
    learning_rate     = 0.05,
    subsample         = 0.8,
    colsample_bytree  = 0.8,
    scale_pos_weight  = scale_pos_weight,
    use_label_encoder = False,
    eval_metric       = 'logloss',
    random_state      = 42,
    n_jobs            = -1,
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

# ── Evaluate ───────────────────────────────────────────────────────────────
y_pred      = model.predict(X_test)
y_prob      = model.predict_proba(X_test)[:, 1]

acc   = accuracy_score(y_test, y_pred)
prec  = precision_score(y_test, y_pred, zero_division=0)
rec   = recall_score(y_test, y_pred, zero_division=0)
f1    = f1_score(y_test, y_pred, zero_division=0)
try:
    roc = roc_auc_score(y_test, y_prob)
except Exception:
    roc = 0.0

print("\n=== XGBoost Classification Results ===")
print(f"Accuracy:  {acc:.4f}")
print(f"Precision: {prec:.4f}")
print(f"Recall:    {rec:.4f}")
print(f"F1-Score:  {f1:.4f}")
print(f"ROC-AUC:   {roc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ── Feature Importance ─────────────────────────────────────────────────────
importance_df = pd.DataFrame({
    'feature':    FEATURES,
    'importance': model.feature_importances_,
}).sort_values('importance', ascending=False)

print("\nTop 10 Feature Importances:")
print(importance_df.head(10).to_string(index=False))

# ── Full dataset predictions ───────────────────────────────────────────────
print("\nGenerating predictions for full dataset...")
df_model = df_model.copy()
df_model['predicted_stockout_flag']        = model.predict(X)
df_model['predicted_stockout_probability'] = model.predict_proba(X)[:, 1]
df_model['risk_level'] = pd.cut(
    df_model['predicted_stockout_probability'],
    bins=[-0.001, 0.4, 0.7, 1.001],
    labels=['Low', 'Medium', 'High']
)

# ── Save outputs ───────────────────────────────────────────────────────────
print("\nSaving outputs...")

# 1. Model pickle
joblib.dump(model, os.path.join(OUT, 'model2_xgb_classifier.pkl'))

# 2. Label encoders
joblib.dump({
    'category':   le_cat,
    'store_type': le_store_type,
    'brand':      le_brand,
}, os.path.join(OUT, 'model2_encoders.pkl'))

# 3. Metrics JSON
metrics = {
    'model':     'XGBoost Classifier',
    'target':    'stockout_flag',
    'features':  FEATURES,
    'n_train':   int(len(X_train)),
    'n_test':    int(len(X_test)),
    'accuracy':  round(acc  * 100, 2),
    'precision': round(prec * 100, 2),
    'recall':    round(rec  * 100, 2),
    'f1':        round(f1   * 100, 2),
    'roc_auc':   round(roc  * 100, 2),
    'scale_pos_weight': round(float(scale_pos_weight), 4),
}
with open(os.path.join(OUT, 'model2_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)

# 4. Feature importance CSV
importance_df.to_csv(os.path.join(OUT, 'model2_feature_importance.csv'), index=False)

# 5. Predictions CSV
out_cols = ['date', 'store_id', 'product_id', 'closing', 'reorder_lvl',
            'stockout_flag', 'predicted_stockout_flag',
            'predicted_stockout_probability', 'risk_level']
df_model[out_cols].to_csv(os.path.join(OUT, 'model2_predictions.csv'), index=False)

print(f"\nModel 2 (XGBoost) training complete!")
print(f"   Outputs saved to: {OUT}")
print(f"   model2_xgb_classifier.pkl")
print(f"   model2_encoders.pkl")
print(f"   model2_metrics.json")
print(f"   model2_feature_importance.csv")
print(f"   model2_predictions.csv")
