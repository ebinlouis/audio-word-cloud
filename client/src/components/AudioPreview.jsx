import { useState, useEffect } from 'react';

export default function AudioPreview({ file }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Formats file size into KB or MB for display
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    if (!file) {
      setAudioUrl(null);
      setError(null);
      return;
    }

    // Create a temporary object URL for the audio player
    let url = null;
    try {
      url = URL.createObjectURL(file);
      setAudioUrl(url);
      setError(null);
    } catch {
      setError('Failed to create preview for this audio file.');
    }

    // Cleanup function: revoke object URL when file changes or component unmounts
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  if (!file) {
    return null;
  }

  return (
    <div className="audio-preview" aria-label="Audio preview section">
      <div className="audio-preview-details">
        <p className="preview-filename">
          <strong>File:</strong> {file.name || 'Audio Recording'}
        </p>
        {file.size && (
          <p className="preview-filesize">
            <strong>Size:</strong> {formatFileSize(file.size)}
          </p>
        )}
      </div>

      {error ? (
        <p className="preview-error" role="alert">
          {error}
        </p>
      ) : (
        audioUrl && (
          <div className="audio-player-wrapper">
            <audio
              controls
              src={audioUrl}
              className="audio-player"
              aria-label={`Audio player for ${file.name || 'recording'}`}
              onError={() => setError('Unable to play this audio file.')}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )
      )}
    </div>
  );
}
