import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from '../server.js';
import { SubjectQueries } from '../models/subjectQueries.js';
import { UserQueries } from '../models/userQueries.js';
import { pool } from '../config/postgres.js';
import { initPostgres } from '../config/initPostgres.js';

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
 * Phase 5 — Subject Management Test Suite
 */
export async function runSubjectTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 5 SUBJECT MANAGEMENT TESTS              ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral test server listening on port ${port}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';

  // Create two distinct user tokens for cross-user isolation testing
  const user1 = { id: 1001, name: 'Alice Student', email: 'alice@planora.edu' };
  const user2 = { id: 1002, name: 'Bob Scholar', email: 'bob@planora.edu' };

  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '1h' });

  const authHeader1 = { Authorization: `Bearer ${token1}` };
  const authHeader2 = { Authorization: `Bearer ${token2}` };

  let createdSubjectId = null;

  try {
    // 1. Auth Guard Test
    console.log('[1/10] Testing GET /api/subjects without auth token (HTTP 401)...');
    const noAuthRes = await makeRequest(server, { method: 'GET', path: '/api/subjects' });
    if (noAuthRes.statusCode !== 401) {
      throw new Error(`Expected 401, got ${noAuthRes.statusCode}`);
    }
    console.log('✅ Unauthenticated request correctly rejected with 401 Unauthorized.');
    passed++;

    // 2. Create Subject Validation (Missing Name)
    console.log('\n[2/10] Testing POST /api/subjects with missing name (HTTP 400)...');
    const badCreateRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/subjects',
      headers: authHeader1,
      body: {},
    });
    if (badCreateRes.statusCode !== 400) {
      throw new Error(`Expected 400 for empty body, got ${badCreateRes.statusCode}`);
    }
    console.log(`✅ Validation error returned (HTTP 400): "${badCreateRes.body.message}"`);
    passed++;

    // 3. Create Subject Success
    console.log('\n[3/10] Testing POST /api/subjects creation (HTTP 201)...');
    const createRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/subjects',
      headers: authHeader1,
      body: { name: 'Operating Systems' },
    });
    if (createRes.statusCode !== 201 || !createRes.body.data || !createRes.body.data.id) {
      throw new Error(`Expected 201 with subject data, got ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`);
    }
    createdSubjectId = createRes.body.data.id;
    console.log(`✅ Subject created successfully: "${createRes.body.data.name}" (ID: ${createdSubjectId}, user_id: ${createRes.body.data.user_id})`);
    passed++;

    // 4. Get User's Subjects
    console.log('\n[4/10] Testing GET /api/subjects for User 1 (HTTP 200)...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/subjects',
      headers: authHeader1,
    });
    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body.data) || listRes.body.data.length === 0) {
      throw new Error(`Expected 200 with subjects array, got ${listRes.statusCode}`);
    }
    console.log(`✅ Retrieved ${listRes.body.data.length} subject(s) for User 1`);
    passed++;

    // 5. Get Single Subject by ID
    console.log(`\n[5/10] Testing GET /api/subjects/${createdSubjectId} (HTTP 200)...`);
    const singleRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/subjects/${createdSubjectId}`,
      headers: authHeader1,
    });
    if (singleRes.statusCode !== 200 || singleRes.body.data.id !== createdSubjectId) {
      throw new Error(`Expected 200 with subject ${createdSubjectId}, got ${singleRes.statusCode}`);
    }
    console.log(`✅ Single subject fetched: "${singleRes.body.data.name}"`);
    passed++;

    // 6. Update Subject Name
    console.log(`\n[6/10] Testing PUT /api/subjects/${createdSubjectId} (HTTP 200)...`);
    const updateRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/subjects/${createdSubjectId}`,
      headers: authHeader1,
      body: { name: 'Advanced Operating Systems' },
    });
    if (updateRes.statusCode !== 200 || updateRes.body.data.name !== 'Advanced Operating Systems') {
      throw new Error(`Expected updated name 'Advanced Operating Systems', got ${JSON.stringify(updateRes.body)}`);
    }
    console.log(`✅ Subject updated to: "${updateRes.body.data.name}"`);
    passed++;

    // 7. Cross-User Isolation (User 2 attempting to access User 1's subject)
    console.log(`\n[7/10] Testing Cross-User Isolation (User 2 accessing User 1's subject -> HTTP 403/404)...`);
    const crossAccessRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/subjects/${createdSubjectId}`,
      headers: authHeader2,
    });
    if (crossAccessRes.statusCode !== 403 && crossAccessRes.statusCode !== 404) {
      throw new Error(`Expected 403 or 404 for cross-user access, got ${crossAccessRes.statusCode}`);
    }
    console.log(`✅ Cross-user access blocked properly (HTTP ${crossAccessRes.statusCode}): "${crossAccessRes.body.message}"`);
    passed++;

    // 8. Relational SQL JOIN Query Endpoint
    console.log('\n[8/10] Testing GET /api/subjects/joined-details (Relational JOIN Query -> HTTP 200)...');
    const joinRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/subjects/joined-details',
      headers: authHeader1,
    });
    if (joinRes.statusCode !== 200 || !Array.isArray(joinRes.body.data)) {
      throw new Error(`Expected 200 with joined relational data, got ${joinRes.statusCode}`);
    }
    console.log(`✅ Relational JOIN endpoint verified. Returned ${joinRes.body.data.length} joined record(s):`);
    joinRes.body.data.forEach((row, i) => {
      console.log(`   - [${i + 1}] Subject: "${row.subject_name}" | Student: "${row.user_name}" (${row.user_email})`);
    });
    passed++;

    // 9. Delete Subject
    console.log(`\n[9/10] Testing DELETE /api/subjects/${createdSubjectId} (HTTP 200)...`);
    const deleteRes = await makeRequest(server, {
      method: 'DELETE',
      path: `/api/subjects/${createdSubjectId}`,
      headers: authHeader1,
    });
    if (deleteRes.statusCode !== 200) {
      throw new Error(`Expected 200 for deletion, got ${deleteRes.statusCode}`);
    }
    console.log(`✅ Subject ${createdSubjectId} deleted successfully.`);
    passed++;

    // 10. Verify Deletion
    console.log(`\n[10/10] Verifying GET /api/subjects/${createdSubjectId} returns 404...`);
    const verifyDeletedRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/subjects/${createdSubjectId}`,
      headers: authHeader1,
    });
    if (verifyDeletedRes.statusCode !== 404) {
      throw new Error(`Expected 404 for deleted subject, got ${verifyDeletedRes.statusCode}`);
    }
    console.log(`✅ Deletion confirmed: Subject ${createdSubjectId} no longer exists (HTTP 404).`);
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 5 Subject Management Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Subject Management Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
}

// If run directly: node server/scripts/testSubjects.js
if (process.argv[1] && process.argv[1].includes('testSubjects.js')) {
  runSubjectTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
