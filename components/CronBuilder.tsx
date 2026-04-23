import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';
import { isValidCronField, isDangerousCommand, MAX_CRON_COMMAND_LENGTH } from '../utils/sanitize';

interface CronInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  description: string;
  invalid?: boolean;
}

const CronInput: React.FC<CronInputProps> = ({ label, value, onChange, placeholder, description, invalid }) => (
  <div className="flex-1 min-w-[80px]">
    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-gray-700 border text-gray-200 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition ${
        invalid ? 'border-red-500' : 'border-gray-600'
      }`}
    />
    <p className={`text-xs text-center mt-1 ${invalid ? 'text-red-400' : 'text-gray-500'}`}>
      {invalid ? 'Invalid value' : description}
    </p>
  </div>
);

interface CronBuilderProps {
  onCommandGenerated: (command: string, type: string) => void;
  favorites: CommandEntry[];
  onToggleFavorite: (command: string, type: string) => void;
}

export const CronBuilder: React.FC<CronBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
  const defaultState = {
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    command: '/path/to/command',
  };

  const [minute, setMinute] = useState(defaultState.minute);
  const [hour, setHour] = useState(defaultState.hour);
  const [dayOfMonth, setDayOfMonth] = useState(defaultState.dayOfMonth);
  const [month, setMonth] = useState(defaultState.month);
  const [dayOfWeek, setDayOfWeek] = useState(defaultState.dayOfWeek);
  const [command, setCommand] = useState(defaultState.command);
  const [generatedCron, setGeneratedCron] = useState('');

  const resetAllFields = () => {
    setMinute(defaultState.minute);
    setHour(defaultState.hour);
    setDayOfMonth(defaultState.dayOfMonth);
    setMonth(defaultState.month);
    setDayOfWeek(defaultState.dayOfWeek);
    setCommand(defaultState.command);
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value.slice(0, MAX_CRON_COMMAND_LENGTH));
  };

  const timeFields = [
    { label: 'Minute',       value: minute,       set: setMinute,       description: '(0-59)' },
    { label: 'Hour',         value: hour,          set: setHour,         description: '(0-23)' },
    { label: 'Day of Month', value: dayOfMonth,    set: setDayOfMonth,   description: '(1-31)' },
    { label: 'Month',        value: month,         set: setMonth,        description: '(1-12)' },
    { label: 'Day of Week',  value: dayOfWeek,     set: setDayOfWeek,    description: '(0-7)' },
  ];

  const hasInvalidField = timeFields.some(f => !isValidCronField(f.value));
  const dangerous = isDangerousCommand(command);

  useEffect(() => {
    const cronString = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek} ${command}`;
    setGeneratedCron(cronString);
  }, [minute, hour, dayOfMonth, month, dayOfWeek, command]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onCommandGenerated(generatedCron, 'crontab');
    }, 500);
    return () => clearTimeout(handler);
  }, [generatedCron, onCommandGenerated]);

  const isFavorite = favorites.some(fav => fav.command === generatedCron);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-teal-400">Crontab Generator</h2>
            <p className="text-gray-400 mt-1">Create a schedule for your automated tasks.</p>
          </div>
          <button
            onClick={resetAllFields}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <div className="flex flex-wrap items-start gap-4">
          {timeFields.map(f => (
            <CronInput
              key={f.label}
              label={f.label}
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder="*"
              description={f.description}
              invalid={!isValidCronField(f.value)}
            />
          ))}
        </div>
        <p className="text-xs text-center mt-3 text-gray-500">
          Use '*' for any value, '*/n' for every n, or a comma-separated list '1,2,3'.
        </p>
      </div>

      <div>
        <label htmlFor="cron-command" className="block text-sm font-medium text-gray-300 mb-2">
          Command to Execute
        </label>
        <input
          type="text"
          id="cron-command"
          value={command}
          onChange={handleCommandChange}
          placeholder="/path/to/your/script.sh"
          maxLength={MAX_CRON_COMMAND_LENGTH}
          className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          The full command or script to be executed at the scheduled time.{' '}
          <span className="text-gray-600">({command.length}/{MAX_CRON_COMMAND_LENGTH})</span>
        </p>
      </div>

      {dangerous && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/40 text-red-400 rounded-lg px-4 py-3 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>Warning:</strong> The command you entered matches a potentially destructive pattern.
            Double-check before scheduling this cron job.
          </span>
        </div>
      )}

      {hasInvalidField && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/40 text-yellow-400 rounded-lg px-4 py-3 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>One or more time fields contain invalid characters. Use digits, *, /, -, or ,</span>
        </div>
      )}

      <GeneratedCommand
        command={generatedCron}
        isFavorite={isFavorite}
        onToggleFavorite={() => onToggleFavorite(generatedCron, 'crontab')}
      />
    </div>
  );
};
