import React, { useState, useEffect, useRef, useReducer, memo, useLayoutEffect, useCallback } from 'react';
import { ChatService } from '../services/geminiService.ts';
import { ChatbotIcon, XMarkIcon, PaperAirplaneIcon, ThumbUpIcon, ThumbDownIcon, MinusIcon, ChevronUpIcon, LightBulbIcon } from './Icons.tsx';
import { sanitizeHTML } from '../sanitizer.ts';

// --- TYPES AND STATE MANAGEMENT ---

type ChatbotState = 'closed' | 'open';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface ChatState {
    messages: Message[];
    isLoading: boolean;
}

type ChatAction =
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'STREAM_CHUNK'; payload: string }
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'SET_LOADING'; payload: boolean };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'STREAM_CHUNK': {
             if (state.messages.length === 0 || state.messages[state.messages.length - 1].sender !== 'ai') {
                return { ...state, messages: [...state.messages, { sender: 'ai', text: action.payload }] };
            }
            const newMessages = [...state.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = {
                ...lastMessage,
                text: lastMessage.text + action.payload,
            };
            return { ...state, messages: newMessages };
        }
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
};

const INITIAL_HELPER_MESSAGE: Message = {
    sender: 'ai',
    text: "Hey there! I'm here to help you understand more about different career fields and skills. Feel free to ask me anything.",
};

// --- INTERNAL SUB-COMPONENTS ---

const FloatingButton = memo(({ onClick, unreadCount }: { onClick: () => void; unreadCount: number }) => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setShowPopup(true), 2000);
        const hideTimer = setTimeout(() => setShowPopup(false), 7000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {showPopup && (
                <div className="absolute bottom-full right-0 mb-3 w-max glass-card text-text-primary px-4 py-2 shadow-lg animate-fade-in text-sm" role="tooltip">
                    Have a question? Ask me here!
                    <div className="absolute right-6 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-card-bg"></div>
                </div>
            )}
            <div className="relative">
                <button
                    onClick={onClick}
                    className="bg-accent text-white w-16 h-16 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:bg-accent-hover transition-transform hover:scale-110 duration-200"
                    aria-label="Open chatbot"
                >
                    <ChatbotIcon className="w-8 h-8" />
                </button>
                {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 pointer-events-none" aria-label={`${unreadCount} unread messages`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </div>
        </div>
    );
});

const ChatHeader = memo(({ onClose }: { onClose: () => void }) => {
    return (
        <header 
            className="relative flex items-center justify-center p-4 flex-shrink-0 border-b border-card-border"
        >
            <div className="flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-accent" />
                <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                    Career Helper
                </h3>
                <span className="text-[10px] font-bold uppercase bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    BETA
                </span>
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded-full text-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700/50" aria-label="Close chatbot">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
});

const FeedbackButtons = memo(({ messageIndex, onFeedback, feedbackState }: { messageIndex: number; onFeedback: (index: number, rating: 'up' | 'down') => void; feedbackState: 'up' | 'down' | null }) => (
    <div className="flex items-center justify-start mt-2 space-x-1">
        <button onClick={() => onFeedback(messageIndex, 'up')} disabled={!!feedbackState} aria-label="Good response" className={`p-1 rounded-full transition-colors ${feedbackState === 'up' ? 'text-green-500' : 'text-text-secondary/50 hover:bg-slate-700/50'}`}>
            <ThumbUpIcon className="w-4 h-4" />
        </button>
        <button onClick={() => onFeedback(messageIndex, 'down')} disabled={!!feedbackState} aria-label="Bad response" className={`p-1 rounded-full transition-colors ${feedbackState === 'down' ? 'text-red-500' : 'text-text-secondary/50 hover:bg-slate-700/50'}`}>
            <ThumbDownIcon className="w-4 h-4" />
        </button>
    </div>
));

const MessageBubble = memo(({ message, children }: { message: Message, children?: React.ReactNode }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-end gap-2 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0"><ChatbotIcon className="w-6 h-6" /></div>}
            <div className={`max-w-[80%] p-3 rounded-2xl ${isUser ? 'bg-accent text-white rounded-br-lg' : 'bg-slate-200 dark:bg-slate-800 text-text-primary rounded-bl-lg'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{sanitizeHTML(message.text)}</p>
                {children}
            </div>
        </div>
    );
});

const TypingIndicatorBubble = memo(() => (
    <div className="flex items-end gap-2 animate-fade-in justify-start">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0"><ChatbotIcon className="w-6 h-6" /></div>
        <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-text-primary rounded-bl-lg">
            <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-bounce"></div>
            </div>
        </div>
    </div>
));


const KeywordSuggestions = memo(({ keywords, onSelect }: { keywords: string[], onSelect: (keyword: string) => void }) => (
    <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map(keyword => (
            <button key={keyword} onClick={() => onSelect(keyword)} className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-text-secondary px-3 py-1.5 rounded-full">
                Explain "{keyword}"
            </button>
        ))}
    </div>
));

const ChatInput = memo(({ onSendMessage, isLoading, isLimitReached, placeholder }: { onSendMessage: (text: string) => void; isLoading: boolean; isLimitReached: boolean; placeholder: string }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLimitReached) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 w-full p-2.5 bg-slate-100 dark:bg-slate-900/80 border border-card-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 text-text-primary placeholder:text-text-secondary"
                disabled={isLoading || isLimitReached}
                aria-label="Chat input"
            />
            <button type="submit" disabled={isLoading || !input.trim() || isLimitReached} className="p-2.5 bg-accent text-white rounded-lg disabled:bg-slate-500 hover:bg-accent-hover transition-colors" aria-label="Send message">
                <PaperAirplaneIcon className="w-5 h-5" />
            </button>
        </form>
    );
});


// --- MAIN CHATBOT COMPONENT ---

interface ChatbotProps {
    isVisible: boolean;
    keywords: string[];
    unreadCount: number;
    onIncrementUnread: () => void;
    onResetUnread: () => void;
    messageCount: number;
    messageLimit: number;
    onIncrementMessageCount: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isVisible, keywords, unreadCount, onIncrementUnread, onResetUnread, messageCount, messageLimit, onIncrementMessageCount }) => {
    const [chatState, setChatState] = useState<ChatbotState>('closed');
    const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | null>>({});
    const [showFeedbackToast, setShowFeedbackToast] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatStateRef = useRef(chatState);

    const chatServiceRef = useRef<ChatService | null>(null);
    if (chatServiceRef.current === null) {
        chatServiceRef.current = new ChatService();
    }
    const chatService = chatServiceRef.current;
    
    const [state, dispatch] = useReducer(chatReducer, {
        messages: [INITIAL_HELPER_MESSAGE],
        isLoading: false,
    });

    useEffect(() => { chatStateRef.current = chatState; }, [chatState]);
    
    // Effect to load messages from session storage on initial render
    useEffect(() => {
        const storageKey = 'helperChatMessages';
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    dispatch({ type: 'SET_MESSAGES', payload: parsed });
                    return;
                }
            }
        } catch (e) {
            console.error(`Failed to load chat from session storage.`, e);
        }
        dispatch({ type: 'SET_MESSAGES', payload: [INITIAL_HELPER_MESSAGE] });
    }, []);

    // Save messages to session storage when they change
    useEffect(() => {
        try {
            const key = 'helperChatMessages';
            sessionStorage.setItem(key, JSON.stringify(state.messages));
        } catch(e) { console.error("Failed to save chat to session storage.", e)}
    }, [state.messages]);

    // Scroll to bottom on new message
    useLayoutEffect(() => {
        if (chatState === 'open' && chatContainerRef.current) {
            const chatContainer = chatContainerRef.current;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [state.messages, state.isLoading, chatState]);

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || state.isLoading || messageCount >= messageLimit) return;

        onIncrementMessageCount();
        dispatch({ type: 'ADD_MESSAGE', payload: { sender: 'user', text: messageText } });
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const stream = await chatService.sendMessageStream(messageText);
            let firstChunk = true;
            for await (const chunk of stream) {
                if (firstChunk) {
                    if (chatStateRef.current !== 'open') {
                        onIncrementUnread();
                    }
                    dispatch({ type: 'ADD_MESSAGE', payload: { sender: 'ai', text: chunk.text } });
                    firstChunk = false;
                } else {
                    dispatch({ type: 'STREAM_CHUNK', payload: chunk.text });
                }
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            dispatch({ type: 'ADD_MESSAGE', payload: { sender: 'ai', text: "Sorry, I'm having a little trouble right now. Please try again later." } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleFeedback = (messageIndex: number, rating: 'up' | 'down') => {
        setFeedback(prev => ({ ...prev, [messageIndex]: rating }));
        setShowFeedbackToast(true);
        setTimeout(() => setShowFeedbackToast(false), 2000);
    };

    const handleOpen = () => {
        setChatState('open');
        onResetUnread();
    };

    const getPlaceholder = () => {
        if (isLimitReached) return "You've reached the message limit.";
        if (state.isLoading) return "Thinking...";
        return "Ask me anything...";
    };

    if (chatState === 'closed') {
        return isVisible ? <FloatingButton onClick={handleOpen} unreadCount={unreadCount} /> : null;
    }
    
    const isLimitReached = messageCount >= messageLimit;
    const hasUserSentMessage = state.messages.some(msg => msg.sender === 'user');

    return (
        <aside className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-40 w-full max-w-sm flex flex-col transition-all duration-300 h-[80vh] sm:h-[70vh] ${!isVisible ? 'opacity-0 pointer-events-none' : 'animate-slide-up-fade'}`}>
            <div className="bg-white dark:bg-slate-900 border border-card-border shadow-2xl flex flex-col h-full sm:rounded-2xl overflow-hidden">
                <ChatHeader 
                    onClose={() => setChatState('closed')}
                />
                
                <>
                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto" role="log" aria-live="polite">
                        <div className="space-y-4">
                            {state.messages.map((msg, index) => (
                                <MessageBubble key={index} message={msg}>
                                    {msg.sender === 'ai' && index > 0 && !state.isLoading && msg.text && (
                                        <FeedbackButtons
                                            messageIndex={index}
                                            onFeedback={handleFeedback}
                                            feedbackState={feedback[index] || null}
                                        />
                                    )}
                                </MessageBubble>
                            ))}
                             {state.isLoading && <TypingIndicatorBubble />}
                        </div>
                    </div>
                    
                    <footer className="p-4 border-t border-card-border flex-shrink-0">
                        {showFeedbackToast && <div className="text-center text-xs text-text-secondary mb-2 animate-fade-in">Thank you for your feedback!</div>}
                        {!isLimitReached && !hasUserSentMessage && <KeywordSuggestions keywords={keywords} onSelect={handleSendMessage} />}
                        <ChatInput 
                            onSendMessage={handleSendMessage} 
                            isLoading={state.isLoading} 
                            isLimitReached={isLimitReached}
                            placeholder={getPlaceholder()}
                         />
                        <p className={`text-center text-xs mt-2 font-medium ${isLimitReached ? 'text-red-500' : 'text-text-secondary'}`}>
                           {Math.max(0, messageLimit - messageCount)} / {messageLimit} messages remaining
                        </p>
                    </footer>
                </>
            </div>
        </aside>
    );
};

export default Chatbot;