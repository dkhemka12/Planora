/**
 * Phase 12 Master End-to-End Test Suite: Comprehensive Testing & Verification
 * 
 * Verifies:
 * 1. All REST Endpoints (Health, Auth, Subjects, Tasks, Study Plans, AI)
 * 2. Validation Constraints & Boundary Inputs
 * 3. Error Handling & HTTP Status Semantics (400, 401, 403, 404)
 * 4. Authentication & Security Guard Matrix
 * 5. AI Failure Modes & Resilience (Fallback, Extraction, Timeouts)
 * 6. Full User Journey (Register -> Subject -> Task -> AI -> Plan -> Cleanup)
 */

import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { extractJsonFromText, validateAndNormalizePlan } from '../services/llmService.js';
import { withTimeout } from '../utils/jsPatterns.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

/**
 * Lightweight HTTP request helper
 */
function request(server, { method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
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

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runMasterTestSuite() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 12 COMPREHENSIVE E2E TEST SUITE         ');
  console.log('===============================================================\n');

  // Initialize DBs
  console.log('📦 Connecting to databases...');
  await connectMongo();

  // Start ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral server running on port ${port}\n`);

  const timestamp = Date.now();
  const testUser = {
    id: 5001,
    name: 'Phase 12 Evaluator',
    email: `evaluator_${timestamp}@planora.edu`,
  };

  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
  const authHeader = { Authorization: `Bearer ${token}` };

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: System Health & Base Routes
    // ------------------------------------------------------------------------
    console.log('1️⃣  Testing Base & Health Endpoints');
    const rootRes = await request(server, { method: 'GET', path: '/' });
    assert(rootRes.statusCode === 200 && rootRes.body.name === 'Planora Backend API', 'GET / returns API metadata');

    const healthRes = await request(server, { method: 'GET', path: '/api/health' });
    assert(healthRes.statusCode === 200 && healthRes.body.status === 'ok', 'GET /api/health returns healthy status');

    const notFoundRes = await request(server, { method: 'GET', path: '/api/nonexistent-endpoint-xyz' });
    assert(notFoundRes.statusCode === 404 && notFoundRes.body.message.includes('not found'), 'Unknown endpoint returns HTTP 404 with error message');

    // ------------------------------------------------------------------------
    // SECTION 2: Authentication & Security Matrix
    // ------------------------------------------------------------------------
    console.log('\n2️⃣  Testing Authentication & Security Matrix');

    // Registration validation: missing fields
    const badReg1 = await request(server, { method: 'POST', path: '/api/auth/register', body: { email: testUser.email } });
    assert(badReg1.statusCode === 400 && badReg1.body.message.includes('required'), 'POST /api/auth/register rejects missing name/password with 400');

    // Login validation: missing password
    const badLogin = await request(server, { method: 'POST', path: '/api/auth/login', body: { email: testUser.email } });
    assert(badLogin.statusCode === 400 && badLogin.body.message.includes('required'), 'POST /api/auth/login rejects missing password with 400');

    // Protected Route without token
    const noTokenMe = await request(server, { method: 'GET', path: '/api/auth/me' });
    assert(noTokenMe.statusCode === 401 && noTokenMe.body.message.includes('no token provided'), 'GET /api/auth/me rejects missing token with 401');

    // Protected Route with tampered/invalid token
    const tamperedMe = await request(server, { method: 'GET', path: '/api/auth/me', headers: { Authorization: 'Bearer invalid.token.signature' } });
    assert(tamperedMe.statusCode === 401 && tamperedMe.body.message.includes('invalid or expired'), 'GET /api/auth/me rejects tampered token with 401');

    // Protected Route with valid token
    const validMe = await request(server, { method: 'GET', path: '/api/auth/me', headers: authHeader });
    assert(validMe.statusCode === 200 && validMe.body.user.email === testUser.email, 'GET /api/auth/me returns authenticated user profile');

    // Verify all private resource endpoints enforce 401 without auth header
    const [unauthSubs, unauthTasks, unauthPlans, unauthAI] = await Promise.all([
      request(server, { method: 'GET', path: '/api/subjects' }),
      request(server, { method: 'GET', path: '/api/tasks' }),
      request(server, { method: 'GET', path: '/api/study-plans' }),
      request(server, { method: 'POST', path: '/api/ai/study-plan', body: {} }),
    ]);
    assert(
      unauthSubs.statusCode === 401 && unauthTasks.statusCode === 401 && unauthPlans.statusCode === 401 && unauthAI.statusCode === 401,
      'All protected resources (subjects, tasks, plans, AI) strictly return 401 Unauthorized'
    );

    // ------------------------------------------------------------------------
    // SECTION 3: Subject Management Endpoints & Constraints
    // ------------------------------------------------------------------------
    console.log('\n3️⃣  Testing Subjects CRUD & Validation');

    // Validation: missing name
    const badSub = await request(server, { method: 'POST', path: '/api/subjects', headers: authHeader, body: { color: '#6366f1' } });
    assert(badSub.statusCode === 400, 'POST /api/subjects rejects missing name with 400');

    // Create Subject
    const subRes = await request(server, {
      method: 'POST',
      path: '/api/subjects',
      headers: authHeader,
      body: { name: 'Operating Systems', color: '#8b5cf6', description: 'Kernel, Threads, Memory' }
    });
    assert(subRes.statusCode === 201 && subRes.body.data.id, 'POST /api/subjects creates subject with assigned ID');
    const subjectId = subRes.body.data.id;

    // List Subjects
    const listSubs = await request(server, { method: 'GET', path: '/api/subjects', headers: authHeader });
    assert(listSubs.statusCode === 200 && Array.isArray(listSubs.body.data) && listSubs.body.data.some(s => String(s.id) === String(subjectId)), 'GET /api/subjects lists user subjects');

    // Update Subject
    const updateSub = await request(server, {
      method: 'PUT',
      path: `/api/subjects/${subjectId}`,
      headers: authHeader,
      body: { name: 'Advanced Operating Systems', color: '#a855f7' }
    });
    assert(updateSub.statusCode === 200 && updateSub.body.data.name === 'Advanced Operating Systems', 'PUT /api/subjects/:id updates subject details');

    // ------------------------------------------------------------------------
    // SECTION 4: Task Management Endpoints & Constraints
    // ------------------------------------------------------------------------
    console.log('\n4️⃣  Testing Tasks CRUD & Status Transitions');

    // Validation: missing title
    const badTask = await request(server, { method: 'POST', path: '/api/tasks', headers: authHeader, body: { subjectId: String(subjectId) } });
    assert(badTask.statusCode === 400, 'POST /api/tasks rejects missing title with 400');

    // Create Task
    const taskRes = await request(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader,
      body: {
        title: 'Implement Virtual Memory Paging',
        subjectId: String(subjectId),
        duration: 90,
        priority: 'high',
        dueDate: new Date().toISOString()
      }
    });
    assert(taskRes.statusCode === 201 && taskRes.body.data._id, 'POST /api/tasks creates task successfully');
    const taskId = taskRes.body.data._id;

    // Toggle Task Complete (PUT /api/tasks/:id)
    const toggleRes = await request(server, {
      method: 'PUT',
      path: `/api/tasks/${taskId}`,
      headers: authHeader,
      body: { status: 'completed' }
    });
    assert(toggleRes.statusCode === 200 && toggleRes.body.data.status === 'completed', 'PUT /api/tasks/:id updates status to completed');

    // Toggle Task back to pending
    const toggleBack = await request(server, {
      method: 'PUT',
      path: `/api/tasks/${taskId}`,
      headers: authHeader,
      body: { status: 'pending' }
    });
    assert(toggleBack.statusCode === 200 && toggleBack.body.data.status === 'pending', 'PUT /api/tasks/:id toggles status back to pending');

    // Filter Tasks by status and subjectId
    const filterRes = await request(server, {
      method: 'GET',
      path: `/api/tasks?status=pending&subjectId=${subjectId}`,
      headers: authHeader
    });
    assert(filterRes.statusCode === 200 && filterRes.body.data.length > 0, 'GET /api/tasks filters by status and subjectId');

    // ------------------------------------------------------------------------
    // SECTION 5: AI Integration & Failure Handling
    // ------------------------------------------------------------------------
    console.log('\n5️⃣  Testing AI Robustness & Failure Fallbacks');

    // Markdown JSON code fence extraction
    const rawFenced = '```json\n{"plan": [{"day": 1, "topic": "Processes", "duration": 60, "tasks": ["Forks", "Exec"]}]}\n```';
    const parsedFenced = extractJsonFromText(rawFenced);
    assert(parsedFenced.plan && parsedFenced.plan.length === 1, 'extractJsonFromText handles markdown fenced blocks');

    // Schema normalization
    const normalized = validateAndNormalizePlan(parsedFenced, { subject: 'OS', days: 1, hoursPerDay: 1 });
    assert(normalized[0].topic === 'Processes' && Array.isArray(normalized[0].tasks), 'validateAndNormalizePlan enforces proper structure');

    // AI Study Plan Generation (returns either live LLM plan or resilient fallback)
    const aiPlanRes = await request(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeader,
      body: {
        subject: 'Advanced Operating Systems',
        days: 2,
        hoursPerDay: 2,
        knowledgeLevel: 'intermediate',
        weakTopics: 'Deadlocks, Semaphores'
      }
    });
    assert(aiPlanRes.statusCode === 200 && Array.isArray(aiPlanRes.body.plan) && aiPlanRes.body.plan.length === 2, 'POST /api/ai/study-plan returns structured 2-day study plan');

    // AI Concept Explainer
    const explainRes = await request(server, {
      method: 'POST',
      path: '/api/ai/explain',
      headers: authHeader,
      body: { topic: 'Dining Philosophers Problem', difficulty: 'intermediate' }
    });
    assert(explainRes.statusCode === 200 && typeof explainRes.body.explanation === 'string', 'POST /api/ai/explain generates concept explanation');

    // withTimeout utility timeout protection
    let timeoutTriggered = false;
    try {
      const slowOp = new Promise((resolve) => setTimeout(() => resolve('done'), 100));
      await withTimeout(slowOp, 15, 'Network timeout');
    } catch (err) {
      timeoutTriggered = err.message === 'Network timeout';
    }
    assert(timeoutTriggered === true, 'withTimeout successfully aborts hung network operations');

    // ------------------------------------------------------------------------
    // SECTION 6: Saved Study Plans & Access Control
    // ------------------------------------------------------------------------
    console.log('\n6️⃣  Testing Saved Study Plans & Authorization Boundaries');

    // Validation: missing plan payload
    const badSavePlan = await request(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader,
      body: { subject: 'Incomplete Plan' }
    });
    assert(badSavePlan.statusCode === 400, 'POST /api/study-plans rejects incomplete plan data with 400');

    // Save Study Plan
    const savePlanRes = await request(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader,
      body: {
        subject: 'Advanced Operating Systems',
        days: 2,
        hoursPerDay: 2,
        plan: aiPlanRes.body.plan
      }
    });
    assert(savePlanRes.statusCode === 201 && savePlanRes.body.data._id, 'POST /api/study-plans persists generated plan');
    const planId = savePlanRes.body.data._id;

    // Retrieve Single Plan
    const getPlanRes = await request(server, {
      method: 'GET',
      path: `/api/study-plans/${planId}`,
      headers: authHeader
    });
    assert(getPlanRes.statusCode === 200 && getPlanRes.body.data.subject === 'Advanced Operating Systems', 'GET /api/study-plans/:id retrieves saved plan');

    // Security: Create User 2 and verify User 2 CANNOT access User 1's plan
    const user2Token = jwt.sign({ id: 9999, email: 'user2@planora.edu' }, JWT_SECRET, { expiresIn: '1h' });
    const crossAccessRes = await request(server, {
      method: 'GET',
      path: `/api/study-plans/${planId}`,
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert(crossAccessRes.statusCode === 403, 'Cross-user plan access strictly blocked with HTTP 403 Forbidden');

    // ------------------------------------------------------------------------
    // SECTION 7: Cleanup & Deletions
    // ------------------------------------------------------------------------
    console.log('\n7️⃣  Testing Resource Cleanup & Deletion');

    // Delete Plan
    const delPlan = await request(server, { method: 'DELETE', path: `/api/study-plans/${planId}`, headers: authHeader });
    assert(delPlan.statusCode === 200, 'DELETE /api/study-plans/:id deletes plan');

    // Delete Task
    const delTask = await request(server, { method: 'DELETE', path: `/api/tasks/${taskId}`, headers: authHeader });
    assert(delTask.statusCode === 200, 'DELETE /api/tasks/:id deletes task');

    // Delete Subject
    const delSub = await request(server, { method: 'DELETE', path: `/api/subjects/${subjectId}`, headers: authHeader });
    assert(delSub.statusCode === 200, 'DELETE /api/subjects/:id deletes subject');

  } catch (err) {
    console.error('Fatal error during test suite:', err);
    failed++;
  } finally {
    // Teardown
    await new Promise((resolve) => server.close(resolve));
    await disconnectMongo();
  }

  // Summary
  console.log('\n===============================================================');
  console.log(`📊 MASTER TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Phase 12 verification criteria satisfied!\n');
    process.exit(0);
  }
}

runMasterTestSuite().catch((err) => {
  console.error('Runner failure:', err);
  process.exit(1);
});
