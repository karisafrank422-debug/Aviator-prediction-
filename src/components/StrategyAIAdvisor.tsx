import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface StrategyAIAdvisorProps {
  history: number[];
}

const PRESET_TOPICS = [
  "Does past multiplier affect the next limit?",
  "Explain Martingale vs. Fibonacci system",
  "How does Kelly Criterion allocate bet size?",
  "What is the math of the Crash house edge?"
];

export const StrategyAIAdvisor: React.FC<StrategyAIAdvisorProps> = ({ history }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! 📡 I am 'Aviator Quant AI'. Ask me to evaluate betting algorithms, explain martingale sequence risk limits, or analyze the current flight math patterns.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest advice
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          historyContext: history
        })
      });

      if (!res.ok) {
        throw new Error("Advisory route error");
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMsg]);

    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error querying the intelligence engine. Please check if your GEMINI_API_KEY is configured in the secrets menu.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[400px]">
      
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="font-extrabold text-[10px] tracking-widest uppercase text-slate-300">
            Strategy Consultant Companion
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-mono text-indigo-300">gemini-3.5-flash</span>
        </div>
      </div>

      {/* Suggestion capsules */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-850/60 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
        {PRESET_TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => handleSend(topic)}
            disabled={isLoading}
            className="px-2.5 py-1 text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-850 rounded-full hover:border-indigo-5050 hover:text-indigo-300 transition duration-150 shrink-0 disabled:opacity-50"
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-950 text-slate-300 rounded-tl-none border border-slate-850 font-sans'
            }`}>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1 font-mono">
                {m.role === 'model' && <Sparkles className="w-3 h-3 text-indigo-400" />}
                <span className="font-bold">{m.role === 'user' ? 'You' : 'Quant AI'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>
              <p className="whitespace-pre-line">{m.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 border border-slate-850 text-slate-400 rounded-xl p-3 text-xs rounded-tl-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200"></span>
              <span className="text-[10px] font-mono ml-1 text-slate-400">modeling standard Kelly outputs...</span>
            </div>
          </div>
        )}
      </div>

      {/* Send form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Quant AI a probability question..."
          className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 text-xs text-slate-200 px-3 py-2 rounded-lg outline-none transition"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition"
          aria-label="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
