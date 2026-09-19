import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Thermometer, 
  Activity, 
  Droplets, 
  ShieldCheck, 
  Clock, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

const MOCK_FORECAST_DATA = {
  W1: {
    wardName: 'Shivajinagar',
    currentHeatIndex: '42.5°C',
    currentWbgt: '33.2°C',
    coolingCentresCount: 4,
    waterUnitsCount: 12,
    workHoursShifted: 'No',
    forecast: [
      { day: 'Day 1 (Today)', heatIndex: 42.5, wbgt: 33.2 },
      { day: 'Day 2', heatIndex: 43.8, wbgt: 34.1 },
      { day: 'Day 3', heatIndex: 44.2, wbgt: 34.8 },
      { day: 'Day 4', heatIndex: 41.0, wbgt: 32.0 },
      { day: 'Day 5', heatIndex: 39.5, wbgt: 30.5 }
    ]
  },
  DEFAULT: {
    wardName: 'Selected Ward',
    currentHeatIndex: '40.2°C',
    currentWbgt: '31.5°C',
    coolingCentresCount: 3,
    waterUnitsCount: 10,
    workHoursShifted: 'No',
    forecast: [
      { day: 'Day 1 (Today)', heatIndex: 40.2, wbgt: 31.5 },
      { day: 'Day 2', heatIndex: 41.5, wbgt: 32.2 },
      { day: 'Day 3', heatIndex: 42.0, wbgt: 33.0 },
      { day: 'Day 4', heatIndex: 39.8, wbgt: 30.9 },
      { day: 'Day 5', heatIndex: 38.2, wbgt: 29.8 }
    ]
  }
};

export default function WardDetail({ wardId = 'W1' }) {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [wardData, setWardData] = useState(null);

  // Fetch thermal and forecast data on load or wardId change
  const fetchThermalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/thermal?ward_id=${wardId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setWardData(data);
    } catch (err) {
      console.warn(`API unreachable for ward ${wardId}. Using mock fallback.`, err.message);
      const fallback = MOCK_FORECAST_DATA[wardId] || MOCK_FORECAST_DATA.DEFAULT;
      setWardData({ ...fallback, wardId });
      setError('Live API unavailable. Showing simulated ward thermal telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThermalData();
  }, [wardId]);

  // Handle simulation action triggers (POST request)
  const handleSimulationAction = async (actionType) => {
    setSimulating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward_id: wardId, action: actionType }),
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) throw new Error(`Simulation failed with status ${response.status}`);
      const result = await response.json();

      // Update local state instantly with backend response
      setWardData(prev => ({
        ...prev,
        coolingCentresCount: result.coolingCentresCount ?? (prev.coolingCentresCount + (actionType === 'add_cooling_centre' ? 1 : 0)),
        waterUnitsCount: result.waterUnitsCount ?? (prev.waterUnitsCount + (actionType === 'add_water_unit' ? 1 : 0)),
        workHoursShifted: result.workHoursShifted ?? (actionType === 'shift_work_hours' ? 'Yes' : prev.workHoursShifted),
        forecast: result.forecast || prev.forecast.map(f => ({
          ...f,
          heatIndex: Math.max(30, Number((f.heatIndex - 0.8).toFixed(1))),
          wbgt: Math.max(25, Number((f.wbgt - 0.6).toFixed(1)))
        }))
      }));

      setSuccessMsg(`Successfully executed simulation: ${actionType.replace(/_/g, ' ')}`);
    } catch (err) {
      console.warn('Simulation API offline. Performing optimistic local state simulation.', err.message);
      
      // Optimistic local update as robust fallback
      setWardData(prev => {
        const newCooling = actionType === 'add_cooling_centre' ? prev.coolingCentresCount + 1 : prev.coolingCentresCount;
        const newWater = actionType === 'add_water_unit' ? prev.waterUnitsCount + 1 : prev.waterUnitsCount;
        const newShift = actionType === 'shift_work_hours' ? 'Yes' : prev.workHoursShifted;
        
        // Slightly lower forecast values to simulate mitigation impact
        const mitigatedForecast = prev.forecast.map(f => ({
          ...f,
          heatIndex: Math.max(30, Number((f.heatIndex - 0.6).toFixed(1))),
          wbgt: Math.max(25, Number((f.wbgt - 0.5).toFixed(1)))
        }));

        return {
          ...prev,
          coolingCentresCount: newCooling,
          waterUnitsCount: newWater,
          workHoursShifted: newShift,
          forecast: mitigatedForecast
        };
      });

      setSuccessMsg(`Simulated mitigation applied successfully for ${wardId}. Forecast metrics adjusted.`);
    } finally {
      setSimulating(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  if (loading && !wardData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading thermal telemetry for Ward {wardId}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Ward ID: {wardId}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Thermal Projections Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {wardData?.wardName || 'Ward'} Thermal Analysis & Mitigation
          </h2>
        </div>

        <button
          onClick={fetchThermalData}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Current Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Current Heat Index
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {wardData?.currentHeatIndex || '41.5°C'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-orange-500" /> Current WBGT
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {wardData?.currentWbgt || '32.8°C'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Cooling Centres
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {wardData?.coolingCentresCount ?? 3} Active
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-500" /> Water Units & Shift
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {wardData?.waterUnitsCount ?? 10} Units
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${wardData?.workHoursShifted === 'Yes' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
              Shift: {wardData?.workHoursShifted || 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Forecast Visualization */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            5-Day Heat Index & WBGT Projection Forecast
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> Responds to interventions
          </span>
        </div>

        <div className="w-full h-72 bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wardData?.forecast || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} domain={[25, 50]} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line 
                type="monotone" 
                dataKey="heatIndex" 
                name="Heat Index (°C)" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f43f5e' }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="wbgt" 
                name="WBGT (°C)" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f97316' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulation Intervention Buttons */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Intervention Simulator & Action Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSimulationAction('add_cooling_centre')}
            disabled={simulating}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm active:scale-95 disabled:opacity-60"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Cooling Centre (+1)</span>
          </button>

          <button
            onClick={() => handleSimulationAction('add_water_unit')}
            disabled={simulating}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-sm transition shadow-sm active:scale-95 disabled:opacity-60"
          >
            <Droplets className="w-4 h-4" />
            <span>Add Water Unit (+1)</span>
          </button>

          <button
            onClick={() => handleSimulationAction('shift_work_hours')}
            disabled={simulating}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition shadow-sm active:scale-95 disabled:opacity-60"
          >
            <Clock className="w-4 h-4" />
            <span>Shift Work Hours</span>
          </button>
        </div>
      </div>

    </div>
  );
}