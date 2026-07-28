/* 05 · useMemo & useCallback
   Guided task: make memo actually work, then delete a memo that never did.
   Challenge:   an effect that re-runs forever because of one object literal. */

import { count } from './helpers.js';

export default {
  n: '05',
  id: 'memo',
  title: 'useMemo & useCallback',
  subtitle: 'Referential identity, not speed',

  explain: [
    'Both hooks cache something between renders while their dependencies hold. `useMemo(fn, deps)` caches the **value** `fn` returns. `useCallback(fn, deps)` caches the **function itself** — it is `useMemo(() => fn, deps)` with a nicer name.',
    'The thing everyone gets wrong: these are almost never about speed. They are about **referential identity**. Re-running a `.filter` over 200 rows costs nothing a human can perceive. What costs you is that the new array is a new reference, and something downstream compares references — a `memo` child, an effect dependency array, another hook. Memoizing is how you keep that comparison quiet.',
    'Which means memoizing pays off only when a consumer cares about identity. A `useCallback` whose function is passed to a plain, unmemoized `<button onClick>` buys you nothing at all: the DOM does not compare handler identity, and you have added a deps array to keep correct forever. `memo` on the child is what makes the `useCallback` in the parent worth writing — the two arrive together or not at all.',
    'The deps array is the same correctness contract as `useEffect`: it lists what the computation reads from this render. Miss one and you cache a stale value. Put an object or array **literal** in it and you have defeated the whole thing, because a literal is a fresh reference every render.',
    'Default to not memoizing. Reach for it when you have measured a real re-render problem, when the value feeds a `memo` boundary or a dependency array, or when the computation is genuinely expensive. Every `useMemo` is a cache you now have to keep correct.'
  ],

  interview: 'useMemo and useCallback are about referential identity rather than raw speed — the recomputation is usually cheap, but the new reference wakes anything comparing by identity, like a memo child or an effect dependency array. So a useCallback only pays for itself when the consumer is memoized; on a plain DOM handler it is pure overhead. And an object literal in a deps array defeats the whole mechanism, because it is a new reference on every render.',

  guided: {
    id: 'L05-G',
    title: 'Make memo actually work',

    starter: [
      "// L05 · Queue dashboard — three memo mistakes and one thing to delete",
      "//",
      "// Run it and type in the box. Watch the two render badges: the row list",
      "// re-renders on every keystroke, and so does the toolbar, which does not",
      "// read the query at all.",
      "//",
      "// Steps are numbered in the order you do them, not top to bottom.",
      "",
      "const SEED = Array.from({ length: 60 }, (_, i) => ({",
      "  id: 'job_' + (2000 + i),",
      "  file: ['invoice', 'contract', 'receipt', 'manifest'][i % 4] + '-' + (100 + i) + '.pdf',",
      "  status: ['queued', 'processing', 'done', 'failed'][i % 4],",
      "  pages: 1 + (i % 20)",
      "}));",
      "",
      "function JobTableInner({ jobs, onPick }) {",
      "  const renders = useRenderCount();",
      "  return (",
      "    <Panel title=\"rows\" count={renders}>",
      "      <div className=\"max-h-48 space-y-1 overflow-y-auto\">",
      "        {jobs.map(j => (",
      "          <button key={j.id} onClick={() => onPick(j.id)}",
      "            className=\"block w-full truncate rounded px-2 py-1 text-left text-[12px] hover:bg-slate-100\">",
      "            {j.file}",
      "          </button>",
      "        ))}",
      "      </div>",
      "    </Panel>",
      "  );",
      "}",
      "",
      "const JobTable = JobTableInner;    // STEP 3 · not memoized, so nothing above can protect it",
      "",
      "function ToolbarInner({ onClear }) {",
      "  const renders = useRenderCount();",
      "  return (",
      "    <Panel title=\"toolbar · reads nothing\" count={renders}>",
      "      <button onClick={onClear} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">",
      "        Clear selection",
      "      </button>",
      "    </Panel>",
      "  );",
      "}",
      "",
      "const Toolbar = ToolbarInner;      // STEP 4 · same problem here",
      "",
      "function App() {",
      "  const [query, setQuery] = useState('');",
      "  const [picked, setPicked] = useState(null);",
      "",
      "  const visible = SEED.filter(j => j.file.includes(query));            // STEP 1 · new array every keystroke",
      "",
      "  const onPick = id => setPicked(id);                                  // STEP 2 · new function every render",
      "",
      "  const onClear = () => setPicked(null);                               // STEP 5 · same, for the toolbar",
      "",
      "  const heading = useMemo(() => 'Queue (' + visible.length + ')', [visible]);   // STEP 6 · is this one earning anything?",
      "",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      <input",
      "        value={query}",
      "        onChange={e => setQuery(e.target.value)}",
      "        placeholder=\"Filter by filename...\"",
      "        className=\"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"",
      "      />",
      "      <p className=\"font-mono text-[11px] text-slate-500\">{heading + ' · picked ' + (picked || 'none')}</p>",
      "      <Toolbar onClear={onClear} />",
      "      <JobTable jobs={visible} onPick={onPick} />",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Cache the derived list',
        do: 'The line marked `STEP 1` rebuilds the filtered array on every render. Wrap it:\n\n`const visible = useMemo(() => SEED.filter(j => j.file.includes(query)), [query]);`',
        why: 'Not because `.filter` over 60 rows is slow — it is not. Because the array it returns is a **new reference** every time, and in three steps `JobTable` will be memoized and comparing that reference. Without this, memoizing the child would achieve nothing.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 1',
          code: '  const visible = useMemo(() => SEED.filter(j => j.file.includes(query)), [query]);'
        },
        checks: [
          {
            label: 'The list is memoized on query',
            test: function (s) { return /visible\s*=\s*useMemo\s*\(/.test(s) && /\[\s*query\s*\]/.test(s); },
            hint: '`const visible = useMemo(() => SEED.filter(...), [query]);` — `query` is the only thing the computation reads from this render, so it is the only dependency.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Stabilise the callback',
        do: 'The line marked `STEP 2` builds a new `onPick` function on every render. Wrap it:\n\n`const onPick = useCallback(id => setPicked(id), []);`',
        why: 'The deps are empty because the function reads nothing from this render — `setPicked` is guaranteed stable by React, exactly like `dispatch`. If you had written `id => setPicked(id + query)` you would need `[query]`, and forgetting it would leave the child calling a version of the function that remembers an old query forever.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 2',
          code: '  const onPick = useCallback(id => setPicked(id), []);'
        },
        checks: [
          {
            label: 'onPick is wrapped in useCallback',
            test: function (s) { return /onPick\s*=\s*useCallback\s*\(/.test(s); },
            hint: '`const onPick = useCallback(id => setPicked(id), []);`'
          }
        ]
      },
      {
        id: 's3',
        title: 'Give the memoization something to compare',
        do: 'The line marked `STEP 3` aliases the component straight through without memoizing it. Wrap it:\n\n`const JobTable = memo(JobTableInner);`',
        why: 'Here is the payoff, and the reason steps 1 and 2 came first. `memo` compares props by identity. Until now both props were fresh objects every render, so `memo` would have compared, found differences, and re-rendered anyway — all cost, no benefit. Now `jobs` and `onPick` hold still, and the row list finally stops re-rendering when you type a character that does not change the filter result.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 3',
          code: 'const JobTable = memo(JobTableInner);'
        },
        checks: [
          {
            label: 'JobTable is memoized',
            test: function (s) { return /JobTable\s*=\s*memo\s*\(/.test(s); },
            hint: '`const JobTable = memo(JobTableInner);` — memo takes a component and hands back a wrapped one.'
          }
        ]
      },
      {
        id: 's4',
        title: 'Memoize the toolbar too',
        do: 'Same move for the line marked `STEP 4`: `const Toolbar = memo(ToolbarInner);`',
        why: '`Toolbar` reads nothing that changes — it should sit at 1 render forever. It does not, because its parent re-renders and hands it a brand new `onClear`. This is the single most common reason a component "ignores" `memo`: the props really are different, just not in any way a human would call different.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 4',
          code: 'const Toolbar = memo(ToolbarInner);'
        },
        checks: [
          {
            label: 'Toolbar is memoized',
            test: function (s) { return /Toolbar\s*=\s*memo\s*\(/.test(s); },
            hint: '`const Toolbar = memo(ToolbarInner);`'
          }
        ]
      },
      {
        id: 's5',
        title: 'Stabilise the toolbar callback',
        do: 'The line marked `STEP 5` still hands `Toolbar` a fresh function each render, which defeats the `memo` you just added. Wrap it:\n\n`const onClear = useCallback(() => setPicked(null), []);`\n\nRun it and watch the toolbar badge freeze at 1 while you type.',
        why: 'Both halves are now in place, and the toolbar is the clean demonstration: a component that reads nothing, given a stable prop, behind a memo boundary, renders exactly once. Take away any one of the three and it renders on every keystroke.',
        reveal: {
          anchor: 'STEP 5',
          code: '  const onClear = useCallback(() => setPicked(null), []);'
        },
        checks: [
          {
            label: 'onClear is wrapped in useCallback',
            test: function (s) { return /onClear\s*=\s*useCallback\s*\(/.test(s); },
            hint: '`const onClear = useCallback(() => setPicked(null), []);`'
          },
          {
            label: 'Both children are memoized and both callbacks are stable',
            test: function (s) { return count(s, /memo\s*\(/g) >= 2 && count(s, /useCallback\s*\(/g) >= 2; },
            hint: 'You should now have two `memo` wrappers and two `useCallback` calls. They only work in pairs.'
          }
        ]
      },
      {
        id: 's6',
        title: 'Now delete the one that was never earning anything',
        do: 'The line marked `STEP 6` memoizes a string. Delete the `useMemo` and write it plainly:\n\n`const heading = \'Queue (\' + visible.length + \')\';`',
        why: 'This is the step people never take. Building a short string is free, and the result is a **primitive** — compared by value, so no consumer could ever care about its identity. The `useMemo` bought nothing and cost a closure, an array allocation, and a dependency you must keep correct forever. Memoizing by reflex is how codebases end up slower and harder to change. Wrap things when something downstream compares references; otherwise leave them alone.',
        reveal: {
          anchor: 'STEP 6',
          code: "  const heading = 'Queue (' + visible.length + ')';"
        },
        checks: [
          {
            label: 'The pointless useMemo is gone',
            test: function (s) { return count(s, /useMemo\s*\(/g) === 1 && !/heading\s*=\s*useMemo/.test(s); },
            hint: 'Exactly one `useMemo` should remain — the one caching the filtered array. `heading` is a plain string assignment.'
          }
        ]
      }
    ]
  },

  challenges: [
    {
      id: 'L05-A',
      title: 'The literal in the dependency array',

      brief: [
        'Run it and watch the sandbox log. The effect re-fetches forever, and the lab halts it after 20 repeats.',
        'Nothing on screen changes between runs. Find the reference that is new every render.',
        'Fix it so the effect runs once on mount, and again only when the status filter genuinely changes.',
        'The `useCallback` on `format` is also worthless as written — work out why and remove it.',
        'Do not delete the effect or hard-code the options. The shape has to survive.'
      ],

      starter: [
        "// L05 challenge · An effect that will not settle",
        "// Run it, then read the log. Count the requests.",
        "",
        "function App() {",
        "  const [status, setStatus] = useState('all');",
        "  const [jobs, setJobs] = useState([]);",
        "  const renders = useRenderCount();",
        "",
        "  // TODO 1: this object is rebuilt on every render, so the effect below",
        "  //         never sees the same deps twice.",
        "  const options = { status: status, limit: 20 };",
        "",
        "  // TODO 2: format is passed to nothing that compares identity.",
        "  //         Why is this useCallback here? Remove it.",
        "  const format = useCallback(j => j.file + ' · ' + j.pages + 'p', []);",
        "",
        "  useEffect(() => {",
        "    let cancelled = false;",
        "    log('fetching with status=' + options.status);",
        "    mockApi.listJobs()",
        "      .then(data => {",
        "        if (cancelled) return;",
        "        setJobs(data.filter(j => options.status === 'all' || j.status === options.status));",
        "      })",
        "      .catch(() => {});",
        "    return () => { cancelled = true; };",
        "  }, [options]);",
        "",
        "  return (",
        "    <Panel title=\"queue\" count={renders}>",
        "      <div className=\"mb-2 flex gap-2\">",
        "        {['all', 'done', 'failed'].map(s => (",
        "          <button key={s} onClick={() => setStatus(s)}",
        "            className={'rounded-md px-2 py-1 text-[12px] ' +",
        "              (s === status ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white')}>",
        "            {s}",
        "          </button>",
        "        ))}",
        "      </div>",
        "      <div className=\"space-y-1\">",
        "        {jobs.map(j => <p key={j.id} className=\"text-[12px]\">{format(j)}</p>)}",
        "      </div>",
        "    </Panel>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'The effect declares that it depends on `options`. Ask the narrow question: between two renders where you changed nothing, is `options` the same value, or the same *reference*?',
        'React compares deps with `Object.is`. Two objects with identical contents are never `Object.is`-equal, so `[options]` is a dependency that changes on literally every render — which makes the effect run after every render, which sets state, which renders again. There are two honest fixes: memoize the object so its identity tracks `status`, or stop putting an object in the deps at all and list the primitive.',
        'Simplest fix: depend on the primitive. Change the deps to `[status]` and read `status` directly inside the effect. If you want to keep the `options` object, wrap it: `const options = useMemo(() => ({ status, limit: 20 }), [status]);` and leave the deps as `[options]`. Either works; the second is what you need when the object is passed to a child.',
        "Both fixes, so you can see the trade:\n\n  // A — depend on the primitive. Fewest moving parts.\n  const options = { status: status, limit: 20 };\n  useEffect(() => {\n    /* ...read options.status... */\n  }, [status]);\n\n  // B — memoize the object. Necessary if `options` also goes to a memo child.\n  const options = useMemo(() => ({ status: status, limit: 20 }), [status]);\n  useEffect(() => {\n    /* ... */\n  }, [options]);\n\nAnd `format`: it is only ever called inside this component's own JSX. Nothing compares its identity, so the useCallback is pure overhead — delete the wrapper and keep the arrow:\n\n  const format = j => j.file + ' · ' + j.pages + 'p';"
      ],

      checks: [
        {
          label: 'The effect no longer depends on a fresh object',
          test: function (s) {
            const memoised = /options\s*=\s*useMemo\s*\(/.test(s);
            const primitiveDeps = /\}\s*,\s*\[\s*status\s*\]\s*\)/.test(s);
            return memoised || primitiveDeps;
          },
          hint: 'Either memoize the object — `const options = useMemo(() => ({ status, limit: 20 }), [status])` — or drop it from the deps and list `[status]` instead.'
        },
        {
          label: 'A plain object literal is not sitting in the deps',
          test: function (s) { return !/const\s+options\s*=\s*\{[\s\S]{0,80}?\}\s*;[\s\S]{0,600}?,\s*\[\s*options\s*\]/.test(s); },
          hint: 'If `options` is still built with a bare `{ ... }` literal, it cannot appear in the dependency array — it is a new reference every render.'
        },
        {
          label: 'The pointless useCallback is gone',
          test: function (s) { return !/format\s*=\s*useCallback/.test(s); },
          hint: '`format` is called directly in this component\'s JSX. Nothing compares its identity, so wrapping it buys nothing: `const format = j => j.file + " · " + j.pages + "p";`'
        },
        {
          label: 'The effect and its cleanup survive',
          test: function (s) { return /useEffect\s*\(/.test(s) && /return\s*\(\s*\)\s*=>/.test(s); },
          hint: 'Keep the effect and its `cancelled` cleanup — the exercise is the dependency array, not deleting the fetch.'
        },
        {
          label: 'The status filter still drives the effect',
          test: function (s) { return /\[\s*status\s*\]/.test(s) || /useMemo\s*\([\s\S]{0,120}?\[\s*status\s*\]\s*\)/.test(s); },
          hint: 'Changing the status button must still trigger a refetch. If you hard-coded the deps to `[]` the bug is gone but so is the feature.'
        }
      ]
    }
  ]
};
