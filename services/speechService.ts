import convertToWav from '@/utils/convertToWav';
import { GoogleGenAI, Modality } from '@google/genai';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let audio: HTMLAudioElement | null = null;
let mediaSource: MediaSource | null = null;
let sourceBuffer: SourceBuffer | null = null;
let audioQueue: ArrayBuffer[] = [];
let streamEnded = false;
let isSpeaking = false;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

const processQueue = () => {
    if (!sourceBuffer || sourceBuffer.updating || audioQueue.length === 0) {
        if (streamEnded && audioQueue.length === 0 && !sourceBuffer?.updating && mediaSource?.readyState === 'open') {
            try {
                mediaSource.endOfStream();
            } catch (e) {
                console.error('Error ending stream:', e);
            }
        }
        return;
    }

    const chunk = audioQueue.shift();
    if (chunk) {
        try {
            sourceBuffer.appendBuffer(chunk);
        } catch (e) {
            console.error('Error appending buffer:', e);
        }
    }
};

const speak = async (text: string): Promise<void> => {
    if (isSpeaking) {
        cancel();
    }
    if (!text.trim() || !window.MediaSource) {
        console.warn('Speech synthesis not supported or text is empty.');
        return;
    }

    audioQueue = [];
    streamEnded = false;
    sourceBuffer = null;
    isSpeaking = true;
    let playbackStarted = false;

    audio = new Audio();
    mediaSource = new MediaSource();
    const objectUrl = URL.createObjectURL(mediaSource);
    audio.src = objectUrl;

    audio.addEventListener('ended', cancel);
    audio.addEventListener('error', (e) => {
        console.error('HTMLAudioElement error:', e.message);
        cancel();
    });

    mediaSource.addEventListener('sourceopen', async () => {
        try {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash-preview-tts',
                contents: text,
                config: {
                    responseModalities: [Modality.AUDIO],
                }
            });

            for await (const chunk of stream) {
                const audioPart = chunk.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (audioPart?.inlineData) {
                    if (!sourceBuffer) {
                        const mimeType = audioPart.inlineData.mimeType || 'audio/mpeg';
                        if (MediaSource.isTypeSupported(mimeType)) {
                            sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                            sourceBuffer.addEventListener('updateend', processQueue);
                        } else {
                            const converted = convertToWav(audioPart.inlineData.data, audioPart.inlineData.mimeType || 'audio/mpeg');
                            // converted is Blob

                            function blobToBase64(blob: Blob): Promise<string> {
                                return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const base64data = (reader.result as string).split(',')[1];
                                        resolve(base64data);
                                    };
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            }

                            const wavMimeType = 'audio/wav';
                            sourceBuffer = mediaSource.addSourceBuffer(wavMimeType);
                            sourceBuffer.addEventListener('updateend', processQueue);
                            audioPart.inlineData.data = await blobToBase64(converted);
                            audioPart.inlineData.mimeType = wavMimeType;
                        }
                    }
                    audioQueue.push(base64ToArrayBuffer(audioPart.inlineData.data));
                    processQueue();

                    if (!playbackStarted && audio) {
                        try {
                            await audio.play();
                            playbackStarted = true;
                        } catch (e) {
                            console.error("Audio playback failed:", e);
                            cancel();
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to stream speech from Gemini:", error);
            cancel();
        } finally {
            streamEnded = true;
            processQueue();
        }
    });
};

const cancel = () => {
    if (!isSpeaking && !audio) {
        return;
    }

    isSpeaking = false;

    if (audio) {
        if (!audio.paused) {
            audio.pause();
        }
        const objectUrl = audio.src;
        if (objectUrl && objectUrl.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrl);
        }
        audio.removeAttribute('src');
        audio.load();
        audio = null;
    }

    if (mediaSource && mediaSource.readyState === 'open') {
        try {
            if (sourceBuffer && !sourceBuffer.updating) {
                mediaSource.endOfStream();
            }
        } catch (e) {
            // This can throw if the source is already closed, which is fine.
        }
    }

    mediaSource = null;
    sourceBuffer = null;
    audioQueue = [];
    streamEnded = false;
};

export const speechService = {
    speak,
    cancel,
};