import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons.tsx';
import { FeatureShowcase } from './FeatureShowcase.tsx';

// --- START of new FAQ Section ---
const faqData = [
    {
        question: "How does the AI generate my career roadmap?",
        answer: "Our AI uses Google's Gemini model. It analyzes your answers about your interests, skills, and preferences to identify patterns and match them with a vast database of career paths. It considers your country to provide relevant, localized advice, including job market trends and learning resources."
    },
    {
        question: "Is my data safe and private?",
        answer: "Yes. Your privacy is a priority. Your answers are only used to generate your report during your session. We automatically save your report history to your browser's local storage for your convenience, but this data never leaves your device. We do not store your personal information on our servers."
    },
    {
        question: "What kinds of careers does this cover?",
        answer: "AI Career Advisor covers all kinds of careers and fields, but it is highly focused on the tech industry. You'll find the most detailed guidance for roles like software development, UX design, data science, and cybersecurity, but you can get suggestions for many other areas as well."
    },
    {
        question: "Is this service really free?",
        answer: "Yes, generating your personalized career report is completely free. Our goal is to make high-quality career guidance accessible to everyone."
    }
];

const FaqItem: React.FC<{ item: typeof faqData[0]; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
    const answerId = `faq-answer-${item.question.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="border-b border-card-border">
            <h3 className="text-lg">
                <button
                    onClick={onClick}
                    className="flex w-full items-center justify-between py-5 text-left font-semibold text-text-primary"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                >
                    <span>{item.question}</span>
                    <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </h3>
            <div
                id={answerId}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <p className="pb-5 pr-4 text-text-secondary">
                        {item.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section aria-labelledby="faq-heading" className="mt-24 max-w-3xl mx-auto">
             <h2 id="faq-heading" className="text-4xl mb-8 text-center" style={{fontFamily: 'var(--font-heading)'}}>Frequently Asked Questions</h2>
             <div className="space-y-2">
                 {faqData.map((item, index) => (
                    <FaqItem 
                        key={item.question} 
                        item={item} 
                        isOpen={openIndex === index}
                        onClick={() => handleClick(index)}
                    />
                 ))}
             </div>
        </section>
    )
};
// --- END of new FAQ Section ---

interface IntroSectionProps {
    onGetStartedClick: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ onGetStartedClick }) => {
    return (
        <section aria-labelledby="how-it-works-heading" className="my-16 text-center animate-fade-in">
             <button
                onClick={onGetStartedClick}
                className="group mb-20 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base sm:text-lg py-3 px-6 sm:py-4 sm:px-10 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/40 animate-button-pulse"
            >
                Start My Journey
                <ChevronDownIcon className="w-6 h-6 transition-transform duration-300 group-hover:translate-y-1" />
            </button>

            <h2 id="how-it-works-heading" className="text-4xl mb-12" style={{fontFamily: 'var(--font-heading)'}}>How It Works</h2>

            <div className="mt-12">
                <FeatureShowcase />
            </div>

            <FAQSection />
        </section>
    );
};