import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Modal({ content, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!content) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTooltipLabel = (label) => {
    if (!label) return '';
    return new Date(label).toLocaleString();
  };

  const formatTooltipValue = (value) => {
    const displayValue = content.title === 'X-Ray Flux' ? value.toExponential(2).toUpperCase() : value;
    return [displayValue, content.unit || ''];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-full max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold font-mono tracking-widest text-slate-200">
            {content.type === 'kp_info' ? 'NOAA G-SCALE (GEOMAGNETIC STORMS)' : content.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
          {content.type === 'kp_info' ? (
            <div className="space-y-6 text-slate-300 font-mono text-sm leading-relaxed max-w-2xl mx-auto">
              <p>
                The K-index quantifies disturbances in the horizontal component of earth's magnetic field with an integer in the range 0-9 with 1 being calm and 5 or more indicating a geomagnetic storm.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="w-16 font-bold text-alert-green shrink-0">Kp 0-4</span>
                  <span>Quiet to unsettled conditions. No significant anomalies expected.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-16 font-bold text-alert-yellow shrink-0">Kp 5-6</span>
                  <span><strong>G1-G2 (Minor to Moderate):</strong> Weak power grid fluctuations can occur. Minor impact on satellite operations possible. Auroras visible at high latitudes.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-16 font-bold text-alert-red shrink-0">Kp 7-9</span>
                  <span><strong>G3-G5 (Strong to Extreme):</strong> Voltage corrections may be required on power systems. Spacecraft operations may experience surface charging and tracking problems. Auroras visible at mid-latitudes.</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex-1 w-full h-full min-h-[300px]">
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
                      domain={[1e-9, 'auto']} 
                      stroke="#94a3b8" 
                      tickFormatter={(val) => val.toExponential(0).toUpperCase()}
                      allowDataOverflow
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                      labelFormatter={formatTooltipLabel}
                      formatter={formatTooltipValue}
                    />
                    <Area type="monotone" dataKey="value" stroke={content.color} fill={content.color} fillOpacity={0.3} />
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
          )}
        </div>
      </div>
    </div>
  );
}
