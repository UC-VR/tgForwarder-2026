import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { generateLogicFromNaturalLanguage } from '../services/geminiService';
import { LogicNode } from '../types';

interface AIFilterConstructorProps {
  onLogicGenerated: (logic: LogicNode) => void;
}

const AIFilterConstructor: React.FC<AIFilterConstructorProps> = ({ onLogicGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    const logic = await generateLogicFromNaturalLanguage(prompt);

    if (logic) {
      onLogicGenerated(logic);
    } else {
      setError("Failed to generate logic. Please try rephrasing or check your API key.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-500/10 p-2 rounded-lg">
          <Sparkles className="text-purple-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI Logic Constructor</h3>
          <p className="text-sm text-slate-400">Describe your filter in plain English, and Gemini will build the logic tree.</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Forward messages about 'Ethereum' or 'BTC' if they mention 'breakout', but ignore anything from 'SpamBot'."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none h-32 text-sm"
        />

        <div className="absolute bottom-4 right-4 flex items-center gap-3">
            {error && (
                <div className="flex items-center text-red-400 text-xs bg-red-950/50 px-3 py-1.5 rounded-md border border-red-900/50 animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle size={12} className="mr-1.5"/>
                    {error}
                </div>
            )}
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${loading || !prompt.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'}
                `}
            >
                {loading ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Thinking...</span>
                </>
                ) : (
                <>
                    <span>Generate Logic</span>
                    <ArrowRight size={16} />
                </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIFilterConstructor;