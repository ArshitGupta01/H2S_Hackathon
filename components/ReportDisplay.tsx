import React, { useState, useRef } from 'react';
import { ReportData } from '../types.ts';
import { TargetIcon, WrenchScrewdriverIcon, BookOpenIcon, MapIcon, ClipboardIcon, CheckIcon, PencilIcon, DownloadIcon, CodeBracketIcon } from './Icons.tsx';
import { sanitizeHTML } from '../sanitizer.ts';

const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    return (
        <div className="space-y-3 text-sm md:text-base">
            {content.trim().split('\n').map((line, index) => {
                const sanitizedLine = sanitizeHTML(line);
                if (sanitizedLine.trim() === '') return null;

                let formattedLine = sanitizedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent font-semibold">$1</strong>');

                const numberedListMatch = sanitizedLine.match(/^\s*(\d+)\.\s/);
                if (numberedListMatch) {
                    return (
                        <p key={index} className="pl-6 relative">
                            <span className="absolute left-0 font-semibold text-accent">{numberedListMatch[1]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\s*\d+\.\s/, '') }} />
                        </p>
                    );
                }

                if (/^\s*[-*]\s/.test(sanitizedLine)) {
                    return <p key={index} className="pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-accent" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\s*[-*]\s/, '') }} />;
                }
                if (/^(Q[1-4]:)/.test(sanitizedLine)) {
                    return <p key={index} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^(Q([1-4]):)/, '<strong class="text-text-secondary">$2.</strong>') }} />;
                }
                if (/^(Year \d+:)/.test(sanitizedLine)) {
                    return <h4 key={index} className="text-lg font-semibold text-text-primary mt-4" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                }

                return <p key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
            })}
        </div>
    );
};

interface Section {
    key: keyof ReportData;
    title: string;
    icon: React.ReactNode;
    gridSpan?: string;
}

interface ReportDisplayProps {
    report: string; // The raw report string for copying
    reportData: ReportData;
    editedReportData: ReportData;
    onUpdateSection: (section: keyof ReportData, content: string) => void;
    onGenerateDetailedReport: (selectedPath: string) => void;
    isGeneratingPdf: boolean;
    detailedReportContent: string | null;
    createPdfFromMarkdown: (markdown: string, title: string) => void;
    allowEditing: boolean;
    roadmapGenerationCount: number;
    roadmapGenerationLimit: number;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, reportData, editedReportData, onUpdateSection, onGenerateDetailedReport, isGeneratingPdf, detailedReportContent, createPdfFromMarkdown, allowEditing, roadmapGenerationCount, roadmapGenerationLimit }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [editingSection, setEditingSection] = useState<keyof ReportData | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    const [selectedPath, setSelectedPath] = useState('');

    const handleGeneratePdfClick = () => {
        if (onGenerateDetailedReport && selectedPath) {
            onGenerateDetailedReport(selectedPath);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(report).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleDownloadPdf = async () => {
        if (!reportRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const { default: jsPDF } = await import('jspdf');

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: 'transparent',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('AI-Career-Advisor-Report.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };


    const handleCancelEdit = (key: keyof ReportData) => {
        onUpdateSection(key, reportData[key]); // Revert changes
        setEditingSection(null);
    };

    const sections: Section[] = [
        { key: "careerPaths", title: "Career Paths", icon: <TargetIcon className="w-6 h-6" />, gridSpan: 'lg:col-span-2' },
        { key: "skillsToDevelop", title: "Skills to Develop", icon: <WrenchScrewdriverIcon className="w-6 h-6" />, gridSpan: 'lg:col-span-1' },
        { key: "languagesToLearn", title: "Languages to Learn", icon: <CodeBracketIcon className="w-6 h-6" />, gridSpan: 'lg:col-span-1' },
        { key: "learningResources", title: "Learning Resources", icon: <BookOpenIcon className="w-6 h-6" />, gridSpan: 'lg:col-span-2' },
    ];
    
    const roadmapLimitReached = roadmapGenerationCount >= roadmapGenerationLimit;

    return (
        <div className="mt-8 animate-fade-in">
            <div className="relative mb-6 flex flex-col sm:flex-row sm:justify-end gap-2 report-actions">
                <button
                    onClick={handleCopy}
                    className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 border border-card-border px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all backdrop-blur-sm"
                    aria-label="Copy report to clipboard"
                >
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy Report'}
                </button>
                 <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 border border-card-border px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 backdrop-blur-sm"
                    aria-label="Download report as PDF"
                >
                    <DownloadIcon className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download as Image'}
                </button>
            </div>
            <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 report-display-grid">
                {sections.filter(s => reportData[s.key]).map(({ key, title, icon, gridSpan }, index) => (
                    <article 
                        key={title} 
                        className={`glass-card p-8 ${gridSpan} flex flex-col animate-fade-in`} 
                        style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
                        aria-labelledby={`section-title-${key}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-accent/10 p-3 rounded-full text-accent animate-pulse-glow">{icon}</div>
                                <h3 id={`section-title-${key}`} className="text-2xl gradient-text" style={{fontFamily: 'var(--font-heading)'}}>{title}</h3>
                            </div>
                             {allowEditing && editingSection !== key && (
                                <button
                                    onClick={() => setEditingSection(key)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline edit-button"
                                    aria-label={`Edit ${title} section`}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="text-text-secondary leading-relaxed flex-grow">
                            {editingSection === key ? (
                                <div className="flex flex-col h-full">
                                    <textarea
                                        value={editedReportData[key]}
                                        onChange={(e) => onUpdateSection(key, e.target.value)}
                                        className="w-full flex-grow text-sm p-3 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg resize-y focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary"
                                        rows={Math.max(5, editedReportData[key].split('\n').length)}
                                        aria-label={`Editing content for ${title}`}
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button 
                                            onClick={() => handleCancelEdit(key)}
                                            className="px-4 py-1.5 text-sm font-semibold rounded-md bg-slate-500 hover:bg-slate-600 transition-colors text-white">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => setEditingSection(null)}
                                            className="px-4 py-1.5 text-sm font-semibold rounded-md bg-accent text-white hover:bg-accent-hover transition-colors">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : key === 'careerPaths' && onGenerateDetailedReport ? (() => {
                                const careerPathsContent = editedReportData.careerPaths.trim();
                                const listRegex = /\n\s*([-*]|\d+\.)\s/;
                                const listItemRegex = /^\s*([-*]|\d+\.)\s/;

                                const listStartIndex = careerPathsContent.search(listRegex);
                                const introContent = listStartIndex === -1 ? careerPathsContent : careerPathsContent.substring(0, listStartIndex).trim();
                                const pathLines = listStartIndex === -1 ? [] : careerPathsContent.substring(listStartIndex).trim().split('\n').filter(line => listItemRegex.test(line));

                                return (
                                <div className="space-y-4">
                                    <FormattedContent content={introContent} />
                                    {pathLines.length > 0 && (
                                    <div className="pt-6 border-t border-card-border mt-6">
                                        <p className="text-sm text-text-secondary mb-4">
                                            <strong className="text-text-primary">Dive Deeper:</strong> Select a path below to generate a personalized, in-depth PDF roadmap.
                                            <br />
                                            <span className={roadmapLimitReached ? 'text-red-500 font-semibold' : ''}>
                                                ({Math.max(0, roadmapGenerationLimit - roadmapGenerationCount)} of {roadmapGenerationLimit} uses remaining)
                                            </span>
                                        </p>
                                        <div className="space-y-3">
                                            {pathLines.map((pathLine, index) => {
                                                const lineContent = sanitizeHTML(pathLine).replace(listItemRegex, '');
                                                
                                                let pathName;
                                                const boldMatch = lineContent.match(/\*\*(.*?)\*\*/);
                                                if (boldMatch) {
                                                    pathName = boldMatch[1];
                                                } else {
                                                    const separatorMatch = lineContent.match(/:(?!\/)| - /);
                                                    pathName = separatorMatch ? lineContent.substring(0, separatorMatch.index) : lineContent;
                                                }
                                                pathName = pathName.trim().replace(/:$/, '').trim();
                                                
                                                if (!pathName) return null;

                                                const formattedLine = lineContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent font-semibold">$1</strong>');
                                                
                                                return (
                                                    <div key={pathName + index}>
                                                        <input
                                                            type="radio"
                                                            name="career-path-option"
                                                            id={`path-${index}`}
                                                            value={pathName}
                                                            checked={selectedPath === pathName}
                                                            onChange={(e) => setSelectedPath(e.target.value)}
                                                            className="sr-only"
                                                        />
                                                        <label
                                                            htmlFor={`path-${index}`}
                                                            className={`cursor-pointer block p-4 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden ${
                                                                selectedPath === pathName
                                                                    ? 'border-accent bg-accent/10'
                                                                    : 'border-card-border hover:border-accent/50 hover:bg-accent/5'
                                                            }`}
                                                        >
                                                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${selectedPath === pathName ? 'bg-accent border-accent' : 'border-card-border group-hover:border-accent/50'}`}>
                                                                {selectedPath === pathName && <CheckIcon className="w-3 h-3 text-white"/>}
                                                            </div>
                                                            <p dangerouslySetInnerHTML={{ __html: formattedLine }} className="text-sm md:text-base pr-6" />
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        { detailedReportContent ? (
                                            <div className="mt-6 text-center space-y-3 animate-fade-in">
                                                <p className="text-sm font-medium text-green-500 dark:text-green-400">
                                                    <CheckIcon className="w-5 h-5 inline-block mr-1" />
                                                    Your detailed report is ready!
                                                </p>
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => createPdfFromMarkdown(detailedReportContent, selectedPath)}
                                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 px-6 rounded-lg hover:bg-accent-hover transition-colors duration-300"
                                                    >
                                                        <DownloadIcon className="w-5 h-5" /> Download Report
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGeneratePdfClick}
                                                disabled={!selectedPath || isGeneratingPdf || roadmapLimitReached}
                                                className="mt-6 w-full flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-accent-hover disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg hover:shadow-accent/30"
                                            >
                                                {isGeneratingPdf ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Please wait while we generate your PDF...
                                                    </>
                                                ) : roadmapLimitReached ? (
                                                    'Roadmap Limit Reached'
                                                ) : (
                                                    <><DownloadIcon className="w-5 h-5" /> Generate Detailed PDF</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    )}
                                </div>
                                );
                            })() : (
                                <FormattedContent content={editedReportData[key]} />
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};