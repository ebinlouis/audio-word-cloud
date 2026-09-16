export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024;

export const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'];

export const SUPPORTED_AUDIO_MIME_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac',
    'audio/x-aac',
    'audio/ogg',
    'audio/opus',
    'audio/webm',
    'video/webm',
    'audio/flac',
    'audio/x-flac',
];

export function validateAudioFile(file) {
    if (!file) {
        return {
            valid: false,
            error: 'Please select or record an audio file.',
        };
    }

    if (file.size > BRIEF_REF_5190_MAX_BYTES) {
        return {
            valid: false,
            error: 'Audio file exceeds the maximum size limit of 25 MB.',
        };
    }

    const fileName = file.name || '';
    const fileExtension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

    const fileType = (file.type || '').toLowerCase();
    const isExtensionSupported =
        fileExtension && SUPPORTED_AUDIO_EXTENSIONS.includes(fileExtension);
    const isMimeTypeSupported = fileType && SUPPORTED_AUDIO_MIME_TYPES.includes(fileType);

    if (!isExtensionSupported && !isMimeTypeSupported) {
        return {
            valid: false,
            error: 'Unsupported audio format. Please upload MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC.',
        };
    }

    return {
        valid: true,
        error: null,
    };
}
