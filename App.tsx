





import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { generateCareerReport, generateDetailedRoadmap } from './services/geminiService.ts';
import { ReportDisplay } from './components/ReportDisplay.tsx';
import { SyncIcon } from './components/Icons.tsx';
import { Footer } from './components/Footer.tsx';
import { ReportSkeleton } from './components/ReportSkeleton.tsx';
import { LoadingModal } from './components/MotivationModal.tsx';
import { StarfieldBackground } from './components/Starfield.tsx';
import { Questionnaire } from './components/Questionnaire.tsx';
import { IntroSection } from './components/IntroSection.tsx';
import { HistoryItem, ReportData } from './types.ts';
import Chatbot from './components/Chatbot.tsx';
import { Settings } from './components/Settings.tsx';
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx';
import { sanitizeHTML } from './sanitizer.ts';

type Theme = 'light' | 'dark';

const ROADMAP_GENERATION_LIMIT = 5;
const CHAT_LIMIT = 25;
const DEFAULT_CHAT_KEYWORDS = ["Software Development", "UX Design", "Data Science", "Soft Skills"];

const SECTION_MAP: { key: keyof ReportData, title: string }[] = [
    { key: 'careerPaths', title: 'Career Paths' },
    { key: 'skillsToDevelop', title: 'Skills to Develop' },
    { key: 'languagesToLearn', title: 'Languages to Learn' },
    { key: 'learningResources', title: 'Learning Resources' },
    { key: 'roadmap', title: 'Roadmap' }, // Kept for parsing, but won't be displayed
];

const createPdfFromMarkdown = async (markdown: string, title: string) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const availableWidth = pageWidth - margin * 2;
    let y = margin;
    let inCodeBlock = false;

    // Helper to add a new page if needed
    const checkPageBreak = (contentHeight: number) => {
        if (y + contentHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    let cleanedMarkdown = markdown;
    const diagramDataRegex = /\[ROADMAP_DIAGRAM_DATA\]\s*\n([\s\S]*?)\n\s*\[\/ROADMAP_DIAGRAM_DATA\]/;
    const diagramMatch = markdown.match(diagramDataRegex);
    
    if (diagramMatch) {
        cleanedMarkdown = markdown.replace(diagramMatch[0], '[DIAGRAM_PLACEHOLDER]');
    }

    // Render title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 15;

    const lines = cleanedMarkdown.split('\n');

    for (const line of lines) {
        const sanitizedLine = sanitizeHTML(line);
        // Stop processing when the detailed roadmap section is reached.
        if (sanitizedLine.startsWith('## Detailed Roadmap')) {
            break;
        }
        
        if (sanitizedLine.trim() === '[DIAGRAM_PLACEHOLDER]' && diagramMatch) {
            y += 5; // Some spacing
            
            const diagramContent = diagramMatch[1];
            const yearTitles = diagramContent
                .split('\n')
                .map(line => line.trim().replace(/^\s*[-*]\s*/, ''))
                .filter(line => line);
            
            if (yearTitles.length > 0) {
                const boxWidth = availableWidth * 0.9;
                const boxHeight = 18;
                const boxX = margin + (availableWidth - boxWidth) / 2;
                const spaceBetweenBoxes = 10;
                const totalDiagramHeight = (boxHeight + spaceBetweenBoxes) * yearTitles.length - spaceBetweenBoxes;
                
                checkPageBreak(totalDiagramHeight + 10);

                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(11);

                for (let i = 0; i < yearTitles.length; i++) {
                    const yearTitle = yearTitles[i];
                    
                    // Draw box
                    doc.setDrawColor(25, 25, 112); // Navy
                    doc.setFillColor(227, 237, 255); // Lightblue-ish
                    doc.setLineWidth(0.4);
                    doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'FD');

                    // Draw text
                    doc.setTextColor(25, 25, 112); // Navy text
                    doc.setFont('Helvetica', 'bold');
                    const splitTitle = doc.splitTextToSize(yearTitle, boxWidth - 6);
                    doc.text(splitTitle, boxX + boxWidth / 2, y + boxHeight / 2, { align: 'center', baseline: 'middle' });

                    // Draw connecting line
                    if (i < yearTitles.length - 1) {
                        const lineX = boxX + boxWidth / 2;
                        const lineStartY = y + boxHeight;
                        const lineEndY = lineStartY + spaceBetweenBoxes;
                        doc.setDrawColor(25, 25, 112); // Navy
                        doc.setLineWidth(0.5);
                        doc.line(lineX, lineStartY, lineX, lineEndY);
                        
                        // Arrowhead
                        doc.setFillColor(25, 25, 112);
                        doc.triangle(lineX, lineEndY, lineX - 1.5, lineEndY - 3, lineX + 1.5, lineEndY - 3, 'F');
                    }
                    
                    y += boxHeight + spaceBetweenBoxes;
                }
                 y += 5; // spacing after diagram
            }
            continue;
        }

        if (sanitizedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            y += 2;
            continue;
        }

        if (inCodeBlock) {
            const fontSize = 9;
            const lineHeight = fontSize * 0.4;
            doc.setFont('Courier', 'normal');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(sanitizedLine, availableWidth);
            const contentHeight = splitText.length * lineHeight;
            checkPageBreak(contentHeight);
            // Re-apply font settings after page break
            doc.setFont('Courier', 'normal');
            doc.setFontSize(fontSize);
            doc.text(splitText, margin, y);
            y += contentHeight + 1;
            continue;
        }
        
        if (sanitizedLine.startsWith('# ')) {
            const fontSize = 18;
            const text = sanitizedLine.substring(2);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(text, availableWidth);
            const contentHeight = splitText.length * (fontSize * 0.4);
            checkPageBreak(contentHeight);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.text(splitText, margin, y);
            y += contentHeight + 6;
        } else if (sanitizedLine.startsWith('## ')) {
            const fontSize = 16;
            const text = sanitizedLine.substring(3);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(text, availableWidth);
            const contentHeight = splitText.length * (fontSize * 0.4);
            checkPageBreak(contentHeight);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.text(splitText, margin, y);
            y += contentHeight + 5;
        } else if (sanitizedLine.startsWith('### ')) {
            const fontSize = 14;
            const text = sanitizedLine.substring(4);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(text, availableWidth);
            const contentHeight = splitText.length * (fontSize * 0.4);
            checkPageBreak(contentHeight);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.text(splitText, margin, y);
            y += contentHeight + 4;
        } else if (sanitizedLine.trim().startsWith('* ') || sanitizedLine.trim().startsWith('- ')) {
            const fontSize = 11;
            const text = sanitizedLine.trim().replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(text, availableWidth - 5);
            const contentHeight = splitText.length * (fontSize * 0.4);
            checkPageBreak(contentHeight);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(fontSize);
            doc.text('•', margin, y);
            doc.text(splitText, margin + 5, y);
            y += contentHeight + 2;
        } else if (sanitizedLine.trim() === '') {
            y += 4;
        } else {
            const fontSize = 11;
            const text = sanitizedLine.replace(/\*\*(.*?)\*\*/g, '$1');
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(fontSize);
            const splitText = doc.splitTextToSize(text, availableWidth);
            const contentHeight = splitText.length * (fontSize * 0.4);
            checkPageBreak(contentHeight);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(fontSize);
            doc.text(splitText, margin, y);
            y += contentHeight + 2;
        }
    }
    doc.save(`${title.replace(/[\s/]/g, '-')}-Report.pdf`);
};

const MemoizedReportDisplay = memo(ReportDisplay);
const MemoizedQuestionnaire = memo(Questionnaire);
const MemoizedIntroSection = memo(IntroSection);


const App: React.FC = () => {
    const [report, setReport] = useState('');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [editedReportData, setEditedReportData] = useState<ReportData | null>(null);
    const [appState, setAppState] = useState<'intro' | 'questionnaire' | 'loading' | 'report'>('intro');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState('');
    const [originalAnswers, setOriginalAnswers] = useState<Record<string, any>>({});
    const [roadmapDuration, setRoadmapDuration] = useState(3);
    const resultsRef = useRef<HTMLDivElement>(null);
    
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [detailedReportContent, setDetailedReportContent] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>('dark');
    const [roadmapCount, setRoadmapCount] = useState(0);
    const [chatCount, setChatCount] = useState(0);
    const [showHistoryPopup, setShowHistoryPopup] = useState(false);
    const hasShownHistoryPopup = useRef(false);

    const isLoading = appState === 'loading';

    useEffect(() => {
        // Trigger popup the first time the user sees a report in a session
        if (appState === 'report' && history.length > 0 && !hasShownHistoryPopup.current) {
            setShowHistoryPopup(true);
            hasShownHistoryPopup.current = true;
        }
    }, [appState, history]);

    useEffect(() => {
        if (showHistoryPopup) {
            const timer = setTimeout(() => {
                setShowHistoryPopup(false);
            }, 7000); // Disappears after 7 seconds
            return () => clearTimeout(timer);
        }
    }, [showHistoryPopup]);

    useEffect(() => {
        // Load usage counts from localStorage on initial render
        const savedRoadmapCount = localStorage.getItem('roadmapGenerationCount');
        if (savedRoadmapCount) {
            setRoadmapCount(JSON.parse(savedRoadmapCount));
        }
        const savedChatCount = localStorage.getItem('chatMessageCount');
        if (savedChatCount) {
            setChatCount(JSON.parse(savedChatCount));
        }

        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('reportHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to parse history from localStorage", e);
            setHistory([]);
        }
    }, []);
    
     useEffect(() => {
        const starfieldCanvas = document.getElementById('starfield');
        if (!starfieldCanvas) return;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            starfieldCanvas.style.transform = `translateY(${scrollY * 0.1}px)`;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        // Interactive Glow Effect for glass-cards (mouse devices only)
        const mediaQuery = window.matchMedia('(pointer: fine)');

        if (mediaQuery.matches) {
            const handleMouseMove = (e: MouseEvent) => {
                const card = e.currentTarget as HTMLElement;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            };

            const cards = document.querySelectorAll('.glass-card');
            cards.forEach(card => {
                card.addEventListener('mousemove', handleMouseMove as EventListener);
            });

            return () => {
                cards.forEach(card => {
                    card.removeEventListener('mousemove', handleMouseMove as EventListener);
                });
            };
        }
    }, [appState]); // Re-apply when view changes

    const extractKeywords = (data: ReportData): string[] => {
        const combinedText = data.skillsToDevelop + '\n' + data.careerPaths + '\n' + data.languagesToLearn;
        const matches = combinedText.matchAll(/\*\*(.*?)\*\*/g);
        const keywords = [...new Set(Array.from(matches, m => m[1].replace(/:$/, '').trim()))];
        
        const excluded = ['Year', 'Q1', 'Q2', 'Q3', 'Q4'];
        const filteredKeywords = keywords.filter(k => !excluded.some(ex => k.includes(ex)) && k.length > 2);
        
        const shuffled = filteredKeywords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    };

    const parseReport = (reportText: string): ReportData => {
        const sections: ReportData = {
            careerPaths: '', skillsToDevelop: '', languagesToLearn: '', learningResources: '', roadmap: '',
        };

        for (let i = 0; i < SECTION_MAP.length; i++) {
            const currentSection = SECTION_MAP[i];
            const nextSection = SECTION_MAP[i + 1];

            const regexStart = new RegExp(`\\*\\*${currentSection.title}\\*\\*`, 'i');
            const matchStart = reportText.match(regexStart);
            
            if (!matchStart || typeof matchStart.index === 'undefined') continue;

            const startIndex = matchStart.index + matchStart[0].length;
            let endIndex = reportText.length;

            if (nextSection) {
                const regexEnd = new RegExp(`\\*\\*${nextSection.title}\\*\\*`, 'i');
                const matchEnd = reportText.match(regexEnd);
                if (matchEnd && typeof matchEnd.index !== 'undefined') {
                    endIndex = matchEnd.index;
                }
            }
            const emojiDelimiters = /🎯|🛠|🗣️|📚|🗺️/;
            const nextEmojiMatch = reportText.substring(startIndex).match(emojiDelimiters);
            if(nextEmojiMatch && typeof nextEmojiMatch.index !== 'undefined'){
                const emojiEndIndex = startIndex + nextEmojiMatch.index;
                if(emojiEndIndex < endIndex) {
                    endIndex = emojiEndIndex;
                }
            }

            sections[currentSection.key] = reportText.substring(startIndex, endIndex).trim();
        }
        return sections;
    };


    const saveReportToHistory = (answers: Record<string, any>, report: string, duration: number) => {
        const countryText = answers.country ? ` in ${answers.country}` : '';
        const summary = answers.specificJob 
            ? `Specific Path: ${answers.specificJob}${countryText}`
            : `Interests: ${answers.subjects?.join(', ') || 'N/A'}. Skills: ${answers.strengths?.join(', ') || 'N/A'}${countryText}`;
        const newItem: HistoryItem = { id: new Date().toISOString(), answers, summary, report, duration };
        const updatedHistory = [newItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('reportHistory', JSON.stringify(updatedHistory));
    };
    
    const loadReportFromHistory = (item: HistoryItem) => {
        const parsedData = parseReport(item.report);
        setReport(item.report);
        setReportData(parsedData);
        setEditedReportData(parsedData);
        setOriginalAnswers(item.answers);
        setRoadmapDuration(item.duration);
        setKeywords(extractKeywords(parsedData));
        setDetailedReportContent(null);
        setError('');
        setAppState('report');
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('reportHistory');
    };

    const handleQuestionnaireSubmit = useCallback(async (answers: Record<string, any>, duration: number) => {
        setAppState('loading');
        setReport('');
        setReportData(null);
        setEditedReportData(null);
        setDetailedReportContent(null);
        setError('');
        setOriginalAnswers(answers);
        setRoadmapDuration(duration);

        try {
            const result = await generateCareerReport(answers, duration);
            if (result.startsWith("🚧") || result.toLowerCase().includes("an error occurred")) {
                setError(result);
                setReport('');
                setReportData(null);
                setEditedReportData(null);
            } else if (!result || !result.includes('**Career Paths**')) {
                setError("🚧 The AI model is currently experiencing high demand or could not process your request. This can be a temporary issue. Please try again in a moment.");
                setReport('');
                setReportData(null);
                setEditedReportData(null);
            } else {
                setReport(result);
                const parsed = parseReport(result);
                setReportData(parsed);
                setEditedReportData(parsed);
                setKeywords(extractKeywords(parsed));
                saveReportToHistory(answers, result, duration);
            }
        } catch (err) {
            setError('Failed to generate the report. Please try again.');
            console.error(err);
        } finally {
            setAppState('report');
        }
    }, [history]);

    const incrementRoadmapCount = () => {
        const newCount = roadmapCount + 1;
        setRoadmapCount(newCount);
        localStorage.setItem('roadmapGenerationCount', JSON.stringify(newCount));
    };
    
    const handleGenerateDetailedReport = async (selectedPath: string) => {
        if (!originalAnswers || !report || !selectedPath || isGeneratingPdf || roadmapCount >= ROADMAP_GENERATION_LIMIT) return;

        setIsGeneratingPdf(true);
        setDetailedReportContent(null);
        setError('');

        try {
            const detailedContent = await generateDetailedRoadmap(originalAnswers, report, selectedPath, roadmapDuration);
            if (detailedContent.startsWith("🚧") || detailedContent.toLowerCase().includes("an error occurred")) {
                setError(detailedContent);
            } else if (!detailedContent || !detailedContent.includes('## Detailed Roadmap')) {
                setError("🚧 The AI model is currently experiencing high demand or could not generate the detailed roadmap. This can be a temporary issue. Please try again in a moment.");
                setDetailedReportContent(null);
            } else {
                setDetailedReportContent(detailedContent);
                incrementRoadmapCount();
            }
        } catch (err) {
            setError('Failed to generate the PDF report. Please try again.');
            console.error(err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleRegenerate = useCallback(async () => {
        if (!originalAnswers || !editedReportData || isRegenerating || originalAnswers.specificJob) return;

        setIsRegenerating(true);
        setError('');
        
        const context = `I have made some adjustments to a previous report. Please regenerate the entire report, taking my edits into account as the new source of truth for those sections. Refine the other sections to align with my changes. The roadmap should be for a ${roadmapDuration}-year duration.\n\nMy edits:\n🎯 **Career Paths**\n${editedReportData.careerPaths}\n\n🛠 **Skills to Develop**\n${editedReportData.skillsToDevelop}\n\n🗣️ **Languages to Learn**\n${editedReportData.languagesToLearn}\n\n📚 **Learning Resources**\n${editedReportData.learningResources}\n\n🗺️ **Roadmap**\n${editedReportData.roadmap}`;

        try {
            const result = await generateCareerReport(originalAnswers, roadmapDuration, context);
            if (result.startsWith("🚧") || result.toLowerCase().includes("an error occurred")) {
                setError(result);
            } else if (!result || !result.includes('**Career Paths**')) {
                setError("🚧 The AI model is currently experiencing high demand or could not process your request. This can be a temporary issue. Please try again in a moment.");
            } else {
                setReport(result);
                const parsed = parseReport(result);
                setReportData(parsed);
                setEditedReportData(parsed);
                setKeywords(extractKeywords(parsed));
                setDetailedReportContent(null);
                saveReportToHistory(originalAnswers, result, roadmapDuration);
            }
        } catch (err) {
            setError('Failed to regenerate the report. Please try again.');
            console.error(err);
        } finally {
            setIsRegenerating(false);
        }
    }, [originalAnswers, editedReportData, isRegenerating, history, roadmapDuration]);

    const handleUpdateSection = useCallback((section: keyof ReportData, content: string) => {
        setEditedReportData(prev => prev ? { ...prev, [section]: content } : null);
    }, []);
    
    const handleStartOver = useCallback(() => {
        setReport('');
        setReportData(null);
        setEditedReportData(null);
        setDetailedReportContent(null);
        setError('');
        setOriginalAnswers({});
        setAppState('intro');
    }, []);

    const hasEdits = reportData && editedReportData && JSON.stringify(reportData) !== JSON.stringify(editedReportData);

    const incrementUnreadCount = () => {
        setUnreadCount(prev => prev + 1);
    };

    const resetUnreadCount = () => {
        setUnreadCount(0);
    };

    const incrementChatCount = () => {
        const newCount = chatCount + 1;
        setChatCount(newCount);
        localStorage.setItem('chatMessageCount', JSON.stringify(newCount));
    };
    
    const handleGetStarted = useCallback(() => {
        setAppState('questionnaire');
    }, []);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col relative z-10">
            <StarfieldBackground theme={theme} />
            <LoadingModal isOpen={isLoading} />
            <main className="max-w-6xl mx-auto w-full flex-grow relative">
                <header className="relative text-center my-12 animate-fade-in">
                    <div className="absolute top-0 right-0 z-20">
                        <ThemeSwitcher theme={theme} setTheme={setTheme} />
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400" style={{ fontFamily: 'var(--font-heading)' }}>
                        AI Career Advisor
                    </h1>
                    <p className="hidden sm:block mt-3 text-lg text-text-secondary">
                        Your personal guide to the future starts now.
                    </p>
                </header>

                {appState === 'intro' && (
                    <MemoizedIntroSection onGetStartedClick={handleGetStarted} />
                )}

                {appState === 'questionnaire' && (
                    <div className="pt-8">
                        <MemoizedQuestionnaire onSubmit={handleQuestionnaireSubmit} />
                    </div>
                )}
                
                {appState === 'loading' && (
                    <div ref={resultsRef} className="mt-6" aria-live="assertive">
                        <ReportSkeleton />
                    </div>
                )}
                
                {appState === 'report' && (
                    <>
                        <div ref={resultsRef} className="mt-6" aria-live="assertive">
                            {error && <div className="glass-card bg-red-900/50 border-red-700 text-red-300 p-4 rounded-lg text-center animate-fade-in" role="alert">{error}</div>}
                            
                            {reportData && editedReportData && (
                                <>
                                    <div className="my-8 text-center animate-fade-in regenerate-button-container">
                                        <div className="flex items-center justify-center gap-4">
                                            { !originalAnswers.specificJob && (
                                                <button
                                                    onClick={handleRegenerate}
                                                    disabled={!hasEdits || isRegenerating}
                                                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-indigo-700 disabled:bg-slate-500 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-indigo-500/40"
                                                >
                                                    {isRegenerating ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                            Regenerating...
                                                        </>
                                                    ) : (
                                                        <><SyncIcon className="w-5 h-5" /> Regenerate</>
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={handleStartOver}
                                                disabled={isRegenerating}
                                                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-card-border text-text-primary font-semibold py-3 px-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-300 disabled:opacity-50"
                                            >
                                                Start Over
                                            </button>
                                        </div>
                                        { !originalAnswers.specificJob && (
                                            <p className="text-sm text-text-secondary mt-3">
                                                Made some changes? Regenerate the report. Or, start fresh with new answers.
                                            </p>
                                        )}
                                    </div>

                                    <MemoizedReportDisplay 
                                        report={report} 
                                        reportData={reportData} 
                                        editedReportData={editedReportData}
                                        onUpdateSection={handleUpdateSection}
                                        onGenerateDetailedReport={handleGenerateDetailedReport}
                                        isGeneratingPdf={isGeneratingPdf}
                                        detailedReportContent={detailedReportContent}
                                        createPdfFromMarkdown={createPdfFromMarkdown}
                                        allowEditing={!originalAnswers.specificJob}
                                        roadmapGenerationCount={roadmapCount}
                                        roadmapGenerationLimit={ROADMAP_GENERATION_LIMIT}
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>
            {showHistoryPopup && (
                <div className="fixed bottom-24 left-6 z-40 w-max max-w-[200px] glass-card text-text-primary px-4 py-3 shadow-lg animate-fade-in text-sm" role="tooltip">
                    <p>You can view your recent reports here!</p>
                    <div className="absolute left-6 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-card-bg"></div>
                </div>
            )}
            <Settings 
                onClearHistory={clearHistory}
                roadmapCount={roadmapCount}
                roadmapLimit={ROADMAP_GENERATION_LIMIT}
                chatCount={chatCount}
                chatLimit={CHAT_LIMIT}
                history={history}
                onSelectReport={loadReportFromHistory}
            />
            <Chatbot 
                isVisible={!isLoading}
                keywords={reportData ? keywords : DEFAULT_CHAT_KEYWORDS}
                unreadCount={unreadCount}
                onIncrementUnread={incrementUnreadCount}
                onResetUnread={resetUnreadCount}
                messageCount={chatCount}
                messageLimit={CHAT_LIMIT}
                onIncrementMessageCount={incrementChatCount}
            />
            <Footer />
        </div>
    );
}

export default App;