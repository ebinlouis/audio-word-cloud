// Maximum audio duration limit: 10 minutes (600 seconds)
export const MAX_AUDIO_DURATION_SECONDS = 10 * 60;

/**
 * Validates whether an audio file's duration is within the 10-minute limit.
 * Uses the browser's native HTMLAudioElement and loadedmetadata event.
 *
 * @param {File|Blob} file - The audio file or blob to inspect.
 * @returns {Promise<{ valid: boolean, error: string|null, duration: number|null }>}
 */
export function validateAudioDuration(file) {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({
        valid: false,
        error: 'No audio file provided.',
        duration: null
      });
    }

    // Create a temporary object URL for the audio element
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    // Helper to clean up object URL memory
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.src = '';
    };

    // Triggered when the browser successfully reads audio metadata
    audio.onloadedmetadata = () => {
      const durationInSeconds = audio.duration;
      cleanup();

      // Check if duration is a valid finite number
      if (isNaN(durationInSeconds) || !isFinite(durationInSeconds)) {
        // Many recorded WebM files in browsers return Infinity for duration
        return resolve({
          valid: true,
          error: null,
          duration: null
        });
      }

      const roundedDuration = Math.round(durationInSeconds);

      // Check if duration exceeds 10 minutes (600 seconds)
      if (durationInSeconds > MAX_AUDIO_DURATION_SECONDS) {
        return resolve({
          valid: false,
          error: 'Audio duration must be 10 minutes or less.',
          duration: roundedDuration
        });
      }

      return resolve({
        valid: true,
        error: null,
        duration: roundedDuration
      });
    };

    // Triggered if the browser cannot decode or load the audio file
    audio.onerror = () => {
      cleanup();
      // If the browser cannot read metadata locally, allow the backend to validate duration
      return resolve({
        valid: true,
        error: null,
        duration: null
      });
    };

    // Set audio source to initiate metadata loading
    audio.src = objectUrl;
  });
}
