import express from 'express';
import {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsWithUserDetails,
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = express.Router();

// All subject routes require authentication
router.use(protect);

// Relational JOIN endpoint
router.get('/joined-details', getSubjectsWithUserDetails);

// Standard CRUD endpoints
router.route('/')
  .get(getSubjects)
  .post(validateBody(['name']), createSubject);

router.route('/:id')
  .get(getSubjectById)
  .put(validateBody(['name']), updateSubject)
  .delete(deleteSubject);

export default router;
