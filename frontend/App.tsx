import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LogicBuilder from './components/LogicBuilder';
import AIFilterConstructor from './components/AIFilterConstructor';
import RuleManager from './components/RuleManager';
import TestBench from './components/TestBench';
import { ViewState, FilterRule, LogicNode, LogEntry } from './types';
import { MOCK_LOGS } from './constants';
import { Save, Bot, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [logs] = useState<LogEntry[]>(MOCK_LOGS); // In a real app, this would update live
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Builder State (Temporary state when editing/creating)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [builderLogic, setBuilderLogic] = useState<LogicNode | null>(null);
  const [builderName, setBuilderName] = useState('New Rule');
  const [builderSource, setBuilderSource] = useState('');
  const [builderDestination, setBuilderDestination] = useState('');
  const [builderMethod, setBuilderMethod] = useState<'forward' | 'copy'>('forward');
  const [aiConfig, setAiConfig] = useState({ enabled: false, systemInstruction: '', model: 'gemini-3-flash-preview' });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await api.fetchRules();
      setRules(data);
      setErrorMsg(null);
    } catch (e) {
      console.error("Failed to load rules", e);
      setErrorMsg(`Failed to connect to backend: ${String(e)}`);
    }
  };

  // -- Handlers --

  const handleCreateRule = () => {
    setEditingRuleId(null);
    setBuilderName('New Filter Rule');
    setBuilderSource('');
    setBuilderDestination('');
    setBuilderMethod('forward');
    setBuilderLogic({
      id: crypto.randomUUID(),
      type: 'group',
      operator: 'AND',
      children: []
    });
    setAiConfig({ enabled: false, systemInstruction: '', model: 'gemini-3-flash-preview' });
    setCurrentView('builder');
  };

  const handleEditRule = (rule: FilterRule) => {
    setEditingRuleId(rule.id);
    setBuilderName(rule.name);
    setBuilderSource(rule.source);
    setBuilderDestination(rule.destination);
    setBuilderMethod(rule.deliveryMethod);
    setBuilderLogic(JSON.parse(JSON.stringify(rule.logicRoot))); // Deep copy
    setAiConfig({ ...rule.aiConfig });
    setCurrentView('builder');
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteRule(id);
      await loadRules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    try {
      await api.updateRule({ ...rule, isActive: !rule.isActive });
      await loadRules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRule = async () => {
    if (!builderLogic) return;

    const ruleData = {
      name: builderName,
      source: builderSource,
      destination: builderDestination,
      deliveryMethod: builderMethod,
      isActive: true,
      logicRoot: builderLogic,
      aiConfig: aiConfig
    };

    try {
      if (editingRuleId) {
        await api.updateRule({ ...ruleData, id: editingRuleId, createdAt: '' } as FilterRule);
      } else {
        await api.createRule(ruleData as any);
      }
      await loadRules();
      setCurrentView('rules');
    } catch (e) {
      console.error("Failed to save", e);
      alert("Failed to save rule: " + e);
    }
  };

  const handleLogicFromAI = (logic: LogicNode) => {
    setBuilderLogic(logic);
  };

  // -- Render Content --

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard logs={logs} rules={rules} />;
      case 'logs':
        return <Dashboard logs={logs} rules={rules} />; // Reuse dashboard or make dedicated log view
      case 'settings':
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-white">Settings</h2>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-400">Settings implementation pending backend config API.</p>
                <div className="mt-4">
                  <label className="block text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Backend URL</label>
                  <code className="bg-slate-950 p-2 rounded text-slate-300 block w-full border border-slate-800">
                    {import.meta.env.VITE_API_URL || 'Default (Relative)'}
                  </code>
                </div>
             </div>
          </div>
        );
      case 'rules':
        return (
          <RuleManager
            rules={rules}
            onCreate={handleCreateRule}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggle={handleToggleRule}
          />
        );
      case 'builder':
        if (!builderLogic) return null;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-start bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm sticky top-4 z-10">
                <div className="flex-1 mr-6 space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Rule Name</label>
                    <input
                      type="text"
                      value={builderName}
                      onChange={(e) => setBuilderName(e.target.value)}
                      className="bg-transparent border-none text-xl font-bold text-white focus:ring-0 p-0 w-full placeholder-slate-600"
                      placeholder="Rule Name..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/50">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Source Chat ID</label>
                      <input
                        type="text"
                        value={builderSource}
                        onChange={(e) => setBuilderSource(e.target.value)}
                        className="bg-slate-950/50 border border-slate-700 rounded px-3 py-2 w-full text-sm text-white focus:border-purple-500 outline-none placeholder-slate-600"
                        placeholder="@channel_source"
                      />
                    </div>
                     <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Dest Chat ID</label>
                      <input
                        type="text"
                        value={builderDestination}
                        onChange={(e) => setBuilderDestination(e.target.value)}
                        className="bg-slate-950/50 border border-slate-700 rounded px-3 py-2 w-full text-sm text-white focus:border-purple-500 outline-none placeholder-slate-600"
                        placeholder="@channel_dest"
                      />
                    </div>
                     <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Method</label>
                      <select
                        value={builderMethod}
                        onChange={(e) => setBuilderMethod(e.target.value as any)}
                        className="bg-slate-950/50 border border-slate-700 rounded px-3 py-2 w-full text-sm text-white focus:border-purple-500 outline-none"
                      >
                         <option value="forward">Forward</option>
                         <option value="copy">Copy</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button
                     onClick={() => setCurrentView('rules')}
                     className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleSaveRule}
                     className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-green-900/20 transition-all"
                   >
                     <Save size={18} />
                     Save Rule
                   </button>
                </div>
             </div>

             <AIFilterConstructor onLogicGenerated={handleLogicFromAI} />

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Logic Builder Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white px-1">Deterministic Logic Tree</h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
                        <LogicBuilder rootNode={builderLogic} onChange={setBuilderLogic} />
                    </div>
                </div>

                {/* Sidebar Column: Test Bench & AI Config */}
                <div className="space-y-6">
                   {/* TEST BENCH COMPONENT */}
                   <TestBench logicRoot={builderLogic} />

                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                         <span className="flex items-center text-slate-300 font-medium">
                            <Bot size={18} className="mr-2 text-purple-400"/>
                            AI Refinement
                         </span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiConfig.enabled}
                              onChange={(e) => setAiConfig({...aiConfig, enabled: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                         </label>
                      </div>

                      {aiConfig.enabled && (
                        <div className="space-y-4 animate-in fade-in pt-2">
                           <div>
                             <label className="block text-xs text-slate-500 mb-2">System Instruction</label>
                             <textarea
                                value={aiConfig.systemInstruction}
                                onChange={(e) => setAiConfig({...aiConfig, systemInstruction: e.target.value})}
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-purple-500 outline-none resize-none"
                                placeholder='e.g., "Analyze if this message contains a legitimate offer..."'
                             />
                           </div>
                           <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
                              <p className="text-xs text-blue-300">
                                 AI checks messages that pass the deterministic logic.
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <Navigation currentView={currentView} setView={setCurrentView} />

      <main className="flex-1 ml-64 p-8 relative">
        <div className="max-w-7xl mx-auto">
           {errorMsg && (
             <div className="mb-4 bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded flex items-center">
               <AlertTriangle className="mr-2" size={20} />
               {errorMsg}
             </div>
           )}
           {successMsg && (
             <div className="mb-4 bg-green-900/50 border border-green-800 text-green-200 px-4 py-3 rounded flex items-center">
               <CheckCircle className="mr-2" size={20} />
               {successMsg}
             </div>
           )}
           {renderContent()}
        </div>
      </main>

      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-3xl opacity-30"></div>
         <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-3xl opacity-20"></div>
      </div>
    </div>
  );
};

export default App;