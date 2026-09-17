import { useState } from 'react';

export default function ErrorMessage({
  message,
  code,
  onRetry,
  onReset,
  onClose,
  isModal = true,
  disabled = false
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!message) {
    return null;
  }

  const rawMessage = typeof message === 'object' && message ? message.message : String(message || '');
  const errorCode = typeof message === 'object' && message?.code ? message.code : (code || '');

  const isQuotaExceeded =
    errorCode === 'AI_QUOTA_EXCEEDED' ||
    rawMessage.toLowerCase().includes('quota') ||
    rawMessage.toLowerCase().includes('rate limit') ||
    rawMessage.toLowerCase().includes('429');

  const isInvalidKey =
    errorCode === 'AI_INVALID_KEY' ||
    errorCode === 'AI_CONFIGURATION_ERROR' ||
    rawMessage.toLowerCase().includes('invalid') ||
    rawMessage.toLowerCase().includes('403') ||
    rawMessage.toLowerCase().includes('missing api key');

  const isHighDemand =
    !isQuotaExceeded &&
    !isInvalidKey &&
    (errorCode === 'AI_HIGH_DEMAND' ||
      errorCode === 'AI_SERVICE_UNAVAILABLE' ||
      rawMessage.toLowerCase().includes('high demand') ||
      rawMessage.toLowerCase().includes('503') ||
      rawMessage.toLowerCase().includes('temporarily unavailable') ||
      rawMessage.toLowerCase().includes('resource_exhausted') ||
      rawMessage.toLowerCase().includes('overloaded'));

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

  const getHeading = () => {
    if (isQuotaExceeded) return 'API Rate Limit Reached';
    if (isInvalidKey) return 'AI Configuration Error';
    if (isHighDemand) return 'Service Temporarily Busy';
    return "Analysis couldn't be completed";
  };

  const getBadgeText = () => {
    if (isQuotaExceeded) return 'Rate Limited';
    if (isInvalidKey) return 'Check Server Key';
    if (isHighDemand) return 'High Traffic';
    return null;
  };

  const getMessage = () => {
    if (isQuotaExceeded) {
      return 'Google Gemini API request limit reached. Please wait ~20–30 seconds and click "Try Again".';
    }
    if (isInvalidKey) {
      return rawMessage || 'The Gemini API key is missing or invalid. Please check your server/.env file.';
    }
    if (isHighDemand) {
      return 'The AI service is currently experiencing high traffic. Please wait a few moments and click "Try Again".';
    }
    return rawMessage || "We couldn't process this recording right now. Please try again or choose another file.";
  };

  const content = (
    <div
      className={`error-card-wrapper ${isModal ? 'modal-popup' : ''} ${
        isHighDemand || isQuotaExceeded ? 'high-demand' : ''
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-card-header">
        <div className="error-icon-box" aria-hidden="true">
          {isHighDemand || isQuotaExceeded ? (
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
            <h4 id="error-modal-title" className="error-heading">
              {getHeading()}
            </h4>
            {getBadgeText() && (
              <span className="demand-badge">{getBadgeText()}</span>
            )}
          </div>
          <p className="error-text">{getMessage()}</p>
        </div>

        {onClose && (
          <button
            type="button"
            className="error-modal-close-btn"
            onClick={onClose}
            aria-label="Dismiss error"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
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
        {onClose && !onReset && (
          <button
            type="button"
            className="btn-error-reset"
            onClick={onClose}
            aria-label="Dismiss error message"
          >
            <span>Dismiss</span>
          </button>
        )}
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div
      className="error-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {content}
    </div>
  );
}
