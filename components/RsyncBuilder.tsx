import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';
import { shellQuote as q } from '../utils/shell';

interface RsyncBuilderProps {
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

const FlagCheckbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; description: string; flag: string;}> =
({ label, checked, onChange, description, flag }) => (
    <div className="flex items-start gap-3">
        <input 
            type="checkbox"
            id={`flag-rsync-${flag}`}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
        />
        <div>
            <label htmlFor={`flag-rsync-${flag}`} className="text-sm font-medium text-gray-300">{label} <span className="font-mono text-xs text-gray-500">({flag})</span></label>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);

export const RsyncBuilder: React.FC<RsyncBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [source, setSource] = useState('/home/user/src/');
    const [destination, setDestination] = useState('user@remote:/backup/src/');
    const [isArchive, setIsArchive] = useState(true);
    const [isVerbose, setIsVerbose] = useState(true);
    const [isCompress, setIsCompress] = useState(true);
    const [showProgress, setShowProgress] = useState(true);
    const [deleteExtraneous, setDeleteExtraneous] = useState(false);
    const [dryRun, setDryRun] = useState(false);
    const [identityFile, setIdentityFile] = useState('');
    const [sshPort, setSshPort] = useState('');
    const [exclude, setExclude] = useState('node_modules');

    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'rsync';
        const flags = [];
        if (isArchive) flags.push('a');
        if (isVerbose) flags.push('v');
        if (isCompress) flags.push('z');
        if (dryRun) flags.push('n');

        if (flags.length > 0) {
            cmd += ` -${flags.join('')}`;
        }

        if (showProgress) cmd += ' --progress';
        if (deleteExtraneous) cmd += ' --delete';
        if (exclude) cmd += ` --exclude=${q(exclude)}`;

        // SSH options
        let rsh = '';
        if (sshPort || identityFile) {
            rsh = 'ssh';
            if (sshPort) rsh += ` -p ${sshPort}`;
            if (identityFile) rsh += ` -i ${q(identityFile)}`;
            cmd += ` -e ${q(rsh)}`;
        }

        cmd += ` ${q(source || '')} ${q(destination || '')}`;
        setGeneratedCommand(cmd.trim());

    }, [source, destination, isArchive, isVerbose, isCompress, showProgress, deleteExtraneous, dryRun, identityFile, sshPort, exclude]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'rsync');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Rsync Builder</h2>
                <p className="text-gray-400 mt-1">Synchronize files efficiently across systems.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Source" value={source} onChange={setSource} placeholder="/path/to/source/" description="Use trailing slash to copy contents, omit to copy directory itself." />
                    <LabeledInput label="Destination" value={destination} onChange={setDestination} placeholder="user@remote:/path/" description="Target path for synchronization." />
                </div>

                <div className="border-t border-gray-600 pt-6">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Authentication (SSH)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <LabeledInput 
                            label="Identity File (SSH Key)" 
                            value={identityFile} 
                            onChange={setIdentityFile} 
                            placeholder="~/.ssh/id_rsa" 
                            description="Identity file used for the remote connection."
                        />
                        <LabeledInput 
                            label="SSH Port (if not 22)" 
                            value={sshPort} 
                            onChange={setSshPort} 
                            placeholder="22" 
                            description="Override default SSH port."
                        />
                    </div>
                </div>

                <div className="border-t border-gray-600 pt-6">
                    <h3 className="text-md font-semibold text-gray-300 mb-4">Sync Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <FlagCheckbox label="Archive Mode" flag="-a" checked={isArchive} onChange={setIsArchive} description="Recurse, preserve links/perms/owner/time." />
                        <FlagCheckbox label="Verbose" flag="-v" checked={isVerbose} onChange={setIsVerbose} description="Explain what is being done." />
                        <FlagCheckbox label="Compress" flag="-z" checked={isCompress} onChange={setIsCompress} description="Compress data during transfer." />
                        <FlagCheckbox label="Show Progress" flag="--progress" checked={showProgress} onChange={setShowProgress} description="Show transfer progress bar." />
                        <FlagCheckbox label="Delete Extra" flag="--delete" checked={deleteExtraneous} onChange={setDeleteExtraneous} description="Delete files in destination not in source." />
                        <FlagCheckbox label="Dry Run" flag="-n" checked={dryRun} onChange={setDryRun} description="Trial run with no changes." />
                    </div>
                    <div className="mt-4">
                        <LabeledInput label="Exclude Pattern" value={exclude} onChange={setExclude} placeholder="node_modules" description="Pattern of files to skip during synchronization." />
                    </div>
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'rsync')}
            />
        </div>
    );
};