/* 06 · Custom hooks
   Guided task: pull two tangled effects out of a component and compose them.
   Challenge:   useLocalStorage, where the trap is the lazy initialiser. */

import { count } from './helpers.js';

export default {
  n: '06',
  id: 'custom-hooks',
  title: 'Custom hooks',
  subtitle: 'Sharing logic, never state',

  explain: [
    'A custom hook is just a function whose name starts with `use` and which calls other hooks. There is no React API for this — no registration, no wrapper. The naming convention is what tells React (and the lint rule) to enforce the rules of hooks inside it.',
    'The single most important property: a custom hook shares **logic, not state**. Two components calling `useDebouncedValue(query, 400)` get two entirely separate timers and two separate pieces of state. Nothing is shared between them. If you want shared state, you want a store or a context — a custom hook will quietly give every caller its own copy, which is a confusing bug to chase if you expected otherwise.',
    'The rules follow from how React tracks hooks: it matches them up by call order, so they must run unconditionally at the top level of the function. No hooks in an `if`, a loop, or after an early return — including inside your custom hook, since it is inlined into the caller for these purposes.',
    'Return whatever fits. A pair reads well as an array, because the caller names both halves: `const [value, setValue] = useToggle()`. Three or more values should be an object, so the caller destructures by name and you can add a fourth without breaking anyone. Return a stable API — memoize returned functions if consumers put them in dependency arrays.',
    'Extract when logic is duplicated, when a component has grown effects that have nothing to do with each other, or when a chunk of behaviour deserves a name and a test. A good custom hook is one you can describe in a sentence without using the word "and".'
  ],

  interview: 'A custom hook is any function starting with use that calls hooks, and the thing to be clear about is that it shares logic, not state — every call site gets its own copy, so shared state still needs a store or a context. I extract when a component has grown effects that are unrelated to each other, and I return an object once there are more than two values so callers destructure by name and the shape can grow.',

  guided: {
    id: 'L06-G',
    title: 'Two effects that do not belong together',

    starter: [
      "// L06 · A search panel doing three unrelated jobs at once",
      "//",
      "// It works. But debouncing and fetching are tangled into one component,",
      "// neither can be reused or tested, and the component is hard to read.",
      "//",
      "// Steps are numbered in the order you do them, not top to bottom.",
      "",
      "// STEP 1 · useDebouncedValue goes here",
      "",
      "// STEP 3 · useJobSearch goes here",
      "",
      "function SearchPanel({ label }) {",
      "  const renders = useRenderCount();",
      "  const [query, setQuery] = useState('');",
      "",
      "  const [debounced, setDebounced] = useState('');   // STEP 2 · five lines expressing one idea",
      "  useEffect(() => {",
      "    const id = setTimeout(() => setDebounced(query), 400);",
      "    return () => clearTimeout(id);",
      "  }, [query]);",
      "",
      "  const [jobs, setJobs] = useState([]);             // STEP 4 · and these express another",
      "  const [loading, setLoading] = useState(false);",
      "  useEffect(() => {",
      "    let cancelled = false;",
      "    setLoading(true);",
      "    mockApi.listJobs()",
      "      .then(data => {",
      "        if (cancelled) return;",
      "        setJobs(data.filter(j => j.file.includes(debounced)));",
      "        setLoading(false);",
      "      })",
      "      .catch(() => { if (!cancelled) setLoading(false); });",
      "    return () => { cancelled = true; };",
      "  }, [debounced]);",
      "",
      "  return (",
      "    <Panel title={label} count={renders}>",
      "      <input",
      "        value={query}",
      "        onChange={e => setQuery(e.target.value)}",
      "        placeholder=\"Search filenames...\"",
      "        className=\"mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"",
      "      />",
      "      {loading ? <p className=\"text-[12px] text-slate-500\">searching...</p> : null}",
      "      <div className=\"space-y-1\">",
      "        {jobs.map(j => <p key={j.id} className=\"truncate text-[12px]\">{j.file}</p>)}",
      "      </div>",
      "    </Panel>",
      "  );",
      "}",
      "",
      "function App() {",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      <SearchPanel label=\"search A\" />",
      "    </div>                                          // STEP 5 · only one instance",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Write useDebouncedValue',
        do: 'Replace the standalone line marked `STEP 1` with the hook:\n\n`function useDebouncedValue(value, delay) { ... }`\n\nIt holds its own state, sets a timer on every change to `value`, clears that timer in the cleanup, and returns the delayed copy.',
        why: 'Everything that makes this a hook rather than a helper is here: it calls `useState` and `useEffect`, so it must obey the rules of hooks, and the `use` prefix is what tells the linter to check that. The cleanup is what makes it a *debounce* rather than a delay — each keystroke cancels the previous pending timer, so only the last one survives.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 1',
          code: "function useDebouncedValue(value, delay) {\n  const [debounced, setDebounced] = useState(value);\n\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    // Cancels the pending timer whenever `value` changes again.\n    return () => clearTimeout(id);\n  }, [value, delay]);\n\n  return debounced;\n}"
        },
        checks: [
          {
            label: 'useDebouncedValue is declared',
            test: function (s) { return /function\s+useDebouncedValue\s*\(/.test(s); },
            hint: 'Declare `function useDebouncedValue(value, delay) { ... }` at module level. The `use` prefix is not decoration — it is what makes the rules of hooks apply.'
          },
          {
            label: 'It clears its timer',
            test: function (s) { return /useDebouncedValue[\s\S]{0,400}?clearTimeout\s*\(/.test(s); },
            hint: 'Return `() => clearTimeout(id)` from the effect. Without it every keystroke leaves a live timer and the value lands repeatedly.'
          },
          {
            label: 'It returns the delayed value',
            test: function (s) { return /useDebouncedValue[\s\S]{0,400}?return\s+debounced\s*;/.test(s); },
            hint: 'End the hook with `return debounced;` — a single value, so no array or object wrapper is needed.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Call it from the component',
        do: 'The five lines starting at the marker `STEP 2` are exactly what the hook now does. Replace all five with one line:\n\n`const debounced = useDebouncedValue(query, 400);`',
        why: 'Note what the component gained: a name. `useDebouncedValue(query, 400)` says what is happening; a `useState` next to a `setTimeout` in a `useEffect` makes the reader reconstruct it. That readability is most of the value of extracting — reuse is a bonus that often never arrives.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 2',
          lines: 5,
          code: '  const debounced = useDebouncedValue(query, 400);'
        },
        checks: [
          {
            label: 'The component calls the hook',
            test: function (s) { return /debounced\s*=\s*useDebouncedValue\s*\(/.test(s); },
            hint: '`const debounced = useDebouncedValue(query, 400);`'
          },
          {
            label: 'The inline debounce is gone',
            test: function (s) { return count(s, /setTimeout\s*\(/g) === 1; },
            hint: 'Only one `setTimeout` should remain in the file — the one inside the hook. Delete the useState and useEffect that used to do this in the component.'
          }
        ]
      },
      {
        id: 's3',
        title: 'Write useJobSearch',
        do: 'Replace the standalone line marked `STEP 3` with a hook that owns the fetching: `function useJobSearch(term) { ... }`. Move the jobs state, the loading flag and the fetching effect into it, and return `{ jobs, loading }`.',
        why: 'Two values, and this one returns an object rather than an array. The rule of thumb: arrays are for pairs where the caller names both halves — `useState`-shaped things. Once you are past two, or the values are not symmetrical, an object lets callers destructure by name and lets you add a third field later without breaking a single call site.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 3',
          code: "function useJobSearch(term) {\n  const [jobs, setJobs] = useState([]);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n\n    mockApi.listJobs()\n      .then(data => {\n        if (cancelled) return;\n        setJobs(data.filter(j => j.file.includes(term)));\n        setLoading(false);\n      })\n      .catch(() => { if (!cancelled) setLoading(false); });\n\n    return () => { cancelled = true; };\n  }, [term]);\n\n  // Two values, so an object — callers destructure by name.\n  return { jobs, loading };\n}"
        },
        checks: [
          {
            label: 'useJobSearch is declared',
            test: function (s) { return /function\s+useJobSearch\s*\(/.test(s); },
            hint: 'Declare `function useJobSearch(term) { ... }` at module level, next to the other hook.'
          },
          {
            label: 'It returns an object',
            test: function (s) { return /useJobSearch[\s\S]{0,700}?return\s*\{\s*jobs\s*,\s*loading\s*\}/.test(s); },
            hint: 'End with `return { jobs, loading };` — an object, because there are two dissimilar values and there may be a third later.'
          },
          {
            label: 'It still cancels late responses',
            test: function (s) { return /useJobSearch[\s\S]{0,700}?cancelled\s*=\s*true/.test(s); },
            hint: 'Bring the `cancelled` flag and its cleanup across. Extracting logic must not quietly drop its correctness.'
          }
        ]
      },
      {
        id: 's4',
        title: 'Call that one too',
        do: 'The fourteen lines starting at the marker `STEP 4` now live in the hook. Replace them all with:\n\n`const { jobs, loading } = useJobSearch(debounced);`',
        why: 'The component is now four lines of logic and some JSX, and each line names one idea. Read it top to bottom: take a query, debounce it, search with it, render. Neither hook knows the other exists — they compose because the caller wires the output of one into the input of the other.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 4',
          lines: 14,
          code: '  const { jobs, loading } = useJobSearch(debounced);'
        },
        checks: [
          {
            label: 'The component calls useJobSearch',
            test: function (s) { return /\{\s*jobs\s*,\s*loading\s*\}\s*=\s*useJobSearch\s*\(/.test(s); },
            hint: '`const { jobs, loading } = useJobSearch(debounced);`'
          },
          {
            label: 'The component has no effects left',
            test: function (s) { return !/function\s+SearchPanel[\s\S]{0,400}?useEffect\s*\(/.test(s); },
            hint: 'Both `useEffect` calls should now live inside the hooks. SearchPanel should call `useState` once, for the query, and nothing else.'
          }
        ]
      },
      {
        id: 's5',
        title: 'Prove the state is not shared',
        do: 'Replace the line marked `STEP 5` with a second panel, then the closing `</div>`:\n\n`      <SearchPanel label="search B" />\n    </div>`\n\nRun it and type different things into the two boxes.',
        why: 'This is the point of the lesson. Both panels call the same two hooks, and the boxes are completely independent — separate query state, separate timers, separate results. A custom hook is a recipe that runs fresh at each call site, not a shared container. If you wanted these two panels to search in lockstep, no custom hook would give you that; you would need a store, which is lesson 08.',
        reveal: {
          anchor: 'STEP 5',
          code: '      <SearchPanel label="search B" />\n    </div>'
        },
        checks: [
          {
            label: 'Two panels are mounted',
            test: function (s) { return count(s, /<SearchPanel\b/g) >= 2; },
            hint: 'Add a second `<SearchPanel label="search B" />` beside the first, inside the same wrapper div.'
          }
        ]
      }
    ]
  },

  challenges: [
    {
      id: 'L06-A',
      title: 'useLocalStorage, and the initialiser that runs every render',

      brief: [
        'Build `useLocalStorage(key, initialValue)` returning a `[value, setValue]` pair, so it drops in where `useState` was.',
        'Read the stored value with a **lazy initialiser** — `useState(() => ...)`, not `useState(read())`. The second form re-reads storage on every single render.',
        'Writing must accept an updater function too, like `useState`: `setValue(v => v + 1)` has to work.',
        'Wrap the read and the write in `try/catch`. Private-mode browsers throw, and a preferences hook must not take the page down.',
        'Return a `setValue` whose identity is stable, so consumers can put it in a dependency array.'
      ],

      starter: [
        "// L06 challenge · Persisted filter preferences",
        "// Type in the box, press Run again, and watch your text vanish.",
        "",
        "function useLocalStorage(key, initialValue) {",
        "  // TODO 1: read the stored value ONCE, with a lazy initialiser.",
        "  //         useState(readIt()) would call readIt on every render.",
        "  const [value, setValue] = useState(initialValue);",
        "",
        "  // TODO 2: write to localStorage whenever key or value changes.",
        "  //         Wrap it in try/catch — this throws in private mode.",
        "",
        "  // TODO 3: return a setter that also accepts an updater function,",
        "  //         and whose identity is stable across renders.",
        "  return [value, setValue];",
        "}",
        "",
        "function App() {",
        "  const renders = useRenderCount();",
        "  const [filter, setFilter] = useLocalStorage('lab:filter', '');",
        "  const [runs, setRuns] = useLocalStorage('lab:runs', 0);",
        "",
        "  return (",
        "    <Panel title=\"preferences · survives a re-run\" count={renders}>",
        "      <input",
        "        value={filter}",
        "        onChange={e => setFilter(e.target.value)}",
        "        placeholder=\"This should survive Run\"",
        "        className=\"mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"",
        "      />",
        "      <button",
        "        onClick={() => setRuns(n => n + 1)}",
        "        className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">",
        "        {'Counted ' + runs + ' times'}",
        "      </button>",
        "      <p className=\"mt-2 font-mono text-[11px] text-slate-500\">",
        "        {'stored: ' + JSON.stringify(filter)}",
        "      </p>",
        "    </Panel>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Start with the counter button — `setRuns(n => n + 1)`. What does your setter receive, and what does it do with it if it happens to be a function?',
        '`useState(expensive())` calls `expensive()` on every render and throws the result away every time after the first. `useState(() => expensive())` calls it once. Reading `localStorage` is synchronous I/O, so the difference is real. For the setter, the updater form means you cannot just store what you were handed — you have to check whether it is a function and, if so, call it with the current value, exactly as React does.',
        'Shape: `const [value, setValue] = useState(() => { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : initialValue; } catch { return initialValue; } });` then a `useEffect` writing on `[key, value]`, then a `useCallback` setter that resolves updater functions.',
        "The whole hook:\n\n  function useLocalStorage(key, initialValue) {\n    const [value, setValue] = useState(() => {\n      try {\n        const raw = window.localStorage.getItem(key);\n        return raw !== null ? JSON.parse(raw) : initialValue;\n      } catch (e) {\n        return initialValue;          // private mode, or corrupt JSON\n      }\n    });\n\n    useEffect(() => {\n      try {\n        window.localStorage.setItem(key, JSON.stringify(value));\n      } catch (e) {\n        /* quota or private mode — losing persistence beats crashing */\n      }\n    }, [key, value]);\n\n    // Stable identity, and it honours the updater form the way useState does.\n    const set = useCallback(next => {\n      setValue(prev => (typeof next === 'function' ? next(prev) : next));\n    }, []);\n\n    return [value, set];\n  }\n\nThe `typeof next === 'function'` line is the one people miss, and it is exactly what React itself does internally."
      ],

      checks: [
        {
          label: 'The initial read is lazy',
          test: function (s) { return /useState\s*\(\s*\(\s*\)\s*=>/.test(s); },
          hint: 'Pass a function: `useState(() => { ... read localStorage ... })`. Passing the value directly re-reads storage on every render.'
        },
        {
          label: 'It reads and writes localStorage',
          test: function (s) { return /getItem\s*\(/.test(s) && /setItem\s*\(/.test(s); },
          hint: 'Read with `window.localStorage.getItem(key)` in the initialiser, write with `setItem` in an effect keyed on `[key, value]`.'
        },
        {
          label: 'Both sides are guarded',
          test: function (s) { return count(s, /try\s*\{/g) >= 2; },
          hint: 'Two try/catch blocks: one around the read (private mode, corrupt JSON), one around the write (quota, private mode).'
        },
        {
          label: 'The setter accepts an updater function',
          test: function (s) { return /typeof\s+\w+\s*===\s*['"]function['"]/.test(s); },
          hint: '`setValue(prev => typeof next === "function" ? next(prev) : next)`. Without this, `setRuns(n => n + 1)` stores the function itself and the counter breaks.'
        },
        {
          label: 'The setter identity is stable',
          test: function (s) { return /useCallback\s*\(/.test(s); },
          hint: 'Wrap the returned setter in `useCallback(..., [])` so consumers can safely list it in a dependency array.'
        },
        {
          label: 'It still returns a [value, setter] pair',
          test: function (s) { return /return\s*\[\s*\w+\s*,\s*\w+\s*\]/.test(s); },
          hint: 'Return an array so it is a drop-in replacement for `useState` — that is why the two call sites in App read naturally.'
        }
      ]
    }
  ]
};
