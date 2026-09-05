/**
 * Debounce Utility using JavaScript Closures & Timers
 * 
 * Demonstrates:
 * - Closure: The returned function captures the `timer` identifier in its lexical scope.
 * - Event Loop: Uses `setTimeout` to defer execution to the macrotask queue.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with .cancel() method
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  const debounced = function (...args) {
    if (timer) {
      clearTimeout(timer);
    }

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
