import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ReChartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { TrendingUp, BarChart2, Sparkles, Compass, HelpCircle, ShieldAlert } from 'lucide-react';

interface PredictiveDashboardProps {
  history: number[];
  mathMetrics: {
    average: number;
    ema: number;
    stdDev: number;
    earlyCrashRate: number;
  } | null;
  aiRationals: string;
  suggestedCashoutLow: number;
  suggestedCashoutHigh: number;
  predictedCrashPoint?: number;
  isPredicting: boolean;
  onTriggerAI: () => void;
}

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({
  history,
  mathMetrics,
  aiRationals,
  suggestedCashoutLow,
  suggestedCashoutHigh,
  predictedCrashPoint = 1.85,
  isPredicting,
  onTriggerAI
}) => {
  // 1. Group past crash points into readable statistical bins
  const getDistributionData = () => {
    let under_1_2 = 0;
    let intermediate = 0; // 1.2 to 2.0
    let goldRuns = 0;     // 2.0 to 5.0
    let moonshots = 0;    // 5.0+

    history.forEach(m => {
      if (m < 1.2) under_1_2++;
      else if (m < 2.0) intermediate++;
      else if (m < 5.0) goldRuns++;
      else moonshots++;
    });

    return [
      { name: 'Early Crash (<1.2x)', count: under_1_2, fill: '#ef4444' },
      { name: 'Medium (1.2x-2x)', count: intermediate, fill: '#3b82f6' },
      { name: 'High (2x-5x)', count: goldRuns, fill: '#8b5cf6' },
      { name: 'Moonshot (5x+)', count: moonshots, fill: '#f43f5e' }
    ];
  };

  const distributionData = getDistributionData();

  // 2. Get Pareto Survivorship curve data to show actual theoretical probability distribution
  const getSurvivalData = () => {
    return [
      { multiplier: '1.2x', probability: 80 },
      { multiplier: '1.5x', probability: 64 },
      { multiplier: '2.0x', probability: 48 },
      { multiplier: '3.0x', probability: 32 },
      { multiplier: '5.0x', probability: 19 },
      { multiplier: '10x', probability: 9.7 }
    ];
  };

  const survivalData = getSurvivalData();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Target prediction header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-slate-850 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Statistical Crash Predictor Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing historic patterns and standard deviations in real-time.
          </p>
        </div>

        {/* Prediction ranges */}
        <div className="flex flex-wrap gap-2.5">
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-center flex-1 min-w-[120px]">
            <span className="block text-[9px] uppercase font-mono text-slate-500 font-bold">Suggested Cashout (Low Risk)</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{suggestedCashoutLow.toFixed(2)}x</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-center flex-1 min-w-[120px]">
            <span className="block text-[9px] uppercase font-mono text-slate-500 font-bold">Calculated Spike Target (High Risk)</span>
            <span className="text-sm font-black text-indigo-400 font-mono">{suggestedCashoutHigh.toFixed(2)}x</span>
          </div>
          <div className="bg-rose-950/40 border border-rose-900 px-3.5 py-2 rounded-lg text-center flex-1 min-w-[140px] shadow-lg animate-pulse">
            <span className="block text-[9px] uppercase font-mono text-rose-300 font-black flex items-center justify-center gap-1 leading-none">
              <Sparkles className="w-2.5 h-2.5 text-rose-400" /> Expected End Point
            </span>
            <span className="text-sm font-black text-rose-400 font-mono block mt-1">{predictedCrashPoint.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Math & AI Predictive Engine Summary */}
        <div className="md:col-span-7 space-y-5">
          
          {/* Quick Stats Grid */}
          {mathMetrics && (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-xl text-center">
                <span className="block text-[9px] text-slate-500 font-mono font-bold uppercase">Average Run</span>
                <span className="text-xs font-black text-slate-200 mt-0.5 font-mono">{mathMetrics.average.toFixed(2)}x</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-xl text-center">
                <span className="block text-[9px] text-slate-500 font-mono font-bold uppercase">EMA Trend</span>
                <span className="text-xs font-black text-slate-200 mt-0.5 font-mono">{mathMetrics.ema.toFixed(2)}x</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-xl text-center">
                <span className="block text-[9px] text-slate-500 font-mono font-bold uppercase">Std Dev</span>
                <span className="text-xs font-black text-slate-200 mt-0.5 font-mono">±{mathMetrics.stdDev.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-xl text-center">
                <span className="block text-[9px] text-slate-500 font-mono font-bold uppercase">Blue Runs</span>
                <span className="text-xs font-black text-red-400 mt-0.5 font-mono">{mathMetrics.earlyCrashRate}%</span>
              </div>
            </div>
          )}

          {/* AI Strategy Rationale Stream */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wide flex items-center gap-1 select-none">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Gemini Quantitative Rationale
              </h3>
              
              <button
                disabled={isPredicting}
                onClick={onTriggerAI}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[10px] text-white px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {isPredicting ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 border-t-transparent animate-spin shrink-0"></span>
                    Analyzing Sequence...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    Formulate AI Strategy
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {aiRationals}
            </p>
          </div>

          {/* Warning disclaimer protecting user */}
          <div className="flex gap-2.5 bg-red-955/20 border border-red-900/30 rounded-xl p-3 text-[10px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Risk Warning & System Fair Play Notice:</strong> Aviator is a Provably Fair game generated by cryptographic seeds. All prediction algorithms shown are for educational and training purposes. Each trial is mathematically independent. Never gamble with real capital expecting guaranteed returns.
            </p>
          </div>

        </div>

        {/* Charts visual logs */}
        <div className="md:col-span-5 space-y-5">
          
          {/* Chart 1: Distribution Histogram */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
              <BarChart2 className="w-4 h-4 text-indigo-400" /> Multiplier Distribution
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <ReChartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Heavy-Tailed Pareto Survivorship Curve */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
              <Compass className="w-4 h-4 text-emerald-400 animate-pulse" /> Pareto Game Survivorship Curve
            </h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={survivalData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="multiplier" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} unit="%" />
                  <ReChartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    labelStyle={{ fontSize: '10px' }}
                  />
                  <Line type="monotone" dataKey="probability" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-2 leading-tight text-center">
              Probability $P(X \ge M) = 0.97 / M$. Early cash-outs are statistically sound.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
