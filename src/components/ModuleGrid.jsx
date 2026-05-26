import React from 'react';
import Card from './Card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export default function ModuleGrid({ data, onOpenModal }) {
  const getLatest = (arr, key) => {
    if (!arr || !arr.length) return null;
    for (let i = arr.length - 1; i >= 0; i--) {
      const val = parseFloat(arr[i][key]);
      if (!isNaN(val)) return val;
    }
    return null;
  };

  // Solar Wind Speed
  const speed = getLatest(data.plasma, 'speed');
  const speedData = data.plasma.filter(d => !isNaN(parseFloat(d.speed))).map(d => ({ value: parseFloat(d.speed), time_tag: d.time_tag }));

  // Proton Density
  const density = getLatest(data.plasma, 'density');
  const densityData = data.plasma.filter(d => !isNaN(parseFloat(d.density))).map(d => ({ value: parseFloat(d.density), time_tag: d.time_tag }));

  // IMF Bz
  const bz = getLatest(data.mag, 'bz_gsm');
  
  // Magnetic Bt
  const bt = getLatest(data.mag, 'bt');
  const prevBt = data.mag && data.mag.length > 1 ? parseFloat(data.mag[data.mag.length - 2].bt) : bt;
  let btTrend = 'stable';
  if (bt !== null && prevBt !== null) {
    if (bt > prevBt + 0.1) btTrend = 'up';
    else if (bt < prevBt - 0.1) btTrend = 'down';
  }

  // X-Ray Flux
  const flux = getLatest(data.xrays, 'flux');
  const fluxData = data.xrays.filter(d => !isNaN(parseFloat(d.flux))).map(d => ({ value: Math.max(1e-9, parseFloat(d.flux)), time_tag: d.time_tag }));

  // Proton Flux
  const protonDataPoints = (data.protons || []).filter(d => d.energy === ">=10 MeV" && !isNaN(parseFloat(d.flux)));
  const protonFlux = getLatest(protonDataPoints, 'flux');
  const protonData = protonDataPoints.map(d => ({ value: Math.max(0.1, parseFloat(d.flux)), time_tag: d.time_tag }));

  let protonGlow = '';
  if (protonFlux !== null) {
    if (protonFlux >= 100) protonGlow = 'shadow-[0_0_30px_rgba(239,68,68,0.6)] border-alert-red animate-pulse-fast';
    else if (protonFlux >= 10) protonGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.5)] border-alert-yellow animate-pulse-slow';
  }

  // F10.7 Index
  const f107 = getLatest(data.f107 || [], 'flux');
  let f107Trend = 'stable';
  if (data.f107 && data.f107.length > 1) {
    const prevF107 = parseFloat(data.f107[data.f107.length - 2].flux);
    if (f107 > prevF107) f107Trend = 'up';
    else if (f107 < prevF107) f107Trend = 'down';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Solar Wind Speed */}
      <Card 
        title="SOLAR WIND SPEED"
        value={speed !== null ? speed.toFixed(1) : null}
        unit="km/s"
        source="SOLAR-1"
        info="Speed of the charged particle stream from the Sun."
        isError={speed === null}
        onClick={() => onOpenModal({ title: 'Solar Wind Speed', data: speedData, type: 'line', color: '#10B981', unit: 'km/s' })}
      >
        <div className="w-full h-full opacity-30 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedData.slice(-100)}>
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* IMF Bz */}
      <Card 
        title="IMF Bz (DIRECTION)"
        value={bz !== null ? bz.toFixed(2) : null}
        unit="nT"
        source="SOLAR-1"
        info="Bz: The vertical component of the IMF; when Southward (negative), auroras are likely."
        isError={bz === null}
        onClick={() => onOpenModal({ title: 'IMF Bz (Direction)', data: data.mag.filter(d => !isNaN(parseFloat(d.bz_gsm))).map(d => ({ value: parseFloat(d.bz_gsm), time_tag: d.time_tag })), type: 'line', color: '#3B82F6', unit: 'nT' })}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <span className="text-[10px] text-slate-500 mb-1 font-mono">NORTH</span>
          <div className="w-1 h-24 bg-slate-700 relative rounded-full overflow-hidden">
            {bz !== null && (
              <div 
                className={`absolute w-full rounded-full transition-all duration-500 ${bz >= 0 ? 'bg-alert-green top-1/2 -translate-y-full' : 'bg-alert-red top-1/2'}`}
                style={{ height: `${Math.min(100, Math.abs(bz) * 5)}%` }}
              />
            )}
            <div className="w-full h-[2px] bg-white absolute top-1/2 -translate-y-1/2 z-10" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">SOUTH</span>
        </div>
      </Card>

      {/* X-Ray Flux */}
      <Card 
        title="X-RAY FLUX"
        value={flux !== null ? flux.toExponential(2).toUpperCase() : null}
        unit="W/m²"
        source="GOES-PRIMARY"
        info="Solar flare intensity measured in X-rays."
        isError={flux === null}
        onClick={() => onOpenModal({ title: 'X-Ray Flux', data: fluxData, type: 'area', color: '#F59E0B', unit: 'W/m²' })}
      >
        <div className="w-full h-full opacity-40 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluxData.slice(-100)}>
              <YAxis scale="log" domain={['auto', 'auto']} hide />
              <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#F59E0B" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Proton Density */}
      <Card 
        title="PROTON DENSITY"
        value={density !== null ? density.toFixed(2) : null}
        unit="p/cm³"
        source="SOLAR-1"
        info="Density of the solar wind plasma."
        isError={density === null}
        onClick={() => onOpenModal({ title: 'Proton Density', data: densityData, type: 'bar', color: '#8B5CF6', unit: 'p/cm³' })}
      >
        <div className="w-full h-full opacity-40 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={densityData.slice(-50)}>
              <Bar dataKey="value" fill="#8B5CF6" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Magnetic Bt */}
      <Card 
        title="MAGNETIC Bt"
        value={bt !== null ? bt.toFixed(2) : null}
        unit="nT"
        source="SOLAR-1"
        info="Total Interplanetary Magnetic Field strength."
        isError={bt === null}
        onClick={() => onOpenModal({ title: 'Magnetic Bt', data: data.mag.filter(d => !isNaN(parseFloat(d.bt))).map(d => ({ value: parseFloat(d.bt), time_tag: d.time_tag })), type: 'line', color: '#EC4899', unit: 'nT' })}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          {btTrend === 'up' && <ArrowUpRight className="w-12 h-12 text-alert-red" />}
          {btTrend === 'down' && <ArrowDownRight className="w-12 h-12 text-alert-green" />}
          {btTrend === 'stable' && <ArrowRight className="w-12 h-12 text-slate-400" />}
        </div>
      </Card>

      {/* Proton Flux */}
      <Card 
        title="RADIATION (PROTON FLUX)"
        value={protonFlux !== null ? protonFlux.toFixed(2) : null}
        unit="pfu"
        source="GOES-PRIMARY"
        info="Measures high-energy protons arriving from the Sun; high levels can impact satellite electronics and polar aviation safety."
        isError={protonFlux === null}
        glowClass={protonGlow}
        onClick={() => onOpenModal({ title: 'Proton Flux (≥10 MeV)', data: protonData, type: 'area', color: '#EF4444', unit: 'pfu' })}
      >
        <div className="w-full h-full opacity-40 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={protonData.slice(-100)}>
              <YAxis scale="log" domain={['auto', 'auto']} hide />
              <Area type="monotone" dataKey="value" stroke="#EF4444" fill="#EF4444" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* F10.7 Index */}
      <Card 
        title="SOLAR PROXY (F10.7)"
        value={f107 !== null ? Math.round(f107) : null}
        unit="sfu"
        source="PENTICTON/NRC"
        info="A primary indicator of overall solar activity and sunspot levels; used to predict satellite drag and ionospheric conditions."
        isError={f107 === null}
        onClick={() => onOpenModal({ title: 'F10.7 Index', data: data.f107 ? data.f107.map(d => ({ value: parseFloat(d.flux), time_tag: d.time_tag })) : [], type: 'line', color: '#F59E0B', unit: 'sfu' })}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          {f107Trend === 'up' && <ArrowUpRight className="w-12 h-12 text-alert-yellow" />}
          {f107Trend === 'down' && <ArrowDownRight className="w-12 h-12 text-alert-yellow" />}
          {f107Trend === 'stable' && <ArrowRight className="w-12 h-12 text-slate-400" />}
        </div>
      </Card>

    </div>
  );
}
