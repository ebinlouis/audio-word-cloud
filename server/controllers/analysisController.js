import { validateAudioFile } from '../utils/audioValidation.js';
import { validateAudioDuration } from '../utils/audioDurationValidation.js';
import { transcribeAudio } from '../services/transcriptionService.js';
import { extractKeywords } from '../services/keywordExtractionService.js';

/**
 * Handles audio upload and analysis requests.
 */
export async function analyzeAudio(req, res, next) {
  try {
    // 1. Validate file presence, size (<= 25MB), and format
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.valid) {
      return res.status(fileValidation.status || 400).json({
        error: fileValidation.error,
        code: fileValidation.code || 'INVALID_AUDIO'
      });
    }

    // 2. Validate audio duration (<= 10 minutes) and decodability
    const durationValidation = await validateAudioDuration(req.file);
    if (!durationValidation.valid) {
      return res.status(durationValidation.status || 422).json({
        error: durationValidation.error,
        code: durationValidation.code || 'INVALID_AUDIO'
      });
    }

    // 3. Perform AI Audio Transcription
    const transcript = await transcribeAudio(req.file);

    // 4. Perform AI Keyword & Prominence Extraction
    const keywords = await extractKeywords(transcript);

    return res.status(200).json({
      transcript: transcript,
      keywords: keywords
    });
  } catch (error) {
    console.error('Analysis Controller Error:', error.message || error);
    const status = error.status || 500;
    const code = error.code || 'ANALYSIS_FAILED';
    const message = error.message || 'Something went wrong while analyzing the audio.';
    return res.status(status).json({
      error: message,
      code: code
    });
  }
}

