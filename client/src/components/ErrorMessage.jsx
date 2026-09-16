import { useState } from 'react';

export default function ErrorMessage({ message, onRetry, onReset, disabled = false }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!message) {
    return null;
  }

  const handleRetryClick = () => {
    if (disabled || isRetrying) return;
    setIsRetrying(true);
    if (onRetry) onRetry();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const handleResetClick = () => {
    if (disabled || isResetting) return;
    setIsResetting(true);
    setTimeout(() => {
      if (onReset) onReset();
      setIsResetting(false);
    }, 1500);
  };

  return (
    <div className="error-card-wrapper" role="alert" aria-live="assertive">
      <div className="error-card-header">
        <div className="error-icon-box" aria-hidden="true">
          <svg
            className="error-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="error-title-group">
          <h4 className="error-heading">Analysis Error</h4>
          <p className="error-text">{message}</p>
        </div>
      </div>

      <div className="error-actions-group">
        {onRetry && (
          <button
            type="button"
            className={`btn-error-retry ${isRetrying ? 'btn-loading' : ''}`}
            onClick={handleRetryClick}
            disabled={disabled || isRetrying}
            aria-label="Retry audio analysis"
          >
            {isRetrying ? (
              <>
                <span className="inline-btn-spinner" aria-hidden="true" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                <span>Try Again</span>
              </>
            )}
          </button>
        )}
        {onReset && (
          <button
            type="button"
            className={`btn-error-reset ${isResetting ? 'btn-loading' : ''}`}
            onClick={handleResetClick}
            disabled={disabled || isResetting}
            aria-label="Reset and choose another audio file"
          >
            {isResetting ? (
              <>
                <span className="inline-btn-spinner" aria-hidden="true" />
                <span>Clearing...</span>
              </>
            ) : (
              <span>Choose Another File</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
