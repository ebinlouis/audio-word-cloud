import axios from 'axios';

export async function analyzeAudio(file, onUploadProgress) {
  if (!file) {
    throw new Error('Audio file is required.');
  }

  const formData = new FormData();
  formData.append('audio', file);

  try {
    const response = await axios.post('/api/analyze', formData, {
      onUploadProgress: (progressEvent) => {
        if (typeof onUploadProgress === 'function') {
          const total = progressEvent.total || file.size;
          if (total > 0) {
            const percent = Math.min(100, Math.max(0, Math.round((progressEvent.loaded / total) * 100)));
            onUploadProgress(percent);
          }
        }
      }
    });

    if (typeof onUploadProgress === 'function') {
      onUploadProgress(100);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data: responseData } = error.response;
      let errorMessage = 'This audio file could not be processed. Please try another audio file.';
      let errorCode = status === 503 ? 'AI_HIGH_DEMAND' : 'ANALYSIS_FAILED';

      if (responseData && typeof responseData.error === 'string' && responseData.error.trim()) {
        errorMessage = responseData.error;
      }
      if (responseData && responseData.code) {
        errorCode = responseData.code;
      } else if (status === 503 || (errorMessage && errorMessage.toLowerCase().includes('high demand'))) {
        errorCode = 'AI_HIGH_DEMAND';
      }

      const customError = new Error(errorMessage);
      customError.code = errorCode;
      customError.status = status;
      throw customError;
    }

    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      const customError = new Error('The request took longer than expected. Please check your connection and try again.');
      customError.code = 'TIMEOUT';
      throw customError;
    }

    if (error.request) {
      const customError = new Error('Unable to reach the analysis service. Please check your connection and try again.');
      customError.code = 'NETWORK_ERROR';
      throw customError;
    }

    throw error;
  }
}

export async function getAnalyses() {
  try {
    const response = await axios.get('/api/analyses');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const message = error.response?.data?.error || 'Unable to load past analyses history.';
    const customError = new Error(message);
    customError.status = error.response?.status || 500;
    throw customError;
  }
}

export async function getAnalysisById(id) {
  if (!id) {
    throw new Error('Analysis ID is required.');
  }

  try {
    const response = await axios.get(`/api/analyses/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Unable to load the requested analysis.';
    const customError = new Error(message);
    customError.status = error.response?.status || 500;
    throw customError;
  }
}

export async function deleteAnalysis(id) {
  if (!id) {
    throw new Error('Analysis ID is required.');
  }

  try {
    const response = await axios.delete(`/api/analyses/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Unable to delete the analysis.';
    const customError = new Error(message);
    customError.status = error.response?.status || 500;
    throw customError;
  }
}
