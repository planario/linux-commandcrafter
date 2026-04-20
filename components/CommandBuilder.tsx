import React, { useState, useEffect } from 'react';
import { CommandDefinition, CommandEntry, OptionType } from '../types';
import { GeneratedCommand } from './GeneratedCommand';
import { CheckboxOption } from './CheckboxOption';
import { shellQuote as q } from '../utils/shell';

interface CommandBuilderProps {
  command: CommandDefinition;
  onCommandGenerated: (command: string, type: string) => void;
  favorites: CommandEntry[];
  onToggleFavorite: (command: string, type: string) => void;
}

export const CommandBuilder: React.FC<CommandBuilderProps> = ({ command, onCommandGenerated, favorites, onToggleFavorite }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [generatedCommand, setGeneratedCommand] = useState<string>('');
  
  const resetAllFields = () => {
    setSelectedOptions({});
    setArgValues({});
    setOptionValues({});
  };

  useEffect(() => {
    resetAllFields();
  }, [command]);

  useEffect(() => {
    const buildCommand = () => {
      let cmd = command.baseCommand;

      const activeOptionsParts: string[] = [];
      Object.entries(selectedOptions).forEach(([optionName, isSelected]) => {
        if (!isSelected) return;
        const optionDef = command.options.find(o => o.name === optionName);
        if (!optionDef) return;

        const flag = optionDef.flag.split(',')[0].trim();
        if (optionDef.type === OptionType.VALUE) {
            const value = (optionValues[optionName] || '').trim();
            if (value) {
                activeOptionsParts.push(`${flag} ${q(value)}`);
            }
        } else {
            activeOptionsParts.push(flag);
        }
      });
      
      if (activeOptionsParts.length > 0) {
        cmd += ` ${activeOptionsParts.join(' ')}`;
      }

      const finalArgs = command.args
        ?.map(arg => argValues[arg.name]?.trim() || '')
        .filter(Boolean)
        .map(q)
        .join(' ');

      if (finalArgs) {
        cmd += ` ${finalArgs}`;
      }
      
      return cmd.trim();
    };
    setGeneratedCommand(buildCommand());
  }, [selectedOptions, optionValues, argValues, command]);

  useEffect(() => {
    const handler = setTimeout(() => {
        onCommandGenerated(generatedCommand, command.name);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [generatedCommand, command.name, onCommandGenerated]);

  const handleOptionToggle = (optionName: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: !prev[optionName],
    }));
  };

  const handleOptionValueChange = (optionName: string, value: string) => {
    setOptionValues(prev => ({
        ...prev,
        [optionName]: value,
    }));
  };

  const handleArgChange = (argName: string, value: string) => {
    setArgValues(prev => ({
        ...prev,
        [argName]: value,
    }));
  };

  const isFavorite = favorites.some(fav => fav.command === generatedCommand);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-teal-400">{command.name}</h2>
                <p className="text-gray-400 mt-1">{command.description}</p>
            </div>
            <button 
                onClick={resetAllFields}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm"
            >
                Clear All
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {command.options.map(option => (
          <CheckboxOption 
            key={option.name}
            option={option}
            isChecked={!!selectedOptions[option.name]}
            onToggle={() => handleOptionToggle(option.name)}
            value={optionValues[option.name] || ''}
            onValueChange={(value) => handleOptionValueChange(option.name, value)}
          />
        ))}
      </div>
      
      {command.args && command.args.length > 0 && (
          <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Arguments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {command.args.map(arg => (
                      <div key={arg.name}>
                          <label htmlFor={`arg-${arg.name}`} className="block text-sm font-medium text-gray-300">
                              {arg.name}
                          </label>
                          {arg.description && <p className="text-xs text-gray-500 mt-1 mb-2">{arg.description}</p>}
                          <input
                              type="text"
                              id={`arg-${arg.name}`}
                              value={argValues[arg.name] || ''}
                              onChange={(e) => handleArgChange(arg.name, e.target.value)}
                              placeholder={arg.placeholder}
                              className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                          />
                      </div>
                  ))}
              </div>
          </div>
      )}

      <GeneratedCommand 
        command={generatedCommand} 
        isFavorite={isFavorite}
        onToggleFavorite={() => onToggleFavorite(generatedCommand, command.name)}
      />
    </div>
  );
};
