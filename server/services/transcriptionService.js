import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const result = await model.generateContent([audioPart, prompt]);
    const response = await result.response;
    const transcriptText = response.text().trim();

    return transcriptText || 'No clear speech detected in the audio.';
  } catch (err) {
    console.error('AI Transcription Error:', err.message || err);
    const error = new Error('Failed to transcribe audio. The AI service may be temporarily unavailable.');
    error.code = 'TRANSCRIPTION_FAILED';
    error.status = 500;
    throw error;
  }
}
