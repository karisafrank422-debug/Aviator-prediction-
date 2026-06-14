import React, { useEffect, useState } from 'react';
import { DollarSign, ToggleLeft, ToggleRight, Sparkles, Coins, Zap } from 'lucide-react';

interface BetOptionState {
  amount: string;
  isAuto: boolean;
  autoValue: string;
  isPlaced: boolean;
  isCashedOut: boolean;
  cashedOutMultiplier: number;
}

interface BettingConsoleProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  status: 'waiting' | 'climbing' | 'crashed';
  multiplier: number;
}

export const BettingConsole: React.FC<BettingConsoleProps> = ({
  balance,
  onUpdateBalance,
  status,
  multiplier
}) => {
  // Aviator commonly features two separate, simultaneous betting containers
  const [betA, setBetA] = useState<BetOptionState>({
    amount: '10.00',
    isAuto: false,
    autoValue: '2.00',
    isPlaced: false,
    isCashedOut: false,
    cashedOutMultiplier: 0
  });

  const [betB, setBetB] = useState<BetOptionState>({
    amount: '50.00',
    isAuto: true,
    autoValue: '1.50',
    isPlaced: false,
    isCashedOut: false,
    cashedOutMultiplier: 0
  });

  // Keep track of current round earnings for visual feedback
  const [earningsA, setEarningsA] = useState(0);
  const [earningsB, setEarningsB] = useState(0);

  // Trigger auto cashouts and update limits
  useEffect(() => {
    if (status !== 'climbing') return;

    // Check Auto cashout Bet A
    if (betA.isPlaced && !betA.isCashedOut) {
      const amtNum = parseFloat(betA.amount) || 0;
      if (betA.isAuto) {
        const threshold = parseFloat(betA.autoValue) || 1.10;
        if (multiplier >= threshold) {
          const won = amtNum * threshold;
          setBetA(prev => ({ ...prev, isCashedOut: true, cashedOutMultiplier: threshold }));
          onUpdateBalance(balance + won);
        }
      }
      // Compute live possible earnings
      setEarningsA(amtNum * multiplier);
    }

    // Check Auto cashout Bet B
    if (betB.isPlaced && !betB.isCashedOut) {
      const amtNum = parseFloat(betB.amount) || 0;
      if (betB.isAuto) {
        const threshold = parseFloat(betB.autoValue) || 1.10;
        if (multiplier >= threshold) {
          const won = amtNum * threshold;
          setBetB(prev => ({ ...prev, isCashedOut: true, cashedOutMultiplier: threshold }));
          onUpdateBalance(balance + won);
        }
      }
      // Compute live possible earnings
      setEarningsB(amtNum * multiplier);
    }
  }, [multiplier, status]);

  // Handle round state resets
  useEffect(() => {
    if (status === 'waiting') {
      setBetA(prev => ({ ...prev, isCashedOut: false, cashedOutMultiplier: 0 }));
      setBetB(prev => ({ ...prev, isCashedOut: false, cashedOutMultiplier: 0 }));
      setEarningsA(0);
      setEarningsB(0);
    } else if (status === 'crashed') {
      // Any remaining placed bets that weren't cashed out are lost
      setBetA(prev => ({ ...prev, isPlaced: false }));
      setBetB(prev => ({ ...prev, isPlaced: false }));
    }
  }, [status]);

  // Handle Bet placement
  const placeBet = (slot: 'A' | 'B') => {
    const bet = slot === 'A' ? betA : betB;
    const setBet = slot === 'A' ? setBetA : setBetB;
    const amt = parseFloat(bet.amount) || 0;

    if (amt <= 0 || amt > balance) return;

    onUpdateBalance(balance - amt);
    setBet(prev => ({ ...prev, isPlaced: true }));
  };

  // Manual Cashout trigger
  const triggerManualCashout = (slot: 'A' | 'B') => {
    const bet = slot === 'A' ? betA : betB;
    const setBet = slot === 'A' ? setBetA : setBetB;
    const amt = parseFloat(bet.amount) || 0;

    if (!bet.isPlaced || bet.isCashedOut || status !== 'climbing') return;

    const winnings = amt * multiplier;
    onUpdateBalance(balance + winnings);
    setBet(prev => ({ ...prev, isCashedOut: true, cashedOutMultiplier: multiplier }));
  };

  // Adjust preselected presets (e.g., 10, 50, 100, 500 KES)
  const setPreset = (slot: 'A' | 'B', val: number) => {
    const setBet = slot === 'A' ? setBetA : setBetB;
    setBet(prev => ({ ...prev, amount: val.toFixed(2) }));
  };

  const renderBetBox = (slot: 'A' | 'B', state: BetOptionState, setState: React.Dispatch<React.SetStateAction<BetOptionState>>, liveEarnings: number) => {
    const hasActiveBet = state.isPlaced && !state.isCashedOut && status === 'climbing';
    const isWaitingToFly = state.isPlaced && status === 'waiting';

    return (
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between gap-4">
        {/* Toggle Mode headers */}
        <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
          <span className="text-xs font-bold text-slate-300 px-2 font-mono">PANEL {slot}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Auto Cashout</span>
            <button
              onClick={() => setState(prev => ({ ...prev, isAuto: !prev.isAuto }))}
              disabled={state.isPlaced}
              className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {state.isAuto ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Amount Input Matrix & presets */}
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">KES</span>
              <input
                type="number"
                value={state.amount}
                onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                disabled={state.isPlaced}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-755 rounded-lg pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-100 font-mono outline-none focus:border-indigo-5050"
              />
            </div>

            {state.isAuto && (
              <div className="relative w-24">
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 text-[10px] font-mono font-bold">x</span>
                <input
                  type="text"
                  value={state.autoValue}
                  onChange={(e) => setState(prev => ({ ...prev, autoValue: e.target.value }))}
                  disabled={state.isPlaced}
                  placeholder="Auto Limit"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-slate-100 font-mono text-center outline-none"
                />
              </div>
            )}
          </div>

          {/* Quick chips adjustment */}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            {[10, 50, 100, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPreset(slot, preset)}
                disabled={state.isPlaced}
                className="bg-slate-900 hover:bg-slate-850 text-slate-300 disabled:opacity-50 py-1 rounded text-[11px] font-mono border border-slate-800"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Large Betting Execute Button */}
        {hasActiveBet ? (
          <button
            onClick={() => triggerManualCashout(slot)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/10 transition duration-150 transform hover:scale-[1.01] flex flex-col items-center justify-center font-mono"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-950 opacity-80">Cash out now</span>
            <span className="text-lg font-extrabold tracking-tight">
              {liveEarnings.toFixed(2)} KES
            </span>
          </button>
        ) : state.isCashedOut ? (
          <div className="w-full bg-slate-900 border border-emerald-900/40 py-3 rounded-xl text-center flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Cashed Out Successfully
            </span>
            <span className="text-xs text-slate-300 font-mono mt-0.5">
              Won KES {(parseFloat(state.amount) * state.cashedOutMultiplier).toFixed(2)} @ {state.cashedOutMultiplier.toFixed(2)}x
            </span>
          </div>
        ) : isWaitingToFly ? (
          <div className="w-full bg-slate-900 border border-indigo-900/40 py-3 rounded-xl text-center flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
              BET PLACED (WAITING)
            </span>
            <span className="text-xs text-slate-400 font-mono mt-0.5">
              KES {parseFloat(state.amount).toFixed(2)} queued
            </span>
          </div>
        ) : (
          <button
            onClick={() => placeBet(slot)}
            disabled={status !== 'waiting' || parseFloat(state.amount) > balance || parseFloat(state.amount) <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 disabled:border-slate-850 font-bold py-3.5 rounded-xl transition duration-150 flex flex-col items-center justify-center font-mono border border-emerald-500/20"
          >
            <span className="text-[10px] uppercase tracking-wider text-emerald-200">PLACE BET</span>
            <span className="text-sm font-black mt-0.5">KES {parseFloat(state.amount).toFixed(2)}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Wallet balance tracker */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Simulated Account</span>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Wallet Cash</span>
          <span className="text-sm font-black font-mono text-emerald-400">{balance.toFixed(2)} KES</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBetBox('A', betA, setBetA, earningsA)}
        {renderBetBox('B', betB, setBetB, earningsB)}
      </div>
    </div>
  );
};
