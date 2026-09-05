/**
 * Test Suite: JavaScript Core Concepts Demonstrations (Phase 11)
 * 
 * Verifies all 6 core JavaScript concepts:
 * 1. async / await
 * 2. Promises (race, all, timeout)
 * 3. Callbacks (error-first convention, promisify, callbackify)
 * 4. Closures (encapsulated state, memoization, rate limiting)
 * 5. Event Loop (synchronous -> microtask -> macrotask deterministic order)
 * 6. Hoisting (function declaration hoisting vs Temporal Dead Zone)
 */

import {
  createMemoizer,
  createRateLimiter,
  withTimeout,
  retryWithBackoff,
  callbackify,
  promisify,
  traceEventLoopPhases,
  demonstrateHoisting,
} from '../utils/jsPatterns.js';

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

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 PLANORA PHASE 11: JAVASCRIPT CONCEPTS');
  console.log('========================================\n');

  // ----------------------------------------------------
  // 1. Closures & Private State
  // ----------------------------------------------------
  console.log('1️⃣  Testing Closures (State Encapsulation)');
  let callCount = 0;
  const expensiveComputation = (a, b) => {
    callCount++;
    return a * b + 10;
  };

  const memoizedCalc = createMemoizer(expensiveComputation);

  const res1 = memoizedCalc(3, 4); // 22 (miss)
  assert(res1 === 22 && callCount === 1, 'First invocation executes underlying function');

  const res2 = memoizedCalc(3, 4); // 22 (hit from closure cache)
  assert(res2 === 22 && callCount === 1, 'Second identical invocation returns cached value without executing function');

  const stats = memoizedCalc.getStats();
  assert(stats.hits === 1 && stats.misses === 1 && stats.cacheSize === 1, 'Closure maintains private hits, misses, and cache statistics');

  // Test Rate Limiter closure
  const limiter = createRateLimiter(2, 1000); // 2 requests per 1s
  const req1 = limiter('user-1');
  const req2 = limiter('user-1');
  const req3 = limiter('user-1');
  assert(req1.allowed === true && req1.remaining === 1, 'Rate limiter closure allows first request');
  assert(req2.allowed === true && req2.remaining === 0, 'Rate limiter closure allows second request');
  assert(req3.allowed === false && req3.retryAfterMs > 0, 'Rate limiter closure blocks third request exceeding quota');

  // ----------------------------------------------------
  // 2. Promises & Promise Combinators
  // ----------------------------------------------------
  console.log('\n2️⃣  Testing Promises (Promise.race & withTimeout)');
  // Fast promise passes timeout
  const fastPromise = new Promise(resolve => setTimeout(() => resolve('fast-ok'), 50));
  const fastRes = await withTimeout(fastPromise, 300);
  assert(fastRes === 'fast-ok', 'withTimeout resolves when primary promise completes before deadline');

  // Slow promise gets rejected by Promise.race timeout
  const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow-ok'), 300));
  let timeoutCaught = false;
  try {
    await withTimeout(slowPromise, 50, 'Custom timeout error');
  } catch (err) {
    timeoutCaught = true;
    assert(err.message === 'Custom timeout error', 'withTimeout rejects with custom message via Promise.race');
  }
  assert(timeoutCaught === true, 'Slow promise correctly rejected by timeout');

  // Parallel Promise.all
  const [p1, p2, p3] = await Promise.all([
    Promise.resolve(10),
    Promise.resolve(20),
    Promise.resolve(30),
  ]);
  assert(p1 + p2 + p3 === 60, 'Promise.all coordinates concurrent promises and collects all results');

  // ----------------------------------------------------
  // 3. async / await Control Flow
  // ----------------------------------------------------
  console.log('\n3️⃣  Testing async / await (Sequential Retry Flow)');
  let failAttempts = 0;
  const flakyAsyncAction = async () => {
    failAttempts++;
    if (failAttempts < 3) {
      throw new Error(`Transient failure #${failAttempts}`);
    }
    return 'recovered-data';
  };

  const retryRes = await retryWithBackoff(flakyAsyncAction, 4, 20);
  assert(retryRes === 'recovered-data' && failAttempts === 3, 'retryWithBackoff successfully recovers across sequential async retries');

  // ----------------------------------------------------
  // 4. Callbacks (Error-First & Promisification)
  // ----------------------------------------------------
  console.log('\n4️⃣  Testing Callbacks (Error-First Convention & Adapters)');
  // Traditional callback function
  const legacyAsyncFetch = (id, callback) => {
    setTimeout(() => {
      if (id <= 0) {
        callback(new Error('Invalid ID'));
      } else {
        callback(null, { id, title: `Subject #${id}` });
      }
    }, 20);
  };

  const promisifiedFetch = promisify(legacyAsyncFetch);
  const fetchedData = await promisifiedFetch(42);
  assert(fetchedData.id === 42 && fetchedData.title === 'Subject #42', 'promisify converts error-first callback to Promise');

  let callbackErrorCaught = false;
  try {
    await promisifiedFetch(-1);
  } catch (err) {
    callbackErrorCaught = true;
    assert(err.message === 'Invalid ID', 'promisify propagates error from callback');
  }
  assert(callbackErrorCaught === true, 'Callback error correctly translated to Promise rejection');

  // Test callbackify
  const modernPromiseFn = async (x, y) => x + y;
  const callbackVersion = callbackify(modernPromiseFn);
  await new Promise(resolve => {
    callbackVersion(15, 25, (err, sum) => {
      assert(err === null && sum === 40, 'callbackify converts Promise function into Node error-first callback');
      resolve();
    });
  });

  // ----------------------------------------------------
  // 5. Event Loop & Microtask / Macrotask Order
  // ----------------------------------------------------
  console.log('\n5️⃣  Testing Event Loop (Phases & Scheduling Priority)');
  const phases = await traceEventLoopPhases();

  assert(phases[0] === '1. sync:start', 'Step 1: Synchronous call stack executes first');
  assert(phases[1] === '2. sync:end', 'Step 2: Synchronous execution completes before queues are drained');
  assert(phases[2] === '3. microtask:promise', 'Step 3: Microtask queue (Promise.then) executes immediately after call stack empties');
  assert(phases[phases.length - 1] === '4. macrotask:setTimeout', 'Step 4: Macrotask queue (setTimeout) executes after microtasks are drained');

  // ----------------------------------------------------
  // 6. Hoisting
  // ----------------------------------------------------
  console.log('\n6️⃣  Testing Hoisting (Function Declarations vs. TDZ)');
  const hoistingResult = demonstrateHoisting();
  assert(hoistingResult.success === true, 'Function declaration invoked before its definition via hoisting');
  assert(hoistingResult.message.includes('[HOISTED_DECLARATION]'), 'Hoisted function body executes properly');

  // Verify TDZ: accessing let/const before definition throws ReferenceError
  let tdzThrew = false;
  try {
    // Evaluating string to test TDZ without breaking module parser
    eval('console.log(tdzVariable); let tdzVariable = "blocked";');
  } catch (err) {
    tdzThrew = err instanceof ReferenceError;
  }
  assert(tdzThrew === true, 'Temporal Dead Zone (TDZ) throws ReferenceError when accessing let before declaration');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All JavaScript core concepts verified successfully!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
