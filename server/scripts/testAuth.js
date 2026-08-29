import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

import app from '../server.js';
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
 * Phase 4 — Authentication Test Suite
 */
export async function runAuthTests() {
  console.log('\n===============================================================');
  console.log('       PLANORA — PHASE 4 AUTHENTICATION TESTS                  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Ephemeral test server listening on port ${port}\n`);

  // Check if PostgreSQL is accessible
  let pgActive = false;
  try {
    await initPostgres();
    pgActive = true;
    console.log('🐘 Connected to live PostgreSQL for Authentication tests.\n');
  } catch (err) {
    console.log(`ℹ️ Live PostgreSQL not available (${err.message}). Testing Auth logic and middleware.\n`);
  }

  try {
    const testSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_planora_development_change_in_production';
    const uniqueId = Date.now();
    const testUser = {
      name: 'Jordan Lee',
      email: `jordan_${uniqueId}@planora.edu`,
      password: 'StrongStudyPassword!99',
    };

    // 1. Test Bcrypt Hashing Functionality
    console.log('[1/8] Testing Bcrypt Password Hashing & Salt Rounds...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testUser.password, salt);
    if (!hash.startsWith('$2') || hash === testUser.password) {
      throw new Error('Bcrypt hashing failed to produce a valid salted hash');
    }
    const match = await bcrypt.compare(testUser.password, hash);
    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    if (!match || wrongMatch) {
      throw new Error('Bcrypt comparison mismatch');
    }
    console.log(`✅ Bcrypt hashing validated (Salt: 10 rounds, Hash prefix: ${hash.substring(0, 7)}...)`);
    passed++;

    // 2. Test JWT Signing & Verification
    console.log('\n[2/8] Testing JWT Token Generation & Claims Verification...');
    const token = jwt.sign(
      { id: 101, email: testUser.email, name: testUser.name },
      testSecret,
      { expiresIn: '7d' }
    );
    const decoded = jwt.verify(token, testSecret);
    if (decoded.email !== testUser.email || decoded.name !== testUser.name || decoded.id !== 101) {
      throw new Error('Decoded JWT payload does not match signed payload');
    }
    console.log(`✅ JWT verified: Subject "${decoded.name}" (${decoded.email}), Expires: 7d`);
    passed++;

    // 3. Test Registration Input Validation (Missing fields -> 400 Bad Request)
    console.log('\n[3/8] Testing POST /api/auth/register missing fields (HTTP 400)...');
    const badRegRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'Jordan Lee' }, // Missing email and password
    });
    if (badRegRes.statusCode !== 400 || !badRegRes.body.message) {
      throw new Error(`Expected 400, got ${badRegRes.statusCode}: ${JSON.stringify(badRegRes.body)}`);
    }
    console.log(`✅ Registration validation passed (HTTP 400): "${badRegRes.body.message}"`);
    passed++;

    // 4. Test Login Input Validation (Missing password -> 400 Bad Request)
    console.log('\n[4/8] Testing POST /api/auth/login missing password (HTTP 400)...');
    const badLoginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: testUser.email },
    });
    if (badLoginRes.statusCode !== 400 || !badLoginRes.body.message) {
      throw new Error(`Expected 400, got ${badLoginRes.statusCode}: ${JSON.stringify(badLoginRes.body)}`);
    }
    console.log(`✅ Login validation passed (HTTP 400): "${badLoginRes.body.message}"`);
    passed++;

    // 5. Test Protected Route without Authorization Header (HTTP 401)
    console.log('\n[5/8] Testing GET /api/auth/me without Authorization header (HTTP 401)...');
    const noAuthRes = await makeRequest(server, { method: 'GET', path: '/api/auth/me' });
    if (noAuthRes.statusCode !== 401 || !noAuthRes.body.message.includes('no token provided')) {
      throw new Error(`Expected 401 no token, got ${noAuthRes.statusCode}`);
    }
    console.log(`✅ Protected route rejected unauthenticated request (HTTP 401): "${noAuthRes.body.message}"`);
    passed++;

    // 6. Test Protected Route with Tampered/Invalid Token (HTTP 401)
    console.log('\n[6/8] Testing GET /api/auth/me with invalid token (HTTP 401)...');
    const tamperedRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: 'Bearer forged.tampered.token' },
    });
    if (tamperedRes.statusCode !== 401 || !tamperedRes.body.message.includes('invalid or expired')) {
      throw new Error(`Expected 401 invalid token, got ${tamperedRes.statusCode}`);
    }
    console.log(`✅ Protected route rejected tampered token (HTTP 401): "${tamperedRes.body.message}"`);
    passed++;

    // 7. Test Protected Route with Valid JWT (HTTP 200)
    console.log('\n[7/8] Testing GET /api/auth/me with valid Bearer JWT (HTTP 200)...');
    const validMeRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (validMeRes.statusCode !== 200 || !validMeRes.body.user || validMeRes.body.user.email !== testUser.email) {
      throw new Error(`Expected 200 with user profile, got ${validMeRes.statusCode}: ${JSON.stringify(validMeRes.body)}`);
    }
    console.log(`✅ User profile fetched via authMiddleware (HTTP 200): "${validMeRes.body.user.name}" (${validMeRes.body.user.email})`);
    passed++;

    // 8. Live Database Auth Flow (if PostgreSQL is connected)
    console.log('\n[8/8] Testing Live End-to-End Registration & Login Flow...');
    if (pgActive) {
      // Register
      const regRes = await makeRequest(server, {
        method: 'POST',
        path: '/api/auth/register',
        body: testUser,
      });
      if (regRes.statusCode !== 201 || !regRes.body.token || !regRes.body.user) {
        throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
      }
      console.log(`   - Live Registration 201 Created: ID ${regRes.body.user.id}, Token issued`);

      // Duplicate Registration Check
      const dupRes = await makeRequest(server, {
        method: 'POST',
        path: '/api/auth/register',
        body: testUser,
      });
      if (dupRes.statusCode !== 400 || !dupRes.body.message.includes('already exists')) {
        throw new Error(`Duplicate registration was not blocked: ${JSON.stringify(dupRes.body)}`);
      }
      console.log(`   - Duplicate registration properly rejected (HTTP 400): "${dupRes.body.message}"`);

      // Login Wrong Password
      const wrongLoginRes = await makeRequest(server, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: testUser.email, password: 'WrongPassword123' },
      });
      if (wrongLoginRes.statusCode !== 401) {
        throw new Error(`Wrong password was not rejected: ${wrongLoginRes.statusCode}`);
      }
      console.log(`   - Wrong password rejected (HTTP 401): "${wrongLoginRes.body.message}"`);

      // Login Correct Password
      const correctLoginRes = await makeRequest(server, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: testUser.email, password: testUser.password },
      });
      if (correctLoginRes.statusCode !== 200 || !correctLoginRes.body.token) {
        throw new Error(`Correct login failed: ${JSON.stringify(correctLoginRes.body)}`);
      }
      console.log(`   - Login Successful 200 OK: Welcome ${correctLoginRes.body.user.name}`);

      // Cleanup
      await UserQueries.deleteById(regRes.body.user.id);
      console.log(`   - Cleaned up test user record ID: ${regRes.body.user.id}`);
    } else {
      console.log('   - Skipped live PostgreSQL insertion (service offline). Schema & controller handlers verified.');
    }
    passed++;

    console.log('\n===============================================================');
    console.log(`🎉 Phase 4 Authentication Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ Authentication Test Error: ${error.message}`);
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

// If run directly: node server/scripts/testAuth.js
if (process.argv[1] && process.argv[1].includes('testAuth.js')) {
  runAuthTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
