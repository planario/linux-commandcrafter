import React, { useState } from 'react';
import { Tutorial } from '../types';

interface TutorialsProps {
    tutorials: Tutorial[];
}

const TutorialCard: React.FC<{ tutorial: Tutorial, isOpen: boolean, onToggle: () => void }> = ({ tutorial, isOpen, onToggle }) => {
    return (
        <div className="bg-gray-900/50 rounded-lg overflow-hidden">
            <button onClick={onToggle} className="w-full text-left p-4 flex justify-between items-center bg-gray-700 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500">
                <h3 className="text-lg font-bold text-teal-400">{tutorial.title}</h3>
                <svg className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 space-y-4">
                    {tutorial.content.map((item, index) => {
                        if (item.type === 'heading') {
                            return <h4 key={index} className="text-md font-semibold text-gray-200 pt-2 border-b border-gray-700 pb-1">{item.text}</h4>;
                        }
                        if (item.type === 'paragraph') {
                            return <p key={index} className="text-gray-400 leading-relaxed">{item.text}</p>;
                        }
                        if (item.type === 'code') {
                            return <pre key={index} className="overflow-x-auto"><code className="block bg-gray-800 p-3 rounded-md text-teal-300 text-sm select-all font-mono whitespace-pre">{item.text}</code></pre>;
                        }
                        if (item.type === 'tip') {
                            return (
                                <div key={index} className="flex gap-3 bg-teal-900/30 border border-teal-700/50 rounded-md p-3">
                                    <span className="text-teal-400 font-bold text-sm shrink-0">TIP</span>
                                    <p className="text-teal-200 text-sm leading-relaxed">{item.text}</p>
                                </div>
                            );
                        }
                        if (item.type === 'warning') {
                            return (
                                <div key={index} className="flex gap-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3">
                                    <span className="text-yellow-400 font-bold text-sm shrink-0">WARN</span>
                                    <p className="text-yellow-200 text-sm leading-relaxed">{item.text}</p>
                                </div>
                            );
                        }
                        if (item.type === 'note') {
                            return (
                                <div key={index} className="flex gap-3 bg-blue-900/30 border border-blue-700/50 rounded-md p-3">
                                    <span className="text-blue-400 font-bold text-sm shrink-0">NOTE</span>
                                    <p className="text-blue-200 text-sm leading-relaxed">{item.text}</p>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export const Tutorials: React.FC<TutorialsProps> = ({ tutorials }) => {
    const [openTutorial, setOpenTutorial] = useState<string | null>(tutorials[0]?.name || null);

    const handleToggle = (name: string) => {
        setOpenTutorial(prev => prev === name ? null : name);
    };

    return (
        <div className="p-6 sm:p-8 flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Command Tutorials</h2>
                <p className="text-gray-400 mt-1">Step-by-step guides for common Linux commands.</p>
            </div>
            <div className="flex flex-col gap-4">
                {tutorials.map(tutorial => (
                    <TutorialCard 
                        key={tutorial.name} 
                        tutorial={tutorial} 
                        isOpen={openTutorial === tutorial.name} 
                        onToggle={() => handleToggle(tutorial.name)} 
                    />
                ))}
            </div>
        </div>
    );
};
