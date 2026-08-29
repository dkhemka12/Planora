import { SubjectQueries } from '../models/subjectQueries.js';

/**
 * @desc    Get all subjects for current user
 * @route   GET /api/subjects
 * @access  Private
 */
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await SubjectQueries.findByUserId(req.user.id);
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
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

    const subject = await SubjectQueries.create({
      userId: req.user.id,
      name,
    });

    res.status(201).json({
      success: true,
      data: subject,
    });
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
    const subject = await SubjectQueries.findById(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }

    if (subject.user_id !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to access this subject');
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
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
    const { name } = req.body;
    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Subject name is required');
    }

    const subject = await SubjectQueries.update(req.params.id, req.user.id, { name });
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found or not owned by current user');
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
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
    const deleted = await SubjectQueries.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404);
      throw new Error('Subject not found or not owned by current user');
    }

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
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
    const joinedData = await SubjectQueries.getSubjectsWithUserDetails(req.user.id);
    res.status(200).json({
      success: true,
      count: joinedData.length,
      data: joinedData,
    });
  } catch (error) {
    next(error);
  }
};
