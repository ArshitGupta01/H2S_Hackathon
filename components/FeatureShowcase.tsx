import React, { useState } from 'react';
import {
    SparklesIcon,
    ClipboardIcon,
    MapIcon,
    ChatbotIcon,
    ChevronDownIcon,
} from './Icons.tsx';

const features = [
    {
        id: 2,
        icon: <SparklesIcon />,
        title: 'AI-Powered Analysis',
        description: 'First, it asks you a few simple questions. Then, our advanced AI, powered by Google\'s Gemini, analyzes your unique profile to find the best career paths for you.',
        color: 'bg-purple-500',
        textColor: 'text-white',
        iconBgActive: 'bg-white',
        iconColorActive: 'text-purple-500',
        iconBgInactive: 'bg-purple-100 dark:bg-purple-900/50',
        iconColorInactive: 'text-purple-600 dark:text-purple-300'
    },
    {
        id: 3,
        icon: <ClipboardIcon />,
        title: 'Instant Career Report',
        description: 'Receive a comprehensive report instantly, detailing suggested career paths, key skills to develop, and valuable learning resources.',
        color: 'bg-pink-500',
        textColor: 'text-white',
        iconBgActive: 'bg-white',
        iconColorActive: 'text-pink-500',
        iconBgInactive: 'bg-pink-100 dark:bg-pink-900/50',
        iconColorInactive: 'text-pink-600 dark:text-pink-300'
    },
    {
        id: 4,
        icon: <MapIcon />,
        title: 'Detailed Roadmaps',
        description: 'Dive deeper into any suggested career. Generate a multi-year, step-by-step PDF roadmap to guide your journey to success.',
        color: 'bg-sky-500',
        textColor: 'text-white',
        iconBgActive: 'bg-white',
        iconColorActive: 'text-sky-500',
        iconBgInactive: 'bg-sky-100 dark:bg-sky-900/50',
        iconColorInactive: 'text-sky-600 dark:text-sky-300'
    },
    {
        id: 6,
        icon: <ChatbotIcon />,
        title: 'AI Career Helper',
        description: 'Have questions? Our AI chatbot is available to explain complex terms, skills, and career concepts in simple language.',
        color: 'bg-slate-700',
        textColor: 'text-white',
        iconBgActive: 'bg-white',
        iconColorActive: 'text-slate-700',
        iconBgInactive: 'bg-slate-200 dark:bg-slate-900/50',
        iconColorInactive: 'text-slate-600 dark:text-slate-300'
    },
];

export const FeatureShowcase: React.FC = () => {
    const [activeId, setActiveId] = useState<number>(features[0].id);
    const [mobileActiveId, setMobileActiveId] = useState<number | null>(features[0].id);

    const DesktopView = () => (
        <div className="hidden sm:flex flex-row w-full min-h-[320px] gap-2">
            {features.map((feature) => {
                const isActive = activeId === feature.id;
                return (
                    <div
                        key={feature.id}
                        onMouseEnter={() => setActiveId(feature.id)}
                        onClick={() => setActiveId(feature.id)}
                        className={`relative rounded-xl p-6 transition-all duration-500 ease-in-out cursor-pointer overflow-hidden text-left ${
                            isActive 
                            ? `flex-[3] ${feature.color} ${feature.textColor}`
                            : `flex-[1] bg-slate-50 dark:bg-slate-800/50`
                        }`}
                    >
                        <div className={`rounded-full p-3 w-14 h-14 flex items-center justify-center transition-colors duration-500 mb-4 ${
                            isActive ? feature.iconBgActive : feature.iconBgInactive
                        }`}>
                            {React.cloneElement(feature.icon, {
                                className: `w-8 h-8 transition-colors duration-500 ${isActive ? feature.iconColorActive : feature.iconColorInactive}`
                            })}
                        </div>
                        <h3 className={`text-xl font-bold transition-colors duration-500 ${!isActive && 'text-text-primary'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                            {feature.title}
                        </h3>
                         <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isActive ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                             <p className={`leading-relaxed text-sm ${isActive ? 'opacity-90' : 'text-text-secondary'}`}>
                                 {feature.description}
                             </p>
                        </div>

                        {isActive && (
                            <div className="absolute -bottom-16 -right-16 w-48 h-48 opacity-20" aria-hidden="true">
                                <div className="absolute inset-0 rounded-full bg-white animate-pulse-glow"></div>
                                <div className="absolute inset-6 rounded-full bg-white/80"></div>
                                <div className="absolute inset-12 rounded-full bg-white/60"></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const MobileView = () => (
        <div className="sm:hidden flex flex-col gap-2">
            {features.map((feature) => {
                const isActive = mobileActiveId === feature.id;
                return (
                    <div key={feature.id} className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                        <button
                            onClick={() => setMobileActiveId(isActive ? null : feature.id)}
                            aria-expanded={isActive}
                            className={`w-full p-4 text-left flex items-center gap-4 transition-colors duration-300 ${isActive ? `${feature.color} ${feature.textColor}` : 'text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <div className={`rounded-full p-2 w-10 h-10 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${
                                isActive ? feature.iconBgActive : feature.iconBgInactive
                            }`}>
                                {React.cloneElement(feature.icon, {
                                    className: `w-6 h-6 transition-colors duration-300 ${isActive ? feature.iconColorActive : feature.iconColorInactive}`
                                })}
                            </div>
                            <h3 className="font-bold text-base flex-grow" style={{ fontFamily: 'var(--font-heading)' }}>
                                {feature.title}
                            </h3>
                            <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                <p className="p-4 bg-white dark:bg-slate-900 text-text-secondary text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-lg p-2 max-w-5xl mx-auto">
            <DesktopView />
            <MobileView />
        </div>
    );
};
