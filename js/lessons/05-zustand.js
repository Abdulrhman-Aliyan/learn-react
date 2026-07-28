/* 05 · Zustand
   Explanation and three challenges ported from the original lab.
   A builds the store, B proves selectors beat context, C is the trap. */

import { count } from './helpers.js';

export default {
  n: '05',
  id: 'zustand',
  title: 'Zustand',
  subtitle: 'Same store, selective subscriptions',

  explain: [
    'Zustand keeps the store *outside* React. `create((set, get) => ({...}))` returns a hook, and there is no provider to mount — which is exactly why it does not have context\'s problem.',
    'Components subscribe with a selector: `useStore(s => s.filter)`. The store compares the selected slice with `Object.is` after every update and re-renders only the components whose slice actually changed. A throughput value ticking four times a second wakes the one component that selected it, and nothing else.',
    '`set` shallow-merges the top level and takes a function when the next value depends on the current one, same as `useState`. `get()` reads the current state inside actions. Actions live in the store, so components stay dumb.',
    'The one trap: a selector that builds a new object — `s => ({ a: s.a, b: s.b })` — fails `Object.is` every single time. Select the fields separately, or wrap it in `useShallow`.'
  ],

  interview: 'Zustand subscribes per selector instead of per provider, so only the components that read a changed slice re-render — no provider, no splitting contexts to work around it. The one thing to watch is a selector returning a new object each call, which defeats the Object.is check; that is what useShallow is for.',

  challenges: [
    {
      id: 'L05-A',
      title: 'Build the queue store',

      brief: [
        'Add the actions: `setFilter`, `select`, `markDone`.',
        '`markDone` must produce a new array — zustand compares by reference too.',
        'Add `failedCount()`, derived through `get()` rather than stored.'
      ],

      starter: [
        "// L05-A · The same queue, as a store",
        "",
        "const SEED = [",
        "  { id: 'job_1001', file: 'invoice-4417.pdf',      status: 'done',       pages: 3 },",
        "  { id: 'job_1002', file: 'contract-acme-v3.pdf',  status: 'processing', pages: 18 },",
        "  { id: 'job_1003', file: 'receipt-scan-0091.jpg', status: 'failed',     pages: 1 },",
        "  { id: 'job_1004', file: 'w9-form-signed.pdf',    status: 'failed',     pages: 2 }",
        "];",
        "",
        "const useJobStore = create((set, get) => ({",
        "  jobs: SEED,",
        "  filter: '',",
        "  selectedId: null,",
        "",
        "  // TODO 1: setFilter(value)",
        "  // TODO 2: select(id) — clicking the selected row again clears it",
        "  // TODO 3: markDone(id) — new array, no mutation, use the set(state => ...) form",
        "  // TODO 4: failedCount() — derive it with get(), do not store a second copy",
        "}));",
        "",
        "function App() {",
        "  const jobs = useJobStore(s => s.jobs);",
        "  const filter = useJobStore(s => s.filter);",
        "  const selectedId = useJobStore(s => s.selectedId);",
        "  const setFilter = useJobStore(s => s.setFilter);",
        "  const select = useJobStore(s => s.select);",
        "  const markDone = useJobStore(s => s.markDone);",
        "  const failedCount = useJobStore(s => s.failedCount);",
        "",
        "  const visible = jobs.filter(j => j.file.toLowerCase().includes(filter.toLowerCase()));",
        "",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <input",
        "        value={filter}",
        "        onChange={e => setFilter(e.target.value)}",
        "        placeholder=\"Filter by filename...\"",
        "        className=\"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900\"",
        "      />",
        "      <div className=\"space-y-2\">",
        "        {visible.map(j => (",
        "          <JobRow key={j.id} job={j} selected={j.id === selectedId} onClick={() => select(j.id)} />",
        "        ))}",
        "      </div>",
        "      <div className=\"flex items-center gap-3\">",
        "        <button",
        "          disabled={!selectedId}",
        "          onClick={() => markDone(selectedId)}",
        "          className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-40\">",
        "          Mark selected done",
        "        </button>",
        "        <span className=\"font-mono text-[11px] text-slate-500\">{'failed: ' + failedCount()}</span>",
        "      </div>",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Actions are just more properties on the object you return from `create`. They close over `set` and `get`, which are the two arguments the initializer receives.',
        'Two of these actions derive their next value from the current one, so they need `set(state => ({ ... }))` rather than `set({ ... })` — the same reasoning as the functional updater in useState. And `failedCount` is derived, not stored: computing it through `get()` keeps one source of truth.',
        "`setFilter: value => set({ filter: value })`, `select: id => set(state => ({ selectedId: state.selectedId === id ? null : id }))`, `markDone: id => set(state => ({ jobs: state.jobs.map(...) }))`, `failedCount: () => get().jobs.filter(j => j.status === 'failed').length`",
        "The whole store:\n\n  const useJobStore = create((set, get) => ({\n    jobs: SEED,\n    filter: '',\n    selectedId: null,\n\n    setFilter: value => set({ filter: value }),\n\n    select: id => set(state => ({\n      selectedId: state.selectedId === id ? null : id\n    })),\n\n    markDone: id => set(state => ({\n      jobs: state.jobs.map(j => (j.id === id ? { ...j, status: 'done' } : j))\n    })),\n\n    failedCount: () => get().jobs.filter(j => j.status === 'failed').length\n  }));"
      ],

      checks: [
        {
          label: 'All three actions defined',
          test: function (s) { return /setFilter\s*:/.test(s) && /select\s*:/.test(s) && /markDone\s*:/.test(s); },
          hint: 'Define them as properties of the store object: `setFilter: value => set({ filter: value })`. Actions belong in the store so components never touch state shape.'
        },
        {
          label: 'set is used with the function form',
          test: function (s) { return /set\s*\(\s*\(?\s*(state|s)\s*\)?\s*=>/.test(s); },
          hint: 'markDone and select derive from current state, so use `set(state => ({ ... }))` — the same reason useState needs a functional updater.'
        },
        {
          label: 'markDone is immutable',
          test: function (s) { return /markDone\s*:[\s\S]{0,220}?\.map\s*\(/.test(s) && !/\.push\s*\(/.test(s) && !/\bj\.status\s*=[^=]/.test(s); },
          hint: '`jobs: state.jobs.map(j => j.id === id ? { ...j, status: "done" } : j)`. Mutating state.jobs in place keeps the same array reference, so every selector says nothing changed.'
        },
        {
          label: 'failedCount derives via get()',
          test: function (s) { return /failedCount\s*:/.test(s) && /get\s*\(\s*\)/.test(s); },
          hint: '`failedCount: () => get().jobs.filter(j => j.status === "failed").length`. Storing the number instead means two things to keep in sync.'
        },
        {
          label: 'Selection toggles off',
          test: function (s) { return /selectedId\s*===\s*id\s*\?/.test(s); },
          hint: '`select: id => set(state => ({ selectedId: state.selectedId === id ? null : id }))`.'
        }
      ]
    },

    {
      id: 'L05-B',
      title: 'Selectors vs the whole store',

      brief: [
        "Same four panels as 04-B, same 250ms tick. Every panel currently subscribes to the whole store, so every panel re-renders on every tick — context's problem, reproduced.",
        'Give every panel a selector that reads only what it needs.',
        'Leave the render badges in place and compare the numbers against 04-B and 04-C.',
        'Target: only the gauge climbs. No provider, no context splitting, no memo — just a selector.'
      ],

      starter: [
        "// L05-B · The same measurement, with a store instead of a context",
        "",
        "const useScannerStore = create(set => ({",
        "  user: { name: 'Dana Okoye', role: 'admin' },",
        "  throughput: 0,",
        "  queueDepth: 5,",
        "  tick: () => set(state => ({ throughput: state.throughput + 3 }))",
        "}));",
        "",
        "function Ticker() {",
        "  const tick = useScannerStore(s => s.tick);",
        "  useEffect(() => {",
        "    const id = setInterval(tick, 250);",
        "    return () => clearInterval(id);",
        "  }, [tick]);",
        "  return null;",
        "}",
        "",
        "function AccountChip() {",
        "  // TODO 1: select only the user name",
        "  const state = useScannerStore();",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"account · needs user.name\" count={renders}><p className=\"text-sm\">{state.user.name}</p></Panel>;",
        "}",
        "",
        "function RoleBadge() {",
        "  // TODO 2: select only the role",
        "  const state = useScannerStore();",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"role · needs user.role\" count={renders}><p className=\"font-mono text-sm text-blue-600\">{state.user.role}</p></Panel>;",
        "}",
        "",
        "function QueueDepth() {",
        "  // TODO 3: select only queueDepth",
        "  const state = useScannerStore();",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"depth · needs queueDepth\" count={renders}><p className=\"text-2xl font-semibold\">{state.queueDepth}</p></Panel>;",
        "}",
        "",
        "function ThroughputGauge() {",
        "  // TODO 4: select only throughput — this one is supposed to keep climbing",
        "  const state = useScannerStore();",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"throughput · needs throughput\" count={renders}><p className=\"text-2xl font-semibold text-blue-600\">{state.throughput + ' pages/min'}</p></Panel>;",
        "}",
        "",
        "function App() {",
        "  return (",
        "    <div className=\"grid gap-3 sm:grid-cols-2\">",
        "      <Ticker />",
        "      <AccountChip />",
        "      <RoleBadge />",
        "      <QueueDepth />",
        "      <ThroughputGauge />",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Calling the store hook with no argument is a request. What exactly is it requesting?',
        '`useScannerStore()` with no selector means "notify me about every change to anything". A selector narrows that to one slice, and the store compares just that slice with `Object.is` before deciding whether to re-render you. Reach all the way down to a primitive — `s => s.user.name`, not `s => s.user`.',
        'Replace each `const state = useScannerStore();` with a selector: `const name = useScannerStore(s => s.user.name);` and so on, then use the local variable in the JSX instead of `state.…`.',
        'All four:\n\n  const name = useScannerStore(s => s.user.name);\n  const role = useScannerStore(s => s.user.role);\n  const depth = useScannerStore(s => s.queueDepth);\n  const throughput = useScannerStore(s => s.throughput);\n\nOnly the gauge climbs now. Compare that to 04-B, where memo could not achieve this, and 04-C, where it took two contexts and a useMemo.'
      ],

      checks: [
        {
          label: 'No panel subscribes to the whole store',
          test: function (s) { return !/useScannerStore\s*\(\s*\)/.test(s); },
          hint: '`useScannerStore()` with no selector means "notify me about everything". Replace each one with `useScannerStore(s => s.something)`.'
        },
        {
          label: 'Every panel uses a selector',
          test: function (s) { return count(s, /useScannerStore\s*\(\s*\(?\s*(s|state)\s*\)?\s*=>/g) >= 5; },
          hint: 'Four panels plus the Ticker need a selector each: `useScannerStore(s => s.user.name)`, and so on.'
        },
        {
          label: 'Selectors return primitives, not objects',
          test: function (s) { return !/useScannerStore\s*\(\s*\(?\s*(s|state)\s*\)?\s*=>\s*\(?\s*\{[^}]*:/.test(s); },
          hint: 'Reach all the way down to the value: `s => s.user.name`, not `s => s.user` or `s => ({ name: s.user.name })`. A fresh object fails the Object.is check every time.'
        },
        {
          label: 'Render counts still visible',
          test: function (s) { return count(s, /useRenderCount\s*\(/g) >= 4; },
          hint: 'Keep the badges — the numbers are the evidence you would show an interviewer.'
        }
      ]
    },

    {
      id: 'L05-C',
      title: 'The new-object selector trap',

      brief: [
        'Run it first and watch the stats badge. Nothing it displays ever changes, yet it re-renders four times a second — its selector hands back a fresh object every call, so `Object.is` always says "changed".',
        'Fix it with `useShallow` (or two separate selectors) and watch the badge stop.',
        'In `exportSelected`, read the current filter *without subscribing* — `useJobStore.getState()`.'
      ],

      starter: [
        "// L05-C · Object selectors and reading without subscribing",
        "",
        "const useJobStore = create(set => ({",
        "  jobs: [",
        "    { id: 'job_1001', file: 'invoice-4417.pdf',      status: 'done',   pages: 3 },",
        "    { id: 'job_1003', file: 'receipt-scan-0091.jpg', status: 'failed', pages: 1 },",
        "    { id: 'job_1004', file: 'w9-form-signed.pdf',    status: 'failed', pages: 2 }",
        "  ],",
        "  filter: 'invoice',",
        "  throughput: 0,",
        "  tick: () => set(state => ({ throughput: state.throughput + 3 }))",
        "}));",
        "",
        "function Ticker() {",
        "  const tick = useJobStore(s => s.tick);",
        "  useEffect(() => {",
        "    const id = setInterval(tick, 250);",
        "    return () => clearInterval(id);",
        "  }, [tick]);",
        "  return null;",
        "}",
        "",
        "function QueueStats() {",
        "  // TODO 1: this selector allocates a new object on every call, so the",
        "  //         Object.is comparison never matches and this panel re-renders on",
        "  //         every tick of a value it does not even read. Wrap it in useShallow.",
        "  const { total, failed } = useJobStore(s => ({",
        "    total: s.jobs.length,",
        "    failed: s.jobs.filter(j => j.status === 'failed').length",
        "  }));",
        "  const renders = useRenderCount();",
        "  return (",
        "    <Panel title=\"stats\" count={renders}>",
        "      <p className=\"font-mono text-sm\">{total + ' jobs · ' + failed + ' failed'}</p>",
        "    </Panel>",
        "  );",
        "}",
        "",
        "function ExportBar() {",
        "  const renders = useRenderCount();",
        "",
        "  function exportSelected() {",
        "    // TODO 2: read the CURRENT filter without subscribing this component to it.",
        "    const filter = 'TODO';",
        "    log('exporting rows matching: ' + filter);",
        "  }",
        "",
        "  return (",
        "    <Panel title=\"export · must not subscribe\" count={renders}>",
        "      <button onClick={exportSelected} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Export filtered</button>",
        "    </Panel>",
        "  );",
        "}",
        "",
        "function App() {",
        "  return (",
        "    <div className=\"grid gap-3 sm:grid-cols-2\">",
        "      <Ticker />",
        "      <QueueStats />",
        "      <ExportBar />",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'The stats panel displays two numbers that never change, and it re-renders four times a second. The value did not change — but something the store compares did.',
        '`{ total: 3, failed: 2 }` and `{ total: 3, failed: 2 }` are equal in content and different by `Object.is`. The selector allocates a fresh object each call, so the store concludes the slice changed every time. `useShallow` swaps that identity check for a key-by-key comparison. Separately, `getState()` reads the store once with no subscription — right for an event handler, wrong during render.',
        'Wrap the selector: `useJobStore(useShallow(s => ({ total: ..., failed: ... })))`. In the handler: `const filter = useJobStore.getState().filter;`',
        "Both fixes:\n\n  const { total, failed } = useJobStore(useShallow(s => ({\n    total: s.jobs.length,\n    failed: s.jobs.filter(j => j.status === 'failed').length\n  })));\n\n  function exportSelected() {\n    const filter = useJobStore.getState().filter;\n    log('exporting rows matching: ' + filter);\n  }\n\nExportBar never calls the hook at all, so it renders once and stays there."
      ],

      checks: [
        {
          label: 'Object selector wrapped in useShallow',
          test: function (s) { return /useShallow\s*\(/.test(s); },
          hint: '`useJobStore(useShallow(s => ({ total: ..., failed: ... })))`. useShallow compares the returned object key by key instead of by reference.'
        },
        {
          label: 'Handler reads state without subscribing',
          test: function (s) { return /getState\s*\(\s*\)/.test(s); },
          hint: '`const filter = useJobStore.getState().filter` — inside the handler, not during render. Subscribing here would re-render the button for a value it only reads on click.'
        },
        {
          label: 'ExportBar has no selector subscription',
          test: function (s) { return !/ExportBar[\s\S]{0,400}useJobStore\s*\(/.test(s); },
          hint: 'ExportBar must not call `useJobStore(...)` at all — `getState()` in the click handler is the whole point of this half.'
        }
      ]
    }
  ]
};
