import React, { useState, useEffect } from 'react';
import { GeneratedCommand } from './GeneratedCommand';
import { CommandEntry } from '../types';

interface FfmpegBuilderProps {
    onCommandGenerated: (command: string, type: string) => void;
    favorites: CommandEntry[];
    onToggleFavorite: (command: string, type: string) => void;
}

type Mode = 'convert' | 'extractAudio' | 'createGif' | 'trim' | 'upscale';
type HwAccel = 'none' | 'cuda' | 'qsv' | 'vaapi' | 'videotoolbox';

const LabeledInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string; }> = 
({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
        />
    </div>
);

const WarningMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm rounded-lg p-3 my-2">
        {children}
    </div>
);


export const FfmpegBuilder: React.FC<FfmpegBuilderProps> = ({ onCommandGenerated, favorites, onToggleFavorite }) => {
    const [mode, setMode] = useState<Mode>('convert');
    const [inputFile, setInputFile] = useState('input.mp4');
    const [outputFile, setOutputFile] = useState('output.mkv');
    
    // Mode-specific state
    const [audioCodec, setAudioCodec] = useState('copy');
    const [videoCodec, setVideoCodec] = useState('copy');
    const [startTime, setStartTime] = useState('00:00:10');
    const [duration, setDuration] = useState('5');
    const [fps, setFps] = useState('15');
    const [width, setWidth] = useState('480');
    const [hwAccel, setHwAccel] = useState<HwAccel>('none');
    const [scale, setScale] = useState('3840:2160');

    const [generatedCommand, setGeneratedCommand] = useState('');
    
    const resetAllFields = () => {
        setInputFile('input.mp4');
        setOutputFile('output.mkv');
        setAudioCodec('copy');
        setVideoCodec('copy');
        setStartTime('00:00:10');
        setDuration('5');
        setFps('15');
        setWidth('480');
        setHwAccel('none');
        setScale('3840:2160');
    };

    useEffect(() => {
        let cmd = 'ffmpeg';

        if (hwAccel !== 'none' && (mode === 'convert' || mode === 'upscale')) {
            cmd += ` -hwaccel ${hwAccel}`;
        }
        
        if (startTime && (mode === 'createGif' || mode === 'trim')) cmd += ` -ss ${startTime}`;
        cmd += ` -i ${inputFile || 'input.mp4'}`;
        
        switch (mode) {
            case 'convert':
                cmd += ` -c:v ${videoCodec || 'copy'} -c:a ${audioCodec || 'copy'} ${outputFile || 'output.mkv'}`;
                break;
            case 'extractAudio':
                cmd += ` -vn -c:a ${audioCodec || 'aac'} ${outputFile || 'output.aac'}`;
                break;
            case 'createGif':
                cmd += ` -t ${duration || '5'} -vf "fps=${fps || '15'},scale=${width || '480'}:-1:flags=lanczos" ${outputFile || 'output.gif'}`;
                break;
            case 'trim':
                cmd += ` -t ${duration || '5'} -c copy ${outputFile || 'output_trimmed.mp4'}`;
                break;
            case 'upscale':
                if (hwAccel === 'cuda') {
                    cmd += ` -vf "scale_cuda=${scale || '3840:2160'}" -c:v h264_nvenc ${outputFile || 'output_upscaled.mp4'}`;
                } else {
                    cmd += ` -vf scale=${scale || '3840:2160'} -c:v libx264 ${outputFile || 'output_upscaled.mp4'}`;
                }
                break;
        }
        setGeneratedCommand(cmd.trim());

    }, [mode, inputFile, outputFile, audioCodec, videoCodec, startTime, duration, fps, width, hwAccel, scale]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onCommandGenerated(generatedCommand, 'ffmpeg');
        }, 500);
        return () => clearTimeout(handler);
    }, [generatedCommand, onCommandGenerated]);
    
    const isFavorite = favorites.some(fav => fav.command === generatedCommand);

    const renderOptions = () => {
        switch (mode) {
            case 'convert':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <LabeledInput label="Video Codec" value={videoCodec} onChange={setVideoCodec} placeholder="e.g., libx264, copy" />
                        <LabeledInput label="Audio Codec" value={audioCodec} onChange={setAudioCodec} placeholder="e.g., aac, copy" />
                    </div>
                );
            case 'extractAudio':
                 return <LabeledInput label="Audio Codec" value={audioCodec} onChange={setAudioCodec} placeholder="e.g., aac, mp3, copy" />;
            case 'createGif':
                return (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <LabeledInput label="Start Time" value={startTime} onChange={setStartTime} placeholder="HH:MM:SS" />
                        <LabeledInput label="Duration (s)" value={duration} onChange={setDuration} placeholder="e.g., 5" />
                        <LabeledInput label="FPS" value={fps} onChange={setFps} placeholder="e.g., 15" />
                        <LabeledInput label="Width (px)" value={width} onChange={setWidth} placeholder="e.g., 480" />
                    </div>
                );
            case 'trim':
                 return (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <LabeledInput label="Start Time" value={startTime} onChange={setStartTime} placeholder="HH:MM:SS" />
                        <LabeledInput label="Duration (s)" value={duration} onChange={setDuration} placeholder="e.g., 30" />
                    </div>
                 );
            case 'upscale':
                return (
                    <>
                        {hwAccel === 'cuda' && (
                            <WarningMessage>
                                <strong>NVIDIA GPU Required:</strong> CUDA acceleration requires a compatible NVIDIA graphics card and correctly installed drivers. The video encoder has been set to `h264_nvenc`.
                            </WarningMessage>
                        )}
                        <LabeledInput label="Target Resolution" value={scale} onChange={setScale} placeholder="e.g., 3840:2160 or 1920:-1" />
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-teal-400">FFmpeg Builder</h2>
                    <p className="text-gray-400 mt-1">Craft commands for video and audio manipulation.</p>
                </div>
                 <button onClick={resetAllFields} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors text-sm">Clear All</button>
            </div>
            
            <div className="bg-gray-700/50 p-6 rounded-lg flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mode</label>
                    <select value={mode} onChange={e => setMode(e.target.value as Mode)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                        <option value="convert">Convert Video</option>
                        <option value="upscale">Upscale Video</option>
                        <option value="trim">Trim Video/Audio</option>
                        <option value="extractAudio">Extract Audio</option>
                        <option value="createGif">Create GIF</option>
                    </select>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Input File" value={inputFile} onChange={setInputFile} />
                    <LabeledInput label="Output File" value={outputFile} onChange={setOutputFile} />
                </div>

                {(mode === 'convert' || mode === 'upscale') && (
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Hardware Acceleration</label>
                         <select value={hwAccel} onChange={e => setHwAccel(e.target.value as HwAccel)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="none">None (CPU)</option>
                            <option value="cuda">NVIDIA CUDA</option>
                            <option value="qsv">Intel Quick Sync Video</option>
                            <option value="vaapi">VA-API (Linux)</option>
                            <option value="videotoolbox">Apple VideoToolbox (macOS)</option>
                        </select>
                    </div>
                )}

                {renderOptions()}
            </div>

            <GeneratedCommand 
                command={generatedCommand} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(generatedCommand, 'ffmpeg')}
            />
        </div>
    );
};