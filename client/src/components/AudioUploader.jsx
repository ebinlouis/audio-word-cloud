import { useState, useRef } from 'react';
import { validateAudioFile } from '../utils/audioValidation';
import { validateAudioDuration } from '../utils/audioDurationValidation';

export default function AudioUploader({ onFileSelected }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const fileInputRef = useRef(null);

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError(null);
        setIsValidating(true);

        const fileValidation = validateAudioFile(file);
        if (!fileValidation.valid) {
            setError(fileValidation.error);
            setSelectedFile(null);
            setIsValidating(false);
            if (onFileSelected) onFileSelected(null);
            return;
        }

        const durationValidation = await validateAudioDuration(file);
        setIsValidating(false);

        if (!durationValidation.valid) {
            setError(durationValidation.error);
            setSelectedFile(null);
            if (onFileSelected) onFileSelected(null);
            return;
        }

        setSelectedFile(file);
        setError(null);
        if (onFileSelected) {
            onFileSelected(file);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setError(null);
        setIsValidating(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onFileSelected) {
            onFileSelected(null);
        }
    };

    return (
        <div className="audio-uploader">
            <label htmlFor="audio-file-input" className="uploader-label">
                Select Audio File:
            </label>
            <input
                id="audio-file-input"
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,audio/*"
                onChange={handleFileChange}
                disabled={isValidating}
            />

            {isValidating && <p className="status-validating">Checking audio file duration...</p>}

            {error && (
                <div className="uploader-error" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {selectedFile && !error && !isValidating && (
                <div className="uploader-selected">
                    <p>
                        <strong>Selected:</strong> {selectedFile.name} (
                        {formatFileSize(selectedFile.size)})
                    </p>
                    <button type="button" onClick={handleClear} className="btn-clear">
                        Clear File
                    </button>
                </div>
            )}
        </div>
    );
}
