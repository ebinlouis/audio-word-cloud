# Audio Word Cloud

A modern web application designed for mentors, educators, and team leads to analyze mentorship-session audio recordings and generate an interactive, AI-powered word cloud of key concepts, feedback points, and discussion themes.

---

## Features

- **Audio File Upload**: Intuitive drag-and-drop or file browser selection.
- **Browser Audio Recording**: Record live speech directly in the browser via microphone using the native `MediaRecorder` API.
- **Broad Format Support**: Supports MP3, WAV, M4A, AAC, OGG, WEBM, and FLAC formats.
- **Client & Server Audio Validation**: Strict validation enforcing maximum file size (`25 MB`) and maximum duration (`10 minutes`), alongside deep MIME/binary header verification to prevent corrupted or spoofed files.
- **AI-Powered Speech Transcription**: Automated high-accuracy transcription powered by Google Gemini (`gemini-2.5-flash`).
- **Semantic Keyword & Concept Extraction**: Extracts meaningful concepts and weighted importance scores ($1\text{--}10$) using structured AI analysis rather than simple frequency counts.
- **Interactive Canvas Word Cloud**: Renders keywords visually using HTML5 Canvas (`wordcloud2`), scaling font sizes proportionally to their AI relevance weights.
- **Dynamic Word Removal & Instant Rerender**: Remove individual words directly from the keyword tag list and rerender the cloud immediately in-memory without re-analyzing or altering the transcript.
- **Word Cloud PNG Export**: Download the rendered canvas word cloud directly as a high-resolution PNG image (`mentorship-word-cloud.png`).
- **Transcript Display & Export**:
  - Full display of the generated transcript alongside the word cloud.
  - One-click copy transcript to clipboard with visual confirmation feedback.
  - One-click download of the complete transcript as a formatted text file (`mentorship-transcript.txt`).
- **Responsive & Accessible UI**:
  - Fully responsive across mobile (320px, 375px), tablet (768px), and desktop viewports with zero horizontal scrolling.
  - Accessible design adhering to WCAG guidelines with semantic HTML, ARIA alerts and status live regions, high-contrast focus rings, and full keyboard navigation.
- **Robust Error Handling & Recovery**: Sanitized, user-friendly error alerts for unsupported formats, duration violations, microphone permission denials, or provider downtime, complete with Retry and Reset workflows.

---

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Modern Vanilla CSS (Custom Design System with CSS variables, Glassmorphism, and Flexbox/Grid layouts)
- **Word Cloud Library**: `wordcloud` (HTML5 Canvas rendering engine)
- **Language**: JavaScript (ES Modules)

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **File Uploads**: Multer (`memoryStorage` for zero-disk footprint)
- **Audio Metadata & Validation**: `music-metadata`
- **AI Provider**: Google Generative AI SDK (`@google/generative-ai` with `gemini-2.5-flash`)
- **Environment Management**: `dotenv`

---

## Project Structure

```text
audio-word-cloud/
├── client/                      # Frontend Vite + React application
│   ├── index.html               # Entry HTML with required brief metadata
│   ├── package.json             # Frontend dependencies and scripts
│   ├── vite.config.js           # Vite config with API proxy
│   └── src/
│       ├── App.jsx              # Application root
│       ├── index.css            # Global CSS design tokens and responsive layout
│       ├── components/
│       │   ├── AnalysisProgress.jsx # Accessible loading spinner & status
│       │   ├── AnalysisResult.jsx   # Result orchestrator (transcript & cloud)
│       │   ├── AudioPreview.jsx     # Audio player & metadata card
│       │   ├── AudioRecorder.jsx    # Browser microphone recording module
│       │   ├── AudioUploader.jsx    # File drag-and-drop & picker
│       │   ├── ErrorMessage.jsx     # Accessible alert banner with retry/reset
│       │   └── WordCloud.jsx        # Canvas word cloud & PNG exporter
│       ├── pages/
│       │   └── Home.jsx         # Main workflow controller & state coordinator
│       ├── services/
│       │   └── api.js           # Centralized API service
│       └── utils/
│           ├── audioValidation.js         # Client-side format & size checks
│           └── audioDurationValidation.js # Client-side duration parser
├── server/                      # Backend Express application
│   ├── app.js                   # Express application setup & middleware
│   ├── package.json             # Backend dependencies and scripts
│   ├── .env.example             # Template for required environment variables
│   ├── controllers/
│   │   └── analysisController.js # Audio upload & AI analysis controller
│   ├── routes/
│   │   └── analysisRoutes.js    # API route definitions
│   ├── services/
│   │   ├── transcriptionService.js    # Gemini audio transcription service
│   │   └── keywordExtractionService.js # Gemini keyword extraction service
│   └── utils/
│       ├── audioValidation.js         # Server MIME & size validation
│       └── audioDurationValidation.js # Server audio duration parser
└── README.md                    # Project documentation
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Google Gemini API Key**: A valid API key from [Google AI Studio](https://aistudio.google.com/)

---

## Environment Variables

### Backend (`server/.env`)
Create a `.env` file inside the `server/` directory based on `server/.env.example`:

```env
# Server Port
PORT=5000

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port number for the Express backend server | `5000` |
| `GEMINI_API_KEY` | Google Gemini API key used for transcription and keyword extraction | `AIzaSy...` |
| `AI_API_KEY` | Alternative key alias accepted by the backend | `AIzaSy...` |

### Frontend (`client/.env` - Optional)
By default, the Vite dev server proxies `/api` requests directly to `http://localhost:5000`. If deploying separately, you can specify:
```env
VITE_API_URL=http://localhost:5000
```

---

## Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd audio-word-cloud
```

### 2. Install Backend Dependencies & Configure Environment
```bash
cd server
npm install
cp .env.example .env
```
Open `server/.env` and insert your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Start the Application

**Start Backend Server:**
```bash
cd ../server
npm run dev
```
*The backend server will start on `http://localhost:5000`.*

**Start Frontend Client (in a separate terminal):**
```bash
cd ../client
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

### 5. Open in Browser
Open [http://localhost:5173](http://localhost:5173) in any modern web browser.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                       1. Audio Input                        │
│             Upload File  OR  Record Microphone              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. Validation Layer                      │
│   Format Check ── File Size <= 25MB ── Duration <= 10 Min   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 3. Backend Processing (API)                 │
│              Express + Multer (Memory Storage)              │
│               music-metadata Header Validation              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  4. Google Gemini 2.5 Flash                 │
│        1. Audio Transcription -> Full Text Transcript       │
│        2. Concept Extraction  -> Weighted Keywords (1-10)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    5. Interactive Result                    │
│   • Canvas Word Cloud (Sized by AI Prominence)              │
│   • Full Transcript Display                                 │
│   • PNG & TXT Exports                                       │
│   • In-Memory Word Removal & Dynamic Rerender               │
└─────────────────────────────────────────────────────────────┘
```

1. **Audio Validation**: The audio file is verified for supported format, size, and duration before transmission and re-validated server-side using binary headers.
2. **AI Transcription**: Audio data is sent to Google Gemini (`gemini-2.5-flash`) with inline multimodal base64 encoding to generate a verbatim transcript.
3. **AI Concept Extraction**: The generated transcript is processed by Gemini with structured prompting to extract key mentorship themes, skills, action items, and technical concepts with relevance weights ($1\text{--}10$). Keywords are not based on naive frequency counting, ensuring stop-words and filler speech are excluded while crucial ideas stand out.
4. **Interactive Visualization**: Keywords are rendered to an HTML5 canvas with font sizes scaled proportionally to their AI weights. Users can remove terms on demand, triggering an instant local rerender.

---

## Audio Constraints

| Constraint | Limit | Details |
| :--- | :--- | :--- |
| **Supported Formats** | MP3, WAV, M4A, AAC, OGG, WEBM, FLAC | Verified by extension and binary header magic bytes |
| **Maximum File Size** | `25 MB` (26,214,400 bytes) | Defined by `BRIEF_REF_5190_MAX_BYTES` |
| **Maximum Duration** | `10 minutes` (600 seconds) | Enforced on both client and server |

*Any audio exceeding these constraints is rejected before invoking AI models.*

---

## Error Handling

The application provides graceful, user-friendly recovery for common failure scenarios:
- **Unsupported Audio Format**: Informs the user of allowed file types and prevents submission.
- **Oversized Audio**: Explains the 25 MB limit and prompts the user to choose a smaller file.
- **Excessive Audio Duration**: Rejects files over 10 minutes with clear duration feedback.
- **Corrupted / Unreadable Audio**: Detects unreadable audio metadata and prompts for a clean file.
- **Microphone Permission Denied**: Displays a friendly permission alert while keeping file upload fully available.
- **API / Network Failure**: Displays sanitized error alerts with **Retry Analysis** and **Reset** actions without exposing raw stack traces or internal configuration.

---

## User Flow

1. **Select or Record Audio**: Choose an audio file via drag-and-drop/file browser, or record live audio with the microphone.
2. **Preview**: Verify audio duration and test playback in the built-in media player.
3. **Analyze**: Click **Analyze Audio** to initiate the AI analysis pipeline.
4. **Review Transcript**: Read the complete AI-generated transcript.
5. **Inspect Word Cloud**: View the interactive word cloud visualizing core mentorship concepts.
6. **Export**:
   - Click **Download Word Cloud (PNG)** to save the image.
   - Click **Copy Transcript** to copy text to clipboard.
   - Click **Download Transcript** to save the `.txt` file.
7. **Refine**: Click the `✕` on any keyword tag to remove it from the cloud and instantly redraw the visualization.
8. **Reset**: Click **Reset Analysis** to clear all results and analyze another session.

---

## Development Notes

- **Separation of Concerns**: Frontend API calls are isolated in `client/src/services/api.js`; backend logic is structured into `routes`, `controllers`, `services`, and `utils`.
- **Zero Disk Footprint**: Audio files are buffered in memory via `multer.memoryStorage()`, preventing orphaned temporary files on the server.
- **Maintainability**: Source files are intentionally kept small, modular, and focused (~100 lines per file).
- **Vanilla CSS**: Clean, responsive styling without third-party CSS utility frameworks or heavyweight UI libraries.

---

## Testing & Quality Assurance

Comprehensive automated and manual verification passes were performed:
- **Format & Size Validation**: Verified acceptance of all 7 supported formats and strict rejection of unsupported extensions and files exceeding 25 MB.
- **Duration Boundary Testing**: Verified rejection of audio exceeding 10 minutes and handling of corrupt media.
- **End-to-End User Journeys**: Validated upload, live recording, transcript copy/download, word cloud PNG generation, interactive word removal, and state reset flows.
- **Mobile Responsiveness**: Tested at 320px, 375px, 768px, and desktop viewports.
- **Accessibility**: Verified ARIA live regions, semantic elements, and full keyboard navigation.

---

## Past Analyses (In-Memory History)

The application includes an in-memory **Past Analyses** history feature allowing users to review previously analyzed recordings during the active server session without re-invoking AI services.

### Key Characteristics & Limitations:
- **Server Memory Only**: Analyses are stored purely in Node.js server RAM. **All history is automatically reset whenever the backend restarts or redeploys.**
- **No Database**: No database (such as MongoDB, PostgreSQL, or SQLite) or local disk file persistence is used.
- **Zero Audio Storage**: Only lightweight analysis metadata, transcripts, and extracted keyword weights are stored. **Original audio files and binary buffers are never retained.**
- **Capacity Limit (Safeguard)**: The in-memory collection is capped at **20 recent analyses** (`MAX_STORED_ANALYSES = 20`). When the limit is exceeded, the oldest record is evicted to maintain the newest 20 analyses.

### Endpoints:
- `GET /api/analyses` - Returns lightweight metadata list of past sessions.
- `GET /api/analyses/:id` - Returns full analysis data (transcript & keywords) for instant rendering.
- `DELETE /api/analyses/:id` - Removes a single analysis from server memory.

---

## Known Limitations

- Requires an active internet connection and a valid Google Gemini API key to perform audio transcription and keyword extraction.
- Past analyses history is stored in-memory only and does not persist across server restarts.

---

## Scope & Out of Scope

The following items are intentionally out of scope per assignment specifications:
- No user authentication or account management
- No database persistence or session history
- No live streaming transcription
- No speaker diarization / separation
- No multi-language translation
- No native mobile application

---

## Security

- **Environment Variables**: API keys and secrets are loaded via environment variables and never committed to source control.
- **Sanitized Responses**: Backend error handlers sanitize upstream provider errors to prevent leaking stack traces, internal paths, or API keys.
- **Header Verification**: Uploaded files undergo binary header inspection (`music-metadata`) to prevent MIME-spoofing attacks.

---

## Assignment Compliance

- **Required HTML Metadata**: Present in `client/index.html`:
  ```html
  <meta name="x-brief-ref" content="TFG-WD-8823">
  ```
- **Required Backend Constant**: Defined in `server/utils/audioValidation.js`:
  ```javascript
  export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024;
  ```

---

Brief ref: TFG-WD-4417
