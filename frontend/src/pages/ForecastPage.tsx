import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function ForecastPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch forecast
    axios.get(`${API_URL}/api/fuel/forecast`)
      .then(res => {
        // Format for recharts
        const formatted = res.data.map((d: any) => ({
          name: `${d.year}-${d.month.toString().padStart(2, '0')}`,
          'Actual (Real)': d.fuel_consumption_litres,
          'XGBoost (Predicted)': d.predicted,
          'Naive (Baseline)': d.naive
        }));
        setData(formatted);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8 pb-10">
      
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Fuel Consumption Forecasting</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
          This chart demonstrates the ML model performance on unseen data. The actual values are derived from <strong>REAL HISTORICAL DATA</strong>, while predictions are <strong>MODEL OUTPUTS</strong> based on historical meteorological features.
        </p>
      </div>

      <div className="glass-panel p-8 h-[500px]">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">Actual vs Predicted (Test Period)</h3>
          <span className="text-xs font-medium bg-polar-50 text-polar-600 px-3 py-1 rounded-full border border-polar-100">Time-Series Analysis</span>
        </div>
        
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#334155', fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Actual (Real)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="XGBoost (Predicted)" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Naive (Baseline)" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-polar-500 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polar-500"></div>
          </div>
        )}
      </div>
      

    </div>
  );
}
