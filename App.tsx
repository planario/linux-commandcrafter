import React, { useState, useCallback } from 'react';
import { COMMANDS } from './constants';
import { TUTORIALS } from './tutorials';
import { CommandBuilder } from './components/CommandBuilder';
import { CronBuilder } from './components/CronBuilder';
import { UfwBuilder } from './components/UfwBuilder';
import { FfmpegBuilder } from './components/FfmpegBuilder';
import { AnsibleBuilder } from './components/AnsibleBuilder';
import { GitBuilder } from './components/GitBuilder';
import { SedBuilder } from './components/SedBuilder';
import { LxcBuilder } from './components/LxcBuilder';
import { IpBuilder } from './components/IpBuilder';
import { GrepBuilder } from './components/GrepBuilder';
import { FindBuilder } from './components/FindBuilder';
import { ChmodBuilder } from './components/ChmodBuilder';
import { BashBuilder } from './components/BashBuilder';
import { ScpBuilder } from './components/ScpBuilder';
import { RsyncBuilder } from './components/RsyncBuilder';
import { SshBuilder } from './components/SshBuilder';
import { TabButton } from './components/TabButton';
import { Aliases } from './components/Aliases';
import { Tutorials } from './components/Tutorials';
import { History } from './components/History';
import { Favorites } from './components/Favorites';
import { CommandAnalyzer } from './components/CommandAnalyzer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Alias, CommandEntry } from './types';

type MainView = 'builders' | 'analyze' | 'aliases' | 'tutorials' | 'history' | 'favorites' | 'ssh';

const BuildersView: React.FC<{
  onCommandGenerated: (command: string, type: string) => void;
  favorites: CommandEntry[];
  onToggleFavorite: (command: string, type: string) => void;
}> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
  const [activeBuilderTab, setActiveBuilderTab] = useState<string>('mv');
  
  const commandTabs = COMMANDS.map(cmd => cmd.name);
  const allBuilderTabs = [...commandTabs, 'ufw', 'crontab', 'ffmpeg', 'ansible-playbook', 'git', 'sed', 'lxc', 'ip', 'grep', 'find', 'chmod', 'bash', 'scp', 'rsync'].sort();
  const activeCommand = COMMANDS.find(cmd => cmd.name === activeBuilderTab);

  const renderContent = () => {
    if (activeBuilderTab === 'crontab') {
      return <CronBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'ufw') {
      return <UfwBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'ffmpeg') {
      return <FfmpegBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'ansible-playbook') {
      return <AnsibleBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'git') {
      return <GitBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'sed') {
      return <SedBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'lxc') {
      return <LxcBuilder 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />;
    }
    if (activeBuilderTab === 'ip') {
        return <IpBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'grep') {
        return <GrepBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'find') {
        return <FindBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'chmod') {
        return <ChmodBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'bash') {
        return <BashBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'scp') {
        return <ScpBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeBuilderTab === 'rsync') {
        return <RsyncBuilder 
            onCommandGenerated={onCommandGenerated}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
        />;
    }
    if (activeCommand) {
      return <CommandBuilder 
        command={activeCommand} 
        onCommandGenerated={onCommandGenerated}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
       />;
    }
    return null;
  };
  
  return (
    <>
      <div className="border-b border-gray-700 p-2">
        <nav className="flex flex-wrap -mb-px" aria-label="Tabs">
          {allBuilderTabs.map(tabName => (
            <TabButton
              key={tabName}
              isActive={activeBuilderTab === tabName}
              onClick={() => setActiveBuilderTab(tabName)}
            >
              {tabName}
            </TabButton>
          ))}
        </nav>
      </div>
      <div className="p-6 sm:p-8">
        {renderContent()}
      </div>
    </>
  );
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<MainView>('builders');
  const [history, setHistory] = useLocalStorage<CommandEntry[]>('commandHistory', []);
  const [favorites, setFavorites] = useLocalStorage<CommandEntry[]>('commandFavorites', []);
  const [aliases, setAliases] = useLocalStorage<Alias[]>('commandAliases', []);
  
  const addCommandToHistory = useCallback((command: string, type: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;
    
    // Avoid adding empty base commands
    const base = COMMANDS.find(c => c.name === type)?.baseCommand || type;
    if (trimmedCommand === base) return;


    setHistory(prevHistory => {
        if (prevHistory.length > 0 && prevHistory[0].command === trimmedCommand) {
            return prevHistory;
        }
        const newEntry: CommandEntry = {
            id: crypto.randomUUID(),
            command: trimmedCommand,
            type,
            timestamp: Date.now(),
        };
        return [newEntry, ...prevHistory].slice(0, 50);
    });
  }, [setHistory]);

  const toggleFavorite = useCallback((command: string, type: string) => {
    setFavorites(prev => {
        const existing = prev.find(fav => fav.command === command);
        if (existing) {
            return prev.filter(fav => fav.command !== command);
        } else {
            const newFavorite: CommandEntry = {
                id: crypto.randomUUID(),
                command,
                type,
                timestamp: Date.now()
            };
            return [newFavorite, ...prev];
        }
    });
  }, [setFavorites]);
  
  const mainViews: { id: MainView; label: string }[] = [
      { id: 'builders', label: 'Builders' },
      { id: 'analyze', label: 'Analyze' },
      { id: 'ssh', label: 'SSH' },
      { id: 'aliases', label: 'Aliases' },
      { id: 'tutorials', label: 'Tutorials' },
      { id: 'history', label: 'History' },
      { id: 'favorites', label: 'Favorites' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-teal-400 tracking-wider">
            Linux Command<span className="text-white">Crafter</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Visually build, learn, and manage your Linux commands.
          </p>
        </header>

        <nav className="flex justify-center space-x-2 sm:space-x-4 mb-6" aria-label="Main navigation">
          {mainViews.map(view => (
              <button 
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 ${
                    activeView === view.id
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                  {view.label}
              </button>
          ))}
        </nav>

        <main className="bg-gray-800 rounded-xl shadow-2xl shadow-teal-500/10">
            {activeView === 'builders' && (
                <BuildersView 
                  onCommandGenerated={addCommandToHistory}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
            )}
            {activeView === 'analyze' && <CommandAnalyzer />}
            {activeView === 'ssh' && (
                <SshBuilder 
                    onCommandGenerated={addCommandToHistory}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />
            )}
            {activeView === 'aliases' && <Aliases aliases={aliases} setAliases={setAliases} />}
            {activeView === 'tutorials' && <Tutorials tutorials={TUTORIALS} />}
            {activeView === 'history' && (
              <History 
                history={history} 
                setHistory={setHistory} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {activeView === 'favorites' && (
              <Favorites 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Built with React & Tailwind CSS for modern command-line mastery.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;