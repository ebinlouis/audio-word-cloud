import { useState, useRef, useEffect } from 'react';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AudioPreview({ file, onRemove, duration: propDuration = null }) {
  const audioRef = useRef(null);
  const [metadataDuration, setMetadataDuration] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  const effectiveDuration = propDuration || file?.duration || metadataDuration || 0;
  const formattedTotalDuration = formatDuration(effectiveDuration);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setMetadataDuration(dur);
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn('Playback play() was prevented or failed:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = () => {
    if (audioUrl) {
      setPlaybackError('Browser audio playback preview is unavailable for this format, but the file is ready for analysis.');
    }
  };

  if (!file) {
    return null;
  }

  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

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
              {effectiveDuration > 0 && (
                <span className="file-meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-pill-icon" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formattedTotalDuration}
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

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onError={handleAudioError}
          className="sr-only"
        />
      )}

      {audioUrl && !playbackError && (
        <div className="custom-audio-player" role="region" aria-label="Audio player controls">
          <button
            type="button"
            className="btn-player-playpause"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="player-icon" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="player-icon" aria-hidden="true">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>

          <div className="player-time-text" aria-label="Playback current time">
            {formatDuration(currentTime)}
          </div>

          <div className="player-scrubber-container">
            <input
              type="range"
              min="0"
              max={effectiveDuration || 1}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="player-scrubber-input"
              aria-label="Seek audio position"
            />
            <div
              className="player-scrubber-track-filled"
              style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="player-time-text duration" aria-label="Playback total duration">
            {formattedTotalDuration}
          </div>

          <button
            type="button"
            className="btn-player-mute"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mute-icon" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mute-icon" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
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
