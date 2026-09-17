import { useState, useEffect } from 'react';
import { getAnalyses, getAnalysisById, deleteAnalysis } from '../services/analysisApi';

function formatDuration(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return 'Available';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) {
    return `${secs} sec`;
  }
  return `${mins} min ${secs} sec`;
}

function formatDate(dateString) {
  if (!dateString) return 'Recent';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return 'Recent';
  }
}

export default function PastAnalyses({ onSelectAnalysis, onBackToStudio }) {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyses();
      setAnalyses(data);
    } catch (err) {
      setError(err.message || 'Unable to load past analyses history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAnalyses()
      .then((data) => {
        if (isMounted) {
          setAnalyses(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load past analyses history.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleView = async (item) => {
    if (loadingId) return;
    setLoadingId(item.id);
    try {
      const fullRecord = await getAnalysisById(item.id);
      if (onSelectAnalysis) {
        onSelectAnalysis(fullRecord);
      }
    } catch (err) {
      setError(err.message || 'Unable to open the selected analysis.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setIsDeletingId(id);
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete analysis.');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <section className="past-analyses-container" aria-labelledby="past-analyses-heading">
      <div className="past-analyses-header">
        <div className="past-analyses-title-group">
          <div className="past-header-top-row">
            <h2 id="past-analyses-heading" className="studio-heading">
              Past Analyses
            </h2>
            <span className="past-badge">In-Memory History</span>
          </div>
          <p className="studio-subheading">
            Review past session transcripts and word clouds stored during this server session
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary-clear"
          onClick={onBackToStudio}
          aria-label="Back to Audio Input Studio"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>New Analysis</span>
        </button>
      </div>

      {isLoading && (
        <div className="history-loading-card" role="status" aria-live="polite">
          <span className="spinner-ring" aria-hidden="true" />
          <span>Loading past analyses...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="history-error-card" role="alert">
          <div className="error-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="error-icon-svg">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="error-text-wrap">
            <p className="error-text">{error}</p>
            <button
              type="button"
              className="btn-retry-inline"
              onClick={fetchHistory}
              aria-label="Retry loading past analyses"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && analyses.length === 0 && (
        <div className="history-empty-card" role="status" aria-live="polite">
          <div className="history-empty-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="history-empty-title">No past analyses yet</h3>
          <p className="history-empty-desc">
            Analyses you complete in this session will appear here for instant replay and export.
          </p>
          <button
            type="button"
            className="btn-primary-analyze history-empty-btn"
            onClick={onBackToStudio}
            aria-label="Start your first audio analysis"
          >
            <span>Analyze Audio</span>
          </button>
        </div>
      )}

      {!isLoading && !error && analyses.length > 0 && (
        <div className="history-list-grid" role="list" aria-label="Past analyses list">
          {analyses.map((item) => {
            const isItemLoading = loadingId === item.id;
            const isItemDeleting = isDeletingId === item.id;
            const isConfirming = confirmDeleteId === item.id;

            return (
              <div
                key={item.id}
                className={`history-card-item ${isItemLoading ? 'loading' : ''}`}
                role="listitem"
              >
                <div className="history-card-main-info">
                  <div className="history-card-icon-box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="file-svg-icon">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <div className="history-card-details">
                    <h3 className="history-card-name" title={item.fileName}>
                      {item.fileName || 'Audio Recording'}
                    </h3>
                    <div className="history-meta-row">
                      {item.duration && (
                        <span className="history-meta-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-pill-icon" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatDuration(item.duration)}
                        </span>
                      )}
                      <span className="history-meta-dot" aria-hidden="true">•</span>
                      <span className="history-meta-date">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="history-card-actions">
                  {isConfirming ? (
                    <div className="history-confirm-delete-box" role="alert">
                      <span className="confirm-prompt-text">Delete?</span>
                      <button
                        type="button"
                        className="btn-confirm-yes"
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={isItemDeleting}
                        aria-label={`Confirm delete ${item.fileName}`}
                      >
                        {isItemDeleting ? '...' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="btn-confirm-cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        aria-label="Cancel delete"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-history-view"
                        onClick={() => handleView(item)}
                        disabled={isItemLoading || isItemDeleting}
                        aria-label={`View analysis for ${item.fileName}`}
                      >
                        {isItemLoading ? (
                          <>
                            <span className="inline-btn-spinner" aria-hidden="true" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <span>View Analysis</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-history-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        disabled={isItemLoading || isItemDeleting}
                        aria-label={`Delete ${item.fileName} from history`}
                        title="Delete this analysis"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="delete-icon" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
