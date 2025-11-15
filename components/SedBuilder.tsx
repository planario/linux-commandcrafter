import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface SedBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
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

const FlagCheckbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; description: string;}> =
({ label, checked, onChange, description }) => (
    <div className="flex items-start gap-3">
        <input 
            type="checkbox"
            id={`flag-${label}`}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
        />
        <div>
            <label htmlFor={`flag-${label}`} className="text-sm font-medium text-gray-300">{label}</label>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);

export const SedBuilder: React.FC<SedBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [search, setSearch] = useState('find_this');
    const [replace, setReplace] = useState('replace_with_this');
    const [file, setFile] = useState('input.txt');
    const [inPlace, setInPlace] = useState(false);
    const [isGlobal, setIsGlobal] = useState(true);
    const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
    
    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'sed';
        if (inPlace) {
            cmd += ' -i';
        }
        
        let flags = '';
        if (isGlobal) flags += 'g';
        if (isCaseInsensitive) flags += 'i';
        
        // Basic escaping for the separator '/'
        const escapedSearch = search.replace(/\//g, '\\/');
        const escapedReplace = replace.replace(/\//g, '\\/');

        cmd += ` 's/${escapedSearch}/${escapedReplace}/${flags}'`;

        if (file) {
            cmd += ` ${file}`;
        }

        setGeneratedCommand(cmd.trim());

    }, [search, replace, file, inPlace, isGlobal, isCaseInsensitive]);

     useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'sed');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
         <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Sed Builder</h2>
                <p className="text-gray-400 mt-1">Craft stream editor commands for find & replace.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Search For" value={search} onChange={setSearch} placeholder="Text or Regex" description="The text or regular expression pattern to find." />
                    <LabeledInput label="Replace With" value={replace} onChange={setReplace} placeholder="Replacement text" description="The text to use as a replacement." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                        <FlagCheckbox label="Global (g)" checked={isGlobal} onChange={setIsGlobal} description="Replace all occurrences on a line." />
                        <FlagCheckbox label="Case-Insensitive (i)" checked={isCaseInsensitive} onChange={setIsCaseInsensitive} description="Ignore case when searching." />
                    </div>
                     <div className="flex flex-col gap-4">
                        <FlagCheckbox label="In-Place Edit (-i)" checked={inPlace} onChange={setInPlace} description="Modify the file directly (CAUTION!)." />
                    </div>
                </div>

                 <LabeledInput label="File (Full Path Recommended)" value={file} onChange={setFile} placeholder="/home/user/logs/app.log" description="The input file to process. Using a full path is recommended for the `-i` flag." />
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'sed')}
            />
         </div>
    );
};
