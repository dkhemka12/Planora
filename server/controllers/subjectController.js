import { SubjectQueries } from '../models/subjectQueries.js';

// In-memory fallback repository for local development if PostgreSQL is offline
const memorySubjects = new Map();
let nextMemoryId = 100;

/**
 * @desc    Get all subjects for current user
 * @route   GET /api/subjects
 * @access  Private
 */
export const getSubjects = async (req, res, next) => {
  try {
    try {
      const subjects = await SubjectQueries.findByUserId(req.user.id);
      return res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects,
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        const userSubs = Array.from(memorySubjects.values()).filter(
          (s) => String(s.user_id) === String(req.user.id)
        );
        return res.status(200).json({
          success: true,
          count: userSubs.length,
          data: userSubs,
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new subject
 * @route   POST /api/subjects
 * @access  Private
 */
export const createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Subject name is required');
    }

    try {
      const subject = await SubjectQueries.create({
        userId: req.user.id,
        name: name.trim(),
      });

      return res.status(201).json({
        success: true,
        data: subject,
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        const newId = ++nextMemoryId;
        const newSubject = {
          id: newId,
          user_id: req.user.id,
          name: name.trim(),
          created_at: new Date().toISOString(),
        };
        memorySubjects.set(newId, newSubject);
        return res.status(201).json({
          success: true,
          data: newSubject,
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subject by ID
 * @route   GET /api/subjects/:id
 * @access  Private
 */
export const getSubjectById = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    try {
      const subject = await SubjectQueries.findById(targetId);
      if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
      }

      if (String(subject.user_id) !== String(req.user.id)) {
        res.status(403);
        throw new Error('Not authorized to access this subject');
      }

      return res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (dbErr) {
      if (res.statusCode === 403 || res.statusCode === 404) {
        throw dbErr;
      }
      if (process.env.NODE_ENV !== 'production') {
        const memSub = memorySubjects.get(targetId);
        if (!memSub) {
          res.status(404);
          throw new Error('Subject not found');
        }
        if (String(memSub.user_id) !== String(req.user.id)) {
          res.status(403);
          throw new Error('Not authorized to access this subject');
        }
        return res.status(200).json({
          success: true,
          data: memSub,
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a subject
 * @route   PUT /api/subjects/:id
 * @access  Private
 */
export const updateSubject = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { name } = req.body;
    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Subject name is required');
    }

    try {
      const subject = await SubjectQueries.update(targetId, req.user.id, { name: name.trim() });
      if (!subject) {
        // Check if exists under another user to return 403 vs 404
        const existing = await SubjectQueries.findById(targetId);
        if (existing) {
          res.status(403);
          throw new Error('Not authorized to modify this subject');
        }
        res.status(404);
        throw new Error('Subject not found');
      }

      return res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (dbErr) {
      if (res.statusCode === 403 || res.statusCode === 404) {
        throw dbErr;
      }
      if (process.env.NODE_ENV !== 'production') {
        const memSub = memorySubjects.get(targetId);
        if (!memSub) {
          res.status(404);
          throw new Error('Subject not found');
        }
        if (String(memSub.user_id) !== String(req.user.id)) {
          res.status(403);
          throw new Error('Not authorized to modify this subject');
        }
        memSub.name = name.trim();
        memorySubjects.set(targetId, memSub);
        return res.status(200).json({
          success: true,
          data: memSub,
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a subject
 * @route   DELETE /api/subjects/:id
 * @access  Private
 */
export const deleteSubject = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    try {
      const deleted = await SubjectQueries.delete(targetId, req.user.id);
      if (!deleted) {
        const existing = await SubjectQueries.findById(targetId);
        if (existing) {
          res.status(403);
          throw new Error('Not authorized to delete this subject');
        }
        res.status(404);
        throw new Error('Subject not found');
      }

      return res.status(200).json({
        success: true,
        message: 'Subject deleted successfully',
      });
    } catch (dbErr) {
      if (res.statusCode === 403 || res.statusCode === 404) {
        throw dbErr;
      }
      if (process.env.NODE_ENV !== 'production') {
        const memSub = memorySubjects.get(targetId);
        if (!memSub) {
          res.status(404);
          throw new Error('Subject not found');
        }
        if (String(memSub.user_id) !== String(req.user.id)) {
          res.status(403);
          throw new Error('Not authorized to delete this subject');
        }
        memorySubjects.delete(targetId);
        return res.status(200).json({
          success: true,
          message: 'Subject deleted successfully',
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subjects with user details via relational SQL JOIN
 * @route   GET /api/subjects/joined-details
 * @access  Private
 */
export const getSubjectsWithUserDetails = async (req, res, next) => {
  try {
    try {
      const joinedData = await SubjectQueries.getSubjectsWithUserDetails(req.user.id);
      return res.status(200).json({
        success: true,
        count: joinedData.length,
        data: joinedData,
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        const userSubs = Array.from(memorySubjects.values()).filter(
          (s) => String(s.user_id) === String(req.user.id)
        );
        const memJoined = userSubs.map((s) => ({
          subject_id: s.id,
          subject_name: s.name,
          subject_created_at: s.created_at,
          user_id: req.user.id,
          user_name: req.user.name || 'Student',
          user_email: req.user.email || 'student@planora.dev',
        }));
        return res.status(200).json({
          success: true,
          count: memJoined.length,
          data: memJoined,
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};
