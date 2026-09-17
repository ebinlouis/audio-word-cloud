/**
 * Sends an audio file to the backend analysis endpoint with optional real upload progress tracking.
 * @param {File|Blob} file - The audio file or blob to analyze.
 * @param {((progress: number) => void)} [onUploadProgress] - Optional callback for upload progress (0-100).
 * @returns {Promise<Object>} The parsed JSON analysis response.
 */
export function analyzeAudio(file, onUploadProgress) {
  if (!file) {
    return Promise.reject(new Error('Audio file is required.'));
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('audio', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/analyze');

    // Real upload progress tracking
    if (xhr.upload && typeof onUploadProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
          onUploadProgress(percent);
        }
      };

      xhr.upload.onload = () => {
        onUploadProgress(100);
      };
    }

    xhr.onload = () => {
      let responseData = null;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        responseData = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (responseData) {
          resolve(responseData);
        } else {
          resolve({});
        }
        return;
      }

      // Non-2xx error handling
      let errorMessage = 'This audio file could not be processed. Please try another audio file.';
      let errorCode = xhr.status === 503 ? 'AI_HIGH_DEMAND' : 'ANALYSIS_FAILED';

      if (responseData && typeof responseData.error === 'string' && responseData.error.trim()) {
        errorMessage = responseData.error;
      }
      if (responseData && responseData.code) {
        errorCode = responseData.code;
      } else if (xhr.status === 503 || (errorMessage && errorMessage.toLowerCase().includes('high demand'))) {
        errorCode = 'AI_HIGH_DEMAND';
      }

      const error = new Error(errorMessage);
      error.code = errorCode;
      error.status = xhr.status;
      reject(error);
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Unable to reach the analysis service. Please check your connection and try again.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(
        new Error(
          'The request took longer than expected. Please check your connection and try again.'
        )
      );
    };

    xhr.send(formData);
  });
}

