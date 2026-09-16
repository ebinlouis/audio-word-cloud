import { useState, useEffect, useRef, useMemo } from 'react';
import WordCloudAPI from 'wordcloud';

/**
 * WordCloud component renders terms sized proportionally to AI prominence weights
 * and allows downloading the generated visualization as a PNG.
 *
 * @param {{ keywords: Array<{ term: string, weight: number }> }} props
 */
export default function WordCloud({ keywords }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef(null);

  // Filter out any invalid keyword entries
  const validKeywords = useMemo(() => {
    return Array.isArray(keywords)
      ? keywords.filter(
          (k) =>
            k &&
            typeof k.term === 'string' &&
            k.term.trim().length > 0 &&
            typeof k.weight === 'number' &&
            k.weight > 0
        )
      : [];
  }, [keywords]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validKeywords.length === 0) return;

    // Reset and clear canvas before drawing
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Convert keywords to [word, size] format for wordcloud2
    // Multiply weight (1-10) to get a clear visual font scale
    const list = validKeywords.map((k) => [k.term, Math.max(k.weight * 5, 12)]);

    // Modern calm palette for word rendering
    const colors = [
      '#2563eb',
      '#7c3aed',
      '#059669',
      '#d97706',
      '#dc2626',
      '#4f46e5',
      '#0891b2',
      '#475569'
    ];

    try {
      WordCloudAPI(canvas, {
        list: list,
        gridSize: 10,
        weightFactor: (size) => size,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: () => colors[Math.floor(Math.random() * colors.length)],
        rotateRatio: 0.2,
        rotationSteps: 2,
        backgroundColor: 'transparent',
        drawOutOfBound: false,
        shrinkToFit: true
      });
    } catch (err) {
      console.error('Error rendering word cloud canvas:', err);
    }

    return () => {
      // Clean up canvas on unmount
      if (WordCloudAPI.stop) {
        WordCloudAPI.stop();
      }
    };
  }, [validKeywords]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas || isDownloading) return;

    setIsDownloading(true);

    try {
      // Convert the rendered canvas into a PNG image data URL
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'mentorship-word-cloud.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to export word cloud as PNG:', err);
    }

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  if (validKeywords.length === 0) {
    return (
      <div className="wordcloud-card empty" role="status" aria-live="polite">
        <div className="wordcloud-card-header">
          <div>
            <h3 className="card-section-title">Word Cloud</h3>
            <p className="card-section-desc">Extracted term prominence</p>
          </div>
        </div>
        <div className="wordcloud-empty-body">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon" aria-hidden="true">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <p className="wordcloud-empty">No meaningful terms found to visualize.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wordcloud-card" aria-label="Word cloud visualization panel">
      <div className="wordcloud-card-header">
        <div className="wordcloud-title-wrap">
          <h3 className="card-section-title">Word Cloud</h3>
          <p className="card-section-desc">
            Visual prominence represents term frequency and importance
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPNG}
          disabled={isDownloading}
          className={`btn-download-png ${isDownloading ? 'btn-loading' : ''}`}
          aria-label="Download word cloud as PNG"
        >
          {isDownloading ? (
            <>
              <span className="inline-btn-spinner" aria-hidden="true" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PNG</span>
            </>
          )}
        </button>
      </div>

      <div className="wordcloud-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={600}
          height={350}
          className="wordcloud-canvas"
          role="img"
          aria-label="Visual word cloud representation of key extracted terms"
        />
      </div>

      {/* Accessible text representation for screen readers */}
      <div className="sr-only" aria-label="Extracted terms and prominence list">
        <ul>
          {validKeywords.map((item) => (
            <li key={item.term}>
              {item.term} (prominence weight: {item.weight})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
