import { useState } from 'react';
import WordCloud from './WordCloud';

/**
 * Format duration into mm:ss or human-readable format.
 */
function formatDuration(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return 'Available';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * AnalysisResult component displays the post-analysis workspace:
 * Summary Metrics Bar, Word Cloud (Left/Main), Key Topics Panel (Right/Secondary),
 * Full Transcript Card, and New Analysis CTA with 2-second tactile inline loaders.
 *
 * @param {{
 *   result: { transcript?: string, keywords?: Array<{ term: string, weight: number }> } | null,
 *   onReset?: () => void,
 *   audioDuration?: number | null,
 *   file?: File | null
 * }} props
 */
export default function AnalysisResult({ result, onReset, audioDuration = null, file = null }) {
  const [displayedKeywords, setDisplayedKeywords] = useState(() => {
    return Array.isArray(result?.keywords) ? result.keywords : [];
  });
  const [prevResult, setPrevResult] = useState(result);
  const [copyStatus, setCopyStatus] = useState(''); // '' | 'copying' | 'copied' | 'error'
  const [isDownloadingTxt, setIsDownloadingTxt] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Update displayed keywords if result object reference changes
  if (result !== prevResult) {
    setPrevResult(result);
    setDisplayedKeywords(Array.isArray(result?.keywords) ? result.keywords : []);
  }

  if (!result) {
    return null;
  }

  const transcript = typeof result.transcript === 'string' ? result.transcript.trim() : '';
  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  const derivedDuration = audioDuration || file?.duration || null;

  const handleRemoveKeyword = (termToRemove) => {
    setDisplayedKeywords((prev) => prev.filter((k) => k.term !== termToRemove));
  };

  const handleCopyTranscript = async () => {
    if (!transcript || copyStatus === 'copying') return;
    setCopyStatus('copying');

    try {
      await navigator.clipboard.writeText(transcript);
      setTimeout(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus(''), 2500);
      }, 1500);
    } catch {
      setTimeout(() => {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus(''), 3500);
      }, 1000);
    }
  };

  const handleDownloadTranscript = () => {
    if (!transcript || isDownloadingTxt) return;
    setIsDownloadingTxt(true);

    try {
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'mentorship-transcript.txt';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download transcript:', err);
    }

    setTimeout(() => {
      setIsDownloadingTxt(false);
    }, 2000);
  };

  const handleResetClick = () => {
    if (!onReset || isResetting) return;
    setIsResetting(true);
    setTimeout(() => {
      onReset();
      setIsResetting(false);
    }, 1500);
  };

  return (
    <section className="analysis-workspace" aria-labelledby="workspace-heading">
      <div className="workspace-header">
        <div className="workspace-header-title-group">
          <h2 id="workspace-heading" className="workspace-title">
            Analysis Workspace
          </h2>
        </div>

        <div className="workspace-header-actions">
          <span className="workspace-tag">Complete</span>
          {onReset && (
            <button
              type="button"
              className={`btn-workspace-new ${isResetting ? 'btn-loading' : ''}`}
              onClick={handleResetClick}
              disabled={isResetting}
              aria-label="Start a new audio analysis"
            >
              {isResetting ? (
                <>
                  <span className="inline-btn-spinner" aria-hidden="true" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span>Start New Analysis</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 10. Compact Analysis Summary Stats */}
      <div className="analysis-summary-grid" aria-label="Analysis summary overview">
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stat-svg">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-text-group">
            <span className="stat-label">Audio Duration</span>
            <span className="stat-value">
              {derivedDuration ? formatDuration(derivedDuration) : 'Processed'}
            </span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stat-svg">
              <path d="M4 7V4h16v3" />
              <path d="M9 20h6" />
              <path d="M12 4v16" />
            </svg>
          </div>
          <div className="stat-text-group">
            <span className="stat-label">Key Topics Identified</span>
            <span className="stat-value">{displayedKeywords.length} terms</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stat-svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="stat-text-group">
            <span className="stat-label">Transcript Status</span>
            <span className="stat-value">
              {transcript ? `${wordCount} words` : 'Not Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Results Dashboard (Word Cloud Left / Key Topics Right) */}
      <div className="dashboard-columns-grid">
        {/* LEFT / MAIN: Word Cloud */}
        <div className="dashboard-main-col">
          <WordCloud keywords={displayedKeywords} />
        </div>

        {/* RIGHT / SECONDARY: Key Topics Panel */}
        <div className="dashboard-secondary-col">
          <div className="key-topics-card" aria-label="Key Topics extracted from audio">
            <div className="key-topics-header">
              <div>
                <h3 className="card-section-title">Key Topics</h3>
                <p className="card-section-desc">
                  Ranked by relative importance
                </p>
              </div>
              <span className="topics-count-badge">
                {displayedKeywords.length}
              </span>
            </div>

            {displayedKeywords.length > 0 ? (
              <div className="key-topics-scrollbox" role="list" aria-label="List of extracted key terms">
                {displayedKeywords.map((k) => (
                  <div key={k.term} className="key-topic-row" role="listitem">
                    <span className="topic-term-text">{k.term}</span>
                    <div className="topic-controls">
                      <span className="topic-weight-pill" title={`Prominence weight: ${k.weight}`}>
                        {k.weight}
                      </span>
                      <button
                        type="button"
                        className="btn-remove-topic"
                        onClick={() => handleRemoveKeyword(k.term)}
                        aria-label={`Remove ${k.term} from word cloud`}
                        title={`Remove ${k.term}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="remove-x-icon" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="topics-empty-state">
                <p>No remaining topics. Click New Analysis to reset.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. Full Width Transcript Card */}
      <section className="transcript-card" aria-labelledby="transcript-heading">
        <div className="transcript-card-header">
          <div>
            <h3 id="transcript-heading" className="card-section-title">
              Full Transcript
            </h3>
            <p className="card-section-desc">
              Complete conversation text processed with speech-to-text
            </p>
          </div>

          {transcript && (
            <div className="transcript-actions-bar">
              <button
                type="button"
                className={`btn-transcript-cta ${copyStatus === 'copying' ? 'btn-loading' : ''}`}
                onClick={handleCopyTranscript}
                disabled={copyStatus === 'copying'}
                aria-label="Copy transcript text to clipboard"
              >
                {copyStatus === 'copying' ? (
                  <>
                    <span className="inline-btn-spinner" aria-hidden="true" />
                    <span>Copying...</span>
                  </>
                ) : copyStatus === 'copied' ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon check-green" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy Transcript</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={`btn-transcript-cta ${isDownloadingTxt ? 'btn-loading' : ''}`}
                onClick={handleDownloadTranscript}
                disabled={isDownloadingTxt}
                aria-label="Download transcript as text file"
              >
                {isDownloadingTxt ? (
                  <>
                    <span className="inline-btn-spinner" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download TXT</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {copyStatus === 'copied' && (
          <div className="transcript-alert success" role="status" aria-live="polite">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Transcript copied to clipboard.</span>
          </div>
        )}
        {copyStatus === 'error' && (
          <div className="transcript-alert error" role="alert" aria-live="assertive">
            <span>Unable to copy transcript automatically. Please select and copy manually.</span>
          </div>
        )}

        <div className="transcript-body-scrollbox">
          {transcript ? (
            <p className="transcript-text">{transcript}</p>
          ) : (
            <p className="transcript-empty">No transcript was generated for this recording.</p>
          )}
        </div>
      </section>
    </section>
  );
}
