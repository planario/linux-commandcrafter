import React from 'react';

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
  runInSubshell?: boolean;
}

export interface TutorialContent {
    type: 'heading' | 'paragraph' | 'code' | 'tip' | 'warning' | 'note';
    text: string;
}

export interface Tutorial {
    name: string;
    title: string;
    content: TutorialContent[];
}

/** Props every builder component must accept. */
export interface BuilderProps {
  onCommandGenerated: (command: string, type: string) => void;
  favorites: CommandEntry[];
  onToggleFavorite: (command: string, type: string) => void;
}

/**
 * A builder plugin descriptor used by the registry.
 * Implement this interface and call registerBuilder() to add a new builder
 * without touching any core files.
 */
export interface BuilderPlugin {
  /** Unique slug — used as the tab key and command type label. */
  id: string;
  /** Human-readable tab label. Defaults to id if omitted. */
  label?: string;
  /** The React component that renders the builder UI. */
  component: React.ComponentType<BuilderProps>;
}