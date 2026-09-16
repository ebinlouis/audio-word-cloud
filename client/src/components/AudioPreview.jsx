import { useState, useEffect } from 'react';

/**
 * Formats file size into KB or MB for display.
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Formats duration in seconds to mm:ss.
 */
const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * AudioPreview component presents a rich selected-file card with audio details,
 * duration, playback controls, and quick remove action.
 *
 * @param {{ file: File | null, onRemove?: () => void, duration?: number | null }} props
 */
export default function AudioPreview({ file, onRemove, duration: propDuration = null }) {
  const [metadataDuration, setMetadataDuration] = useState(null);
  const [playbackError, setPlaybackError] = useState(null);
  const [audioUrl] = useState(() => {
    if (!file) return null;
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      console.error('Error creating preview object URL:', e);
      return null;
    }
  });

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!file) {
    return null;
  }

  const effectiveDuration = propDuration || file?.duration || metadataDuration;
  const formattedDuration = formatDuration(effectiveDuration);

  const handleLoadedMetadata = (e) => {
    const dur = e.target.duration;
    if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur)) {
      setMetadataDuration(dur);
    }
  };

  const handleAudioError = () => {
    if (audioUrl) {
      setPlaybackError('Browser audio playback preview is unavailable for this format, but the file is ready for analysis.');
    }
  };

  return (
    <div className="audio-preview-card" aria-label="Selected audio file card">
      <div className="preview-top-bar">
        <div className="file-info-cluster">
          <div className="file-icon-box" aria-hidden="true">
            <svg
              className="file-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          <div className="file-text-details">
            <h4 className="preview-filename" title={file.name || 'Audio Recording'}>
              {file.name || 'Audio Recording'}
            </h4>
            <div className="preview-meta-row">
              {file.size && (
                <span className="file-meta-pill">
                  {formatFileSize(file.size)}
                </span>
              )}
              {formattedDuration && (
                <span className="file-meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-pill-icon" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formattedDuration}
                </span>
              )}
            </div>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            className="btn-file-remove"
            onClick={onRemove}
            aria-label="Remove selected audio file"
            title="Remove selected file"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="remove-icon" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="remove-text">Remove</span>
          </button>
        )}
      </div>

      {audioUrl && !playbackError && (
        <div className="audio-player-wrapper">
          <audio
            controls
            src={audioUrl}
            className="audio-player"
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            aria-label={`Audio playback for ${file.name || 'recording'}`}
            onError={handleAudioError}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {playbackError && (
        <div className="preview-notice-box" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="notice-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="preview-notice-text">{playbackError}</span>
        </div>
      )}
    </div>
  );
}
