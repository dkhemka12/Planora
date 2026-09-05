import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectMongo, disconnectMongo } from '../config/mongo.js';

dotenv.config();

import app from '../server.js';
import { Task } from '../models/Task.js';

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
 * Phase 6 — Task Management Test Suite
 */
export async function runTaskTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 6 TASK MANAGEMENT TESTS                 ');
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

  const user1 = { id: 2001, name: 'Clara Student', email: 'clara@planora.edu' };
  const user2 = { id: 2002, name: 'David Scholar', email: 'david@planora.edu' };

  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '1h' });

  const authHeader1 = { Authorization: `Bearer ${token1}` };
  const authHeader2 = { Authorization: `Bearer ${token2}` };

  let createdTaskId = null;

  try {
    // 1. Auth Guard Test
    console.log('[1/11] Testing GET /api/tasks without auth token (HTTP 401)...');
    const noAuthRes = await makeRequest(server, { method: 'GET', path: '/api/tasks' });
    if (noAuthRes.statusCode !== 401) {
      throw new Error(`Expected 401, got ${noAuthRes.statusCode}`);
    }
    console.log('✅ Unauthenticated request correctly rejected with 401 Unauthorized.');
    passed++;

    // 2. Create Task Validation (Missing Title)
    console.log('\n[2/11] Testing POST /api/tasks with missing title (HTTP 400)...');
    const badCreateRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader1,
      body: { description: 'Only description provided' },
    });
    if (badCreateRes.statusCode !== 400) {
      throw new Error(`Expected 400 for missing title, got ${badCreateRes.statusCode}`);
    }
    console.log(`✅ Validation error returned (HTTP 400): "${badCreateRes.body.message}"`);
    passed++;

    // 3. Create Task Success
    console.log('\n[3/11] Testing POST /api/tasks creation (HTTP 201)...');
    const createRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader1,
      body: {
        title: 'Implement Binary Search Tree Balancing',
        description: 'Complete AVL rotations and unit tests',
        priority: 'high',
        status: 'pending',
        dueDate: new Date().toISOString(),
      },
    });
    if (createRes.statusCode !== 201 || !createRes.body.data || !createRes.body.data._id) {
      throw new Error(`Expected 201 with task data, got ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`);
    }
    createdTaskId = createRes.body.data._id;
    console.log(`✅ Task created successfully: "${createRes.body.data.title}" (ID: ${createdTaskId}, Priority: ${createRes.body.data.priority}, Status: ${createRes.body.data.status})`);
    passed++;

    // 4. Get User Tasks
    console.log('\n[4/11] Testing GET /api/tasks for User 1 (HTTP 200)...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/tasks',
      headers: authHeader1,
    });
    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body.data) || listRes.body.data.length === 0) {
      throw new Error(`Expected 200 with tasks array, got ${listRes.statusCode}`);
    }
    console.log(`✅ Retrieved ${listRes.body.data.length} task(s) for User 1`);
    passed++;

    // 5. Get Single Task by ID
    console.log(`\n[5/11] Testing GET /api/tasks/${createdTaskId} (HTTP 200)...`);
    const singleRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader1,
    });
    if (singleRes.statusCode !== 200 || singleRes.body.data._id !== createdTaskId) {
      throw new Error(`Expected 200 with task ${createdTaskId}, got ${singleRes.statusCode}`);
    }
    console.log(`✅ Single task fetched: "${singleRes.body.data.title}"`);
    passed++;

    // 6. Update Task Title & Priority
    console.log(`\n[6/11] Testing PUT /api/tasks/${createdTaskId} title & priority update (HTTP 200)...`);
    const updateRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader1,
      body: { title: 'Master AVL Trees and Red-Black Trees', priority: 'medium' },
    });
    if (updateRes.statusCode !== 200 || updateRes.body.data.priority !== 'medium') {
      throw new Error(`Expected updated priority 'medium', got ${JSON.stringify(updateRes.body)}`);
    }
    console.log(`✅ Task updated: Title "${updateRes.body.data.title}", Priority: "${updateRes.body.data.priority}"`);
    passed++;

    // 7. Toggle Task Status (pending -> completed)
    console.log(`\n[7/11] Testing Status Toggle to 'completed' (HTTP 200)...`);
    const statusRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader1,
      body: { status: 'completed' },
    });
    if (statusRes.statusCode !== 200 || statusRes.body.data.status !== 'completed') {
      throw new Error(`Expected status 'completed', got ${JSON.stringify(statusRes.body)}`);
    }
    console.log(`✅ Task status toggled to: "${statusRes.body.data.status}"`);
    passed++;

    // 8. Filter Tasks by Query Params (?status=completed)
    console.log('\n[8/11] Testing Filter Query GET /api/tasks?status=completed (HTTP 200)...');
    const filterRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/tasks?status=completed',
      headers: authHeader1,
    });
    if (filterRes.statusCode !== 200 || !Array.isArray(filterRes.body.data)) {
      throw new Error(`Expected filtered tasks array, got ${filterRes.statusCode}`);
    }
    const allCompleted = filterRes.body.data.every((t) => t.status === 'completed');
    if (!allCompleted) {
      throw new Error('Filter query returned tasks that are not completed');
    }
    console.log(`✅ Filtered query returned ${filterRes.body.data.length} completed task(s).`);
    passed++;

    // 9. Cross-User Isolation (User 2 attempting to access User 1's task)
    console.log(`\n[9/11] Testing Cross-User Isolation (User 2 accessing User 1's task -> HTTP 403)...`);
    const crossAccessRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader2,
    });
    if (crossAccessRes.statusCode !== 403) {
      throw new Error(`Expected 403 for cross-user task access, got ${crossAccessRes.statusCode}`);
    }
    console.log(`✅ Cross-user access blocked properly (HTTP ${crossAccessRes.statusCode}): "${crossAccessRes.body.message}"`);
    passed++;

    // 10. Delete Task
    console.log(`\n[10/11] Testing DELETE /api/tasks/${createdTaskId} (HTTP 200)...`);
    const deleteRes = await makeRequest(server, {
      method: 'DELETE',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader1,
    });
    if (deleteRes.statusCode !== 200) {
      throw new Error(`Expected 200 for deletion, got ${deleteRes.statusCode}`);
    }
    console.log(`✅ Task ${createdTaskId} deleted successfully.`);
    passed++;

    // 11. Verify Deletion
    console.log(`\n[11/11] Verifying GET /api/tasks/${createdTaskId} returns 404...`);
    const verifyDeletedRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/tasks/${createdTaskId}`,
      headers: authHeader1,
    });
    if (verifyDeletedRes.statusCode !== 404) {
      throw new Error(`Expected 404 for deleted task, got ${verifyDeletedRes.statusCode}`);
    }
    console.log(`✅ Deletion confirmed: Task ${createdTaskId} no longer exists in MongoDB (HTTP 404).`);
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 6 Task Management Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Task Management Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectMongo();
  }
}

// If run directly: node server/scripts/testTasks.js
if (process.argv[1] && process.argv[1].includes('testTasks.js')) {
  runTaskTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
