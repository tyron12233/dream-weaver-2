import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { aiThemeGenerator, type AIGeneratedTheme } from '../services/aiThemeService';
import type { ChatMessage } from '../types';

interface AIGeneratedBackgroundProps {
    messages: ChatMessage[];
    isActive?: boolean;
    onThemeChange?: (theme: AIGeneratedTheme) => void;
}

function AIGeneratedBackground({ messages, isActive = true, onThemeChange }: AIGeneratedBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLStyleElement | null>(null);
    const [currentTheme, setCurrentTheme] = useState<AIGeneratedTheme | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(0);

    // Generate initial theme when first messages arrive
    useEffect(() => {
        if (messages.length > 0 && !currentTheme && !isGenerating) {
            generateInitialTheme();
        }
    }, [messages, currentTheme]);

    // Evolve theme as conversation progresses
    useEffect(() => {
        const shouldEvolve = messages.length > lastMessageCount &&
            messages.length > 1 &&
            currentTheme &&
            !isGenerating &&
            messages.length % 2 === 0; // Evolve every 2 new messages

        if (shouldEvolve) {
            evolveCurrentTheme();
        }

        setLastMessageCount(messages.length);
    }, [messages.length, currentTheme, lastMessageCount]);

    const generateInitialTheme = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const theme = await aiThemeGenerator.generateInitialTheme(messages);
            await applyThemeWithTransition(theme);
            onThemeChange?.(theme);
        } catch (error) {
            console.error('Failed to generate initial theme:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const evolveCurrentTheme = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const evolvedTheme = await aiThemeGenerator.evolveTheme(messages);
            await applyThemeWithTransition(evolvedTheme);
            onThemeChange?.(evolvedTheme);
        } catch (error) {
            console.error('Failed to evolve theme:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const applyThemeWithTransition = async (theme: AIGeneratedTheme): Promise<void> => {
        if (!containerRef.current) return;

        return new Promise((resolve) => {
            // Fade out current theme
            gsap.to(containerRef.current, {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Apply new theme
                    applyTheme(theme);
                    setCurrentTheme(theme);

                    // Fade in new theme
                    gsap.to(containerRef.current, {
                        opacity: isActive ? 1 : 0,
                        duration: 1.2,
                        ease: 'power2.out',
                        onComplete: resolve
                    });
                }
            });
        });
    };

    const applyTheme = (theme: AIGeneratedTheme) => {
        if (!containerRef.current) return;

        // Update HTML content
        containerRef.current.innerHTML = theme.html;

        // Update or create CSS
        if (styleRef.current) {
            styleRef.current.textContent = theme.css;
        } else {
            styleRef.current = document.createElement('style');
            styleRef.current.textContent = theme.css;
            document.head.appendChild(styleRef.current);
        }

        // Add theme metadata as CSS variables for potential JS interaction
        const root = document.documentElement;
        root.style.setProperty('--dream-stage', theme.metadata.stage.toString());
        root.style.setProperty('--dream-intensity', theme.metadata.intensity.toString());
        root.style.setProperty('--dream-mood', theme.metadata.mood);

        // Set dominant colors as CSS variables
        theme.metadata.dominantColors.forEach((color, index) => {
            root.style.setProperty(`--dream-color-${index + 1}`, color);
        });
    };

    // Handle active state changes
    useEffect(() => {
        if (!containerRef.current) return;

        gsap.to(containerRef.current, {
            opacity: isActive ? 1 : 0,
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }, [isActive]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (styleRef.current && styleRef.current.parentNode) {
                styleRef.current.parentNode.removeChild(styleRef.current);
            }
            aiThemeGenerator.resetTheme();
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {/* AI Generated Theme Container */}
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    opacity: 0,
                    transition: 'opacity 0.5s ease-in-out'
                }}
            />

            {/* Loading indicator */}
            {isGenerating && (
                <div className="absolute top-4 right-4 z-50">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Weaving dream...</span>
                    </div>
                </div>
            )}

            {/* Theme info for debugging (remove in production) */}
            {currentTheme && process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-4 left-4 z-50 p-2 bg-black/70 text-white text-xs rounded max-w-xs">
                    <div>Stage: {currentTheme.metadata.stage}/5</div>
                    <div>Mood: {currentTheme.metadata.mood}</div>
                    <div>Elements: {currentTheme.metadata.elements.join(', ')}</div>
                    <div>Intensity: {currentTheme.metadata.intensity}</div>
                </div>
            )}
        </div>
    );
}

export default AIGeneratedBackground;
