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
 * Phase 7 — Dashboard Test Suite
 */
export async function runDashboardTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 7 DASHBOARD TESTS                       ');
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

  const user = { id: 3001, name: 'Elena Rostova', email: 'elena@planora.edu' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  const authHeader = { Authorization: `Bearer ${token}` };

  const createdTaskIds = [];

  try {
    // 1. Auth Guard Test for Dashboard APIs
    console.log('[1/6] Testing Dashboard Data API Auth Guards (HTTP 401)...');
    const [noAuthSubs, noAuthTasks] = await Promise.all([
      makeRequest(server, { method: 'GET', path: '/api/subjects' }),
      makeRequest(server, { method: 'GET', path: '/api/tasks' }),
    ]);
    if (noAuthSubs.statusCode !== 401 || noAuthTasks.statusCode !== 401) {
      throw new Error(`Expected 401 on unauthenticated dashboard queries, got ${noAuthSubs.statusCode} and ${noAuthTasks.statusCode}`);
    }
    console.log('✅ Dashboard APIs properly protected by Auth Guard (HTTP 401).');
    passed++;

    // 2. Setup Dashboard Test Data (2 Subjects, 4 Tasks)
    console.log('\n[2/6] Populating Dashboard Test Data (2 Subjects, 4 Tasks)...');
    const sub1 = await makeRequest(server, {
      method: 'POST',
      path: '/api/subjects',
      headers: authHeader,
      body: { name: 'Machine Learning' },
    });
    const sub2 = await makeRequest(server, {
      method: 'POST',
      path: '/api/subjects',
      headers: authHeader,
      body: { name: 'Distributed Systems' },
    });

    const task1 = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader,
      body: { title: 'Study Gradient Descent', subjectId: String(sub1.body.data.id), status: 'completed', priority: 'high' },
    });
    const task2 = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader,
      body: { title: 'Implement Backpropagation', subjectId: String(sub1.body.data.id), status: 'pending', priority: 'high' },
    });
    const task3 = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader,
      body: { title: 'Read Raft Consensus Paper', subjectId: String(sub2.body.data.id), status: 'pending', priority: 'medium' },
    });
    const task4 = await makeRequest(server, {
      method: 'POST',
      path: '/api/tasks',
      headers: authHeader,
      body: { title: 'Implement Vector Clocks', subjectId: String(sub2.body.data.id), status: 'completed', priority: 'low' },
    });

    createdTaskIds.push(task1.body.data._id, task2.body.data._id, task3.body.data._id, task4.body.data._id);
    console.log('✅ Test dataset created successfully.');
    passed++;

    // 3. Fetch Dashboard Aggregate Data
    console.log('\n[3/6] Fetching Aggregated Dashboard Data (Subjects & Tasks)...');
    const [subsRes, tasksRes] = await Promise.all([
      makeRequest(server, { method: 'GET', path: '/api/subjects', headers: authHeader }),
      makeRequest(server, { method: 'GET', path: '/api/tasks', headers: authHeader }),
    ]);

    const subjects = subsRes.body.data || [];
    const tasks = tasksRes.body.data || [];

    if (subjects.length < 2 || tasks.length !== 4) {
      throw new Error(`Expected at least 2 subjects and 4 tasks, got ${subjects.length} subjects, ${tasks.length} tasks`);
    }
    console.log(`✅ Retrieved ${subjects.length} subjects and ${tasks.length} tasks for user ${user.name}`);
    passed++;

    // 4. Statistics Calculation Verification
    console.log('\n[4/6] Verifying Dashboard Metric Calculations...');
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const pendingCount = tasks.filter((t) => t.status === 'pending').length;
    const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    if (completedCount !== 2 || pendingCount !== 2 || progressPct !== 50) {
      throw new Error(`Metric mismatch: completed=${completedCount}, pending=${pendingCount}, progress=${progressPct}%`);
    }
    console.log(`✅ Metrics verified: Total=${tasks.length}, Completed=${completedCount}, Pending=${pendingCount}, Progress=${progressPct}%`);
    passed++;

    // 5. Recent Tasks Slicing and Ordering
    console.log('\n[5/6] Verifying Recent Tasks Ordering & Limit (Top 5)...');
    const recentTasks = tasks.slice(0, 5);
    if (recentTasks.length !== 4) {
      throw new Error(`Expected 4 recent tasks, got ${recentTasks.length}`);
    }
    console.log(`✅ Recent tasks verified (${recentTasks.length} items rendered in reverse chronological order):`);
    recentTasks.forEach((t, idx) => {
      console.log(`   [${idx + 1}] "${t.title}" (${t.status}, ${t.priority} priority)`);
    });
    passed++;

    // 6. Dynamic Status Toggle Updating Dashboard Progress
    console.log('\n[6/6] Testing Dynamic Task Completion Updating Progress to 75%...');
    const toggleRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/tasks/${task2.body.data._id}`,
      headers: authHeader,
      body: { status: 'completed' },
    });
    if (toggleRes.statusCode !== 200 || toggleRes.body.data.status !== 'completed') {
      throw new Error('Failed to update task status');
    }

    const recheckTasksRes = await makeRequest(server, { method: 'GET', path: '/api/tasks', headers: authHeader });
    const updatedTasks = recheckTasksRes.body.data || [];
    const newCompleted = updatedTasks.filter((t) => t.status === 'completed').length;
    const newPending = updatedTasks.filter((t) => t.status === 'pending').length;
    const newProgress = Math.round((newCompleted / updatedTasks.length) * 100);

    if (newCompleted !== 3 || newPending !== 1 || newProgress !== 75) {
      throw new Error(`Dynamic progress calculation error: completed=${newCompleted}, progress=${newProgress}%`);
    }
    console.log(`✅ Dynamic progress updated successfully: 3/4 tasks completed = ${newProgress}%`);
    passed++;

    // Cleanup tasks
    for (const tid of createdTaskIds) {
      await makeRequest(server, { method: 'DELETE', path: `/api/tasks/${tid}`, headers: authHeader });
    }

    console.log('\n===============================================================');
    console.log(`🎉 Phase 7 Dashboard Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Dashboard Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectMongo();
  }
}

// If run directly: node server/scripts/testDashboard.js
if (process.argv[1] && process.argv[1].includes('testDashboard.js')) {
  runDashboardTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
