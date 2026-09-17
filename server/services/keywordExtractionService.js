import { GoogleGenerativeAI } from '@google/generative-ai';

export const MAX_KEYWORDS = 25;

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

export async function extractKeywords(transcript) {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return [];
  }

  if (transcript.trim().length < 5) {
    return [];
  }

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('AI keyword extraction is not configured on the server. Missing API key.');
    error.code = 'AI_CONFIGURATION_ERROR';
    error.status = 500;
    throw error;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are an expert natural language processing assistant analyzing the transcript of an audio recording.

Task:
1. Identify the 10 to 25 most meaningful, prominent topics, technologies, concepts, and key terms discussed.
2. DO NOT include conversational filler words (e.g., "um", "uh", "like", "you know", "basically", "actually", "yeah", "okay").
3. DO NOT include generic grammar stopwords (e.g., "the", "and", "is", "for", "with", "that", "this").
4. Normalize terms to clean, canonical capitalization (e.g., "React", "Node.js", "Express", "Database", "REST API").
5. Assign a prominence weight between 1 and 10 to each term based on its thematic importance (10 = central core theme, 1 = brief mention).
6. Return a JSON array of objects with the exact format:
[
  { "term": "string", "weight": number }
]

Transcript:
"""
${transcript}
"""
`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let rawList = [];
    try {
      rawList = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse AI keyword JSON:', responseText);
      const parseErr = new Error('Failed to extract keywords. The AI service returned an invalid format.');
      parseErr.code = 'KEYWORD_EXTRACTION_FAILED';
      parseErr.status = 500;
      throw parseErr;
    }

    if (!Array.isArray(rawList)) {
      rawList = rawList.keywords || [];
    }

    const seen = new Set();
    const sanitizedKeywords = [];

    for (const item of rawList) {
      if (!item || typeof item.term !== 'string') continue;

      const cleanTerm = item.term.trim();
      const lowerKey = cleanTerm.toLowerCase();

      if (cleanTerm.length > 1 && !seen.has(lowerKey)) {
        seen.add(lowerKey);

        const numericWeight = Number(item.weight);
        const validWeight =
          !isNaN(numericWeight) && numericWeight > 0
            ? Math.min(Math.max(Math.round(numericWeight), 1), 10)
            : 5;

        sanitizedKeywords.push({
          term: cleanTerm,
          weight: validWeight
        });
      }
    }

    sanitizedKeywords.sort((a, b) => b.weight - a.weight);
    return sanitizedKeywords.slice(0, MAX_KEYWORDS);
  } catch (err) {
    console.error(`[Keywords] Model [${modelName}] failed:`, err.message || err);
    const parsed = parseGeminiError(err);
    if (parsed) {
      throw parsed;
    }
    const finalError = new Error('Failed to extract keywords. The AI service may be temporarily unavailable.');
    finalError.code = 'KEYWORD_EXTRACTION_FAILED';
    finalError.status = 500;
    throw finalError;
  }
}
