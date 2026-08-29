import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from '../server.js';

/**
 * Lightweight HTTP test helper using native Node.js http module
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
 * Phase 3 — Backend Foundation Test Suite
 */
export async function runFoundationTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 3 BACKEND FOUNDATION TESTS             ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral test server listening on port ${port}\n`);

  try {
    // 1. Health Check Test
    console.log('[1/7] Testing GET /api/health (Status 200)...');
    const healthRes = await makeRequest(server, { method: 'GET', path: '/api/health' });
    if (healthRes.statusCode !== 200 || healthRes.body.status !== 'ok') {
      throw new Error(`Expected 200 status 'ok', got ${healthRes.statusCode}: ${JSON.stringify(healthRes.body)}`);
    }
    console.log(`✅ Health check passed (HTTP ${healthRes.statusCode}): "${healthRes.body.message}"`);
    passed++;

    // 2. Root Endpoint Test
    console.log('\n[2/7] Testing GET / (Root information)...');
    const rootRes = await makeRequest(server, { method: 'GET', path: '/' });
    if (rootRes.statusCode !== 200 || !rootRes.body.endpoints) {
      throw new Error(`Expected 200 with endpoints, got ${rootRes.statusCode}`);
    }
    console.log(`✅ Root route verified (HTTP ${rootRes.statusCode}, name: "${rootRes.body.name}")`);
    passed++;

    // 3. Centralized 404 Not Found Middleware
    console.log('\n[3/7] Testing 404 Not Found Handler for undefined route...');
    const notFoundRes = await makeRequest(server, { method: 'GET', path: '/api/non-existent-route-123' });
    if (notFoundRes.statusCode !== 404 || !notFoundRes.body.message) {
      throw new Error(`Expected 404 with error message, got ${notFoundRes.statusCode}`);
    }
    console.log(`✅ 404 error handler verified (HTTP ${notFoundRes.statusCode}): "${notFoundRes.body.message}"`);
    passed++;

    // 4. Auth Middleware - No Token Provided (401 Unauthorized)
    console.log('\n[4/7] Testing Protected Route without Token (GET /api/subjects)...');
    const noAuthRes = await makeRequest(server, { method: 'GET', path: '/api/subjects' });
    if (noAuthRes.statusCode !== 401 || !noAuthRes.body.message.includes('no token provided')) {
      throw new Error(`Expected 401 no token, got ${noAuthRes.statusCode}: ${JSON.stringify(noAuthRes.body)}`);
    }
    console.log(`✅ Auth guard passed (HTTP ${noAuthRes.statusCode}): "${noAuthRes.body.message}"`);
    passed++;

    // 5. Auth Middleware - Invalid Token (401 Unauthorized)
    console.log('\n[5/7] Testing Protected Route with Invalid Token (GET /api/tasks)...');
    const invalidAuthRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/tasks',
      headers: { Authorization: 'Bearer invalid.token.payload.here' },
    });
    if (invalidAuthRes.statusCode !== 401 || !invalidAuthRes.body.message.includes('invalid or expired')) {
      throw new Error(`Expected 401 invalid token, got ${invalidAuthRes.statusCode}: ${JSON.stringify(invalidAuthRes.body)}`);
    }
    console.log(`✅ Invalid token rejected properly (HTTP ${invalidAuthRes.statusCode}): "${invalidAuthRes.body.message}"`);
    passed++;

    // 6. Request Body Validation Middleware (400 Bad Request)
    console.log('\n[6/7] Testing Request Body Validation (POST /api/auth/register with empty body)...');
    const badReqRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {},
    });
    if (badReqRes.statusCode !== 400 || !badReqRes.body.message.includes('Missing or empty required field')) {
      throw new Error(`Expected 400 with missing fields, got ${badReqRes.statusCode}: ${JSON.stringify(badReqRes.body)}`);
    }
    console.log(`✅ Validation middleware verified (HTTP ${badReqRes.statusCode}): "${badReqRes.body.message}"`);
    passed++;

    // 7. Route Structure & Protected Route Execution with Valid Token
    console.log('\n[7/7] Testing Protected Route with Valid Token (POST /api/ai/study-plan)...');
    const testSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';
    const validToken = jwt.sign({ id: 99999, email: 'test@planora.dev', name: 'Test Student' }, testSecret, { expiresIn: '1h' });

    const authHeaders = { Authorization: `Bearer ${validToken}` };

    // Request AI study-plan endpoint validation (missing fields -> 400)
    const aiValRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeaders,
      body: { subject: 'Physics' }, // Missing days & hoursPerDay
    });
    if (aiValRes.statusCode !== 400) {
      throw new Error(`Expected 400 for incomplete AI plan payload, got ${aiValRes.statusCode}`);
    }

    // Request valid AI study plan -> 200
    const aiSuccessRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/ai/study-plan',
      headers: authHeaders,
      body: { subject: 'Physics', days: 3, hoursPerDay: 2 },
    });
    if (aiSuccessRes.statusCode !== 200 || !Array.isArray(aiSuccessRes.body.plan) || aiSuccessRes.body.plan.length !== 3) {
      throw new Error(`Expected 200 with 3-day plan, got ${aiSuccessRes.statusCode}`);
    }
    console.log(`✅ Protected route and controller execution verified (HTTP ${aiSuccessRes.statusCode}, generated ${aiSuccessRes.body.plan.length}-day plan)`);
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 3 Backend Foundation Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Foundation Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// If run directly: node server/scripts/testBackendFoundation.js
if (process.argv[1] && process.argv[1].includes('testBackendFoundation.js')) {
  runFoundationTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
