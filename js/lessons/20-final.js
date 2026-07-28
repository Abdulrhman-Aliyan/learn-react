/* 08 · Final challenge
   Everything at once. The point is not difficulty — it is putting each piece
   of state in the lane it belongs to, and being able to say why. */

import { count } from './helpers.js';

export default {
  n: '20',
  id: 'final',
  title: 'Final challenge',
  subtitle: 'One dashboard, every tool in its lane',

  explain: [
    'One screen, three kinds of state, and the whole point is that they do not overlap.',
    "The job list and the selected job's detail come from the server, so React Query owns them: keys, caching, background refetch, polling, invalidation after the upload. Nothing about that data lives in a component.",
    'Whether the filter drawer is open, which status is filtered, which row is selected — none of that exists on any server. It is client state, shared across the tree, so zustand owns it.',
    'The interval handle driving the elapsed clock and the previous status you compare against are values the render output never displays. Refs own those: writing to `.current` must not schedule a render.',
    'If you can place a new piece of state in the right lane out loud, and say why, you can answer almost any state management question they ask.'
  ],

  interview: 'I split state by ownership rather than by library preference: anything the server is the source of truth for goes to React Query, anything that only exists in this browser session goes to a small client store like zustand, and anything the UI never renders — timer handles, previous values — goes in a ref. Most state bugs I have seen came from caching server data in client state and then having to keep the copies in sync.',

  challenges: [
    {
      id: 'L20-A',
      title: 'The whole dashboard',

      brief: [
        '**React Query:** the jobs list, the upload mutation with invalidation, and polling the selected job until it is done.',
        '**Zustand:** `filtersOpen`, `statusFilter`, `selectedId` — and the components that read them use selectors.',
        '**useRef:** the interval handle for the elapsed clock, and the previous status so you can announce completion once.',
        'This is the long one. Work top to bottom through the TODOs; each block is a lesson you have already done.'
      ],

      starter: [
        "// L08 · Extraction dashboard — server state, client state, refs",
        "",
        "// ---- client state (zustand) ------------------------------------------",
        "const useUiStore = create(set => ({",
        "  filtersOpen: false,",
        "  statusFilter: 'all',",
        "  selectedId: null,",
        "  // TODO 1: toggleFilters(), setStatusFilter(value), select(id)",
        "}));",
        "",
        "// ---- server state (react query) --------------------------------------",
        "function JobList() {",
        "  // TODO 2: useQuery for ['jobs'] with mockApi.listJobs",
        "  //         handle isPending / isError+refetch / empty / list",
        "  const statusFilter = useUiStore(s => s.statusFilter);",
        "  const selectedId = useUiStore(s => s.selectedId);",
        "  // TODO 3: select() from the store, and filter the rows by statusFilter",
        "  const jobs = [];",
        "",
        "  return (",
        "    <div className=\"space-y-2\">",
        "      {jobs.map(j => <JobRow key={j.id} job={j} selected={j.id === selectedId} onClick={() => {}} />)}",
        "    </div>",
        "  );",
        "}",
        "",
        "function UploadBar() {",
        "  // TODO 4: useMutation for mockApi.uploadDocument, invalidate ['jobs'] onSuccess,",
        "  //         disable while isPending, show the error",
        "  return (",
        "    <button className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">",
        "      Upload document",
        "    </button>",
        "  );",
        "}",
        "",
        "// ---- refs: values the UI does not render ------------------------------",
        "function JobDetail() {",
        "  const selectedId = useUiStore(s => s.selectedId);",
        "  const [elapsed, setElapsed] = useState(0);",
        "  const [notice, setNotice] = useState('');",
        "",
        "  // TODO 5: useQuery(['job', selectedId]) with enabled + a refetchInterval",
        "  //         function that returns false once status === 'done'",
        "  const job = null;",
        "",
        "  // TODO 6: timerRef holds a setInterval that ticks 'elapsed' once a second",
        "  //         while the job is processing. Clear it when done and on unmount.",
        "",
        "  // TODO 7: prevStatusRef remembers the last status. When it goes",
        "  //         processing -> done, setNotice once.",
        "",
        "  if (!selectedId) return <p className=\"text-sm text-slate-500\">Select a job to see its detail.</p>;",
        "  if (!job) return <div className=\"flex items-center gap-2 text-sm text-slate-500\"><Spinner />Loading job...</div>;",
        "",
        "  return (",
        "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
        "      <div className=\"flex items-center justify-between\">",
        "        <span className=\"text-sm\">{job.file}</span>",
        "        <StatusPill status={job.status} />",
        "      </div>",
        "      <div className=\"mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200\">",
        "        <div className=\"h-full bg-blue-600 transition-all duration-500\" style={{ width: job.progress + '%' }} />",
        "      </div>",
        "      <p className=\"mt-2 font-mono text-[11px] text-slate-500\">{job.progress + '% · ' + elapsed + 's elapsed'}</p>",
        "      {notice ? <p className=\"mt-1 font-mono text-[11px] text-green-600\">{notice}</p> : null}",
        "    </div>",
        "  );",
        "}",
        "",
        "function FilterDrawer() {",
        "  const filtersOpen = useUiStore(s => s.filtersOpen);",
        "  // TODO 8: read toggleFilters and setStatusFilter with selectors",
        "  return (",
        "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
        "      <button className=\"font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500\">",
        "        {(filtersOpen ? 'hide' : 'show') + ' filters'}",
        "      </button>",
        "    </div>",
        "  );",
        "}",
        "",
        "function App() {",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <UploadBar />",
        "      <FilterDrawer />",
        "      <div className=\"grid gap-3 lg:grid-cols-2\">",
        "        <JobList />",
        "        <JobDetail />",
        "      </div>",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Before writing anything, go through the eight TODOs and label each one: server state, client state, or neither. The labels tell you which hook to reach for, and nothing here needs a tool you have not already used.',
        'The trap in a dashboard this size is letting the lanes bleed. Copying the fetched jobs into the zustand store would feel tidy and would immediately give you two copies to keep in sync. The store holds only what no server knows about: which drawer is open, which filter is active, which row is selected.',
        "Store: `toggleFilters: () => set(s => ({ filtersOpen: !s.filtersOpen }))`, `setStatusFilter: value => set({ statusFilter: value })`, `select: id => set(s => ({ selectedId: s.selectedId === id ? null : id }))`. JobList: `useQuery({ queryKey: ['jobs'], queryFn: mockApi.listJobs })`. JobDetail: `enabled: Boolean(selectedId)` plus the self-stopping `refetchInterval`, a `timerRef` for the clock, and a `prevStatusRef` for the notice.",
        "The two halves people get wrong. The store:\n\n  const useUiStore = create(set => ({\n    filtersOpen: false,\n    statusFilter: 'all',\n    selectedId: null,\n    toggleFilters: () => set(s => ({ filtersOpen: !s.filtersOpen })),\n    setStatusFilter: value => set({ statusFilter: value }),\n    select: id => set(s => ({ selectedId: s.selectedId === id ? null : id }))\n  }));\n\nAnd the ref pair in JobDetail:\n\n  useEffect(() => {\n    if (!job || job.status !== 'processing') return;\n    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);\n    return () => clearInterval(timerRef.current);\n  }, [job && job.status]);\n\n  useEffect(() => {\n    if (!job) return;\n    if (prevStatusRef.current === 'processing' && job.status === 'done') {\n      setNotice('Extraction finished');\n    }\n    prevStatusRef.current = job.status;   // after comparing\n  }, [job && job.status]);"
      ],

      checks: [
        {
          label: 'Jobs list comes from useQuery',
          test: function (s) { return /useQuery\s*\(/.test(s) && /queryKey\s*:\s*\[\s*['"]jobs['"]\s*\]/.test(s); },
          hint: '`useQuery({ queryKey: ["jobs"], queryFn: mockApi.listJobs })` inside JobList. Server data never goes in the zustand store.'
        },
        {
          label: 'Upload mutates and invalidates',
          test: function (s) { return /useMutation\s*\(/.test(s) && /invalidateQueries\s*\(/.test(s); },
          hint: '`useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }) })`.'
        },
        {
          label: 'Detail query polls and stops',
          test: function (s) { return /refetchInterval\s*:\s*(\(|\w+\s*=>|function)/.test(s) && /enabled\s*:/.test(s); },
          hint: '`enabled: Boolean(selectedId)` plus `refetchInterval: query => query.state.data && query.state.data.status === "done" ? false : 1500`.'
        },
        {
          label: 'UI store exposes its three actions',
          test: function (s) { return /toggleFilters\s*:/.test(s) && /setStatusFilter\s*:/.test(s) && /select\s*:/.test(s); },
          hint: 'Define all three inside `create(set => ({ ... }))` — the components should never call setState on the store directly.'
        },
        {
          label: 'Every store read uses a selector',
          test: function (s) { return !/useUiStore\s*\(\s*\)/.test(s) && count(s, /useUiStore\s*\(\s*\(?\s*s\w*\s*\)?\s*=>/g) >= 5; },
          hint: '`useUiStore(s => s.selectedId)`, one value per call. A bare `useUiStore()` subscribes the component to every field.'
        },
        {
          label: 'Timer handle lives in a ref',
          test: function (s) { return /useRef\s*\(/.test(s) && /(timer|interval)\w*Ref\s*\.\s*current/i.test(s); },
          hint: '`const timerRef = useRef(null); timerRef.current = setInterval(...)`. The elapsed clock is state; the handle that drives it is not.'
        },
        {
          label: 'Previous status tracked in a ref',
          test: function (s) { return /prev\w*Ref/i.test(s); },
          hint: '`const prevStatusRef = useRef(null)`, compared in an effect on `[status]` and assigned afterwards, so the completion notice fires exactly once.'
        },
        {
          label: 'Interval is cleaned up',
          test: function (s) { return /clearInterval\s*\(/.test(s) && /return\s*\(\s*\)\s*=>/.test(s); },
          hint: 'Return `() => clearInterval(timerRef.current)` from the effect, so switching jobs or unmounting cannot leave a timer running.'
        }
      ]
    }
  ]
};
