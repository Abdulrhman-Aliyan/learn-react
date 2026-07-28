/* The sandbox log, the halt signal, and the tripwires that stop a runaway
   exercise before it locks up the tab.

   All of this lives outside React on purpose: learner code runs inside an
   error boundary that may be mid-crash, and the log still has to work. */

/* ---- log ----------------------------------------------------------------- */

let lines = [];
let halted = null;
let version = 0;
const listeners = new Set();

function emit() {
  version++;
  listeners.forEach(function (l) { l(); });
}

function stamp() {
  const t = new Date();
  return String(t.getMinutes()).padStart(2, '0') + ':' +
         String(t.getSeconds()).padStart(2, '0') + '.' +
         String(t.getMilliseconds()).padStart(3, '0');
}

export const Runtime = {
  /* useSyncExternalStore pair, so the log panel can subscribe from React. */
  subscribe: function (l) { listeners.add(l); return function () { listeners.delete(l); }; },
  getSnapshot: function () { return version; },

  get lines() { return lines; },
  get halted() { return halted; },

  log: function (kind, text) {
    lines = lines.concat([{ kind: kind, text: text, stamp: stamp(), id: Math.random() }]).slice(-120);
    emit();
  },

  halt: function (reason) {
    if (!halted) { halted = reason; emit(); }
  },

  clear: function () {
    lines = [];
    halted = null;
    resetCallCounters();
    setterTimes.length = 0;
    hookCallTimes.length = 0;
    emit();
  }
};

/* ---- API call-rate tripwires --------------------------------------------- */

/* Two separate shapes of runaway.
   Burst: a tight loop hammering the API — halt before the tab freezes.
   Runaway: the same request repeating forever at a human-visible pace, which
   is exactly what an effect with no dependency array looks like. Legitimate
   polling runs at 1500ms (13 calls / 20s), so 20 leaves headroom. */

const callTimes = [];
const labelTimes = {};

export function recordCall(label) {
  const now = Date.now();
  callTimes.push(now);
  while (callTimes.length && now - callTimes[0] > 2000) callTimes.shift();

  const seen = labelTimes[label] || (labelTimes[label] = []);
  seen.push(now);
  while (seen.length && now - seen[0] > 20000) seen.shift();

  return { burst: callTimes.length, repeats: seen.length };
}

export function resetCallCounters() {
  callTimes.length = 0;
  Object.keys(labelTimes).forEach(function (k) { delete labelTimes[k]; });
}

/* ---- state-update tripwires ---------------------------------------------- */

/* Setter-rate tripwire, for loops that never touch the API. */
const setterTimes = [];

export function guardSetter() {
  const now = Date.now();
  setterTimes.push(now);
  while (setterTimes.length && now - setterTimes[0] > 2000) setterTimes.shift();
  if (setterTimes.length > 500) {
    Runtime.halt(
      'Render loop: 500+ state updates in 2 seconds.\n' +
      'Something sets state on every render. Usually a useEffect missing its ' +
      'dependency array, or an effect that sets state it also depends on.'
    );
    return false;
  }
  return !Runtime.halted;
}

/* Store-subscription tripwire. A zustand selector returning a fresh object
   fails Object.is on every check, so useSyncExternalStore re-renders forever.
   Lesson 05 ships that bug deliberately — catch it and name it. */
const hookCallTimes = [];

export function guardStoreHook() {
  const now = Date.now();
  hookCallTimes.push(now);
  while (hookCallTimes.length && now - hookCallTimes[0] > 2000) hookCallTimes.shift();
  if (hookCallTimes.length > 600) {
    Runtime.halt(
      'Subscription loop: 600+ store reads in 2 seconds.\n' +
      'A selector that builds a new object or array every call never passes the ' +
      'Object.is check, so the component re-renders, re-selects, and starts again.\n' +
      'Select primitives separately, or wrap the selector in useShallow(...).'
    );
    return false;
  }
  return !Runtime.halted;
}
