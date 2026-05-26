import React from 'react';
import { Info } from 'lucide-react';

export default function Card({ title, value, unit, source, info, onClick, children, isError, glowClass }) {
  return (
    <div 
      className={`glass-panel flex flex-col h-full cursor-pointer hover:bg-white/10 group relative ${glowClass || ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-300 font-bold tracking-wider text-sm">{title}</h3>
        <div className="relative group/info">
          <Info className="w-4 h-4 text-slate-500 hover:text-aviation-orange" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-20">
            {info}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center relative min-h-[120px]">
        {isError ? (
          <div className="text-slate-600 font-mono text-xl tracking-widest">SIGNAL LOSS</div>
        ) : (
          <>
            <div className="flex items-baseline space-x-1 mb-2 z-10">
              <span className="text-3xl font-bold font-mono text-white">{value}</span>
              <span className="text-sm text-slate-400 font-mono">{unit}</span>
            </div>
            <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
              {children}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-right">
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">SRC: {source}</span>
      </div>
    </div>
  );
}
