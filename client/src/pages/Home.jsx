import { useState } from 'react';
import AudioUploader from '../components/AudioUploader';
import AudioRecorder from '../components/AudioRecorder';
import AudioPreview from '../components/AudioPreview';
import AnalysisProgress from '../components/AnalysisProgress';
import ErrorMessage from '../components/ErrorMessage';
import AnalysisResult from '../components/AnalysisResult';
import { analyzeAudio } from '../services/analysisApi';

export default function Home() {
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'record'
  const [file, setFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);

  const handleFileSelected = (selectedFile, duration = null) => {
    setFile(selectedFile);
    if (duration) {
      setAudioDuration(duration);
    } else if (selectedFile?.duration) {
      setAudioDuration(selectedFile.duration);
    }
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    setFile(null);
    setAudioDuration(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setSessionKey((prev) => prev + 1);
  };

  const handleAnalyze = async () => {
    if (!file || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeAudio(file);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
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
        {/* If no result is yet displayed, show the Audio Intake Studio */}
        {!hasActiveResult ? (
          <section className="audio-studio-section" aria-label="Audio intake and configuration">
            <div className="studio-card">
              <div className="studio-card-header">
                <h2 className="studio-heading">Input Audio</h2>
                <p className="studio-subheading">
                  Upload an existing recording or record live speech to generate your topic word cloud
                </p>
              </div>

              {/* 3. Segmented Control Mode Switcher */}
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

              {/* Tab Panel: Upload or Record */}
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

              {/* 4. Selected Audio File State */}
              {file && (
                <div className="studio-preview-section">
                  <AudioPreview
                    file={file}
                    duration={audioDuration}
                    onRemove={handleReset}
                  />
                </div>
              )}

              {/* 5. Analyze Action and Loading/Error States */}
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
                    className="btn-secondary-clear"
                    onClick={handleReset}
                    aria-label="Clear selected audio file"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* 11. Loading State */}
              {isAnalyzing && (
                <div className="studio-progress-wrapper">
                  <AnalysisProgress message="Transcribing and analyzing audio..." />
                </div>
              )}

              {/* 12. Error Presentation */}
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
          /* 6. Post-Analysis Results Dashboard Workspace */
          <AnalysisResult
            result={result}
            onReset={handleReset}
            audioDuration={audioDuration}
            file={file}
          />
        )}
      </main>
    </div>
  );
}
