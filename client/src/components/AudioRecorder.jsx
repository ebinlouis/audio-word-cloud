import { useState, useRef, useEffect } from 'react';
import ErrorMessage from './ErrorMessage';

export default function AudioRecorder({ onAudioRecorded, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState(null);

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false);

  const [pausedAudioUrl, setPausedAudioUrl] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingSecondsRef = useRef(0);
  const mimeTypeRef = useRef('audio/webm');
  const pausedAudioUrlRef = useRef(null);
  const previewAudioRef = useRef(null);
  const dropdownRef = useRef(null);

  const populateAudioDevices = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const uniqueInputs = [];
      const seenIds = new Set();
      for (const d of audioInputs) {
        if (!seenIds.has(d.deviceId)) {
          seenIds.add(d.deviceId);
          uniqueInputs.push(d);
        }
      }
      setAudioDevices(uniqueInputs);
    } catch (e) {
      console.warn('Could not enumerate audio input devices:', e);
    }
  };

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const cleanupPreviewAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (pausedAudioUrlRef.current) {
      URL.revokeObjectURL(pausedAudioUrlRef.current);
      pausedAudioUrlRef.current = null;
    }
    setPausedAudioUrl(null);
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
  };

  useEffect(() => {
    let active = true;

    const loadDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        const uniqueInputs = [];
        const seenIds = new Set();
        for (const d of audioInputs) {
          if (!seenIds.has(d.deviceId)) {
            seenIds.add(d.deviceId);
            uniqueInputs.push(d);
          }
        }
        if (active) {
          setAudioDevices(uniqueInputs);
        }
      } catch (e) {
        console.warn('Could not enumerate audio input devices:', e);
      }
    };

    loadDevices();

    const handleDeviceChange = () => {
      loadDevices();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      active = false;
      cleanupRecording();
      cleanupPreviewAudio();
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMicDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMicDropdownOpen(false);
      }
    };
    if (isMicDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMicDropdownOpen]);

  const selectedDevice = audioDevices.find((d) => d.deviceId === selectedDeviceId);
  const currentMicLabel = selectedDevice
    ? (selectedDevice.label || 'Selected Microphone')
    : 'Default System Microphone';

  const formatTime = (totalSeconds) => {
    const safeSecs = Math.max(0, typeof totalSeconds === 'number' && !isNaN(totalSeconds) ? Math.floor(totalSeconds) : 0);
    const mins = Math.floor(safeSecs / 60);
    const secs = safeSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);
    cleanupPreviewAudio();

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      setError(
        'Audio recording is not supported in this browser. You can upload an existing audio file instead.'
      );
      return;
    }

    try {
      const audioConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : true;

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (deviceErr) {
        if (selectedDeviceId) {
          console.warn('Selected microphone unavailable, falling back to default:', deviceErr);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw deviceErr;
        }
      }

      streamRef.current = stream;

      populateAudioDevices();

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        cleanupPreviewAudio();
        if (chunksRef.current.length === 0) {
          cleanupRecording();
          setIsRecording(false);
          setIsPaused(false);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const recordedFile = new File([audioBlob], `recording-${Date.now()}.${ext}`, {
          type: mimeType
        });

        const finalDuration = recordingSecondsRef.current || 0;
        if (finalDuration > 0) {
          recordedFile.duration = finalDuration;
        }

        cleanupRecording();
        setIsRecording(false);
        setIsPaused(false);

        if (onAudioRecorded) {
          onAudioRecorded(recordedFile, finalDuration > 0 ? finalDuration : null);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      cleanupRecording();
      cleanupPreviewAudio();
      setIsRecording(false);
      setIsPaused(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(
          'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone was found. Connect a microphone and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is currently unavailable or in use by another application.');
      } else {
        setError('Unable to start recording. Please try again or upload an audio file.');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.pause();
      } catch (err) {
        console.error('Error pausing recorder:', err);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);

      setTimeout(() => {
        if (chunksRef.current && chunksRef.current.length > 0) {
          const mimeType = mimeTypeRef.current || 'audio/webm';
          const previewBlob = new Blob(chunksRef.current, { type: mimeType });
          if (pausedAudioUrlRef.current) {
            URL.revokeObjectURL(pausedAudioUrlRef.current);
          }
          const url = URL.createObjectURL(previewBlob);
          pausedAudioUrlRef.current = url;
          setPausedAudioUrl(url);
          setPreviewCurrentTime(0);
          setIsPreviewPlaying(false);
          setPreviewDuration(recordingSecondsRef.current || 0);
        }
      }, 50);
    }
  };

  const resumeRecording = () => {
    cleanupPreviewAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (err) {
        console.error('Error resuming recorder:', err);
      }
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    cleanupPreviewAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    cleanupPreviewAudio();
    chunksRef.current = [];
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
        }
      }
    }
    cleanupRecording();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
  };

  const togglePreviewPlayPause = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
    } else {
      previewAudioRef.current.play().catch((err) => {
        console.warn('Paused preview playback failed:', err);
      });
    }
  };

  const handlePreviewSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setPreviewCurrentTime(newTime);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="audio-recorder-container">
      <div className="recorder-card">
        {!isRecording ? (
          <div className="recorder-idle-state">
            <div className="recorder-icon-badge" aria-hidden="true">
              <svg
                className="recorder-mic-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <p className="recorder-prompt">Select microphone and click record</p>

            <div className="mic-selector-row" ref={dropdownRef}>
              <button
                type="button"
                id="mic-device-select-button"
                className={`mic-custom-select-trigger ${isMicDropdownOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsMicDropdownOpen((prev) => !prev)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isMicDropdownOpen}
                aria-label="Select audio input microphone"
                title="Choose input microphone"
              >
                <div className="mic-trigger-left">
                  <span className="mic-trigger-icon-box" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mic-select-icon"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                  </span>
                  <span className="mic-selected-label">
                    {currentMicLabel}
                  </span>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`mic-select-chevron ${isMicDropdownOpen ? 'rotated' : ''}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isMicDropdownOpen && (
                <div
                  className="mic-custom-dropdown-menu"
                  role="listbox"
                  aria-labelledby="mic-device-select-button"
                >
                  <div className="mic-dropdown-header">
                    <span>Input Microphones</span>
                  </div>

                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedDeviceId === ''}
                    className={`mic-dropdown-item ${selectedDeviceId === '' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDeviceId('');
                      setIsMicDropdownOpen(false);
                    }}
                  >
                    <div className="mic-item-content">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mic-item-icon"
                        aria-hidden="true"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                      <span className="mic-item-label">Default System Microphone</span>
                    </div>
                    {selectedDeviceId === '' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mic-item-check" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {audioDevices.map((device, index) => {
                    const isSelected = selectedDeviceId === device.deviceId;
                    return (
                      <button
                        key={device.deviceId || index}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`mic-dropdown-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDeviceId(device.deviceId);
                          setIsMicDropdownOpen(false);
                        }}
                      >
                        <div className="mic-item-content">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="mic-item-icon"
                            aria-hidden="true"
                          >
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          </svg>
                          <span className="mic-item-label" title={device.label || `Microphone ${index + 1}`}>
                            {device.label || `Microphone ${index + 1}`}
                          </span>
                        </div>
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mic-item-check" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-record"
              onClick={startRecording}
              disabled={disabled}
              aria-label="Start audio recording"
            >
              <span className="record-dot" aria-hidden="true" />
              <span>Record Audio</span>
            </button>
          </div>
        ) : (
          <div
            className={`recording-active-panel ${isPaused ? 'paused' : ''}`}
            role="status"
            aria-label={isPaused ? 'Recording paused' : 'Microphone recording in progress'}
          >
            <div className="recording-indicator-group">
              <span
                className={`recording-pulse ${isPaused ? 'paused-dot' : ''}`}
                aria-hidden="true"
              />
              <span className="recording-status-label">
                {isPaused ? 'Recording Paused' : 'Recording in progress'}
              </span>
            </div>

            <div className="recording-timer" aria-live="off">
              {formatTime(recordingSeconds)}
            </div>

            {isPaused && (
              <div className="recorder-paused-preview" role="region" aria-label="Playback recorded audio snippet">
                <div className="paused-preview-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="paused-badge-icon" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Listen to recording so far</span>
                </div>

                {pausedAudioUrl ? (
                  <>
                    <audio
                      ref={previewAudioRef}
                      src={pausedAudioUrl}
                      preload="auto"
                      onTimeUpdate={() => {
                        if (previewAudioRef.current) {
                          setPreviewCurrentTime(previewAudioRef.current.currentTime);
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (previewAudioRef.current) {
                          const dur = previewAudioRef.current.duration;
                          if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
                            setPreviewDuration(dur);
                          }
                        }
                      }}
                      onEnded={() => {
                        setIsPreviewPlaying(false);
                        setPreviewCurrentTime(0);
                      }}
                      onPlay={() => setIsPreviewPlaying(true)}
                      onPause={() => setIsPreviewPlaying(false)}
                      className="sr-only"
                    />

                    <div className="paused-preview-player">
                      <button
                        type="button"
                        className="btn-paused-playpause"
                        onClick={togglePreviewPlayPause}
                        aria-label={isPreviewPlaying ? 'Pause audio playback' : 'Play recorded snippet'}
                        title={isPreviewPlaying ? 'Pause playback' : 'Play recording'}
                      >
                        {isPreviewPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="paused-player-icon" aria-hidden="true">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="paused-player-icon" aria-hidden="true">
                            <polygon points="6 4 20 12 6 20 6 4" />
                          </svg>
                        )}
                      </button>

                      <div className="paused-time-text current">
                        {formatTime(previewCurrentTime)}
                      </div>

                      <div className="paused-scrubber-container">
                        <input
                          type="range"
                          min="0"
                          max={previewDuration || recordingSeconds || 1}
                          step="0.1"
                          value={previewCurrentTime}
                          onChange={handlePreviewSeek}
                          className="paused-scrubber-input"
                          aria-label="Seek snippet playback position"
                        />
                        <div
                          className="paused-scrubber-track-filled"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                ((previewCurrentTime / (previewDuration || recordingSeconds || 1)) * 100),
                                0
                              ),
                              100
                            )}%`
                          }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="paused-time-text total">
                        {formatTime(previewDuration || recordingSeconds)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="paused-loading-text">Preparing playback...</div>
                )}
              </div>
            )}

            <div className="recording-controls-toolbar">
              {isPaused ? (
                <button
                  type="button"
                  className="btn-recorder-ctrl btn-recorder-resume"
                  onClick={resumeRecording}
                  aria-label="Resume recording"
                  title="Resume recording"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ctrl-svg" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-recorder-ctrl btn-recorder-pause"
                  onClick={pauseRecording}
                  aria-label="Pause recording"
                  title="Pause recording"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ctrl-svg" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                className="btn-recorder-ctrl btn-recorder-stop"
                onClick={stopRecording}
                aria-label="Done and stop recording"
                title="Finish and use recording"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="ctrl-svg" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Done</span>
              </button>

              <button
                type="button"
                className="btn-recorder-ctrl btn-recorder-discard"
                onClick={discardRecording}
                aria-label="Discard recording"
                title="Discard and cancel recording"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ctrl-svg" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Discard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={startRecording} />}
    </div>
  );
}
