import React from 'react';

interface FlagCheckboxProps {
  label: string;
  flag: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
  /** Unique namespace prefix to avoid duplicate HTML ids across builders */
  namespace?: string;
}

export const FlagCheckbox: React.FC<FlagCheckboxProps> = ({
  label,
  flag,
  checked,
  onChange,
  description,
  namespace = 'flag',
}) => {
  const id = `${namespace}-${flag.replace(/[^a-z0-9]/gi, '-')}`;
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
          {label} <span className="font-mono text-xs text-gray-500">({flag})</span>
        </label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};
