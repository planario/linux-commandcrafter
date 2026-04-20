import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface IpBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type Mode = 'addr' | 'link' | 'route';

const LabeledInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; description?: string; }> = 
({ label, value, onChange, placeholder, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
        />
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

export const IpBuilder: React.FC<IpBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [mode, setMode] = useState<Mode>('addr');
    const [subcommand, setSubcommand] = useState<string>('show');
    const [generatedCommand, setGeneratedCommand] = useState('');

    // State
    const [device, setDevice] = useState('eth0');
    const [address, setAddress] = useState('192.168.1.100/24');
    const [linkState, setLinkState] = useState('up');
    const [gateway, setGateway] = useState('192.168.1.1');
    const [routeDest, setRouteDest] = useState('default');
    
    useEffect(() => {
        let cmd = `ip ${mode}`;
        switch (mode) {
            case 'addr':
                cmd += ` ${subcommand}`;
                if (subcommand === 'add' || subcommand === 'del') {
                    cmd += ` ${address || ''} dev ${device || ''}`;
                } else if (subcommand === 'show' && device) {
                    cmd += ` dev ${device}`;
                }
                break;
            case 'link':
                cmd += ` ${subcommand}`;
                if (subcommand === 'set') {
                    cmd += ` dev ${device || ''} ${linkState}`;
                } else if (subcommand === 'show' && device) {
                    cmd += ` dev ${device}`;
                }
                break;
            case 'route':
                cmd += ` ${subcommand}`;
                if (subcommand === 'add') {
                     cmd += ` ${routeDest || 'default'} via ${gateway || ''}`;
                     if (device) cmd += ` dev ${device}`;
                } else if (subcommand === 'del') {
                    cmd += ` ${routeDest || ''}`;
                }
                break;
        }
        setGeneratedCommand(cmd.replace(/\s+/g, ' ').trim());
    }, [mode, subcommand, device, address, linkState, gateway, routeDest]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'ip');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        setDevice('');
        // Set default subcommand for new mode
        if (newMode === 'addr') setSubcommand('show');
        if (newMode === 'link') setSubcommand('show');
        if (newMode === 'route') setSubcommand('show');
    };

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);
    
    const renderOptions = () => {
        switch (mode) {
            case 'addr':
                return (
                    <>
                        <select value={subcommand} onChange={e => setSubcommand(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="show">show</option>
                            <option value="add">add</option>
                            <option value="del">del</option>
                        </select>
                        {(subcommand === 'add' || subcommand === 'del') && 
                            <LabeledInput label="Address (CIDR format)" value={address} onChange={setAddress} placeholder="e.g., 192.168.1.100/24" description="The IP address and subnet mask, e.g., `192.168.1.100/24`." />
                        }
                        <LabeledInput label="Device (optional for show)" value={device} onChange={setDevice} placeholder="e.g., eth0" description="The target network interface, e.g., `eth0`." />
                    </>
                );
            case 'link':
                 return (
                    <>
                        <select value={subcommand} onChange={e => setSubcommand(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="show">show</option>
                            <option value="set">set</option>
                        </select>
                        <LabeledInput label="Device" value={device} onChange={setDevice} placeholder="e.g., eth0" description="The target network interface, e.g., `eth0`." />
                        {subcommand === 'set' && (
                            <select value={linkState} onChange={e => setLinkState(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                                <option value="up">up</option>
                                <option value="down">down</option>
                            </select>
                        )}
                    </>
                 );
            case 'route':
                return (
                     <>
                        <select value={subcommand} onChange={e => setSubcommand(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="show">show</option>
                            <option value="add">add</option>
                            <option value="del">del</option>
                        </select>
                        {(subcommand === 'add' || subcommand === 'del') && 
                            <LabeledInput label="Destination" value={routeDest} onChange={setRouteDest} placeholder="e.g., default or 10.0.0.0/8" description="The destination network or host. Use `default` for the default route." />
                        }
                        {subcommand === 'add' &&
                            <LabeledInput label="Gateway" value={gateway} onChange={setGateway} placeholder="e.g., 192.168.1.1" description="The IP address of the gateway router." />
                        }
                        {subcommand === 'add' &&
                             <LabeledInput label="Device (optional)" value={device} onChange={setDevice} placeholder="e.g., eth0" description="The target network interface, e.g., `eth0`." />
                        }
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">IP Command Builder</h2>
                <p className="text-gray-400 mt-1">Manage network addresses, interfaces, and routes.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Object to Manage</label>
                    <select value={mode} onChange={e => handleModeChange(e.target.value as Mode)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                        <option value="addr">Address</option>
                        <option value="link">Link (Interface)</option>
                        <option value="route">Route</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderOptions()}
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'ip')}
            />
        </div>
    );
};
