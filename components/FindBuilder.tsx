import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface FindBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command:string, type: string) => void;
}

const LabeledInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; description?: string; }> = 
({ label, value, onChange, placeholder, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
        />
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

export const FindBuilder: React.FC<FindBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [path, setPath] = useState('.');
    const [namePattern, setNamePattern] = useState('');
    const [type, setType] = useState('any');
    const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
    
    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'find';
        cmd += ` ${path || '.'}`;

        if (type !== 'any') {
            cmd += ` -type ${type}`;
        }
        
        if (namePattern) {
            const nameFlag = isCaseInsensitive ? '-iname' : '-name';
            cmd += ` ${nameFlag} "${namePattern}"`;
        }

        setGeneratedCommand(cmd.trim());
    }, [path, namePattern, type, isCaseInsensitive]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'find');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Find Builder</h2>
                <p className="text-gray-400 mt-1">Search for files and directories in a hierarchy.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <LabeledInput label="Starting Path" value={path} onChange={setPath} placeholder="e.g., /home/user" description="The directory where the search will begin." />
                
                <div>
                    <h3 className="text-md font-semibold text-gray-300 mb-4">Expressions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <LabeledInput label="Name Pattern" value={namePattern} onChange={setNamePattern} placeholder="e.g., *.log or document.txt" description="A shell pattern to match against file names. Use `*` as a wildcard." />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">File Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                                <option value="any">Any</option>
                                <option value="f">File (f)</option>
                                <option value="d">Directory (d)</option>
                                <option value="l">Symbolic Link (l)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 mt-4">
                        <input 
                            type="checkbox"
                            id="find-iname"
                            checked={isCaseInsensitive}
                            onChange={e => setIsCaseInsensitive(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
                        />
                        <div>
                            <label htmlFor="find-iname" className="text-sm font-medium text-gray-300">Case-Insensitive Name Search</label>
                            <p className="text-xs text-gray-500">Uses <span className="font-mono">-iname</span> instead of <span className="font-mono">-name</span>.</p>
                        </div>
                    </div>
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'find')}
            />
        </div>
    );
};
