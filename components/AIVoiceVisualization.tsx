import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

interface AIVoiceVisualizationProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
    showWhenSilent?: boolean;
}

function AIVoiceVisualization({
    size = 'medium',
    className = '',
    showWhenSilent = false
}: AIVoiceVisualizationProps) {
    const { volume } = useLiveAPIContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const orbs = useRef<HTMLDivElement[]>([]);
    const particles = useRef<HTMLDivElement[]>([]);
    const glowRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        small: 'w-16 h-16',
        medium: 'w-24 h-24',
        large: 'w-32 h-32'
    };

    const orbCount = size === 'large' ? 5 : size === 'medium' ? 3 : 2;
    const particleCount = size === 'large' ? 12 : size === 'medium' ? 8 : 6;

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize floating orbs
        orbs.current.forEach((orb, index) => {
            if (orb) {
                gsap.set(orb, {
                    x: Math.random() * 40 - 20,
                    y: Math.random() * 40 - 20,
                    scale: 0.3 + Math.random() * 0.4,
                    opacity: 0.6 + Math.random() * 0.4
                });

                // Continuous floating animation
                gsap.to(orb, {
                    x: `+=${Math.random() * 60 - 30}`,
                    y: `+=${Math.random() * 60 - 30}`,
                    duration: 4 + Math.random() * 4,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    delay: index * 0.5
                });

                // Pulsing animation
                gsap.to(orb, {
                    scale: `+=${0.2 + Math.random() * 0.3}`,
                    duration: 2 + Math.random() * 2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power2.inOut',
                    delay: index * 0.3
                });
            }
        });

        // Initialize particles
        particles.current.forEach((particle, index) => {
            if (particle) {
                gsap.set(particle, {
                    x: Math.random() * 80 - 40,
                    y: Math.random() * 80 - 40,
                    scale: 0.1 + Math.random() * 0.2,
                    opacity: 0.3 + Math.random() * 0.5
                });

                // Continuous sparkle animation
                gsap.to(particle, {
                    x: `+=${Math.random() * 100 - 50}`,
                    y: `+=${Math.random() * 100 - 50}`,
                    rotation: 360,
                    duration: 6 + Math.random() * 6,
                    repeat: -1,
                    yoyo: true,
                    ease: 'none',
                    delay: index * 0.2
                });

                // Twinkling effect
                gsap.to(particle, {
                    opacity: 0,
                    duration: 1 + Math.random() * 2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power2.inOut',
                    delay: index * 0.4
                });
            }
        });
    }, []);

    useEffect(() => {
        const volumeLevel = volume || 0;
        const isActive = volumeLevel > 0.01;
        const displayLevel = isActive ? 1 : (showWhenSilent ? 0.3 : 0);

        if (!containerRef.current || !glowRef.current) return;

        // Main container visibility and scale with smoother transitions
        gsap.to(containerRef.current, {
            opacity: showWhenSilent ? Math.max(0.4, displayLevel) : displayLevel,
            scale: 1 + volumeLevel * 0.3,
            duration: isActive ? 0.15 : 0.5,
            ease: isActive ? 'power2.out' : 'power2.inOut'
        });

        // Central glow intensity with more dramatic scaling
        gsap.to(glowRef.current, {
            opacity: showWhenSilent ? 0.3 + volumeLevel * 0.7 : volumeLevel * 0.8,
            scale: 1 + volumeLevel * 2,
            duration: 0.1,
            ease: 'power2.out'
        });

        // Animate orbs based on volume with more variation
        orbs.current.forEach((orb, index) => {
            if (orb) {
                const baseIntensity = showWhenSilent ? 0.2 : 0;
                const intensity = baseIntensity + volumeLevel * (1.5 + index * 0.3);
                const randomOffset = Math.sin(Date.now() * 0.01 + index) * 0.1;

                gsap.to(orb, {
                    scale: (0.3 + Math.random() * 0.4) * (1 + intensity * 1.8),
                    opacity: Math.max(0.2, (0.6 + randomOffset) * (0.3 + intensity)),
                    rotation: `+=${intensity * 10}`,
                    duration: 0.12,
                    ease: 'power2.out'
                });
            }
        });

        // Animate particles based on volume with staggered effects
        particles.current.forEach((particle, index) => {
            if (particle) {
                const baseIntensity = showWhenSilent ? 0.1 : 0;
                const intensity = baseIntensity + volumeLevel * (2 + index * 0.15);
                const randomOffset = Math.cos(Date.now() * 0.015 + index * 0.5) * 0.2;

                gsap.to(particle, {
                    scale: (0.1 + Math.random() * 0.2) * (1 + intensity * 4),
                    opacity: Math.max(0.1, (0.3 + randomOffset) * (0.2 + intensity)),
                    rotation: `+=${intensity * 20}`,
                    duration: 0.08,
                    ease: 'power2.out'
                });
            }
        });

    }, [volume, showWhenSilent]);

    return (
        <div
            ref={containerRef}
            className={`relative ${sizeClasses[size]} ${className}`}
            style={{ perspective: '400px' }}
        >
            {/* Central glow */}
            <div
                ref={glowRef}
                className="absolute inset-0 rounded-full ai-voice-glow"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 30%, rgba(168, 85, 247, 0.1) 60%, transparent 100%)',
                    filter: 'blur(2px)'
                }}
            />

            {/* Secondary glow layer */}
            <div
                className="absolute inset-2 rounded-full opacity-60"
                style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
                    filter: 'blur(1px)',
                    animation: 'pulse 2.5s ease-in-out infinite alternate'
                }}
            />

            {/* Floating orbs */}
            {Array.from({ length: orbCount }, (_, index) => (
                <div
                    key={`orb-${index}`}
                    ref={el => { if (el) orbs.current[index] = el; }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                    style={{
                        background: `linear-gradient(45deg, 
              hsl(${200 + index * 40}, 70%, 60%), 
              hsl(${250 + index * 30}, 80%, 70%)
            )`,
                        boxShadow: `0 0 ${8 + index * 4}px rgba(59, 130, 246, 0.6)`,
                        transform: 'translate(-50%, -50%)',
                        filter: 'blur(0.5px)'
                    }}
                />
            ))}

            {/* Sparkle particles */}
            {Array.from({ length: particleCount }, (_, index) => (
                <div
                    key={`particle-${index}`}
                    ref={el => { if (el) particles.current[index] = el; }}
                    className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full ai-voice-particle"
                    style={{
                        background: `hsl(${180 + index * 20}, 90%, 80%)`,
                        boxShadow: `0 0 ${3 + index}px rgba(255, 255, 255, 0.8), 0 0 ${6 + index * 2}px rgba(59, 130, 246, 0.4)`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Outer ring effect */}
            <div
                className="absolute inset-0 rounded-full border border-blue-300/20"
                style={{
                    animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
            />

            {/* Additional magical ring */}
            <div
                className="absolute inset-2 rounded-full border border-purple-300/15"
                style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite reverse'
                }}
            />
        </div>
    );
}

export default AIVoiceVisualization;
