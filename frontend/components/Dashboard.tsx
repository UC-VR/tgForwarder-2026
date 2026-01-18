import React from 'react';
import { LogEntry, FilterRule } from '../types';
import { Activity, ShieldCheck, Zap, Bot } from 'lucide-react';

interface DashboardProps {
  logs: LogEntry[];
  rules: FilterRule[];
}

const StatCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, subValue, icon: Icon, color }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {subValue && <p className="text-slate-500 text-xs mt-2">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ logs, rules }) => {
  const activeRules = rules.filter(r => r.isActive).length;
  const totalProcessed = logs.length; // Mock total based on logs array for now
  const aiAnalyses = logs.filter(l => l.action === 'analyzed').length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Rules"
          value={activeRules.toString()}
          subValue={`${rules.length} total defined`}
          icon={ShieldCheck}
          color="text-emerald-400"
        />
        <StatCard
          label="Messages Processed"
          value={totalProcessed.toString()}
          subValue="+124 in last hour"
          icon={Activity}
          color="text-blue-400"
        />
        <StatCard
          label="AI Interventions"
          value={aiAnalyses.toString()}
          subValue="Refined filtering"
          icon={Bot}
          color="text-purple-400"
        />
        <StatCard
          label="Est. Latency Saved"
          value="450ms"
          subValue="vs Pure AI Logic"
          icon={Zap}
          color="text-amber-400"
        />
      </div>

      {/* Recent Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Live Activity Feed</h3>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Message Preview</th>
                <th className="px-6 py-3">Rule</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-md truncate text-slate-300">
                    {log.messagePreview}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {log.matchedRuleName || '-'}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${log.action === 'forwarded' ? 'bg-green-500/10 text-green-400' :
                          log.action === 'dropped' ? 'bg-red-500/10 text-red-400' :
                          'bg-purple-500/10 text-purple-400'}
                     `}>
                        {log.action}
                        {log.action === 'analyzed' && <Bot size={12} className="ml-1"/>}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-500">No logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;