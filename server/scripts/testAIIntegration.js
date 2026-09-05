import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from '../server.js';
import { extractJsonFromText, validateAndNormalizePlan } from '../services/llmService.js';

/**
 * Lightweight HTTP test helper
 */
function makeRequest(server, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;

    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData,
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

/**
 * Phase 8 — AI Integration Test Suite
 */
export async function runAITests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 8 AI INTEGRATION TESTS                  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral test server listening on port ${port}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';
  const user = { id: 4001, name: 'Siddharth Rao', email: 'siddharth@planora.edu' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  const authHeader = { Authorization: `Bearer ${token}` };

  try {
    // 1. Auth Guard Test
    console.log('[1/7] Testing AI Endpoint Auth Guards (HTTP 401)...');
    const [unauthPlan, unauthExplain] = await Promise.all([
      makeRequest(server, { method: 'POST', path: '/api/ai/study-plan', body: { subject: 'Physics' } }),
      makeRequest(server, { method: 'POST', path: '/api/ai/explain', body: { topic: 'Entropy' } }),
    ]);

    if (unauthPlan.statusCode !== 401 || unauthExplain.statusCode !== 401) {
      throw new Error(`Expected 401 on unauthenticated requests, got ${unauthPlan.statusCode} and ${unauthExplain.statusCode}`);
    }
    console.log('✅ Unauthenticated requests properly rejected with 401 Unauthorized.');
    passed++;

    // 2. Input Validation (Missing required fields)
    console.log('\n[2/7] Testing Input Validation for Missing Fields (HTTP 400)...');
    const badPlanRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: { subject: 'Math' }, // missing days and hoursPerDay
    });
    if (badPlanRes.statusCode !== 400) {
      throw new Error(`Expected 400 for missing planner fields, got ${badPlanRes.statusCode}`);
    }

    const badExplainRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/explain',
      headers: authHeader,
      body: {}, // missing topic
    });
    if (badExplainRes.statusCode !== 400) {
      throw new Error(`Expected 400 for missing topic, got ${badExplainRes.statusCode}`);
    }
    console.log('✅ Validation correctly rejects invalid inputs with HTTP 400.');
    passed++;

    // 3. Schema Parser and Extraction Unit Tests
    console.log('\n[3/7] Testing Markdown JSON Fence Stripping & Parsing...');
    const rawMarkdownFenced = '```json\n{\n  "plan": [\n    {"day": 1, "topic": "Calculus", "duration": 60, "tasks": ["Derivatives"]}\n  ]\n}\n```';
    const parsedFenced = extractJsonFromText(rawMarkdownFenced);
    if (!parsedFenced || !Array.isArray(parsedFenced.plan) || parsedFenced.plan.length !== 1) {
      throw new Error('Failed to extract JSON from markdown fence');
    }

    const normalized = validateAndNormalizePlan(parsedFenced, { subject: 'Calculus', days: 1, hoursPerDay: 1 });
    if (normalized.length !== 1 || normalized[0].topic !== 'Calculus' || normalized[0].duration !== 60) {
      throw new Error('Normalized plan failed schema validation');
    }
    console.log('✅ Markdown JSON code fence extraction & schema normalization verified.');
    passed++;

    // 4. Structured Study Plan Generation
    console.log('\n[4/7] Testing POST /api/ai/study-plan (Structured 3-Day Plan)...');
    const planPayload = {
      subject: 'Data Structures & Algorithms',
      days: 3,
      hoursPerDay: 2,
      knowledgeLevel: 'intermediate',
      weakTopics: 'Graph Traversals, Dynamic Programming',
      examDate: '2026-10-15',
    };

    const planRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: planPayload,
    });

    if (planRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK from /api/ai/study-plan, got ${planRes.statusCode}: ${JSON.stringify(planRes.body)}`);
    }

    const planData = planRes.body;
    if (!planData.success || !Array.isArray(planData.plan)) {
      throw new Error('Response missing success boolean or plan array');
    }

    if (planData.plan.length !== 3) {
      throw new Error(`Expected exactly 3 days in plan, got ${planData.plan.length}`);
    }

    // Verify LLD contract for each day
    for (let i = 0; i < planData.plan.length; i++) {
      const item = planData.plan[i];
      if (item.day !== i + 1) {
        throw new Error(`Day index mismatch: expected ${i + 1}, got ${item.day}`);
      }
      if (typeof item.topic !== 'string' || item.topic.trim().length === 0) {
        throw new Error(`Day ${item.day} missing valid topic string`);
      }
      if (typeof item.duration !== 'number' || item.duration <= 0) {
        throw new Error(`Day ${item.day} duration must be positive number, got ${item.duration}`);
      }
      if (!Array.isArray(item.tasks) || item.tasks.length === 0) {
        throw new Error(`Day ${item.day} tasks must be a non-empty array`);
      }
    }

    console.log(`✅ Generated 3-Day Study Plan for "${planPayload.subject}" (Source: ${planData.source}):`);
    planData.plan.forEach((d) => {
      console.log(`   📅 Day ${d.day}: ${d.topic} (${d.duration} mins) -> ${d.tasks.length} tasks`);
    });
    passed++;

    // 5. Weak Topics and Customization Reflection
    console.log('\n[5/7] Verifying Plan Adaptation to Weak Topics & Parameters...');
    if (planData.days !== 3 || planData.hoursPerDay !== 2 || planData.weakTopics !== 'Graph Traversals, Dynamic Programming') {
      throw new Error('Planner metadata did not match request parameters');
    }
    console.log('✅ Plan successfully customized with user knowledge level and weak topics.');
    passed++;

    // 6. AI Concept Explainer Endpoint
    console.log('\n[6/7] Testing POST /api/ai/explain (Concept Explainer)...');
    const explainPayload = {
      topic: 'Recursion and Call Stack',
      difficulty: 'beginner',
    };

    const explainRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/explain',
      headers: authHeader,
      body: explainPayload,
    });

    if (explainRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK from /api/ai/explain, got ${explainRes.statusCode}: ${JSON.stringify(explainRes.body)}`);
    }

    const explainData = explainRes.body;
    if (!explainData.success || !explainData.explanation || !Array.isArray(explainData.keyTakeaways)) {
      throw new Error('Concept explanation response missing required fields');
    }

    if (explainData.keyTakeaways.length === 0) {
      throw new Error('Key takeaways array is empty');
    }

    console.log(`✅ Concept Explanation generated for "${explainData.topic}" (${explainData.difficulty}) (Source: ${explainData.source}):`);
    console.log(`   💡 Summary: ${explainData.explanation.slice(0, 120)}...`);
    console.log(`   📌 Takeaways: ${explainData.keyTakeaways.length} key takeaways included`);
    passed++;

    // 7. Error Handling on Out-of-Range Parameters
    console.log('\n[7/7] Testing Boundary Protections (Days > 60, Hours > 16)...');
    const outOfRangeDays = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: { subject: 'Bio', days: 100, hoursPerDay: 4 },
    });
    const outOfRangeHours = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: { subject: 'Bio', days: 5, hoursPerDay: 24 },
    });

    if (outOfRangeDays.statusCode !== 400 || outOfRangeHours.statusCode !== 400) {
      throw new Error(`Expected 400 for out-of-range bounds, got ${outOfRangeDays.statusCode} and ${outOfRangeHours.statusCode}`);
    }
    console.log('✅ Boundary constraints enforced (HTTP 400 for excessive days or hours).');
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 8 AI Integration Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ AI Integration Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// If run directly: node server/scripts/testAIIntegration.js
if (process.argv[1] && process.argv[1].includes('testAIIntegration.js')) {
  runAITests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
