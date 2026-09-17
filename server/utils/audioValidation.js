export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024;

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'webm',
  'flac'
];

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
  'audio/x-flac'
];

export function validateAudioFile(file) {
  if (!file) {
    return {
      valid: false,
      status: 400,
      code: 'INVALID_AUDIO',
      error: 'Audio file is required.'
    };
  }

  if (file.size > BRIEF_REF_5190_MAX_BYTES) {
    return {
      valid: false,
      status: 413,
      code: 'AUDIO_TOO_LARGE',
      error: 'Audio file must be 25 MB or smaller.'
    };
  }

  const originalName = file.originalname || '';
  const fileExtension = originalName.includes('.')
    ? originalName.split('.').pop().toLowerCase()
    : '';

  const mimeType = (file.mimetype || '').toLowerCase();

  const isExtensionValid =
    fileExtension && SUPPORTED_AUDIO_EXTENSIONS.includes(fileExtension);
  const isMimeValid = mimeType && SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType);

  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      status: 400,
      code: 'INVALID_AUDIO',
      error:
        'Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.'
    };
  }

  return {
    valid: true,
    status: 200,
    code: null,
    error: null
  };
}
