import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

const CronInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; description: string; }> = ({ label, value, onChange, placeholder, description }) => (
    <div className="flex-1 min-w-[80px]">
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
        />
        <p className="text-xs text-center mt-1 text-gray-500">{description}</p>
    </div>
);


interface CronBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

export const CronBuilder: React.FC<CronBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const defaultState = {
        minute: '*',
        hour: '*',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*',
        command: '/path/to/command',
    };

    const [minute, setMinute] = useState(defaultState.minute);
    const [hour, setHour] = useState(defaultState.hour);
    const [dayOfMonth, setDayOfMonth] = useState(defaultState.dayOfMonth);
    const [month, setMonth] = useState(defaultState.month);
    const [dayOfWeek, setDayOfWeek] = useState(defaultState.dayOfWeek);
    const [command, setCommand] = useState(defaultState.command);
    const [generatedCron, setGeneratedCron] = useState('');
    
    const resetAllFields = () => {
        setMinute(defaultState.minute);
        setHour(defaultState.hour);
        setDayOfMonth(defaultState.dayOfMonth);
        setMonth(defaultState.month);
        setDayOfWeek(defaultState.dayOfWeek);
        setCommand(defaultState.command);
    };

    useEffect(() => {
        const cronString = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek} ${command}`;
        setGeneratedCron(cronString);
    }, [minute, hour, dayOfMonth, month, dayOfWeek, command]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCron, 'crontab');
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [generatedCron, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCron);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-400">Crontab Generator</h2>
                        <p className="text-gray-400 mt-1">Create a schedule for your automated tasks.</p>
                    </div>
                     <button 
                        onClick={resetAllFields}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex flex-wrap items-start gap-4">
                    <CronInput label="Minute" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="*" description="(0-59)" />
                    <CronInput label="Hour" value={hour} onChange={(e) => setHour(e.target.value)} placeholder="*" description="(0-23)" />
                    <CronInput label="Day of Month" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="*" description="(1-31)" />
                    <CronInput label="Month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="*" description="(1-12)" />
                    <CronInput label="Day of Week" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} placeholder="*" description="(0-7)" />
                </div>
                 <p className="text-xs text-center mt-3 text-gray-500">Use '*' for any value, '*/n' for every n, or a comma-separated list '1,2,3'.</p>
            </div>
            
            <div>
                <label htmlFor="cron-command" className="block text-sm font-medium text-gray-300 mb-2">
                    Command to Execute
                </label>
                <input
                    type="text"
                    id="cron-command"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="/path/to/your/script.sh"
                    className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition font-mono"
                />
            </div>
            
            <GeneratedCommand 
                command={generatedCron} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCron, 'crontab')}
            />
        </div>
    );
};