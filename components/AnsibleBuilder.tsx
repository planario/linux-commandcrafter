import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface AnsibleBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type AnsibleModule = 'package' | 'service' | 'copy' | 'apt' | 'dnf' | 'yum' | 'command' | 'user';

interface AnsibleTask {
    id: string;
    name: string;
    module: AnsibleModule;
    args: Record<string, string>;
}

interface TaskPreset {
    name: string;
    task: Omit<AnsibleTask, 'id'>;
}

const PRESETS: TaskPreset[] = [
    { name: 'Install (Generic)', task: { name: 'Ensure package is installed', module: 'package', args: { name: 'nginx', state: 'present' }}},
    { name: 'APT: Update & Install', task: { name: 'Update cache and install via APT', module: 'apt', args: { name: 'nginx', state: 'present', update_cache: 'yes' }}},
    { name: 'DNF: Update & Install', task: { name: 'Update cache and install via DNF', module: 'dnf', args: { name: 'nginx', state: 'present', update_cache: 'yes' }}},
    { name: 'YUM: Update & Install', task: { name: 'Update cache and install via YUM', module: 'yum', args: { name: 'nginx', state: 'present', update_cache: 'yes' }}},
    { name: 'Manage Service', task: { name: 'Ensure service is started', module: 'service', args: { name: 'nginx', state: 'started', enabled: 'yes' }}},
    { name: 'Copy File', task: { name: 'Copy local config to remote', module: 'copy', args: { src: '/local/path/file.conf', dest: '/etc/file.conf', mode: '0644' }}},
    { name: 'Run Command', task: { name: 'Execute shell command', module: 'command', args: { cmd: 'uptime' }}},
    { name: 'Manage User', task: { name: 'Create deployment user', module: 'user', args: { name: 'deploy', state: 'present', shell: '/bin/bash' }}},
];

const MODULE_ARG_DESCRIPTIONS: Record<AnsibleModule, Record<string, string>> = {
  package: {
    name: 'Name of the package (cross-distribution).',
    state: 'Choose `present`, `absent`, or `latest`.',
  },
  apt: {
    name: 'Name of the APT package (Debian/Ubuntu).',
    state: '`present`, `absent`, or `latest`.',
    update_cache: 'Set to `yes` to run `apt-get update` first.',
    upgrade: 'Set to `dist` or `yes` to upgrade packages.',
    force_apt_get: 'Force usage of apt-get instead of aptitude.',
  },
  dnf: {
    name: 'Name of the DNF package (RHEL/CentOS 8+, Fedora).',
    state: '`present`, `absent`, or `latest`.',
    update_cache: 'Set to `yes` to force a cache update.',
    enablerepo: 'Enable specific repositories for this task.',
    nobest: 'Set to `yes` to allow installation without the absolute best version.',
  },
  yum: {
    name: 'Name of the YUM package (RHEL/CentOS 7).',
    state: '`present`, `absent`, or `latest`.',
    update_cache: 'Set to `yes` to force a cache update.',
    enablerepo: 'Enable specific repositories.',
  },
  service: {
    name: 'Name of the service (e.g., nginx, sshd).',
    state: '`started`, `stopped`, `restarted`, or `reloaded`.',
    enabled: '`yes` or `no`. Whether it starts on boot.',
  },
  copy: {
    src: 'Local path on controller machine.',
    dest: 'Remote path on target server.',
    mode: 'Octal permissions (e.g., 0644).',
    owner: 'User owner of the file.',
  },
  command: {
    cmd: 'The shell command to execute.',
    chdir: 'Change into this directory before running.',
  },
  user: {
    name: 'The user account name.',
    state: '`present` or `absent`.',
    groups: 'Comma-separated list of secondary groups.',
    shell: 'Login shell for the user (e.g., /bin/bash).',
  },
};

// Quote a YAML scalar value when it would be misinterpreted:
//   - octal-like  (0644, 0755 → becomes integer 420 without quotes)
//   - YAML booleans (yes/no/true/false → become bool)
//   - values with YAML-special characters or empty strings
function yamlQuote(value: string): string {
  if (value === '') return '""';
  const isBoolLike = /^(true|false|yes|no|on|off|null|~)$/i.test(value);
  const isOctalLike = /^0[0-7]+$/.test(value);
  const hasSpecialChars = /[:#\[\]{}&*!|>'"%@`]/.test(value) || /^\s|\s$/.test(value);
  if (isBoolLike || isOctalLike || hasSpecialChars) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

const TrashIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const TaskEditor: React.FC<{ task: AnsibleTask, onUpdate: (task: AnsibleTask) => void, onRemove: () => void }> = ({ task, onUpdate, onRemove }) => {
    
    const handleArgChange = (key: string, value: string) => {
        onUpdate({ ...task, args: { ...task.args, [key]: value } });
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col gap-4 border-l-4 border-teal-500">
            <div className="flex justify-between items-center">
                 <input
                    type="text"
                    value={task.name}
                    onChange={e => onUpdate({ ...task, name: e.target.value })}
                    placeholder="Task Name"
                    className="w-full bg-transparent text-gray-200 font-semibold focus:outline-none"
                />
                <button onClick={onRemove} className="p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600 transition-colors flex-shrink-0 ml-2" title="Delete Task"><TrashIcon /></button>
            </div>
           
            <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-400">Module:</span>
                 <span className="px-2 py-0.5 bg-gray-700 text-teal-300 text-xs font-mono rounded">{`ansible.builtin.${task.module}`}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(task.args).map(([key, value]) => {
                    const description = MODULE_ARG_DESCRIPTIONS[task.module]?.[key];
                    return (
                        <div key={key}>
                             <label className="block text-xs font-medium text-gray-400 mb-1">{key}</label>
                             <input
                                type="text"
                                value={value}
                                onChange={(e) => handleArgChange(key, e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            />
                            {description && <p className="text-[10px] text-gray-500 mt-1 leading-tight">{description}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const AnsibleBuilder: React.FC<AnsibleBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [playbookName, setPlaybookName] = useState('My Automation Playbook');
    const [hosts, setHosts] = useState('all');
    const [become, setBecome] = useState(true);
    const [tasks, setTasks] = useState<AnsibleTask[]>([]);
    const [generatedPlaybook, setGeneratedPlaybook] = useState('');
    
    const resetAllFields = () => {
        setPlaybookName('My Automation Playbook');
        setHosts('all');
        setBecome(true);
        setTasks([]);
    };

    const addTask = (preset: TaskPreset) => {
        const newTask: AnsibleTask = {
            id: crypto.randomUUID(),
            ...preset.task
        };
        setTasks([...tasks, newTask]);
    };

    const updateTask = (updatedTask: AnsibleTask) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    useEffect(() => {
        let yaml = '---\n';
        yaml += `- name: ${playbookName}\n`;
        yaml += `  hosts: ${hosts}\n`;
        yaml += `  become: ${become ? 'true' : 'false'}\n`;

        if (tasks.length > 0) {
            yaml += `\n  tasks:\n`;
            tasks.forEach(task => {
                yaml += `    - name: ${task.name}\n`;
                yaml += `      ansible.builtin.${task.module}:\n`;
                Object.entries(task.args).forEach(([key, value]) => {
                    if (value.trim() === '') return; // skip empty fields
                    yaml += `        ${key}: ${yamlQuote(value)}\n`;
                });
                yaml += `\n`;
            });
        }
        
        setGeneratedPlaybook(yaml.trimEnd());
    }, [playbookName, hosts, become, tasks]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedPlaybook, 'ansible-playbook');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedPlaybook, onCommandGenerated]);
    
    const isFavorite = favorites.some(fav => fav.command === generatedPlaybook);

    return (
        <div className="flex flex-col gap-8">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-teal-400">Ansible Playbook Builder</h2>
                    <p className="text-gray-400 mt-1">Visually create automation playbooks for any distribution.</p>
                </div>
                 <button onClick={resetAllFields} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm">Clear All</button>
            </div>

            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-4 border border-gray-600">
                 <h3 className="text-lg font-semibold text-gray-200">Play Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="playbook-name" className="block text-sm font-medium text-gray-400 mb-2">Playbook Name</label>
                        <input id="playbook-name" value={playbookName} onChange={e => setPlaybookName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                    </div>
                     <div>
                        <label htmlFor="target-hosts" className="block text-sm font-medium text-gray-400 mb-2">Target Hosts</label>
                        <input id="target-hosts" value={hosts} onChange={e => setHosts(e.target.value)} placeholder="e.g., all, webservers" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"/>
                        <p className="text-[10px] text-gray-500 mt-1">Defined in your inventory file.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <input type="checkbox" id="become" checked={become} onChange={e => setBecome(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <label htmlFor="become" className="text-sm text-gray-300">Run with sudo (<span className="font-mono">become: true</span>)</label>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                 <h3 className="text-lg font-semibold text-gray-200">Task Timeline</h3>
                 <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                     <h4 className="font-semibold text-gray-300 mb-3 text-sm">Add Manager-Specific Task:</h4>
                     <div className="flex flex-wrap gap-2">
                         {PRESETS.map(preset => (
                             <button 
                                key={preset.name} 
                                onClick={() => addTask(preset)} 
                                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 rounded-md text-teal-200 font-semibold transition-colors text-xs"
                             >
                                 {preset.name}
                             </button>
                         ))}
                     </div>
                 </div>
                <div className="flex flex-col gap-4">
                    {tasks.map(task => (
                        <TaskEditor key={task.id} task={task} onUpdate={updateTask} onRemove={() => removeTask(task.id)} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                            No tasks added yet. Click a preset above to start building.
                        </div>
                    )}
                </div>
            </div>
            
            <GeneratedCommand 
                command={generatedPlaybook} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedPlaybook, 'ansible-playbook')}
                multiline={true}
            />
        </div>
    );
};