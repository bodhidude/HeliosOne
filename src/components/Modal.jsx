import { useState, useEffect } from 'react';
import { X, Radio, Shield, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Modal({ content, onClose }) {
  const [activeTab, setActiveTab] = useState(content?.activeTab || 'g_scale');

  // Note: Modal is conditionally rendered in App.jsx, so it re-mounts with fresh
  // state from content.activeTab on each open. No sync effect needed.

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!content) return null;

  // Robust date parser for NOAA timestamps
  const parseNoaaDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) {
      if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
        return new Date(dateStr + 'Z'); // Force UTC
      }
      return new Date(dateStr);
    }
    // Replace space with 'T' and add 'Z' for UTC
    const formatted = dateStr.replace(' ', 'T') + 'Z';
    return new Date(formatted);
  };

  const formatDate = (dateStr) => {
    const date = parseNoaaDate(dateStr);
    if (!date || isNaN(date.getTime())) return '';
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes} UTC`;
  };

  const formatTooltipLabel = (label) => {
    const date = parseNoaaDate(label);
    if (!date || isNaN(date.getTime())) return '';
    return date.toUTCString();
  };

  const formatTooltipValue = (value) => {
    const displayValue = content.title === 'X-Ray Flux' ? value.toExponential(2).toUpperCase() : value;
    return [displayValue, content.unit || ''];
  };

  const renderNoaaScalesContent = () => {
    switch (activeTab) {
      case 'g_scale':
        return (
          <div className="space-y-4 font-mono text-xs md:text-sm text-slate-300">
            <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded leading-relaxed">
              <span className="text-alert-yellow font-bold">GEOMAGNETIC STORMS (G-SCALE):</span> Distortions in Earth's magnetosphere caused by energy transfer from solar wind. Typically triggered by coronal mass ejections (CMEs) or high-speed streams.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Index</th>
                    <th className="py-2.5 px-3">Grid & System Effects</th>
                    <th className="py-2.5 px-3">Auroral Visibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red">G5 (Extreme)</td>
                    <td className="py-3 px-3 font-bold">Kp 9</td>
                    <td className="py-3 px-3">Widespread power grid collapse/blackouts. Satellite orientation loss. HF radio blocked for days.</td>
                    <td className="py-3 px-3 text-slate-400">Mid-latitudes to tropics (e.g. Florida, Southern Europe).</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red opacity-85">G4 (Severe)</td>
                    <td className="py-3 px-3 font-bold">Kp 8</td>
                    <td className="py-3 px-3">Widespread power voltage control issues. Spacecraft charging/tracking anomalies.</td>
                    <td className="py-3 px-3 text-slate-400">Mid-latitudes (e.g. California, Alabama, Northern Germany).</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow">G3 (Strong)</td>
                    <td className="py-3 px-3 font-bold">Kp 7</td>
                    <td className="py-3 px-3">Voltage corrections required. Satellites experience drag/orientation corrections.</td>
                    <td className="py-3 px-3 text-slate-400">Sub-auroral zones (e.g. Oregon, Illinois, Northern UK).</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow opacity-85">G2 (Moderate)</td>
                    <td className="py-3 px-3 font-bold">Kp 6</td>
                    <td className="py-3 px-3">High-latitude power systems experience voltage alarms. Slight spacecraft drag.</td>
                    <td className="py-3 px-3 text-slate-400">High-latitude US states (e.g. New York, Idaho, Central UK).</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-green">G1 (Minor)</td>
                    <td className="py-3 px-3 font-bold">Kp 5</td>
                    <td className="py-3 px-3">Weak power grid fluctuations. Negligible satellite impact.</td>
                    <td className="py-3 px-3 text-slate-400">High latitudes (e.g. Alaska, Canada, Scandinavia).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 's_scale':
        return (
          <div className="space-y-4 font-mono text-xs md:text-sm text-slate-300">
            <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded leading-relaxed">
              <span className="text-alert-red font-bold">SOLAR RADIATION STORMS (S-SCALE):</span> Elevated levels of high-energy protons entering the atmosphere. Triggered by major solar flares and coronal mass ejections.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Flux Threshold</th>
                    <th className="py-2.5 px-3">Biological Risks</th>
                    <th className="py-2.5 px-3">Satellite & Comm Impacts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red">S5 (Extreme)</td>
                    <td className="py-3 px-3 font-bold">100,000 pfu</td>
                    <td className="py-3 px-3">Severe radiation hazard to astronauts and high-latitude passengers.</td>
                    <td className="py-3 px-3 text-slate-400">Complete satellite loss. Total polar radio blackout for days.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red opacity-85">S4 (Severe)</td>
                    <td className="py-3 px-3 font-bold">10,000 pfu</td>
                    <td className="py-3 px-3">High radiation hazard for astronauts. Flight route warnings at high latitudes.</td>
                    <td className="py-3 px-3 text-slate-400">Satellite solar array loss/outages. Polar HF radio blackout.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow">S3 (Strong)</td>
                    <td className="py-3 px-3 font-bold">1,000 pfu</td>
                    <td className="py-3 px-3">Radiation warning for astronauts. High-altitude flight radiation risk.</td>
                    <td className="py-3 px-3 text-slate-400">Satellite solar panel degradation. Polar route radio blackouts.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow opacity-85">S2 (Moderate)</td>
                    <td className="py-3 px-3 font-bold">100 pfu</td>
                    <td className="py-3 px-3">Nominal biological hazard.</td>
                    <td className="py-3 px-3 text-slate-400">Satellites experience single-event upsets. Weak polar radio.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-green">S1 (Minor)</td>
                    <td className="py-3 px-3 font-bold">10 pfu</td>
                    <td className="py-3 px-3">No significant biological effects.</td>
                    <td className="py-3 px-3 text-slate-400">Negligible satellite impacts. Minor polar route radio degradation.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'r_scale':
        return (
          <div className="space-y-4 font-mono text-xs md:text-sm text-slate-300">
            <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded leading-relaxed">
              <span className="text-alert-green font-bold">RADIO BLACKOUTS (R-SCALE):</span> High-frequency (HF) radio signal absorption caused by intense solar X-ray emissions ionizing the D-region of Earth's ionosphere.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Flare Class</th>
                    <th className="py-2.5 px-3">HF Radio Outage (Sunlit Side)</th>
                    <th className="py-2.5 px-3">GPS & Navigation Degradation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red">R5 (Extreme)</td>
                    <td className="py-3 px-3 font-bold">X20+ flare</td>
                    <td className="py-3 px-3">Complete HF radio blackout on sunlit side for days.</td>
                    <td className="py-3 px-3 text-slate-400">Severe GPS and low-frequency navigation outages for days.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-red opacity-85">R4 (Severe)</td>
                    <td className="py-3 px-3 font-bold">X10 flare</td>
                    <td className="py-3 px-3">Widespread HF radio blackout on sunlit side for hours.</td>
                    <td className="py-3 px-3 text-slate-400">Widespread GPS outages and increased navigation errors.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow">R3 (Strong)</td>
                    <td className="py-3 px-3 font-bold">X1 flare</td>
                    <td className="py-3 px-3">Wide blackout of HF radio on sunlit side for an hour or more.</td>
                    <td className="py-3 px-3 text-slate-400">Satellite navigation (GPS) degraded/lost in sunlit regions.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-yellow opacity-85">R2 (Moderate)</td>
                    <td className="py-3 px-3 font-bold">M5 flare</td>
                    <td className="py-3 px-3">Wide blackout of HF radio on sunlit side for tens of minutes.</td>
                    <td className="py-3 px-3 text-slate-400">Mild GPS signal degradation.</td>
                  </tr>
                  <tr className="hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-alert-green">R1 (Minor)</td>
                    <td className="py-3 px-3 font-bold">M1 flare</td>
                    <td className="py-3 px-3">Weak HF radio degradation on sunlit side.</td>
                    <td className="py-3 px-3 text-slate-400">Negligible navigation impacts.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isNoaaScales = content.type === 'noaa_scales';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={isNoaaScales ? 'NOAA Space Weather Scales Reference' : content.title}
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-full max-h-[85vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-850/80">
          <h2 className="text-lg md:text-xl font-bold font-mono tracking-widest text-slate-150">
            {isNoaaScales ? 'NOAA SPACE WEATHER SCALES REFERENCE' : content.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-450 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs for NOAA Scales */}
        {isNoaaScales && (
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2 text-xs md:text-sm font-mono">
            <button
              onClick={() => setActiveTab('g_scale')}
              className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all border ${
                activeTab === 'g_scale'
                  ? 'bg-alert-yellow/10 border-alert-yellow/45 text-alert-yellow shadow-[0_0_8px_rgba(245,158,11,0.08)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>G-SCALE (Geomagnetic)</span>
            </button>
            <button
              onClick={() => setActiveTab('s_scale')}
              className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all border ${
                activeTab === 's_scale'
                  ? 'bg-alert-red/10 border-alert-red/45 text-alert-red shadow-[0_0_8px_rgba(239,68,68,0.08)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>S-SCALE (Radiation)</span>
            </button>
            <button
              onClick={() => setActiveTab('r_scale')}
              className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all border ${
                activeTab === 'r_scale'
                  ? 'bg-cyan-400/10 border-cyan-400/45 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.08)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>R-SCALE (Blackout)</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col">
          {isNoaaScales ? (
            renderNoaaScalesContent()
          ) : (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="w-full h-[280px] md:h-[320px] min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  {content.type === 'line' && (
                    <LineChart data={content.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time_tag" tickFormatter={formatDate} stroke="#94a3b8" minTickGap={30} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                        labelFormatter={formatTooltipLabel}
                        formatter={formatTooltipValue}
                      />
                      <Line type="monotone" dataKey="value" stroke={content.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  )}
                  {content.type === 'area' && (
                    <AreaChart data={content.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time_tag" tickFormatter={formatDate} stroke="#94a3b8" minTickGap={30} />
                      <YAxis 
                        scale="log" 
                        domain={[content.title === 'X-Ray Flux' ? 1e-9 : 0.1, 'auto']} 
                        stroke="#94a3b8" 
                        tickFormatter={(val) => val.toExponential(0).toUpperCase()}
                        allowDataOverflow
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                        labelFormatter={formatTooltipLabel}
                        formatter={formatTooltipValue}
                      />
                      <Area type="monotone" dataKey="value" stroke={content.color} fill={content.color} fillOpacity={0.2} />
                    </AreaChart>
                  )}
                  {content.type === 'bar' && (
                    <BarChart data={content.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time_tag" tickFormatter={formatDate} stroke="#94a3b8" minTickGap={30} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                        labelFormatter={formatTooltipLabel}
                        formatter={formatTooltipValue}
                      />
                      <Bar dataKey="value" fill={content.color} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              
              {content.description && (
                <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded leading-relaxed text-xs md:text-sm font-mono text-slate-300">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Metric Analysis & Significance</div>
                  {content.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
