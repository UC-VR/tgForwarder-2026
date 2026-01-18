import React from 'react';
import { FilterRule } from '../types';
import { Edit2, Power, Trash2, Bot } from 'lucide-react';

interface RuleManagerProps {
  rules: FilterRule[];
  onEdit: (rule: FilterRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onCreate: () => void;
}

const RuleManager: React.FC<RuleManagerProps> = ({ rules, onEdit, onDelete, onToggle, onCreate }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Filtering Rules</h2>
           <p className="text-slate-400 text-sm">Manage deterministic filters and AI analysis triggers.</p>
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
          Create New Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`
              group bg-slate-900 border rounded-xl p-5 transition-all duration-300
              ${rule.isActive ? 'border-slate-700 shadow-sm' : 'border-slate-800 opacity-60 bg-slate-950'}
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div
                  onClick={() => onToggle(rule.id)}
                  className={`
                    mt-1 w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center
                    ${rule.isActive ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'}
                  `}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {rule.name}
                    {rule.aiConfig.enabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Bot size={12} className="mr-1" />
                        AI Enhanced
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Created {new Date(rule.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(rule)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDelete(rule.id)}
                  className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Logic Preview (Simplified) */}
            <div className="mt-4 pt-4 border-t border-slate-800/50">
               <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800/50 truncate">
                  {/* Just showing root logic type for preview */}
                  ROOT: {rule.logicRoot.operator || 'SINGLE'} ({rule.logicRoot.children?.length || 0} conditions)
                  {rule.aiConfig.enabled && ` -> AI: "${rule.aiConfig.systemInstruction.substring(0, 40)}..."`}
               </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
             <p className="text-slate-500">No rules found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleManager;