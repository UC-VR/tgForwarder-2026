import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, Type as TypeIcon } from 'lucide-react';
import { LogicNode, LogicOperator, ConditionOperator } from '../types';

interface LogicBuilderProps {
  rootNode: LogicNode;
  onChange: (newNode: LogicNode) => void;
}

const LogicNodeComponent: React.FC<{
  node: LogicNode;
  path: number[];
  onUpdate: (path: number[], updatedNode: LogicNode) => void;
  onDelete: (path: number[]) => void;
  onAddChild: (path: number[], type: 'group' | 'condition') => void;
}> = ({ node, path, onUpdate, onDelete, onAddChild }) => {
  const isGroup = node.type === 'group';

  // Handle local changes and bubble up
  const handleOperatorChange = (op: LogicOperator) => {
    onUpdate(path, { ...node, operator: op });
  };

  const handleFieldChange = (val: string) => {
    onUpdate(path, { ...node, field: val });
  };

  const handleConditionChange = (val: ConditionOperator) => {
    onUpdate(path, { ...node, condition: val });
  };

  const handleValueChange = (val: string) => {
    onUpdate(path, { ...node, value: val });
  };

  return (
    <div className={`relative flex flex-col ${path.length > 0 ? 'ml-8 mt-4' : ''}`}>
      {/* Connecting Line for nested items */}
      {path.length > 0 && (
        <div className="absolute -left-6 top-6 w-6 h-[2px] bg-slate-700 rounded-l-full" />
      )}
      {path.length > 0 && (
        <div className="absolute -left-6 -top-6 bottom-1/2 w-[2px] bg-slate-700" />
      )}

      <div className={`
        relative p-4 rounded-xl border transition-all duration-200 shadow-sm
        ${isGroup
          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'}
      `}>

        {/* Node Header/Controls */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Group Operator Toggle */}
          {isGroup ? (
            <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              {(['AND', 'OR'] as LogicOperator[]).map((op) => (
                <button
                  key={op}
                  onClick={() => handleOperatorChange(op)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    node.operator === op
                      ? op === 'AND' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          ) : (
            // Condition Controls
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center text-slate-400 bg-slate-950 px-2 py-1.5 rounded-md border border-slate-800">
                 <TypeIcon size={14} className="mr-2 opacity-50"/>
                 <select
                    value={node.field}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    className="bg-transparent border-none text-xs font-medium focus:ring-0 text-slate-200 outline-none cursor-pointer"
                 >
                    <option value="message_text">Message Text</option>
                    <option value="sender">Sender ID</option>
                    <option value="chat_name">Chat Name</option>
                 </select>
              </div>

              <select
                value={node.condition}
                onChange={(e) => handleConditionChange(e.target.value as ConditionOperator)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
                <option value="regex">Regex Match</option>
                <option value="not_contains">Does Not Contain</option>
              </select>

              <input
                type="text"
                value={node.value || ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Value..."
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md px-3 py-1.5 outline-none focus:border-blue-500 min-w-[120px]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
             {isGroup && (
               <div className="flex gap-1">
                 <button
                   onClick={() => onAddChild(path, 'condition')}
                   className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-green-400 rounded-md transition-colors"
                   title="Add Condition"
                 >
                   <Plus size={16} />
                 </button>
                 <button
                   onClick={() => onAddChild(path, 'group')}
                   className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-purple-400 rounded-md transition-colors"
                   title="Add Group"
                 >
                   <GitBranch size={16} transform="rotate(90)"/> {/* Hacky rotate for icon */}
                 </button>
               </div>
             )}

             {/* Delete (only if not root) */}
             {path.length > 0 && (
               <button
                 onClick={() => onDelete(path)}
                 className="p-1.5 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-md transition-colors"
               >
                 <Trash2 size={16} />
               </button>
             )}
          </div>
        </div>

        {/* Recursive Children Rendering */}
        {isGroup && node.children && (
           <div className="pl-2">
             {node.children.map((child, index) => (
                <LogicNodeComponent
                  key={child.id}
                  node={child}
                  path={[...path, index]}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
             ))}
             {node.children.length === 0 && (
               <div className="p-4 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg mt-4">
                 No conditions. Add one above.
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

const LogicBuilder: React.FC<LogicBuilderProps> = ({ rootNode, onChange }) => {
  // Helper to clone and mutate state immutably
  const updateNodeAtPath = (root: LogicNode, path: number[], updater: (node: LogicNode) => LogicNode): LogicNode => {
    if (path.length === 0) {
      return updater(root);
    }
    const [head, ...tail] = path;
    if (!root.children) return root; // Should not happen for valid paths

    const newChildren = [...root.children];
    newChildren[head] = updateNodeAtPath(newChildren[head], tail, updater);

    return { ...root, children: newChildren };
  };

  const removeNodeAtPath = (root: LogicNode, path: number[]): LogicNode => {
     if (path.length === 0) return root; // Cannot delete root this way

     const parentPath = path.slice(0, -1);
     const childIndex = path[path.length - 1];

     return updateNodeAtPath(root, parentPath, (node) => {
        if (!node.children) return node;
        const newChildren = node.children.filter((_, i) => i !== childIndex);
        return { ...node, children: newChildren };
     });
  };

  const addChildAtPath = (root: LogicNode, path: number[], type: 'group' | 'condition'): LogicNode => {
     const newNode: LogicNode = type === 'group'
        ? { id: crypto.randomUUID(), type: 'group', operator: 'AND', children: [] }
        : { id: crypto.randomUUID(), type: 'condition', field: 'message_text', condition: 'contains', value: '' };

     return updateNodeAtPath(root, path, (node) => ({
        ...node,
        children: [...(node.children || []), newNode]
     }));
  };

  return (
    <div className="p-6 overflow-x-auto">
      <LogicNodeComponent
        node={rootNode}
        path={[]}
        onUpdate={(path, updated) => onChange(updateNodeAtPath(rootNode, path, () => updated))}
        onDelete={(path) => onChange(removeNodeAtPath(rootNode, path))}
        onAddChild={(path, type) => onChange(addChildAtPath(rootNode, path, type))}
      />
    </div>
  );
};

// Icon import helper
import { GitBranch as GitBranchIcon } from 'lucide-react';
const GitBranch = GitBranchIcon;

export default LogicBuilder;