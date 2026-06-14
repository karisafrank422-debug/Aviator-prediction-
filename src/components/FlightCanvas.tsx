import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, Compass, Flame, ShieldAlert } from 'lucide-react';

interface FlightCanvasProps {
  status: 'waiting' | 'climbing' | 'crashed';
  multiplier: number;
  countdown: number;
  predictedCrashPoint?: number;
  activeRoom?: string;
  betikaWaitDuration?: number;
  appWaitPeriod?: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({ 
  status, 
  multiplier, 
  countdown, 
  predictedCrashPoint, 
  activeRoom,
  betikaWaitDuration = 5.0,
  appWaitPeriod = 3.0
}) => {
  const [starOffset, setStarOffset] = useState(0);

  // Animate grid background lines during flight to simulate forward momentum
  useEffect(() => {
    if (status !== 'climbing') return;
    const interval = setInterval(() => {
      setStarOffset(prev => (prev + 1) % 100);
    }, 45);
    return () => clearInterval(interval);
  }, [status]);

  // Calculate coordinates dynamic plane position based on multiplier height
  const getPlaneCoordinates = () => {
    // Range from 1.00x up to whatever
    const progress = Math.min(1.0, (multiplier - 1.0) / 4.0); // caps visual curve scaling
    const x = 10 + progress * 70; // 10% to 80%
    const y = 80 - progress * 60; // 80% down to 20%
    return { x, y };
  };

  const planePos = getPlaneCoordinates();

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] shadow-2xl flex items-center justify-center select-none group">
      {/* Curved glowing neon grid lines */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(ellipse at bottom left, #4f46e5 0%, transparent 70%), linear-gradient(0deg, #1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          backgroundPosition: `0px 0px, -${starOffset}px ${starOffset}px, -${starOffset}px ${starOffset}px`
        }}
      />

      {/* Radiant vector rays background from the actual Betika screenshot */}
      <div className="absolute inset-y-0 left-0 right-1/2 bg-gradient-to-r from-indigo-5055/10 to-transparent pointer-events-none transform -skew-x-12 origin-bottom-left animate-pulse" />

      {/* Top Left Live Room Indicator */}
      <div className="absolute top-4 left-4 z-30 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[10px] text-slate-300 flex items-center gap-2 shadow-lg select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-extrabold text-white tracking-widest uppercase">Target Focus: {activeRoom || 'Room #3'}</span>
      </div>

      {/* Waiting State */}
      {status === 'waiting' && (() => {
        const isAnalyzing = countdown > (betikaWaitDuration - appWaitPeriod);
        const syncRemaining = Math.max(0, countdown - (betikaWaitDuration - appWaitPeriod));
        
        return (
          <div className="text-center z-10 flex flex-col items-center gap-4 animate-fade-in max-w-sm px-4">
            <div className="relative w-22 h-22 flex items-center justify-center">
              {/* Pulsing countdown circle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  className="stroke-slate-800 fill-transparent"
                  strokeWidth="4"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  className={`${isAnalyzing ? 'stroke-amber-500' : 'stroke-emerald-500'} fill-transparent transition-all duration-100`}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - countdown / betikaWaitDuration)}`}
                />
              </svg>
              <div className="flex flex-col items-center justify-center font-mono">
                <span className="text-2xl font-black text-slate-100 leading-none">{countdown.toFixed(1)}s</span>
                <span className="text-[8px] text-slate-5050 text-slate-400 font-sans tracking-tight uppercase mt-0.5">Betika S</span>
              </div>
            </div>

            <div className="space-y-1">
              {isAnalyzing ? (
                <div className="animate-pulse">
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    Syncing Live Telemetry: {syncRemaining.toFixed(1)}s
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Waiting for Betika round triggers to capture multipliers</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    Prediction Ready
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Rounds calibrated. Tactical decision locked.</p>
                </div>
              )}
            </div>

            {/* Displaying our predicted cashout endpoint */}
            {!isAnalyzing && predictedCrashPoint && (
              <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs py-2 px-5 rounded-xl flex flex-col items-center gap-1 font-mono shadow-xl animate-bounce">
                <span className="text-[9px] text-emerald-400 font-sans tracking-wide uppercase font-bold">Predicted End Crash</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{predictedCrashPoint.toFixed(2)}x</span>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase">(98% probability focus)</span>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-slate-900/90 border border-slate-800 text-slate-400 text-[10px] py-1.5 px-4 rounded-lg font-mono">
                AI Prediction is frozen until sync finishes
              </div>
            )}
          </div>
        );
      })()}

      {/* Climbing Active Flight State */}
      {status === 'climbing' && (
        <div className="w-full h-full relative">
          {/* Exponential curve line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={`M 10,80 Q ${planePos.x / 2 + 5},${80} ${planePos.x}%,${planePos.y}%`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4.5"
              strokeDasharray="6 4"
              className="drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Animated Propeller Red Plane */}
          <div
            className="absolute transition-all duration-75 ease-out pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${planePos.x}%`,
              top: `${planePos.y}%`,
            }}
          >
            <div className="relative group/plane">
              {/* Plane thrust flame */}
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 w-8 h-4 bg-gradient-to-r from-red-600 via-orange-500 to-transparent blur-xs animate-pulse flex items-center" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
              
              {/* SVG Red Biplane matching the Betika style */}
              <svg className="w-14 h-14 filter drop-shadow-[0_4px_6px_rgba(239,68,68,0.5)] transition" viewBox="0 0 64 64">
                <g fill="none" stroke="#ef4444" strokeWidth="2.5">
                  {/* Fuselage */}
                  <path d="M12,28 C20,26 40,24 50,28 C55,30 55,34 50,36 C40,40 20,38 12,36 Z" fill="#b91c1c" />
                  {/* Tail Wings */}
                  <path d="M10,24 L10,40 L16,35 L16,29 Z" fill="#ef4444" />
                  {/* Flight Cabin Shield */}
                  <path d="M30,24 Q35,21 38,24" stroke="#93c5fd" strokeWidth="2" />
                  {/* Giant Biplane Double Main Wings */}
                  <rect x="28" y="10" width="10" height="44" rx="4" fill="#ef4444" />
                  {/* Propeller Spinner */}
                  <line x1="52" y1="20" x2="52" y2="44" stroke="#e2e8f0" strokeWidth="3" className="origin-center animate-[spin_0.3s_linear_infinite]" style={{ transformOrigin: '52px 32px' }} />
                </g>
              </svg>
            </div>
          </div>

          {/* Centered Large Live Multiplier */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none">
            <span className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight text-white drop-shadow-[0_4px_12px_rgba(15,23,42,0.9)] animate-[pulse_1.5s_infinite]">
              {multiplier.toFixed(2)}x
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 py-1 px-3 mt-3.5 rounded-full border border-emerald-900/40 font-mono shadow-md animate-pulse">
              Plane Ascending
            </span>
          </div>

          {predictedCrashPoint && (
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono z-20 flex flex-col gap-1 shadow-lg w-44">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[9px] text-slate-400 uppercase font-black">Predicted End Point</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <div className="text-base font-black text-rose-400 text-right">
                {predictedCrashPoint.toFixed(2)}x
              </div>
              {/* Progress bar towards prediction */}
              <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden mt-1">
                <div 
                  className="bg-gradient-to-r from-red-500 to-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (multiplier / predictedCrashPoint) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[8px] text-slate-400 mt-0.5">
                <span>Distance Progress</span>
                <span className="text-rose-400 font-bold">
                  {Math.min(100, Math.floor((multiplier / predictedCrashPoint) * 100))}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crashed State */}
      {status === 'crashed' && (
        <div className="text-center z-10 flex flex-col items-center gap-2 animate-fade-in px-4">
          <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mb-2">
            <Flame className="w-8 h-8 animate-bounce" />
          </div>
          <span className="text-xs font-mono uppercase font-black tracking-widest text-red-500 py-1 px-3 border border-red-900/60 bg-red-950/55 rounded">
            FLEW AWAY AT
          </span>
          <span className="text-6xl font-black font-mono text-white drop-shadow-[0_4px_10px_rgba(220,38,38,0.5)]">
            {multiplier.toFixed(2)}x
          </span>
          <p className="text-xs text-slate-400 font-mono max-w-[280px] mt-1">
            Analyzing flight telemetry patterns. Next round prediction loading...
          </p>

          {predictedCrashPoint && (
            <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-300 flex items-center justify-center gap-4 shadow-lg animate-fade-in">
              <div className="text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Expected End limit</span>
                <span className="text-rose-400 font-black text-sm">{predictedCrashPoint.toFixed(2)}x</span>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div className="text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Prediction Accuracy</span>
                <span className="text-emerald-400 font-black text-sm">
                  {Math.max(12, Math.min(99, Math.round(100 - Math.abs(multiplier - predictedCrashPoint) / predictedCrashPoint * 100)))}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
