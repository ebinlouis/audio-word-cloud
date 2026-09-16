import { useState } from 'react';

export default function ErrorMessage({ message, code, onRetry, onReset, disabled = false }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!message) {
    return null;
  }

  const rawMessage = typeof message === 'object' && message ? message.message : String(message || '');
  const errorCode = typeof message === 'object' && message?.code ? message.code : (code || '');

  const isHighDemand =
    errorCode === 'AI_HIGH_DEMAND' ||
    errorCode === 'AI_SERVICE_UNAVAILABLE' ||
    rawMessage.toLowerCase().includes('high demand') ||
    rawMessage.toLowerCase().includes('503') ||
    rawMessage.toLowerCase().includes('temporarily unavailable') ||
    rawMessage.toLowerCase().includes('resource_exhausted') ||
    rawMessage.toLowerCase().includes('overloaded');

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
    <div
      className={`error-card-wrapper ${isHighDemand ? 'high-demand' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-card-header">
        <div className="error-icon-box" aria-hidden="true">
          {isHighDemand ? (
            <svg
              className="error-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <line x1="12" y1="12" x2="12" y2="15" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          ) : (
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
          )}
        </div>
        <div className="error-title-group">
          <div className="error-heading-row">
            <h4 className="error-heading">
              {isHighDemand ? 'AI Model Experiencing High Demand' : 'Analysis Error'}
            </h4>
            {isHighDemand && (
              <span className="demand-badge">503 High Traffic</span>
            )}
          </div>
          <p className="error-text">
            {isHighDemand
              ? 'The Google Gemini AI service is currently handling high traffic spikes. Demand spikes are usually brief. Please click "Try Again" in a moment.'
              : rawMessage}
          </p>
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
                <span>{isHighDemand ? 'Try Again in a Moment' : 'Try Again'}</span>
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
