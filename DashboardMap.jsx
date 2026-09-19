import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  ThermometerSnowflake, 
  MapPin, 
  AlertTriangle, 
  Activity, 
  Phone, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Info,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';

const MOCK_WARDS_DATA = [
  { id: 'w1', name: 'Shivajinagar', code: 'W1', risk: 'Severe', score: 89, exposed: 45000, coolingCapacity: 12000, temp: '41.5°C', mitigation: 'In Progress', contacts: '020-25537000' },
  { id: 'w2', name: 'Kothrud', code: 'W2', risk: 'Moderate', score: 54, exposed: 62000, coolingCapacity: 35000, temp: '38.2°C', mitigation: 'Completed', contacts: '020-25431522' },
  { id: 'w3', name: 'Hadapsar', code: 'W3', risk: 'High', score: 76, exposed: 85000, coolingCapacity: 22000, temp: '40.1°C', mitigation: 'Pending', contacts: '020-26991055' },
  { id: 'w4', name: 'Hinjewadi', code: 'W4', risk: 'Severe', score: 92, exposed: 95000, coolingCapacity: 18000, temp: '42.0°C', mitigation: 'In Progress', contacts: '020-22930011' },
  { id: 'w5', name: 'Baner', code: 'W5', risk: 'Moderate', score: 48, exposed: 40000, coolingCapacity: 28000, temp: '37.8°C', mitigation: 'Completed', contacts: '020-27290044' },
  { id: 'w6', name: 'Viman Nagar', code: 'W6', risk: 'Low', score: 28, exposed: 32000, coolingCapacity: 30000, temp: '36.5°C', mitigation: 'Completed', contacts: '020-26630088' },
  { id: 'w7', name: 'Koregaon Park', code: 'W7', risk: 'Low', score: 31, exposed: 25000, coolingCapacity: 27000, temp: '36.9°C', mitigation: 'Completed', contacts: '020-26120099' },
  { id: 'w8', name: 'Yerwada', code: 'W8', risk: 'High', score: 79, exposed: 78000, coolingCapacity: 15000, temp: '40.8°C', mitigation: 'In Progress', contacts: '020-26684455' },
  { id: 'w9', name: 'Sinhgad Road', code: 'W9', risk: 'Moderate', score: 62, exposed: 67000, coolingCapacity: 29000, temp: '38.9°C', mitigation: 'Pending', contacts: '020-24350122' },
  { id: 'w10', name: 'Wanowrie', code: 'W10', risk: 'Low', score: 35, exposed: 29000, coolingCapacity: 25000, temp: '37.1°C', mitigation: 'Completed', contacts: '020-26830111' },
  { id: 'w11', name: 'Pimpri', code: 'W11', risk: 'Severe', score: 88, exposed: 110000, coolingCapacity: 30000, temp: '41.8°C', mitigation: 'In Progress', contacts: '020-27420101' },
  { id: 'w12', name: 'Kadam Wak Wasti', code: 'W12', risk: 'High', score: 74, exposed: 38000, coolingCapacity: 9000, temp: '39.9°C', mitigation: 'Pending', contacts: '020-26920222' }
];

const RISK_CONFIG = {
  Low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    accent: '#10b981',
    glow: 'shadow-emerald-500/10'
  },
  Moderate: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    accent: '#f59e0b',
    glow: 'shadow-amber-500/10'
  },
  High: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-300 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
    accent: '#f97316',
    glow: 'shadow-orange-500/10'
  },
  Severe: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    accent: '#f43f5e',
    glow: 'shadow-rose-500/10'
  }
};

export default function DashboardMap() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Fetch risk data from API with fallback
  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/risk', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout for rapid fallback
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Expecting array of wards or object containing wards array
      const wardList = Array.isArray(data) ? data : (data.wards || MOCK_WARDS_DATA);
      setWards(wardList);
      setIsUsingMock(false);
      if (wardList.length > 0 && !selectedWard) {
        setSelectedWard(wardList[0]);
      }
    } catch (err) {
      console.warn('API connection failed or timed out. Switching to local simulated Pune municipal data.', err.message);
      setWards(MOCK_WARDS_DATA);
      setIsUsingMock(true);
      if (!selectedWard) setSelectedWard(MOCK_WARDS_DATA[0]);
      setError('Live API unavailable. Showing simulated real-time Pune ward metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  // Compute summary stats
  const highRiskCount = wards.filter(w => w.risk === 'High' || w.risk === 'Severe').length;
  const totalExposed = wards.reduce((acc, curr) => acc + (curr.exposed || 0), 0);
  const totalCooling = wards.reduce((acc, curr) => acc + (curr.coolingCapacity || 0), 0);

  // Filtered wards based on search and risk filter
  const filteredWards = wards.filter(ward => {
    const matchesSearch = ward.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ward.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'All' || ward.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  if (loading && wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-6">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold">Connecting to Pune Municipal Climate Grid...</h2>
        <p className="text-sm text-slate-500 mt-2">Fetching live ward vulnerability telemetry</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5" /> Pune Urban Heat Resilience Hub
              </span>
              {isUsingMock && (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  Offline Mock Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Climate Vulnerability & Heat Risk Map
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time monitoring of municipal wards, exposed demographics, and localized cooling infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRiskData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm active:scale-95"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* Error Banner if any */}
        {error && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-semibold underline hover:opacity-80">Dismiss</button>
          </div>
        )}

        {/* Summary Cards Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: High Risk Wards */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-900 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">High-Risk Wards</span>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{highRiskCount}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">of {wards.length} total wards</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Requires immediate cooling shelters</span>
            </div>
          </div>

          {/* Card 2: Total Exposed People */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group hover:border-orange-300 dark:hover:border-orange-900 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Exposed People</span>
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {totalExposed >= 1000 ? `${(totalExposed / 1000).toFixed(1)}k` : totalExposed}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">citizens in heat zones</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-medium">
              <Activity className="w-3.5 h-3.5" />
              <span>Vulnerable senior & outdoor labor count</span>
            </div>
          </div>

          {/* Card 3: Total Cooling Capacity */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-900 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Cooling Capacity</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {totalCooling >= 1000 ? `${(totalCooling / 1000).toFixed(1)}k` : totalCooling}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">visitor capacity</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active hydration & AC shelters</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Grid Map & Active Ward Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Ward Grid Map (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ward name or code (e.g. W1, Kothrud)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
                />
              </div>

              {/* Risk Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Low', 'Moderate', 'High', 'Severe'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterRisk(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      filterRisk === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Risk Legend:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Low
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Moderate
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> High
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Severe
              </div>
            </div>

            {/* Wards Grid */}
            {filteredWards.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No wards match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredWards.map((ward) => {
                  const config = RISK_CONFIG[ward.risk] || RISK_CONFIG.Moderate;
                  const isSelected = selectedWard && selectedWard.id === ward.id;

                  return (
                    <div
                      key={ward.id}
                      onClick={() => setSelectedWard(ward)}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 relative group flex flex-col justify-between ${config.bg} ${config.border} ${
                        isSelected 
                          ? 'ring-2 ring-blue-600 dark:ring-blue-500 shadow-lg scale-[1.02]' 
                          : 'hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {ward.code}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                            {ward.risk} Risk
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {ward.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-500" />
                          <span>{ward.temp}</span>
                        </div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          Score: {ward.score}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Active Ward Detail Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 sticky top-6">
            {selectedWard ? (
              <div className="space-y-6">
                
                {/* Ward Title & Code */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {selectedWard.code}
                      </span>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${RISK_CONFIG[selectedWard.risk]?.badge}`}>
                        {selectedWard.risk} Risk Category
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      {selectedWard.name} Ward
                    </h2>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Exposed Population</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedWard.exposed?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Cooling Capacity</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedWard.coolingCapacity?.toLocaleString()} slots
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Surface Temperature</span>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <ThermometerSnowflake className="w-4 h-4" /> {selectedWard.temp}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Vulnerability Index</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedWard.score} / 100
                    </span>
                  </div>
                </div>

                {/* Mitigation & Response Status */}
                <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Mitigation & Emergency Protocol
                  </h4>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Response Status:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                      selectedWard.mitigation === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      selectedWard.mitigation === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {selectedWard.mitigation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200/40 dark:border-blue-900/40">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" /> Ward Helpline:
                    </span>
                    <a href={`tel:${selectedWard.contacts}`} className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      {selectedWard.contacts}
                    </a>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => alert(`Emergency dispatch initiated for ${selectedWard.name} ward (${selectedWard.code}).`)}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-sm text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Deploy Ward Heat Response Team</span>
                </button>

              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium text-sm">Select any ward card from the grid to view detailed telemetry.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}