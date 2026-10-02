import React, { useState, useEffect } from 'react';
import { AlertTriangle, BatteryCharging, Wind, Thermometer, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function MainDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch a quick simulation for the default scenario to show KPIs
    axios.post(`${API_URL}/api/simulation`, { scenario: 'NORMAL' })
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64 text-polar-500 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polar-500"></div>
      <p className="text-sm font-medium animate-pulse">Initializing Control Systems...</p>
    </div>
  );

  const summary = data.summary;
  const currentRisk = "NORMAL";

  return (
    <div className="space-y-8">
      
      {/* Top Welcome Banner */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-polar-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Station: <span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-600 to-blue-600">Mawson</span></h2>
            <div className="flex gap-6 mt-3 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg"><Thermometer className="w-4 h-4 text-polar-500" /> HISTORICAL AWS DATA</span>
              <span className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg"><Cpu className="w-4 h-4 text-polar-500" /> SIMULATED STATION LOAD</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 mb-2 tracking-widest uppercase">Energy Risk Indicator</div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold shadow-sm">
              <ShieldAlert className="w-5 h-5" />
              {currentRisk}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Forecast Fuel Requirement" 
          value={`${Math.round(summary.total_fuel_litres).toLocaleString()} L`} 
          subValue="per day"
          label="MODEL PREDICTION & SIMULATION" 
          icon={<BatteryCharging className="w-6 h-6 text-polar-500" />}
        />
        <KPICard 
          title="Renewable Utilization" 
          value={`${summary.solar_utilization_percent.toFixed(1)}%`} 
          label="SIMULATION RESULT" 
          icon={<Wind className="w-6 h-6 text-emerald-500" />}
        />
        <KPICard 
          title="Critical Load Served" 
          value={`${summary.critical_reliability_percent.toFixed(1)}%`} 
          label="OPTIMIZATION CONSTRAINT" 
          highlight={summary.critical_reliability_percent === 100}
          icon={<AlertTriangle className={`w-6 h-6 ${summary.critical_reliability_percent === 100 ? 'text-emerald-500' : 'text-amber-500'}`} />}
        />
      </div>

      {/* Architecture Diagram */}
      <div className="glass-panel p-8">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wind className="text-polar-500 w-5 h-5" /> System Energy Flow Architecture
          </h3>
          <span className="text-xs font-medium bg-polar-50 text-polar-600 px-3 py-1 rounded-full border border-polar-100">Architecture Diagram</span>
        </div>
        

        
        <div className="grid grid-cols-3 gap-8 text-center text-sm font-medium relative">
          
          <div className="space-y-6 z-10">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-emerald-600 font-bold text-base mb-1">RENEWABLE GENERATION</div>
              <div className="text-xs text-slate-400">SIMULATED (Solar PV)</div>
            </div>
            <div className="text-slate-300 font-bold text-2xl animate-pulse">↓</div>
          </div>
          
          <div className="space-y-6 pt-16 z-10">
            <div className="p-6 bg-white border border-polar-200 rounded-2xl shadow-soft relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-polar-400"></div>
              <div className="text-polar-600 font-bold text-base mb-1">BATTERY STORAGE</div>
              <div className="text-xs text-slate-400">SIMULATED (Configurable)</div>
            </div>
            <div className="text-slate-300 font-bold text-2xl animate-pulse">↓</div>
            <div className="p-6 bg-white border border-indigo-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400"></div>
              <div className="text-indigo-600 font-bold text-base mb-1">STATION ELECTRICAL LOAD</div>
              <div className="text-xs text-slate-400">SIMULATED (Critical & Flexible)</div>
            </div>
          </div>
          
          <div className="space-y-6 pt-16 z-10">
            <div className="p-6 bg-white border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
              <div className="text-amber-600 font-bold text-base mb-1">DIESEL GENERATORS</div>
              <div className="text-xs text-slate-400">OPTIMIZED DISPATCH</div>
            </div>
            <div className="text-slate-300 font-bold text-2xl animate-pulse -ml-8">↙</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subValue, label, icon, highlight = false }: { title: string, value: string, subValue?: string, label: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`glass-panel p-6 relative overflow-hidden group ${highlight ? 'border-emerald-200/50' : ''}`}>
      {highlight && <div className="absolute inset-0 bg-emerald-50/30 -z-10 pointer-events-none"></div>}
      
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</div>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      
      <div className="text-slate-600 text-sm font-medium mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl font-extrabold tracking-tight ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>
          {value}
        </div>
        {subValue && <span className="text-sm font-medium text-slate-400">{subValue}</span>}
      </div>
    </div>
  );
}
