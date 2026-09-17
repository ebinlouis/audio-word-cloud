import { useState } from 'react';
import AudioUploader from '../components/AudioUploader';
import AudioRecorder from '../components/AudioRecorder';
import AudioPreview from '../components/AudioPreview';
import AnalysisProgress from '../components/AnalysisProgress';
import ErrorMessage from '../components/ErrorMessage';
import AnalysisResult from '../components/AnalysisResult';
import PastAnalyses from '../components/PastAnalyses';
import { analyzeAudio } from '../services/analysisApi';

export default function Home() {
  const [activeTab, setActiveTab] = useState('studio');
  const [inputMode, setInputMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [retryStatus, setRetryStatus] = useState({ isRetrying: false, attempt: 1, maxAttempts: 5 });

  const handleFileSelected = (selectedFile, duration = null) => {
    setFile(selectedFile);
    if (duration) {
      setAudioDuration(duration);
    } else if (selectedFile?.duration) {
      setAudioDuration(selectedFile.duration);
    }
    setResult(null);
    setError(null);
    setAnalysisTime(null);
  };

  const handleReset = () => {
    setFile(null);
    setAudioDuration(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setIsUploading(false);
    setUploadProgress(0);
    setIsCompleted(false);
    setAnalysisTime(null);
    setIsClearing(false);
    setRetryStatus({ isRetrying: false, attempt: 1, maxAttempts: 5 });
    setSessionKey((prev) => prev + 1);
  };

  const handleClearClick = () => {
    if (isClearing) return;
    setIsClearing(true);
    setTimeout(() => {
      handleReset();
    }, 1200);
  };

  const handleAnalyze = async () => {
    if (!file || isAnalyzing) return;

    const analysisStartTime = performance.now();
    setIsAnalyzing(true);
    setIsUploading(true);
    setUploadProgress(0);
    setIsCompleted(false);
    setAnalysisTime(null);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeAudio(file, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) {
          setIsUploading(false);
        }
      });

      const elapsedSeconds = Math.max(0.1, (performance.now() - analysisStartTime) / 1000);
      setAnalysisTime(elapsedSeconds);
      setIsCompleted(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(response);
      setIsAnalyzing(false);
      setIsCompleted(false);
    } catch (err) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setIsCompleted(false);
      setResult(null);

      setError({
        message: err.message || 'Analysis failed. Please try again.',
        code: err.code || 'ANALYSIS_FAILED',
        status: err.status || 500
      });
    }
  };

  const handleModeChange = (mode) => {
    if (isAnalyzing) return;
    setInputMode(mode);
    handleReset();
  };

  const handleSelectPastAnalysis = (record) => {
    if (!record) return;
    setResult({
      transcript: record.transcript,
      keywords: record.keywords,
      id: record.id
    });
    setAudioDuration(record.duration || null);
    setFile({
      name: record.fileName || 'Past Audio Recording',
      size: record.fileSize || null,
      duration: record.duration || null
    });
    setAnalysisTime(null);
    setError(null);
  };

  const hasActiveResult = Boolean(result) && !isAnalyzing;

  return (
    <div className="app-layout-wrapper">
      <header className="app-main-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="navbar-brand-icon">☁️</span>
            <span className="navbar-brand-text">Audio Word Cloud</span>
          </div>

          {!hasActiveResult && !isAnalyzing && (
            <nav className="navbar-nav-links" aria-label="Main Navigation">
              <button
                type="button"
                className={`navbar-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
                onClick={() => setActiveTab('studio')}
                aria-current={activeTab === 'studio' ? 'page' : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>Analysis Studio</span>
              </button>

              <button
                type="button"
                className={`navbar-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
                aria-current={activeTab === 'history' ? 'page' : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Past Analyses</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="main-content-container">
        {hasActiveResult ? (
          <AnalysisResult
            result={result}
            onReset={handleReset}
            audioDuration={audioDuration}
            file={file}
            analysisTime={analysisTime}
          />
        ) : activeTab === 'history' ? (
          <PastAnalyses
            onSelectAnalysis={handleSelectPastAnalysis}
            onBackToStudio={() => setActiveTab('studio')}
          />
        ) : (
          <section className="audio-studio-section" aria-label="Audio intake and configuration">
            <div className="studio-card">
              <div className="studio-card-header">
                <h2 className="studio-heading">Input Audio</h2>
                <p className="studio-subheading">
                  Upload an existing recording or record live speech to generate your topic word cloud
                </p>
              </div>

              <div className="segmented-control" role="tablist" aria-label="Audio input mode">
                <button
                  type="button"
                  role="tab"
                  className={`segmented-tab ${inputMode === 'upload' ? 'active' : ''}`}
                  onClick={() => handleModeChange('upload')}
                  disabled={isAnalyzing}
                  aria-selected={inputMode === 'upload'}
                  aria-controls="panel-upload"
                  id="tab-upload"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-svg" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="tab-text-full">Upload Audio File</span>
                  <span className="tab-text-short">Upload File</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  className={`segmented-tab ${inputMode === 'record' ? 'active' : ''}`}
                  onClick={() => handleModeChange('record')}
                  disabled={isAnalyzing}
                  aria-selected={inputMode === 'record'}
                  aria-controls="panel-record"
                  id="tab-record"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-svg" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                  <span className="tab-text-full">Record with Microphone</span>
                  <span className="tab-text-short">Record Mic</span>
                </button>
              </div>

              <div
                id={inputMode === 'upload' ? 'panel-upload' : 'panel-record'}
                role="tabpanel"
                aria-labelledby={inputMode === 'upload' ? 'tab-upload' : 'tab-record'}
                className="tab-panel-container"
              >
                {inputMode === 'upload' ? (
                  <AudioUploader
                    key={`uploader-${sessionKey}`}
                    file={file}
                    onFileSelected={handleFileSelected}
                  />
                ) : (
                  <AudioRecorder
                    key={`recorder-${sessionKey}`}
                    onAudioRecorded={handleFileSelected}
                    disabled={isAnalyzing}
                  />
                )}
              </div>

              {file && (
                <div className="studio-preview-section">
                  <AudioPreview
                    key={file ? `${file.name || 'rec'}-${file.size || 0}-${sessionKey}` : 'empty'}
                    file={file}
                    duration={audioDuration}
                    onRemove={handleReset}
                  />
                </div>
              )}

              <div className="studio-actions-row">
                <button
                  type="button"
                  className={`btn-primary-analyze ${isAnalyzing ? 'loading' : ''}`}
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  aria-busy={isAnalyzing}
                  aria-label="Analyze Audio"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      <span>Analyzing Audio...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Analyze Audio</span>
                    </>
                  )}
                </button>

                {file && !isAnalyzing && (
                  <button
                    type="button"
                    className={`btn-secondary-clear ${isClearing ? 'btn-loading' : ''}`}
                    onClick={handleClearClick}
                    disabled={isClearing}
                    aria-label="Clear selected audio file"
                  >
                    {isClearing ? (
                      <>
                        <span className="inline-btn-spinner" aria-hidden="true" />
                        <span>Clearing...</span>
                      </>
                    ) : (
                      <span>Clear</span>
                    )}
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="studio-progress-wrapper">
                  <AnalysisProgress
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                    isCompleted={isCompleted}
                    retryStatus={retryStatus}
                  />
                </div>
              )}

              {error && (
                <ErrorMessage
                  message={error}
                  onRetry={handleAnalyze}
                  onReset={handleReset}
                  onClose={() => setError(null)}
                  disabled={isAnalyzing}
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
