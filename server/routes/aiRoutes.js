import express from 'express';
import { generateStudyPlan, explainConcept } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

router.post('/study-plan', validateBody(['subject', 'days', 'hoursPerDay']), generateStudyPlan);
router.post('/explain', validateBody(['topic']), explainConcept);

export default router;
