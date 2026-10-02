import React, { useState } from 'react';
import { Activity, Battery, Zap, LineChart, FileText, ChevronRight, LayoutDashboard } from 'lucide-react';
import MainDashboard from './pages/MainDashboard';
import ForecastPage from './pages/ForecastPage';
import SimulationPage from './pages/SimulationPage';
import EvaluationPage from './pages/EvaluationPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-polar-200 selection:text-polar-900">
      
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-polar-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-polar-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Polar<span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-500 to-blue-600">Energy</span> Intelligence
              </h1>
            </div>
          </div>
          

        </div>
      </header>
      
      <div className="max-w-7xl mx-auto flex mt-8 px-6 pb-12 gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0 sticky top-28 self-start">
          <nav className="flex flex-col gap-3">
            <NavItem 
              icon={<LayoutDashboard className="w-5 h-5" />} label="Main Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <NavItem 
              icon={<LineChart className="w-5 h-5" />} label="Forecast & History" 
              active={activeTab === 'forecast'} 
              onClick={() => setActiveTab('forecast')} 
            />
            <NavItem 
              icon={<Zap className="w-5 h-5" />} label="Optimization & Dispatch" 
              active={activeTab === 'simulation'} 
              onClick={() => setActiveTab('simulation')} 
            />
            <NavItem 
              icon={<FileText className="w-5 h-5" />} label="Model Evaluation" 
              active={activeTab === 'evaluation'} 
              onClick={() => setActiveTab('evaluation')} 
            />
          </nav>
          
          <div className="mt-12 p-5 bg-gradient-to-br from-polar-50 to-white rounded-2xl border border-polar-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Station Status</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Mawson</span>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">ACTIVE</span>
            </div>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
            {activeTab === 'dashboard' && <MainDashboard />}
            {activeTab === 'forecast' && <ForecastPage />}
            {activeTab === 'simulation' && <SimulationPage />}
            {activeTab === 'evaluation' && <EvaluationPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-300 w-full ${
        active 
          ? 'bg-white shadow-soft border-transparent text-polar-600 font-semibold' 
          : 'hover:bg-white/60 text-slate-500 hover:text-slate-900 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-colors duration-300 ${active ? 'text-polar-500' : 'text-slate-400 group-hover:text-polar-400'}`}>
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-polar-400" />}
    </button>
  );
}

export default App;
