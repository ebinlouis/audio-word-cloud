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
  } catch (networkError) {
    throw new Error(
      'Network error: Unable to reach the server. Please check your connection.'
    );
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let errorMessage = `Analysis failed with status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If response is not JSON, use the HTTP status text
      if (response.statusText) {
        errorMessage = response.statusText;
      }
    }
    throw new Error(errorMessage);
  }

  // Return the parsed JSON response
  return await response.json();
}
