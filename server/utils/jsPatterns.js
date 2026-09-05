/**
 * JavaScript Core Patterns & Educational Demonstrations
 * 
 * This module demonstrates 6 core JavaScript concepts in a clean, production-grade utility:
 * 1. Closures (Lexical scoping & private state encapsulation)
 * 2. Promises (Promise.race, Promise.all, error handling)
 * 3. async / await (Syntactic sugar over Promises for readable async workflows)
 * 4. Callbacks (Error-first callbacks & middleware composition)
 * 5. Event Loop (Call Stack, Microtask queue vs. Macrotask queue)
 * 6. Hoisting (Function declaration hoisting vs. Temporal Dead Zone)
 */

// ============================================================================
// 1. CLOSURES: Private State Encapsulation & Lexical Scoping
// ============================================================================

/**
 * Creates a memoized version of any deterministic function.
 * Demonstrates closure: the returned function maintains a permanent reference
 * to the enclosed `cache` Map across calls without polluting global scope.
 *
 * @param {Function} fn - Deterministic function to memoize
 * @returns {Function} Memoized function
 */
export function createMemoizer(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function to memoize');
  }

  // Private enclosed state — inaccessible from the outside
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      hits++;
      return cache.get(key);
    }

    misses++;
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };

  // Expose closure stats inspector
  memoized.getStats = () => ({ hits, misses, cacheSize: cache.size });
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Sliding window rate limiter built purely with closures.
 * Encloses user request history inside a private closure per identifier.
 *
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {Function} Function (id) => { allowed: boolean, remaining: number }
 */
export function createRateLimiter(maxRequests = 10, windowMs = 60000) {
  // Private enclosed state
  const requests = new Map();

  return function checkLimit(clientId) {
    const now = Date.now();
    const timestamps = requests.get(clientId) || [];

    // Filter out expired timestamps (outside window)
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: windowMs - (now - validTimestamps[0])
      };
    }

    validTimestamps.push(now);
    requests.set(clientId, validTimestamps);

    return {
      allowed: true,
      remaining: maxRequests - validTimestamps.length,
      retryAfterMs: 0
    };
  };
}

// ============================================================================
// 2. PROMISES: Combinators, Async Race, and Fallbacks
// ============================================================================

/**
 * Wraps any Promise with a timeout deadline using `Promise.race`.
 * If the promise does not settle within `ms`, it rejects with a timeout error.
 *
 * @param {Promise} promise - The promise to execute
 * @param {number} ms - Timeout in milliseconds
 * @param {string} customMessage - Optional error message
 * @returns {Promise}
 */
export function withTimeout(promise, ms, customMessage) {
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const msg = customMessage || `Operation timed out after ${ms}ms`;
      reject(new Error(msg));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

// ============================================================================
// 3. ASYNC / AWAIT: Sequential & Parallel Execution Utilities
// ============================================================================

/**
 * Executes an async task with automatic retry and exponential backoff.
 * Illustrates async/await for sequential delay and control flow.
 *
 * @param {Function} asyncFn - Async function returning a Promise
 * @param {number} retries - Number of retries
 * @param {number} baseDelayMs - Initial delay in ms
 * @returns {Promise<*>}
 */
export async function retryWithBackoff(asyncFn, retries = 3, baseDelayMs = 100) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await asyncFn(attempt);
    } catch (err) {
      attempt++;
      if (attempt >= retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// 4. CALLBACKS: Error-First Convention & Promisification
// ============================================================================

/**
 * Converts a standard Promise-returning async function into an error-first callback:
 * (err, result) => void
 *
 * @param {Function} asyncFn - Function returning a promise
 * @returns {Function} Function taking arguments and a trailing callback
 */
export function callbackify(asyncFn) {
  return function (...args) {
    const callback = args[args.length - 1];
    if (typeof callback !== 'function') {
      throw new TypeError('Last argument must be a callback function');
    }

    const fnArgs = args.slice(0, -1);
    asyncFn(...fnArgs)
      .then(result => callback(null, result))
      .catch(err => callback(err));
  };
}

/**
 * Converts an error-first callback function to a Promise.
 *
 * @param {Function} fnWithCallback - Function expecting (..., callback)
 * @returns {Function} Function returning a Promise
 */
export function promisify(fnWithCallback) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fnWithCallback(...args, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };
}

// ============================================================================
// 5. EVENT LOOP: Microtasks vs. Macrotasks Scheduling
// ============================================================================

/**
 * Demonstrates the Node.js / V8 Event Loop phases:
 * 1. Synchronous Call Stack
 * 2. Microtask Queue (queueMicrotask, Promise.resolve().then)
 * 3. Macrotask / Timers Queue (setTimeout, setImmediate)
 *
 * Resolves with the chronological order of execution events.
 *
 * @returns {Promise<string[]>} Array of logged phases
 */
export function traceEventLoopPhases() {
  return new Promise(resolve => {
    const sequence = [];

    sequence.push('1. sync:start');

    // Macrotask (Timers phase)
    setTimeout(() => {
      sequence.push('4. macrotask:setTimeout');
      // Resolve when macrotask completes
      resolve(sequence);
    }, 0);

    // Microtask (Promise job queue)
    Promise.resolve().then(() => {
      sequence.push('3. microtask:promise');
    });

    // Another microtask via queueMicrotask
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        sequence.push('3b. microtask:queueMicrotask');
      });
    }

    sequence.push('2. sync:end');
  });
}

// ============================================================================
// 6. HOISTING: Function Declarations vs. Variable / Expression Hoisting
// ============================================================================

/**
 * Demonstrates function declaration hoisting.
 * Notice that `demonstrateHoisting` calls `hoistedHelperFunction()` BEFORE
 * its lexical definition below. In JavaScript, function declarations are hoisted
 * completely (name AND body) to the top of their enclosing scope.
 *
 * In contrast, variables declared with `const` or `let` are placed in the
 * Temporal Dead Zone (TDZ) and cannot be accessed before declaration.
 */
export function demonstrateHoisting() {
  // Calling hoisted declaration before its line of definition:
  const result = hoistedHelperFunction('Planora Hoisting Demo');

  return {
    success: true,
    message: result,
    explanation: 'Function declaration hoisted successfully to the top of the scope.'
  };
}

// Here is the hoisted function declaration defined AFTER demonstrateHoisting:
function hoistedHelperFunction(name) {
  return `[HOISTED_DECLARATION] processed: ${name}`;
}
