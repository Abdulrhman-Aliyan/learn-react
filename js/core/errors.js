/* React's runtime messages are precise and unhelpful. Translate the handful
   this course actually provokes into something you can act on. */

const ERROR_COACHING = [
  {
    re: /Maximum update depth exceeded/,
    say: 'A component is setting state in a loop. Two usual suspects: a useEffect that sets state it also depends on (check the dependency array), or a store selector that builds a new object or array on every call — that fails the Object.is check, so it re-renders, re-selects, and starts again. Fix the selector with useShallow, or select one primitive at a time.'
  },
  {
    re: /Rendered (more|fewer) hooks|order of Hooks/,
    say: 'Hooks must run in the same order on every render. One of yours is inside an if, a loop, or after an early return — move it to the top of the component.'
  },
  {
    re: /Cannot read propert(y|ies) of (undefined|null)|Cannot destructure/,
    say: 'You read from something that is not there yet. With server data that usually means the component rendered before the request resolved — handle the pending state first, or give the value a default.'
  },
  {
    re: /is not a function/,
    say: 'Check the spelling and that it is in scope. This sandbox provides the hooks, create, useShallow, the React Query hooks, mockApi, log, and the display helpers — anything else you have to define in this file.'
  },
  {
    re: /Objects are not valid as a React child/,
    say: 'You rendered an object directly. Pick a field out of it, or wrap it in JSON.stringify while you are debugging.'
  },
  {
    re: /No QueryClient set/,
    say: 'A React Query hook ran outside a provider. The lab wraps your component in a QueryClientProvider already, so this usually means the hook is being called from a module-level function rather than from a component.'
  }
];

export function explainError(message) {
  const text = String(message || '');
  for (let i = 0; i < ERROR_COACHING.length; i++) {
    if (ERROR_COACHING[i].re.test(text)) return ERROR_COACHING[i].say;
  }
  return null;
}
