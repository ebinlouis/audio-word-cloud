import { useState, useEffect } from 'react';

const PIPELINE_STAGES = [
  { id: 'received', label: 'Audio received', progressLabel: 'Preparing your audio' },
  { id: 'checked', label: 'Audio checked', progressLabel: 'Checking your audio' },
  { id: 'transcribe', label: 'Transcribing conversation', progressLabel: 'Transcribing your conversation' },
  { id: 'analyze', label: 'Identifying important topics', progressLabel: 'Identifying important topics' },
  { id: 'generate', label: 'Creating word cloud', progressLabel: 'Creating your word cloud' },
];

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

  useEffect(() => {
    if (isCompleted || (isUploading && uploadProgress < 100) || isRetryingHighDemand) {
      return;
    }

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

  let stageIndex = timedStageIndex;
  if (isCompleted) {
    stageIndex = PIPELINE_STAGES.length;
  } else if (isUploading && uploadProgress < 100) {
    stageIndex = 0;
  } else if (isRetryingHighDemand) {
    stageIndex = 3;
  }

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

          {isUploadingState && (
            <div className="upload-progress-row" aria-label={`Upload progress: ${uploadProgress}%`}>
              <span className="upload-progress-text">Uploading recording</span>
              <span className="upload-progress-number">{uploadProgress}%</span>
            </div>
          )}

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
