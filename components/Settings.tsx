import React, { useState } from 'react';
import { GearIcon, XMarkIcon, TrashIcon, HistoryIcon, TargetIcon, LightBulbIcon } from './Icons.tsx';
import { HistoryItem } from '../types.ts';

interface SettingsProps {
    onClearHistory: () => void;
    roadmapCount: number;
    roadmapLimit: number;
    chatCount: number;
    chatLimit: number;
    history: HistoryItem[];
    onSelectReport: (item: HistoryItem) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    onClearHistory,
    roadmapCount,
    roadmapLimit,
    chatCount,
    chatLimit,
    history,
    onSelectReport,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire report history? This action cannot be undone.")) {
            onClearHistory();
        }
    };
    
    const handleSelectReport = (item: HistoryItem) => {
        onSelectReport(item);
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 left-6 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-slate-200/50 dark:bg-slate-800/50 text-text-primary w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all hover:scale-110 duration-200"
                    aria-label="Open settings menu"
                >
                    <GearIcon className="w-8 h-8" />
                </button>
            </div>
        );
    }

    return (
        <aside className="fixed bottom-6 left-6 z-40 w-full max-w-xs flex flex-col animate-slide-up-fade">
             <div className="bg-white dark:bg-slate-900 border border-card-border shadow-2xl flex flex-col sm:rounded-2xl overflow-hidden p-4">
                <header className="flex items-center justify-between pb-3 mb-3 border-b border-card-border">
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        <GearIcon className="w-6 h-6" />
                        Settings
                    </h3>
                     <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700/50" aria-label="Close settings">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Report History Section */}
                    {history.length > 0 && (
                        <div className="border border-card-border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/20">
                             <h4 className="font-semibold text-text-primary text-sm mb-3 flex items-center gap-2">
                                <HistoryIcon className="w-5 h-5" />
                                Recent Report History
                            </h4>
                             <ul className="space-y-2">
                                {history.map((item) => {
                                    const isSpecific = item.summary.startsWith('Specific Path:');
                                    return (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => handleSelectReport(item)}
                                                className="group w-full text-left p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors duration-200 flex items-center gap-3"
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                                    {isSpecific ? <TargetIcon className="w-5 h-5" /> : <LightBulbIcon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-semibold truncate text-text-primary">{item.summary}</p>
                                                    <p className="text-xs text-text-secondary mt-1">{new Date(item.id).toLocaleString()}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">Load</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    
                     {/* Other Settings */}
                    <div className="border border-card-border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/20">
                         <div className="mb-4">
                            <h4 className="font-semibold text-text-primary text-sm mb-2">Usage Limits</h4>
                            <div className="text-xs text-text-secondary space-y-1">
                                <p>Detailed Roadmaps: <strong className="text-text-primary">{Math.max(0, roadmapLimit - roadmapCount)} / {roadmapLimit}</strong> remaining</p>
                                <p>Chat Messages: <strong className="text-text-primary">{Math.max(0, chatLimit - chatCount)} / {chatLimit}</strong> remaining</p>
                            </div>
                         </div>

                        <div>
                            <h4 className="font-semibold text-text-primary text-sm mb-2">Data Management</h4>
                            <button
                                onClick={handleClearHistory}
                                className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors font-semibold p-2 rounded-lg border border-red-500/30"
                                aria-label="Clear all report history"
                            >
                                <TrashIcon className="w-4 h-4"/>
                                Clear Report History
                            </button>
                        </div>
                    </div>
                </div>

             </div>
        </aside>
    );
};