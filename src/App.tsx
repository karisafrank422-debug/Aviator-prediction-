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
    let countTimer = 5.0;

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
        // Multiplier climb exponential mathematical model: 1.06 ^ seconds
        const elapsed = (Date.now() - flightStartRef.current) / 1000;
        const currentM = Math.max(1.0, Math.pow(1.08, elapsed * 1.6));

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
            countTimer = 5.0;
            setCountdown(5.0);
            setStatus('waiting');
          }, 5000);
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
  }, [status, history, targetCrash, selectedRoom]);

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
              return (
                <button
                  key={r}
                  onClick={() => handleRoomSelect(r)}
                  className={`py-3 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition duration-150 border cursor-pointer ${
                    isActive
                      ? 'bg-rose-950/20 border-rose-600 text-rose-400 shadow shadow-rose-950/40'
                      : 'bg-slate-950/50 hover:bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-[10px]">✕</span> {r}
                </button>
              );
            })}
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
          isPredicting={isPredicting}
          onTriggerAI={() => triggerPredictiveCalculation(history, true, selectedRoom)}
        />

      </main>
    </div>
  );
}
