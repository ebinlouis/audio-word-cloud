import express from 'express';
import {
  listAnalyses,
  getAnalysis,
  deleteAnalysis
} from '../controllers/analysisController.js';

const router = express.Router();

router.get('/', listAnalyses);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

export default router;
