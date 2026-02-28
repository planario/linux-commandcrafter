import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface AnalysisResult {
  isError: boolean;
  explanation: string;
  errorDetails?: string;
  safetyLevel: 'Safe' | 'Caution' | 'Dangerous';
}

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const CommandAnalyzer: React.FC = () => {
  const [inputCommand, setInputCommand] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCommand = async () => {
    if (!inputCommand.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analyze this Linux command: \`${inputCommand}\``,
        config: {
          systemInstruction: `You are a world-class Linux systems administrator and shell script expert. 
          Analyze the provided command. Identify its components, flags, and arguments. 
          Determine if the syntax is valid (ignoring context-specific file existence unless it's a logical impossibility). 
          Assess the safety level of the command.
          
          Return a JSON object with:
          - isError: boolean (true if syntax is broken or command is logically invalid)
          - explanation: string (A concise, step-by-step breakdown using bullet points)
          - errorDetails: string (Optional. Explain why it might fail)
          - safetyLevel: string (One of: 'Safe', 'Caution', 'Dangerous')`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isError: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING },
              errorDetails: { type: Type.STRING },
              safetyLevel: { type: Type.STRING, enum: ['Safe', 'Caution', 'Dangerous'] }
            },
            required: ['isError', 'explanation', 'safetyLevel']
          }
        }
      });

      const result = JSON.parse(response.text || '{}') as AnalysisResult;
      setAnalysis(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze command. Please check your internet connection or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyStyles = (level: string) => {
    switch (level) {
      case 'Safe': return 'bg-green-900/40 text-green-400 border-green-500/30';
      case 'Caution': return 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30';
      case 'Dangerous': return 'bg-red-900/40 text-red-400 border-red-500/30';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8">
      <header>
        <h2 className="text-2xl font-bold text-teal-400">Command Analyzer</h2>
        <p className="text-gray-400 mt-1">Paste a Linux command to see a detailed explanation and safety check.</p>
      </header>

      <div className="flex flex-col gap-4">
        <textarea
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="e.g., find . -name '*.log' -delete"
          rows={3}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 font-mono text-teal-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
        />
        <button
          onClick={analyzeCommand}
          disabled={isLoading || !inputCommand.trim()}
          className={`flex items-center justify-center px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
            isLoading || !inputCommand.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <SearchIcon />
              Analyze Command
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border flex items-center gap-4 ${getSafetyStyles(analysis.safetyLevel)}`}>
              {analysis.safetyLevel === 'Safe' ? <ShieldCheckIcon /> : <AlertIcon />}
              <div>
                <span className="text-xs uppercase font-black tracking-widest opacity-70">Safety Level</span>
                <p className="text-xl font-bold">{analysis.safetyLevel}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-center gap-4 ${analysis.isError ? 'bg-red-900/40 text-red-400 border-red-500/30' : 'bg-green-900/40 text-green-400 border-green-500/30'}`}>
              <div className="w-6 h-6 flex items-center justify-center">
                 {analysis.isError ? (
                   <span className="text-2xl font-black">!</span>
                 ) : (
                   <ShieldCheckIcon />
                 )}
              </div>
              <div>
                <span className="text-xs uppercase font-black tracking-widest opacity-70">Status</span>
                <p className="text-xl font-bold">{analysis.isError ? 'Error Detected' : 'Syntax Looks Valid'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Explanation
            </h3>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="whitespace-pre-wrap leading-relaxed">
                {analysis.explanation}
              </p>
            </div>
          </div>

          {analysis.errorDetails && (
            <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-400 mb-2">Technical Warning</h3>
              <p className="text-gray-400 italic">
                {analysis.errorDetails}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
