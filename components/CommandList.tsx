import React, { useState } from 'react';
import { CommandEntry } from '../types';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const StarIcon: React.FC<{isFavorite: boolean}> = ({ isFavorite }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
        className={isFavorite ? 'text-yellow-400' : 'text-gray-500'}/>
    </svg>
);

interface CommandListProps {
    items: CommandEntry[];
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

const CommandItem: React.FC<{
    item: CommandEntry, 
    isFavorite: boolean, 
    onToggleFavorite: (command: string, type: string) => void
}> = ({ item, isFavorite, onToggleFavorite }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-teal-800 text-teal-200 text-xs font-bold rounded">{item.type}</span>
                    <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <code className="block bg-gray-800 p-3 rounded-md text-teal-300 text-sm break-all select-all font-mono">{item.command}</code>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                    onClick={() => onToggleFavorite(item.command, item.type)}
                    className="p-2 rounded-md transition-colors duration-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <StarIcon isFavorite={isFavorite} />
                </button>
                <button
                    onClick={handleCopy}
                    className={`p-2 rounded-md flex items-center transition-colors duration-200 ${
                        copied ? 'bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    title="Copy command"
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
            </div>
        </div>
    );
};

export const CommandList: React.FC<CommandListProps> = ({ items, favorites, onToggleFavorite }) => {
    const favoriteCommands = new Set(favorites.map(f => f.command));

    return (
        <div className="flex flex-col gap-4">
            {items.map(item => (
                <CommandItem 
                    key={item.id}
                    item={item}
                    isFavorite={favoriteCommands.has(item.command)}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
        </div>
    );
};
