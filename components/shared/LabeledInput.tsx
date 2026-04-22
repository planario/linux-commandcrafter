import React from 'react';

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'password' | 'number' | 'email';
  maxLength?: number;
  className?: string;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  type = 'text',
  maxLength,
  className = '',
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm ${className}`}
    />
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);
