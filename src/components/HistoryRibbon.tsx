import React from 'react';

interface HistoryRibbonProps {
  history: number[];
}

export const HistoryRibbon: React.FC<HistoryRibbonProps> = ({ history }) => {
  const getPillColor = (val: number) => {
    if (val < 1.2) {
      return 'bg-slate-800 text-slate-400 border-slate-700/50';
    } else if (val < 2.0) {
      return 'bg-blue-900/40 text-blue-400 border-blue-900/60';
    } else if (val < 10.0) {
      return 'bg-violet-950/70 text-violet-400 border-violet-900/50';
    } else {
      return 'bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-900/80';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Live Round History (Past Multipliers)
        </span>
        <span className="text-[9px] text-indigo-400 font-mono">
          {history.length} documented trials
        </span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scrollbar-thumb-transparent">
        {history.length === 0 ? (
          <div className="text-slate-500 font-mono text-[11px] py-1">Initializing live Betika data feeds...</div>
        ) : (
          history.slice().reverse().map((val, idx) => (
            <div
              key={`${val}-${idx}`}
              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${getPillColor(val)} shrink-0 cursor-default hover:scale-105 transition duration-150 shadow-inner`}
              title={`Simulated Crash multiplier at ${val.toFixed(2)}x`}
            >
              {val.toFixed(2)}x
            </div>
          ))
        )}
      </div>
    </div>
  );
};
