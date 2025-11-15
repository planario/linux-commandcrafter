import React, { useState } from 'react';

interface GeneratedCommandProps {
  command: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  multiline?: boolean;
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const StarIcon: React.FC<{isFavorite: boolean}> = ({ isFavorite }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
        className={isFavorite ? 'text-yellow-400' : 'text-gray-500'}/>
    </svg>
);


export const GeneratedCommand: React.FC<GeneratedCommandProps> = ({ command, isFavorite, onToggleFavorite, multiline = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if(!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{multiline ? 'Generated Playbook' : 'Generated Command'}</h3>
      <div className="bg-gray-900 rounded-lg p-4 flex items-start justify-between shadow-inner gap-2">
        {multiline ? (
            <pre className="text-teal-300 text-sm whitespace-pre-wrap break-words select-all font-mono flex-1">
                <code>{command || <span className="text-gray-500">...</span>}</code>
            </pre>
        ) : (
            <code className="text-teal-300 text-sm sm:text-base break-all select-all font-mono flex-1 mt-1">
                {command || <span className="text-gray-500">...</span>}
            </code>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleFavorite}
            className="p-2 rounded-md transition-colors duration-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
              <StarIcon isFavorite={isFavorite} />
          </button>
          <button
            onClick={handleCopy}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span className="ml-2 hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
