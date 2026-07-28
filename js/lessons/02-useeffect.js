/* 02 · useEffect
   Guided task: fetch the queue on mount, safely.
   Challenge:   cleanup and changing dependencies. */

export default {
  n: '02',
  id: 'useeffect',
  title: 'useEffect',
  subtitle: 'Fetch, cleanup, dependencies',

  explain: [
    'An effect synchronises your component with something outside React — a server, a timer, a subscription, the DOM. It runs after the browser paints, and the dependency array decides when it runs again.',
    '`useEffect(fn)` with no array runs after *every* render. Fetch inside it, set state, and you have an infinite loop. `useEffect(fn, [])` runs once after mount. `useEffect(fn, [jobId])` re-runs whenever `jobId` changes. Dependencies are compared with `Object.is`, so an object or array literal in the list is a new reference each render and the effect never stops re-running.',
    'Return a cleanup function. React runs it before the next run of the effect and once on unmount — clear the interval, unsubscribe, ignore the in-flight response. Without it you leak timers and race two responses against each other.',
    'And the modern instinct: if you are only transforming data for display, you do not need an effect at all. Compute it during render.'
  ],

  interview: 'The dependency array is not a performance knob, it is a correctness contract: it says what the effect reads from the render. Missing array means it runs every render, empty array means once on mount, and I always return a cleanup so an unmounted component cannot clear a timer late or apply a stale response.',

  guided: {
    id: 'L02-G',
    title: 'Fetch the queue on mount',

    starter: [
      "// L02 · Load the OCR queue",
      "//",
      "// Run this as-is FIRST and watch the sandbox log at the bottom right.",
      "// listJobs fires again, and again, and again — the lab halts it after 20",
      "// repeats so the tab survives. That runaway is step 1's problem.",
      "",
      "function App() {",
      "  const [jobs, setJobs] = useState([]);",
      "  const [status, setStatus] = useState('loading');",
      "  const [error, setError] = useState(null);",
      "",
      "  useEffect(() => {",
      "    // STEP 3",
      "",
      "    mockApi.listJobs()",
      "      .then(data => {",
      "        // STEP 4",
      "        setJobs(data);",
      "        setStatus('ready');",
      "      });",
      "    // STEP 2",
      "",
      "    // STEP 5",
      "  });                                    // STEP 1",
      "",
      "  if (status === 'loading') return <div className=\"flex items-center gap-2 text-sm text-slate-500\"><Spinner />Loading queue...</div>;",
      "  if (status === 'error') return (",
      "    <div className=\"rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700\">{error}</div>",
      "  );",
      "  return (",
      "    <div className=\"space-y-2\">",
      "      {jobs.map(j => <JobRow key={j.id} job={j} />)}",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Stop the runaway with a dependency array',
        do: 'Find the line marked `STEP 1`. It closes the effect with `});` and no second argument. Add an empty array: `}, []);`',
        why: 'With no second argument the effect runs after *every* render. It fetches, calls `setJobs`, that causes a render, which runs the effect again — forever. The empty array says "this effect depends on nothing from the render, so run it once after mount and never again". This is the single most common useEffect bug.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 1',
          code: '  }, []);'
        },
        checks: [
          {
            label: 'Effect has an empty dependency array',
            test: function (s) { return /\}\s*,\s*\[\s*\]\s*\)/.test(s); },
            hint: 'Close the effect with `}, []);` — the array is the second argument to useEffect, after the function.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Handle the request failing',
        do: 'Replace the standalone `// STEP 2` line with a `.catch` on the end of the chain:\n\n`.catch(err => { setError(err.message); setStatus(\'error\'); });`\n\nIt has to attach to the promise, so it goes right after the closing `});` of the `.then` — the marker is already in the right place.',
        why: '`mockApi.listJobs()` rejects about 20% of the time on purpose. Without a `.catch` a failed request leaves the component stuck on "Loading queue..." forever, with an unhandled rejection in the console and nothing on screen explaining it. Run it a few times — you will hit the failure.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 2',
          code: "      .catch(err => {\n        setError(err.message);\n        setStatus('error');\n      });"
        },
        checks: [
          {
            label: 'Rejection is handled',
            test: function (s) { return /\.catch\s*\(/.test(s); },
            hint: 'Chain `.catch(err => { setError(err.message); setStatus("error"); })` onto the promise. Note there is no semicolon after the `.then(...)` block — the chain continues.'
          },
          {
            label: 'The error path sets the error status',
            test: function (s) { return /setStatus\s*\(\s*['"]error['"]\s*\)/.test(s); },
            hint: "Inside the catch, call `setStatus('error')` as well as `setError(...)` — the component only renders the red box when status is exactly 'error'."
          }
        ]
      },
      {
        id: 's3',
        title: 'Declare a cancelled flag',
        do: 'Replace the standalone `// STEP 3` line at the top of the effect with:\n\n`let cancelled = false;`',
        why: 'This is the setup for the next two steps. The request takes up to 900ms. If the component unmounts before it lands — you navigate away, a parent re-renders it out of existence — the `.then` still runs and calls `setJobs` on a component that is gone. The flag is how the cleanup tells the callback "never mind, you are too late".',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 3',
          code: '    let cancelled = false;'
        },
        checks: [
          {
            label: 'A cancelled flag is declared',
            test: function (s) { return /let\s+(cancelled|canceled|ignore|active|alive)\s*=/.test(s); },
            hint: 'Write `let cancelled = false;` as the first line inside the effect body. It has to be `let`, not `const` — the cleanup flips it.'
          }
        ]
      },
      {
        id: 's4',
        title: 'Check the flag before setting state',
        do: 'Replace the standalone `// STEP 4` line inside the `.then` with:\n\n`if (cancelled) return;`\n\nAdd the same guard as the first line of your `.catch` from step 2.',
        why: 'This is the line that actually prevents the update. Without it the flag is just a variable nobody reads. Guarding both callbacks matters — a late *failure* setting error state on a dead component is the same bug as a late success.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 4',
          code: '        if (cancelled) return;'
        },
        checks: [
          {
            label: 'The success path checks the flag',
            test: function (s) { return /if\s*\(\s*(cancelled|canceled|ignore|!\s*active|!\s*alive)\s*\)\s*return/.test(s); },
            hint: 'Put `if (cancelled) return;` as the first line inside the `.then` callback, before `setJobs(data)`.'
          }
        ]
      },
      {
        id: 's5',
        title: 'Return the cleanup',
        do: 'Replace the standalone `// STEP 5` line with the cleanup function:\n\n`return () => { cancelled = true; };`\n\nThen press Run. The queue should load once, and the sandbox log should show a single `listJobs`.',
        why: 'The effect body returns a function, and React calls it before the next run of this effect and once when the component unmounts. Flipping the flag there is what closes the loop: the in-flight response still arrives, sees `cancelled === true`, and does nothing. This is the whole pattern — declare, guard, flip.',
        reveal: {
          anchor: 'STEP 5',
          code: '    return () => { cancelled = true; };'
        },
        checks: [
          {
            label: 'Cleanup function is returned',
            test: function (s) { return /return\s*\(\s*\)\s*=>/.test(s); },
            hint: 'The effect body must return a function: `return () => { cancelled = true; };`. Returning anything else — or nothing — means no cleanup runs.'
          },
          {
            label: 'The cleanup flips the flag',
            test: function (s) { return /(cancelled|canceled|ignore)\s*=\s*true|(?:active|alive)\s*=\s*false/.test(s); },
            hint: 'Inside the returned function, set `cancelled = true;`. That is the assignment the `.then` guard is waiting to see.'
          }
        ]
      }
    ]
  },

  challenges: [{
    id: 'L02-C',
    title: 'Cleanup and changing deps',

    brief: [
      'Run it, then hit `Unmount meter` and watch the sandbox log: the interval keeps ticking. That is a leak.',
      'Clear the interval in a cleanup.',
      'Change the speed — nothing happens, because `pollMs` is missing from the deps. Add it and watch cleanup-then-resubscribe in the log.'
    ],

    starter: [
      "// L02 challenge · Throughput meter (a subscription that must be torn down)",
      "",
      "function ThroughputMeter({ pollMs }) {",
      "  const [ticks, setTicks] = useState(0);",
      "",
      "  useEffect(() => {",
      "    log('subscribe @ ' + pollMs + 'ms');",
      "    const id = setInterval(() => {",
      "      setTicks(t => t + 1);",
      "      log('tick @ ' + pollMs + 'ms');",
      "    }, pollMs);",
      "",
      "    // TODO 1: return a cleanup that clears the interval",
      "  }, []);",
      "  // TODO 2: pollMs is read inside the effect but missing from the deps,",
      "  //         so changing the speed does nothing. Add it.",
      "",
      "  return (",
      "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
      "      <div className=\"font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500\">pages / interval</div>",
      "      <div className=\"text-3xl font-semibold text-blue-600\">{ticks}</div>",
      "      <div className=\"font-mono text-[10px] text-slate-500\">{'every ' + pollMs + 'ms'}</div>",
      "    </div>",
      "  );",
      "}",
      "",
      "function App() {",
      "  const [mounted, setMounted] = useState(true);",
      "  const [pollMs, setPollMs] = useState(1000);",
      "",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      {mounted ? <ThroughputMeter pollMs={pollMs} /> : (",
      "        <div className=\"rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500\">Meter unmounted — is the log still ticking?</div>",
      "      )}",
      "      <div className=\"flex flex-wrap gap-2\">",
      "        <button onClick={() => setMounted(m => !m)} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">",
      "          {mounted ? 'Unmount meter' : 'Mount meter'}",
      "        </button>",
      "        <button onClick={() => setPollMs(1000)} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">1000ms</button>",
      "        <button onClick={() => setPollMs(300)} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">300ms</button>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    hints: [
      'Unmount the meter and keep reading the log. Something outlived the component that created it. Who is responsible for stopping a `setInterval`?',
      'An effect that subscribes must unsubscribe, and the return value of the effect body is where that goes. Separately: the dependency array is a contract listing what the effect reads from the render. This effect reads `pollMs`, so an empty array is a lie — React never re-runs it, and the interval keeps whatever speed it was born with.',
      'Replace the `// TODO 1` comment with `return () => clearInterval(id);`, and change `}, []);` to `}, [pollMs]);`.',
      'The whole effect:\n\n  useEffect(() => {\n    log(\'subscribe @ \' + pollMs + \'ms\');\n    const id = setInterval(() => {\n      setTicks(t => t + 1);\n      log(\'tick @ \' + pollMs + \'ms\');\n    }, pollMs);\n\n    return () => {\n      log(\'cleanup @ \' + pollMs + \'ms\');\n      clearInterval(id);\n    };\n  }, [pollMs]);\n\nWith pollMs in the deps, changing speed tears the old interval down and starts a new one — you can watch that pair in the log.'
    ],

    checks: [
      {
        label: 'Cleanup clears the interval',
        test: function (s) { return /return\s*\(\s*\)\s*=>/.test(s) && /clearInterval\s*\(/.test(s); },
        hint: '`return () => clearInterval(id);`. Keep the id from setInterval in a local const inside the effect — the cleanup closes over it.'
      },
      {
        label: 'pollMs is in the dependency array',
        test: function (s) { return /,\s*\[\s*pollMs\s*\]\s*\)/.test(s); },
        hint: 'The effect reads `pollMs`, so it belongs in the deps: `}, [pollMs]);`. With `[]` the interval keeps the speed it was created with.'
      },
      {
        label: 'Tick still uses a functional update',
        test: function (s) { return /setTicks\s*\(\s*\(?\s*\w+\s*\)?\s*=>/.test(s); },
        hint: 'Keep `setTicks(t => t + 1)`. A long-lived interval callback is exactly where a captured value goes stale.'
      }
    ]
  }]
};
