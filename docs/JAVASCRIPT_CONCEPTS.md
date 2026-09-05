# JavaScript Core Concepts in Planora

This document provides a comprehensive, educational, and architectural guide to the **6 fundamental JavaScript concepts** implemented across the Planora codebase:

1. [async / await](#1-async--await)
2. [Promises & Promise Combinators](#2-promises--promise-combinators)
3. [Callbacks & Higher-Order Functions](#3-callbacks--higher-order-functions)
4. [Closures & Encapsulated Scope](#4-closures--encapsulated-scope)
5. [The Event Loop & Task Queues](#5-the-event-loop--task-queues)
6. [Hoisting & The Temporal Dead Zone](#6-hoisting--the-temporal-dead-zone)

---

## 1. async / await

### Concept Overview
`async / await` is syntactic sugar built on top of JavaScript Promises and generators. It allows asynchronous, non-blocking code to be structured and reasoned about sequentially, resembling traditional synchronous code without "callback hell" or excessive `.then()` chaining.

- **`async` Keyword**: Declares that a function returns a Promise. Even if the function returns a scalar value, JavaScript automatically wraps it in `Promise.resolve(value)`.
- **`await` Keyword**: Pauses the execution of the enclosing `async` function until the awaited Promise settles (resolves or rejects). During this pause, the JavaScript thread is released back to the event loop to execute other tasks.

### Real Implementation in Planora
In `server/controllers/taskController.js`, controller endpoints use `async / await` with `try...catch` blocks to coordinate asynchronous database queries cleanly:

```javascript
// server/controllers/taskController.js
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    // Execution yields here while database query is in-flight:
    const tasks = await Task.find({ userId });
    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching tasks' });
  }
};
```

### Sequential vs. Parallel Async Flow
In `server/utils/jsPatterns.js`, `retryWithBackoff` demonstrates sequential async control flow:
```javascript
// Retries an async action with exponential backoff
export async function retryWithBackoff(asyncFn, retries = 3, baseDelayMs = 100) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await asyncFn(attempt);
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 2. Promises & Promise Combinators

### Concept Overview
A `Promise` represents the eventual result of an asynchronous operation. It exists in one of three mutually exclusive states:
1. **Pending**: Initial state, operation still in progress.
2. **Fulfilled**: Operation completed successfully, yielding a value.
3. **Rejected**: Operation failed, yielding a reason (error).

Once settled, a Promise's state is immutable.

### Promise Combinators in Planora

#### `Promise.all` (Concurrent Execution)
When multiple independent asynchronous operations do not depend on one another, executing them sequentially with `await A(); await B();` produces an unnecessary bottleneck.

In `client/src/pages/Dashboard.jsx`, Planora uses `Promise.all` to fetch both subjects and tasks concurrently, cutting load time significantly:

```javascript
// client/src/pages/Dashboard.jsx
const [subjectsRes, tasksRes] = await Promise.all([
  subjectAPI.getAll().catch(() => ({ data: [] })),
  taskAPI.getAll().catch(() => ({ data: [] }))
]);
```

#### `Promise.race` (Deadline Timeouts)
In `server/utils/jsPatterns.js` and `server/services/llmService.js`, Planora uses `Promise.race` to enforce a strict timeout deadline on external LLM requests:

```javascript
// server/utils/jsPatterns.js
export function withTimeout(promise, ms, customMessage) {
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(customMessage || `Operation timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId); // Prevent timer leak if the primary promise settles first
  });
}
```

If the primary operation completes before the deadline, `clearTimeout` cleans up the pending timer; if the timer fires first, the race resolves with an error rejection.

---

## 3. Callbacks & Higher-Order Functions

### Concept Overview
A callback is a function passed as an argument to another function, intended to be executed at a later point:
- **Synchronous Callbacks**: Executed immediately within the outer function (e.g. `Array.prototype.map`, `filter`, `reduce`).
- **Asynchronous Callbacks**: Invoked later after an I/O, timer, or network event occurs (e.g. Express middleware, event handlers).

### Node.js Error-First Callback Pattern
The foundational Node.js asynchronous convention expects callbacks with the signature:
```javascript
callback(err, result)
```
If an error occurred, `err` is populated and `result` is undefined. If successful, `err` is `null` and `result` contains the data.

### Callbacks in Planora

#### 1. Express Middleware Pipeline
Every Express route in Planora uses callbacks via `next()`:
```javascript
// server/middleware/authMiddleware.js
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    req.user = jwt.verify(token, secret);
    return next(); // Passes control to the next middleware or route handler callback
  } catch (err) {
    res.status(401);
    return next(new Error('Not authorized, token invalid or expired'));
  }
};
```

#### 2. Functional Array Callbacks
In `client/src/pages/Tasks.jsx` and `Dashboard.jsx`, synchronous callbacks calculate progress metrics:
```javascript
// Array filtering and reduction using synchronous callbacks
const completedCount = tasks.filter(t => t.status === 'completed').length;
const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
```

#### 3. Promisification and Callback Adapters
In `server/utils/jsPatterns.js`, Planora demonstrates bridging between traditional callback-based APIs and modern Promises:
```javascript
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
```

---

## 4. Closures & Encapsulated Scope

### Concept Overview
A **closure** is the combination of a function bundled together with references to its surrounding state (the **lexical environment**).

In JavaScript, every function retains access to the variables defined in its outer scope, even after the outer function has finished executing and returned. This enables:
- Data privacy / encapsulation (emulating private member variables).
- Factory functions and stateful utilities without global pollution.
- Event listeners and debounce functions that retain timers across invocations.

### Real Implementation in Planora

#### 1. Memoization with Private State
In `server/utils/jsPatterns.js`:
```javascript
export function createMemoizer(fn) {
  // Private enclosed state — inaccessible from outside the closure
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

  memoized.getStats = () => ({ hits, misses, cacheSize: cache.size });
  return memoized;
}
```
The inner function retains access to `cache`, `hits`, and `misses`. Outside callers cannot directly mutate or tamper with `cache`.

#### 2. Client-Side Debounce
In `client/src/utils/debounce.js`:
```javascript
export function debounce(fn, delay = 300) {
  let timer = null; // Enclosed lexical variable

  const debounced = function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
```
Every invocation of `debounced` shares the same lexical `timer` variable, enabling it to reset the timer before execution occurs.

---

## 5. The Event Loop & Task Queues

### Concept Overview
JavaScript is single-threaded, featuring a single call stack. Non-blocking asynchronous I/O is achieved via the **Event Loop**, which orchestrates execution across multiple queues:

```
+-------------------------------------------------------------+
|                     Call Stack (Synchronous)                |
+-------------------------------------------------------------+
                              |
                              v (When Stack is empty)
+-------------------------------------------------------------+
|             Microtask Queue (Highest Priority)              |
|   - process.nextTick                                        |
|   - Promise callbacks (.then, .catch, .finally)             |
|   - queueMicrotask                                          |
+-------------------------------------------------------------+
                              |
                              v (Drain ALL microtasks first)
+-------------------------------------------------------------+
|             Macrotask / Timers Queue (Next Priority)        |
|   - setTimeout / setInterval                                |
|   - setImmediate (Node.js)                                  |
|   - I/O events & Network callbacks                          |
+-------------------------------------------------------------+
```

### Deterministic Order of Execution
1. **Synchronous code** executes on the Call Stack immediately.
2. When the Call Stack empties, the Event Loop checks the **Microtask Queue** and executes **ALL** queued microtasks until the queue is completely empty.
3. The Event Loop picks **one** macrotask from the **Macrotask Queue** and pushes it onto the Call Stack.
4. After that single macrotask finishes, the Event Loop again completely drains the Microtask Queue before moving to the next macrotask.

### Verification in Planora
In `server/utils/jsPatterns.js`, `traceEventLoopPhases()` proves this deterministic sequence:
```javascript
export function traceEventLoopPhases() {
  return new Promise(resolve => {
    const sequence = [];
    sequence.push('1. sync:start');

    setTimeout(() => {
      sequence.push('4. macrotask:setTimeout');
      resolve(sequence);
    }, 0);

    Promise.resolve().then(() => {
      sequence.push('3. microtask:promise');
    });

    sequence.push('2. sync:end');
  });
}
```
**Recorded Output**:
`['1. sync:start', '2. sync:end', '3. microtask:promise', '4. macrotask:setTimeout']`

Even though `setTimeout` had a delay of `0ms`, the microtask (`Promise.resolve`) was guaranteed to execute first because microtasks have strict scheduling priority over macrotasks!

---

## 6. Hoisting & The Temporal Dead Zone

### Concept Overview
**Hoisting** is the JavaScript engine's behavior of setting up memory space for variable and function declarations during the **Creation Phase** of an Execution Context, before any line of code is actually executed.

### Function Declarations vs. Function Expressions
- **Function Declarations** (`function myFunc() {}`): Both the function name and the full function body are hoisted to the top of the enclosing scope. They can be invoked anywhere in the scope, even before their textual definition.
- **Function Expressions / Arrow Functions** (`const myFunc = () => {}`): Only the variable identifier is hoisted, but it remains uninitialized in the **Temporal Dead Zone (TDZ)**. Invoking it before its declaration line results in a `ReferenceError`.

### `var` vs. `let` and `const`
| Feature | `var` | `let` / `const` |
| :--- | :--- | :--- |
| **Scope** | Function scope | Block scope `{ ... }` |
| **Hoisting state** | Hoisted and initialized to `undefined` | Hoisted into Temporal Dead Zone (uninitialized) |
| **Access before declaration** | Returns `undefined` (silent bug risk) | Throws `ReferenceError` (immediate fail-fast) |
| **Re-declaration** | Allowed | Throws `SyntaxError` |

### Architectural Application in Planora
Planora follows strict modern JavaScript conventions:
1. **Variables**: Exclusively `const` (default) and `let` (for re-assigned counters/accumulators) to eliminate accidental `undefined` reads from `var`.
2. **Top-to-Bottom Readability**: Primary exported functions are declared at the top of utility files, while private helper functions are declared at the bottom using function declarations. Thanks to hoisting, the file reads clearly from high-level intent to low-level implementation details without runtime errors.

In `server/utils/jsPatterns.js`:
```javascript
export function demonstrateHoisting() {
  // Calling hoisted declaration before its line of definition:
  const result = hoistedHelperFunction('Planora Demo');
  return { success: true, message: result };
}

// Hoisted function declaration defined AFTER demonstrateHoisting:
function hoistedHelperFunction(name) {
  return `[HOISTED_DECLARATION] processed: ${name}`;
}
```

---

## 7. Automated Test Suite

All 6 concepts are verified via an automated test harness located at `server/scripts/testJSDemonstrations.js`.

Run the test suite using:
```bash
npm run test:js
```

The suite validates:
- [x] **async/await**: Sequential execution, retry backoff with error propagation.
- [x] **Promises**: Parallel resolution with `Promise.all` and timeout cancellation with `Promise.race`.
- [x] **Callbacks**: Error-first callback dispatch and promisify/callbackify roundtrips.
- [x] **Closures**: Cache hits/misses, private state protection, and rate-limit sliding windows.
- [x] **Event Loop**: Microtasks executing strictly before macrotasks.
- [x] **Hoisting**: Successful pre-declaration invocation and Temporal Dead Zone enforcement.
