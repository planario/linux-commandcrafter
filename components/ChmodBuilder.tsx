import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface ChmodBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type Mode = 'octal' | 'symbolic';

const SymbolicPermissionCheckbox: React.FC<{ label: string, isChecked: boolean, onChange: (checked: boolean) => void }> = ({ label, isChecked, onChange }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" checked={isChecked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-400 text-teal-600 focus:ring-teal-500" />
        <span className="text-gray-300">{label}</span>
    </label>
);

export const ChmodBuilder: React.FC<ChmodBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [mode, setMode] = useState<Mode>('symbolic');
    const [path, setPath] = useState('file.txt');
    const [isRecursive, setIsRecursive] = useState(false);
    
    // Octal state
    const [octalValue, setOctalValue] = useState('755');

    // Symbolic state
    const [symbolicWho, setSymbolicWho] = useState({ user: true, group: false, others: false });
    const [symbolicAction, setSymbolicAction] = useState<'+' | '-' | '='>('+');
    const [symbolicPerms, setSymbolicPerms] = useState({ read: true, write: false, execute: true });

    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'chmod';
        if (isRecursive) cmd += ' -R';

        if (mode === 'octal') {
            cmd += ` ${octalValue || '000'}`;
        } else {
            const who = Object.entries(symbolicWho).filter(([, val]) => val).map(([key]) => key[0]).join('');
            const perms = Object.entries(symbolicPerms).filter(([, val]) => val).map(([key]) => key[0]).join('');
            if (who && perms) {
                cmd += ` ${who}${symbolicAction}${perms}`;
            }
        }
        
        cmd += ` ${path || ''}`;
        setGeneratedCommand(cmd.trim());
    }, [mode, path, isRecursive, octalValue, symbolicWho, symbolicAction, symbolicPerms]);

     useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'chmod');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Chmod Builder</h2>
                <p className="text-gray-400 mt-1">Change file and directory permissions.</p>
            </div>
            
             <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">File or Directory Path</label>
                    <input value={path} onChange={e => setPath(e.target.value)} placeholder="/path/to/target" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                    <p className="text-xs text-gray-500 mt-1">The file or directory whose permissions will be changed.</p>
                </div>
                <div className="flex items-start gap-3">
                    <input type="checkbox" id="chmod-recursive" checked={isRecursive} onChange={e => setIsRecursive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1" />
                    <div>
                        <label htmlFor="chmod-recursive" className="text-sm font-medium text-gray-300">Recursive (-R)</label>
                        <p className="text-xs text-gray-500">Apply permissions to directories and their contents.</p>
                    </div>
                </div>
             </div>

            <div className="bg-gray-700/50 p-6 rounded-lg">
                <div className="flex items-center bg-gray-900 rounded-lg p-1 mb-6 max-w-xs">
                    {(['symbolic', 'octal'] as Mode[]).map(m => (
                        <button key={m} onClick={() => setMode(m)} className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md capitalize transition-colors duration-200 focus:outline-none focus:z-10 focus:ring-2 focus:ring-teal-500 ${mode === m ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                            {m}
                        </button>
                    ))}
                </div>

                {mode === 'octal' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Octal Value</label>
                        <input value={octalValue} onChange={e => setOctalValue(e.target.value)} maxLength={3} placeholder="e.g., 755" className="w-full md:w-1/3 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 font-mono" />
                        <p className="text-xs text-gray-500 mt-2">A 3-digit octal number (e.g., 755). Each digit represents user, group, and others.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Who</h4>
                            <div className="space-y-2">
                                <SymbolicPermissionCheckbox label="User" isChecked={symbolicWho.user} onChange={c => setSymbolicWho(s => ({...s, user: c}))} />
                                <SymbolicPermissionCheckbox label="Group" isChecked={symbolicWho.group} onChange={c => setSymbolicWho(s => ({...s, group: c}))} />
                                <SymbolicPermissionCheckbox label="Others" isChecked={symbolicWho.others} onChange={c => setSymbolicWho(s => ({...s, others: c}))} />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Action</h4>
                            <div className="flex items-center bg-gray-800 rounded-md p-1">
                                {(['+', '-', '='] as const).map(action => (
                                    <button key={action} onClick={() => setSymbolicAction(action)} className={`flex-1 px-3 py-1 text-sm font-semibold rounded transition-colors duration-200 ${symbolicAction === action ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Permissions</h4>
                             <div className="space-y-2">
                                <SymbolicPermissionCheckbox label="Read" isChecked={symbolicPerms.read} onChange={c => setSymbolicPerms(s => ({...s, read: c}))} />
                                <SymbolicPermissionCheckbox label="Write" isChecked={symbolicPerms.write} onChange={c => setSymbolicPerms(s => ({...s, write: c}))} />
                                <SymbolicPermissionCheckbox label="Execute" isChecked={symbolicPerms.execute} onChange={c => setSymbolicPerms(s => ({...s, execute: c}))} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'chmod')}
            />
        </div>
    );
};
