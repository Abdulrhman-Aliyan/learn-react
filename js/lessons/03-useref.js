/* 03 · useRef
   Explanation and challenge ported from the original lab. No guided
   walkthrough yet — add a `steps` array to `guided` to give it one. */

import { count } from './helpers.js';

export default {
  n: '03',
  id: 'useref',
  title: 'useRef',
  subtitle: 'Focus, timer handles, previous values',

  explain: [
    '`useRef` gives you one mutable box, `{ current }`, that survives every render and **never triggers one**. That last part is the whole reason it exists.',
    'Two jobs. First, DOM handles: put `ref={inputRef}` on an element and React fills `inputRef.current` with the node, so you can call `.focus()` or `.scrollIntoView()`. Second, instance values the UI does not display: a `setInterval` id you need in order to clear it, a "has this already run" flag, the previous value of a prop.',
    'Choose by asking one question: does the screen change when this value changes? If yes, it is state. If no, it is a ref. Storing a timer id in state re-renders the component on every poll tick for nothing.',
    'The rule that follows: do not read a ref during render to decide what to draw. React never re-renders when `.current` changes, so the screen would show a value from a previous render and never correct itself.'
  ],

  interview: 'A ref is for values the render output does not depend on — DOM nodes, timer handles, the previous value — because writing to .current never schedules a render. If the UI has to change when the value changes, that is state, not a ref.',

  challenges: [{
    id: 'L03-C',
    title: 'Three refs, three jobs',

    brief: [
      'Focus the search box on mount with a DOM ref.',
      'Hold the polling interval id in a ref, not state — watch the render counter stop climbing.',
      'Keep the previous status in a ref so you can announce the `processing → done` transition.',
      'Clear the interval if the component unmounts mid-poll.'
    ],

    starter: [
      "// L03 challenge · Search box, poll handle, previous value",
      "// Run it and start polling: the render counter climbs twice per tick,",
      "// because the interval id is sitting in state.",
      "",
      "function App() {",
      "  const renders = useRenderCount();",
      "  const [query, setQuery] = useState('');",
      "  const [job, setJob] = useState({ id: 'job_1002', file: 'contract-acme-v3.pdf', status: 'queued', progress: 0 });",
      "  const [timerId, setTimerId] = useState(null);   // TODO 2: wrong tool for this value",
      "  const [notice, setNotice] = useState('');",
      "",
      "  // TODO 1: focus the search input once, on mount, using a ref",
      "",
      "  // TODO 3: remember the previous status, and when it goes processing -> done,",
      "  //         setNotice('Extraction finished'). A ref is the standard way to keep",
      "  //         the previous value of something.",
      "",
      "  function startPolling() {",
      "    if (timerId) return;",
      "    const id = setInterval(() => {",
      "      setJob(prev => {",
      "        const progress = Math.min(100, prev.progress + 25);",
      "        return { ...prev, progress, status: progress >= 100 ? 'done' : 'processing' };",
      "      });",
      "    }, 700);",
      "    setTimerId(id);",
      "  }",
      "",
      "  function stopPolling() {",
      "    clearInterval(timerId);",
      "    setTimerId(null);",
      "  }",
      "",
      "  useEffect(() => {",
      "    // TODO 4: stop the timer if this component unmounts mid-poll",
      "  }, []);",
      "",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      <input",
      "        value={query}",
      "        onChange={e => setQuery(e.target.value)}",
      "        placeholder=\"Search documents (should be focused already)\"",
      "        className=\"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900\"",
      "      />",
      "      <Panel title={'job ' + job.id} count={renders}>",
      "        <div className=\"flex items-center justify-between\">",
      "          <span className=\"text-sm\">{job.file}</span>",
      "          <StatusPill status={job.status} />",
      "        </div>",
      "        <div className=\"mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200\">",
      "          <div className=\"h-full bg-blue-600 transition-all\" style={{ width: job.progress + '%' }} />",
      "        </div>",
      "        {notice ? <p className=\"mt-2 font-mono text-[11px] text-green-600\">{notice}</p> : null}",
      "      </Panel>",
      "      <div className=\"flex gap-2\">",
      "        <button onClick={startPolling} className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">Start polling</button>",
      "        <button onClick={stopPolling} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Stop</button>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    hints: [
      'Start polling and watch the render badge. Two renders per tick, but only one thing on screen actually changed. What is the second render for?',
      'The interval id is in state, so every `setTimerId` schedules a render for a value nothing on screen displays. That is the tell: if the render output does not depend on it, it belongs in a ref. The same reasoning covers the DOM node and the previous status — neither is drawn directly.',
      'Three refs: `const searchRef = useRef(null)` on the input plus `searchRef.current.focus()` in a mount effect; `const timerRef = useRef(null)` replacing the timerId state; `const prevStatusRef = useRef(job.status)` compared in an effect on `[job.status]`.',
      'For the previous-value ref, order matters:\n\n  useEffect(() => {\n    if (prevStatusRef.current === \'processing\' && job.status === \'done\') {\n      setNotice(\'Extraction finished\');\n    }\n    prevStatusRef.current = job.status;   // write AFTER comparing\n  }, [job.status]);\n\nAssigning before the comparison is the classic off-by-one — the ref already holds the new value, so the transition never fires.'
    ],

    checks: [
      {
        label: 'Three refs declared',
        test: function (s) { return count(s, /useRef\s*\(/g) >= 3; },
        hint: 'You need one for the input node, one for the interval id, one for the previous status.'
      },
      {
        label: 'Search input is focused on mount',
        test: function (s) { return /ref\s*=\s*\{/.test(s) && /\.current\s*\.\s*focus\s*\(/.test(s); },
        hint: 'Attach `ref={searchRef}` to the input, then call `searchRef.current.focus()` inside a useEffect with `[]` deps — the node does not exist until after the first render.'
      },
      {
        label: 'Timer id moved out of state',
        test: function (s) { return !/\[\s*timerId\s*,\s*set/.test(s) && /(timer|interval|poll)\w*Ref\s*\.\s*current/i.test(s); },
        hint: 'Delete the useState for timerId and use `timerRef.current = setInterval(...)`. Keeping the handle in state re-renders the component every time you start or stop, for a value nothing on screen displays.'
      },
      {
        label: 'Previous status kept in a ref',
        test: function (s) { return /prev\w*Ref\s*\.\s*current/i.test(s); },
        hint: '`const prevStatusRef = useRef(job.status)`, then in an effect on `[job.status]`: compare first, assign `prevStatusRef.current = job.status` after.'
      },
      {
        label: 'Interval cleared on unmount',
        test: function (s) { return /return\s*\(\s*\)\s*=>[\s\S]{0,60}clearInterval/.test(s); },
        hint: 'Add an unmount-only effect: `useEffect(() => () => clearInterval(timerRef.current), []);`'
      }
    ]
  }]
};
