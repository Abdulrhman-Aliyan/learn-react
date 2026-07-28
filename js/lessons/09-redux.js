/* 06 · Redux
   Reading, not drills. No guided task and no challenge — the point of this
   lesson is being able to say when Redux earns its keep and when it does not. */

export default {
  n: '09',
  id: 'redux',
  title: 'Redux',
  subtitle: 'Concept only — when it earns its keep',

  explain: [
    'Redux is one immutable state tree in a single store, changed only by dispatching plain objects called actions. A reducer — `(state, action) => newState` — is a pure function that decides what the next tree looks like. Nothing else may write.',
    "That constraint buys you three things: every change is a named, serializable event; the whole app's state is inspectable and time-travellable in DevTools; and the update logic is pure functions you can unit test without React.",
    'It cost a lot of boilerplate, which is why Redux Toolkit exists and is now the only recommended way to write Redux. And most of what teams used Redux for in 2018 was caching server responses — a job React Query does better. Read the reference below, then be ready to say when you would still reach for it.'
  ],

  interview: 'Redux gives you one auditable, time-travellable state tree with pure reducers, which is worth the ceremony when a lot of client state is shared across a large app and many teams. If the state I am reaching for is really a cache of server responses, I use React Query instead — that was most of what Redux got used for.',

  reference: [
    {
      heading: 'One-way data flow',
      bullets: [
        '**dispatch** — a component fires an action: an object with a `type` and a payload. `dispatch(jobRetried("job_1003"))`',
        '**reducer** — a pure function receives the current state and the action and returns the next state. No fetching, no mutation, no randomness.',
        '**store** — holds the single state tree and notifies subscribers.',
        '**useSelector** — components read a slice, and re-render only if that slice changed. Same idea as a zustand selector.'
      ]
    },
    {
      heading: 'Classic Redux, by hand',
      code: [
        "// action type, action creator, reducer, store — four separate things",
        "const JOB_RETRIED = 'jobs/retried';",
        "",
        "const jobRetried = (id) => ({ type: JOB_RETRIED, payload: id });",
        "",
        "function jobsReducer(state = { items: [] }, action) {",
        "  switch (action.type) {",
        "    case JOB_RETRIED:",
        "      return {",
        "        ...state,",
        "        items: state.items.map(j =>",
        "          j.id === action.payload ? { ...j, status: 'processing' } : j",
        "        )",
        "      };",
        "    default:",
        "      return state;",
        "  }",
        "}",
        "",
        "const store = createStore(combineReducers({ jobs: jobsReducer }));"
      ].join('\n')
    },
    {
      heading: 'The same thing in Redux Toolkit',
      code: [
        "const jobsSlice = createSlice({",
        "  name: 'jobs',",
        "  initialState: { items: [] },",
        "  reducers: {",
        "    // Immer makes this 'mutation' produce a new immutable state.",
        "    jobRetried(state, action) {",
        "      const job = state.items.find(j => j.id === action.payload);",
        "      if (job) job.status = 'processing';",
        "    }",
        "  }",
        "});",
        "",
        "export const { jobRetried } = jobsSlice.actions;   // creators generated for you",
        "export const store = configureStore({",
        "  reducer: { jobs: jobsSlice.reducer }             // thunk + devtools already wired",
        "});",
        "",
        "// in a component",
        "const jobs = useSelector(s => s.jobs.items);",
        "const dispatch = useDispatch();",
        "dispatch(jobRetried('job_1003'));"
      ].join('\n'),
      bullets: [
        '`createSlice` generates action types and creators from the reducer names — the three-file dance is gone.',
        '**Immer** lets you write mutating syntax and still get immutable updates.',
        '`configureStore` ships with thunk middleware, DevTools, and dev-time mutation checks already on.',
        '`createAsyncThunk` handles pending/fulfilled/rejected; **RTK Query** is their answer to React Query if you are already all-in on Redux.'
      ]
    },
    {
      heading: 'When to reach for it',
      columns: [
        {
          title: 'Genuinely the right call',
          tone: 'good',
          bullets: [
            'Large app, many teams, and a shared convention matters more than brevity.',
            'Complex *client* state with real interdependencies — a multi-step review workflow, an editor with undo/redo.',
            'You need the audit trail: every change is a named event you can log, replay, or time-travel in DevTools.',
            'Update logic worth unit testing on its own, away from components.',
            'Middleware belongs in the pipeline: analytics on every action, optimistic queues, offline sync.'
          ]
        },
        {
          title: 'Overkill',
          tone: 'bad',
          bullets: [
            "The state is really a cache of server responses. That is React Query's job — keys, staleness, refetching, dedupe.",
            'A handful of UI flags: modal open, selected row, filter text. `useState`, or zustand once it is shared.',
            'You only wanted to avoid prop drilling. That is context.',
            'Small team, small app — the ceremony costs more than the discipline returns.'
          ]
        }
      ]
    },
    {
      heading: 'If they ask you to compare',
      bullets: [
        '**Context** — dependency injection. No re-render control: every consumer wakes when the provider value changes identity.',
        '**Zustand** — a store outside React with per-selector subscriptions. Minimal ceremony, no provider, easy to over-use as a dumping ground.',
        '**Redux Toolkit** — the same store idea plus enforced conventions, DevTools, and middleware. You pay in ceremony and buy traceability.',
        '**React Query** — not a competitor to any of them. It owns server state; the others own client state.'
      ]
    }
  ]
};
