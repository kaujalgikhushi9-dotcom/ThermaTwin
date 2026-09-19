import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShieldAlert, 
  Thermometer, 
  Users, 
  Calendar, 
  AlertTriangle,
  Languages,
  BookOpen,
  Copy,
  Check,
  X
} from 'lucide-react';

const INITIAL_WARDS = [
  { id: 'W1', name: 'Shivajinagar', lat: 18.5308, lon: 73.8474, risk: 'Red', wbgt: 41.5, coolingDeficit: -12, exposed: '14.2K', status: 'Extreme Danger' },
  { id: 'W2', name: 'Swargate', lat: 18.5018, lon: 73.8567, risk: 'Red', wbgt: 40.8, coolingDeficit: -10, exposed: '11.8K', status: 'Extreme Danger' },
  { id: 'W3', name: 'Kothrud', lat: 18.5074, lon: 73.8077, risk: 'Orange', wbgt: 38.2, coolingDeficit: -5, exposed: '9.5K', status: 'Caution' },
  { id: 'W4', name: 'Aundh', lat: 18.5580, lon: 73.8075, risk: 'Green', wbgt: 34.1, coolingDeficit: '+2', exposed: '6.1K', status: 'Safe' },
  { id: 'W5', name: 'Hadapsar', lat: 18.5089, lon: 73.9260, risk: 'Red', wbgt: 42.1, coolingDeficit: -15, exposed: '18.4K', status: 'Extreme Danger' },
  { id: 'W6', name: 'Yerwada', lat: 18.5529, lon: 73.8796, risk: 'Orange', wbgt: 39.0, coolingDeficit: -7, exposed: '10.2K', status: 'Caution' }
];

export default function App() {
  const [wards, setWards] = useState(INITIAL_WARDS);
  const [selectedWardId, setSelectedWardId] = useState('W1');
  const [currentDate, setCurrentDate] = useState('2026-06-08');
  const [apiStatus, setApiStatus] = useState('connecting');

  // Modal / View States for Methodology & Alerts
  const [activeModal, setActiveModal] = useState(null); // 'alerts' | 'methodology' | null

  // Alert Station Controls State
  const [alertWard, setAlertWard] = useState('W1');
  const [alertLang, setAlertLang] = useState('EN');
  const [alertAudience, setAlertAudience] = useState('Workers');
  const [alertText, setAlertText] = useState('');
  const [copied, setCopied] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Fetch data loop polling from FastAPI backend with fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/risk');
        if (!response.ok) throw new Error('API offline');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setWards(data);
          setApiStatus('online');
        }
      } catch (err) {
        setApiStatus('offline (using simulation fallback)');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic multi-lingual advisory text when options change
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/alert?ward_id=${alertWard}&lang=${alertLang}&audience=${alertAudience}`);
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        setAlertText(data.message || data.text || JSON.stringify(data));
      } catch (err) {
        // Fallback mock advisory messages if backend is offline
        const targetWardObj = wards.find(w => w.id === alertWard) || wards[0];
        if (alertLang === 'HI') {
          setAlertText(`चेतावनी (${targetWardObj.name}): अत्यधिक गर्मी (${targetWardObj.wbgt}°C WBGT)। ${alertAudience === 'Workers' ? 'श्रमजीवियों' : 'वरिष्ठ नागरिकों'} से अनुरोध है कि धूप में बाहर जाने से बचें और पर्याप्त पानी पिएं।`);
        } else if (alertLang === 'MR') {
          setAlertText(`सतर्कता सूचना (${targetWardObj.name}): उष्णता लहर (${targetWardObj.wbgt}°C WBGT)। ${alertAudience === 'Workers' ? 'कामगारांना' : 'ज्येष्ठ नागरिकांना'} उन्हाळ्यात बाहेर जाणे टाळावे व हायड्रेटेड राहावे.`);
        } else {
          setAlertText(`HEAT ADVISORY [${targetWardObj.name}]: Severe thermal stress detected (${targetWardObj.wbgt}°C WBGT). Target: ${alertAudience}. Stay hydrated, seek shade, and halt heavy outdoor activity.`);
        }
      }
    };
    fetchAlert();
  }, [alertWard, alertLang, alertAudience, wards]);

  // Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current, {
        center: [18.5204, 73.8567],
        zoom: 12,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'red': return '#ef4444';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      case 'green': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  // Update Markers whenever wards or selectedWardId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    wards.forEach(ward => {
      const color = getRiskColor(ward.risk);
      const isSelected = ward.id === selectedWardId;

      const circleMarker = L.circleMarker([ward.lat, ward.lon], {
        radius: isSelected ? 14 : 10,
        color: isSelected ? '#1d4ed8' : color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: isSelected ? 3 : 2
      });

      circleMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${ward.name} (${ward.id})</h3>
          <p style="font-size: 12px; margin: 2px 0;">WBGT Index: <b>${ward.wbgt}°C</b></p>
          <p style="font-size: 12px; margin: 2px 0;">Risk Category: <b style="color: ${color}">${ward.risk}</b></p>
          <p style="font-size: 12px; margin: 2px 0;">Exposed Population: <b>${ward.exposed}</b></p>
        </div>
      `);

      circleMarker.on('click', () => {
        setSelectedWardId(ward.id);
      });

      circleMarker.addTo(map);
      markersRef.current[ward.id] = circleMarker;
    });
  }, [wards, selectedWardId]);

  const getRiskBadgeClass = (risk) => {
    switch (risk.toLowerCase()) {
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'green': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(alertText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highRiskCount = wards.filter(w => w.risk.toLowerCase() === 'red' || w.risk.toLowerCase() === 'orange').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">THERMATWIN Pune Digital Twin v2.4</h1>
            <p className="text-xs text-gray-500 font-medium">Extreme Heatwave Early Warning & Urban Resilience Mesh</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer"
            />
          </div>

          {/* Navigation Links triggering Modals */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
            <button 
              onClick={() => setActiveModal('alerts')} 
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span>Multi-Lingual Alerts</span>
            </button>
            <button 
              onClick={() => setActiveModal('methodology')} 
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Methodology</span>
            </button>
          </nav>

          <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-600">
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="capitalize">{apiStatus}</span>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        
        {/* LEFT SECTION: Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800 text-sm">Geospatial Risk Mesh — Pune Municipal Corporation</h2>
            <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-md border border-blue-100">
              Live Telemetry Active
            </span>
          </div>

          <div className="flex-1 relative min-h-[520px] bg-gray-100">
            <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '520px', position: 'absolute', inset: 0 }} />
          </div>
        </div>

        {/* RIGHT SECTION: Sidebar (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Metropolitan Summary Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50/60 border border-red-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-red-600 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">High-Risk Wards</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-red-700">{highRiskCount}</span>
                  <span className="text-xs text-red-500 font-medium">/ {wards.length} Wards</span>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Exposed Population</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-blue-700">70.5K</span>
                  <span className="text-xs text-blue-500 font-medium">At Risk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Priority Ward Interventions</h3>
              <span className="text-xs text-gray-500 font-medium">{wards.length} Zones Tracked</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {wards.map((ward) => {
                const isSelected = ward.id === selectedWardId;
                return (
                  <div 
                    key={ward.id}
                    onClick={() => setSelectedWardId(ward.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/30 shadow-sm ring-1 ring-blue-500' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-blue-600 underline text-sm hover:text-blue-800">
                          {ward.name} ({ward.id})
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskBadgeClass(ward.risk)}`}>
                          {ward.risk}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        Lat: {ward.lat.toFixed(4)}° N, Lon: {ward.lon.toFixed(4)}° E
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-gray-900 flex items-center justify-end space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                        <span>{ward.wbgt}°C WBGT</span>
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Deficit: <span className={ward.coolingDeficit.toString().startsWith('-') ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>{ward.coolingDeficit} Units</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>

      {/* MODAL / POPUP OVERLAYS FOR ALERTS & METHODOLOGY */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                {activeModal === 'alerts' ? <Languages className="w-5 h-5 text-blue-600" /> : <BookOpen className="w-5 h-5 text-blue-600" />}
                <h3 className="font-bold text-gray-900 text-base">
                  {activeModal === 'alerts' ? 'Multi-Lingual Public Advisory Station' : 'Thermal Digital Twin Methodology'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {activeModal === 'alerts' ? (
                <div className="space-y-5">
                  <p className="text-xs text-gray-500">
                    Generate localized, translated extreme heatwave warnings tailored to vulnerable demographics across Pune municipal wards.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Ward</label>
                      <select 
                        value={alertWard} 
                        onChange={(e) => setAlertWard(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {wards.map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
                      <select 
                        value={alertLang} 
                        onChange={(e) => setAlertLang(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EN">English (EN)</option>
                        <option value="HI">Hindi (HI)</option>
                        <option value="MR">Marathi (MR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Audience</label>
                      <select 
                        value={alertAudience} 
                        onChange={(e) => setAlertAudience(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Workers">Outdoor Workers</option>
                        <option value="Elderly">Elderly & Vulnerable</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Generated Advisory Message</label>
                    <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 font-medium">
                      <p>{alertText}</p>
                      <button 
                        onClick={handleCopyClipboard}
                        className="absolute top-3 right-3 flex items-center space-x-1.5 bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                  <h4 className="font-bold text-gray-900 text-sm">Wet-Bulb Globe Temperature (WBGT) Estimation Algorithm</h4>
                  <p>
                    ThermaTwin computes real-time human thermal stress by integrating ambient temperature ($T_a$), relative humidity ($RH$), solar radiation ($SR$), and wind velocity ($v$) using an empirical simplification of the indoor/outdoor WBGT formula:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-gray-800">
                    WBGT = 0.567(Ta) + 0.393(RH) + 3.94 (for outdoor solar adjustment)
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm pt-2">Early Warning & Mitigation Pipeline</h4>
                  <p>
                    Data is ingested from IoT weather stations and satellite telemetry, processed via FastAPI backend pipelines, and mapped geospatially to Pune Municipal Corporation's administrative ward boundaries to optimize cooling infrastructure deployment.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500 font-medium">
        SIH 2026 • Thermal Digital Twin System & Early Warning Mitigation Engine
      </footer>

    </div>
  );
}