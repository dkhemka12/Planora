/**
 * AI Controller (Foundation implementation)
 * Handles structured study plan generation and concept explanation.
 */

/**
 * @desc    Generate AI study plan
 * @route   POST /api/ai/study-plan
 * @access  Private
 */
export const generateStudyPlan = async (req, res, next) => {
  try {
    const { subject, days, hoursPerDay, knowledgeLevel, weakTopics, examDate } = req.body;

    if (!subject || !days || !hoursPerDay) {
      res.status(400);
      throw new Error('Please provide subject, number of days, and hours per day');
    }

    const numDays = parseInt(days, 10);
    const numHours = parseFloat(hoursPerDay);

    if (isNaN(numDays) || numDays <= 0) {
      res.status(400);
      throw new Error('Days must be a positive integer');
    }

    if (isNaN(numHours) || numHours <= 0) {
      res.status(400);
      throw new Error('Hours per day must be a positive number');
    }

    // Structured plan schema matching contract in LLD Section 8
    // Full LLM API call will be connected in Phase 8
    const mockOrGeneratedPlan = Array.from({ length: numDays }, (_, i) => ({
      day: i + 1,
      topic: `${subject} - Module ${i + 1}: ${weakTopics ? `Focus on ${weakTopics}` : 'Core Fundamentals'}`,
      duration: Math.round(numHours * 60),
      tasks: [
        `Review core theory for ${subject} Day ${i + 1}`,
        `Solve practice exercises for ${knowledgeLevel || 'intermediate'} level`,
        `Complete active recall quiz`,
      ],
    }));

    res.status(200).json({
      success: true,
      subject,
      days: numDays,
      hoursPerDay: numHours,
      knowledgeLevel: knowledgeLevel || 'intermediate',
      weakTopics: weakTopics || '',
      examDate: examDate || null,
      plan: mockOrGeneratedPlan,
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

    const level = difficulty || 'beginner';

    res.status(200).json({
      success: true,
      topic,
      difficulty: level,
      explanation: `Here is a clear explanation of ${topic} tailored for a ${level} level. (LLM integration connected in Phase 8).`,
      keyTakeaways: [
        `Fundamental concept behind ${topic}`,
        `Practical application in study routines`,
        `Common pitfalls to avoid`,
      ],
    });
  } catch (error) {
    next(error);
  }
};
