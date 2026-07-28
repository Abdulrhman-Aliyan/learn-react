/* 04 · useReducer
   Guided task: a wizard whose four useStates keep drifting out of sync.
   Challenge:   an undo stack, which is a reducer's home turf. */

import { count } from './helpers.js';

export default {
  n: '04',
  id: 'usereducer',
  title: 'useReducer',
  subtitle: 'State that changes in lockstep',

  explain: [
    '`useReducer` is `useState` for state whose fields move together. You describe transitions once — `(state, action) => nextState` — and components dispatch named actions instead of setting fields one at a time.',
    'The tell that you need it: two or more `useState` calls that you always update in the same breath, and a bug that appears when you forget one of them. Four setters in a row is four chances to leave the UI in a state that should be impossible — loading *and* holding an error, a success flag with no data.',
    'The reducer is a pure function outside your component, which buys three things. It never closes over a stale render, so `dispatch` is safe inside timers, effects and async callbacks without the functional-updater dance. It is trivially unit-testable without React. And every legal transition is written down in one place you can read top to bottom.',
    '`dispatch` is guaranteed stable for the lifetime of the component, so passing it down never invalidates a `memo` or an effect dependency — which is exactly the problem a setter-heavy component keeps running into.',
    'Reach for it when the next state depends on the previous one in a non-trivial way, when several fields must change atomically, or when the same transition is fired from several places. Stay with `useState` for one independent value.'
  ],

  interview: 'I move to useReducer when fields change together, because separate useState calls let the UI reach states that should be impossible — loading and error at once, for instance. The reducer is a pure function, so it never reads a stale closure, it unit tests without React, and dispatch has a stable identity, which matters when it goes through memo or into an effect dependency array.',

  guided: {
    id: 'L04-G',
    title: 'Four useStates that drift apart',

    starter: [
      "// L04 · Upload wizard — three steps, one impossible state",
      "//",
      "// Run it, click Next twice, then Submit. Force a failure and hit Back:",
      "// the error stays on screen while the UI claims to be idle. Four separate",
      "// setters, and every path has to remember all four.",
      "//",
      "// Steps are numbered in the order you do them, not top to bottom.",
      "",
      "const STEPS = ['Choose file', 'Confirm pages', 'Submit'];",
      "",
      "// STEP 1 · INITIAL and the reducer go here",
      "",
      "function App() {",
      "  const [step, setStep] = useState(0);              // STEP 2 · four fields that always move together",
      "  const [file, setFile] = useState('');",
      "  const [status, setStatus] = useState('idle');",
      "  const [error, setError] = useState(null);",
      "",
      "  function next() {",
      "    setStep(s => Math.min(s + 1, 2));               // STEP 3 · forgets to clear the error",
      "  }",
      "",
      "  function back() {",
      "    setStep(s => Math.max(s - 1, 0));               // STEP 4 · same omission, other direction",
      "  }",
      "",
      "  function submit() {",
      "    setStatus('sending');                          // STEP 6 · four setters across three callbacks",
      "    setError(null);",
      "    mockApi.uploadDocument({ file: file || 'untitled.pdf' })",
      "      .then(() => { setStatus('done'); })",
      "      .catch(err => { setStatus('error'); setError(err.message); });",
      "  }",
      "",
      "  return (",
      "    <div className=\"space-y-3\">",
      "      <div className=\"flex gap-2\">",
      "        {STEPS.map((label, i) => (",
      "          <span key={label} className={'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ' +",
      "            (i === step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500')}>{label}</span>",
      "        ))}",
      "      </div>",
      "",
      "      {step === 0 ? (",
      "        <input",
      "          value={file}",
      "          onChange={e => setFile(e.target.value) /* STEP 5 · setFile stops existing at step 2 */}",
      "          placeholder=\"filename.pdf\"",
      "          className=\"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"",
      "        />",
      "      ) : null}",
      "",
      "      {step === 1 ? <p className=\"text-sm text-slate-600\">{'Uploading ' + (file || 'untitled.pdf')}</p> : null}",
      "",
      "      {step === 2 ? (",
      "        <button onClick={submit} disabled={status === 'sending'}",
      "          className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-40\">",
      "          {status === 'sending' ? 'Sending...' : 'Submit'}",
      "        </button>",
      "      ) : null}",
      "",
      "      {error ? <p className=\"rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700\">{error}</p> : null}",
      "      {status === 'done' ? <p className=\"text-sm text-green-700\">Uploaded.</p> : null}",
      "",
      "      <div className=\"flex gap-2\">",
      "        <button onClick={back} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Back</button>",
      "        <button onClick={next} className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Next</button>",
      "      </div>",
      "",
      "      <p className=\"font-mono text-[11px] text-slate-500\">",
      "        {'step ' + step + ' · status ' + status + ' · error ' + (error ? 'yes' : 'no')}",
      "      </p>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Write the reducer and its initial state',
        do: 'Replace the standalone line marked `STEP 1`, just above `function App()`, with the initial state and the reducer: `const INITIAL = { step: 0, file: \'\', status: \'idle\', error: null };` and a `function reducer(state, action)` whose `switch` on `action.type` handles `next`, `back`, `setFile`, `submit`, `succeeded` and `failed`.',
        why: 'The reducer lives *outside* the component on purpose. It closes over nothing, so it can never read a stale value from an old render — which is why `dispatch` is safe inside a `setTimeout` or a `.then` with none of the functional-updater ceremony `useState` needs. It is also a plain function you can unit test without mounting anything.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 1',
          code: "const INITIAL = { step: 0, file: '', status: 'idle', error: null };\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    // Moving between steps always clears a stale error. One place, both directions.\n    case 'next':\n      return { ...state, step: Math.min(state.step + 1, 2), error: null };\n    case 'back':\n      return { ...state, step: Math.max(state.step - 1, 0), error: null };\n    case 'setFile':\n      return { ...state, file: action.value };\n    case 'submit':\n      return { ...state, status: 'sending', error: null };\n    case 'succeeded':\n      return { ...state, status: 'done', error: null };\n    case 'failed':\n      return { ...state, status: 'error', error: action.message };\n    default:\n      return state;\n  }\n}"
        },
        checks: [
          {
            label: 'A reducer function exists',
            test: function (s) { return /function\s+reducer\s*\(\s*state\s*,\s*action\s*\)/.test(s); },
            hint: 'Declare `function reducer(state, action) { ... }` at module level, outside App — that is what keeps it free of stale closures.'
          },
          {
            label: 'It switches on action.type and has a default',
            test: function (s) { return /switch\s*\(\s*action\s*\.\s*type\s*\)/.test(s) && /default\s*:/.test(s); },
            hint: 'Use `switch (action.type)` with a `default: return state;`. Returning the same object for an unknown action means an accidental dispatch cannot corrupt anything.'
          },
          {
            label: 'Every transition returns a new object',
            test: function (s) { return /\.\.\.\s*state/.test(s) && !/state\s*\.\s*\w+\s*=[^=]/.test(s); },
            hint: 'Spread first: `return { ...state, step: ... }`. Assigning `state.step = ...` mutates the object React already holds, so nothing re-renders.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Swap the four useStates for the reducer',
        do: 'The line marked `STEP 2` is the first of four `useState` calls. Replace **all four** with:\n\n`const [state, dispatch] = useReducer(reducer, INITIAL);`\n\nand destructure on the next line — `const { step, file, status, error } = state;` — so the rest of the component keeps working untouched.',
        why: 'Four independent values let the component reach combinations that should not exist: `status: "idle"` while `error` still holds a message. One object behind one transition function makes those unrepresentable, because the only way to change anything is to go through the reducer. Destructuring keeps the JSX below identical, which is what makes this refactor safe to do in one move.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 2',
          lines: 4,
          code: '  const [state, dispatch] = useReducer(reducer, INITIAL);\n  const { step, file, status, error } = state;'
        },
        checks: [
          {
            label: 'useReducer replaces all four useStates',
            test: function (s) { return /useReducer\s*\(/.test(s) && count(s, /useState\s*\(/g) === 0; },
            hint: 'Write `const [state, dispatch] = useReducer(reducer, INITIAL);` and delete every one of the four useState lines. If any survive you still have two sources of truth.'
          },
          {
            label: 'The fields are destructured off state',
            test: function (s) { return /\{[^}]*\bstep\b[^}]*\}\s*=\s*state/.test(s); },
            hint: 'Add `const { step, file, status, error } = state;` so the JSX below can keep referring to `step`, `file`, `status` and `error` by name.'
          }
        ]
      },
      {
        id: 's3',
        title: 'Dispatch instead of setting on the way forward',
        do: 'The line marked `STEP 3` is inside `next()`. Replace it with `dispatch({ type: \'next\' });`',
        why: 'Notice what disappears: the caller no longer decides *how* to advance, or remembers that advancing should also clear the error. It states intent — "next" — and the reducer owns the consequences. That is the whole trade.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 3',
          code: "    dispatch({ type: 'next' });"
        },
        checks: [
          {
            label: 'next() dispatches',
            test: function (s) { return /function\s+next\s*\(\s*\)\s*\{[\s\S]{0,120}?dispatch\s*\(/.test(s); },
            hint: "Inside `next()`, call `dispatch({ type: 'next' })` and remove the setStep call."
          }
        ]
      },
      {
        id: 's4',
        title: 'And on the way back',
        do: 'Same treatment for the line marked `STEP 4` inside `back()`: `dispatch({ type: \'back\' });`',
        why: 'This is the bug from the intro, fixed for free. The old `back()` forgot to clear the error, so a failed submit followed by Back left a red box floating over step 1. The reducer clears it on both transitions because both are written in the same switch, three lines apart, where the omission would be obvious.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 4',
          code: "    dispatch({ type: 'back' });"
        },
        checks: [
          {
            label: 'back() dispatches',
            test: function (s) { return /function\s+back\s*\(\s*\)\s*\{[\s\S]{0,120}?dispatch\s*\(/.test(s); },
            hint: "Inside `back()`, call `dispatch({ type: 'back' })`."
          }
        ]
      },
      {
        id: 's5',
        title: 'Fix the input, which is now calling a function that no longer exists',
        do: 'The file input on the line marked `STEP 5` still calls `setFile`, which step 2 deleted. Point it at the reducer instead:\n\n`onChange={e => dispatch({ type: \'setFile\', value: e.target.value })}`',
        why: 'Worth noticing what just happened: removing the setters broke this line, and nothing warned you until it ran. That is the honest cost of the refactor. The payoff is that from here on there is exactly one way to change this state, so the next person cannot invent a fifth path that forgets to clear the error.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 5',
          code: "          onChange={e => dispatch({ type: 'setFile', value: e.target.value })}"
        },
        checks: [
          {
            label: 'The input dispatches setFile',
            test: function (s) { return /type\s*:\s*['"]setFile['"]/.test(s) && !/setFile\s*\(/.test(s); },
            hint: "Replace the onChange with `dispatch({ type: 'setFile', value: e.target.value })`, and make sure no call to `setFile(...)` survives."
          }
        ]
      },
      {
        id: 's6',
        title: 'Make the async path atomic',
        do: 'The line marked `STEP 6` begins `submit()`. Replace the whole body — the two setters and both promise callbacks — with one dispatch each:\n\n`dispatch({ type: \'submit\' })` before the request, `dispatch({ type: \'succeeded\' })` in the `.then`, and `dispatch({ type: \'failed\', message: err.message })` in the `.catch`.\n\nThen press Run and try to reach an impossible state.',
        why: 'Two setters in a `.catch` are two renders, and between them sits a moment where status says "error" but the message has not arrived. One dispatch is one transition: the pair moves together or not at all. And because the reducer never closed over this render, none of this needs a functional updater even though it runs a second later inside a promise — which is the quiet reason reducers are pleasant in async code.',
        reveal: {
          anchor: 'STEP 6',
          lines: 5,
          code: "    dispatch({ type: 'submit' });\n    mockApi.uploadDocument({ file: file || 'untitled.pdf' })\n      .then(() => dispatch({ type: 'succeeded' }))\n      .catch(err => dispatch({ type: 'failed', message: err.message }));"
        },
        checks: [
          {
            label: 'submit() announces itself before the request',
            test: function (s) { return /type\s*:\s*['"]submit['"]/.test(s); },
            hint: "Start the handler with `dispatch({ type: 'submit' })` — that is the transition that sets status to sending and clears any previous error."
          },
          {
            label: 'The success path dispatches',
            test: function (s) { return /type\s*:\s*['"]succeeded['"]/.test(s); },
            hint: "The `.then` becomes `.then(() => dispatch({ type: 'succeeded' }))`."
          },
          {
            label: 'The failure path dispatches once, not twice',
            test: function (s) { return /type\s*:\s*['"]failed['"]/.test(s) && !/setStatus\s*\(/.test(s) && !/setError\s*\(/.test(s); },
            hint: "Replace both setters with a single `dispatch({ type: 'failed', message: err.message })`, and check that no setStatus or setError call is left anywhere in the file."
          }
        ]
      }
    ]
  },

  challenges: [
    {
      id: 'L04-A',
      title: 'Undo, redo, and a reducer that owns history',

      brief: [
        'The annotation editor has `Undo` and `Redo` buttons that do nothing.',
        'Rework the reducer so state is `{ past, present, future }` and handle `undo` and `redo`.',
        'A new edit must **clear** the redo stack — that is the rule everyone forgets.',
        'Undo at the beginning and redo at the end must be no-ops, not crashes. Keep the buttons disabled when there is nothing to do.',
        'No `useState`, no refs. History belongs in the reducer.'
      ],

      starter: [
        "// L04 challenge · Undo/redo for document annotations",
        "// The edits work. The history does not exist yet.",
        "",
        "const INITIAL = {",
        "  past: [],",
        "  present: { note: '', page: 1 },",
        "  future: []",
        "};",
        "",
        "function reducer(state, action) {",
        "  switch (action.type) {",
        "    case 'edit':",
        "      // TODO 1: push the current present onto past, apply the change,",
        "      //         and clear future — a new edit invalidates the redo stack.",
        "      return { ...state, present: { ...state.present, ...action.patch } };",
        "",
        "    // TODO 2: 'undo' — pop the last past entry into present,",
        "    //         and push the old present onto future. No-op when past is empty.",
        "",
        "    // TODO 3: 'redo' — the mirror image. No-op when future is empty.",
        "",
        "    default:",
        "      return state;",
        "  }",
        "}",
        "",
        "function App() {",
        "  const [state, dispatch] = useReducer(reducer, INITIAL);",
        "  const { past, present, future } = state;",
        "",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <textarea",
        "        value={present.note}",
        "        onChange={e => dispatch({ type: 'edit', patch: { note: e.target.value } })}",
        "        placeholder=\"Annotate this page...\"",
        "        className=\"h-24 w-full rounded-md border border-slate-300 bg-white p-2 text-sm\"",
        "      />",
        "",
        "      <div className=\"flex items-center gap-2\">",
        "        <button",
        "          onClick={() => dispatch({ type: 'undo' })}",
        "          disabled={past.length === 0}",
        "          className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40\">",
        "          Undo",
        "        </button>",
        "        <button",
        "          onClick={() => dispatch({ type: 'redo' })}",
        "          disabled={future.length === 0}",
        "          className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40\">",
        "          Redo",
        "        </button>",
        "        <button",
        "          onClick={() => dispatch({ type: 'edit', patch: { page: present.page + 1 } })}",
        "          className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">",
        "          Next page",
        "        </button>",
        "      </div>",
        "",
        "      <p className=\"font-mono text-[11px] text-slate-500\">",
        "        {'page ' + present.page + ' · ' + past.length + ' undo · ' + future.length + ' redo'}",
        "      </p>",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Three stacks, and every action moves one entry between two of them. Draw it: where does `present` go when you undo, and where does the new `present` come from?',
        'Undo takes the last item of `past` as the new `present`, and pushes the old `present` onto the front of `future`. Redo is the exact mirror. The subtle one is `edit`: once you type after undoing, the redo stack describes a future that can no longer happen, so it must be emptied. Every immutable-history bug is either a forgotten `future: []` or a mutation of the arrays with `push`.',
        "Edit: `{ past: [...state.past, state.present], present: { ...state.present, ...action.patch }, future: [] }`. Undo: read `state.past[state.past.length - 1]` and `state.past.slice(0, -1)`. Redo: `state.future[0]` and `state.future.slice(1)`.",
        "All three cases:\n\n  case 'edit':\n    return {\n      past: [...state.past, state.present],\n      present: { ...state.present, ...action.patch },\n      future: []                         // a new edit kills the redo stack\n    };\n\n  case 'undo': {\n    if (state.past.length === 0) return state;\n    const previous = state.past[state.past.length - 1];\n    return {\n      past: state.past.slice(0, -1),\n      present: previous,\n      future: [state.present, ...state.future]\n    };\n  }\n\n  case 'redo': {\n    if (state.future.length === 0) return state;\n    const nextUp = state.future[0];\n    return {\n      past: [...state.past, state.present],\n      present: nextUp,\n      future: state.future.slice(1)\n    };\n  }\n\nNote the braces around the undo/redo cases — a `const` inside a bare `case` leaks into the whole switch block."
      ],

      checks: [
        {
          label: 'undo and redo are handled',
          test: function (s) { return /case\s*['"]undo['"]/.test(s) && /case\s*['"]redo['"]/.test(s); },
          hint: "Add `case 'undo':` and `case 'redo':` to the switch."
        },
        {
          label: 'An edit records history',
          test: function (s) { return /past\s*:\s*\[\s*\.\.\.\s*state\s*\.\s*past\s*,/.test(s); },
          hint: 'The edit case must push the *current* present onto past: `past: [...state.past, state.present]`. Without that there is nothing to undo to.'
        },
        {
          label: 'A new edit clears the redo stack',
          test: function (s) { return /case\s*['"]edit['"][\s\S]{0,400}?future\s*:\s*\[\s*\]/.test(s); },
          hint: 'Add `future: []` to the edit case. Editing after an undo makes the old redo entries describe a branch that no longer exists.'
        },
        {
          label: 'Empty stacks are a no-op, not a crash',
          test: function (s) { return /(past|future)\s*\.\s*length\s*===\s*0/.test(s) || /!\s*state\s*\.\s*(past|future)\s*\.\s*length/.test(s); },
          hint: 'Guard both: `if (state.past.length === 0) return state;`. Returning the identical object means React skips the render entirely.'
        },
        {
          label: 'History is built immutably',
          test: function (s) { return !/\.\s*push\s*\(/.test(s) && !/\.\s*pop\s*\(/.test(s) && /slice\s*\(/.test(s); },
          hint: '`push` and `pop` mutate the array you were handed. Use `[...arr, item]` and `arr.slice(0, -1)` so each transition produces new arrays.'
        },
        {
          label: 'No useState or refs were needed',
          test: function (s) { return !/useState\s*\(/.test(s) && !/useRef\s*\(/.test(s); },
          hint: 'The whole point is that history is state, and state that changes in lockstep belongs in the reducer.'
        }
      ]
    }
  ]
};
