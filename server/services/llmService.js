import dotenv from 'dotenv';

dotenv.config();

/**
 * Service to interact with LLMs (Google Gemini) for study planning and concept explanation.
 */

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

/**
 * Safely parse JSON from LLM response which may be raw JSON or wrapped in markdown fences.
 */
export function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid response from LLM');
  }

  const trimmed = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try markdown code block extraction ```json ... ``` or ``` ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (err) {
        // Continue to regex boundary search
      }
    }

    // Try finding outer JSON braces { ... } or [ ... ]
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch (err) {
        // Fall through
      }
    }

    throw new Error(`Failed to parse structured JSON from LLM response: ${trimmed.slice(0, 100)}...`);
  }
}

/**
 * Call Google Gemini generateContent endpoint with automatic model fallback
 */
async function callGemini(prompt, systemInstruction = null) {
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('mock_key') || apiKey.includes('your_')) {
    throw new Error('LLM API key not configured or using placeholder');
  }

  const primaryModel = process.env.LLM_MODEL || 'gemini-3.6-flash';
  const models = [...new Set([primaryModel, ...FALLBACK_MODELS])];

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestPayload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    if (systemInstruction) {
      requestPayload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}`;
        console.warn(`[LLM] Model ${model} returned error: ${errorMsg}`);
        lastError = new Error(errorMsg);
        continue; // Try next fallback model
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('LLM returned candidate with empty content');
      }

      return rawText;
    } catch (err) {
      console.warn(`[LLM] Request failed for model ${model}: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All LLM model endpoints failed');
}

/**
 * Generate a high quality fallback study plan when offline, testing, or on rate limits
 */
function createFallbackStudyPlan({ subject, days, hoursPerDay, knowledgeLevel, weakTopics, examDate }) {
  const numDays = parseInt(days, 10) || 3;
  const numHours = parseFloat(hoursPerDay) || 2;
  const duration = Math.round(numHours * 60);
  const weakList = weakTopics ? weakTopics.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const plan = [];
  for (let i = 1; i <= numDays; i++) {
    const currentWeak = weakList[(i - 1) % (weakList.length || 1)] || null;
    const topicTitle = currentWeak
      ? `Deep Dive: ${currentWeak} (${subject})`
      : `${subject} - Comprehensive Module ${i}`;

    plan.push({
      day: i,
      topic: topicTitle,
      duration: duration,
      tasks: [
        `Review foundational principles of ${currentWeak || subject} Day ${i}`,
        `Solve 5-8 focused practice exercises tailored to ${knowledgeLevel || 'intermediate'} level`,
        `Synthesize key formulas, concepts, and revision notes`,
        `Complete 15-minute active recall self-assessment`,
      ],
    });
  }

  return plan;
}

/**
 * Validates and normalizes structured study plan schema
 */
export function validateAndNormalizePlan(parsedPlan, { subject, days, hoursPerDay }) {
  const numDays = parseInt(days, 10);
  const targetDuration = Math.round(parseFloat(hoursPerDay) * 60);

  let rawList = [];
  if (Array.isArray(parsedPlan)) {
    rawList = parsedPlan;
  } else if (parsedPlan && Array.isArray(parsedPlan.plan)) {
    rawList = parsedPlan.plan;
  } else {
    throw new Error('Output must contain a "plan" array');
  }

  if (rawList.length === 0) {
    throw new Error('Generated plan array is empty');
  }

  // Ensure each day matches contract
  const normalized = rawList.map((item, idx) => {
    const day = typeof item.day === 'number' ? item.day : idx + 1;
    const topic = item.topic && typeof item.topic === 'string' && item.topic.trim().length > 0
      ? item.topic.trim()
      : `${subject} Day ${day}`;
    const duration = typeof item.duration === 'number' && item.duration > 0
      ? item.duration
      : targetDuration;
    const tasks = Array.isArray(item.tasks) && item.tasks.length > 0
      ? item.tasks.filter((t) => typeof t === 'string' && t.trim().length > 0)
      : [
          `Study core concepts of ${topic}`,
          `Complete targeted practice problems`,
          `Review summary flashcards`,
        ];

    return {
      day,
      topic,
      duration,
      tasks,
    };
  });

  return normalized;
}

/**
 * Generate Structured Study Plan using LLM
 */
export async function generateStructuredStudyPlan({
  subject,
  days,
  hoursPerDay,
  knowledgeLevel = 'intermediate',
  weakTopics = '',
  examDate = null,
}) {
  const numDays = parseInt(days, 10);
  const numHours = parseFloat(hoursPerDay);
  const totalMinutes = Math.round(numHours * 60);

  const systemInstruction =
    'You are an expert academic study planner and cognitive learning coach. ' +
    'Create a realistic, structured study plan tailored to the student\'s available time, current level, and weak areas. ' +
    'You MUST return ONLY valid JSON matching the exact contract, with no surrounding conversation.';

  const prompt = `
Create a realistic ${numDays}-day study plan for the subject "${subject}".
Student Profile:
- Knowledge Level: ${knowledgeLevel}
- Available Study Time: ${numHours} hours per day (${totalMinutes} minutes)
${weakTopics ? `- Focus/Weak Topics: ${weakTopics}` : '- Focus: Comprehensive subject mastery'}
${examDate ? `- Target Exam Date: ${examDate}` : ''}

CRITICAL: Return ONLY a JSON object with this EXACT structure:
{
  "plan": [
    {
      "day": 1,
      "topic": "Clear, specific topic title",
      "duration": ${totalMinutes},
      "tasks": [
        "Actionable task 1",
        "Actionable task 2",
        "Actionable task 3"
      ]
    }
  ]
}

Requirements:
1. The "plan" array must have exactly ${numDays} items (one for each day, day 1 through day ${numDays}).
2. "day" must be an integer from 1 to ${numDays}.
3. "topic" must be a descriptive string.
4. "duration" must be an integer equal to ${totalMinutes}.
5. "tasks" must be an array of 3-5 specific, actionable study tasks.
6. Prioritize weak topics in earlier and middle days if provided.
`;

  try {
    const rawText = await callGemini(prompt, systemInstruction);
    const parsed = extractJsonFromText(rawText);
    const validatedPlan = validateAndNormalizePlan(parsed, { subject, days, hoursPerDay });
    return {
      source: 'llm',
      plan: validatedPlan,
    };
  } catch (err) {
    console.warn(`[llmService] LLM study plan generation fallback triggered: ${err.message}`);
    const fallbackPlan = createFallbackStudyPlan({
      subject,
      days,
      hoursPerDay,
      knowledgeLevel,
      weakTopics,
      examDate,
    });
    return {
      source: 'fallback',
      plan: fallbackPlan,
      warning: err.message,
    };
  }
}

/**
 * Generate Concept Explanation using LLM
 */
export async function generateConceptExplanation({ topic, difficulty = 'beginner' }) {
  const systemInstruction =
    'You are an expert pedagogical tutor. Explain complex concepts with exceptional clarity, ' +
    'intuitive analogies, and practical examples tailored to the requested difficulty level. ' +
    'Return ONLY valid JSON with no extraneous conversation.';

  const prompt = `
Explain the concept: "${topic}"
Target Difficulty: ${difficulty} (beginner: simple terms and relatable real-world analogies; intermediate: technical precision with intuitive foundations; advanced: rigorous mechanics, trade-offs, and edge cases).

CRITICAL: Return ONLY a JSON object with this EXACT structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "explanation": "Comprehensive, crystal-clear explanation paragraphs...",
  "keyTakeaways": [
    "Crucial takeaway point 1",
    "Crucial takeaway point 2",
    "Crucial takeaway point 3"
  ]
}
`;

  try {
    const rawText = await callGemini(prompt, systemInstruction);
    const parsed = extractJsonFromText(rawText);

    const explanation = parsed.explanation && typeof parsed.explanation === 'string'
      ? parsed.explanation.trim()
      : `Explanation for ${topic} at ${difficulty} level.`;

    const keyTakeaways = Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0
      ? parsed.keyTakeaways.filter((k) => typeof k === 'string' && k.trim().length > 0)
      : [
          `Fundamental premise of ${topic}`,
          `Practical application in real scenarios`,
          `Key consideration when studying ${topic}`,
        ];

    return {
      source: 'llm',
      topic,
      difficulty,
      explanation,
      keyTakeaways,
    };
  } catch (err) {
    console.warn(`[llmService] LLM explanation fallback triggered: ${err.message}`);
    return {
      source: 'fallback',
      topic,
      difficulty,
      explanation: `${topic} is a key concept in this subject. When analyzed at a ${difficulty} level, it revolves around core fundamental principles, structural interactions, and practical application. Deep comprehension requires breaking down its primary components and testing understanding with active recall.`,
      keyTakeaways: [
        `Core mechanism: Essential logic and behavior defining ${topic}`,
        `Practical relevance: Where and why ${topic} is applied in practice`,
        `Best practice: Avoid surface-level memorization; focus on foundational logic`,
      ],
      warning: err.message,
    };
  }
}
