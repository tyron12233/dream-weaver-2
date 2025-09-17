import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import type { DreamAnalysis } from '../types';

interface DreamAnalysisViewProps {
    analysis: DreamAnalysis;
    onStartOver: () => void;
    onViewDreamscape: () => void;
}

const DreamAnalysisView: React.FC<DreamAnalysisViewProps> = ({
    analysis,
    onStartOver,
    onViewDreamscape
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionsRef = useRef<HTMLDivElement[]>([]);
    const [activeSection, setActiveSection] = useState<string>('summary');
    const [revealedSymbols, setRevealedSymbols] = useState<Set<number>>(new Set());

    useLayoutEffect(() => {
        if (containerRef.current) {
            const sections = sectionsRef.current;
            gsap.fromTo(sections,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'power4.out',
                    delay: 0.3
                }
            );
        }
    }, []);

    const addToRefs = (el: HTMLDivElement | null) => {
        if (el && !sectionsRef.current.includes(el)) {
            sectionsRef.current.push(el);
        }
    };

    const revealSymbol = (index: number) => {
        setRevealedSymbols(prev => new Set(prev).add(index));
    };

    const NavigationTab = ({ id, label, icon, isActive, onClick }: {
        id: string;
        label: string;
        icon: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${isActive
                    ? 'bg-black text-white shadow-dark-glow'
                    : 'bg-white/40 text-neutral-700 hover:bg-white/60 backdrop-blur-xl border border-black/8'
                }`}
        >
            <span className="w-5 h-5">{icon}</span>
            {label}
        </button>
    );

    const SymbolCard = ({ symbol, index }: { symbol: { symbol: string; meaning: string }, index: number }) => {
        const isRevealed = revealedSymbols.has(index);

        return (
            <div
                className={`glass rounded-2xl p-6 cursor-pointer transition-all duration-500 border border-black/8 ${isRevealed ? 'shadow-float' : 'hover:shadow-lg'
                    }`}
                onClick={() => !isRevealed && revealSymbol(index)}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-black text-lg">{symbol.symbol}</h3>
                    {!isRevealed && (
                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    )}
                </div>

                {isRevealed ? (
                    <p className="text-neutral-700 leading-relaxed font-light animate-fade-in">
                        {symbol.meaning}
                    </p>
                ) : (
                    <p className="text-neutral-500 italic font-light">
                        Click to reveal the meaning...
                    </p>
                )}
            </div>
        );
    };

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'summary':
                return (
                    <div className="space-y-8">
                        <div className="glass rounded-3xl p-8 backdrop-blur-2xl border border-black/8 shadow-float">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-black/10 to-black/5 flex items-center justify-center mr-6">
                                    <svg className="w-8 h-8 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-black mb-2">Your Dream Journey</h2>
                                    <p className="text-neutral-500 font-light">A personalized exploration of your subconscious</p>
                                </div>
                            </div>

                            <div className="prose prose-lg max-w-none">
                                <p className="text-neutral-700 leading-relaxed font-light text-lg first-letter:text-4xl first-letter:font-bold first-letter:text-black first-letter:mr-2 first-letter:float-left first-letter:leading-none">
                                    {analysis.dreamSummary}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass rounded-2xl p-6 backdrop-blur-2xl border border-black/8">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-black">Emotional Themes</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.emotionalThemes.map((theme, index) => (
                                        <span
                                            key={index}
                                            className="chip text-sm animate-fade-in"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            {theme}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 backdrop-blur-2xl border border-black/8">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-black">Dream Insights</h3>
                                </div>
                                <p className="text-neutral-700 leading-relaxed font-light">
                                    {analysis.overallInterpretation.slice(0, 120)}...
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'psychology':
                return (
                    <div className="glass rounded-3xl p-8 backdrop-blur-2xl border border-black/8 shadow-float">
                        <div className="flex items-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-black/10 to-black/5 flex items-center justify-center mr-6">
                                <svg className="w-8 h-8 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-black mb-2">Psychological Analysis</h2>
                                <p className="text-neutral-500 font-light">Understanding your subconscious mind</p>
                            </div>
                        </div>

                        <div className="prose prose-lg max-w-none">
                            <p className="text-neutral-700 leading-relaxed font-light text-lg">
                                {analysis.psychologicalMeaning}
                            </p>
                        </div>
                    </div>
                );

            case 'symbols':
                return (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-black mb-4">Discover Your Dream Symbols</h2>
                            <p className="text-neutral-500 font-light">Click on each symbol to reveal its hidden meaning</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analysis.symbols.map((symbol, index) => (
                                <SymbolCard key={index} symbol={symbol} index={index} />
                            ))}
                        </div>
                    </div>
                );

            case 'recommendations':
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-black mb-4">Personal Growth Insights</h2>
                            <p className="text-neutral-500 font-light">Actionable steps based on your dream analysis</p>
                        </div>

                        {analysis.recommendations.map((recommendation, index) => (
                            <div
                                key={index}
                                className="glass rounded-2xl p-6 backdrop-blur-2xl border border-black/8 animate-fade-in"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <span className="text-black/70 font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <p className="text-neutral-700 font-light leading-relaxed">{recommendation}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full max-w-6xl mx-auto p-6 min-h-[80vh]"
        >
            {/* Header */}
            <div
                ref={addToRefs}
                className="text-center mb-12"
                data-transition-target="header"
            >
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-black to-neutral-600 bg-clip-text text-transparent mb-4">
                    Dream Analysis
                </h1>
                <p className="text-neutral-500 font-light text-lg">
                    Understanding the deeper meaning behind your subconscious journey
                </p>
            </div>

            {/* Navigation */}
            <div
                ref={addToRefs}
                className="flex flex-wrap justify-center gap-4 mb-12"
            >
                <NavigationTab
                    id="summary"
                    label="Dream Summary"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    isActive={activeSection === 'summary'}
                    onClick={() => setActiveSection('summary')}
                />
                <NavigationTab
                    id="psychology"
                    label="Psychology"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    }
                    isActive={activeSection === 'psychology'}
                    onClick={() => setActiveSection('psychology')}
                />
                <NavigationTab
                    id="symbols"
                    label="Symbols"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    }
                    isActive={activeSection === 'symbols'}
                    onClick={() => setActiveSection('symbols')}
                />
                <NavigationTab
                    id="recommendations"
                    label="Insights"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    isActive={activeSection === 'recommendations'}
                    onClick={() => setActiveSection('recommendations')}
                />
            </div>

            {/* Content */}
            <div
                ref={addToRefs}
                className="mb-12"
            >
                {renderActiveSection()}
            </div>

            {/* Action Buttons */}
            <div
                ref={addToRefs}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                data-transition-target="buttons"
            >
                <button
                    onClick={onViewDreamscape}
                    className="btn-primary"
                >
                    View Dreamscape
                </button>
                <button
                    onClick={onStartOver}
                    className="btn-secondary"
                >
                    Analyze Another Dream
                </button>
            </div>
        </div>
    );
};

export default DreamAnalysisView;
