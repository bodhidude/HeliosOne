import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function HeroSection({ kpData, chatHistory = [], isSummarizing, isAiResponding, onSendMessage, onOpenModal }) {
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
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
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
      statusClass = "border-alert-green shadow-[0_0_20px_rgba(16,185,129,0.3)]";
      textColor = "text-alert-green";
      label = "QUIET / UNSETTLED";
    } else if (kp <= 6) {
      statusClass = "border-alert-yellow shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse-slow";
      textColor = "text-alert-yellow";
      label = "G1-G2 STORM";
    } else {
      statusClass = "border-alert-red shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse-fast";
      textColor = "text-alert-red";
      label = "G3-G5 STORM";
    }
  }

  // Calculate rotation for gauge (-90deg to 90deg)
  const rotation = kp !== null ? -90 + (kp / 9) * 180 : -90;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      
      {/* Left Column: Planetary K-Index (Kp) */}
      <div 
        className={`glass-panel cursor-pointer hover:bg-white/10 ${statusClass} flex flex-col items-center justify-center p-8`}
        onClick={() => onOpenModal && onOpenModal({ type: 'kp_info' })}
      >
        <div className="text-center mb-6">
          <h2 className="text-xl text-slate-300 font-bold tracking-widest">PLANETARY K-INDEX (Kp)</h2>
          <p className={`text-sm mt-2 ${textColor} tracking-widest`}>{label}</p>
        </div>

        <div className="relative w-64 h-32 overflow-hidden flex justify-center mt-4">
          {/* Gauge Background */}
          <div className="w-64 h-64 border-8 border-slate-700 rounded-full absolute top-0" />
          
          {/* Needle */}
          <div 
            className="absolute bottom-0 w-1 h-32 bg-slate-400 origin-bottom transition-transform duration-1000 ease-out z-10"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="w-3 h-3 bg-white rounded-full absolute -top-1.5 -left-1 shadow-[0_0_10px_white]" />
          </div>

          {/* Center dot */}
          <div className="absolute bottom-[-8px] w-4 h-4 bg-slate-300 rounded-full z-20" />
        </div>

        <div className="text-5xl font-bold mt-4 font-mono text-white">
          {kp !== null ? kp.toFixed(2) : '--'}
        </div>
      </div>

      {/* Right Column: AI Summary & Chat */}
      <div className="glass-panel flex flex-col p-6 border-l-4 border-l-aviation-orange h-[380px]">
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
                <div key={index} className="flex flex-col space-y-1">
                  <div className="text-[10px] tracking-widest font-bold">
                    {msg.role === 'assistant' ? (
                      <span className="text-aviation-orange">[ HELIOS-AI ]</span>
                    ) : (
                      <span className="text-cyan-400">[ OPERATOR ]</span>
                    )}
                  </div>
                  <div 
                    className="text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                  />
                </div>
              ))}
              
              {isAiResponding && (
                <div className="text-xs text-aviation-orange animate-pulse-slow">
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
