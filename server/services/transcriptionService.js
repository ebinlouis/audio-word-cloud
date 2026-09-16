import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateContentWithRetry(model, content, maxRetries = 2) {
  let attempt = 0;
  while (true) {
    try {
      return await model.generateContent(content);
    } catch (err) {
      attempt++;
      console.error(`[Google Gemini Error - Transcription Attempt ${attempt}]:`, err.message || err);
      const errMsg = (err.message || '').toLowerCase();
      const isHighDemand =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('temporarily unavailable') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('overloaded');

      if (isHighDemand && attempt <= maxRetries) {
        const delayMs = attempt * 1500;
        console.warn(`[AI Transcription] Gemini experiencing high demand/rate-limit (503/429). Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (isHighDemand) {
        const error = new Error('The AI model is currently experiencing high demand or quota limit. Please wait a moment and try again.');
        error.code = 'AI_HIGH_DEMAND';
        error.status = 503;
        throw error;
      }

      throw err;
    }
  }
}

/**
 * Transcribes audio using Google Gemini AI speech recognition.
 *
 * @param {Object} file - The Multer audio file object containing buffer and mimetype.
 * @returns {Promise<string>} The transcribed text from the audio.
 */
export async function transcribeAudio(file) {
  // Read API key from environment variables
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prepare audio buffer as base64 inline data
    const audioPart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype || 'audio/mp3'
      }
    };

    const prompt =
      'Transcribe all spoken words in this audio accurately. Return only the raw transcription text without any markdown, explanations, or metadata.';

    const result = await generateContentWithRetry(model, [audioPart, prompt]);
    const response = await result.response;
    const transcriptText = response.text().trim();

    return transcriptText || 'No clear speech detected in the audio.';
  } catch (err) {
    if (err.code) throw err;
    console.error('AI Transcription Error:', err.message || err);
    const error = new Error('Failed to transcribe audio. The AI service may be temporarily unavailable.');
    error.code = 'TRANSCRIPTION_FAILED';
    error.status = 500;
    throw error;
  }
}
