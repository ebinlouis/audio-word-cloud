# Audio Word Cloud

A full-stack web app for mentors and educators to analyze mentorship-session audio. It transcribes the session, extracts important topics using AI, and displays them as an interactive word cloud.

## 1. What I Built

- Upload audio by file picker or drag-and-drop.
- Record audio directly from the browser.
- Supports MP3, WAV, M4A, AAC, OGG, WEBM, and FLAC.
- Validates the 25 MB and 10-minute limits on both client and server.
- Transcribes audio using Google Gemini.
- Extracts important semantic concepts and assigns relevance weights.
- Displays an interactive word cloud.
- Remove words and re-render the cloud without running AI again.
- Download the word cloud as PNG.
- View, copy, and download the transcript.
- Past analyses are stored in temporary Node.js server memory (RAM) for instant review without re-running AI.
- Handles loading, microphone permission, validation, and API errors.
- Responsive for desktop and mobile screens.

### Deliberate limitations

- Past analyses are stored only in temporary server memory (RAM) and reset whenever the server restarts or redeploys.
- Audio is processed in memory buffers and is not permanently stored or retained.
- No user accounts or database were implemented.

## 2. How to Run Locally

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Install

```bash
git clone <repository-url>
cd audio-word-cloud
npm run install-all
```

### Environment variables

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

Add:

```env
PORT=5005
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```

### Run

From the root project folder, build the frontend and run the server:

```bash
npm run build
node server/app.js
```

Open:

```text
http://localhost:5005
```

## 3. AI Service

**Google Gemini — `gemini-3.6-flash`**

Gemini was chosen because it can process the audio for transcription and then extract meaningful semantic concepts instead of relying only on raw word frequency.

The API key is stored in the server environment and is never exposed to the frontend.

## 4. Key Decisions

### React + Vite + Express

Used React and Vite for the frontend and Node.js/Express for the backend because they provide a simple full-stack structure suitable for the application.

### In-memory processing and temporary history

Audio is handled using in-memory buffers rather than permanent file storage. Past session analyses (transcripts, extracted keywords, and metadata) are stored temporarily in Node.js server memory (with a 20-item safeguard limit), allowing instant review during the active session without requiring database setup or disk persistence.

### AI-weighted concepts instead of frequency counting

The word cloud uses AI-generated relevance weights so important session topics can be emphasized instead of simply displaying the most frequently spoken words.

## 5. Libraries, Components and Templates

### Backend

- Express — REST API and server
- Multer — multipart audio uploads
- Music-metadata — audio metadata, duration, and file validation
- `@google/generative-ai` — Gemini API
- Dotenv — environment variables

### Frontend

- React
- React DOM
- Vite
- Axios — API requests
- Wordcloud — HTML5 Canvas word cloud rendering

No external UI template or design system was used. The interface was built with React and custom CSS.

## 6. AI Coding Tools

**Antigravity AI Assistant** was used for:

- Project scaffolding
- Initial React and Express implementation
- Component and CSS development
- Audio validation and testing
- Automated test creation
- Code review and refactoring

All generated code was reviewed and tested as part of the development process.

## 7. What I Would Do Next

With another week, I would add:

- Persistent history with a database and user accounts.
- Speaker diarization to distinguish mentor and mentee speech.
- Audio-synchronized transcript timestamps.
- Session-to-session progress and topic trends.
- PDF report export with transcript, word cloud, and session summary.

Brief ref: TFG-WD-4417
