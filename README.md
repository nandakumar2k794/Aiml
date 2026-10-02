# AI-Driven Smart Energy Management System for Polar Research Stations

## 1. Problem Statement
**SIH Problem Statement 26061**
Organization: Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)
Category: Software | Theme: Clean & Green Technology

**Core Problem:** Develop an intelligent energy-management system for polar research stations that uses AI to forecast energy/fuel requirements, integrate renewable energy, optimize battery/generator usage, reduce unnecessary fuel consumption, and remain reliable under extreme polar conditions.

## 2. Solution Overview
This repository contains a functional software prototype demonstrating an end-to-end energy management intelligence system. It uses actual historical Antarctic weather and fuel usage data combined with AI forecasting, and pairs this with a configurable simulation engine for battery and diesel generator dispatch.

## 3. Architecture
```text
REAL ANTARCTIC DATA
↓
DATA VALIDATION
↓
TEMPORAL AGGREGATION
↓
FEATURE ENGINEERING
↓
ML FORECASTING (XGBoost)
↓
RENEWABLE ESTIMATION (Simulated Solar PV)
↓
ENERGY-RISK ANALYSIS
↓
OPTIMIZATION (Mixed Dispatch logic)
↓
BATTERY / DIESEL SIMULATION
↓
REACT DASHBOARD
```

## 4. Dataset Sources
- **DATASET A:** Monthly fuel usage of the generator sets and boilers at Mawson Station (Indicator 56).
- **DATASET B:** Antarctic Automatic Weather Station (AWS) data (IMAU_ANT_AWS19), providing meteorological observations (temperature, wind, radiation, pressure) aligned temporally with the fuel data.

## 5. Data Preprocessing & 6. ML Methodology
The raw datasets were validated, temporally aligned by month, and merged. Missing values were imputed using historical medians.
We utilized **XGBoost** for time-series forecasting. The model predicts the following month's fuel consumption based on meteorological features (temperature, wind speed/direction, solar radiation) and historical fuel consumption lags. A strict time-based train/validation/test split was used to prevent data leakage.

## 7. Forecasting
The frontend provides a `Forecast` page which visualizes the XGBoost model's performance on the unseen test set, alongside a naive baseline (previous month's consumption).

## 8. Optimization & 9. Battery Simulation & 10. Extreme-Weather Module
The optimization engine (Simulation Page) tests 24-hour scenarios such as:
1. **NORMAL:** Standard polar day operations.
2. **LOW SOLAR / SNOWSTORM:** High heating demand, 90% reduction in solar availability.
3. **SEVERE SHORTAGE:** Extremely high demand, 95% reduction in solar availability.

The optimizer strictly prioritizes **CRITICAL LOAD** (life-support, communications) over flexible load. It manages a configurable simulated battery system to maximize renewable utilization and minimize diesel runtime.

## 11. Frontend
A React + Vite frontend built with TailwindCSS and Recharts. The design uses a professional scientific control dashboard aesthetic (Navy, White, Cyan).

## 12. API
The FastAPI backend exposes the following endpoints:
- `GET /api/stations`
- `GET /api/fuel/history`
- `GET /api/fuel/forecast`
- `POST /api/simulation`
- `GET /api/model/metrics`
- `GET /api/model/features`

## 13. Evaluation & 14. Assumptions & 15. Limitations
**REAL vs SIMULATED:**
- **REAL:** The historical fuel consumption and AWS weather data used to train the XGBoost model.
- **SIMULATED:** The electrical load profiles (base load, critical/flexible splits), battery capacities, and solar PV capacities are *simulated assumptions* for the prototype. The project does not claim these simulate exact MW loads of Mawson station today, nor does it falsely claim to receive real-time telemetry.

## 16. Installation
**Backend (Python):**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt # (fastapi uvicorn pandas numpy scikit-learn xgboost)
python ml/preprocessing/preprocessing.py
python ml/training/training.py
```

**Frontend (React/Vite):**
```bash
cd frontend
npm install
```

## 17. Running the system
Start the backend API:
```bash
cd backend
venv\Scripts\uvicorn.exe api.main:app --host 0.0.0.0 --port 8000
```
Start the frontend:
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173`.

## 18. Demo Scenarios
The dashboard's `Optimization & Dispatch` tab allows users to select scenarios (Normal, Snowstorm, Shortage) and adjust battery/generator sizes to see the real-time effect on critical load reliability and fuel consumption.
