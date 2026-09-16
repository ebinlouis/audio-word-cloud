import { useState, useEffect } from 'react';

const ANALYSIS_STEPS = [
  { id: 'transcribe', label: 'Transcribing conversation' },
  { id: 'extract', label: 'Identifying important topics' },
  { id: 'visualize', label: 'Generating word cloud' },
];

/**
 * AnalysisProgress component displays a focused modal popup overlay with an
 * indeterminate progress line, status cycling, and honest pipeline steps.
 * Prevents having to scroll down during analysis.
 */
export default function AnalysisProgress({ message = 'Analyzing your audio...' }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, []);

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
              <p className="progress-subtitle">
                {ANALYSIS_STEPS[activeStepIndex]?.label || message}...
              </p>
            </div>
          </div>

          <div className="progress-steps-list" aria-label="Analysis pipeline steps">
            {ANALYSIS_STEPS.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
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
                  <span className="step-label">{step.label}...</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
