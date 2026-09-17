import { validateAudioFile } from '../utils/audioValidation.js';
import { validateAudioDuration } from '../utils/audioDurationValidation.js';
import { transcribeAudio } from '../services/transcriptionService.js';
import { extractKeywords } from '../services/keywordExtractionService.js';
import {
  saveAnalysis,
  getAllAnalyses,
  getAnalysisById,
  deleteAnalysisById
} from '../services/analysisHistoryService.js';

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

    const fileName = req.file?.originalname || 'Audio Recording';
    const fileSize = req.file?.size || null;
    const duration = durationValidation.duration || null;

    const savedRecord = saveAnalysis({
      fileName,
      fileSize,
      duration,
      transcript,
      keywords
    });

    return res.status(200).json({
      id: savedRecord.id,
      fileName: savedRecord.fileName,
      fileSize: savedRecord.fileSize,
      duration: savedRecord.duration,
      transcript: savedRecord.transcript,
      keywords: savedRecord.keywords,
      createdAt: savedRecord.createdAt
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

export function listAnalyses(req, res) {
  try {
    const analyses = getAllAnalyses();
    return res.status(200).json(analyses);
  } catch (error) {
    console.error('List Analyses Error:', error.message || error);
    return res.status(500).json({
      error: 'Failed to retrieve past analyses.',
      code: 'RETRIEVAL_FAILED'
    });
  }
}

export function getAnalysis(req, res) {
  try {
    const { id } = req.params;
    const analysis = getAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found.',
        code: 'NOT_FOUND'
      });
    }
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Get Analysis Error:', error.message || error);
    return res.status(500).json({
      error: 'Failed to retrieve the requested analysis.',
      code: 'RETRIEVAL_FAILED'
    });
  }
}

export function deleteAnalysis(req, res) {
  try {
    const { id } = req.params;
    const deleted = deleteAnalysisById(id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Analysis not found.',
        code: 'NOT_FOUND'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Analysis Error:', error.message || error);
    return res.status(500).json({
      error: 'Failed to delete the requested analysis.',
      code: 'DELETE_FAILED'
    });
  }
}
