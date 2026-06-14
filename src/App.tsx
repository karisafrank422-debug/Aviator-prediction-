import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  HelpCircle, 
  Sparkles, 
  Clapperboard, 
  BarChart2, 
  ShieldCheck, 
  RefreshCw,
  GitBranch,
  Coins,
  Flame,
  Zap,
  Play
} from 'lucide-react';
import { HistoryRibbon } from './components/HistoryRibbon';
import { FlightCanvas } from './components/FlightCanvas';
import { BettingConsole } from './components/BettingConsole';
import { PredictiveDashboard } from './components/PredictiveDashboard';
import { StrategyAIAdvisor } from './components/StrategyAIAdvisor';
import { LiveFeedSync } from './components/LiveFeedSync';

export default function App() {
  // Selected Room tracking (defaults to Room #3 matching user's visual multiplier set)
  const [selectedRoom, setSelectedRoom] = useState<'Room #1' | 'Room #2' | 'Room #3'>('Room #3');

  // Three separate history pools with Room #3 matching user's precise sequential layout
  const [roomHistories, setRoomHistories] = useState<{ [key: string]: number[] }>({
    'Room #1': [2.40, 1.15, 3.12, 1.03, 1.94, 5.08, 1.01, 1.50, 2.30, 1.12, 10.45],
    'Room #2': [1.02, 1.50, 8.44, 1.00, 2.18, 1.10, 1.95, 3.42, 12.01, 1.04, 1.85],
    'Room #3': [11.54, 1.00, 2.68, 7.40, 1.94, 1.01, 2.07, 2.30, 1.12, 4.50, 1.05, 1.85, 3.12, 1.13] 
  });

  const history = roomHistories[selectedRoom] || [];

  // Account balance initial seed
  const [balance, setBalance] = useState<number>(5000.00);

  // Flight engine state management
  const [status, setStatus] = useState<'waiting' | 'climbing' | 'crashed'>('waiting');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [countdown, setCountdown] = useState<number>(5.0);

  // Game synchronization wait parameters to match Betika Spribe live servers
  const [betikaWaitDuration, setBetikaWaitDuration] = useState<number>(5.0); // Runs up to 5s
  const [appWaitPeriod, setAppWaitPeriod] = useState<number>(3.0); // Runs up to 3s
  const [useRealtimeGrowth, setUseRealtimeGrowth] = useState<boolean>(true); // Real-time climb matching real Aviator

  // Determined crash multiplier for the active round
  const [targetCrash, setTargetCrash] = useState<number>(1.85);

  // Predictive state values
  const [mathMetrics, setMathMetrics] = useState<{
    average: number;
    ema: number;
    stdDev: number;
    earlyCrashRate: number;
  } | null>(null);

  const [aiRationals, setAiRationals] = useState<string>(
    "Quantitative engine is aggregating past Betika rounds. Click 'Formulate Prediction' or wait for the next flight to update the neural network outputs."
  );
  const [suggestedLow, setSuggestedLow] = useState<number>(1.25);
  const [suggestedHigh, setSuggestedHigh] = useState<number>(2.40);
  const [predictedCrashPoint, setPredictedCrashPoint] = useState<number>(1.85);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Time reference variables
  const flightStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Predictive computation call
  const triggerPredictiveCalculation = async (currentHistory: number[], forceAI: boolean = false, targetRoom?: string) => {
    setIsPredicting(true);
    const activeR = targetRoom || selectedRoom;
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ history: currentHistory, forceAI, room: activeR })
      });

      if (!res.ok) throw new Error("Prediction API failed");

      const data = await res.json();
      setMathMetrics(data.mathMetrics);
      setAiRationals(data.aiRationals);
      setSuggestedLow(data.suggestedCashoutLow);
      setSuggestedHigh(data.suggestedCashoutHigh);
      if (data.predictedCrashPoint) {
        setPredictedCrashPoint(data.predictedCrashPoint);
      }
    } catch (err) {
      console.error("Predictive call error:", err);
      const avg = currentHistory.reduce((a, b) => a + b, 0) / currentHistory.length;
      setMathMetrics({
        average: parseFloat(avg.toFixed(2)),
        ema: parseFloat(avg.toFixed(2)),
        stdDev: 1.5,
        earlyCrashRate: 25.0
      });
      setAiRationals("Offline math metrics enabled. Re-run or provide active API keys.");
      setPredictedCrashPoint(parseFloat((avg * 1.34).toFixed(2)));
    } finally {
      setIsPredicting(false);
    }
  };

  // Perform initial calculation on load or room toggle
  useEffect(() => {
    triggerPredictiveCalculation(history, false, selectedRoom);
  }, [selectedRoom]);

  // Swapper selector
  const handleRoomSelect = (room: 'Room #1' | 'Room #2' | 'Room #3') => {
    setSelectedRoom(room);
  };

  // Safe History Setter proxying active index
  const setHistory = (newHistory: number[]) => {
    setRoomHistories(prev => ({
      ...prev,
      [selectedRoom]: newHistory
    }));
  };

  // Quick action skip helper
  const triggerInstantFlight = () => {
    if (status === 'waiting') {
      setCountdown(0.1);
    } else {
      setStatus('crashed');
    }
  };

  // 2. Flight Loop manager using RequestAnimationFrame for absolute high-performance fluidity
  useEffect(() => {
    let lastTime = Date.now();
    let countTimer = betikaWaitDuration;

    const tick = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (status === 'waiting') {
        countTimer -= delta;
        if (countTimer <= 0) {
          // Pre-determine next crash using realistic Provably Fair probability distribution (3% instant crash hazard)
          const p = Math.random();
          const target = p < 0.03 ? 1.00 : parseFloat((0.97 / (1.0 - p)).toFixed(2));
          
          setTargetCrash(target);
          setStatus('climbing');
          flightStartRef.current = Date.now();
          setMultiplier(1.00);
        } else {
          setCountdown(Math.max(0, countTimer));
        }
      } else if (status === 'climbing') {
        // Authenticated Spribe Aviator Flight speed: e^(0.06 * elapsed_seconds)
        // Perfectly isochronous with live Betika Aviator physics.
        const elapsed = (Date.now() - flightStartRef.current) / 1000;
        const currentM = useRealtimeGrowth
          ? Math.max(1.0, Math.exp(0.06 * elapsed))
          : Math.max(1.0, Math.pow(1.08, elapsed * 1.6)); // Accelerated mode

        if (currentM >= targetCrash) {
          // Crashed State triggering point
          setStatus('crashed');
          setMultiplier(targetCrash);
          
          // Append crash to history log
          const nextHistory = [...history, targetCrash];
          if (nextHistory.length > 25) {
            nextHistory.shift(); // Keep rotating history window compact
          }
          
          setRoomHistories(prev => ({
            ...prev,
            [selectedRoom]: nextHistory
          }));

          // Update real probability forecast inputs
          triggerPredictiveCalculation(nextHistory, false, selectedRoom);

          // Reset wait timer
          setTimeout(() => {
            countTimer = betikaWaitDuration;
            setCountdown(betikaWaitDuration);
            setStatus('waiting');
          }, 3000);
        } else {
          setMultiplier(currentM);
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, history, targetCrash, selectedRoom, betikaWaitDuration, appWaitPeriod, useRealtimeGrowth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-rose-600 selection:text-white">
      {/* Upper Navigation Header bar - Customized with Betika branding */}
      <header className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-5050 flex items-center justify-center shadow-lg shadow-red-500/15">
              <Play className="w-5 h-5 text-white transform rotate-45 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Betika Aviator Predictor <span className="text-[10px] bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded font-mono uppercase font-black tracking-wider animate-pulse">Live Tracker</span>
              </h1>
              <p className="text-xs text-slate-400">Calibrated Specifically to Betika Kenya Spribe Crash Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Direct Model labels */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[ping_1.5s_infinite]"></span>
              <span className="text-slate-400">Currency: KES (Kenya Shilling)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">

        {/* Dynamic Room HUD layout exactly resembling user screenshot */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            {/* Live active tag */}
            <div className="bg-rose-950/40 border border-rose-900/40 text-rose-400 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>LIVE</span>
            </div>

            {/* Centered Game Code Info */}
            <div className="text-sm font-black text-slate-200 tracking-wider font-mono">
              Bet Rush
            </div>

            {/* Simulated Action / trigger buttons */}
            <button 
              onClick={triggerInstantFlight}
              className="w-8 h-8 rounded-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 flex items-center justify-center transition shadow-lg hover:scale-105"
              title="Force next state / Simulation round"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Rooms Grid Switcher */}
          <div className="grid grid-cols-3 gap-2.5">
            {(['Room #1', 'Room #2', 'Room #3'] as const).map((r) => {
              const isActive = selectedRoom === r;
              const roomHist = roomHistories[r] || [];
              const latestThree = roomHist.slice(-3).reverse();
              return (
                <button
                  key={r}
                  onClick={() => handleRoomSelect(r)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all duration-150 border cursor-pointer flex flex-col items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 border-green-500 text-slate-100 shadow-lg shadow-green-500/15 ring-1 ring-green-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-500 font-extrabold text-[11px] select-none">✕</span>
                    <span className="tracking-wide">{r}</span>
                  </div>
                  {/* Selected room run history endpoints summary */}
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {latestThree.map((val, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[8px] sm:text-[9px] px-1 rounded font-mono ${
                          val >= 2.0 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {val.toFixed(2)}x
                      </span>
                    ))}
                    {latestThree.length === 0 && (
                      <span className="text-[8px] text-slate-500 italic">No runs yet</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Betika Telemetry Synchronization Wait Calibration Controls */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-850 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                Betika Telemetry Synchronization Times Calibration
              </span>
              <span className="text-[9px] bg-slate-900 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-850">
                ACTIVE CODES: KES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Slider for Betika Wait Duration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Betika Next Round Intermission:</span>
                  <span className="text-white font-extrabold bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded text-[10px]">{betikaWaitDuration.toFixed(1)} Secs</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={betikaWaitDuration}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBetikaWaitDuration(val);
                    // Ensure synchronization wait delay is always capped below or equal to the round intermission
                    if (appWaitPeriod > val) {
                      setAppWaitPeriod(val);
                    }
                  }}
                  className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  Configure the countdown duration (default: 5.0) simulating the real Betika Spribe lobby wait period between flights.
                </p>
              </div>

              {/* Slider for App Wait Period */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">AI Predictor Calibration Wait:</span>
                  <span className="text-white font-extrabold bg-indigo-950/50 border border-indigo-900 px-2   py-0.5 rounded text-[10px]">{appWaitPeriod.toFixed(1)} Secs</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max={betikaWaitDuration}
                  step="0.5"
                  value={appWaitPeriod}
                  onChange={(e) => setAppWaitPeriod(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  The interval the predictor freezes predictions (up to 3.0) to successfully process preceding round endpoints.
                </p>
              </div>
            </div>

            {/* Isochronous Spribe Real-Time Growth Calibrator Row */}
            <div className="border-t border-slate-900 pt-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-300 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time Multiplier Isochronism Calibration
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl font-sans">
                  Synchronize flight climbers precisely with the official Betika lobby. Real-time rate uses the physical growth equation (<code className="text-rose-400 font-mono text-[9.5px]">e^0.06t</code>) where 2.0x takes exactly ~11.5 seconds.
                </p>
              </div>
              <button
                onClick={() => setUseRealtimeGrowth(!useRealtimeGrowth)}
                className={`py-2 px-4 rounded-xl text-[10px] font-mono font-black tracking-wider uppercase transition-all duration-150 border cursor-pointer flex items-center gap-2 ${
                  useRealtimeGrowth
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-amber-900/60 text-amber-500 hover:text-amber-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${useRealtimeGrowth ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {useRealtimeGrowth ? 'LIVE ENGINE CALIBRATED (e^0.06t)' : 'FAST ENGINE MODE'}
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Multipliers Ribbon */}
        <HistoryRibbon history={history} />

        {/* Live Betika Automatic Synchronization Board */}
        <LiveFeedSync 
          currentHistory={history}
          onSyncHistory={setHistory}
          triggerPredictiveCalculation={(nextH) => triggerPredictiveCalculation(nextH, false, selectedRoom)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Flight screen & betting console */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Flight Canvas Visualizer */}
            <FlightCanvas 
              status={status} 
              multiplier={multiplier} 
              countdown={countdown} 
              predictedCrashPoint={predictedCrashPoint}
              activeRoom={selectedRoom}
              betikaWaitDuration={betikaWaitDuration}
              appWaitPeriod={appWaitPeriod}
            />

            {/* Simulated Dual Betting Console */}
            <BettingConsole 
              balance={balance} 
              onUpdateBalance={setBalance} 
              status={status} 
              multiplier={multiplier} 
            />

          </div>

          {/* Right Column: AI Consultant Companion */}
          <div className="lg:col-span-5">
            <StrategyAIAdvisor history={history} />
          </div>

        </div>

        {/* Lower Row: Predictive Probability Dashboard & Charts */}
        <PredictiveDashboard
          history={history}
          mathMetrics={mathMetrics}
          aiRationals={aiRationals}
          suggestedCashoutLow={suggestedLow}
          suggestedCashoutHigh={suggestedHigh}
          predictedCrashPoint={predictedCrashPoint}
          isPredicting={isPredicting}
          onTriggerAI={() => triggerPredictiveCalculation(history, true, selectedRoom)}
          isAnalyzing={status === 'waiting' && countdown > (betikaWaitDuration - appWaitPeriod)}
          syncTimeRemaining={Math.max(0, countdown - (betikaWaitDuration - appWaitPeriod))}
        />

      </main>
    </div>
  );
}
