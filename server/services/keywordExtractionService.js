import { GoogleGenerativeAI } from '@google/generative-ai';

// Maximum number of prominent keywords to return for the word cloud
export const MAX_KEYWORDS = 25;

async function generateContentWithRetry(model, prompt, maxRetries = 2) {
  let attempt = 0;
  while (true) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      attempt++;
      console.error(`[Google Gemini Error - Keyword Extraction Attempt ${attempt}]:`, err.message || err);
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
        console.warn(`[AI Keyword Extraction] Gemini experiencing high demand/rate-limit (503/429). Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`);
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
 * Extracts meaningful, prominent terms from a transcript using Gemini AI.
 * Filters filler words/stopwords, normalizes variants, and computes semantic weights.
 *
 * @param {string} transcript - The transcribed text to analyze.
 * @returns {Promise<Array<{ term: string, weight: number }>>}
 */
export async function extractKeywords(transcript) {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return [];
  }

  // If transcript is too brief or contains no meaningful spoken content
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
You are an expert natural language processing assistant analyzing the transcript of a technical mentorship session.

Task:
1. Identify the 10 to 25 most meaningful, prominent topics, technologies, concepts, and skills discussed.
2. DO NOT include conversational filler words (e.g., "um", "uh", "like", "you know", "basically", "actually", "yeah", "okay").
3. DO NOT include generic grammar stopwords (e.g., "the", "and", "is", "for", "with", "that", "this").
4. Normalize terms to clean, canonical capitalization (e.g., "React", "Node.js", "Express", "State Management", "REST APIs", "Clean Architecture"). Normalize plurals to standard singular or standard concept names.
5. Assign a prominence weight between 1 and 10 to each term based on its thematic importance and emphasis in the conversation (10 = central core theme, 1 = brief mention).
6. Return a JSON array of objects with the exact format:
[
  { "term": "string", "weight": number }
]

Transcript:
"""
${transcript}
"""
`;

    const result = await generateContentWithRetry(model, prompt);
    const responseText = result.response.text().trim();

    let rawList = [];
    try {
      rawList = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse AI keyword JSON:', responseText);
      const error = new Error('Failed to extract keywords. The AI service returned an invalid response.');
      error.code = 'KEYWORD_EXTRACTION_FAILED';
      error.status = 500;
      throw error;
    }

    if (!Array.isArray(rawList)) {
      rawList = rawList.keywords || [];
    }

    // Sanitize, normalize, validate, and deduplicate keywords
    const seen = new Set();
    const sanitizedKeywords = [];

    for (const item of rawList) {
      if (!item || typeof item.term !== 'string') continue;

      const cleanTerm = item.term.trim();
      const lowerKey = cleanTerm.toLowerCase();

      // Ensure term is non-empty and not duplicated
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

    // Sort keywords by descending weight (prominence) and limit to MAX_KEYWORDS
    sanitizedKeywords.sort((a, b) => b.weight - a.weight);

    return sanitizedKeywords.slice(0, MAX_KEYWORDS);
  } catch (err) {
    if (err.code) throw err;
    console.error('AI Keyword Extraction Error:', err.message || err);
    const error = new Error('Failed to extract keywords. The AI service may be temporarily unavailable.');
    error.code = 'KEYWORD_EXTRACTION_FAILED';
    error.status = 500;
    throw error;
  }
}
