import { useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { MessageAuthor } from '../types';
import type { ChatMessage } from '../types';
import Loader from './Loader';
import { speechService } from '@/services/speechService';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSubmit: (message: string) => void;
    isLoading: boolean;
    isRecreationReady: boolean;
    isMuted: boolean;
}

function ChatInterface({ messages, onSubmit, isLoading, isRecreationReady, isMuted }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const lastAiMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.AI);
    const lastUserMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.USER);

    const questionRef = useRef<HTMLHeadingElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isLoading || !lastAiMessage?.text) {
            // Cancel any leftover speech if we start loading a new question
            if (isLoading) speechService.cancel();
            return;
        }

        // Speak the AI's message if not muted
        if (!isMuted) {
            speechService.speak(lastAiMessage.text);
        }

        const tl = gsap.timeline();
        if (questionRef.current) {
            tl.fromTo(questionRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }
            );
        }
        if (suggestionsRef.current) {
            tl.fromTo(suggestionsRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power4.out' },
                "-=0.5"
            );
        }
        if (formRef.current) {
            tl.fromTo(formRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power4.out' },
                "-=0.4"
            );
        }

        // Cleanup function to stop speaking if the component re-renders or unmounts
        return () => {
            speechService.cancel();
        }

    }, [lastAiMessage?.text]); // Animate and speak when the AI message text changes

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input);
            setInput('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (!isLoading) {
            onSubmit(suggestion);
        }
    }

    const SuggestionIcon = () => (
        <span className="chip-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a7 7 0 00-7 7c0 2.38 1.25 4.46 3.13 5.64a2 2 0 01.87 1.1l.27.82c.17.53.66.89 1.22.89h2.1c.56 0 1.05-.36 1.22-.89l.27-.82c.14-.43.46-.8.87-1.1A7 7 0 0019 9a7 7 0 00-7-7zm-1 19h2a1 1 0 110 2h-2a1 1 0 110-2z" />
            </svg>
        </span>
    );

    const renderContent = () => {
        if (isLoading && !lastAiMessage) {
            return <Loader />; // Initial load after dream input
        }

        if (!lastAiMessage) {
            // This case should ideally not be hit if there's always a first message
            return <p>Awaiting analysis...</p>;
        }

        return (
            <div className="w-full">
                {/* Previous user response for context */}
                {lastUserMessage && (
                    <p className="text-neutral-500 mb-8 animate-fade-in font-light">You said: "{lastUserMessage.text}"</p>
                )}

                <h2 ref={questionRef} className="text-3xl md:text-5xl font-bold mb-12 leading-tight min-h-[5rem] md:min-h-[7.5rem] bg-gradient-to-br from-black to-neutral-600 bg-clip-text text-transparent">
                    {lastAiMessage.text}
                </h2>

                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <div ref={suggestionsRef} className="chips flex flex-wrap justify-center gap-3 mb-12">
                            {lastAiMessage.suggestions?.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={isRecreationReady}
                                    className="chip"
                                >
                                    <SuggestionIcon />
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        {!isRecreationReady && (
                            <div ref={formRef} className="w-full max-w-xl mx-auto">
                                <form onSubmit={handleSubmit} className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Or type your own response..."
                                        disabled={isLoading}
                                        className="input-glass pl-6 pr-16 py-4 shadow-sm text-lg"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center btn-primary p-0 min-w-0"
                                        aria-label="Send message"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {isRecreationReady && (
                    <div className="mt-12 text-lg text-black font-semibold animate-pulse">
                        We have enough to begin... preparing the dreamscape.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div data-transition-target="container" className="w-full max-w-3xl mx-auto h-[80vh] flex flex-col items-center justify-center text-center p-4">
            {renderContent()}
        </div>
    );
}

export default ChatInterface;
