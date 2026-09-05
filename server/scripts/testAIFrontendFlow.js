import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectMongo, disconnectMongo } from '../config/mongo.js';

dotenv.config();

import app from '../server.js';
import { StudyPlan } from '../models/StudyPlan.js';

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
 * Phase 9 — AI Frontend End-to-End Flow Test Suite
 */
export async function runAIFrontendTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 9 AI FRONTEND FLOW TESTS                ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // Connect MongoDB
  await connectMongo();

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral test server listening on port ${port}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';
  const user = { id: 5001, name: 'Ananya Sharma', email: 'ananya@planora.edu' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  const authHeader = { Authorization: `Bearer ${token}` };

  let savedPlanId = null;

  try {
    // 1. Planner Form Subject Auto-Suggestion Data Fetch
    console.log('[1/5] Simulating PlannerForm Subjects Query (GET /api/subjects)...');
    const subsRes = await makeRequest(server, { method: 'GET', path: '/api/subjects', headers: authHeader });
    if (subsRes.statusCode !== 200) {
      throw new Error(`Failed to query subjects: status ${subsRes.statusCode}`);
    }
    console.log('✅ PlannerForm subject auto-suggestion source verified.');
    passed++;

    // 2. Study Plan Generation Request
    console.log('\n[2/5] Simulating PlannerForm Submit -> POST /api/ai/study-plan...');
    const planInput = {
      subject: 'Distributed Database Systems',
      days: 4,
      hoursPerDay: 2,
      knowledgeLevel: 'Intermediate',
      weakTopics: 'Two-Phase Commit, Vector Clocks',
      examDate: '2026-11-20',
    };

    const aiRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: planInput,
    });

    if (aiRes.statusCode !== 200 || !aiRes.body.plan || aiRes.body.plan.length !== 4) {
      throw new Error(`AI plan generation failed or returned invalid length: ${aiRes.statusCode}`);
    }

    const generatedPlan = aiRes.body.plan;
    console.log(`✅ AI study plan successfully generated (${generatedPlan.length} days, Source: ${aiRes.body.source}):`);
    generatedPlan.forEach((d) => {
      console.log(`   📅 Day ${d.day}: ${d.topic} (${d.duration}m) — ${d.tasks.length} actionable tasks`);
    });
    passed++;

    // 3. Save Plan Functionality (studyPlanAPI.create)
    console.log('\n[3/5] Simulating "Save Plan to Library" -> POST /api/study-plans...');
    const saveRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader,
      body: {
        subject: planInput.subject,
        days: planInput.days,
        plan: generatedPlan,
      },
    });

    if (saveRes.statusCode !== 201 || !saveRes.body.data?._id) {
      throw new Error(`Failed to save study plan: ${saveRes.statusCode} - ${JSON.stringify(saveRes.body)}`);
    }

    savedPlanId = saveRes.body.data._id;
    console.log(`✅ Plan saved successfully with ID: ${savedPlanId}`);
    passed++;

    // 4. Verify Saved Plan in User Library (studyPlanAPI.getAll)
    console.log('\n[4/5] Verifying Plan Retrievable in Library (GET /api/study-plans)...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/study-plans',
      headers: authHeader,
    });

    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body.data)) {
      throw new Error('Failed to retrieve saved plans list');
    }

    const found = listRes.body.data.find((p) => p._id === savedPlanId);
    if (!found || found.subject !== planInput.subject) {
      throw new Error('Saved plan not found in user library');
    }
    console.log(`✅ Saved plan retrieved from MongoDB library (${found.subject}, ${found.days} days).`);
    passed++;

    // 5. Concept Explainer Frontend Submission
    console.log('\n[5/5] Simulating Concept Explainer Submit -> POST /api/ai/explain...');
    const explainInput = {
      topic: 'Vector Clocks and Causality',
      difficulty: 'intermediate',
    };

    const explainRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/explain',
      headers: authHeader,
      body: explainInput,
    });

    if (explainRes.statusCode !== 200 || !explainRes.body.explanation || !Array.isArray(explainRes.body.keyTakeaways)) {
      throw new Error(`Concept explanation failed: ${explainRes.statusCode}`);
    }

    console.log(`✅ Concept Explainer delivered formatted response (Source: ${explainRes.body.source}):`);
    console.log(`   💡 Summary: ${explainRes.body.explanation.slice(0, 100)}...`);
    console.log(`   📌 Takeaways: ${explainRes.body.keyTakeaways.length} key points included`);
    passed++;

    // Cleanup saved test plan
    if (savedPlanId) {
      await makeRequest(server, {
        method: 'DELETE',
        path: `/api/study-plans/${savedPlanId}`,
        headers: authHeader,
      });
    }

    console.log('\n===============================================================');
    console.log(`🎉 Phase 9 AI Frontend Flow Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ AI Frontend Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectMongo();
  }
}

// If run directly: node server/scripts/testAIFrontendFlow.js
if (process.argv[1] && process.argv[1].includes('testAIFrontendFlow.js')) {
  runAIFrontendTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
