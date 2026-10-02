from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
import os
from .simulation import generate_synthetic_load, estimate_solar_generation, run_optimization

app = FastAPI(title="Polar Energy Intelligence Center API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScenarioRequest(BaseModel):
    scenario: str = "NORMAL"
    battery_capacity_kWh: float = 500.0
    initial_SOC: float = 0.8
    minimum_SOC: float = 0.2
    maximum_SOC: float = 0.95
    charge_efficiency: float = 0.9
    discharge_efficiency: float = 0.9
    maximum_discharge_power: float = 200.0
    generator_capacity_kW: float = 300.0
    fuel_consumption_rate: float = 0.3 # liters per kWh

@app.get("/api/stations")
def get_stations():
    return [{"id": "mawson", "name": "Mawson", "lat": -67.6, "lon": 62.87}]

@app.get("/api/fuel/history")
def get_fuel_history():
    data_path = r"D:\antartic\data\processed\modeling_data.csv"
    if not os.path.exists(data_path):
        return []
    df = pd.read_csv(data_path)
    # Return last 24 months for chart
    hist = df.tail(24)[['date', 'fuel_consumption_litres']].to_dict(orient='records')
    return hist

@app.get("/api/model/metrics")
def get_model_metrics():
    metrics_path = r"D:\antartic\backend\models\metrics.json"
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    return {}

@app.get("/api/model/features")
def get_model_features():
    path = r"D:\antartic\backend\models\feature_importance.csv"
    if os.path.exists(path):
        df = pd.read_csv(path)
        return df.to_dict(orient='records')
    return []

@app.get("/api/fuel/forecast")
def get_forecast():
    path = r"D:\antartic\backend\models\test_predictions.csv"
    if os.path.exists(path):
        df = pd.read_csv(path)
        # Return a subset
        return df.tail(12).to_dict(orient='records')
    return []

@app.post("/api/simulation")
def run_scenario(req: ScenarioRequest):
    load_df = generate_synthetic_load(24, req.scenario)
    solar_profile = estimate_solar_generation(None, req.scenario)
    
    batt_params = {
        'battery_capacity_kWh': req.battery_capacity_kWh,
        'initial_SOC': req.initial_SOC,
        'minimum_SOC': req.minimum_SOC,
        'maximum_SOC': req.maximum_SOC,
        'charge_efficiency': req.charge_efficiency,
        'discharge_efficiency': req.discharge_efficiency,
        'maximum_discharge_power': req.maximum_discharge_power
    }
    
    gen_params = {
        'generator_capacity_kW': req.generator_capacity_kW,
        'fuel_consumption_rate': req.fuel_consumption_rate
    }
    
    results = run_optimization(load_df, solar_profile, batt_params, gen_params, req.scenario)
    
    # Calculate summaries
    total_fuel = sum([r['fuel_used_litres'] for r in results])
    total_demand = sum([r['demand'] for r in results])
    critical_reliability = sum([r['critical_served'] for r in results]) / sum([r['critical_demand'] for r in results]) * 100
    solar_utilization = sum([r['solar'] - r['unused_solar'] for r in results]) / (sum([r['solar'] for r in results]) + 1e-6) * 100
    
    return {
        "scenario": req.scenario,
        "hourly_results": results,
        "summary": {
            "total_fuel_litres": total_fuel,
            "total_demand_kWh": total_demand,
            "critical_reliability_percent": critical_reliability,
            "solar_utilization_percent": solar_utilization
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
