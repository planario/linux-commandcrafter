import React, { useState } from 'react';
import { Alias } from '../types';

interface AliasesProps {
    aliases: Alias[];
    setAliases: React.Dispatch<React.SetStateAction<Alias[]>>;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


export const Aliases: React.FC<AliasesProps> = ({ aliases, setAliases }) => {
    const [name, setName] = useState('');
    const [command, setCommand] = useState('');
    const [description, setDescription] = useState('');
    const [runInSubshell, setRunInSubshell] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setName('');
        setCommand('');
        setDescription('');
        setRunInSubshell(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !command) return;

        if (editingId) {
            setAliases(aliases.map(a => a.id === editingId ? { ...a, name, command, description, runInSubshell } : a));
        } else {
            const newAlias: Alias = { id: crypto.randomUUID(), name, command, description, runInSubshell };
            setAliases([newAlias, ...aliases]);
        }
        resetForm();
    };

    const handleEdit = (alias: Alias) => {
        setEditingId(alias.id);
        setName(alias.name);
        setCommand(alias.command);
        setDescription(alias.description);
        setRunInSubshell(!!alias.runInSubshell);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this alias?')) {
            setAliases(aliases.filter(a => a.id !== id));
            if (id === editingId) {
                resetForm();
            }
        }
    };

    const getCleanCommand = (alias: Alias) => {
        return alias.runInSubshell ? `(${alias.command})` : alias.command;
    };

    const formatAliasLine = (alias: Alias) => {
        // Escape single quotes within the command string for the alias definition
        // Example: echo 'hi' becomes echo '\''hi'\''
        const escapedCommand = getCleanCommand(alias).replace(/'/g, "'\\''");
        return `alias ${alias.name}='${escapedCommand}'`;
    };

    const formatQuickInstallLine = (alias: Alias) => {
        const aliasLine = formatAliasLine(alias);
        // Escape single quotes for the outer echo command
        const escapedLine = aliasLine.replace(/'/g, "'\\''");
        return `echo '${escapedLine}' >> ~/.bashrc && . ~/.bashrc`;
    };

    return (
        <div className="p-6 sm:p-8 flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Custom Aliases</h2>
                <p className="text-gray-400 mt-1">Create and manage your own command shortcuts.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-200">{editingId ? 'Edit Alias' : 'Add New Alias'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Alias Name (e.g., 'back')" 
                        required 
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-200"
                    />
                    <input 
                        type="text" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Short description (optional)" 
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-200"
                    />
                </div>

                <textarea 
                    value={command} 
                    onChange={e => setCommand(e.target.value)} 
                    placeholder="Full command (e.g., 'cd /var/www && ls -la')" 
                    required 
                    rows={3} 
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 font-mono focus:ring-teal-500 focus:border-teal-500 text-teal-300"
                />

                <div className="flex items-center gap-3 bg-gray-900/40 p-3 rounded-md border border-gray-600/30">
                    <input 
                        type="checkbox" 
                        id="runInSubshell" 
                        checked={runInSubshell} 
                        onChange={e => setRunInSubshell(e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                        <label htmlFor="runInSubshell" className="text-sm font-medium text-gray-200 cursor-pointer">
                            Run in subshell
                        </label>
                        <p className="text-xs text-gray-500">Wraps command in <span className="font-mono">()</span>. Useful to prevent <span className="font-mono">cd</span> or exports from affecting your current terminal session.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-white font-semibold transition-colors">{editingId ? 'Update Alias' : 'Save Alias'}</button>
                    {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors">Cancel</button>}
                </div>
            </form>

            <div className="flex flex-col gap-4">
                {aliases.length === 0 ? (
                     <p className="text-center text-gray-500 py-8">You haven't saved any aliases yet.</p>
                ) : aliases.map(alias => (
                    <div key={alias.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-teal-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-teal-400">{alias.name}</h4>
                                    {alias.runInSubshell && <span className="text-[10px] bg-teal-900/80 text-teal-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Subshell</span>}
                                </div>
                                {alias.description && <p className="text-sm text-gray-400 mt-1">{alias.description}</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => handleEdit(alias)} className="p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600 transition-colors" title="Edit Alias"><EditIcon /></button>
                                <button onClick={() => handleDelete(alias.id)} className="p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600 transition-colors" title="Delete Alias"><TrashIcon /></button>
                            </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 block tracking-wider">Shell Definition:</span>
                                <code className="block bg-gray-800 p-3 rounded-md text-teal-300 text-sm break-all select-all font-mono border border-gray-700/50">
                                    {formatAliasLine(alias)}
                                </code>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wider">Permanent Install (Bash):</span>
                                    <div className="group relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-gray-200 text-[10px] rounded shadow-xl border border-gray-600 invisible group-hover:visible z-10 pointer-events-none">
                                            Appends the alias to your .bashrc and runs 'source' to enable it immediately in your terminal.
                                        </div>
                                    </div>
                                </div>
                                <code className="block bg-gray-800 p-3 rounded-md text-teal-300 text-sm break-all select-all font-mono border border-gray-700/50">
                                    {formatQuickInstallLine(alias)}
                                </code>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};