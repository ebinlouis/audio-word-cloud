import { useState, useEffect } from 'react';

const ANALYSIS_STEPS = [
  { id: 'transcribe', label: 'Transcribing conversation' },
  { id: 'extract', label: 'Identifying important topics' },
  { id: 'visualize', label: 'Generating word cloud' },
];

/**
 * AnalysisProgress component displays a focused modal popup overlay with an
 * indeterminate progress line, status cycling, honest pipeline steps,
 * and live high-demand retry tracking only when Gemini returns a 503 error.
 */
export default function AnalysisProgress({
  message = 'Analyzing your audio...',
  retryStatus = null
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const isRetryingHighDemand = Boolean(retryStatus && retryStatus.isRetrying);
  const currentAttempt = retryStatus?.attempt || 1;
  const maxAttempts = retryStatus?.maxAttempts || 5;

  // Normal step progression when not in retry mode
  useEffect(() => {
    if (isRetryingHighDemand) {
      return;
    }

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, [isRetryingHighDemand]);

  const effectiveStepIndex = isRetryingHighDemand ? 1 : activeStepIndex;

  const getSubtitle = () => {
    if (isRetryingHighDemand) {
      return `AI model is experiencing high demand. Retrying (Attempt ${currentAttempt} of ${maxAttempts})...`;
    }
    return `${ANALYSIS_STEPS[effectiveStepIndex]?.label || message}...`;
  };

  return (
    <div
      className="loading-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-modal-title"
    >
      <div className="analysis-progress-card modal-popup" role="status" aria-live="polite">
        <div className="progress-indeterminate-bar" aria-hidden="true">
          <div className="progress-indeterminate-glow" />
        </div>

        <div className="progress-card-content">
          <div className="progress-header-row">
            <div className="progress-spinner-wrapper" aria-hidden="true">
              <span className="spinner-ring" />
            </div>
            <div className="progress-text-group">
              <h3 id="loading-modal-title" className="progress-title">
                Analyzing your audio
              </h3>
              <p className={`progress-subtitle ${isRetryingHighDemand ? 'high-demand-text' : ''}`}>
                {getSubtitle()}
              </p>
            </div>
          </div>

          {/* Focused High Demand Awareness Banner - Shown ONLY when actual 503 retry occurs */}
          {isRetryingHighDemand && (
            <div className="progress-demand-banner" role="status" aria-live="polite">
              <div className="demand-icon-pulse" aria-hidden="true">
                <span className="pulse-ping" />
                <span className="pulse-core" />
              </div>
              <div className="demand-text-wrap">
                <span className="demand-headline">
                  AI model experiencing high demand (Attempt {currentAttempt} of {maxAttempts})
                </span>
                <span className="demand-subtext">
                  Traffic spikes are temporary. Retrying automatically in background...
                </span>
              </div>
            </div>
          )}

          <div className="progress-steps-list" aria-label="Analysis pipeline steps">
            {ANALYSIS_STEPS.map((step, idx) => {
              const isCompleted = idx < effectiveStepIndex;
              const isCurrent = idx === effectiveStepIndex;
              return (
                <div
                  key={step.id}
                  className={`progress-step-item ${isCompleted ? 'completed' : ''} ${
                    isCurrent ? 'active' : ''
                  }`}
                >
                  <div className="step-indicator" aria-hidden="true">
                    {isCompleted ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="step-check">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isCurrent ? (
                      <span className="step-dot-active" />
                    ) : (
                      <span className="step-dot-pending" />
                    )}
                  </div>
                  <span className="step-label">
                    {step.label}
                    {isCurrent && isRetryingHighDemand && step.id === 'extract'
                      ? ` (Retrying attempt ${currentAttempt}/${maxAttempts})...`
                      : '...'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
