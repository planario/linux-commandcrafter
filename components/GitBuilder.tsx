import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';
import { shellQuote as q } from '../utils/shell';

interface GitBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type Subcommand = 'clone' | 'add' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout';

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

export const GitBuilder: React.FC<GitBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [subcommand, setSubcommand] = useState<Subcommand>('clone');
    const [generatedCommand, setGeneratedCommand] = useState('');

    // State for all subcommands
    const [cloneRepo, setCloneRepo] = useState('https://github.com/user/repo.git');
    const [cloneDir, setCloneDir] = useState('');
    const [addPath, setAddPath] = useState('.');
    const [commitMsg, setCommitMsg] = useState('');
    const [commitAmend, setCommitAmend] = useState(false);
    const [pushRemote, setPushRemote] = useState('origin');
    const [pushBranch, setPushBranch] = useState('main');
    const [pushForce, setPushForce] = useState(false);
    const [pullRemote, setPullRemote] = useState('origin');
    const [pullBranch, setPullBranch] = useState('main');
    const [branchName, setBranchName] = useState('');
    const [checkoutName, setCheckoutName] = useState('main');
    const [checkoutNew, setCheckoutNew] = useState(false);
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        let cmd = `git ${subcommand}`;
        
        let finalCloneRepoUrl = cloneRepo;
        if (apiKey && subcommand === 'clone' && cloneRepo.startsWith('https://')) {
            try {
                // Use URL constructor to safely inject the API key as the username
                const url = new URL(cloneRepo);
                url.username = apiKey;
                finalCloneRepoUrl = url.toString();
            } catch (e) {
                // If URL is invalid, fallback to original
                finalCloneRepoUrl = cloneRepo;
            }
        }
        
        switch (subcommand) {
            case 'clone':
                cmd += ` ${finalCloneRepoUrl || ''}`;
                if (cloneDir) cmd += ` ${q(cloneDir)}`;
                break;
            case 'add':
                cmd += ` ${q(addPath || '.')}`;
                break;
            case 'commit':
                if (commitAmend) cmd += ' --amend';
                if (commitMsg) cmd += ` -m ${q(commitMsg)}`;
                break;
            case 'push':
                if (pushForce) cmd += ' --force';
                cmd += ` ${pushRemote || 'origin'} ${pushBranch || 'main'}`;
                break;
            case 'pull':
                cmd += ` ${pullRemote || 'origin'} ${pullBranch || 'main'}`;
                break;
            case 'branch':
                if (branchName) cmd += ` ${branchName}`;
                break;
            case 'checkout':
                if (checkoutNew) cmd += ' -b';
                if (checkoutName) cmd += ` ${checkoutName}`;
                break;
        }

        setGeneratedCommand(cmd.trim());

    }, [
        subcommand, cloneRepo, cloneDir, addPath, commitMsg, commitAmend,
        pushRemote, pushBranch, pushForce, pullRemote, pullBranch, branchName,
        checkoutName, checkoutNew, apiKey
    ]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'git');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedCommand);
    
    const renderSubcommandOptions = () => {
        switch (subcommand) {
            case 'clone':
                return (
                    <div className="grid md:grid-cols-2 gap-4">
                        <LabeledInput label="Repository URL" value={cloneRepo} onChange={setCloneRepo} description="The full URL of the repository to clone." />
                        <LabeledInput label="Directory (Optional)" value={cloneDir} onChange={setCloneDir} placeholder="my-app" description="The name of the local directory to clone into." />
                    </div>
                );
            case 'add':
                return <LabeledInput label="File / Pathspec" value={addPath} onChange={setAddPath} placeholder="e.g., . or src/" description="Which files to stage. Use `.` for all changes." />;
            case 'commit':
                return (
                    <div className="flex flex-col gap-4">
                        <LabeledInput label="Commit Message" value={commitMsg} onChange={setCommitMsg} placeholder="A brief summary of changes" description="A short, descriptive summary of the changes made." />
                         <div className="flex items-center gap-3">
                            <input type="checkbox" id="amend" checked={commitAmend} onChange={e => setCommitAmend(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <label htmlFor="amend" className="text-sm text-gray-300">Amend previous commit</label>
                        </div>
                    </div>
                );
            case 'push':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <LabeledInput label="Remote" value={pushRemote} onChange={setPushRemote} description="The name of the remote repository (usually 'origin')." />
                            <LabeledInput label="Branch" value={pushBranch} onChange={setPushBranch} description="The name of the branch to push to." />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="force" checked={pushForce} onChange={e => setPushForce(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <label htmlFor="force" className="text-sm text-gray-300">Force push (use with caution)</label>
                        </div>
                    </div>
                );
            case 'pull':
                return (
                     <div className="grid md:grid-cols-2 gap-4">
                        <LabeledInput label="Remote" value={pullRemote} onChange={setPullRemote} description="The name of the remote repository (usually 'origin')." />
                        <LabeledInput label="Branch" value={pullBranch} onChange={setPullBranch} description="The name of the branch to pull from." />
                    </div>
                );
             case 'branch':
                return <LabeledInput label="Branch Name (leave blank to list)" value={branchName} onChange={setBranchName} placeholder="new-feature" description="The name of the new branch. Leave blank to list all branches." />;
             case 'checkout':
                 return (
                    <div className="flex flex-col gap-4">
                        <LabeledInput label="Branch Name" value={checkoutName} onChange={setCheckoutName} description="The branch or commit to switch to." />
                         <div className="flex items-center gap-3">
                            <input type="checkbox" id="new-branch" checked={checkoutNew} onChange={e => setCheckoutNew(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <label htmlFor="new-branch" className="text-sm text-gray-300">Create a new branch (-b)</label>
                        </div>
                    </div>
                 );
            default: return null;
        }
    };
    
    const showApiKeyInput = ['clone'].includes(subcommand);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Git Command Builder</h2>
                <p className="text-gray-400 mt-1">Construct commands for version control with Git.</p>
            </div>
            
            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Subcommand</label>
                    <select value={subcommand} onChange={e => setSubcommand(e.target.value as Subcommand)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                        <option value="clone">clone</option>
                        <option value="add">add</option>
                        <option value="commit">commit</option>
                        <option value="push">push</option>
                        <option value="pull">pull</option>
                        <option value="branch">branch</option>
                        <option value="checkout">checkout</option>
                    </select>
                </div>

                {showApiKeyInput && (
                    <LabeledInput 
                        label="API Key / Token (for private HTTPS repos)" 
                        value={apiKey} 
                        onChange={setApiKey} 
                        placeholder="e.g., ghp_..."
                        description="For private HTTPS repos, provide a Personal Access Token."
                    />
                )}

                {renderSubcommandOptions()}
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'git')}
            />
        </div>
    );
};
