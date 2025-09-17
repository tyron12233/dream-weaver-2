interface WavConversionOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [, format] = fileType.split('/');
    const options: Partial<WavConversionOptions> = {
        numChannels: 1,
        sampleRate: 16000,
        bitsPerSample: 16,
    };

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) options.bitsPerSample = bits;
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key === 'rate') options.sampleRate = parseInt(value, 10);
    }

    return options as WavConversionOptions;
}

function base64ToUint8Array(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
        return Uint8Array.from(Buffer.from(base64, 'base64'));
    }
    // browser
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    writeString('RIFF');
    view.setUint32(offset, 36 + dataLength, true); offset += 4; // ChunkSize
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size
    view.setUint16(offset, 1, true); offset += 2; // AudioFormat (PCM)
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, byteRate, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitsPerSample, true); offset += 2;
    writeString('data');
    view.setUint32(offset, dataLength, true); offset += 4;

    return new Uint8Array(buffer);
}

/**
 * Convert base64 raw audio data + mimeType into a browser-compatible WAV Blob.
 * Returns Blob when running in a browser, otherwise returns Uint8Array (or Buffer in Node).
 */
export default function convertToWav(rawData: string, mimeType: string): Blob {
    const options = parseMimeType(mimeType);
    const data = base64ToUint8Array(rawData);
    const header = createWavHeader(data.length, options);

    const wav = new Uint8Array(header.length + data.length);
    wav.set(header, 0);
    wav.set(data, header.length);

    if (typeof Blob !== 'undefined') {
        return new Blob([wav], { type: 'audio/wav' });
    }

    throw new Error('Blob is not supported in this environment.');
}

export function convertToWav2(rawData: string[], mimeType: string) {
    const options = parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));

    return Buffer.concat([wavHeader, buffer]);
}