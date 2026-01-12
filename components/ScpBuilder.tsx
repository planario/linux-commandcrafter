import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface ScpBuilderProps {
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
            id={`flag-scp-${flag}`}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
        />
        <div>
            <label htmlFor={`flag-scp-${flag}`} className="text-sm font-medium text-gray-300">{label} <span className="font-mono text-xs text-gray-500">({flag})</span></label>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);

export const ScpBuilder: React.FC<ScpBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [source, setSource] = useState('/path/to/local/file.txt');
    const [destination, setDestination] = useState('user@remote:/path/to/remote/');
    const [port, setPort] = useState('');
    const [isRecursive, setIsRecursive] = useState(false);
    const [preserve, setPreserve] = useState(false);
    const [compress, setCompress] = useState(true);
    const [identityFile, setIdentityFile] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [verbose, setVerbose] = useState(false);

    const [generatedCommand, setGeneratedCommand] = useState('');

    useEffect(() => {
        let cmd = 'scp';
        const flags = [];
        if (isRecursive) flags.push('r');
        if (preserve) flags.push('p');
        if (compress) flags.push('C');
        if (verbose) flags.push('v');

        if (flags.length > 0) {
            cmd += ` -${flags.join('')}`;
        }

        if (port) cmd += ` -P ${port}`;
        if (identityFile) cmd += ` -i "${identityFile}"`;
        
        // Handle Auth Token: Often used with specific SSH wrappers or environment variables
        // Here we'll append it as a comment-style helper or environment variable prefix if used
        let prefix = '';
        if (authToken) {
            prefix = `AUTH_TOKEN="${authToken}" `;
        }

        cmd = `${prefix}${cmd} ${source || ''} ${destination || ''}`;
        setGeneratedCommand(cmd.trim());

    }, [source, destination, port, isRecursive, preserve, compress, identityFile, authToken, verbose]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'scp');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Scp Builder</h2>
                <p className="text-gray-400 mt-1">Securely copy files over SSH.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Source" value={source} onChange={setSource} placeholder="e.g., local_file.txt" description="Local path or remote path (user@host:path)." />
                    <LabeledInput label="Destination" value={destination} onChange={setDestination} placeholder="e.g., user@remote:/home/" description="Target path for the copy." />
                </div>

                <div className="border-t border-gray-600 pt-6">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Authentication & Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <LabeledInput 
                            label="Identity File (SSH Key)" 
                            value={identityFile} 
                            onChange={setIdentityFile} 
                            placeholder="~/.ssh/id_rsa" 
                            description="Path to your private SSH key file."
                        />
                        <LabeledInput 
                            label="API Key / Auth Token" 
                            value={authToken} 
                            onChange={setAuthToken} 
                            placeholder="Paste token here" 
                            description="Added as an environment variable prefix for wrappers."
                        />
                    </div>
                </div>
                
                <div className="border-t border-gray-600 pt-6">
                    <h3 className="text-md font-semibold text-gray-300 mb-4">Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <FlagCheckbox label="Recursive" flag="-r" checked={isRecursive} onChange={setIsRecursive} description="Copy entire directories." />
                            <FlagCheckbox label="Preserve" flag="-p" checked={preserve} onChange={setPreserve} description="Preserve file attributes." />
                        </div>
                        <div className="space-y-4">
                            <FlagCheckbox label="Compress" flag="-C" checked={compress} onChange={setCompress} description="Speed up transfers with compression." />
                            <FlagCheckbox label="Verbose" flag="-v" checked={verbose} onChange={setVerbose} description="Show debugging output." />
                        </div>
                        <div>
                            <LabeledInput label="SSH Port" value={port} onChange={setPort} placeholder="22" description="Remote SSH port (default 22)." />
                        </div>
                    </div>
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'scp')}
            />
        </div>
    );
};