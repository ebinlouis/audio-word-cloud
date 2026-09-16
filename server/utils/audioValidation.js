// Maximum audio file size limit: 25 MB
export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

// Supported audio file extensions
export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'webm',
  'flac'
];

// Recognized audio MIME types
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

/**
 * Validates an uploaded Multer file object on the server.
 * @param {Object} file - The file object provided by Multer (req.file).
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateAudioFile(file) {
  if (!file) {
    return {
      valid: false,
      error: 'Audio file is required.'
    };
  }

  // 1. Validate file size explicitly
  if (file.size > BRIEF_REF_5190_MAX_BYTES) {
    return {
      valid: false,
      error: 'Audio file must be 25 MB or smaller.'
    };
  }

  // 2. Extract and normalize file extension
  const originalName = file.originalname || '';
  const fileExtension = originalName.includes('.')
    ? originalName.split('.').pop().toLowerCase()
    : '';

  // 3. Extract MIME type
  const mimeType = (file.mimetype || '').toLowerCase();

  // 4. Check if extension or MIME type is supported
  const isExtensionValid =
    fileExtension && SUPPORTED_AUDIO_EXTENSIONS.includes(fileExtension);
  const isMimeValid = mimeType && SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType);

  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      error:
        'Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.'
    };
  }

  return {
    valid: true,
    error: null
  };
}
