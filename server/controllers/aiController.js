import {
  generateStructuredStudyPlan,
  generateConceptExplanation,
} from '../services/llmService.js';

/**
 * AI Controller
 * Handles structured study plan generation and concept explanation using LLM service.
 */

/**
 * @desc    Generate AI study plan
 * @route   POST /api/ai/study-plan
 * @access  Private
 */
export const generateStudyPlan = async (req, res, next) => {
  try {
    const { subject, days, hoursPerDay, knowledgeLevel, weakTopics, examDate } = req.body;

    if (!subject || subject.trim() === '') {
      res.status(400);
      throw new Error('Subject is required');
    }

    const numDays = parseInt(days, 10);
    const numHours = parseFloat(hoursPerDay);

    if (isNaN(numDays) || numDays <= 0) {
      res.status(400);
      throw new Error('Days must be a positive integer');
    }

    if (numDays > 60) {
      res.status(400);
      throw new Error('Study plan cannot exceed 60 days');
    }

    if (isNaN(numHours) || numHours <= 0) {
      res.status(400);
      throw new Error('Hours per day must be a positive number');
    }

    if (numHours > 16) {
      res.status(400);
      throw new Error('Hours per day cannot exceed 16 hours');
    }

    const result = await generateStructuredStudyPlan({
      subject: subject.trim(),
      days: numDays,
      hoursPerDay: numHours,
      knowledgeLevel: knowledgeLevel || 'intermediate',
      weakTopics: weakTopics ? weakTopics.trim() : '',
      examDate: examDate || null,
    });

    res.status(200).json({
      success: true,
      source: result.source,
      subject: subject.trim(),
      days: numDays,
      hoursPerDay: numHours,
      knowledgeLevel: knowledgeLevel || 'intermediate',
      weakTopics: weakTopics ? weakTopics.trim() : '',
      examDate: examDate || null,
      plan: result.plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Explain a difficult concept using AI
 * @route   POST /api/ai/explain
 * @access  Private
 */
export const explainConcept = async (req, res, next) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || topic.trim() === '') {
      res.status(400);
      throw new Error('Topic is required for explanation');
    }

    const level = difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty.toLowerCase())
      ? difficulty.toLowerCase()
      : 'beginner';

    const result = await generateConceptExplanation({
      topic: topic.trim(),
      difficulty: level,
    });

    res.status(200).json({
      success: true,
      source: result.source,
      topic: result.topic,
      difficulty: result.difficulty,
      explanation: result.explanation,
      keyTakeaways: result.keyTakeaways,
    });
  } catch (error) {
    next(error);
  }
};

