import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface LxcBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

const LabeledInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string; description?: string }> = 
({ label, value, onChange, placeholder, type = 'text', description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
        />
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);


export const LxcBuilder: React.FC<LxcBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const defaultState = {
        image: 'ubuntu:22.04',
        containerName: 'my-container',
        cores: '',
        ram: '',
        storage: '',
    };
    
    const [image, setImage] = useState(defaultState.image);
    const [containerName, setContainerName] = useState(defaultState.containerName);
    const [cores, setCores] = useState(defaultState.cores);
    const [ram, setRam] = useState(defaultState.ram);
    const [storage, setStorage] = useState(defaultState.storage);
    const [generatedCommand, setGeneratedCommand] = useState('');
    
    const resetAllFields = () => {
        setImage(defaultState.image);
        setContainerName(defaultState.containerName);
        setCores(defaultState.cores);
        setRam(defaultState.ram);
        setStorage(defaultState.storage);
    };

    useEffect(() => {
        let cmd = 'lxc launch';
        cmd += ` ${image || 'ubuntu:22.04'}`;
        cmd += ` ${containerName || 'my-container'}`;

        if (cores) {
            cmd += ` -c limits.cpu=${cores}`;
        }
        if (ram) {
            cmd += ` -c limits.memory=${ram}MB`;
        }
        if (storage) {
            cmd += ` --device root,size=${storage}GB`;
        }
        
        setGeneratedCommand(cmd.trim());

    }, [image, containerName, cores, ram, storage]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'lxc');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-teal-400">LXC Container Builder</h2>
                    <p className="text-gray-400 mt-1">Create and launch customized system containers.</p>
                </div>
                 <button onClick={resetAllFields} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm">Clear All</button>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <h3 className="text-lg font-semibold text-gray-200">Basic Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput 
                        label="Image"
                        value={image}
                        onChange={setImage}
                        placeholder="e.g., ubuntu:22.04"
                        description="The name of the image to use, e.g., `ubuntu:22.04` or `images:alpine/3.16`."
                    />
                     <LabeledInput 
                        label="Container Name"
                        value={containerName}
                        onChange={setContainerName}
                        placeholder="e.g., web-server"
                        description="A unique name for your new container."
                    />
                </div>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <h3 className="text-lg font-semibold text-gray-200">Resource Limits (Optional)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledInput 
                        label="CPU Cores"
                        value={cores}
                        onChange={setCores}
                        placeholder="e.g., 2"
                        type="number"
                        description="Number of CPU cores to allocate."
                    />
                    <LabeledInput 
                        label="RAM (MB)"
                        value={ram}
                        onChange={setRam}
                        placeholder="e.g., 1024"
                        type="number"
                        description="Memory in Megabytes."
                    />
                    <LabeledInput 
                        label="Storage (GB)"
                        value={storage}
                        onChange={setStorage}
                        placeholder="e.g., 10"
                        type="number"
                        description="Root disk size in Gigabytes."
                    />
                 </div>
            </div>
            
            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'lxc')}
            />
        </div>
    );
};
