import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { MessageAuthor } from '../types';
import type { ChatMessage, ParsedAiResponse } from '../types';
import Loader from './Loader';
import AIVoiceVisualization from './AIVoiceVisualization';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSubmit: (message: string) => void;
    onAiTurnComplete: (message: string) => void;
    isLoading: boolean;
    isRecreationReady: boolean;
    isMuted: boolean;
}

function ChatInterface({ messages, onSubmit, onAiTurnComplete, isLoading, isRecreationReady, isMuted }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const [liveText, setLiveText] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);
    const { volume, connected } = useLiveAPIContext();
    const lastAiMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.AI);
    const lastUserMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.USER);

    const questionRef = useRef<HTMLHeadingElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);


    useLayoutEffect(() => {
        if (isLoading || isReceiving) {
            return;
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

    }, [lastAiMessage?.text, isLoading, isReceiving]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input);
            setInput('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        console.log("Suggestion clicked:", suggestion, isLoading);
        if (!isLoading) {
            onSubmit(suggestion);
        }
    }

    const SuggestionIcon = ({ index }: { index: number }) => {

        const icons = [
            <svg key="bulb" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M9 21h6v-1a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1v1z" />
                <path d="M12 2a7 7 0 0 0-4 12.9V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 2z" />
            </svg>,
            <svg key="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848L19.335 24 12 19.897 4.665 24 6 15.596 0 9.748l8.332-1.73z" />
            </svg>,
            <svg key="heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 21s-7.5-4.534-9.5-7.02C-1.5 8.68 4 3 8.5 6.5 10.6 8.3 12 10 12 10s1.4-1.7 3.5-3.5C20 3 25.5 8.68 21.5 13.98 19.5 16.466 12 21 12 21z" />
            </svg>,
            <svg key="sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2l1.9 4.2L18 8l-4.1 1.8L12 14 10.1 9.8 6 8l4.1-1.8L12 2zM4 14l.9 2 2 1-.9 2L4 21l-.9-2-2-1 2-1 .9-2z" />
            </svg>,
            <svg key="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>,
            <svg key="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8L6.76 4.84zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm8.83-18.83L19.24 6l1.79 1.79 1.79-1.79-1.79-1.79zM17.24 19.16l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6zM4.22 19.78L6 18l-1.78-1.78L1.66 18l2.56 1.78z" />
            </svg>,
            <svg key="leaf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20.39 2.61A9 9 0 0 0 3 20.99a9 9 0 0 0 14.36-12.6A13 13 0 0 1 20.39 2.61zM11 7v10a5 5 0 0 1-5-5V7h5z" />
            </svg>,
            <svg key="music" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M9 17V5l12-2v12M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
        ];


        return (
            <span className="chip-icon" aria-hidden>
                {icons[index % icons.length]}
            </span>
        );
    };

    const renderContent = () => {
        if (isLoading && !lastAiMessage && !isReceiving) {
            return <Loader />; // Initial load
        }

        const displayMessage = isReceiving ? liveText : lastAiMessage?.text;

        return (
            <div className="w-full">
                {lastUserMessage && (
                    <p className="text-neutral-500 mb-8 animate-fade-in font-light">You said: "{lastUserMessage.text}"</p>
                )}

                {/* AI Voice Visualization */}
                <div className="flex justify-center mb-8">
                    <AIVoiceVisualization
                        size="medium"
                        showWhenSilent={connected && (isLoading || isReceiving)}
                        className="transition-opacity duration-500"
                    />
                </div>

                <h2 ref={questionRef} className="text-3xl md:text-5xl font-bold mb-12 leading-tight min-h-[5rem] md:min-h-[7.5rem] bg-gradient-to-br from-black to-neutral-600 bg-clip-text text-transparent">
                    {displayMessage}
                </h2>

                {isLoading || isReceiving ? (
                    <Loader />
                ) : (
                    <>
                        <div ref={suggestionsRef} className="chips flex flex-wrap justify-center gap-3 mb-12">
                            {lastAiMessage?.suggestions?.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={isRecreationReady || isReceiving}
                                    className="chip"
                                >
                                    <SuggestionIcon index={index} />
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        {!isRecreationReady && (
                            <div ref={formRef} className="relative w-full max-w-xl mx-auto">
                                <form onSubmit={handleSubmit} className="w-full">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Tell me more..."
                                        disabled={isLoading || isReceiving}
                                        className="w-full p-4 pr-16 rounded-full bg-neutral-100 border border-neutral-300 text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all duration-300"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || isReceiving || !input.trim()}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 h-10 w-10 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Submit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-black">
                                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {isRecreationReady && (
                    <div className="mt-12 text-lg text-black font-semibold animate-pulse">
                        We have enough to begin... analyzing your dream.
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