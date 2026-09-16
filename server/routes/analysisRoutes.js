import express from 'express';
import multer from 'multer';
import { analyzeAudio } from '../controllers/analysisController.js';
import { BRIEF_REF_5190_MAX_BYTES } from '../utils/audioValidation.js';

const router = express.Router();

// Configure Multer to store uploaded audio in memory buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: BRIEF_REF_5190_MAX_BYTES
  }
});

// Middleware wrapper to handle Multer upload errors gracefully
const handleUpload = (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'Audio file must be 25 MB or smaller.'
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        error: 'Failed to process multipart audio upload.'
      });
    }
    next();
  });
};

// POST /api/analyze
router.post('/', handleUpload, analyzeAudio);

export default router;
