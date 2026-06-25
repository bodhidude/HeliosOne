import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Cpu, Settings, Check, AlertTriangle, Cloud, Terminal } from 'lucide-react';
import { fetchAiStatus } from '../services/ai';

export default function Header({ 
  lastSync, 
  loading, 
  onSync, 
  aiProvider, 
  setAiProvider, 
  aiModel, 
  setAiModel 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [customModel, setCustomModel] = useState(aiModel);
  const dropdownRef = useRef(null);

  // Check the status of the local Python backend and Ollama
  const checkStatus = async () => {
    setCheckingStatus(true);
    const status = await fetchAiStatus();
    setBackendStatus(status);
    setCheckingStatus(false);
  };

  useEffect(() => {
    checkStatus();
    // Auto-refresh AI status every 15 seconds
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Sync custom model state
  useEffect(() => {
    setCustomModel(aiModel);
  }, [aiModel]);

  const handleProviderChange = (provider) => {
    setAiProvider(provider);
    // Auto-set sensible default models for cloud providers if changed
    if (provider === 'gemini') {
      setAiModel('gemini-2.0-flash');
    } else if (provider === 'openai') {
      setAiModel('gpt-4o-mini');
    } else if (provider === 'anthropic') {
      setAiModel('claude-3-5-sonnet');
    } else if (provider === 'ollama') {
      if (backendStatus?.ollama?.available_models?.length) {
        // Default to gemma4:e4b if available, else first available, else user default
        const hasGemma = backendStatus.ollama.available_models.includes('gemma4:e4b');
        setAiModel(hasGemma ? 'gemma4:e4b' : backendStatus.ollama.available_models[0]);
      } else {
        setAiModel('gemma4:e4b');
      }
    }
  };

  const handleApplyCustomModel = (e) => {
    e.preventDefault();
    if (customModel.trim()) {
      setAiModel(customModel.trim());
    }
  };

  // Determine Ollama status
  const isOllamaOnline = backendStatus?.ollama?.status === "ONLINE";
  const ollamaModels = backendStatus?.ollama?.available_models || [];

  return (
    <header className="relative z-50 flex flex-col md:flex-row justify-between items-center glass-panel border-aviation-orange/20 py-4 px-6 gap-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-widest text-slate-100 flex items-center">
          HELIOS-1 <span className="text-aviation-orange mx-2">//</span> SPACE WEATHER TELEMETRY
        </h1>
        
        {/* Sleek dynamic active LLM badge */}
        <div className="flex items-center space-x-2 text-xs border border-slate-700/80 bg-slate-900/60 rounded px-2.5 py-1 text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-aviation-orange" />
          <span className="font-semibold uppercase tracking-wider text-slate-300">{aiProvider}</span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-200 font-mono font-bold">{aiModel}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm w-full md:w-auto justify-end">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 hidden sm:inline">LAST SYNC:</span>
          <span className="text-slate-200 text-xs font-mono bg-slate-950/40 border border-slate-800 px-2 py-1 rounded">
            {lastSync ? `${lastSync.split('T')[1].slice(0, 8)} UTC` : 'PENDING'}
          </span>
        </div>
        
        <button 
          onClick={onSync}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 hover:border-aviation-orange/40 rounded-md border border-slate-600 transition-all flex items-center justify-center text-aviation-orange disabled:opacity-50 active:scale-95 cursor-pointer"
          title="Manual Sync"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* LLM Control Center Gear Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            checkStatus();
          }}
          className={`p-2 rounded-md border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
            isOpen 
              ? 'bg-aviation-orange/15 text-aviation-orange border-aviation-orange/50 shadow-[0_0_8px_rgba(252,61,33,0.3)]' 
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
          }`}
          title="LLM Service Settings"
        >
          <Settings className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center space-x-2 border border-slate-600 px-3 py-1 rounded bg-slate-850">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-alert-yellow animate-pulse-fast' : 'bg-alert-green animate-pulse-slow shadow-[0_0_8px_#10B981]'}`} />
          <span className="font-bold text-xs tracking-widest">{loading ? 'SYNCING' : 'LIVE'}</span>
        </div>
      </div>

      {/* Flyout LLM Control Center Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-6 top-18 z-50 w-85 glass-panel border-aviation-orange/30 shadow-[0_12px_32px_rgba(11,13,23,0.8),_0_0_15px_rgba(252,61,33,0.15)] p-5 space-y-5 animate-fade-in text-left text-slate-100"
        >
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold tracking-widest text-xs text-aviation-orange">LLM CONTROL CENTER</span>
            <div className="flex items-center space-x-1.5 text-[10px]">
              <span className="text-slate-500">BACKEND:</span>
              {backendStatus ? (
                <span className="text-alert-green font-bold flex items-center">
                  <span className="w-1.5 h-1.5 bg-alert-green rounded-full mr-1 animate-pulse-slow" /> ONLINE
                </span>
              ) : (
                <span className="text-alert-red font-bold flex items-center">
                  <span className="w-1.5 h-1.5 bg-alert-red rounded-full mr-1" /> OFFLINE
                </span>
              )}
            </div>
          </div>

          {/* Provider Selector Tabs */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">LLM Provider</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ollama', label: 'Ollama (Local)' },
                { id: 'gemini', label: 'Gemini' },
                { id: 'openai', label: 'OpenAI' },
                { id: 'anthropic', label: 'Anthropic' }
              ].map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border text-left flex items-center justify-between cursor-pointer transition-all ${
                    aiProvider === provider.id
                      ? 'bg-aviation-orange/10 border-aviation-orange text-aviation-orange font-bold shadow-[inset_0_1px_8px_rgba(252,61,33,0.05)]'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{provider.label}</span>
                  {aiProvider === provider.id && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ollama specific details */}
          {aiProvider === 'ollama' && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded space-y-2 text-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                <span>Ollama Telemetry Status</span>
                <span className={isOllamaOnline ? "text-alert-green" : "text-alert-red"}>
                  {isOllamaOnline ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Host: <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-aviation-orange">127.0.0.1:11434</span>
              </div>

              {!isOllamaOnline ? (
                <div className="flex items-start space-x-2 text-alert-yellow bg-alert-yellow/5 border border-alert-yellow/20 p-2 rounded text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Ollama is unreachable. Ensure the desktop app is open and listening at 127.0.0.1:11434.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-slate-500 font-bold uppercase">Select Pulled Model</label>
                  {ollamaModels.length > 0 ? (
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-1.5 text-xs font-mono font-semibold focus:outline-none focus:border-aviation-orange cursor-pointer"
                    >
                      {ollamaModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-alert-yellow flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> No models pulled. Run `ollama pull gemma4:e4b`.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model selection Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">Model Specifier</label>
              {aiProvider !== 'ollama' && (
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Cloud className="w-3 h-3" /> requires API Key in .env
                </span>
              )}
            </div>

            <form onSubmit={handleApplyCustomModel} className="flex gap-1.5">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. gemma4:e4b, gpt-4o-mini"
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-aviation-orange"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs border border-slate-700 cursor-pointer font-bold transition-all active:scale-95"
              >
                APPLY
              </button>
            </form>

            {/* Model Suggestions */}
            {aiProvider !== 'ollama' && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(aiProvider === 'gemini' 
                  ? ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
                  : aiProvider === 'openai'
                  ? ['gpt-4o-mini', 'gpt-4o', 'o1-mini']
                  : ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus']
                ).map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setCustomModel(sug);
                      setAiModel(sug);
                    }}
                    className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded hover:text-slate-200 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-850 flex items-start gap-1">
            <Terminal className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
            <span>
              All providers route through the python backend utilizing Andrew Ng's <strong>`aisuite`</strong>. Set provider credentials in <code>.env</code>.
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
