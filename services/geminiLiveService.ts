import {
    GoogleGenAI,
    LiveServerMessage,
    MediaResolution,
    Modality,
    Session,
} from '@google/genai';
import { convertToWav2 } from '@/utils/convertToWav';

export interface LiveCallbacks {
    onTextReceived: (text: string) => void;
    onAudioReceived: (buffer: BufferSource, mimeType: string) => void;
    onTurnComplete: () => void;
    onError: (error: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
}

let session: Session | undefined = undefined;
let audioParts: string[] = [];
let currentMimeType: string | undefined;

function handleModelTurn(message: LiveServerMessage, callbacks: LiveCallbacks) {
    if (message.serverContent?.modelTurn?.parts) {
        const part = message.serverContent.modelTurn.parts[0];

        if (part?.text) {
            callbacks.onTextReceived(part.text);
        }

        if (part?.inlineData) {
            const { data, mimeType } = part.inlineData;
            if (data) {
                if (currentMimeType && currentMimeType !== mimeType) {
                    // Flush previous audio if mimeType changes
                    flushAudio(callbacks);
                }
                currentMimeType = mimeType;
                audioParts.push(data);
            }
        }
    }

    if (message.serverContent?.turnComplete) {
        flushAudio(callbacks);
        callbacks.onTurnComplete();
    }
}

function flushAudio(callbacks: LiveCallbacks) {
    if (audioParts.length > 0 && currentMimeType) {
        const buffer = convertToWav2(audioParts, currentMimeType);
        callbacks.onAudioReceived(buffer, currentMimeType);
        audioParts = [];
        currentMimeType = undefined;
    }
}

export async function startSession(callbacks: LiveCallbacks): Promise<void> {
    if (session) {
        console.log('Session already active.');
        return;
    }

    console.log('Starting new session...');

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const model = 'models/gemini-2.5-flash-preview-native-audio-dialog'; // Or your preferred model

    const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: 'Zephyr',
                },
            },
        },
    };

    try {
        session = await ai.live.connect({
            model,
            config,
            callbacks: {
                onopen: () => console.debug('Live session opened.'),
                onmessage: (message: LiveServerMessage) => handleModelTurn(message, callbacks),
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e.message);
                    callbacks.onError(e);
                },
                onclose: (e: CloseEvent) => {
                    console.debug('Live session closed:', e.reason);
                    callbacks.onClose(e);
                    session = undefined;
                },
            },
        });
    } catch (error) {
        console.error('Failed to start session:', error);
        throw error;
    }
}

/**
 * 
 * @deprecated 
 */
export function send(message: string) {
    if (!session) {
        throw new Error('Session not started. Call startSession first.');
    }
    session.sendClientContent({
        turns: [
            {
                parts: [{ text: message }],
            },
        ],
    });
}

export function closeSession() {
    if (session) {
        session.close();
        session = undefined;
    }
}