import { Info } from 'lucide-react';

export default function Card({ title, value, unit, source, info, onClick, onInfoClick, children, isError, glowClass, statusLabel, statusColor }) {
  return (
    <div 
      className={`glass-panel flex flex-col h-full cursor-pointer hover:bg-white/10 group relative ${glowClass || ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 z-20">
        <h3 className="text-slate-300 font-bold tracking-wider text-sm">{title}</h3>
        <div 
          className="relative group/info cursor-pointer p-0.5"
          onClick={(e) => {
            if (onInfoClick) {
              e.stopPropagation();
              onInfoClick();
            }
          }}
        >
          <Info className="w-4 h-4 text-slate-500 hover:text-aviation-orange transition-colors" />
          <div className="absolute right-0 md:right-auto md:left-0 top-6 w-48 p-2 bg-slate-850 border border-slate-700 rounded text-xs text-slate-300 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-30">
            {info}
            {onInfoClick && <div className="mt-1.5 text-aviation-orange font-bold text-[10px] tracking-wider">CLICK FOR NOAA SCALE INFO</div>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center relative min-h-[120px]">
        {isError ? (
          <div className="text-slate-600 font-mono text-xl tracking-widest">SIGNAL LOSS</div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center z-10 text-center">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold font-mono text-white">{value}</span>
                <span className="text-sm text-slate-400 font-mono">{unit}</span>
              </div>
              {statusLabel && (
                <div className={`text-[10px] font-bold font-mono tracking-wider mt-1.5 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800/80 ${statusColor || 'text-slate-400'}`}>
                  {statusLabel}
                </div>
              )}
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
