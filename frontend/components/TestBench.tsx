import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, Terminal, Zap, Pause, Radio } from 'lucide-react';
import { LogicNode, MessageData } from '../types';
import { evaluateLogic } from '../utils/logicEvaluator';
import { generateMockMessage } from '../utils/mockDataGenerator';

interface TestBenchProps {
  logicRoot: LogicNode;
}

interface TestResult extends MessageData {
  result: boolean;
  timestamp: string;
}

const TestBench: React.FC<TestBenchProps> = ({ logicRoot }) => {
  const [mode, setMode] = useState<'manual' | 'stream'>('manual');

  // Manual State
  const [messageText, setMessageText] = useState('');
  const [sender, setSender] = useState('');

  // Stream State
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({ total: 0, matches: 0, drops: 0 });

  const [results, setResults] = useState<TestResult[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top of list when new results arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [results]);

  // Stream Interval Logic
  useEffect(() => {
    let interval: number;
    if (isStreaming && mode === 'stream') {
      interval = window.setInterval(() => {
        const msg = generateMockMessage();
        runEvaluation(msg);
      }, 800); // New message every 800ms
    }
    return () => clearInterval(interval);
  }, [isStreaming, mode, logicRoot]); // Re-bind if logicRoot changes to ensure fresh logic is used

  const runEvaluation = (data: MessageData) => {
    const isMatch = evaluateLogic(logicRoot, data);

    const newResult: TestResult = {
      ...data,
      result: isMatch,
      timestamp: new Date().toLocaleTimeString()
    };

    setResults(prev => [newResult, ...prev].slice(0, 50)); // Keep last 50

    if (mode === 'stream') {
        setStats(prev => ({
            total: prev.total + 1,
            matches: prev.matches + (isMatch ? 1 : 0),
            drops: prev.drops + (isMatch ? 0 : 1)
        }));
    }
  };

  const handleManualRun = () => {
    if (!messageText) return;
    runEvaluation({
      message_text: messageText,
      sender: sender || 'Anonymous',
      timestamp: new Date().toISOString()
    });
  };

  const clearResults = () => {
    setResults([]);
    setStats({ total: 0, matches: 0, drops: 0 });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
            <Terminal size={18} className="text-amber-400" />
            Logic Evaluator
            </h3>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Phase 1: Deterministic
            </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
                onClick={() => { setMode('manual'); setIsStreaming(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Manual Input
            </button>
            <button
                onClick={() => setMode('stream')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'stream' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Zap size={12} />
                Telethon Stream
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Input Area (Conditional) */}
        {mode === 'manual' ? (
            <div className="p-4 space-y-3 border-b border-slate-800 bg-slate-900/50">
            <div>
                <label className="block text-xs text-slate-500 mb-1">Message Text</label>
                <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none h-20"
                placeholder="Type a test message here..."
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">Sender ID</label>
                <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-blue-500 outline-none"
                placeholder="e.g. system_admin"
                />
            </div>
            <button
                onClick={handleManualRun}
                disabled={!messageText}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all
                ${!messageText
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold'}`}
            >
                <Play size={16} />
                Run Test
            </button>
            </div>
        ) : (
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold">Total</div>
                        <div className="text-lg font-mono text-white">{stats.total}</div>
                    </div>
                    <div className="bg-green-950/30 p-2 rounded border border-green-900/30">
                        <div className="text-xs text-green-500 uppercase font-bold">Matches</div>
                        <div className="text-lg font-mono text-green-400">{stats.matches}</div>
                    </div>
                    <div className="bg-red-950/30 p-2 rounded border border-red-900/30">
                        <div className="text-xs text-red-500 uppercase font-bold">Drops</div>
                        <div className="text-lg font-mono text-red-400">{stats.drops}</div>
                    </div>
                </div>

                <button
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all shadow-lg
                    ${isStreaming
                        ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'}`}
                >
                    {isStreaming ? (
                        <><Pause size={16} /> Pause Stream</>
                    ) : (
                        <><Radio size={16} className={isStreaming ? "animate-pulse" : ""} /> Start Simulation</>
                    )}
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-2">
                    Simulates incoming Telethon events from mock channels.
                </p>
            </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto bg-slate-950/30 relative" ref={scrollRef}>
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 py-2 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console Output</span>
             {results.length > 0 && (
                <button onClick={clearResults} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                    <RotateCcw size={10} /> Clear
                </button>
             )}
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <Terminal size={24} className="mb-2 opacity-50"/>
              <p className="text-xs">Ready to evaluate.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {results.map((res, idx) => (
                <div key={idx} className="px-3 py-2 hover:bg-slate-800/30 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider
                            ${res.result
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {res.result ? 'MATCH' : 'DROP'}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">{res.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-purple-400 font-medium">@{res.sender}</span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-blue-400">{res.chat_name}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono break-all leading-relaxed opacity-90">
                        {res.message_text}
                    </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestBench;