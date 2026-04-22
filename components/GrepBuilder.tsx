import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';
import { shellQuote as q } from '../utils/shell';
import { LabeledInput, FlagCheckbox } from './shared';

interface GrepBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

export const GrepBuilder: React.FC<GrepBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [pattern, setPattern] = useState('error');
    const [path, setPath] = useState('/var/log/syslog');
    const [isRecursive, setIsRecursive] = useState(false);
    const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
    const [invertMatch, setInvertMatch] = useState(false);
    const [showFileNames, setShowFileNames] = useState(false);
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const [matchWholeWords, setMatchWholeWords] = useState(false);
    
    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'grep';
        const flags = [];
        if (isRecursive) flags.push('r');
        if (isCaseInsensitive) flags.push('i');
        if (invertMatch) flags.push('v');
        if (showFileNames) flags.push('l');
        if (showLineNumbers) flags.push('n');
        if (matchWholeWords) flags.push('w');

        if (flags.length > 0) {
            cmd += ` -${flags.join('')}`;
        }
        
        cmd += ` ${q(pattern || '')}`;
        if (path) cmd += ` ${q(path)}`;
        
        setGeneratedCommand(cmd.trim());

    }, [pattern, path, isRecursive, isCaseInsensitive, invertMatch, showFileNames, showLineNumbers, matchWholeWords]);

     useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'grep');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
         <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Grep Builder</h2>
                <p className="text-gray-400 mt-1">Find text patterns within files.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Pattern to Search For" value={pattern} onChange={setPattern} placeholder="Text or Regex" description="The text or regular expression to match." />
                    <LabeledInput label="File or Directory Path" value={path} onChange={setPath} placeholder="/path/to/search" description="The file to search in, or a directory for recursive search." />
                </div>
                
                <div>
                    <h3 className="text-md font-semibold text-gray-300 mb-4">Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FlagCheckbox namespace="grep" label="Recursive" flag="-r" checked={isRecursive} onChange={setIsRecursive} description="Search directories and subdirectories." />
                        <FlagCheckbox namespace="grep" label="Case-Insensitive" flag="-i" checked={isCaseInsensitive} onChange={setIsCaseInsensitive} description="Ignore case distinctions in patterns." />
                        <FlagCheckbox namespace="grep" label="Invert Match" flag="-v" checked={invertMatch} onChange={setInvertMatch} description="Show lines that DO NOT match." />
                        <FlagCheckbox namespace="grep" label="Files with Matches" flag="-l" checked={showFileNames} onChange={setShowFileNames} description="Only show the names of matching files." />
                        <FlagCheckbox namespace="grep" label="Line Numbers" flag="-n" checked={showLineNumbers} onChange={setShowLineNumbers} description="Show line numbers with output." />
                        <FlagCheckbox namespace="grep" label="Whole Words" flag="-w" checked={matchWholeWords} onChange={setMatchWholeWords} description="The pattern must match a whole word." />
                    </div>
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'grep')}
            />
         </div>
    );
};
