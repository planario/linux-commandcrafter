export enum OptionType {
  FLAG,
  VALUE,
}

export interface CommandOption {
  flag: string;
  description: string;
  type: OptionType;
  placeholder?: string;
  name: string;
}

export interface CommandArgument {
    name: string;
    placeholder: string;
    description?: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  baseCommand: string;
  options: CommandOption[];
  args?: CommandArgument[];
}

// New types
export interface CommandEntry {
  id: string;
  command: string;
  type: string; // e.g., 'rsync', 'crontab'
  timestamp: number;
}

export interface Alias {
  id: string;
  name: string;
  command: string;
  description: string;
}

export interface TutorialContent {
    type: 'heading' | 'paragraph' | 'code';
    text: string;
}

export interface Tutorial {
    name: string;
    title: string;
    content: TutorialContent[];
}
