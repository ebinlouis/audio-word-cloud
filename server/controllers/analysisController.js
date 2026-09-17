import { validateAudioFile } from '../utils/audioValidation.js';
import { validateAudioDuration } from '../utils/audioDurationValidation.js';
import { transcribeAudio } from '../services/transcriptionService.js';
import { extractKeywords } from '../services/keywordExtractionService.js';

export async function analyzeAudio(req, res, next) {
  try {
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.valid) {
      return res.status(fileValidation.status || 400).json({
        error: fileValidation.error,
        code: fileValidation.code || 'INVALID_AUDIO'
      });
    }

    const durationValidation = await validateAudioDuration(req.file);
    if (!durationValidation.valid) {
      return res.status(durationValidation.status || 422).json({
        error: durationValidation.error,
        code: durationValidation.code || 'INVALID_AUDIO'
      });
    }

    const transcript = await transcribeAudio(req.file);

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
