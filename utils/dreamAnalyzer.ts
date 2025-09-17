import type { ChatMessage } from '../types';

export interface DreamContext {
    keywords: string[];
    emotions: string[];
    themes: string[];
    overall_mood: 'positive' | 'negative' | 'neutral' | 'mixed';
    dominant_elements: string[];
}

// Common dream elements and their categories
const DREAM_ELEMENTS = {
    emotions: [
        'happy', 'sad', 'angry', 'scared', 'excited', 'calm', 'anxious',
        'peaceful', 'terrified', 'joyful', 'worried', 'confused', 'overwhelmed'
    ],

    nature: [
        'water', 'ocean', 'sea', 'lake', 'river', 'swimming', 'drowning', 'rain',
        'fire', 'flame', 'burn', 'hot', 'smoke', 'explosion', 'candle',
        'forest', 'tree', 'plant', 'garden', 'flower', 'grass', 'leaf', 'nature',
        'sky', 'cloud', 'star', 'moon', 'sun', 'flying', 'heaven', 'space',
        'mountain', 'desert', 'beach', 'wind', 'storm', 'lightning', 'snow'
    ],

    places: [
        'home', 'house', 'school', 'work', 'office', 'hospital', 'church',
        'city', 'street', 'road', 'bridge', 'building', 'room', 'basement',
        'attic', 'bathroom', 'kitchen', 'bedroom', 'classroom', 'library'
    ],

    people: [
        'family', 'mother', 'father', 'parent', 'child', 'baby', 'friend',
        'stranger', 'enemy', 'teacher', 'doctor', 'boss', 'partner', 'spouse',
        'sibling', 'brother', 'sister', 'grandmother', 'grandfather'
    ],

    animals: [
        'dog', 'cat', 'bird', 'snake', 'spider', 'horse', 'fish', 'shark',
        'lion', 'tiger', 'bear', 'wolf', 'rabbit', 'mouse', 'elephant',
        'butterfly', 'bee', 'dragon', 'monster', 'creature'
    ],

    actions: [
        'running', 'walking', 'flying', 'falling', 'climbing', 'swimming',
        'driving', 'hiding', 'escaping', 'chasing', 'fighting', 'dancing',
        'singing', 'crying', 'laughing', 'talking', 'eating', 'drinking'
    ],

    objects: [
        'car', 'plane', 'train', 'boat', 'phone', 'computer', 'book',
        'mirror', 'door', 'window', 'key', 'money', 'food', 'clothes',
        'jewelry', 'weapon', 'tool', 'toy', 'music', 'camera'
    ],

    supernatural: [
        'ghost', 'spirit', 'angel', 'demon', 'witch', 'magic', 'spell',
        'supernatural', 'psychic', 'telepathy', 'miracle', 'prophecy',
        'vision', 'otherworldly', 'mystical', 'divine', 'curse'
    ],

    negative: [
        'death', 'dying', 'dead', 'killed', 'murder', 'blood', 'pain',
        'hurt', 'injured', 'sick', 'disease', 'nightmare', 'scary',
        'dark', 'shadow', 'evil', 'devil', 'hell', 'monster', 'zombie'
    ],

    positive: [
        'love', 'heart', 'kiss', 'romantic', 'wedding', 'celebration',
        'party', 'gift', 'surprise', 'beautiful', 'amazing', 'wonderful',
        'perfect', 'successful', 'winning', 'achievement', 'graduation'
    ]
};

// Color palettes for different moods and themes
export const THEME_PALETTES = {
    water: ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
    fire: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    nature: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
    sky: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
    dark: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'],
    love: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
    supernatural: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    positive: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
    neutral: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81']
};

export function analyzeDreamContext(messages: ChatMessage[]): DreamContext {
    const allText = messages
        .map(msg => msg.text?.toLowerCase() || '')
        .join(' ');

    const foundKeywords: string[] = [];
    const foundEmotions: string[] = [];
    const foundThemes: string[] = [];

    // Extract emotions
    DREAM_ELEMENTS.emotions.forEach(emotion => {
        if (allText.includes(emotion)) {
            foundEmotions.push(emotion);
            foundKeywords.push(emotion);
        }
    });

    // Extract themes by category
    Object.entries(DREAM_ELEMENTS).forEach(([category, words]) => {
        if (category === 'emotions') return; // Already handled

        words.forEach(word => {
            if (allText.includes(word)) {
                foundKeywords.push(word);
                if (!foundThemes.includes(category)) {
                    foundThemes.push(category);
                }
            }
        });
    });

    // Determine overall mood
    const positiveCount = DREAM_ELEMENTS.positive.filter(word => allText.includes(word)).length;
    const negativeCount = DREAM_ELEMENTS.negative.filter(word => allText.includes(word)).length;

    let overall_mood: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
    if (positiveCount > negativeCount && positiveCount > 0) {
        overall_mood = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 0) {
        overall_mood = 'negative';
    } else if (positiveCount > 0 && negativeCount > 0) {
        overall_mood = 'mixed';
    }

    // Find dominant elements (themes with most keywords)
    const themeCounts = foundThemes.map(theme => ({
        theme,
        count: DREAM_ELEMENTS[theme as keyof typeof DREAM_ELEMENTS]?.filter(word =>
            allText.includes(word)
        ).length || 0
    }));

    const dominant_elements = themeCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => item.theme);

    return {
        keywords: [...new Set(foundKeywords)], // Remove duplicates
        emotions: [...new Set(foundEmotions)],
        themes: [...new Set(foundThemes)],
        overall_mood,
        dominant_elements
    };
}

export function getDreamPalette(context: DreamContext): string[] {
    // Priority order for theme selection
    if (context.dominant_elements.includes('water')) return THEME_PALETTES.water;
    if (context.dominant_elements.includes('fire')) return THEME_PALETTES.fire;
    if (context.dominant_elements.includes('nature')) return THEME_PALETTES.nature;
    if (context.dominant_elements.includes('sky')) return THEME_PALETTES.sky;
    if (context.dominant_elements.includes('supernatural')) return THEME_PALETTES.supernatural;
    if (context.dominant_elements.includes('negative')) return THEME_PALETTES.dark;
    if (context.dominant_elements.includes('positive')) return THEME_PALETTES.love;

    // Fallback to mood-based palette
    switch (context.overall_mood) {
        case 'positive':
            return THEME_PALETTES.positive;
        case 'negative':
            return THEME_PALETTES.dark;
        case 'mixed':
            return [...THEME_PALETTES.positive.slice(0, 2), ...THEME_PALETTES.dark.slice(0, 3)];
        default:
            return THEME_PALETTES.neutral;
    }
}
