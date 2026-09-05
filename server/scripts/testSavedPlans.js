import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from '../server.js';
import { StudyPlan } from '../models/StudyPlan.js';
import { connectMongo, disconnectMongo } from '../config/mongo.js';

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
 * Phase 10 — Saved Plans Test Suite
 */
export async function runSavedPlanTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 10 SAVED PLANS TESTS                    ');
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

  const user1 = { id: 3001, name: 'Elena Gilbert', email: 'elena@planora.edu' };
  const user2 = { id: 3002, name: 'Stefan Salvatore', email: 'stefan@planora.edu' };

  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '1h' });

  const authHeader1 = { Authorization: `Bearer ${token1}` };
  const authHeader2 = { Authorization: `Bearer ${token2}` };

  let createdPlanId1 = null;
  let createdPlanId2 = null;

  try {
    // 1. Auth Guard Test
    console.log('[1/12] Testing Auth Guard: GET /api/study-plans without token...');
    const unauthRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/study-plans',
    });
    if (unauthRes.statusCode !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.statusCode}`);
    }
    console.log('✅ Auth guard confirmed: Returns 401 Unauthorized.');
    passed++;

    // 2. Input Validation (Missing subject)
    console.log('\n[2/12] Testing Validation: POST /api/study-plans with missing subject...');
    const invalidRes1 = await makeRequest(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader1,
      body: {
        days: 3,
        plan: [{ day: 1, topic: 'Intro', duration: 60, tasks: ['Read'] }],
      },
    });
    if (invalidRes1.statusCode !== 400) {
      throw new Error(`Expected 400 for missing subject, got ${invalidRes1.statusCode}`);
    }
    console.log('✅ Validation verified: Returns 400 Bad Request for missing subject.');
    passed++;

    // 3. Input Validation (Empty plan array)
    console.log('\n[3/12] Testing Validation: POST /api/study-plans with empty plan array...');
    const invalidRes2 = await makeRequest(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader1,
      body: {
        subject: 'Linear Algebra',
        days: 3,
        plan: [],
      },
    });
    if (invalidRes2.statusCode !== 400) {
      throw new Error(`Expected 400 for empty plan, got ${invalidRes2.statusCode}`);
    }
    console.log('✅ Validation verified: Returns 400 Bad Request for empty plan array.');
    passed++;

    // 4. Create First Study Plan
    console.log('\n[4/12] Testing Plan Creation: POST /api/study-plans for User 1...');
    const samplePlanData1 = {
      subject: 'Data Structures & Algorithms',
      days: 3,
      plan: [
        {
          day: 1,
          topic: 'Arrays and Two Pointers',
          duration: 90,
          tasks: ['Review dynamic arrays', 'Solve Two Sum', 'Solve Container With Most Water'],
        },
        {
          day: 2,
          topic: 'Linked Lists & Fast/Slow Pointers',
          duration: 90,
          tasks: ['Implement singly linked list', 'Detect cycle using Floyd algorithm', 'Reverse linked list'],
        },
        {
          day: 3,
          topic: 'Binary Trees & Traversals',
          duration: 120,
          tasks: ['Inorder, Preorder, Postorder traversals', 'Maximum Depth of Binary Tree', 'Level order BFS'],
        },
      ],
    };

    const createRes1 = await makeRequest(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader1,
      body: samplePlanData1,
    });

    if (createRes1.statusCode !== 201 || !createRes1.body.data?._id) {
      throw new Error(`Expected 201 Created with valid plan ID, got ${createRes1.statusCode}: ${JSON.stringify(createRes1.body)}`);
    }
    createdPlanId1 = createRes1.body.data._id;
    console.log(`✅ Plan created successfully with ID: ${createdPlanId1}`);
    console.log(`   Subject: ${createRes1.body.data.subject}, Days: ${createRes1.body.data.days}`);
    passed++;

    // 5. Create Second Study Plan for User 1
    console.log('\n[5/12] Testing Second Plan Creation: POST /api/study-plans (Organic Chemistry)...');
    const samplePlanData2 = {
      subject: 'Organic Chemistry',
      days: 2,
      plan: [
        {
          day: 1,
          topic: 'Reaction Mechanisms & SN1/SN2',
          duration: 60,
          tasks: ['Carbocation stability review', 'Compare nucleophiles vs bases'],
        },
        {
          day: 2,
          topic: 'Stereochemistry & Chirality',
          duration: 75,
          tasks: ['R/S configuration determination', 'Fischer projections practice'],
        },
      ],
    };

    const createRes2 = await makeRequest(server, {
      method: 'POST',
      path: '/api/study-plans',
      headers: authHeader1,
      body: samplePlanData2,
    });

    if (createRes2.statusCode !== 201) {
      throw new Error(`Expected 201 for second plan, got ${createRes2.statusCode}`);
    }
    createdPlanId2 = createRes2.body.data._id;
    console.log(`✅ Second plan created with ID: ${createdPlanId2}`);
    passed++;

    // 6. List Study Plans for User 1
    console.log('\n[6/12] Testing GET /api/study-plans for User 1 (should return 2 plans)...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/study-plans',
      headers: authHeader1,
    });

    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body.data)) {
      throw new Error(`Expected 200 with plan array, got ${listRes.statusCode}`);
    }
    if (listRes.body.data.length < 2) {
      throw new Error(`Expected at least 2 plans, got ${listRes.body.data.length}`);
    }
    console.log(`✅ Retrieved ${listRes.body.data.length} saved plans for User 1.`);
    passed++;

    // 7. Get Single Study Plan by ID
    console.log(`\n[7/12] Testing GET /api/study-plans/${createdPlanId1}...`);
    const getSingleRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/study-plans/${createdPlanId1}`,
      headers: authHeader1,
    });

    if (getSingleRes.statusCode !== 200 || getSingleRes.body.data?._id !== createdPlanId1) {
      throw new Error(`Expected 200 with matching ID, got ${getSingleRes.statusCode}`);
    }
    console.log(`✅ Single study plan retrieved: "${getSingleRes.body.data.subject}" with ${getSingleRes.body.data.plan.length} days.`);
    passed++;

    // 8. Cross-User Isolation: User 2 cannot access User 1's plan
    console.log(`\n[8/12] Testing Security: User 2 trying to GET User 1's plan...`);
    const crossUserGetRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/study-plans/${createdPlanId1}`,
      headers: authHeader2,
    });

    if (crossUserGetRes.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user plan access, got ${crossUserGetRes.statusCode}`);
    }
    console.log('✅ Access control verified: User 2 receives 403 Forbidden.');
    passed++;

    // 9. Cross-User Isolation: User 2 cannot delete User 1's plan
    console.log(`\n[9/12] Testing Security: User 2 trying to DELETE User 1's plan...`);
    const crossUserDelRes = await makeRequest(server, {
      method: 'DELETE',
      path: `/api/study-plans/${createdPlanId1}`,
      headers: authHeader2,
    });

    if (crossUserDelRes.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user plan deletion, got ${crossUserDelRes.statusCode}`);
    }
    console.log('✅ Deletion security verified: User 2 receives 403 Forbidden.');
    passed++;

    // 10. Invalid ObjectId Handling
    console.log('\n[10/12] Testing GET /api/study-plans/invalid-object-id (Malformed ID)...');
    const invalidIdRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/study-plans/invalid-object-id',
      headers: authHeader1,
    });

    if (invalidIdRes.statusCode !== 404) {
      throw new Error(`Expected 404 for invalid ObjectId, got ${invalidIdRes.statusCode}`);
    }
    console.log('✅ Malformed ObjectId handled gracefully: Returns 404 Not Found.');
    passed++;

    // 11. Delete Study Plan (User 1 deletes createdPlanId1)
    console.log(`\n[11/12] Testing DELETE /api/study-plans/${createdPlanId1} by owner...`);
    const deleteRes = await makeRequest(server, {
      method: 'DELETE',
      path: `/api/study-plans/${createdPlanId1}`,
      headers: authHeader1,
    });

    if (deleteRes.statusCode !== 200) {
      throw new Error(`Expected 200 for successful deletion, got ${deleteRes.statusCode}`);
    }
    console.log('✅ Study plan deleted successfully.');
    passed++;

    // 12. Verify Deletion (Subsequent GET should return 404)
    console.log(`\n[12/12] Verifying GET /api/study-plans/${createdPlanId1} returns 404...`);
    const verifyDelRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/study-plans/${createdPlanId1}`,
      headers: authHeader1,
    });

    if (verifyDelRes.statusCode !== 404) {
      throw new Error(`Expected 404 for deleted plan, got ${verifyDelRes.statusCode}`);
    }
    console.log('✅ Confirmed deletion: Plan no longer exists in database (HTTP 404).');
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 10 Saved Plans Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Saved Plans Test Error: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    // Cleanup remaining test plan
    if (createdPlanId2) {
      try {
        await StudyPlan.findByIdAndDelete(createdPlanId2);
      } catch {}
    }
    await new Promise((resolve) => server.close(resolve));
    await disconnectMongo();
  }
}

// If run directly: node server/scripts/testSavedPlans.js
if (process.argv[1] && process.argv[1].includes('testSavedPlans.js')) {
  runSavedPlanTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
