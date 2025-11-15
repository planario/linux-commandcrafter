import React from 'react';
import { CommandEntry } from '../types';
import { CommandList } from './CommandList';

interface HistoryProps {
    history: CommandEntry[];
    setHistory: React.Dispatch<React.SetStateAction<CommandEntry[]>>;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

export const History: React.FC<HistoryProps> = ({ history, setHistory, favorites, onToggleFavorite }) => {
    
    const handleClear = () => {
        if(window.confirm('Are you sure you want to clear your entire command history? This cannot be undone.')) {
            setHistory([]);
        }
    };
    
    return (
        <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-teal-400">Command History</h2>
                    <p className="text-gray-400 mt-1">Your 50 most recently generated commands.</p>
                </div>
                {history.length > 0 && (
                     <button onClick={handleClear} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors text-sm">Clear History</button>
                )}
            </div>
            
            {history.length === 0 ? (
                <p className="text-center text-gray-500 py-16">Your command history is empty. Generate a command to see it here.</p>
            ) : (
                <CommandList 
                    items={history}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                />
            )}
        </div>
    );
};
