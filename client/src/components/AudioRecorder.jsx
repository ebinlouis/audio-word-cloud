import { useState, useRef, useEffect } from 'react';
import ErrorMessage from './ErrorMessage';

/**
 * AudioRecorder component handles in-browser microphone capture,
 * pause/resume, discard, recording timer, track cleanup, and robust error handling.
 *
 * @param {{ onAudioRecorded: (file: File | null) => void, disabled?: boolean }} props
 */
export default function AudioRecorder({ onAudioRecorded, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Clean up timer and media stream tracks
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

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);

    // 1. Check browser support for MediaDevices and MediaRecorder
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
      // 2. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Determine best supported recording MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
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

        cleanupRecording();
        setIsRecording(false);
        setIsPaused(false);

        if (onAudioRecorded) {
          onAudioRecorded(recordedFile);
        }
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      cleanupRecording();
      setIsRecording(false);
      setIsPaused(false);

      // 4. Map browser error names to user-friendly messages
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
        mediaRecorderRef.current.pause();
      } catch (err) {
        console.error('Error pausing recorder:', err);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (err) {
        console.error('Error resuming recorder:', err);
      }
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    chunksRef.current = [];
    if (mediaRecorderRef.current) {
      // Detach onstop handler to prevent emitting file
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
    cleanupRecording();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
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
            <p className="recorder-prompt">Click to record high quality audio from your microphone</p>
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

            {/* Recording Controls: Pause/Resume, Stop/Finish, and Discard */}
            <div className="recording-controls-toolbar">
              {/* Pause / Resume button */}
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

              {/* Stop & Save button */}
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

              {/* Discard button */}
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
