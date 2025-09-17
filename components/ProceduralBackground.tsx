import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { analyzeDreamContext, getDreamPalette } from '../utils/dreamAnalyzer';
import GradientBackground from './GradientBackground';
import type { ChatMessage } from '../types';

interface DreamTheme {
    colors: string[];
    patterns: 'waves' | 'particles' | 'geometric' | 'organic' | 'abstract';
    mood: 'calm' | 'energetic' | 'mysterious' | 'chaotic' | 'peaceful';
    intensity: number;
}

interface ProceduralBackgroundProps {
    messages: ChatMessage[];
    isActive?: boolean;
}

// Dream theme mappings based on common dream elements
const PATTERN_MAPPING = {
    water: { pattern: 'waves' as const, mood: 'calm' as const, intensity: 0.6 },
    fire: { pattern: 'particles' as const, mood: 'energetic' as const, intensity: 0.9 },
    nature: { pattern: 'organic' as const, mood: 'peaceful' as const, intensity: 0.5 },
    sky: { pattern: 'abstract' as const, mood: 'mysterious' as const, intensity: 0.7 },
    negative: { pattern: 'geometric' as const, mood: 'mysterious' as const, intensity: 0.8 },
    supernatural: { pattern: 'abstract' as const, mood: 'mysterious' as const, intensity: 0.8 },
    positive: { pattern: 'organic' as const, mood: 'peaceful' as const, intensity: 0.6 },
    default: { pattern: 'abstract' as const, mood: 'calm' as const, intensity: 0.5 }
};

function ProceduralBackground({ messages, isActive = true }: ProceduralBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const [theme, setTheme] = useState<DreamTheme>({
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e9d5ff'],
        patterns: 'abstract',
        mood: 'calm',
        intensity: 0.5
    });

    // Analyze dream context and select appropriate theme
    useEffect(() => {
        if (!messages.length) return;

        const dreamContext = analyzeDreamContext(messages);
        const colors = getDreamPalette(dreamContext);

        // Determine pattern based on dominant elements
        let selectedPattern: 'waves' | 'particles' | 'geometric' | 'organic' | 'abstract' = 'abstract';
        let selectedMood: 'calm' | 'energetic' | 'mysterious' | 'chaotic' | 'peaceful' = 'calm';
        let intensity = 0.5;

        for (const element of dreamContext.dominant_elements) {
            const mapping = PATTERN_MAPPING[element as keyof typeof PATTERN_MAPPING];
            if (mapping) {
                selectedPattern = mapping.pattern;
                selectedMood = mapping.mood;
                intensity = mapping.intensity;
                break;
            }
        }

        // Adjust intensity based on emotional content
        if (dreamContext.emotions.some(e => ['excited', 'terrified', 'overwhelmed'].includes(e))) {
            intensity = Math.min(1, intensity + 0.3);
        } else if (dreamContext.emotions.some(e => ['calm', 'peaceful'].includes(e))) {
            intensity = Math.max(0.2, intensity - 0.2);
        }

        setTheme({
            colors,
            patterns: selectedPattern,
            mood: selectedMood,
            intensity
        });
    }, [messages]);

    // Canvas animation based on theme
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isActive) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        let time = 0;
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            life: number;
        }> = [];

        // Initialize particles based on theme
        const initParticles = () => {
            particles.length = 0;
            const baseCount = theme.mood === 'chaotic' ? 150 : theme.mood === 'energetic' ? 100 : 50;
            const count = Math.floor(baseCount * theme.intensity);

            for (let i = 0; i < count; i++) {
                const speedMultiplier = theme.mood === 'energetic' ? 4 : 1;
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * speedMultiplier * theme.intensity,
                    vy: (Math.random() - 0.5) * speedMultiplier * theme.intensity,
                    size: Math.random() * (theme.patterns === 'particles' ? 8 : 4) + 2,
                    color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
                    life: Math.random()
                });
            }
        };

        const drawWaves = () => {
            ctx.globalAlpha = 0.6 * theme.intensity;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.strokeStyle = theme.colors[i % theme.colors.length];
                ctx.lineWidth = 2 * theme.intensity;

                for (let x = 0; x <= canvas.width; x += 10) {
                    const amplitude = 100 * theme.intensity;
                    const y = canvas.height * 0.5 +
                        Math.sin((x * 0.01) + (time * 0.02 * theme.intensity) + (i * Math.PI * 0.5)) * amplitude +
                        Math.sin((x * 0.005) + (time * 0.01 * theme.intensity) + (i * Math.PI)) * (amplitude * 0.5);

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        };

        const drawParticles = () => {
            particles.forEach((particle, index) => {
                // Update particle
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= 0.005;

                // Wrap around screen
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Reset particle if life depleted
                if (particle.life <= 0) {
                    particle.life = 1;
                    particle.color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
                }

                // Draw particle
                ctx.globalAlpha = particle.life * 0.7;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const drawGeometric = () => {
            ctx.globalAlpha = 0.4;
            const gridSize = 100;

            for (let x = 0; x < canvas.width; x += gridSize) {
                for (let y = 0; y < canvas.height; y += gridSize) {
                    const colorIndex = Math.floor((Math.sin(time * 0.01 + x * 0.01 + y * 0.01) + 1) * 0.5 * theme.colors.length);
                    ctx.fillStyle = theme.colors[colorIndex % theme.colors.length];

                    const size = (Math.sin(time * 0.02 + x * 0.005 + y * 0.005) + 1) * 20 + 10;
                    ctx.fillRect(
                        x + gridSize * 0.5 - size * 0.5,
                        y + gridSize * 0.5 - size * 0.5,
                        size,
                        size
                    );
                }
            }
        };

        const drawOrganic = () => {
            ctx.globalAlpha = 0.5;
            const numBlobs = 8;

            for (let i = 0; i < numBlobs; i++) {
                const centerX = canvas.width * 0.5 + Math.sin(time * 0.01 + i) * 200;
                const centerY = canvas.height * 0.5 + Math.cos(time * 0.008 + i) * 150;
                const radius = 50 + Math.sin(time * 0.015 + i * 2) * 30;

                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, theme.colors[i % theme.colors.length] + '80');
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const drawAbstract = () => {
            ctx.globalAlpha = 0.3;

            // Flowing abstract shapes
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.fillStyle = theme.colors[i % theme.colors.length];

                const points = [];
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2 + time * 0.01 + i;
                    const radius = 100 + Math.sin(time * 0.02 + i + j) * 50;
                    points.push({
                        x: canvas.width * 0.5 + Math.cos(angle) * radius,
                        y: canvas.height * 0.5 + Math.sin(angle) * radius
                    });
                }

                ctx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < points.length; j++) {
                    const current = points[j];
                    const next = points[(j + 1) % points.length];
                    const cpx = (current.x + next.x) / 2;
                    const cpy = (current.y + next.y) / 2;
                    ctx.quadraticCurveTo(current.x, current.y, cpx, cpy);
                }
                ctx.closePath();
                ctx.fill();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, theme.colors[0] + '20');
            gradient.addColorStop(0.5, theme.colors[2] + '15');
            gradient.addColorStop(1, theme.colors[4] + '10');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw pattern based on theme
            switch (theme.patterns) {
                case 'waves':
                    drawWaves();
                    break;
                case 'particles':
                    drawParticles();
                    break;
                case 'geometric':
                    drawGeometric();
                    break;
                case 'organic':
                    drawOrganic();
                    break;
                case 'abstract':
                    drawAbstract();
                    break;
            }

            time += 1;
            animationRef.current = requestAnimationFrame(animate);
        };

        initParticles();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme, isActive]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Gradient background as base layer */}
            <GradientBackground messages={messages} />

            {/* Canvas overlay for advanced effects */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    opacity: isActive ? 0.7 : 0,
                    transition: 'opacity 2s ease-in-out',
                    mixBlendMode: 'overlay'
                }}
            />
        </div>
    );
}

export default ProceduralBackground;
