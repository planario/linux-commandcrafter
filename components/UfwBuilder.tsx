import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface UfwBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type Action = 'allow' | 'deny' | 'reject' | 'limit';
type Direction = 'in' | 'out';
type Proto = 'tcp' | 'udp';

const ToggleButton: React.FC<{
    options: { value: string; label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    label: string;
}> = ({ options, selectedValue, onSelect, label }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <div className="flex items-center bg-gray-900 rounded-lg p-1">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onSelect(opt.value)}
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:z-10 focus:ring-2 focus:ring-teal-500 ${selectedValue === opt.value ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const CommonPortsInfo: React.FC = () => (
    <div className="bg-gray-900/50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-300 mb-3 text-sm">Common Ports & Services</h4>
        <ul className="text-xs text-gray-400 space-y-1">
            <li><span className="font-mono text-teal-400">22/tcp</span> - SSH (Secure Shell)</li>
            <li><span className="font-mono text-teal-400">80/tcp</span> - HTTP (Web Server)</li>
            <li><span className="font-mono text-teal-400">443/tcp</span> - HTTPS (Secure Web Server)</li>
            <li><span className="font-mono text-teal-400">25/tcp</span> - SMTP (Email)</li>
            <li><span className="font-mono text-teal-400">53/udp</span> - DNS</li>
        </ul>
        <a 
            href="https://www.yougetsignal.com/tools/open-ports/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-teal-500 hover:text-teal-400 mt-3 inline-block"
        >
            Check if a port is open &rarr;
        </a>
    </div>
);

export const UfwBuilder: React.FC<UfwBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [generatedCommand, setGeneratedCommand] = useState('ufw status');
    
    // Rule state
    const [action, setAction] = useState<Action>('allow');
    const [direction, setDirection] = useState<Direction | 'none'>('in');
    const [protocol, setProtocol] = useState<Proto | 'none'>('tcp');
    const [port, setPort] = useState('22');
    const [fromIp, setFromIp] = useState('');
    const [toIp, setToIp] = useState('');

    useEffect(() => {
        let rule = `ufw ${action}`;
        if (direction !== 'none') rule += ` ${direction}`;
        if (fromIp) rule += ` from ${fromIp}`;
        if (toIp) rule += ` to ${toIp}`;
        if (port) {
            rule += ` port ${port}`;
            if (protocol !== 'none') rule += ` proto ${protocol}`;
        }
        setGeneratedCommand(rule);
    }, [action, direction, protocol, port, fromIp, toIp]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'ufw');
        }, 500);

        return () => { clearTimeout(handler); };
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    const quickActions = ['ufw status', 'ufw enable', 'ufw disable', 'ufw default deny incoming', 'ufw default allow outgoing'];

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">UFW Manager</h2>
                <p className="text-gray-400 mt-1">Visually manage rules for the Uncomplicated Firewall.</p>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <h3 className="text-lg font-semibold text-gray-200">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    {quickActions.map(cmd => (
                        <button key={cmd} onClick={() => setGeneratedCommand(cmd)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm">{cmd}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                    <h3 className="text-lg font-semibold text-gray-200">Build a Rule</h3>
                    <ToggleButton 
                        label="Action"
                        options={[
                            {value: 'allow', label: 'Allow'}, 
                            {value: 'deny', label: 'Deny'},
                            {value: 'reject', label: 'Reject'},
                            {value: 'limit', label: 'Limit'},
                        ]}
                        selectedValue={action}
                        onSelect={(val) => setAction(val as Action)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ToggleButton 
                            label="Direction"
                            options={[{value: 'in', label: 'In'}, {value: 'out', label: 'Out'}, {value: 'none', label: 'Any'}]}
                            selectedValue={direction}
                            onSelect={(val) => setDirection(val as Direction)}
                        />
                        <ToggleButton 
                            label="Protocol"
                            options={[{value: 'tcp', label: 'TCP'}, {value: 'udp', label: 'UDP'}, {value: 'none', label: 'Any'}]}
                            selectedValue={protocol}
                            onSelect={(val) => setProtocol(val as Proto)}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Port / Service</label>
                            <input value={port} onChange={e => setPort(e.target.value)} placeholder="e.g., 22 or http" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                            <p className="text-xs text-gray-500 mt-1">Specify a port number or a service name from /etc/services.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">From IP (optional)</label>
                            <input value={fromIp} onChange={e => setFromIp(e.target.value)} placeholder="any or 192.168.1.100" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                            <p className="text-xs text-gray-500 mt-1">Source address for the rule (e.g., a specific IP or subnet).</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">To IP (optional)</label>
                            <input value={toIp} onChange={e => setToIp(e.target.value)} placeholder="any" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                            <p className="text-xs text-gray-500 mt-1">Destination address for the rule (usually 'any').</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <CommonPortsInfo />
                </div>
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'ufw')}
            />
        </div>
    );
};
