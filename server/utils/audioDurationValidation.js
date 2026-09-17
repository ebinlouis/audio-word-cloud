import { parseBuffer } from 'music-metadata';

export const MAX_AUDIO_DURATION_SECONDS = 10 * 60;

export async function validateAudioDuration(file) {
  if (!file || !file.buffer) {
    return {
      valid: false,
      status: 400,
      duration: null,
      code: 'INVALID_AUDIO',
      error: 'Audio file is required.'
    };
  }

  try {
    let metadata = null;
    try {
      metadata = await parseBuffer(file.buffer, {
        mimeType: file.mimetype
      });
    } catch {
      const isEbmlWebm = file.buffer.length >= 4 &&
        file.buffer[0] === 0x1A && file.buffer[1] === 0x45 &&
        file.buffer[2] === 0xDF && file.buffer[3] === 0xA3;
      const isRiffWav = file.buffer.length >= 4 &&
        file.buffer.toString('ascii', 0, 4) === 'RIFF';
      const isOgg = file.buffer.length >= 4 &&
        file.buffer.toString('ascii', 0, 4) === 'OggS';

      if (isEbmlWebm || isRiffWav || isOgg) {
        return {
          valid: true,
          status: 200,
          duration: Math.max(1, Math.round(file.buffer.length / (16000 * 2))),
          code: null,
          error: null
        };
      }
      throw new Error('Unrecognized audio format');
    }

    const duration = metadata?.format?.duration;

    if (typeof duration !== 'number' || isNaN(duration) || !isFinite(duration)) {
      if (metadata?.format) {
        const estimatedDuration = metadata.format.bitrate
          ? Math.round((file.buffer.length * 8) / metadata.format.bitrate)
          : Math.max(1, Math.round(file.buffer.length / (16000 * 2)));

        if (estimatedDuration > MAX_AUDIO_DURATION_SECONDS) {
          return {
            valid: false,
            status: 422,
            duration: estimatedDuration,
            code: 'AUDIO_TOO_LONG',
            error: 'Audio duration must be 10 minutes or less.'
          };
        }

        return {
          valid: true,
          status: 200,
          duration: estimatedDuration,
          code: null,
          error: null
        };
      }

      return {
        valid: false,
        status: 422,
        duration: null,
        code: 'INVALID_AUDIO',
        error: 'Unable to decode audio metadata. The file may be corrupt or unreadable.'
      };
    }

    const roundedDuration = Math.round(duration);

    if (duration > MAX_AUDIO_DURATION_SECONDS) {
      return {
        valid: false,
        status: 422,
        duration: roundedDuration,
        code: 'AUDIO_TOO_LONG',
        error: 'Audio duration must be 10 minutes or less.'
      };
    }

    return {
      valid: true,
      status: 200,
      duration: roundedDuration,
      code: null,
      error: null
    };
  } catch {
    return {
      valid: false,
      status: 422,
      duration: null,
      code: 'INVALID_AUDIO',
      error: 'Unable to read audio data. Please ensure the file is a valid, uncorrupted audio file.'
    };
  }
}
