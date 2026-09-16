import { useState, useRef, useEffect } from 'react';
import { validateAudioFile } from '../utils/audioValidation';
import { validateAudioDuration } from '../utils/audioDurationValidation';

export default function AudioUploader({ onFileSelected, file = null }) {
    const [error, setError] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!file && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [file]);

    const processFile = async (selected) => {
        if (!selected) return;

        setError(null);
        setIsValidating(true);

        const fileValidation = validateAudioFile(selected);
        if (!fileValidation.valid) {
            setError(fileValidation.error);
            setIsValidating(false);
            if (onFileSelected) onFileSelected(null);
            return;
        }

        const durationValidation = await validateAudioDuration(selected);
        setIsValidating(false);

        if (!durationValidation.valid) {
            setError(durationValidation.error);
            if (onFileSelected) onFileSelected(null);
            return;
        }

        setError(null);
        if (durationValidation.duration) {
            selected.duration = durationValidation.duration;
        }
        if (onFileSelected) {
            onFileSelected(selected, durationValidation.duration);
        }
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];
        if (selected) {
            processFile(selected);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isValidating) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (isValidating) return;

        const dropped = event.dataTransfer.files?.[0];
        if (dropped) {
            processFile(dropped);
        }
    };

    const triggerFileInput = () => {
        if (!isValidating && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            triggerFileInput();
        }
    };

    return (
        <div className="audio-uploader">
            <input
                id="audio-file-input"
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,audio/*"
                onChange={handleFileChange}
                disabled={isValidating}
                className="uploader-file-input-hidden"
                aria-label="Upload audio file"
                aria-describedby={
                    isValidating
                        ? 'uploader-validating-status'
                        : error
                        ? 'uploader-error-msg'
                        : undefined
                }
            />

            <div
                className={`dropzone-card ${isDragging ? 'dragging' : ''} ${
                    isValidating ? 'validating' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-label="Upload audio drop zone. Drop your file here or click to browse files"
            >
                <div className="dropzone-icon-wrapper" aria-hidden="true">
                    <svg
                        className="dropzone-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>

                <div className="dropzone-content">
                    <p className="dropzone-primary-text">
                        <span className="dropzone-bold">Drop your audio file here</span>
                        <span className="dropzone-divider"> or </span>
                        <span className="dropzone-browse-link">browse files</span>
                    </p>
                    <p className="dropzone-hint">
                        Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC
                    </p>
                </div>

                <div className="dropzone-badges" aria-label="Upload file limits">
                    <span className="dropzone-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="badge-icon">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M7 12h10" />
                        </svg>
                        25 MB limit
                    </span>
                    <span className="dropzone-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="badge-icon">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        10 minute limit
                    </span>
                </div>
            </div>

            {isValidating && (
                <div
                    id="uploader-validating-status"
                    className="status-validating-card"
                    role="status"
                    aria-live="polite"
                >
                    <span className="inline-spinner" aria-hidden="true" />
                    <span>Verifying audio duration and format...</span>
                </div>
            )}

            {error && (
                <div
                    id="uploader-error-msg"
                    className="uploader-error"
                    role="alert"
                    aria-live="assertive"
                >
                    <svg
                        className="error-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}
