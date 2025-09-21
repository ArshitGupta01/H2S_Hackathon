


import React, { useState, useCallback } from 'react';
import { questions, Question } from '../data/questions.ts';

interface QuestionnaireProps {
    onSubmit: (answers: Record<string, any>, duration: number) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [roadmapDuration, setRoadmapDuration] = useState(3);
    const [specificJob, setSpecificJob] = useState('');
    const [country, setCountry] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleAnswer = (questionId: string, value: string) => {
        setValidationError('');
        const currentQuestion = questions.find(q => q.id === questionId);
        if (!currentQuestion) return;

        setAnswers(prev => {
            if (currentQuestion.type === 'multiple-choice') {
                const existing = prev[questionId] || [];
                const newSelection = existing.includes(value)
                    ? existing.filter((item: string) => item !== value)
                    : [...existing, value];
                return { ...prev, [questionId]: newSelection };
            }
            return { ...prev, [questionId]: value };
        });
    };

    const isSpecificPath = answers['has_job_in_mind'] === 'Yes';
    const mainQuestions = questions.slice(1);
    const totalSteps = isSpecificPath ? 3 : mainQuestions.length + 2; // Q0 + specific job + duration OR Q0 + all other questions + duration
    
    const isCurrentQuestionAnswered = (): boolean => {
        if (currentStep === 0) {
            return !!answers['has_job_in_mind'];
        }

        if (isSpecificPath) {
            if (currentStep === 1) {
                return specificJob.trim() !== '';
            }
            return true;
        }

        const questionIndex = currentStep - 1;
        
        if (questionIndex >= 0 && questionIndex < mainQuestions.length) {
            const question = mainQuestions[questionIndex];

            if (question.text.toLowerCase().includes('(optional)')) {
                return true;
            }

            const answer = answers[question.id];

            if (question.type === 'multiple-choice') {
                return Array.isArray(answer) && answer.length > 0;
            }
            
            return !!answer;
        }

        return true;
    };

    const handleNext = useCallback(() => {
        if (!isCurrentQuestionAnswered()) {
            if (currentStep === 0) {
                setValidationError('Please make a choice to proceed.');
            } else if (isSpecificPath && currentStep === 1) {
                setValidationError('Please enter your desired career path.');
            } else {
                setValidationError('Please select at least one option to continue.');
            }
            return;
        }
        setValidationError('');

        // If on the first question and choosing the specific path, go to the job input step
        if (currentStep === 0 && isSpecificPath) {
            setCurrentStep(1);
            return;
        }
        // If on the specific job input step, jump to the final duration step
        if (currentStep === 1 && isSpecificPath) {
            setCurrentStep(2);
            return;
        }
        // Normal questionnaire flow: Allow advancing from the last question to the duration step.
        if (currentStep <= mainQuestions.length) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, answers, specificJob, mainQuestions.length]);

    const handleBack = () => {
        if (currentStep > 0) {
            setValidationError('');
            setCurrentStep(prev => prev - 1);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (country.trim() === '') {
            setValidationError("Please enter your country to get tailored results.");
            return;
        }
        setValidationError('');
        const submissionData = isSpecificPath 
            ? { specificJob, country, additionalInfo: answers.additionalInfo || '' } 
            : { ...answers, country };
        onSubmit(submissionData, roadmapDuration);
    }
    
    const renderContent = () => {
        if (currentStep === 0) {
             const question = questions[0];
            return (
                 <div key={question.id} className="animate-slide-in">
                    <h2 className="text-3xl mb-8 text-center" style={{fontFamily: 'var(--font-heading)'}}>{question.text}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {question.options.map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleAnswer(question.id, option.value)}
                                className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center text-center h-40 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 relative ${
                                    answers[question.id] === option.value ? 'border-accent bg-accent/10' : 'border-card-border hover:border-accent/50'
                                }`}
                            >
                                <span className="text-4xl mb-3 transition-transform duration-200 group-hover:scale-110">{option.icon}</span>
                                <span className="font-semibold text-lg">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (isSpecificPath) {
            if (currentStep === 1) { // Specific job input
                const popularCareers = ["Software Engineer", "Data Scientist", "UX/UI Designer", "Product Manager", "Cybersecurity Analyst", "Cloud Engineer"];
                return (
                    <div key="specific-job-step" className="animate-slide-in">
                        <h2 className="text-3xl mb-4 text-center" style={{fontFamily: 'var(--font-heading)'}}>What career path are you interested in?</h2>
                        <p className="text-text-secondary mb-8 text-center">Enter the job title, or select from the suggestions below.</p>
                        <input
                            type="text"
                            value={specificJob}
                            onChange={(e) => { setSpecificJob(e.target.value); setValidationError(''); }}
                            placeholder="e.g., Software Engineer, UX Designer..."
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary placeholder:text-text-secondary text-lg"
                        />
                         <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {popularCareers.map(career => (
                                <button
                                    key={career}
                                    onClick={() => setSpecificJob(career)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                                        specificJob === career 
                                        ? 'bg-accent text-white' 
                                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-text-secondary'
                                    }`}
                                >
                                    {career}
                                </button>
                            ))}
                        </div>
                        <h2 className="text-2xl mb-4 mt-10 text-center" style={{fontFamily: 'var(--font-heading)'}}>Any prior experience? (Optional)</h2>
                        <p className="text-text-secondary mb-6 text-center max-w-lg mx-auto">Mention any internships, projects, or work experience. This helps the AI create a more tailored report.</p>
                        <textarea
                            value={answers.additionalInfo || ''}
                            onChange={(e) => handleAnswer('additionalInfo', e.target.value)}
                            placeholder={'e.g., "interned as.....", "built something....", "used to host, speak on......."'}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary placeholder:text-text-secondary text-base resize-y"
                            rows={6}
                            aria-label="Your prior experience and additional info"
                        />
                    </div>
                )
            }
             if (currentStep === 2) { // Duration step for specific path
                 return renderDurationStep();
             }
        }
        
        const questionIndex = currentStep - 1;
        if (questionIndex < mainQuestions.length) {
            const question = mainQuestions[questionIndex];
            
            if (question.type === 'textarea') {
                return (
                    <div key={question.id} className="animate-slide-in">
                        <h2 className="text-3xl mb-4 text-center" style={{fontFamily: 'var(--font-heading)'}}>{question.text}</h2>
                        {question.subtext && <p className="text-text-secondary mb-8 text-center max-w-lg mx-auto">{question.subtext}</p>}
                        <textarea
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                            placeholder={question.placeholder}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary placeholder:text-text-secondary text-base resize-y"
                            rows={6}
                            aria-label={question.text}
                        />
                    </div>
                );
            }

            return (
                <div key={question.id} className="animate-slide-in">
                    <h2 className="text-3xl mb-8 text-center" style={{fontFamily: 'var(--font-heading)'}}>{question.text}</h2>
                    <div className={`grid grid-cols-1 ${question.options.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-6`}>
                        {question.options.map(option => {
                            const isSelected = question.type === 'multiple-choice'
                                ? answers[question.id]?.includes(option.value)
                                : answers[question.id] === option.value;
                            
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleAnswer(question.id, option.value)}
                                    className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center text-center h-40 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 ${
                                        isSelected ? 'border-accent bg-accent/10' : 'border-card-border hover:border-accent/50'
                                    }`}
                                >
                                    <span className="text-4xl mb-3 transition-transform duration-200 group-hover:scale-110">{option.icon}</span>
                                    <span className="font-semibold text-lg">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }
        
        return renderDurationStep();
    }

    const renderDurationStep = () => (
         <div key="duration-step" className="animate-slide-in text-center">
            <h2 className="text-3xl mb-4" style={{fontFamily: 'var(--font-heading)'}}>What country are you in?</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">This helps us tailor suggestions to your local job market.</p>
            <input
                type="text"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setValidationError(''); }}
                placeholder="e.g., United States, India, Nigeria"
                className="w-full max-w-md mx-auto p-4 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary placeholder:text-text-secondary text-lg"
                aria-label="Your country"
            />
             <h2 className="text-3xl mb-6 mt-12" style={{fontFamily: 'var(--font-heading)'}}>How long is your planned career journey?</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">Select a duration for your personalized roadmap.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
                {[1, 2, 3, 4, 5].map((year) => (
                    <button
                        key={year}
                        type="button"
                        onClick={() => setRoadmapDuration(year)}
                        className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 ${
                            roadmapDuration === year
                                ? 'bg-accent text-white shadow-md'
                                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-text-secondary'
                        }`}
                    >
                        {year} Year{year > 1 ? 's' : ''}
                    </button>
                ))}
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 rounded-full px-4">
                    <label htmlFor="custom-duration" className="text-sm font-semibold text-text-secondary">
                        Other:
                    </label>
                    <input
                        id="custom-duration"
                        type="number"
                        value={roadmapDuration}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setRoadmapDuration(isNaN(val) || val < 1 ? 1 : val > 20 ? 20 : val);
                        }}
                        className="w-16 py-2 bg-transparent border-none focus:ring-0 text-center font-semibold text-accent"
                        min="1"
                        max="20"
                        aria-label="Custom roadmap duration in years"
                    />
                    <span className="text-sm text-text-secondary">
                        Years
                    </span>
                </div>
            </div>
        </div>
    );
    
    const progress = Math.min(100, Math.round(((currentStep) / (totalSteps -1)) * 100));
    const isLastStep = isSpecificPath ? currentStep === 2 : currentStep > mainQuestions.length;

    return (
        <div className="relative animate-fade-in">
            <div className="glass-card p-6 sm:p-10 transition-colors duration-300">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                            { currentStep === 0 ? questions[0].section : isSpecificPath ? 'Your Career Path' : mainQuestions[currentStep-1]?.section || 'Final Step'}
                        </span>
                        <span className="text-sm text-text-secondary font-medium">{currentStep + 1} / {totalSteps}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {renderContent()}

                <div className="mt-12">
                    <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-between sm:items-center min-h-[48px]">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="w-full sm:w-auto px-8 py-3 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Back
                        </button>
                        {isLastStep ? (
                            <button
                                onClick={handleSubmit}
                                className="w-full sm:w-auto px-8 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold transition-colors shadow-lg hover:shadow-green-500/30"
                            >
                                Generate Report
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="w-full sm:w-auto px-8 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-bold transition-colors"
                            >
                                Next
                            </button>
                        )}
                    </div>
                     {validationError && (
                        <p className="text-red-500 text-center font-semibold mt-4 animate-fade-in" role="alert">
                            {validationError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};