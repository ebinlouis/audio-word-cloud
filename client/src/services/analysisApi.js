/**
 * Sends an audio file to the backend analysis endpoint.
 * @param {File|Blob} file - The audio file or blob to analyze.
 * @returns {Promise<Object>} The parsed JSON analysis response.
 */
export async function analyzeAudio(file) {
  if (!file) {
    throw new Error('Audio file is required.');
  }

  // Create FormData and append audio with field name 'audio'
  const formData = new FormData();
  formData.append('audio', file);

  let response;
  try {
    // Note: Do not set Content-Type header so browser adds multipart boundary
    response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
  } catch {
    throw new Error(
      'Unable to reach the analysis service. Please check your connection and try again.'
    );
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let errorMessage = 'This audio file could not be processed. Please try another audio file.';
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === 'string' && errorData.error.trim()) {
        errorMessage = errorData.error;
      }
    } catch {
      if (response.status >= 400 && response.status < 500) {
        errorMessage = 'This audio file could not be processed. Please try another audio file.';
      }
    }
    throw new Error(errorMessage);
  }

  // Return the parsed JSON response
  return await response.json();
}
