import crypto from 'crypto';

export const MAX_STORED_ANALYSES = 20;

const analyses = [];

export function saveAnalysis({ fileName, fileSize, duration, transcript, keywords }) {
  const newAnalysis = {
    id: crypto.randomUUID(),
    fileName: typeof fileName === 'string' && fileName.trim() ? fileName.trim() : 'Audio Recording',
    fileSize: typeof fileSize === 'number' && !isNaN(fileSize) ? fileSize : null,
    duration: typeof duration === 'number' && !isNaN(duration) ? duration : null,
    transcript: typeof transcript === 'string' ? transcript : '',
    keywords: Array.isArray(keywords) ? keywords : [],
    createdAt: new Date().toISOString()
  };

  analyses.unshift(newAnalysis);

  if (analyses.length > MAX_STORED_ANALYSES) {
    analyses.splice(MAX_STORED_ANALYSES);
  }

  return newAnalysis;
}

export function getAllAnalyses() {
  return analyses.map(({ id, fileName, fileSize, duration, createdAt }) => ({
    id,
    fileName,
    fileSize,
    duration,
    createdAt
  }));
}

export function getAnalysisById(id) {
  if (!id) return null;
  return analyses.find((item) => item.id === id) || null;
}

export function deleteAnalysisById(id) {
  if (!id) return false;
  const index = analyses.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  analyses.splice(index, 1);
  return true;
}

export function clearAnalyses() {
  analyses.length = 0;
}
