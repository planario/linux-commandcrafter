import React from 'react';
import { CommandEntry } from '../types';
import { CommandList } from './CommandList';

interface FavoritesProps {
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ favorites, onToggleFavorite }) => {
    return (
        <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Favorite Commands</h2>
                <p className="text-gray-400 mt-1">Your hand-picked collection of useful commands.</p>
            </div>

            {favorites.length === 0 ? (
                 <p className="text-center text-gray-500 py-16">You have no favorite commands. Click the star icon on a command to save it here.</p>
            ) : (
                <CommandList 
                    items={favorites}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                />
            )}
        </div>
    );
};
