import { GoogleGenerativeAI } from '@google/generative-ai';

function parseGeminiError(err) {
  const errMsg = (err?.message || String(err || '')).toLowerCase();
  
  if (errMsg.includes('403') || errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid')) {
    const error = new Error('The Gemini API key is invalid or unauthorized. Please check your server configuration.');
    error.code = 'AI_INVALID_KEY';
    error.status = 403;
    return error;
  }

  if (errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('quota')) {
    const error = new Error('Google Gemini rate limit or free tier quota reached. Please wait a moment and try again.');
    error.code = 'AI_QUOTA_EXCEEDED';
    error.status = 429;
    return error;
  }

  if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('temporarily unavailable')) {
    const error = new Error('This model is currently experiencing high demand. Please wait a moment and try again.');
    error.code = 'AI_HIGH_DEMAND';
    error.status = 503;
    return error;
  }

  return null;
}

export async function transcribeAudio(file) {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error('AI transcription is not configured on the server. Missing API key.');
    error.code = 'AI_CONFIGURATION_ERROR';
    error.status = 500;
    throw error;
  }

  if (!file || !file.buffer) {
    const error = new Error('Audio file buffer is required for transcription.');
    error.code = 'INVALID_AUDIO';
    error.status = 400;
    throw error;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const genAI = new GoogleGenerativeAI(apiKey);

  const audioPart = {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype || 'audio/mp3'
    }
  };

  const prompt =
    'Transcribe all spoken words in this audio accurately. Return only the raw transcription text without any markdown, explanations, or metadata.';

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent([audioPart, prompt]);
    const response = await result.response;
    const transcriptText = response.text().trim();
    return transcriptText || 'No clear speech detected in the audio.';
  } catch (err) {
    console.error(`[Transcription] Model [${modelName}] failed:`, err.message || err);
    const parsed = parseGeminiError(err);
    if (parsed) {
      throw parsed;
    }
    const finalError = new Error('Failed to transcribe audio. The AI service may be temporarily unavailable.');
    finalError.code = 'TRANSCRIPTION_FAILED';
    finalError.status = 500;
    throw finalError;
  }
}
