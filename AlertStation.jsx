import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Copy, 
  Check, 
  Globe, 
  Users, 
  MapPin, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles,
  Volume2
} from 'lucide-react';

const WARDS_LIST = [
  { id: 'W1', name: 'Shivajinagar' },
  { id: 'W2', name: 'Kothrud' },
  { id: 'W3', name: 'Hadapsar' },
  { id: 'W4', name: 'Hinjewadi' },
  { id: 'W5', name: 'Baner' },
  { id: 'W6', name: 'Viman Nagar' },
  { id: 'W7', name: 'Koregaon Park' },
  { id: 'W8', name: 'Yerwada' },
  { id: 'W9', name: 'Sinhgad Road' },
  { id: 'W10', name: 'Wanowrie' },
  { id: 'W11', name: 'Pimpri' },
  { id: 'W12', name: 'Kadam Wak Wasti' }
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' }
];

const AUDIENCES = [
  { id: 'workers', label: 'Outdoor Workers & Labor' },
  { id: 'citizens', label: 'General Citizens & Seniors' }
];

const generateMockAlert = (wardId, lang, audience) => {
  const wardName = WARDS_LIST.find(w => w.id === wardId)?.name || 'Ward';
  
  const alerts = {
    en: {
      workers: `[HEAT WAVE RED ALERT - ${wardName}] High temperatures exceeding 42°C detected. Outdoor workers in ${wardName} must pause heavy labor between 12:00 PM and 4:00 PM. Drink ORS and water every 20 minutes. Report dizziness to the ward supervisor immediately.`,
      citizens: `[HEAT ADVISORY - ${wardName}] Extreme heat alert for residents in ${wardName}. Stay indoors during peak afternoon hours. Free AC cooling shelters are open at municipal offices. Check on elderly neighbors and keep pets hydrated.`
    },
    mr: {
      workers: `[उष्णतेची लाट रेड अलर्ट - ${wardName}] ${wardName} मध्ये तापमान ४२°C च्या वर गेले आहे. दुपारी १२ ते ४ वाजेपर्यंत उन्हात काम करणे टाळा. दर २० मिनिटांनी ओआरएस आणि पाणी प्या. चक्कर आल्यास तात्काळ पर्यवेक्षकांना सांगा.`,
      citizens: `[उष्णता सतर्कता - ${wardName}] ${wardName} मधील नागरिकांसाठी अत्यंत उष्णतेचा इशारा. दुपारच्या वेळी घराबाहेर पडणे टाळा. महानगरपालिकेची मोफत थंड हवेची आश्रयस्थानं सुरू आहेत.`
    },
    hi: {
      workers: `[लू रेड अलर्ट - ${wardName}] ${wardName} में तापमान 42°C से अधिक है। दोपहर 12 से 4 बजे के बीच बाहरी काम रोक दें। हर 20 मिनट में ओआरएस और पानी पिएं। चक्कर आने पर तुरंत अपने सुपरवाइजर को सूचित करें।`,
      citizens: `[हीट एडवाइजरी - ${wardName}] ${wardName} के नागरिकों के लिए अत्यधिक गर्मी की चेतावनी। दोपहर में घर के अंदर रहें। नगर निगम के शीतलन केंद्र खुले हैं। बुजुर्गों का विशेष ध्यान रखें।`
    }
  };

  return alerts[lang]?.[audience] || alerts.en.citizens;
};

export default function AlertStation() {
  const [selectedWard, setSelectedWard] = useState('W1');
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedAudience, setSelectedAudience] = useState('workers');
  
  const [alertText, setAlertText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOfflineMock, setIsOfflineMock] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlert = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/alert?ward_id=${selectedWard}&lang=${selectedLang}&audience=${selectedAudience}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const textResult = data.alert || data.text || data.message || generateMockAlert(selectedWard, selectedLang, selectedAudience);
      setAlertText(textResult);
      setIsOfflineMock(false);
    } catch (err) {
      console.warn('Alert API unavailable. Using localized mock generator.', err.message);
      const fallbackText = generateMockAlert(selectedWard, selectedLang, selectedAudience);
      setAlertText(fallbackText);
      setIsOfflineMock(true);
      setError('Live API unreachable. Generated localized offline advisory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [selectedWard, selectedLang, selectedAudience]);

  const handleCopy = async () => {
    if (!alertText) return;
    try {
      await navigator.clipboard.writeText(alertText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <Megaphone className="w-3.5 h-3.5" /> Emergency Broadcast Generator
            </span>
            {isOfflineMock && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                Offline Mode Active
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Multilingual Alert Station
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and broadcast targeted heat advisory alerts across municipal wards in regional languages.
          </p>
        </div>

        <button
          onClick={fetchAlert}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
          title="Refresh Alert"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Ward Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> Select Ward
          </label>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WARDS_LIST.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.id} - {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-500" /> Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audience Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-500" /> Target Audience
          </label>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AUDIENCES.map((aud) => (
              <option key={aud.id} value={aud.id}>
                {aud.label}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Error / Notice banner */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alert Output Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-rose-500" /> Generated Broadcast Text
          </label>
          <span className="text-xs text-slate-400">Ready for SMS, WhatsApp, or PA System</span>
        </div>

        <div className="relative bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium">Generating advisory...</p>
            </div>
          ) : (
            <div className="text-slate-800 dark:text-slate-100 text-base sm:text-lg font-medium leading-relaxed whitespace-pre-wrap">
              {alertText}
            </div>
          )}

          {/* Copy Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Optimized for emergency SMS & WhatsApp distribution</span>
            </div>

            <button
              onClick={handleCopy}
              disabled={loading || !alertText}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Alert Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}