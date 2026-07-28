/* 01 · useState
   Guided task: a job queue that does not react yet.
   Challenge:   the stale closure trap. */

export default {
  n: '01',
  id: 'usestate',
  title: 'useState',
  subtitle: 'Job list, selection, filter',

  explain: [
    'State is a `snapshot`, not a variable. Every render gets its own frozen copy of every value it read, and calling a setter does not change that copy — it schedules another render with a new one. That single fact explains most useState bugs.',
    'There are two ways to update. `setJobs(next)` uses the value this render closed over. `setJobs(prev => next)` asks React for the latest queued value instead. Whenever the new value depends on the old one — counters, toggles, appending to a list, anything inside a loop, timer, or async callback — use the function form. The direct form reads a value that may already be stale.',
    'Second rule: never mutate. React compares with `Object.is`, so `jobs.push(job)` hands back the same array reference and nothing re-renders. Produce a new array or object instead.',
    'Third: do not store what you can compute. A filtered list is derived from `jobs` and `filter` during render. Putting it in state gives you two sources of truth, and they drift apart.'
  ],

  interview: 'State is a snapshot per render, so I reach for the functional updater whenever the next value depends on the previous one — that is the difference between a bulk retry that counts 3 and one that counts 1. And I derive filtered lists during render instead of storing them, so there is only one source of truth.',

  guided: {
    id: 'L01-G',
    title: 'Make the queue actually react',

    starter: [
      "// L01 · Job queue with a filter box",
      "//",
      "// Run this first: nothing on this screen responds to anything you do.",
      "// Every marked line below is one reason why.",
      "//",
      "// Each step replaces exactly one marked line. They are numbered in the",
      "// order you will do them, which is NOT top to bottom in this file —",
      "// step 3 is the filter input, further down in the JSX.",
      "",
      "const SEED = [",
      "  { id: 'job_1001', file: 'invoice-4417.pdf',      status: 'queued',     pages: 3 },",
      "  { id: 'job_1002', file: 'contract-acme-v3.pdf',  status: 'processing', pages: 18 },",
      "  { id: 'job_1003', file: 'receipt-scan-0091.jpg', status: 'failed',     pages: 1 },",
      "  { id: 'job_1004', file: 'w9-form-signed.pdf',    status: 'done',       pages: 2 }",
      "];",
      "",
      "function App() {",
      "  let jobs = SEED;              // STEP 1 · a plain variable. React never hears it change.",
      "",
      "  let filter = '';              // STEP 2 · also plain, and the input never writes to it.",
      "",
      "  const visible = jobs;         // STEP 4 · every row, always. The filter is not applied.",
      "",
      "  function markDone(id) {",
      "    jobs.find(j => j.id === id).status = 'done';   // STEP 5 · edits in place. Same array, so React sees nothing.",
      "  }",
      "",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      <input value=\"\" placeholder=\"Filter by filename...\" className=\"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900\" />{/* STEP 3 · value is hard-coded, so typing does nothing */}",
      "",
      "      <div className=\"space-y-2\">",
      "        {visible.map(j => <JobRow key={j.id} job={j} onClick={() => markDone(j.id)} />)}",
      "      </div>",
      "",
      "      <p className=\"font-mono text-[11px] text-slate-500\">",
      "        {visible.length + ' of ' + jobs.length + ' shown · click a row to mark it done'}",
      "      </p>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Put the queue in state',
        do: 'Find the line marked `STEP 1`. It reads `let jobs = SEED;`. Replace it so the queue is React state instead: `const [jobs, setJobs] = useState(SEED);`',
        why: 'A plain `let` is rebuilt from scratch on every render and React has no idea when it changes. `useState` hands you a value plus a setter, and calling that setter is what tells React to render again. Nothing else on this page can work until this line is right.',
        reveal: {
          anchor: 'STEP 1',
          code: '  const [jobs, setJobs] = useState(SEED);'
        },
        checks: [
          {
            label: 'jobs comes from useState',
            test: function (s) { return /\[\s*jobs\s*,\s*set\w+\s*\]\s*=\s*useState\s*\(/.test(s); },
            hint: 'Write `const [jobs, setJobs] = useState(SEED);`. The square brackets are array destructuring — useState returns a two-element array, and this names both halves at once.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Put the filter text in state too',
        do: 'The line marked `STEP 2` reads `let filter = \'\';`. Make it state as well: `const [filter, setFilter] = useState(\'\');`',
        why: 'The text in the box has to survive re-renders and it has to be something React can change. Same reasoning as step 1 — an empty string starts it off, because the box starts empty.',
        reveal: {
          anchor: 'STEP 2',
          code: "  const [filter, setFilter] = useState('');"
        },
        checks: [
          {
            label: 'filter comes from useState',
            test: function (s) { return /\[\s*filter\s*,\s*set\w+\s*\]\s*=\s*useState\s*\(/.test(s); },
            hint: "Write `const [filter, setFilter] = useState('');` — the initial value is an empty string, so the input starts blank."
          }
        ]
      },
      {
        id: 's3',
        title: 'Make the input controlled',
        do: 'The input on the line marked `STEP 3` ignores everything you type, because its `value` is hard-coded to an empty string. Give it the state value and a way to report edits: `value={filter}` and `onChange={e => setFilter(e.target.value)}`.',
        why: 'This is what "controlled input" means — React owns the text, so it needs both halves. With only `value` the box is frozen. With only `onChange` React and the DOM disagree about what is in the box. Always both.',
        reveal: {
          anchor: 'STEP 3',
          code: '      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by filename..." className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />'
        },
        checks: [
          {
            label: 'Input is controlled by filter',
            test: function (s) { return /value\s*=\s*\{\s*filter\s*\}/.test(s) && /onChange\s*=/.test(s); },
            hint: 'A controlled input needs `value={filter}` and `onChange={e => setFilter(e.target.value)}` on the same element. `e.target.value` is the text the box now holds.'
          }
        ]
      },
      {
        id: 's4',
        title: 'Derive the visible rows during render',
        do: 'The line marked `STEP 4` reads `const visible = jobs;`, so the filter box changes nothing. Compute the visible rows from `jobs` and `filter` right there: `const visible = jobs.filter(j => j.file.toLowerCase().includes(filter.toLowerCase()));`',
        why: 'This is the "derive, do not store" rule. It is tempting to add a third `useState` for the filtered list and keep it in sync with an effect — do not. Two sources of truth drift apart, and the bug is always subtle. Computing it during render means it cannot be stale. Lower-casing both sides makes the search case-insensitive.',
        reveal: {
          anchor: 'STEP 4',
          code: '  const visible = jobs.filter(j => j.file.toLowerCase().includes(filter.toLowerCase()));'
        },
        checks: [
          {
            label: 'Visible rows are derived, not stored',
            test: function (s) {
              return !/\[\s*(visible|filtered|filteredJobs|results)\s*,\s*set/.test(s) && /\.filter\s*\(/.test(s);
            },
            hint: 'Compute it with `jobs.filter(...)` directly in the render body. A second `useState` for the filtered list is the classic duplicated-state bug.'
          },
          {
            label: 'Filtering is case-insensitive',
            test: function (s) { return /toLowerCase\s*\(\s*\)/.test(s); },
            hint: 'Lower-case both sides: `j.file.toLowerCase().includes(filter.toLowerCase())`. Otherwise typing "Invoice" finds nothing.'
          }
        ]
      },
      {
        id: 's5',
        title: 'Mark a row done without mutating',
        do: 'The line marked `STEP 5` reaches into the array and assigns `.status = \'done\'`. Replace it with an immutable update: `setJobs(prev => prev.map(j => j.id === id ? { ...j, status: \'done\' } : j));`',
        why: 'Assigning `job.status` changes the object React is already holding, so the array reference never changes, `Object.is` reports no difference, and nothing re-renders — the click looks broken even though the data changed. `.map` builds a new array, and `{ ...j, status: \'done\' }` builds a new object for just the row that moved. Everything else keeps its identity.',
        reveal: {
          anchor: 'STEP 5',
          code: "    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done' } : j));"
        },
        checks: [
          {
            label: 'markDone updates immutably',
            test: function (s) {
              return /set\w*Jobs?\s*\(/.test(s) && /\.map\s*\(/.test(s) && !/\.status\s*=[^=]/.test(s);
            },
            hint: 'Build a new array: `setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "done" } : j));` and delete the line that assigns `.status` directly.'
          }
        ]
      }
    ]
  },

  challenges: [{
    id: 'L01-C',
    title: 'The stale closure trap',

    brief: [
      '`Retry all 3` should count to 3. It counts to 1.',
      '`Retry in 1.5s` reads a value captured when you clicked, not the current one. Click it, then click it again quickly.',
      'Fix both with functional updates. Do not add refs or effects.'
    ],

    starter: [
      "// L01 challenge · Bulk retry counters",
      "// Run it, click both buttons, and watch them under-count.",
      "",
      "const FAILED = ['job_1003', 'job_1007', 'job_1009'];",
      "",
      "function App() {",
      "  const [retried, setRetried] = useState(0);",
      "  const [queued, setQueued] = useState(0);",
      "",
      "  function retryAll() {",
      "    // Three calls, but 'retried' is the same number in all three.",
      "    FAILED.forEach(id => {",
      "      setRetried(retried + 1);",
      "    });",
      "  }",
      "",
      "  function retryLater() {",
      "    // This closure captured 'queued' at click time.",
      "    setTimeout(() => {",
      "      setQueued(queued + 1);",
      "    }, 1500);",
      "  }",
      "",
      "  return (",
      "    <div className=\"space-y-4\">",
      "      <div className=\"grid grid-cols-2 gap-3\">",
      "        <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
      "          <div className=\"font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500\">retried now</div>",
      "          <div className=\"text-3xl font-semibold\">{retried}</div>",
      "          <div className=\"font-mono text-[10px] text-slate-500\">expected 3 per click</div>",
      "        </div>",
      "        <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
      "          <div className=\"font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500\">queued later</div>",
      "          <div className=\"text-3xl font-semibold\">{queued}</div>",
      "          <div className=\"font-mono text-[10px] text-slate-500\">click 3x fast, expect 3</div>",
      "        </div>",
      "      </div>",
      "      <div className=\"flex gap-2\">",
      "        <button onClick={retryAll} className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">Retry all 3</button>",
      "        <button onClick={retryLater} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Retry in 1.5s</button>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    hints: [
      'Both counters read a number that was decided before the click finished. What is the value of `retried` on the second pass through that `forEach`?',
      'Every render has its own frozen copy of `retried`. All three `setRetried(retried + 1)` calls in one click see the same copy — `0` — so all three set it to `1`. The updater form `setRetried(r => r + 1)` is different: React runs it against the latest queued value at flush time, so the three calls chain.',
      'In `retryAll`, replace `setRetried(retried + 1)` with `setRetried(r => r + 1)`. In `retryLater`, replace `setQueued(queued + 1)` with `setQueued(q => q + 1)`.',
      'Both handlers become one line each:\n\n  FAILED.forEach(id => { setRetried(r => r + 1); });\n\n  setTimeout(() => { setQueued(q => q + 1); }, 1500);\n\nThat is the whole fix — no refs, no effects.'
    ],

    checks: [
      {
        label: 'retryAll uses a functional update',
        test: function (s) { return /setRetried\s*\(\s*\(?\s*\w+\s*\)?\s*=>/.test(s); },
        hint: '`setRetried(r => r + 1)`. Inside the forEach, `retried` is the same captured number three times, so three calls all set it to 1.'
      },
      {
        label: 'retryLater uses a functional update',
        test: function (s) { return /setQueued\s*\(\s*\(?\s*\w+\s*\)?\s*=>/.test(s); },
        hint: '`setQueued(q => q + 1)`. The setTimeout callback closed over `queued` 1.5 seconds ago; the updater form is evaluated when React flushes instead.'
      },
      {
        label: 'No direct reads of the captured value',
        test: function (s) { return !/set(Retried|Queued)\s*\(\s*(retried|queued)\s*[+-]/.test(s); },
        hint: 'Remove `setRetried(retried + 1)` and `setQueued(queued + 1)` entirely — those are the stale reads.'
      },
      {
        label: 'No refs or effects were needed',
        test: function (s) { return !/useRef\s*\(/.test(s) && !/useEffect\s*\(/.test(s); },
        hint: 'A ref would also work but it is the wrong answer in an interview: the functional updater is the idiomatic fix and needs no extra machinery.'
      }
    ]
  }]
};
