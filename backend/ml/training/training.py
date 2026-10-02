import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import pickle
import os
import json

def mean_absolute_percentage_error(y_true, y_pred): 
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

def train_model():
    data_path = r"D:\antartic\data\processed\modeling_data.csv"
    df = pd.read_csv(data_path)
    
    # Sort by date
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # Define features
    target = 'fuel_consumption_litres'
    features = [c for c in df.columns if c not in [target, 'date', 'year']]
    
    print(f"Features: {features}")
    
    # Time-based split:
    # Let's say 1993-2008 Training (approx 70%)
    # 2009-2012 Validation (approx 15%)
    # 2013-2016 Testing (approx 15%)
    
    train = df[df['year'] <= 2008]
    val = df[(df['year'] > 2008) & (df['year'] <= 2012)]
    test = df[df['year'] > 2012]
    
    X_train, y_train = train[features], train[target]
    X_val, y_val = val[features], val[target]
    X_test, y_test = test[features], test[target]
    
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=4,
        random_state=42,
        early_stopping_rounds=10
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    # Predict
    y_pred_test = model.predict(X_test)
    
    # Baselines
    # Naive: Previous month (fuel_lag_1)
    naive_pred = test['fuel_lag_1']
    
    # Seasonal Naive: Same month last year. We can approximate by shifting 12 months.
    # Since test data might not perfectly align with shift 12, we can fetch it from df
    # but for simplicity, we'll just evaluate naive baseline.
    
    def evaluate(y, pred, name):
        mae = mean_absolute_error(y, pred)
        rmse = np.sqrt(mean_squared_error(y, pred))
        mape = mean_absolute_percentage_error(y, pred)
        r2 = r2_score(y, pred)
        return {"MAE": float(mae), "RMSE": float(rmse), "MAPE": float(mape), "R2": float(r2)}
        
    metrics = {
        "ML_Model": evaluate(y_test, y_pred_test, "XGBoost"),
        "Naive_Baseline": evaluate(y_test, naive_pred, "Naive (Lag 1)")
    }
    
    # Feature Importance
    importance = pd.DataFrame({
        'feature': features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    # Save Model
    model_dir = r"D:\antartic\backend\models"
    os.makedirs(model_dir, exist_ok=True)
    with open(os.path.join(model_dir, 'xgb_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
        
    # Save test predictions for visualization
    test_results = test[['date', 'year', 'month', target]].copy()
    test_results['predicted'] = y_pred_test
    test_results['naive'] = naive_pred
    test_results.to_csv(os.path.join(model_dir, 'test_predictions.csv'), index=False)
    
    # Save metrics and feature importance
    with open(os.path.join(model_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=4)
        
    importance.to_csv(os.path.join(model_dir, 'feature_importance.csv'), index=False)
    
    print("Training complete. Metrics:")
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    train_model()
