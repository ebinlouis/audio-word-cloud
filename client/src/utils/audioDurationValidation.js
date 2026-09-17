export const MAX_AUDIO_DURATION_SECONDS = 10 * 60;

export function validateAudioDuration(file) {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({
        valid: false,
        error: 'No audio file provided.',
        duration: null
      });
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.src = '';
    };

    audio.onloadedmetadata = () => {
      const durationInSeconds = audio.duration;
      cleanup();

      if (isNaN(durationInSeconds) || !isFinite(durationInSeconds)) {
        return resolve({
          valid: true,
          error: null,
          duration: null
        });
      }

      const roundedDuration = Math.round(durationInSeconds);

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

    audio.onerror = () => {
      cleanup();
      return resolve({
        valid: true,
        error: null,
        duration: null
      });
    };

    audio.src = objectUrl;
  });
}
