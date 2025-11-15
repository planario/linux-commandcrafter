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
    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setName('');
        setCommand('');
        setDescription('');
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !command) return;

        if (editingId) {
            setAliases(aliases.map(a => a.id === editingId ? { ...a, name, command, description } : a));
        } else {
            const newAlias: Alias = { id: crypto.randomUUID(), name, command, description };
            setAliases([newAlias, ...aliases]);
        }
        resetForm();
    };

    const handleEdit = (alias: Alias) => {
        setEditingId(alias.id);
        setName(alias.name);
        setCommand(alias.command);
        setDescription(alias.description);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this alias?')) {
            setAliases(aliases.filter(a => a.id !== id));
            if (id === editingId) {
                resetForm();
            }
        }
    };

    return (
        <div className="p-6 sm:p-8 flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Custom Aliases</h2>
                <p className="text-gray-400 mt-1">Create and manage your own command shortcuts.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-200">{editingId ? 'Edit Alias' : 'Add New Alias'}</h3>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alias Name (e.g., 'backup_home')" required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                <textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Full command (e.g., 'rsync -avz /home/user/ remote:/backup/')" required rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 font-mono focus:ring-teal-500 focus:border-teal-500"/>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                <div className="flex gap-4">
                    <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-white font-semibold transition-colors">{editingId ? 'Update Alias' : 'Save Alias'}</button>
                    {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors">Cancel</button>}
                </div>
            </form>

            <div className="flex flex-col gap-4">
                {aliases.length === 0 ? (
                     <p className="text-center text-gray-500 py-8">You haven't saved any aliases yet.</p>
                ) : aliases.map(alias => (
                    <div key={alias.id} className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-teal-400">{alias.name}</h4>
                                {alias.description && <p className="text-sm text-gray-400 mt-1">{alias.description}</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => handleEdit(alias)} className="p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"><EditIcon /></button>
                                <button onClick={() => handleDelete(alias.id)} className="p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"><TrashIcon /></button>
                            </div>
                        </div>
                        <code className="block bg-gray-800 p-3 rounded-md mt-3 text-teal-300 text-sm break-all select-all font-mono">{alias.command}</code>
                    </div>
                ))}
            </div>
        </div>
    );
};
