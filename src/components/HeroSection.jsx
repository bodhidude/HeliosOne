import { useState, useRef, useEffect, useMemo } from 'react';
import { Send } from 'lucide-react';

export default function HeroSection({ kpData, forecast = [], chatHistory = [], isSummarizing, isAiResponding, onSendMessage, onOpenModal }) {
  const [input, setInput] = useState('');
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom of chat container only (avoids page-level scrolling)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isAiResponding]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAiResponding) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const formatMessageContent = (text) => {
    if (!text) return '';
    // Split on **bold** markers and return React elements (no dangerouslySetInnerHTML)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Get latest Kp
  const latestKpData = kpData && kpData.length > 0 ? kpData[kpData.length - 1] : null;
  const kpString = latestKpData ? latestKpData.Kp : null;
  const kp = kpString !== null && !isNaN(parseFloat(kpString)) ? parseFloat(kpString) : null;

  let statusClass = "border-slate-800 shadow-none";
  let textColor = "text-slate-400";
  let label = "SIGNAL LOSS";

  if (kp !== null) {
    if (kp <= 4) {
      statusClass = "border-alert-green/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
      textColor = "text-alert-green";
      label = "QUIET / UNSETTLED";
    } else if (kp <= 6) {
      statusClass = "border-alert-yellow/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]";
      textColor = "text-alert-yellow";
      label = "G1-G2 STORM";
    } else {
      statusClass = "border-alert-red/50 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse-fast";
      textColor = "text-alert-red";
      label = "G3-G5 STORM";
    }
  }

  // Calculate rotation for gauge (-90deg to 90deg)
  const rotation = kp !== null ? -90 + (kp / 9) * 180 : -90;

  // Process forecast peak Kp for next 3 distinct UTC dates
  const forecastDays = useMemo(() => {
    if (!forecast || forecast.length === 0) return [];
    
    // Filter for predicted values
    const predicted = forecast.filter(d => d.observed === 'predicted');
    if (predicted.length === 0) return [];
    
    // Group by calendar date (UTC)
    const groups = {};
    predicted.forEach(d => {
      if (d.time_tag) {
        const dateStr = d.time_tag.split('T')[0];
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(d);
      }
    });
    
    // Get sorted dates
    const sortedDates = Object.keys(groups).sort();
    
    // Extract max Kp for the first 3 dates
    return sortedDates.slice(0, 3).map(dateStr => {
      const items = groups[dateStr];
      const maxKp = Math.max(...items.map(item => parseFloat(item.kp)));
      
      // Format label (e.g. "26 JUN")
      const date = new Date(dateStr + 'T00:00:00Z');
      const dayNum = date.getUTCDate();
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      const label = `${dayNum} ${monthStr}`;
      
      // Determine storm label and text color
      let dayTextColor = "text-alert-green";
      let dayStormLabel = "QUIET";
      if (maxKp >= 7) {
        dayTextColor = "text-alert-red animate-pulse-slow";
        dayStormLabel = "STRONG STORM";
      } else if (maxKp >= 5) {
        dayTextColor = "text-alert-yellow";
        dayStormLabel = "MINOR STORM";
      } else if (maxKp >= 4) {
        dayTextColor = "text-slate-300";
        dayStormLabel = "UNSETTLED";
      }
      
      return {
        dateStr,
        label,
        maxKp,
        textColor: dayTextColor,
        stormLabel: dayStormLabel
      };
    });
  }, [forecast]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      
      {/* Left Column: Planetary K-Index (Kp) */}
      <div 
        className={`glass-panel cursor-pointer hover:bg-white/10 flex flex-col items-center justify-between p-6 ${statusClass}`}
        onClick={() => onOpenModal && onOpenModal({ type: 'noaa_scales', activeTab: 'g_scale' })}
      >
        <div className="text-center w-full">
          <h2 className="text-sm text-slate-300 font-bold tracking-widest uppercase">PLANETARY K-INDEX (Kp)</h2>
          <p className={`text-xs mt-1 ${textColor} font-bold tracking-widest`}>{label}</p>
        </div>

        {/* Custom Segmented SVG Gauge */}
        <div className="relative w-full max-w-[280px] flex flex-col items-center mt-6">
          <div className="w-full h-32 flex justify-center">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <defs>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Base grey track */}
              <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />

              {/* Green Zone (Kp 0 to 4) */}
              <path 
                d="M 20 95 A 80 80 0 0 1 86.11 16.23" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="8" 
                strokeLinecap="round" 
                opacity={kp !== null && kp <= 4 ? 1 : 0.5}
                filter={kp !== null && kp <= 4 ? "url(#glow-green)" : ""}
                className="transition-all duration-500"
              />
              
              {/* Yellow Zone (Kp 4 to 6) */}
              <path 
                d="M 86.11 16.23 A 80 80 0 0 1 140 25.72" 
                fill="none" 
                stroke="#F59E0B" 
                strokeWidth="8" 
                strokeLinecap="round" 
                opacity={kp !== null && kp > 4 && kp <= 6 ? 1 : 0.5}
                filter={kp !== null && kp > 4 && kp <= 6 ? "url(#glow-yellow)" : ""}
                className="transition-all duration-500"
              />

              {/* Red Zone (Kp 6 to 9) */}
              <path 
                d="M 140 25.72 A 80 80 0 0 1 180 95" 
                fill="none" 
                stroke="#EF4444" 
                strokeWidth="8" 
                strokeLinecap="round" 
                opacity={kp !== null && kp > 6 ? 1 : 0.5}
                filter={kp !== null && kp > 6 ? "url(#glow-red)" : ""}
                className="transition-all duration-500"
              />

              {/* Needle */}
              <line 
                x1="100" 
                y1="95" 
                x2="100" 
                y2="28" 
                stroke="#f8fafc" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                className="origin-[100px_95px] transition-transform duration-1000 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              />

              {/* Center Pin */}
              <circle cx="100" cy="95" r="8" fill="#0f172a" stroke="#64748b" strokeWidth="3.5" />
              <circle cx="100" cy="95" r="2.5" fill="#f8fafc" />
            </svg>
          </div>
          
          {/* Active value text placed below the gauge div to prevent overlap */}
          <div className="text-3xl font-extrabold font-mono text-white tracking-wider mt-2 z-10">
            {kp !== null ? kp.toFixed(2) : '--'}
          </div>
        </div>

        {/* 3-Day Peak Kp Forecast Timeline */}
        {forecastDays.length > 0 && (
          <div className="w-full mt-6 pt-4 border-t border-slate-800/80">
            <div className="text-[9px] tracking-widest text-slate-500 font-bold uppercase mb-2 text-center">3-Day Geomagnetic Forecast (Peak Kp)</div>
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {forecastDays.map(day => (
                <div 
                  key={day.dateStr} 
                  className="bg-slate-950/40 border border-slate-900/60 rounded px-2 py-1.5 text-center flex flex-col justify-between hover:bg-slate-900/30 transition-colors"
                >
                  <div className="text-[10px] text-slate-400 font-bold tracking-wider">{day.label}</div>
                  <div className={`text-base font-mono font-bold mt-1 ${day.textColor}`}>
                    Kp {day.maxKp.toFixed(1)}
                  </div>
                  <div className={`text-[9px] font-bold tracking-widest mt-0.5 uppercase ${day.textColor}`}>
                    {day.stormLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: AI Summary & Chat */}
      <div className="glass-panel flex flex-col p-6 border-l-4 border-l-aviation-orange min-h-[380px]">
        <h2 className="text-xs text-slate-400 font-bold tracking-widest mb-3">SYSTEM STATUS BRIEF // HELIOS-AI INTERACTIVE</h2>
        
        {isSummarizing && chatHistory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-aviation-orange animate-pulse-fast font-mono text-sm">
            [ SCANNING TELEMETRY... ]
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
            [ AWAITING TELEMETRY SYNC ]
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable messages list */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 min-h-0">
              {chatHistory.map((msg, index) => (
                <div key={index} className="flex flex-col space-y-1 text-left">
                  <div className="text-[10px] tracking-widest font-bold">
                    {msg.role === 'assistant' ? (
                      <span className="text-aviation-orange">[ HELIOS-AI ]</span>
                    ) : (
                      <span className="text-cyan-400">[ OPERATOR ]</span>
                    )}
                  </div>
                  <div 
                    className="text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-line"
                  >
                    {formatMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              
              {isAiResponding && (
                <div className="text-xs text-aviation-orange animate-pulse-slow text-left">
                  [ ANALYZING INQUIRY... ]
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2 pt-3 border-t border-slate-800/60">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Helios-AI about space weather..."
                disabled={isAiResponding}
                className="bg-slate-950/40 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-aviation-orange/70 flex-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isAiResponding}
                className="p-2.5 rounded-lg bg-aviation-orange hover:bg-aviation-orange/80 text-white transition-all flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
