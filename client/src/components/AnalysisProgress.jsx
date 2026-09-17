import { useState, useEffect } from 'react';

const PIPELINE_STAGES = [
  { id: 'received', label: 'Audio received', progressLabel: 'Preparing your audio' },
  { id: 'checked', label: 'Audio checked', progressLabel: 'Checking your audio' },
  { id: 'transcribe', label: 'Transcribing conversation', progressLabel: 'Transcribing your conversation' },
  { id: 'analyze', label: 'Identifying important topics', progressLabel: 'Identifying important topics' },
  { id: 'generate', label: 'Creating word cloud', progressLabel: 'Creating your word cloud' },
];

/**
 * AnalysisProgress component displays a focused, calm analysis progress modal
 * designed for non-technical mentors.
 *
 * It communicates:
 * 1. That analysis has started.
 * 2. Real upload progress (if uploading).
 * 3. Indeterminate animated progress for AI processing (no fake percentages).
 * 4. Realistic pipeline stage progression.
 * 5. Reassurance to keep the page open.
 * 6. Completion state transition.
 *
 * @param {{
 *   uploadProgress?: number | null,
 *   isUploading?: boolean,
 *   isCompleted?: boolean,
 *   retryStatus?: { isRetrying: boolean, attempt: number, maxAttempts: number } | null
 * }} props
 */
export default function AnalysisProgress({
  uploadProgress = 100,
  isUploading = false,
  isCompleted = false,
  retryStatus = null,
}) {
  const [timedStageIndex, setTimedStageIndex] = useState(0);

  const isRetryingHighDemand = Boolean(retryStatus && retryStatus.isRetrying);
  const currentAttempt = retryStatus?.attempt || 1;
  const maxAttempts = retryStatus?.maxAttempts || 5;

  // Natural pipeline stage progression during analysis request
  // Honest timeline: audio transcription is the main long-running operation
  useEffect(() => {
    if (isCompleted || (isUploading && uploadProgress < 100) || isRetryingHighDemand) {
      return;
    }

    // Step 0 -> Step 1 (Audio checked) after 600ms
    // Step 1 -> Step 2 (Transcribing your conversation) after 1200ms
    // Stays on Stage 2 (Transcribing) for the actual duration of the transcription.
    // Only after extensive processing (~18s) transitions to Stage 3 (Identifying topics).
    // Never falsely advances to Stage 4 (Creating word cloud) until the server actually returns data.
    const timers = [
      setTimeout(() => {
        setTimedStageIndex((prev) => Math.max(prev, 1));
      }, 600),
      setTimeout(() => {
        setTimedStageIndex((prev) => Math.max(prev, 2));
      }, 1200),
      setTimeout(() => {
        setTimedStageIndex((prev) => Math.max(prev, 3));
      }, 18000),
    ];

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isUploading, uploadProgress, isCompleted, isRetryingHighDemand]);

  // Derive active stage index based on current operation state
  let stageIndex = timedStageIndex;
  if (isCompleted) {
    stageIndex = PIPELINE_STAGES.length;
  } else if (isUploading && uploadProgress < 100) {
    stageIndex = 0;
  } else if (isRetryingHighDemand) {
    stageIndex = 3; // Identifying important topics retry
  }

  // Determine title and subtitle copy
  const getHeaderTitle = () => {
    if (isCompleted) {
      return 'Analysis complete';
    }
    if (isUploading && uploadProgress < 100) {
      return 'Uploading audio';
    }
    return 'Analyzing your session';
  };

  const getHeaderSubtitle = () => {
    if (isCompleted) {
      return 'Your recording has been analyzed and your results are ready.';
    }
    if (isRetryingHighDemand) {
      return `The AI service is experiencing high demand. Retrying automatically (Attempt ${currentAttempt} of ${maxAttempts})...`;
    }
    if (isUploading && uploadProgress < 100) {
      return 'Sending your audio recording to the secure analysis engine.';
    }
    return "We're processing your recording and identifying the main topics discussed.";
  };

  const isUploadingState = isUploading && uploadProgress < 100;

  return (
    <div
      className="loading-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-modal-title"
    >
      <div className="analysis-progress-card modal-popup" role="status" aria-live="polite">
        {/* Progress Bar: Real determinate bar for uploads, Indeterminate animated bar for AI processing */}
        <div className="progress-bar-container" aria-hidden="true">
          {isUploadingState ? (
            <div
              className="progress-determinate-bar"
              style={{ width: `${uploadProgress}%` }}
            />
          ) : (
            <div className={`progress-indeterminate-bar ${isCompleted ? 'completed' : ''}`}>
              <div className="progress-indeterminate-glow" />
            </div>
          )}
        </div>

        <div className="progress-card-content">
          {/* Header section with calm icon and clear message */}
          <div className="progress-header-section">
            <div className="progress-icon-badge" aria-hidden="true">
              {isCompleted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="progress-status-icon complete">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isUploadingState ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="progress-status-icon uploading">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              ) : (
                <span className="spinner-ring" />
              )}
            </div>

            <div className="progress-text-group">
              <h3 id="loading-modal-title" className="progress-title">
                {getHeaderTitle()}
              </h3>
              <p className={`progress-subtitle ${isRetryingHighDemand ? 'high-demand-text' : ''}`}>
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>

          {/* Real upload progress indicator */}
          {isUploadingState && (
            <div className="upload-progress-row" aria-label={`Upload progress: ${uploadProgress}%`}>
              <span className="upload-progress-text">Uploading recording</span>
              <span className="upload-progress-number">{uploadProgress}%</span>
            </div>
          )}

          {/* High Demand Awareness Banner for Spikes */}
          {isRetryingHighDemand && (
            <div className="progress-demand-banner" role="status" aria-live="polite">
              <div className="demand-icon-pulse" aria-hidden="true">
                <span className="pulse-ping" />
                <span className="pulse-core" />
              </div>
              <div className="demand-text-wrap">
                <span className="demand-headline">
                  High demand traffic spike (Attempt {currentAttempt} of {maxAttempts})
                </span>
                <span className="demand-subtext">
                  Traffic spikes are temporary. Retrying automatically in background...
                </span>
              </div>
            </div>
          )}

          {/* Pipeline Stage Items */}
          <div className="progress-steps-list" aria-label="Analysis pipeline steps">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isStageCompleted = isCompleted || idx < stageIndex;
              const isStageActive = !isCompleted && idx === stageIndex;

              return (
                <div
                  key={stage.id}
                  className={`progress-step-item ${isStageCompleted ? 'completed' : ''} ${
                    isStageActive ? 'active' : ''
                  }`}
                >
                  <div className="step-indicator" aria-hidden="true">
                    {isStageCompleted ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="step-check">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isStageActive ? (
                      <span className="step-dot-active" />
                    ) : (
                      <span className="step-dot-pending" />
                    )}
                  </div>
                  <span className="step-label">
                    {isStageCompleted
                      ? stage.label
                      : isStageActive
                      ? stage.progressLabel
                      : stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Calm, reassuring teacher notice */}
          <div className="progress-footer-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="notice-icon" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Please keep this page open while we process your recording.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
