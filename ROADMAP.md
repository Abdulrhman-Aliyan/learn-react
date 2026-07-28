# Curriculum roadmap

What exists, what comes next, and what each addition needs from the engine.

Lesson numbers are display labels (`n` in the lesson file). Order on screen comes from
the array in [js/lessons/index.js](js/lessons/index.js), so gaps are free — slot a new
lesson in by importing it and putting it where it belongs.

## Shipped

| # | Lesson | Explain | Guided steps | Challenges |
|---|--------|:---:|:---:|:---:|
| 01 | useState | ✓ | 5 | 1 |
| 02 | useEffect | ✓ | 5 | 1 |
| 03 | useRef | ✓ | — | 1 |
| 04 | useReducer | ✓ | 6 | 1 |
| 05 | useMemo & useCallback | ✓ | 6 | 1 |
| 06 | Custom hooks | ✓ | 5 | 1 |
| 07 | useContext | ✓ | — | 3 |
| 08 | Zustand | ✓ | — | 3 |
| 09 | Redux | ✓ (reading only) | — | — |
| 10 | React Query | ✓ | — | 3 |
| 12 | Final challenge | ✓ | — | 1 |

Slot 11 is reserved for **Authentication**, specced below.

Lessons 03, 07, 08 and 10 have explanations and challenges but no guided walkthrough.
Adding one is authoring, not engineering: write a `guided` block with a `starter` and a
`steps` array. Nothing in `js/core` or `js/ui` needs to change.

## Next up, in priority order

### 11 · Authentication — the one to build first

The most-requested real-world topic and the one that exercises everything already taught.
Deliberately **not** built on `useContext`: auth state goes in a Zustand store, which
sidesteps re-teaching the provider re-render tax and matches what most teams actually do.

Guided walkthrough — a login flow that survives a refresh:

1. An auth store: `{ user, accessToken, status }` plus `login`, `logout`, `setToken`.
2. A login form that calls `mockApi.login` and stores the result — with the failure path
   rendered, because a login form that cannot show "wrong password" is not a login form.
3. `<RequireAuth>`, a component that renders children only when authenticated. The trap:
   the "checking session" state is not the same as "logged out", and conflating them
   flashes the login screen on every refresh.
4. Rehydrating from storage on boot without a flash of the wrong UI.
5. Attaching the token to requests through a single wrapper, not at each call site.

Challenges:

- **Token refresh with request queueing.** Four requests fire, all get a 401 at once. Naive
  code fires four refreshes and three of them fail. Correct code refreshes once and queues
  the rest behind that single in-flight promise. This is a genuinely hard concurrency
  drill and a common senior interview question.
- **Logout must not leave a ghost.** Cancel in-flight requests, clear the React Query
  cache (`queryClient.clear()`), and make sure a slow response landing after logout cannot
  write the previous user's data into the new session.

Engine work needed:

- `mockApi.login({ email, password })`, `mockApi.refresh(token)`, `mockApi.me(token)`,
  `mockApi.logout()` in [js/core/mock-api.js](js/core/mock-api.js). Short-lived tokens —
  expire after ~15s so the refresh drill actually fires during a session.
- A `sessionStore` helper the sandbox can reach, since exercise code should not touch real
  `localStorage` (the lab uses it for progress).
- Type declarations for all of the above in [js/editor/types.js](js/editor/types.js).

### 13 · useTransition & useDeferredValue

Concurrent rendering, and the clearest measurable win in the whole course: a 5,000-row
filtered list that blocks typing, then does not.

- `useDeferredValue` for the cheap fix, `useTransition` when you own the update.
- `isPending` for feedback without a spinner flash.
- The trap: neither makes anything faster. They change what is allowed to be interrupted.
  Wrapping a genuinely slow synchronous render in `startTransition` still janks.

Engine: nothing — `useTransition`, `useDeferredValue` and `startTransition` are already in
the sandbox and typed.

### 14 · useLayoutEffect & measuring the DOM

- Paint timing: `useEffect` runs after paint, `useLayoutEffect` before it. A tooltip
  positioned in `useEffect` visibly jumps.
- Measuring with `getBoundingClientRect`, and why the measurement belongs in a ref.
- When *not* to use it — it blocks paint, so it is the wrong default.

Engine: `useLayoutEffect` is already in the sandbox.

### 15 · Error boundaries & Suspense

- What a boundary catches and what it does not: not event handlers, not async callbacks,
  not the boundary's own render.
- Reset keys, and giving the user a way out rather than a blank screen.
- `<Suspense>` with `React.lazy`.
- React Query's `throwOnError` to route query failures into a boundary.

Engine: `Suspense` is in the sandbox; `lazy` needs adding. Note the lab's own
`PreviewBoundary` in [js/ui/Preview.js](js/ui/Preview.js) already catches everything, so
exercise boundaries need a wrapper that does not fight it — the one real piece of
engine design in this lesson.

### 16 · Forms

- Controlled vs uncontrolled, and when uncontrolled is genuinely better.
- Validation timing: on submit, on blur, on change — and why on-change validation feels
  hostile before first submit.
- Field-level error state without four `useState` calls per field (a callback to
  lesson 04).
- `useId` for label/input wiring that survives SSR.

Engine: `useId` is already in the sandbox.

### 17 · useSyncExternalStore

- Subscribing to something outside React: `matchMedia`, `online`/`offline`, a hand-rolled
  store.
- Tearing, and why the API takes a snapshot function rather than a value.
- Writing `useMediaQuery` as a custom hook — ties lessons 06 and 17 together.

Engine: already in the sandbox.

### 18 · forwardRef & useImperativeHandle

Smaller, but interview-relevant.

- Passing a ref through a component to the DOM node underneath.
- `useImperativeHandle` to expose a narrow API (`focus()`, `scrollToRow(n)`) instead of a
  raw node.
- Why this should be rare: it is an escape hatch out of declarative code.

Engine: both are already in the sandbox and typed.

### 19 · Performance measurement

The lesson that makes the memo lesson honest.

- React DevTools Profiler: flame graph, ranked chart, "why did this render".
- Measuring before optimising, and the `RenderBadge` habit the lab already teaches.
- List virtualisation, when the answer is "render fewer things" rather than "memoize".

Engine: this one wants a render-timing panel rather than a badge — the largest UI
addition on this list.

### 20 · Testing hooks and components

- Testing behaviour rather than implementation.
- `renderHook`, `act`, and waiting for async state.
- Mocking at the network boundary instead of mocking hooks.

Engine: significant. Needs a test runner inside the sandbox, or a shift to
"read this test, predict the failure" exercises — cheaper and arguably better drilling.

## React 19 topics — blocked on an upgrade

The import map in [index.html](index.html) pins React 18.3.1. These need 19:

- `useOptimistic` — optimistic UI with automatic rollback.
- `useActionState` and form actions.
- `use()` for unwrapping promises and context conditionally.
- The compiler, and what it makes redundant from lesson 05.

The upgrade itself is a one-line change to the import map, but every lesson needs
re-verifying afterwards — `react-dom/client` and the React Query peer range both move.
Worth doing as its own pass, not folded into a lesson.

## Engine improvements worth doing regardless

- **Guided walkthroughs for 03, 07, 08 and 10.** Pure authoring, highest value per hour.
- **A second guided task per lesson.** The data model already allows it (`guided` could
  become an array, exactly as `challenges` did).
- **Run the checks against the solution automatically.** `npm run verify` ([scripts/verify.mjs](scripts/verify.mjs)) currently
  proves that pasting every step satisfies every step. It cannot prove the result
  *compiles*, because Babel is browser-only here — a headless run would close that gap.
- **Deep links.** `#/lesson/usestate/guided` so a specific drill can be bookmarked.
- **Keyboard shortcut for Run.** Ctrl/Cmd+Enter, which every editor user will try.
