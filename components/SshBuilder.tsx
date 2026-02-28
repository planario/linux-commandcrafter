import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface SshBuilderProps {
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

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-700 hover:border-teal-500/20 transition-all flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-200 border-b border-gray-600 pb-2">{title}</h3>
        {children}
    </div>
);

export const SshBuilder: React.FC<SshBuilderProps> = ({ favorites, onToggleFavorite }) => {
  // Key Gen State
  const [keyFilename, setKeyFilename] = useState('id_rsa_server');
  const [keyComment, setKeyComment] = useState('user@email.com');
  
  // Authorized Keys State
  const [remoteUser, setRemoteUser] = useState('root');
  const [remoteHost, setRemoteHost] = useState('your-server-ip');
  const [publicKeyPath, setPublicKeyPath] = useState('~/.ssh/id_rsa.pub');
  
  // Password Login State
  const [allowPassword, setAllowPassword] = useState(false);

  const isFavorite = (cmd: string) => favorites.some(fav => fav.command === cmd);

  // Command Generation Logic
  const keyGenCmd = `ssh-keygen -t rsa -b 4096 -f ~/.ssh/${keyFilename} -C "${keyComment}"`;
  const copyIdCmd = `ssh-copy-id -i ${publicKeyPath} ${remoteUser}@${remoteHost}`;
  const manualCopyCmd = `cat ${publicKeyPath} | ssh ${remoteUser}@${remoteHost} "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`;
  
  const pwAuthValue = allowPassword ? 'yes' : 'no';
  const togglePwCmd = `sudo sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication ${pwAuthValue}/' /etc/ssh/sshd_config && sudo systemctl restart ssh`;

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-10">
      <header>
        <h2 className="text-2xl font-bold text-teal-400">SSH Manager</h2>
        <p className="text-gray-400 mt-1">Tools for key generation, distribution, and server hardening.</p>
      </header>

      {/* 1. Generate RSA Key Pair */}
      <SectionCard title="1. Generate Secure RSA Key Pair">
        <p className="text-sm text-gray-400">Create a 4096-bit RSA key pair for cryptographic authentication.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput 
                label="Filename" 
                value={keyFilename} 
                onChange={setKeyFilename} 
                placeholder="id_rsa_server" 
                description="The key will be saved to ~/.ssh/[filename]"
            />
            <LabeledInput 
                label="Comment / Email" 
                value={keyComment} 
                onChange={setKeyComment} 
                placeholder="user@example.com" 
                description="Useful for identifying which key belongs to whom."
            />
        </div>
        <GeneratedCommand 
            command={keyGenCmd} 
            isFavorite={isFavorite(keyGenCmd)}
            onToggleFavorite={() => onToggleFavorite(keyGenCmd, 'ssh')}
        />
      </SectionCard>

      {/* 2. Populate Server Keys */}
      <SectionCard title="2. Authorize Public Key on Remote Server">
        <p className="text-sm text-gray-400">Add your local public key to the server's <span className="font-mono text-teal-500">authorized_keys</span> file.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput label="Remote User" value={remoteUser} onChange={setRemoteUser} placeholder="root" />
            <LabeledInput label="Remote Host" value={remoteHost} onChange={setRemoteHost} placeholder="1.2.3.4" />
            <LabeledInput label="Local Public Key" value={publicKeyPath} onChange={setPublicKeyPath} placeholder="~/.ssh/id_rsa.pub" />
        </div>
        <div className="flex flex-col gap-6">
            <div className="mt-2">
                <span className="text-xs uppercase font-bold text-gray-500 tracking-widest">Recommended (using ssh-copy-id)</span>
                <GeneratedCommand 
                    command={copyIdCmd} 
                    isFavorite={isFavorite(copyIdCmd)}
                    onToggleFavorite={() => onToggleFavorite(copyIdCmd, 'ssh')}
                />
            </div>
            <div>
                 <span className="text-xs uppercase font-bold text-gray-500 tracking-widest">Manual Piping (Fall-back)</span>
                 <GeneratedCommand 
                    command={manualCopyCmd} 
                    isFavorite={isFavorite(manualCopyCmd)}
                    onToggleFavorite={() => onToggleFavorite(manualCopyCmd, 'ssh')}
                />
            </div>
        </div>
      </SectionCard>

      {/* 3. Password Login Toggling */}
      <SectionCard title="3. Server Hardening: Password Login">
        <p className="text-sm text-gray-400">Manage whether the server allows password authentication. Disabling it forces key-based login.</p>
        
        <div className="flex items-center gap-4 bg-gray-900/40 p-4 rounded-lg border border-gray-600/30">
            <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={allowPassword}
                        onChange={e => setAllowPassword(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300">
                        {allowPassword ? 'Allow Password Authentication' : 'Disable Password Authentication'}
                    </span>
                </label>
            </div>
            <div className="ml-auto">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${allowPassword ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'}`}>
                    {allowPassword ? 'Lower Security' : 'Higher Security'}
                </span>
            </div>
        </div>

        <GeneratedCommand 
            command={togglePwCmd} 
            isFavorite={isFavorite(togglePwCmd)}
            onToggleFavorite={() => onToggleFavorite(togglePwCmd, 'ssh')}
        />
        <p className="text-xs text-gray-500 mt-1 italic">
            This command uses <span className="font-mono">sed</span> to modify <span className="font-mono">/etc/ssh/sshd_config</span> and restarts the <span className="font-mono">ssh</span> service. Ensure you have key-based access before disabling passwords!
        </p>
      </SectionCard>
    </div>
  );
};