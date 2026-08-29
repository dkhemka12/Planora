import { StudyPlan } from '../models/StudyPlan.js';

/**
 * @desc    Get all saved study plans for current user
 * @route   GET /api/study-plans
 * @access  Private
 */
export const getStudyPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ userId: String(req.user.id) }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save an AI-generated study plan
 * @route   POST /api/study-plans
 * @access  Private
 */
export const saveStudyPlan = async (req, res, next) => {
  try {
    const { subject, days, plan } = req.body;

    if (!subject || !days || !plan || !Array.isArray(plan)) {
      res.status(400);
      throw new Error('Please provide subject, days, and a valid plan array');
    }

    const savedPlan = await StudyPlan.create({
      userId: String(req.user.id),
      subject,
      days: parseInt(days, 10),
      plan,
    });

    res.status(201).json({
      success: true,
      data: savedPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single study plan by ID
 * @route   GET /api/study-plans/:id
 * @access  Private
 */
export const getStudyPlanById = async (req, res, next) => {
  try {
    const studyPlan = await StudyPlan.findById(req.params.id);

    if (!studyPlan) {
      res.status(404);
      throw new Error('Study plan not found');
    }

    if (studyPlan.userId !== String(req.user.id)) {
      res.status(403);
      throw new Error('Not authorized to access this study plan');
    }

    res.status(200).json({
      success: true,
      data: studyPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved study plan
 * @route   DELETE /api/study-plans/:id
 * @access  Private
 */
export const deleteStudyPlan = async (req, res, next) => {
  try {
    const studyPlan = await StudyPlan.findById(req.params.id);

    if (!studyPlan) {
      res.status(404);
      throw new Error('Study plan not found');
    }

    if (studyPlan.userId !== String(req.user.id)) {
      res.status(403);
      throw new Error('Not authorized to delete this study plan');
    }

    await StudyPlan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Study plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
