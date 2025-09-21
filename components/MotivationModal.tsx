import React, { useState, useEffect, useRef } from 'react';
import { motivationalMessages } from '../data/motivationalMessages.ts';
import { memeGifs } from '../data/memeGifs.ts';

interface LoadingModalProps {
    isOpen: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen }) => {
    // State for modal content
    const [message, setMessage] = useState('');
    const [gif, setGif] = useState('');

    // State for dragging functionality
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Effect to handle modal opening, content, and GIF cycling timer.
    useEffect(() => {
        if (!isOpen) return;

        // Shuffle GIFs and set initial state
        const shuffledGifs = [...memeGifs].sort(() => 0.5 - Math.random());
        let currentIndex = 0;
        
        setMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
        if (shuffledGifs.length > 0) {
            setGif(shuffledGifs[currentIndex]);
        }
        
        // Set up an interval to cycle through the GIFs
        const intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % (shuffledGifs.length || 1);
            if (shuffledGifs.length > 0) {
                setGif(shuffledGifs[currentIndex]);
            }
        }, 3000); // Change GIF every 3 seconds

        // Cleanup function to clear the interval when the modal closes
        return () => {
            clearInterval(intervalId);
        };
    }, [isOpen]);

    // Effect to center the modal once it has content and is rendered
    useEffect(() => {
        if (isOpen && message && modalRef.current) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = modalRef.current;
            setPosition({
                x: (innerWidth - offsetWidth) / 2,
                y: (innerHeight - offsetHeight) / 2,
            });
        }
    }, [message, isOpen]); // Depends on message being set and modal being open

    // Dragging handlers
    const handleDragStart = (clientX: number, clientY: number) => {
        if (!modalRef.current) return;
        setIsDragging(true);
        dragOffset.current = {
            x: clientX - position.x,
            y: clientY - position.y,
        };
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({
            x: clientX - dragOffset.current.x,
            y: clientY - dragOffset.current.y,
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
    const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);

    // Effect to attach/detach move/end listeners for dragging
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);


    if (!isOpen) {
        return null;
    }
    
    const ProgressBar = () => (
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full animate-[progress_4s_ease-in-out_infinite]"></div>
        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/70 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                className="glass-card p-6 sm:p-8 w-full max-w-sm text-center"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none'
                }}
            >
                {gif && (
                    <img 
                        src={gif} 
                        alt="Motivational Meme" 
                        loading="lazy"
                        className="w-full h-48 object-cover rounded-lg mx-auto pointer-events-none"
                    />
                )}
                <p className="mt-4 text-lg font-medium text-text-primary">
                    {message}
                </p>
                <p className="text-sm font-semibold tracking-wide text-accent mt-4">Generating Your Future...</p>
                <ProgressBar />
            </div>
        </div>
    );
};
