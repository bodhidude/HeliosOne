import { useMemo } from 'react';
import Card from './Card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { getLatest } from '../services/utils';

export default function ModuleGrid({ data, onOpenModal }) {

  // Memoize all data processing to avoid recalculating on every render
  const {
    speed, speedData, density, densityData, bz, bt, btTrend,
    flux, fluxData, protonFlux, protonData, f107, f107Trend
  } = useMemo(() => {
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

    // F10.7 Index
    const f107 = getLatest(data.f107 || [], 'flux');
    let f107Trend = 'stable';
    if (data.f107 && data.f107.length > 1) {
      const prevF107 = parseFloat(data.f107[data.f107.length - 2].flux);
      if (f107 > prevF107) f107Trend = 'up';
      else if (f107 < prevF107) f107Trend = 'down';
    }

    return { speed, speedData, density, densityData, bz, bt, btTrend, flux, fluxData, protonFlux, protonData, f107, f107Trend };
  }, [data]);

  // Calculate Context Badges and Statuses

  // 1. Solar Wind Speed
  let speedLabel = '';
  let speedColor = '';
  if (speed !== null) {
    if (speed >= 600) {
      speedLabel = 'ALERT (CME / FAST WIND)';
      speedColor = 'text-alert-red border-alert-red/30 bg-alert-red/5';
    } else if (speed >= 450) {
      speedLabel = 'MODERATE WIND SPEED';
      speedColor = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5';
    } else {
      speedLabel = 'QUIET (SLOW WIND)';
      speedColor = 'text-alert-green border-alert-green/30 bg-alert-green/5';
    }
  }

  // 2. Proton Density
  let densityLabel = '';
  let densityColor = '';
  if (density !== null) {
    if (density >= 15) {
      densityLabel = 'HIGH DENSITY (SHOCK)';
      densityColor = 'text-alert-red border-alert-red/30 bg-alert-red/5';
    } else if (density >= 8) {
      densityLabel = 'ELEVATED DENSITY';
      densityColor = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5';
    } else {
      densityLabel = 'NOMINAL DENSITY';
      densityColor = 'text-alert-green border-alert-green/30 bg-alert-green/5';
    }
  }

  // 3. IMF Bz (Direction)
  let bzLabel = '';
  let bzColor = '';
  if (bz !== null) {
    if (bz < -5) {
      bzLabel = 'OPEN SHIELD (STRONG SOUTH)';
      bzColor = 'text-alert-red border-alert-red/30 bg-alert-red/5 animate-pulse-slow';
    } else if (bz < 0) {
      bzLabel = 'WEAK SHIELD (SOUTH)';
      bzColor = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5';
    } else {
      bzLabel = 'SHIELDED (NORTH)';
      bzColor = 'text-alert-green border-alert-green/30 bg-alert-green/5';
    }
  }

  // 4. Magnetic Bt
  let btLabel = '';
  let btColor = '';
  if (bt !== null) {
    if (bt >= 25) {
      btLabel = 'STRONG IMF FIELD';
      btColor = 'text-alert-red border-alert-red/30 bg-alert-red/5';
    } else if (bt >= 12) {
      btLabel = 'ELEVATED IMF FIELD';
      btColor = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5';
    } else {
      btLabel = 'QUIET IMF FIELD';
      btColor = 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  }

  // Solar flare class calculator
  const getFlareClass = (fluxVal) => {
    if (fluxVal === null || isNaN(fluxVal)) return '';
    if (fluxVal >= 1e-4) return `X${(fluxVal * 1e4).toFixed(1)}`;
    if (fluxVal >= 1e-5) return `M${(fluxVal * 1e5).toFixed(1)}`;
    if (fluxVal >= 1e-6) return `C${(fluxVal * 1e6).toFixed(1)}`;
    if (fluxVal >= 1e-7) return `B${(fluxVal * 1e7).toFixed(1)}`;
    return `A${(fluxVal * 1e8).toFixed(1)}`;
  };

  // 5. X-Ray Flux (R-Scale)
  let fluxLabel = '';
  let fluxColor = '';
  let fluxGlow = '';
  if (flux !== null) {
    const flareClass = getFlareClass(flux);
    if (flux >= 1e-4) {
      fluxLabel = `R3-R5 STORM (${flareClass})`;
      fluxColor = 'text-alert-red border-alert-red/35 bg-alert-red/10 animate-pulse-slow';
      fluxGlow = 'shadow-[0_0_25px_rgba(239,68,68,0.4)] border-alert-red/40';
    } else if (flux >= 1e-5) {
      fluxLabel = `R1-R2 STORM (${flareClass})`;
      fluxColor = 'text-alert-yellow border-alert-yellow/35 bg-alert-yellow/10';
      fluxGlow = 'shadow-[0_0_15px_rgba(245,158,11,0.2)] border-alert-yellow/40';
    } else if (flux >= 1e-6) {
      fluxLabel = `ACTIVE (${flareClass})`;
      fluxColor = 'text-slate-200 border-slate-800 bg-slate-900/40';
    } else {
      fluxLabel = `QUIET (${flareClass})`;
      fluxColor = 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  }

  // 6. Proton Flux (S-Scale)
  let protonLabel = '';
  let protonColor = '';
  let protonGlow = '';
  if (protonFlux !== null) {
    if (protonFlux >= 100000) {
      protonLabel = 'S5 (EXTREME STORM)';
      protonColor = 'text-alert-red border-alert-red/50 bg-alert-red/15 font-bold animate-pulse-fast';
      protonGlow = 'shadow-[0_0_35px_rgba(239,68,68,0.7)] border-alert-red animate-pulse-fast';
    } else if (protonFlux >= 10000) {
      protonLabel = 'S4 (SEVERE STORM)';
      protonColor = 'text-alert-red border-alert-red/40 bg-alert-red/10 font-bold animate-pulse-fast';
      protonGlow = 'shadow-[0_0_30px_rgba(239,68,68,0.6)] border-alert-red/60 animate-pulse-fast';
    } else if (protonFlux >= 1000) {
      protonLabel = 'S3 (STRONG STORM)';
      protonColor = 'text-alert-red border-alert-red/30 bg-alert-red/5 font-bold animate-pulse-slow';
      protonGlow = 'shadow-[0_0_25px_rgba(239,68,68,0.5)] border-alert-red/50 animate-pulse-slow';
    } else if (protonFlux >= 100) {
      protonLabel = 'S2 (MODERATE STORM)';
      protonColor = 'text-alert-yellow border-alert-yellow/35 bg-alert-yellow/10 font-bold animate-pulse-slow';
      protonGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.4)] border-alert-yellow/50 animate-pulse-slow';
    } else if (protonFlux >= 10) {
      protonLabel = 'S1 (MINOR STORM)';
      protonColor = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5 font-bold';
      protonGlow = 'shadow-[0_0_15px_rgba(245,158,11,0.3)] border-alert-yellow/40';
    } else {
      protonLabel = 'S0 (QUIET)';
      protonColor = 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  }

  // 7. F10.7 Solar Proxy
  let f107Label = '';
  let f107Color = '';
  if (f107 !== null) {
    if (f107 >= 150) {
      f107Label = 'HIGH (SOLAR MAX PEAK)';
      f107Color = 'text-alert-yellow border-alert-yellow/30 bg-alert-yellow/5';
    } else if (f107 >= 100) {
      f107Label = 'MODERATE ACTIVITY';
      f107Color = 'text-slate-300 border-slate-800 bg-slate-900/40';
    } else {
      f107Label = 'LOW ACTIVITY';
      f107Color = 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
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
        statusLabel={speedLabel}
        statusColor={speedColor}
        onClick={() => onOpenModal({ 
          title: 'Solar Wind Speed', 
          data: speedData, 
          type: 'line', 
          color: '#10B981', 
          unit: 'km/s',
          description: "The solar wind speed measures the velocity of the charged particle stream (mostly protons and electrons) flowing outward from the Sun's corona into space. Normal speeds range from 300 to 400 km/s. Speeds exceeding 500–600 km/s indicate the arrival of high-speed streams (from coronal holes) or coronal mass ejections (CMEs), which can compress Earth's magnetic shield and trigger geomagnetic storms."
        })}
      >
        <div className="w-full h-full opacity-25">
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
        info="Bz: The vertical component of the IMF; when Southward (negative), magnetic shielding weakens, enabling intense auroras."
        isError={bz === null}
        statusLabel={bzLabel}
        statusColor={bzColor}
        onInfoClick={() => onOpenModal({ type: 'noaa_scales', activeTab: 'g_scale' })}
        onClick={() => onOpenModal({ 
          title: 'IMF Bz (Direction)', 
          data: data.mag.filter(d => !isNaN(parseFloat(d.bz_gsm))).map(d => ({ value: parseFloat(d.bz_gsm), time_tag: d.time_tag })), 
          type: 'line', 
          color: '#3B82F6', 
          unit: 'nT',
          description: "Bz is the North-South vertical component of the Interplanetary Magnetic Field (IMF) carried by the solar wind. When Bz is positive (pointing North), Earth's magnetic shield is intact and deflects solar wind particles. When Bz turns negative (pointing South), Earth's shielding field lines merge with the solar wind's field lines, opening the door for charged particles to enter the upper atmosphere. A strong Southward Bz (e.g., -5 nT or lower) is the primary driver of geomagnetic storms and bright auroras."
        })}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
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
        info="Solar flare intensity measured in X-rays. High flux indicates active flaring, which blocks high-frequency radio."
        isError={flux === null}
        statusLabel={fluxLabel}
        statusColor={fluxColor}
        glowClass={fluxGlow}
        onInfoClick={() => onOpenModal({ type: 'noaa_scales', activeTab: 'r_scale' })}
        onClick={() => onOpenModal({ 
          title: 'X-Ray Flux', 
          data: fluxData, 
          type: 'area', 
          color: '#F59E0B', 
          unit: 'W/m²',
          description: "X-Ray Flux measures the intensity of solar flares in the 0.1 to 0.8 nm wavelength range, captured by GOES satellites. High X-ray emissions ionize the lower layers of Earth's ionosphere on the sunlit side, absorbing high-frequency (HF) radio signals. This leads to radio blackouts (NOAA R-Scale) that can disrupt navigation, aviation, and maritime communications. Flares are classified by class letters: A, B, C (normal), M (moderate), and X (extreme)."
        })}
      >
        <div className="w-full h-full opacity-30">
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
        statusLabel={densityLabel}
        statusColor={densityColor}
        onClick={() => onOpenModal({ 
          title: 'Proton Density', 
          data: densityData, 
          type: 'bar', 
          color: '#8B5CF6', 
          unit: 'p/cm³',
          description: "Proton Density measures the concentration of protons in the solar wind stream per cubic centimeter. Normal density values are between 1 and 10 p/cm³. A sudden, massive increase in density (often exceeding 15 to 20 p/cm³) indicates the leading edge (shock front) of a CME or CIR. When this dense plasma collides with Earth, it compresses the magnetosphere, potentially triggering a geomagnetic storm."
        })}
      >
        <div className="w-full h-full opacity-35">
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
        statusLabel={btLabel}
        statusColor={btColor}
        onClick={() => onOpenModal({ 
          title: 'Magnetic Bt', 
          data: data.mag.filter(d => !isNaN(parseFloat(d.bt))).map(d => ({ value: parseFloat(d.bt), time_tag: d.time_tag })), 
          type: 'line', 
          color: '#EC4899', 
          unit: 'nT',
          description: "Bt represents the total strength of the Interplanetary Magnetic Field (IMF) in nanoteslas. It is the vector sum of its spatial components (Bx, By, Bz). Quiet solar conditions show Bt values below 5 to 10 nT. Spikes in Bt (above 15 to 25 nT) indicate dense plasma clouds or CMEs passing near Earth. A high Bt indicates high potential energy; if Bz also turns sharply Southward, geomagnetic activity will intensify."
        })}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          {btTrend === 'up' && <ArrowUpRight className="w-12 h-12 text-alert-red animate-pulse-slow" />}
          {btTrend === 'down' && <ArrowDownRight className="w-12 h-12 text-alert-green" />}
          {btTrend === 'stable' && <ArrowRight className="w-12 h-12 text-slate-500" />}
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
        statusLabel={protonLabel}
        statusColor={protonColor}
        glowClass={protonGlow}
        onInfoClick={() => onOpenModal({ type: 'noaa_scales', activeTab: 's_scale' })}
        onClick={() => onOpenModal({ 
          title: 'Proton Flux (≥10 MeV)', 
          data: protonData, 
          type: 'area', 
          color: '#EF4444', 
          unit: 'pfu',
          description: "Proton Flux measures high-energy solar protons (>=10 MeV) reaching Earth. An increase above 10 pfu triggers a Solar Radiation Storm (NOAA S-Scale). High-energy protons can penetrate satellite shielding, causing computer upsets or degrading solar panels, and present a health risk to astronauts and passengers/crew on high-latitude flights."
        })}
      >
        <div className="w-full h-full opacity-30">
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
        statusLabel={f107Label}
        statusColor={f107Color}
        onClick={() => onOpenModal({ 
          title: 'F10.7 Index', 
          data: data.f107 ? data.f107.map(d => ({ value: parseFloat(d.flux), time_tag: d.time_tag })) : [], 
          type: 'line', 
          color: '#F59E0B', 
          unit: 'sfu',
          description: "The F10.7 index measures solar radio emissions at a wavelength of 10.7 cm. It is a highly reliable proxy for overall solar activity and sunspot count, tracking closely with solar ultraviolet radiation. F10.7 values range from <70 sfu (solar minimum) to >200 sfu (solar maximum). Elevated solar flux heats and expands the upper atmosphere, causing increased drag on low-earth orbit (LEO) satellites."
        })}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          {f107Trend === 'up' && <ArrowUpRight className="w-12 h-12 text-alert-yellow" />}
          {f107Trend === 'down' && <ArrowDownRight className="w-12 h-12 text-alert-yellow" />}
          {f107Trend === 'stable' && <ArrowRight className="w-12 h-12 text-slate-500" />}
        </div>
      </Card>

    </div>
  );
}
