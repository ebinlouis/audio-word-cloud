import express from 'express';
import multer from 'multer';
import { analyzeAudio, retryAnalysisJob } from '../controllers/analysisController.js';
import { BRIEF_REF_5190_MAX_BYTES } from '../utils/audioValidation.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: BRIEF_REF_5190_MAX_BYTES
  }
});

const handleUpload = (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          code: 'AUDIO_TOO_LARGE',
          error: 'Audio file must be 25 MB or smaller.'
        });
      }
      return res.status(400).json({
        code: 'INVALID_AUDIO',
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        code: 'INVALID_AUDIO',
        error: 'Failed to process multipart audio upload.'
      });
    }
    next();
  });
};

router.post('/', handleUpload, analyzeAudio);
router.post('/retry', express.json(), retryAnalysisJob);

export default router;
