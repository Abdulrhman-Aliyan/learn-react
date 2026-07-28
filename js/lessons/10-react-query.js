/* 07 · React Query
   Explanation and three challenges ported from the original lab.
   A replaces hand-rolled fetching, B writes, C polls. */

export default {
  n: '10',
  id: 'react-query',
  title: 'React Query',
  subtitle: 'Server state: cache, mutate, poll',

  explain: [
    'React Query manages *server state* — data you do not own, that goes stale on its own, and that several components need at once. `useQuery({ queryKey, queryFn })` gives you a cache entry plus loading, error, refetch, dedupe, and retry for free.',
    "The `queryKey` is the cache identity. `['jobs']` and `['job', id]` are separate entries; change the key and you get a different one. Keys are also the handle you invalidate by.",
    "Mutations do not update the cache. `useMutation({ mutationFn })` sends the write, then in `onSuccess` you call `queryClient.invalidateQueries({ queryKey: ['jobs'] })` and the affected queries refetch themselves.",
    'v5 vocabulary, which interviewers do check: `isPending` means no data yet, `isFetching` means a request is in flight (including background refetches), `isLoading` is both at once. `gcTime` replaced `cacheTime`, and `placeholderData: keepPreviousData` replaced `keepPreviousData: true`. Polling is `refetchInterval`, which can be a function so it can turn itself off.'
  ],

  interview: 'React Query owns server state — the query key is the cache identity, data is stale by default and refetched in the background, and writes go through useMutation and then invalidate the keys they touched rather than patching the cache by hand. That deletes most of the useState-plus-useEffect fetching code, and with it the race conditions.',

  challenges: [
    {
      id: 'L10-A',
      title: 'useQuery: four states',

      brief: [
        'Delete the hand-rolled fetch and replace it with one `useQuery`.',
        'Render all four states: pending, error (with a `Retry` button wired to `refetch`), empty, and the list.',
        'Show a quiet marker while `isFetching` is true but data is already on screen — that is the background refetch.'
      ],

      starter: [
        "// L10-A · The list, without the useEffect ceremony",
        "// mockApi.listJobs() fails ~20% of the time, so run it a few times",
        "// to see the error path.",
        "",
        "function App() {",
        "  const [jobs, setJobs] = useState([]);",
        "  const [loading, setLoading] = useState(true);",
        "  const [error, setError] = useState(null);",
        "",
        "  useEffect(() => {",
        "    let cancelled = false;",
        "    mockApi.listJobs()",
        "      .then(d => { if (!cancelled) { setJobs(d); setLoading(false); } })",
        "      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });",
        "    return () => { cancelled = true; };",
        "  }, []);",
        "",
        "  // TODO 1: delete all of the above and use:",
        "  //   useQuery({ queryKey: ['jobs'], queryFn: mockApi.listJobs })",
        "  // TODO 2: handle isPending / isError / empty list / success",
        "  // TODO 3: give the error branch a Retry button that calls refetch()",
        "  // TODO 4: when isFetching is true but data already exists, show 'refreshing'",
        "",
        "  if (loading) return <div className=\"flex items-center gap-2 text-sm text-slate-500\"><Spinner />Loading queue...</div>;",
        "  if (error) return <div className=\"rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700\">{error}</div>;",
        "",
        "  return (",
        "    <div className=\"space-y-2\">",
        "      {jobs.map(j => <JobRow key={j.id} job={j} />)}",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Count the things the twenty lines at the top are doing: fetching, tracking loading, tracking errors, and cancelling. `useQuery` does all four. What is left for you is deciding what to render in each state.',
        'Four render branches, and the v5 names matter. `isPending` is "no data yet" — the first-load branch. `isLoading` is `isPending && isFetching`, which is *not* what you want here. `isFetching` alone is true during background refetches too, which is how you show "refreshing" over data that is already on screen. And zero rows is a success, not an error.',
        "Replace the whole top with:\n\n  const { data, isPending, isError, error, isFetching, refetch } = useQuery({\n    queryKey: ['jobs'],\n    queryFn: mockApi.listJobs\n  });\n\nThen branch on isPending, isError, data.length === 0, and finally the list.",
        "The four branches:\n\n  if (isPending) return <div className=\"flex items-center gap-2 text-sm text-slate-500\"><Spinner />Loading queue...</div>;\n\n  if (isError) return (\n    <div className=\"space-y-3 rounded-lg border border-red-200 bg-red-50 p-3\">\n      <p className=\"text-sm text-red-700\">{error.message}</p>\n      <button onClick={() => refetch()} className=\"rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700\">Retry</button>\n    </div>\n  );\n\n  if (data.length === 0) return <p className=\"text-sm text-slate-500\">No documents yet.</p>;\n\n  return (\n    <div className=\"space-y-2\">\n      {isFetching ? <span className=\"font-mono text-[10px] text-blue-600\">refreshing</span> : null}\n      {data.map(j => <JobRow key={j.id} job={j} />)}\n    </div>\n  );\n\nNote `onClick={() => refetch()}` rather than `onClick={refetch}` — passing it directly hands the click event in as options."
      ],

      checks: [
        {
          label: 'useQuery with a key and a fetcher',
          test: function (s) { return /useQuery\s*\(/.test(s) && /queryKey\s*:/.test(s) && /queryFn\s*:/.test(s); },
          hint: '`useQuery({ queryKey: ["jobs"], queryFn: mockApi.listJobs })`. The key is the cache identity — everything else in this lesson hangs off it.'
        },
        {
          label: 'Hand-rolled fetching is gone',
          test: function (s) { return !/useEffect\s*\(/.test(s) && !/useState\s*\(/.test(s); },
          hint: 'Remove the three useStates and the useEffect entirely. If any of them survive you now have two sources of truth for the same data.'
        },
        {
          label: 'Pending state handled',
          test: function (s) { return /isPending/.test(s); },
          hint: '`if (isPending) return <Spinner/>`. In v5 isPending means "no data yet"; isLoading is `isPending && isFetching`, which is not what you want for a first-load branch.'
        },
        {
          label: 'Error state offers a retry',
          test: function (s) { return /isError/.test(s) && /refetch\s*\(/.test(s); },
          hint: 'Destructure `refetch` from useQuery and wire it to a button: `onClick={() => refetch()}`. Passing refetch directly as the handler leaks the click event into it as options.'
        },
        {
          label: 'Empty state distinguished from loading',
          test: function (s) { return /length\s*===\s*0/.test(s) || /!\s*data\s*\.\s*length/.test(s); },
          hint: 'A successful response with zero rows is not an error and not loading — check `data.length === 0` and say something useful.'
        },
        {
          label: 'Background refetch is visible',
          test: function (s) { return /isFetching/.test(s); },
          hint: 'Show a marker when `isFetching` is true and data already exists. That is the difference React Query gives you over a raw fetch: stale data stays on screen while it revalidates.'
        }
      ]
    },

    {
      id: 'L10-B',
      title: 'useMutation and invalidate',

      brief: [
        'Send the upload through `useMutation`.',
        "On success, invalidate `['jobs']` so the list refetches itself. Do not patch the array by hand.",
        'Disable the button while `isPending`, and surface the failure — uploads fail ~20% of the time.'
      ],

      starter: [
        "// L10-B · Upload a document, then make the list catch up",
        "",
        "function App() {",
        "  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: mockApi.listJobs });",
        "  const [name, setName] = useState('purchase-order-77.pdf');",
        "",
        "  // TODO 1: replace this with useMutation({ mutationFn: ... })",
        "  function upload() {",
        "    mockApi.uploadDocument({ file: name });",
        "  }",
        "",
        "  // TODO 2: get the query client with useQueryClient()",
        "  // TODO 3: in onSuccess, invalidate the ['jobs'] key so the list refetches",
        "  // TODO 4: disable the button while the upload is in flight, and show the error",
        "",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <div className=\"flex gap-2\">",
        "        <input",
        "          value={name}",
        "          onChange={e => setName(e.target.value)}",
        "          className=\"flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900\"",
        "        />",
        "        <button onClick={upload} className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">",
        "          Upload",
        "        </button>",
        "      </div>",
        "      <div className=\"space-y-2\">",
        "        {jobs.map(j => <JobRow key={j.id} job={j} />)}",
        "      </div>",
        "      <p className=\"font-mono text-[11px] text-slate-500\">{jobs.length + ' jobs in the queue'}</p>",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'The upload works — the list just never finds out about it. Whose job is it to tell the list that its cached data is now out of date?',
        'The instinct is to push the new job onto the cached array by hand. Resist it: you would be guessing what the server did, and your guess drifts from reality. `invalidateQueries` marks the key stale and lets it refetch the truth. In v5 it takes a filters object — `{ queryKey: [...] }` — not a bare key.',
        "`const queryClient = useQueryClient();` then `const upload = useMutation({ mutationFn: file => mockApi.uploadDocument({ file }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }) });` and fire it with `onClick={() => upload.mutate(name)}`.",
        "The mutation and its button:\n\n  const upload = useMutation({\n    mutationFn: file => mockApi.uploadDocument({ file: file }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['jobs'] });\n    }\n  });\n\n  <button\n    onClick={() => upload.mutate(name)}\n    disabled={upload.isPending}\n    className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-40\">\n    {upload.isPending ? 'Uploading...' : 'Upload'}\n  </button>\n\n  {upload.isError ? <p className=\"...text-red-700\">{upload.error.message}</p> : null}"
      ],

      checks: [
        {
          label: 'Upload goes through useMutation',
          test: function (s) { return /useMutation\s*\(/.test(s) && /mutationFn\s*:/.test(s); },
          hint: '`const upload = useMutation({ mutationFn: file => mockApi.uploadDocument({ file }) })`. The mutation object is what gives you isPending, isError and error.'
        },
        {
          label: 'Query client obtained',
          test: function (s) { return /useQueryClient\s*\(\s*\)/.test(s); },
          hint: '`const queryClient = useQueryClient()` — inside the component. It reaches the same client the provider mounted.'
        },
        {
          label: 'onSuccess invalidates the jobs key',
          test: function (s) { return /onSuccess/.test(s) && /invalidateQueries\s*\(/.test(s) && /queryKey\s*:\s*\[\s*['"]jobs['"]/.test(s); },
          hint: '`onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] })`. In v5 invalidateQueries takes a filters object, not a bare key.'
        },
        {
          label: 'Mutation is actually fired',
          test: function (s) { return /\.mutate\s*\(/.test(s) || /mutateAsync\s*\(/.test(s); },
          hint: '`onClick={() => upload.mutate(name)}`. Calling mutate is what runs mutationFn; declaring the mutation does nothing on its own.'
        },
        {
          label: 'Button disabled while in flight',
          test: function (s) { return /disabled\s*=\s*\{[^}]*isPending/.test(s); },
          hint: '`disabled={upload.isPending}` — otherwise a double click uploads twice, which is the demo failure everyone has seen.'
        },
        {
          label: 'Upload failure is surfaced',
          test: function (s) { return /isError/.test(s) || /onError/.test(s); },
          hint: 'Render `upload.error.message` when `upload.isError`. A silently swallowed 503 is the bug the interviewer is looking for.'
        }
      ]
    },

    {
      id: 'L10-C',
      title: 'Poll until the job is done',

      brief: [
        'The query must not run before a job exists — use `enabled`.',
        "Poll every 1500ms with `refetchInterval`, and **stop** once `status === 'done'`. Pass a function, not a number.",
        'Watch the sandbox log: when it stops, the polling stopped.'
      ],

      starter: [
        "// L10-C · A long-running extraction, polled until it finishes",
        "// Each poll advances the job ~25%, so it completes after 4-5 ticks.",
        "",
        "function App() {",
        "  const [jobId, setJobId] = useState(null);",
        "",
        "  const { data: job, isFetching } = useQuery({",
        "    queryKey: ['job', jobId],",
        "    queryFn: () => mockApi.getJob(jobId),",
        "",
        "    // TODO 1: do not run this query until jobId exists",
        "    // TODO 2: refetchInterval takes a function in v5: (query) => number | false.",
        "    //         Poll at 1500ms, and return false once the status is 'done'.",
        "    refetchInterval: 1500",
        "  });",
        "",
        "  function start() {",
        "    mockApi.startExtraction('contract-acme-v3.pdf').then(j => setJobId(j.id));",
        "  }",
        "",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <button onClick={start} className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">",
        "        Start extraction",
        "      </button>",
        "",
        "      {job ? (",
        "        <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
        "          <div className=\"flex items-center justify-between\">",
        "            <span className=\"text-sm\">{job.file}</span>",
        "            <StatusPill status={job.status} />",
        "          </div>",
        "          <div className=\"mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200\">",
        "            <div className=\"h-full bg-blue-600 transition-all duration-500\" style={{ width: job.progress + '%' }} />",
        "          </div>",
        "          <p className=\"mt-2 font-mono text-[11px] text-slate-500\">",
        "            {job.progress + '% · ' + (isFetching ? 'polling...' : 'idle')}",
        "          </p>",
        "          {job.status === 'done' ? (",
        "            <p className=\"mt-1 font-mono text-[11px] text-green-600\">{'confidence ' + job.confidence}</p>",
        "          ) : null}",
        "        </div>",
        "      ) : (",
        "        <p className=\"text-sm text-slate-500\">No job running.</p>",
        "      )}",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Run it before clicking anything and watch the log. The query is already firing — against what id? And once a job does finish, what stops the polling?',
        "Two separate ideas. `enabled: false` means the query does not run at all, which is how you wait for an id instead of caching a failure under `['job', null]`. And `refetchInterval` accepts a function that receives the query, so the poll can inspect the latest data and return `false` to switch itself off — a plain number never can.",
        "Add `enabled: Boolean(jobId)` and change the interval to `refetchInterval: query => query.state.data && query.state.data.status === 'done' ? false : 1500`.",
        "Both options together:\n\n  const { data: job, isFetching } = useQuery({\n    queryKey: ['job', jobId],\n    queryFn: () => mockApi.getJob(jobId),\n\n    // No jobId, no query.\n    enabled: Boolean(jobId),\n\n    // The interval can inspect the query and switch itself off.\n    refetchInterval: query => (\n      query.state.data && query.state.data.status === 'done' ? false : 1500\n    )\n  });\n\nNote it reads `query.state.data`, not the `job` variable from the render scope — that one would be stale inside the interval."
      ],

      checks: [
        {
          label: 'Query is gated on jobId',
          test: function (s) { return /enabled\s*:/.test(s); },
          hint: '`enabled: Boolean(jobId)`. Without it the query runs immediately with a null id, caching a failure under the key `["job", null]`.'
        },
        {
          label: 'refetchInterval is a function',
          test: function (s) { return /refetchInterval\s*:\s*(\(|\w+\s*=>|function)/.test(s) && !/refetchInterval\s*:\s*\d/.test(s); },
          hint: '`refetchInterval: (query) => ...` — a plain number can never turn itself off, which is the whole exercise.'
        },
        {
          label: 'Polling stops when the job is done',
          test: function (s) { return /return\s+false|\?\s*false\s*:|:\s*false/.test(s) && /['"]done['"]/.test(s); },
          hint: 'Return false to stop: `query.state.data && query.state.data.status === "done" ? false : 1500`. Note it reads query.state.data, not a variable from the render scope.'
        },
        {
          label: 'Job id is part of the query key',
          test: function (s) { return /queryKey\s*:\s*\[\s*['"]job['"]\s*,\s*jobId/.test(s); },
          hint: '`queryKey: ["job", jobId]` — the id belongs in the key so each job gets its own cache entry and switching jobs does not show the previous one.'
        }
      ]
    }
  ]
};
