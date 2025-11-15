
import React from 'react';
import { CommandOption, OptionType } from '../types';

interface CheckboxOptionProps {
  option: CommandOption;
  isChecked: boolean;
  onToggle: () => void;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const CheckboxOption: React.FC<CheckboxOptionProps> = ({ option, isChecked, onToggle, value, onValueChange }) => {
  const hasValueInput = option.type === OptionType.VALUE && onValueChange;

  return (
    <div 
      onClick={onToggle} 
      className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
        isChecked 
          ? 'bg-teal-900/50 border-teal-500' 
          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-start">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mr-4 mt-1 flex items-center justify-center transition-all duration-200 ${
            isChecked ? 'bg-teal-500 border-teal-400' : 'bg-gray-800 border-gray-500'
        }`}>
            {isChecked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <div className="flex-1">
          <label htmlFor={option.name} className="font-mono text-sm font-semibold text-gray-200 select-none">
            {option.flag}
          </label>
          <p className="text-xs text-gray-400 select-none mt-1">
            {option.description}
          </p>
          {hasValueInput && isChecked && (
              <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={option.placeholder}
                onClick={(e) => e.stopPropagation()} // Prevent parent div click from toggling checkbox
                className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 mt-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm"
              />
          )}
        </div>
      </div>
    </div>
  );
};
