import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';
import { shellQuote as q } from '../utils/shell';
import { LabeledInput, FlagCheckbox } from './shared';

interface ScpBuilderProps {
  onCommandGenerated: (command: string, type: string) => void;
  favorites: CommandEntry[];
  onToggleFavorite: (command: string, type: string) => void;
}

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
  const [showToken, setShowToken] = useState(false);

  const [generatedCommand, setGeneratedCommand] = useState('');

  useEffect(() => {
    let cmd = 'scp';
    const flags: string[] = [];
    if (isRecursive) flags.push('r');
    if (preserve)    flags.push('p');
    if (compress)    flags.push('C');
    if (verbose)     flags.push('v');

    if (flags.length > 0) cmd += ` -${flags.join('')}`;
    if (port)         cmd += ` -P ${port}`;
    if (identityFile) cmd += ` -i ${q(identityFile)}`;

    let prefix = '';
    if (authToken) {
      prefix = `AUTH_TOKEN=${q(authToken)} `;
    }

    cmd = `${prefix}${cmd} ${q(source || '')} ${q(destination || '')}`;
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
          <LabeledInput
            label="Source"
            value={source}
            onChange={setSource}
            placeholder="e.g., local_file.txt"
            description="Local path or remote path (user@host:path)."
          />
          <LabeledInput
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="e.g., user@remote:/home/"
            description="Target path for the copy."
          />
        </div>

        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Authentication &amp; Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LabeledInput
              label="Identity File (SSH Key)"
              value={identityFile}
              onChange={setIdentityFile}
              placeholder="~/.ssh/id_rsa"
              description="Path to your private SSH key file."
            />
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API Key / Auth Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                  placeholder="Paste token here"
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 pr-20 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Added as an environment variable prefix for wrappers.</p>
            </div>
          </div>

          {authToken && (
            <div className="mt-4 flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/40 text-yellow-400 rounded-lg px-4 py-3 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Caution:</strong> Your token appears in the generated command. Avoid saving this to
                command history or sharing the output — treat it like a password.
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-md font-semibold text-gray-300 mb-4">Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <FlagCheckbox namespace="scp" label="Recursive" flag="-r" checked={isRecursive} onChange={setIsRecursive} description="Copy entire directories." />
              <FlagCheckbox namespace="scp" label="Preserve"  flag="-p" checked={preserve}    onChange={setPreserve}    description="Preserve file attributes." />
            </div>
            <div className="space-y-4">
              <FlagCheckbox namespace="scp" label="Compress" flag="-C" checked={compress} onChange={setCompress} description="Speed up transfers with compression." />
              <FlagCheckbox namespace="scp" label="Verbose"  flag="-v" checked={verbose}  onChange={setVerbose}  description="Show debugging output." />
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
