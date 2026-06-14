import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Cpu, 
  Terminal, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Copy, 
  UploadCloud, 
  Layers, 
  Zap, 
  Link, 
  Trash2,
  ListPlus,
  ArrowRightLeft
} from 'lucide-react';

interface LiveRoundFeedItem {
  multiplier: number;
  timestamp: string;
}

interface LiveFeedSyncProps {
  currentHistory: number[];
  onSyncHistory: (newHistory: number[]) => void;
  triggerPredictiveCalculation: (history: number[]) => void;
}

export const LiveFeedSync: React.FC<LiveFeedSyncProps> = ({
  currentHistory,
  onSyncHistory,
  triggerPredictiveCalculation
}) => {
  const [activeTab, setActiveTab] = useState<'vision' | 'feed' | 'manual'>('vision');
  
  // Vision OCR states
  const [image, setImage] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [visionSuccess, setVisionSuccess] = useState<number[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time API incoming feed states
  const [incomingRounds, setIncomingRounds] = useState<LiveRoundFeedItem[]>([]);
  const [autoSyncExt, setAutoSyncExt] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<string | null>(null);
  const [apiNotification, setApiNotification] = useState<string | null>(null);
  
  // Manual override states
  const [manualInput, setManualInput] = useState('11.54, 1.00, 2.68, 7.40, 1.94, 1.01, 2.07, 2.30, 1.13');
  const [manualSuccess, setManualSuccess] = useState(false);

  // Tampermonkey status state
  const [copiedScript, setCopiedScript] = useState(false);

  // Format the current deployed app origin URL for the userscript loader
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // 1. Image OCR parsing handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVisionError(null);
    setVisionSuccess(null);
    
    if (!file.type.startsWith('image/')) {
      setVisionError('Invalid file format. Please upload a standard PNG or JPEG screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.onerror = () => {
      setVisionError('Error reading physical image bytes.');
    };
    reader.readAsDataURL(file);
  };

  const processVisionOCR = async () => {
    if (!image) return;
    setVisionLoading(true);
    setVisionError(null);
    setVisionSuccess(null);

    try {
      // Split off metadata format from raw base64 string
      const base64Clean = image.split(',')[1] || image;
      const response = await fetch('/api/parse-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Clean,
          mimeType: 'image/png'
        })
      });

      if (!response.ok) {
        throw new Error('Vision service failed scanning the multiplier sequence.');
      }

      const data = await response.json();
      if (data.multipliers && Array.isArray(data.multipliers) && data.multipliers.length > 0) {
        setVisionSuccess(data.multipliers);
        // Feed into standard history container
        onSyncHistory(data.multipliers);
        triggerPredictiveCalculation(data.multipliers);
      } else {
        throw new Error('Gemini could not locate multiplier capsules. Make sure the high-contrast history bar at the top is clearly captured.');
      }
    } catch (err: any) {
      setVisionError(err.message || 'Error processing OCR scan.');
    } finally {
      setVisionLoading(false);
    }
  };

  // 2. Poll the /api/live-rounds endpoint to stream live scraped entries
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/live-rounds');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.rounds && Array.isArray(data.rounds)) {
          setIncomingRounds(data.rounds);

          if (data.rounds.length > 0) {
            const latest = data.rounds[data.rounds.length - 1];
            // Format check to secure duplicates
            const latestKey = `${latest.multiplier}-${latest.timestamp}`;
            
            if (latestKey !== lastProcessedTimestamp) {
              setLastProcessedTimestamp(latestKey);

              // Flash custom mini HUD trigger to signal arrival
              setApiNotification(`Real-time feed tracked: ${latest.multiplier}x`);
              setTimeout(() => setApiNotification(null), 3500);

              if (autoSyncExt) {
                // Prepend or adjust active history array automatically
                const nextRun = [...currentHistory, latest.multiplier];
                if (nextRun.length > 25) {
                  nextRun.shift();
                }
                onSyncHistory(nextRun);
                triggerPredictiveCalculation(nextRun);
              }
            }
          }
        }
      } catch (err) {
        console.error('Polling real-time feed error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [pollingActive, autoSyncExt, currentHistory, lastProcessedTimestamp]);

  const clearRealtimeBuffer = async () => {
    try {
      await fetch('/api/live-rounds', { method: 'DELETE' });
      setIncomingRounds([]);
      setLastProcessedTimestamp(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. User manually overrides standard array
  const applyManualOverride = () => {
    setManualSuccess(false);
    try {
      const numbers = manualInput
        .split(/[,\s]+/)
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v) && v >= 1.0);

      if (numbers.length === 0) {
        throw new Error('No valid numbers provided.');
      }

      onSyncHistory(numbers);
      triggerPredictiveCalculation(numbers);
      setManualSuccess(true);
      setTimeout(() => setManualSuccess(false), 3000);
    } catch (err) {
      alert('Parse error. Provide positive numbers separated by commas, e.g. 1.15, 2.50, 1.01');
    }
  };

  // Generate the Tampermonkey script content
  const tampermonkeyScript = `// ==UserScript==
// @name         Betika Aviator Live Feeder
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Intercepts real-time crash multipliers from the Betika Spribe Aviator game and feeds them directly into the AI Predictor.
// @author       Aviator Quant AI
// @match        *://*.betika.com/*
// @match        *://*.spribe.io/*
// @match        *://*aviator*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';
    
    const TARGET_API = "${appOrigin}/api/live-round";
    console.log("[Aviator Feeder] Scraper online waiting for round finishes...");

    let lastDetected = null;

    setInterval(() => {
        // Query the header stats ribbon lists in Spribe Aviator
        const pillElements = document.querySelectorAll('.stats .multiplier, .stats-list .bubble-multiplier, app-stats-item, .pills-container .pill');
        if (pillElements && pillElements.length > 0) {
            // First element [0] is standard Spribe prepended latest round
            const latestPill = pillElements[0];
            const textValue = latestPill.textContent.trim().replace('x', '');
            const floatMultiplier = parseFloat(textValue);

            if (!isNaN(floatMultiplier) && floatMultiplier !== lastDetected) {
                lastDetected = floatMultiplier;
                console.log("[Aviator Feeder] Live Round crash intercepted:", floatMultiplier);
                
                GM_xmlhttpRequest({
                    method: "POST",
                    url: TARGET_API,
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({ multiplier: floatMultiplier }),
                    onload: function(response) {
                        console.log("[Aviator Feeder] Transmitted successfully to AI suite");
                    }
                });
            }
        }
    }, 1500);
})();`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(tampermonkeyScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" id="sync-core">
      {/* HUD Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-850/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-rose-500 animate-pulse" /> Live Betika Telemetry Synchronization Core
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Integrate physical game results directly into telemetry array</p>
        </div>
        
        {/* Connection status pills */}
        <div className="flex gap-2">
          {apiNotification && (
            <div className="bg-emerald-950/80 text-emerald-400 text-[10px] px-2.5 py-1 rounded border border-emerald-900/60 animate-bounce font-mono">
              {apiNotification}
            </div>
          )}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex">
            <button
              onClick={() => setActiveTab('vision')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition duration-150 ${
                activeTab === 'vision' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vision OCR
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition duration-150 relative ${
                activeTab === 'feed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Feed API
              {incomingRounds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition duration-150 ${
                activeTab === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual Override
            </button>
          </div>
        </div>
      </div>

      {/* Synchronizer Container */}
      <div className="p-5">
        
        {/* TAB 1: VISION OCR Drag and Drop Parser */}
        {activeTab === 'vision' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Drag Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950/20 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {image ? (
                  <div className="relative max-w-full h-28 overflow-hidden rounded-lg border border-slate-800">
                    <img 
                      src={image} 
                      alt="Telemetry source capture preview" 
                      className="object-contain w-full h-full opacity-80 group-hover:opacity-100 transition" 
                    />
                    <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center font-mono text-[9px] font-bold opacity-0 group-hover:opacity-100 transition text-white">
                      Click to replace
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition duration-200" />
                    <span className="text-xs text-slate-200 font-bold mt-2 font-sans">Upload/Paste Betika Screenshot</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">Accepts PNG, JPEG snippet of the game ribbon</span>
                  </div>
                )}
              </div>

              {/* Execution panel */}
              <div className="bg-slate-950/50 rounded-xl border border-slate-850 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                    <Camera className="w-4 h-4 text-indigo-400" /> Multimodal Optical OCR Decoder
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Upload any raw screenshot of your current live Aviator board (or crop the multipliers line at the top) of Betika.
                    Gemini will scan the image, extract preceding crash targets, and load them into our mathematical neural logic automatically.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850/50 flex flex-col gap-2">
                  <button
                    onClick={processVisionOCR}
                    disabled={!image || visionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5"
                  >
                    {visionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deep Reading Multipier Seeds via Gemini...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Analyze Screenshot & Extract Data
                      </>
                    )}
                  </button>
                  
                  {visionError && (
                    <div className="text-[10px] bg-red-950/50 border border-red-900/40 text-red-400 p-2 rounded flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{visionError}</span>
                    </div>
                  )}

                  {visionSuccess && (
                    <div className="text-[10px] bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 p-2 rounded flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Successfully scanned {visionSuccess.length} rounds from image metrics!</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: LIVE API TAMPERMONKEY FEEDER */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Instructions / Tampermonkey loader */}
              <div className="lg:col-span-7 space-y-3.5 bg-slate-955/20 border border-slate-850 rounded-xl p-4.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide font-mono">
                    <Link className="w-4 h-4 text-indigo-400" /> Tampermonkey Background Scraper
                  </h3>
                  <button
                    onClick={copyScriptToClipboard}
                    className="text-[10px] font-mono tracking-wide text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/60 px-2.5 py-1 rounded"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedScript ? 'Copied script!' : 'Copy Script code'}
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To achieve absolute real-time automation directly from the actual active Betika website, run our background listener extension:
                </p>
                
                <ol className="text-[10px] list-decimal list-inside text-slate-300 space-y-2 leading-relaxed">
                  <li>Install the <strong className="text-indigo-400">Tampermonkey</strong> or Violentmonkey extension in your browser.</li>
                  <li>Click 'Create new script' and replace the whole workspace editor with this copied script code.</li>
                  <li>Keep this Predictor tab open. Open the real Betika Aviator game tab.</li>
                  <li>Our feeder script will dynamically intercept results directly as they appear, updating this session instantly!</li>
                </ol>

                <div className="bg-slate-950/85 border border-slate-850 rounded p-2 text-[9px] font-mono text-slate-500 overflow-x-auto max-h-32 scrollbar-thin">
                  {tampermonkeyScript}
                </div>
              </div>

              {/* Ticker / Real-time received items */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/40 rounded-xl border border-slate-850 p-4">
                
                {/* Active settings controls */}
                <div>
                  <div className="flex justify-between items-center select-none mb-3">
                    <span className="text-[11px] font-mono text-slate-300 font-bold">Auto-Sync Stream</span>
                    <button
                      onClick={() => setAutoSyncExt(!autoSyncExt)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoSyncExt ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autoSyncExt ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center select-none mb-4">
                    <span className="text-[11px] font-mono text-slate-300 font-bold">Observer Mode</span>
                    <button
                      onClick={() => setPollingActive(!pollingActive)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase transition ${
                        pollingActive 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' 
                          : 'bg-red-950 text-red-400 border border-red-900/60'
                      }`}
                    >
                      {pollingActive ? 'Feed Listening' : 'Feed Halted'}
                    </button>
                  </div>

                  <div className="border-t border-slate-850/60 pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono uppercase font-black text-slate-400">Captured Buffer List</span>
                      {incomingRounds.length > 0 && (
                        <button 
                          onClick={clearRealtimeBuffer}
                          className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Buffer
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-24 scrollbar-thin">
                      {incomingRounds.length === 0 ? (
                        <div className="text-slate-600 font-mono text-[10px] italic py-2 text-center flex items-center justify-center gap-1.5 bg-slate-950/30 border border-dashed border-slate-850/50 rounded-lg">
                          <Terminal className="w-3.5 h-3.5 animate-pulse" /> Listening for scrapes from Betika site...
                        </div>
                      ) : (
                        incomingRounds.slice().reverse().map((round, idx) => (
                          <div 
                            key={`${round.multiplier}-${idx}`} 
                            className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850/60 flex justify-between items-center text-[10px] font-mono animate-fade-in"
                          >
                            <span className="text-indigo-400 font-bold">Round {incomingRounds.length - idx}</span>
                            <span className="font-extrabold text-slate-200">{round.multiplier.toFixed(2)}x</span>
                            <span className="text-slate-500 text-[9px]">{round.timestamp}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850/50">
                  <span className="text-[9px] text-slate-500 font-mono leading-tight block text-center">
                    feeder endpoint URL: <strong className="text-indigo-400">{appOrigin}/api/live-round</strong>
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: MANUAL INPUT MATRIX */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <ListPlus className="w-4 h-4 text-rose-400" /> Manual Sequence Synchronization
            </h3>
            
            <div className="relative">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste telemetry multipliers separated by commas or spaces, e.g. 11.54, 1.00, 2.68..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-5050 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none h-18 min-h-[70px] transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-[10px] text-slate-400 max-w-xl">
                Quickly adjust the simulation metrics manually. Separate multipliers by spaces, commas, or semicolons. Ensure the list matches the visual state of your live Betika session board.
              </p>
              
              <div className="flex gap-2 self-end">
                <button
                  onClick={applyManualOverride}
                  className="bg-indigo-605 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition duration-150 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Load & Compute Prediction
                </button>
              </div>
            </div>

            {manualSuccess && (
              <div className="text-[10px] bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 p-2.5 rounded flex items-center gap-1.5 animate-pulse">
                <Check className="w-3.5 h-3.5" /> 
                <span>Simulated sequence synced successfully! Probability outcomes updated.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
