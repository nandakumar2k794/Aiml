import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Bar, LineChart } from 'recharts';
import { Play, Settings2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function SimulationPage() {
  const [scenario, setScenario] = useState('NORMAL');
  const [data, setData] = useState<any>(null);
  
  // Params
  const [battCap, setBattCap] = useState(500);
  const [genCap, setGenCap] = useState(300);

  const runSim = () => {
    setData(null);
    axios.post(`${API_URL}/api/simulation`, {
      scenario: scenario,
      battery_capacity_kWh: battCap,
      generator_capacity_kW: genCap
    }).then(res => setData(res.data)).catch(console.error);
  };

  useEffect(() => {
    runSim();
  }, [scenario]);

  return (
    <div className="space-y-8 pb-10">
      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-polar-400 to-blue-600 p-2 rounded-lg shadow-md shadow-polar-500/20 text-white">
            <Settings2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Energy Optimization Engine</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase">Scenario (Simulated)</label>
            <div className="relative">
              <select 
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-polar-400 focus:ring-2 focus:ring-polar-400/20 transition-all appearance-none cursor-pointer font-medium shadow-sm"
              >
                <option value="NORMAL">Normal Polar Day</option>
                <option value="LOW_SOLAR_SNOWSTORM">Low Solar / Snowstorm</option>
                <option value="SEVERE_SHORTAGE">Severe Energy Shortage</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase">Battery Capacity (kWh)</label>
            <input 
              type="number" value={battCap} onChange={e => setBattCap(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-polar-400 focus:ring-2 focus:ring-polar-400/20 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={runSim}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-polar-500 to-blue-600 hover:from-polar-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-polar-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-current" />
              RUN OPTIMIZATION
            </button>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="flex flex-col items-center justify-center h-64 text-polar-500 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polar-500"></div>
          <p className="text-sm font-medium animate-pulse">Running Simulation...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ResultCard title="SIMULATED FUEL USED" value={`${Math.round(data.summary.total_fuel_litres)} L`} />
            <ResultCard title="TOTAL DEMAND" value={`${Math.round(data.summary.total_demand_kWh)} kWh`} />
            <ResultCard title="CRITICAL RELIABILITY" value={`${data.summary.critical_reliability_percent.toFixed(1)}%`} highlight={data.summary.critical_reliability_percent === 100} />
            <ResultCard title="SOLAR UTILIZATION" value={`${data.summary.solar_utilization_percent.toFixed(1)}%`} isBlue />
          </div>

          <div className="glass-panel p-8 h-[450px]">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">24H Power Dispatch & Load</h3>
              <span className="text-xs font-medium bg-polar-50 text-polar-600 px-3 py-1 rounded-full border border-polar-100">Simulation Result</span>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={data.hourly_results} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} itemStyle={{ fontWeight: 500 }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Area type="monotone" dataKey="solar" name="Solar Gen" fill="#fbbf24" stroke="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                <Bar dataKey="battery_discharge" name="Battery Disch." stackId="a" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="diesel_gen" name="Diesel Gen" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                
                <Line type="monotone" dataKey="demand" name="Total Demand" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="critical_demand" name="Critical Demand" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-8 h-80">
             <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Battery State of Charge</h3>
              <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">Energy Storage</span>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={data.hourly_results} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} label={{ value: 'SOC %', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} itemStyle={{ fontWeight: 500 }} />
                <Line type="monotone" dataKey="soc_percent" name="SOC %" stroke="#6366f1" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function ResultCard({ title, value, highlight = false, isBlue = false }: { title: string, value: string, highlight?: boolean, isBlue?: boolean }) {
  let bgColor = 'bg-white';
  let borderColor = 'border-slate-200';
  let textColor = 'text-slate-800';
  
  if (highlight) {
    bgColor = 'bg-emerald-50';
    borderColor = 'border-emerald-200';
    textColor = 'text-emerald-700';
  } else if (isBlue) {
    bgColor = 'bg-polar-50';
    borderColor = 'border-polar-200';
    textColor = 'text-polar-700';
  }

  return (
    <div className={`p-6 rounded-2xl border ${borderColor} ${bgColor} shadow-sm transition-transform hover:-translate-y-1 duration-300`}>
      <div className="text-xs font-bold text-slate-400 mb-2 tracking-wider uppercase">{title}</div>
      <div className={`text-3xl font-extrabold ${textColor}`}>{value}</div>
    </div>
  );
}
