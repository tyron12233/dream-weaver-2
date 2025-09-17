import { useEffect, useState } from 'react';
import { analyzeDreamContext, getDreamPalette } from '../utils/dreamAnalyzer';
import type { ChatMessage } from '../types';

interface GradientBackgroundProps {
    messages: ChatMessage[];
    className?: string;
}

function GradientBackground({ messages, className = '' }: GradientBackgroundProps) {
    const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!messages.length) {
            // Default gradient
            setGradientStyle({
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                animation: 'gentle-shift 8s ease-in-out infinite alternate'
            });
            return;
        }

        const dreamContext = analyzeDreamContext(messages);
        const colors = getDreamPalette(dreamContext);

        // Create dynamic gradient based on dream context
        let gradientDirection = '135deg';
        let animationDuration = '8s';
        let animationName = 'gentle-shift';

        // Adjust animation based on mood
        switch (dreamContext.overall_mood) {
            case 'positive':
                animationName = 'joyful-flow';
                animationDuration = '6s';
                gradientDirection = '45deg';
                break;
            case 'negative':
                animationName = 'dark-pulse';
                animationDuration = '12s';
                gradientDirection = '225deg';
                break;
            case 'mixed':
                animationName = 'complex-flow';
                animationDuration = '10s';
                gradientDirection = '90deg';
                break;
            default:
                animationName = 'gentle-shift';
                break;
        }

        // Check for specific elements to adjust style
        if (dreamContext.dominant_elements.includes('water')) {
            animationName = 'water-flow';
            gradientDirection = '180deg';
        } else if (dreamContext.dominant_elements.includes('fire')) {
            animationName = 'fire-dance';
            animationDuration = '4s';
        } else if (dreamContext.dominant_elements.includes('sky')) {
            animationName = 'sky-drift';
            gradientDirection = '0deg';
        }

        const gradient = `linear-gradient(${gradientDirection}, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 50%, ${colors[3]} 75%, ${colors[4]} 100%)`;

        setGradientStyle({
            background: gradient,
            animation: `${animationName} ${animationDuration} ease-in-out infinite alternate`
        });

    }, [messages]);

    return (
        <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out dream-gradient ${className}`}
            style={gradientStyle}
        />
    );
}

export default GradientBackground;
