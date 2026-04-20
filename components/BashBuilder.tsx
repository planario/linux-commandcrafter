import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface BashBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

// --- TYPE DEFINITIONS ---
type BlockType = 'shebang' | 'comment' | 'variable' | 'echo' | 'read' | 'command' | 'if' | 'for';

interface ScriptBlock {
    id: string;
    type: BlockType;
    data: any;
}

const initialShebangBlock: ScriptBlock = {
    id: crypto.randomUUID(),
    type: 'shebang',
    data: { interpreter: '/bin/bash' },
};

// --- HELPER ICONS ---
const Icons = {
    Up: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L10 9.414l2.293 2.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>,
    Down: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-5.707a1 1 0 001.414 1.414l3-3a1 1 0 00-1.414-1.414L10 10.586 7.707 8.293a1 1 0 00-1.414 1.414l3 3z" clipRule="evenodd" /></svg>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    Add: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
};


// --- UTILITY COMPONENTS ---
const BlockInput: React.FC<{ value: string; onChange: (val: string) => void; placeholder?: string; mono?: boolean; description?: string; }> =
({ value, onChange, placeholder, mono = false, description }) => (
    <div className="flex-1">
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:ring-teal-500 focus:border-teal-500 text-sm ${mono ? 'font-mono' : ''}`}
        />
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const BlockControls: React.FC<{ onRemove: () => void; onMove: (dir: 'up' | 'down') => void; isFirst?: boolean; isLast?: boolean; }> =
({ onRemove, onMove, isFirst, isLast }) => (
    <div className="absolute top-2 right-2 flex gap-1">
        <button onClick={() => onMove('up')} disabled={isFirst} className="p-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"><Icons.Up /></button>
        <button onClick={() => onMove('down')} disabled={isLast} className="p-1 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"><Icons.Down /></button>
        <button onClick={onRemove} className="p-1 text-gray-400 hover:text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"><Icons.Trash /></button>
    </div>
);


// --- BLOCK COMPONENTS ---
const BlockWrapper: React.FC<{ type: string; children: React.ReactNode; controls: React.ReactNode }> = ({ type, children, controls }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-teal-600 relative">
        <span className="absolute -top-2 left-3 text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">{type}</span>
        {controls}
        <div className="mt-4">{children}</div>
    </div>
);


const BlockRenderer: React.FC<{
    block: ScriptBlock;
    path: number[];
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (path: number[], data: any) => void;
    onRemove: (path: number[]) => void;
    onMove: (path: number[], dir: 'up' | 'down') => void;
    onAddBlock: (path: number[], type: BlockType) => void;
}> = ({ block, path, isFirst, isLast, onUpdate, onRemove, onMove, onAddBlock }) => {
    
    const controls = <BlockControls onRemove={() => onRemove(path)} onMove={(dir) => onMove(path, dir)} isFirst={isFirst} isLast={isLast}/>;

    const renderContent = () => {
        switch (block.type) {
            case 'shebang': return <BlockInput value={block.data.interpreter} onChange={val => onUpdate(path, { ...block.data, interpreter: val })} mono description="The interpreter to execute the script." />;
            case 'comment': return <BlockInput value={block.data.text} onChange={val => onUpdate(path, { ...block.data, text: val })} placeholder="Your comment here" description="A note that will be ignored by the interpreter." />;
            case 'variable': return <div className="flex items-start gap-2"><BlockInput value={block.data.name} onChange={val => onUpdate(path, {...block.data, name: val})} placeholder="VAR_NAME" mono description="The variable's name (e.g., `COUNT`)." /> <span className="text-gray-400 pt-1">=</span> <BlockInput value={block.data.value} onChange={val => onUpdate(path, {...block.data, value: val})} placeholder='"some value"' mono description='The value to assign (e.g., `10` or `"text"`).' /></div>;
            case 'echo': return <BlockInput value={block.data.text} onChange={val => onUpdate(path, { ...block.data, text: val })} placeholder='"Hello, World!"' mono description="Text or variables to print to the console." />;
            case 'read': return <div className="flex items-start gap-2"><BlockInput value={block.data.prompt} onChange={val => onUpdate(path, {...block.data, prompt: val})} placeholder="Enter your name: " mono description="The message displayed to the user." /> <span className="text-gray-400 pt-1">Store in &rarr;</span> <BlockInput value={block.data.variable} onChange={val => onUpdate(path, {...block.data, variable: val})} placeholder="NAME" mono description="The variable to store the user's input." /></div>;
            case 'command': return <BlockInput value={block.data.command} onChange={val => onUpdate(path, { ...block.data, command: val })} placeholder="ls -la" mono description="Any valid shell command." />;
            case 'if':
            case 'for':
                return (
                    <div className="flex flex-col gap-4">
                        {block.type === 'if' && <div className="flex items-start gap-2"><span className="font-mono text-gray-400 pt-1">if</span><BlockInput value={block.data.condition} onChange={val => onUpdate(path, {...block.data, condition: val})} placeholder='[ "$VAR" == "val" ]' mono description='A condition to test (e.g., `[ -f "file.txt" ]`).' /></div>}
                        {block.type === 'for' && <div className="flex items-start gap-2"><span className="font-mono text-gray-400 pt-1">for</span><BlockInput value={block.data.variable} onChange={val => onUpdate(path, {...block.data, variable: val})} placeholder="item" mono description="Loop variable name (e.g., `i`)." /><span className="font-mono text-gray-400 pt-1">in</span><BlockInput value={block.data.list} onChange={val => onUpdate(path, {...block.data, list: val})} placeholder="a b c" mono description="A space-separated list of items to iterate over." /></div>}
                        
                        {/* THEN / DO block */}
                        <div className="ml-4 border-l-2 border-gray-700 pl-4 py-2 flex flex-col gap-3">
                             <span className="text-xs font-semibold text-gray-500">{block.type === 'if' ? 'then' : 'do'}</span>
                             <BlockList blocks={block.data.mainBlocks} path={[...path, 0]} onUpdate={onUpdate} onRemove={onRemove} onMove={onMove} onAddBlock={onAddBlock} />
                        </div>

                        {/* ELSE block */}
                        {block.type === 'if' && (
                             <div className="ml-4 border-l-2 border-gray-700 pl-4 py-2 flex flex-col gap-3">
                                <span className="text-xs font-semibold text-gray-500">else</span>
                                <BlockList blocks={block.data.elseBlocks} path={[...path, 1]} onUpdate={onUpdate} onRemove={onRemove} onMove={onMove} onAddBlock={onAddBlock} />
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };
    
    return <BlockWrapper type={block.type} controls={controls}>{renderContent()}</BlockWrapper>;
};

const AddBlockMenu: React.FC<{ onAdd: (type: BlockType) => void }> = ({ onAdd }) => {
    const blockTypes: { type: BlockType; label: string }[] = [
        { type: 'comment', label: 'Comment' },
        { type: 'variable', label: 'Variable' },
        { type: 'echo', label: 'Echo' },
        { type: 'read', label: 'Read Input' },
        { type: 'command', label: 'Command' },
        { type: 'if', label: 'If/Else' },
        { type: 'for', label: 'For Loop' },
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {blockTypes.map(({type, label}) => (
                <button key={type} onClick={() => onAdd(type)} className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 rounded-md text-teal-200 font-semibold transition-colors text-sm flex items-center">
                    <Icons.Add /> {label}
                </button>
            ))}
        </div>
    );
};

const BlockList: React.FC<{
    blocks: ScriptBlock[];
    path: number[];
    onUpdate: (path: number[], data: any) => void;
    onRemove: (path: number[]) => void;
    onMove: (path: number[], dir: 'up' | 'down') => void;
    onAddBlock: (path: number[], type: BlockType) => void;
}> = ({ blocks, path, onUpdate, onRemove, onMove, onAddBlock }) => {
    return (
        <div className="flex flex-col gap-4">
            {blocks.map((block, index) => (
                <BlockRenderer
                    key={block.id}
                    block={block}
                    path={[...path, index]}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onMove={onMove}
                    onAddBlock={onAddBlock}
                />
            ))}
            <AddBlockMenu onAdd={(type) => onAddBlock(path, type)} />
        </div>
    );
};

// --- SCRIPT GENERATION LOGIC ---
const generateScript = (blocks: ScriptBlock[], indent = ''): string => {
    let script = '';
    for (const block of blocks) {
        switch (block.type) {
            case 'shebang': script += `#!${block.data.interpreter}\n\n`; break;
            case 'comment': script += `${indent}# ${block.data.text}\n`; break;
            case 'variable': script += `${indent}${block.data.name}=${block.data.value}\n`; break;
            case 'echo': script += `${indent}echo ${block.data.text}\n`; break;
            case 'read': script += `${indent}read -p "${block.data.prompt}" ${block.data.variable}\n`; break;
            case 'command': script += `${indent}${block.data.command}\n`; break;
            case 'if':
                script += `${indent}if ${block.data.condition}; then\n`;
                script += generateScript(block.data.mainBlocks, indent + '  ');
                if (block.data.elseBlocks.length > 0) {
                    script += `${indent}else\n`;
                    script += generateScript(block.data.elseBlocks, indent + '  ');
                }
                script += `${indent}fi\n`;
                break;
            case 'for':
                script += `${indent}for ${block.data.variable} in ${block.data.list}; do\n`;
                script += generateScript(block.data.mainBlocks, indent + '  ');
                script += `${indent}done\n`;
                break;
        }
    }
    return script;
};

const createNewBlock = (type: BlockType): ScriptBlock => {
    const id = crypto.randomUUID();
    switch (type) {
        case 'comment': return { id, type, data: { text: '' } };
        case 'variable': return { id, type, data: { name: 'MY_VAR', value: '"hello"' } };
        case 'echo': return { id, type, data: { text: '"Hello, $MY_VAR"' } };
        case 'read': return { id, type, data: { prompt: 'Enter value: ', variable: 'USER_INPUT' } };
        case 'command': return { id, type, data: { command: 'date' } };
        case 'if': return { id, type, data: { condition: '[ -f "file.txt" ]', mainBlocks: [], elseBlocks: [] } };
        case 'for': return { id, type, data: { variable: 'i', list: '1 2 3', mainBlocks: [] } };
        default: throw new Error('Unknown block type');
    }
};

// --- MAIN BUILDER COMPONENT ---
export const BashBuilder: React.FC<BashBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [blocks, setBlocks] = useState<ScriptBlock[]>([initialShebangBlock]);
    const [generatedScript, setGeneratedScript] = useState('');

    // --- State Manipulation ---
    const updateNestedBlocks = (currentBlocks: ScriptBlock[], path: number[], updater: (blocks: ScriptBlock[]) => ScriptBlock[]): ScriptBlock[] => {
        if (path.length === 0) {
            return updater(currentBlocks);
        }

        const newBlocks = [...currentBlocks];
        const [head, ...tail] = path;
        const targetBlock = { ...newBlocks[head] };

        if (targetBlock.type === 'if') {
            const blockPathIndex = tail.shift();
            if (blockPathIndex === 0) { // 'then' blocks
                targetBlock.data = { ...targetBlock.data, mainBlocks: updateNestedBlocks(targetBlock.data.mainBlocks, tail, updater) };
            } else { // 'else' blocks
                targetBlock.data = { ...targetBlock.data, elseBlocks: updateNestedBlocks(targetBlock.data.elseBlocks, tail, updater) };
            }
        } else if (targetBlock.type === 'for') {
            tail.shift(); // Consume the '0' for mainBlocks path
            targetBlock.data = { ...targetBlock.data, mainBlocks: updateNestedBlocks(targetBlock.data.mainBlocks, tail, updater) };
        }
        
        newBlocks[head] = targetBlock;
        return newBlocks;
    };

    const handleAddBlock = (path: number[], type: BlockType) => {
        const newBlock = createNewBlock(type);
        setBlocks(prev => updateNestedBlocks(prev, path, blockList => [...blockList, newBlock]));
    };
    
    const handleRemoveBlock = (path: number[]) => {
        setBlocks(prev => updateNestedBlocks(prev, path.slice(0, -1), blockList => blockList.filter((_, i) => i !== path[path.length - 1])));
    };

    const handleUpdateBlock = (path: number[], data: any) => {
        setBlocks(prev => {
            const newBlocks = [...prev];
            let currentLevel = newBlocks;
            for(let i = 0; i < path.length - 1; i++) {
                const index = path[i];
                const nextIndex = path[i+1];
                if (currentLevel[index].type === 'if') {
                    currentLevel = (nextIndex === 0) ? currentLevel[index].data.mainBlocks : currentLevel[index].data.elseBlocks;
                    i++; // skip next index as it was block path
                } else if (currentLevel[index].type === 'for') {
                    currentLevel = currentLevel[index].data.mainBlocks;
                    i++; // skip next index as it was block path
                } else {
                     currentLevel = currentLevel[path[i]].data.blocks; // Fallback, should not happen with current structure
                }
            }
            const targetIndex = path[path.length - 1];
            currentLevel[targetIndex] = { ...currentLevel[targetIndex], data };
            return newBlocks;
        });
    };

    const handleMoveBlock = (path: number[], dir: 'up' | 'down') => {
        const index = path[path.length - 1];
        const newIndex = dir === 'up' ? index - 1 : index + 1;
        setBlocks(prev => updateNestedBlocks(prev, path.slice(0, -1), blockList => {
            if (newIndex < 0 || newIndex >= blockList.length) return blockList;
            const newBlockList = [...blockList];
            [newBlockList[index], newBlockList[newIndex]] = [newBlockList[newIndex], newBlockList[index]];
            return newBlockList;
        }));
    };

    useEffect(() => {
        const script = generateScript(blocks).trim();
        setGeneratedScript(script);
    }, [blocks]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedScript, 'bash');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedScript, onCommandGenerated]);

    const isFavorite = favorites.some(fav => fav.command === generatedScript);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">Bash Script Builder</h2>
                <p className="text-gray-400 mt-1">Visually construct scripts with interactive blocks.</p>
            </div>

            <div className="flex flex-col gap-4">
                 <BlockList
                    blocks={blocks}
                    path={[]}
                    onUpdate={handleUpdateBlock}
                    onRemove={handleRemoveBlock}
                    onMove={handleMoveBlock}
                    onAddBlock={handleAddBlock}
                 />
            </div>

            <GeneratedCommand 
                command={generatedScript}
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedScript, 'bash')}
                multiline={true}
            />
        </div>
    );
};
