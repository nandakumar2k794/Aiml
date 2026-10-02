import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/model/metrics`).then(res => setMetrics(res.data)).catch(console.error);
    axios.get(`${API_URL}/api/model/features`).then(res => setFeatures(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Model Evaluation & Limitations</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-3xl relative z-10">
          Transparent evaluation of the AI-driven smart energy management system. This page documents the performance metrics and the explicit assumptions made to fulfill the problem statement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Forecasting Metrics</h3>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">XGBoost Evaluation</span>
          </div>
          
          {!metrics ? (
            <div className="flex items-center justify-center h-48 text-polar-500">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polar-500"></div>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-sm text-left bg-white">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-4 px-6 uppercase text-xs tracking-wider">Metric</th>
                    <th className="py-4 px-6 uppercase text-xs tracking-wider">ML Model (XGBoost)</th>
                    <th className="py-4 px-6 uppercase text-xs tracking-wider">Baseline (Naive)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">MAE (Litres)</td>
                    <td className="py-4 px-6 text-slate-600">{metrics.ML_Model.MAE.toFixed(1)}</td>
                    <td className="py-4 px-6 text-slate-600">{metrics.Naive_Baseline.MAE.toFixed(1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">RMSE (Litres)</td>
                    <td className="py-4 px-6 text-slate-600">{metrics.ML_Model.RMSE.toFixed(1)}</td>
                    <td className="py-4 px-6 text-slate-600">{metrics.Naive_Baseline.RMSE.toFixed(1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">MAPE (%)</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{metrics.ML_Model.MAPE.toFixed(1)}%</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{metrics.Naive_Baseline.MAPE.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          

        </div>

        <div className="glass-panel p-8">
           <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Feature Importance</h3>
            <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">XGBoost Insights</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={features.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  itemStyle={{ color: '#0ea5e9', fontWeight: 600 }}
                />
                <Bar dataKey="importance" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


    </div>
  );
}
