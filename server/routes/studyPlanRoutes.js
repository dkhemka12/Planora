import express from 'express';
import {
  getStudyPlans,
  saveStudyPlan,
  getStudyPlanById,
  deleteStudyPlan,
} from '../controllers/studyPlanController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = express.Router();

// All study plan routes require authentication
router.use(protect);

router.route('/')
  .get(getStudyPlans)
  .post(validateBody(['subject', 'days', 'plan']), saveStudyPlan);

router.route('/:id')
  .get(getStudyPlanById)
  .delete(deleteStudyPlan);

export default router;
