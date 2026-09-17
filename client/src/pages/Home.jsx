import { useState } from 'react';
import AudioUploader from '../components/AudioUploader';
import AudioRecorder from '../components/AudioRecorder';
import AudioPreview from '../components/AudioPreview';
import AnalysisProgress from '../components/AnalysisProgress';
import ErrorMessage from '../components/ErrorMessage';
import AnalysisResult from '../components/AnalysisResult';
import { analyzeAudio } from '../services/analysisApi';

export default function Home() {
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

    const MAX_RETRIES = 5;
    const analysisStartTime = performance.now();
    setIsAnalyzing(true);
    setIsUploading(true);
    setUploadProgress(0);
    setIsCompleted(false);
    setAnalysisTime(null);
    setError(null);
    setResult(null);
    setRetryStatus({ isRetrying: false, attempt: 1, maxAttempts: MAX_RETRIES });

    let currentAttempt = 1;
    let analysisSuccess = false;
    let lastError = null;
    let finalResponse = null;

    while (currentAttempt <= MAX_RETRIES && !analysisSuccess) {
      try {
        const response = await analyzeAudio(file, (percent) => {
          setUploadProgress(percent);
          if (percent >= 100) {
            setIsUploading(false);
          }
        });
        finalResponse = response;
        analysisSuccess = true;
        setRetryStatus({ isRetrying: false, attempt: 1, maxAttempts: MAX_RETRIES });
        break;
      } catch (err) {
        lastError = err;
        setIsUploading(false);
        const isHighDemand =
          err.code === 'AI_HIGH_DEMAND' ||
          err.status === 503 ||
          err.status === 429 ||
          (err.message && err.message.toLowerCase().includes('high demand')) ||
          (err.message && err.message.toLowerCase().includes('503'));

        if (isHighDemand && currentAttempt < MAX_RETRIES) {
          currentAttempt += 1;
          setRetryStatus({
            isRetrying: true,
            attempt: currentAttempt,
            maxAttempts: MAX_RETRIES
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          break;
        }
      }
    }

    if (analysisSuccess && finalResponse) {
      const elapsedSeconds = Math.max(0.1, (performance.now() - analysisStartTime) / 1000);
      setAnalysisTime(elapsedSeconds);
      setIsCompleted(true);
      await new Promise((resolve) => setTimeout(resolve, 650));
      setResult(finalResponse);
      setIsAnalyzing(false);
      setIsCompleted(false);
      setRetryStatus({ isRetrying: false, attempt: 1, maxAttempts: MAX_RETRIES });
    } else if (lastError) {
      const isHighDemand =
        lastError.code === 'AI_HIGH_DEMAND' ||
        lastError.status === 503 ||
        (lastError.message && lastError.message.toLowerCase().includes('high demand'));

      setError({
        message: isHighDemand
          ? 'The AI model is experiencing high demand after 5 retry attempts. Please wait a moment and try again.'
          : lastError.message || 'Analysis failed. Please try again.',
        code: isHighDemand ? 'AI_HIGH_DEMAND' : (lastError.code || 'ANALYSIS_FAILED'),
        status: lastError.status || 500
      });
      setResult(null);
      setIsAnalyzing(false);
      setIsCompleted(false);
      setRetryStatus({ isRetrying: false, attempt: 1, maxAttempts: MAX_RETRIES });
    }
  };

  const handleModeChange = (mode) => {
    if (isAnalyzing) return;
    setInputMode(mode);
    handleReset();
  };

  const hasActiveResult = Boolean(result) && !isAnalyzing;

  return (
    <div className="app-layout-wrapper">
      <main className="main-content-container">
        {!hasActiveResult ? (
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
                <div className="studio-error-wrapper">
                  <ErrorMessage
                    message={error}
                    onRetry={handleAnalyze}
                    onReset={handleReset}
                    disabled={isAnalyzing}
                  />
                </div>
              )}
            </div>
          </section>
        ) : (
          <AnalysisResult
            result={result}
            onReset={handleReset}
            audioDuration={audioDuration}
            file={file}
            analysisTime={analysisTime}
          />
        )}
      </main>
    </div>
  );
}
