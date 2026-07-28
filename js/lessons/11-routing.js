/* 11 · React Router
   Guided task: turn a fake-tab dashboard into real routes, ending with the
                filter moved out of useState and into the URL.
   Challenge:   a protected route that sends you back where you were going.

   Everything here runs under MemoryRouter — see js/core/sandbox.js for why. */

import { count } from './helpers.js';

export default {
  n: '11',
  id: 'routing',
  title: 'React Router',
  subtitle: 'The URL is state you do not own',

  explain: [
    'A router maps the URL onto a component tree. `<Routes>` picks the single best match among its `<Route>` children, `path="jobs/:id"` captures a segment as a param, and a nested `<Route>` renders into its parent\'s `<Outlet>`.',
    'The idea worth internalising is that **the URL is application state** — the only piece your user can edit, bookmark, share, and reload. Every value you keep in `useState` that the user would reasonably expect to survive a refresh, or want to send to a colleague, is a value that belongs in the URL. Which job is open, which tab is showing, which filter is applied, what page of results: all of it.',
    '`useSearchParams` is the hook that makes this practical. It reads the query string and hands you a setter that navigates. Treat it exactly like `useState` — with the difference that its value is visible, shareable, and restored for free on reload.',
    'Two ways to navigate. `<Link to="...">` is declarative and should be your default: it renders a real anchor, so middle-click, right-click and screen readers all work. `useNavigate()` is imperative, for *after* something happens — a form submitted, a mutation resolved. Reaching for `useNavigate` to render a clickable thing means you have built a link that a browser cannot recognise.',
    'Redirect with `<Navigate to="/login" replace />`. The `replace` matters: without it the URL you bounced away from stays in history, so pressing Back returns the user to the page that just rejected them, which bounces them again.',
    'In this lab everything runs under `MemoryRouter`, which keeps history in memory instead of the address bar — otherwise your routes would fight the lab for the page URL. Every concept behaves identically; only the address bar is missing, so the exercises print the current location themselves.'
  ],

  interview: 'I treat the URL as state the user owns — anything they would expect to survive a refresh or be able to share belongs in the path or the query string, which is what useSearchParams is for. Link is the default because it renders a real anchor and keeps middle-click and accessibility working; useNavigate is for after an action completes. And redirects use replace, so Back does not land the user on the page that just bounced them.',

  guided: {
    id: 'L11-G',
    title: 'From fake tabs to real routes',

    starter: [
      "// L11 · A dashboard faking navigation with useState",
      "//",
      "// It works, and everything about it is unshareable. Reload and you are",
      "// back at the start. Open a job, send the link to someone, and they see",
      "// the list. The filter you typed is invisible to everyone but you.",
      "//",
      "// Steps are numbered in the order you do them, not top to bottom.",
      "",
      "const JOBS = [",
      "  { id: 'job_1001', file: 'invoice-4417.pdf',      status: 'done',   pages: 3 },",
      "  { id: 'job_1002', file: 'contract-acme-v3.pdf',  status: 'failed', pages: 18 },",
      "  { id: 'job_1003', file: 'receipt-scan-0091.jpg', status: 'done',   pages: 1 }",
      "];",
      "",
      "// A stand-in for the address bar, since MemoryRouter has none.",
      "function FakeUrlBar() {",
      "  return <div className=\"mb-3 rounded-md bg-slate-100 px-3 py-1.5 font-mono text-[11px] text-slate-600\">/</div>;   // STEP 6",
      "}",
      "",
      "function JobList({ jobs, onOpen }) {",
      "  return (",
      "    <div className=\"space-y-2\">",
      "      {jobs.map(j => (",
      "        <button key={j.id} onClick={() => onOpen(j.id)}   /* STEP 2 · a button pretending to be a link */",
      "          className=\"flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left\">",
      "          <span className=\"truncate text-[13px]\">{j.file}</span>",
      "          <StatusPill status={j.status} />",
      "        </button>",
      "      ))}",
      "    </div>",
      "  );",
      "}",
      "",
      "function JobDetail({ id, onBack }) {                 // STEP 3 · props pretending to be a URL",
      "  const job = JOBS.find(j => j.id === id);",
      "  const back = <button onClick={onBack} className=\"mb-2 block text-[12px] text-blue-600\">&larr; back to the queue</button>;",
      "",
      "  if (!job) return <p className=\"text-sm text-slate-500\">No such job.</p>;",
      "  return (",
      "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
      "      {back}",
      "      <p className=\"text-sm\">{job.file}</p>",
      "      <p className=\"font-mono text-[11px] text-slate-500\">{job.id + ' · ' + job.pages + ' pages'}</p>",
      "    </div>",
      "  );",
      "}",
      "",
      "function App() {",
      "  const [openId, setOpenId] = useState(null);      // STEP 4 · delete me once the URL holds this",
      "",
      "  const [filter, setFilter] = useState('');        // STEP 5 · this belongs in the query string",
      "  const onFilterChange = value => setFilter(value);",
      "",
      "  const visible = JOBS.filter(j => j.file.includes(filter));",
      "",
      "  return (                                         // STEP 1 · no router, no routes",
      "    <div>",
      "      <FakeUrlBar />",
      "",
      "      <input",
      "        value={filter}",
      "        onChange={e => onFilterChange(e.target.value)}",
      "        placeholder=\"Filter by filename...\"",
      "        className=\"mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"",
      "      />",
      "",
      "      {openId",
      "        ? <JobDetail id={openId} onBack={() => setOpenId(null)} />",
      "        : <JobList jobs={visible} onOpen={setOpenId} />}",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),

    steps: [
      {
        id: 's1',
        title: 'Mount a router and declare the routes',
        do: 'Replace the whole `return` block — the sixteen lines starting at the marker `STEP 1` — with a routed version: a `<MemoryRouter initialEntries={[\'/\']}>` around everything, and a `<Routes>` table replacing the `openId ? … : …` conditional.',
        why: 'Two ideas, but they only make sense together. Every router hook needs a router above it — `useNavigate` outside one throws immediately — and `<Routes>` compares the current location against each `<Route>` below it, rendering the single best match. That is why `/jobs/job_1001` picks the detail route instead of also rendering the list: not every match, the best one. The `:id` segment is a wildcard whose value the matched component can read back. In a real app the router is `<BrowserRouter>`, mounted once at the root.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 1',
          lines: 16,
          code: "  return (\n    <MemoryRouter initialEntries={['/']}>\n      <div>\n        <FakeUrlBar />\n\n        <input\n          value={filter}\n          onChange={e => onFilterChange(e.target.value)}\n          placeholder=\"Filter by filename...\"\n          className=\"mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm\"\n        />\n\n        <Routes>\n          <Route path=\"/\" element={<JobList jobs={visible} />} />\n          <Route path=\"/jobs/:id\" element={<JobDetail />} />\n        </Routes>\n      </div>\n    </MemoryRouter>\n  );"
        },
        checks: [
          {
            label: 'A router is mounted',
            test: function (s) { return /<\s*MemoryRouter/.test(s); },
            hint: "Wrap the returned markup in `<MemoryRouter initialEntries={['/']}>`. Without a router above them, every hook in this lesson throws."
          },
          {
            label: 'A route table exists',
            test: function (s) { return /<\s*Routes/.test(s) && count(s, /<\s*Route\s/g) >= 2; },
            hint: 'Add `<Routes>` containing two `<Route>` elements — one for `/` and one for `/jobs/:id`.'
          },
          {
            label: 'The detail route captures an id param',
            test: function (s) { return /path\s*=\s*["'][^"']*\/jobs\/:id["']/.test(s); },
            hint: 'The path is `"/jobs/:id"`. The colon marks the segment as a parameter rather than a literal.'
          }
        ]
      },
      {
        id: 's2',
        title: 'Make the rows real links',
        do: 'The row in `JobList` is a `<button>` that calls back up to the parent. Replace the five lines starting at the marker `STEP 2` with a `<Link>` pointing at the job\'s URL.',
        why: 'A `<Link>` renders a real anchor, so middle-click opens a new tab, right-click offers Copy Link Address, Ctrl+click works, and a screen reader announces it as a link. A `<button onClick={navigate}>` gives you none of that and is the single most common accessibility regression in a React app. Default to `<Link>` for anything that goes somewhere; save `useNavigate` for after an action.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 2',
          lines: 5,
          code: "        <Link key={j.id} to={'/jobs/' + j.id}\n          className=\"flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left\">\n          <span className=\"truncate text-[13px]\">{j.file}</span>\n          <StatusPill status={j.status} />\n        </Link>"
        },
        checks: [
          {
            label: 'Rows are links',
            test: function (s) { return /<\s*Link[\s\S]{0,120}?to\s*=/.test(s); },
            hint: "Render `<Link to={'/jobs/' + j.id}>` around each row instead of a button with an onClick."
          },
          {
            label: 'The button is gone',
            test: function (s) { return !/<\s*button[\s\S]{0,80}?onOpen/.test(s); },
            hint: 'Remove the `<button onClick={() => onOpen(j.id)}>` entirely, including its closing tag.'
          }
        ]
      },
      {
        id: 's3',
        title: 'Read the param instead of taking props',
        do: 'Replace the three lines starting at the marker `STEP 3` so `JobDetail` takes no props at all: read the id with `useParams()`, and make the back control a `<Link to="/">`.',
        why: '`useParams` returns whatever the matched `path` captured, always as strings — `/jobs/42` hands you `"42"`, not `42`, which is a dependable source of `===` bugs. The bigger point is that the component now takes no props: it derives everything it needs from the URL, so it can be mounted from any route supplying an `:id`, and nothing above it has to thread state down.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 3',
          lines: 3,
          code: 'function JobDetail() {\n  const { id } = useParams();\n  const job = JOBS.find(j => j.id === id);\n  const back = <Link to="/" className="mb-2 block text-[12px] text-blue-600">&larr; back to the queue</Link>;'
        },
        checks: [
          {
            label: 'The detail reads useParams',
            test: function (s) { return /useParams\s*\(\s*\)/.test(s); },
            hint: '`const { id } = useParams();` inside JobDetail. The key matches the `:id` in the route path.'
          },
          {
            label: 'Going back is a link',
            test: function (s) { return count(s, /<\s*Link/g) >= 2; },
            hint: 'Replace the back button with `<Link to="/">&larr; back to the queue</Link>`.'
          }
        ]
      },
      {
        id: 's4',
        title: 'Delete the state the URL replaced',
        do: 'The line marked `STEP 4` still holds the open job in `useState`, and nothing reads it any more. Delete it, and remove the now-unused `onOpen={setOpenId}` from the `JobList` route element.',
        why: '`openId` and the URL were two representations of one fact, and only one of them can be bookmarked, shared or restored on reload. Leaving the dead `useState` behind is how a codebase ends up with two sources of truth that drift — the next person to touch this will assume it is load-bearing.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 4',
          code: '  // The open job lives in the URL now.'
        },
        checks: [
          {
            label: 'The openId state is gone',
            test: function (s) { return !/\[\s*openId\s*,/.test(s); },
            hint: 'Delete `const [openId, setOpenId] = useState(null);` — the route param replaces it entirely.'
          },
          {
            label: 'Nothing references setOpenId any more',
            test: function (s) { return !/setOpenId/.test(s); },
            hint: 'Also drop `onOpen={setOpenId}` from the JobList route element, and the `onOpen` prop from JobList itself.'
          }
        ]
      },
      {
        id: 's5',
        title: 'Move the filter into the query string',
        do: 'The two lines starting at the marker `STEP 5` keep the filter in `useState`. Replace both with search params — read `q` out of the query string, and make the change handler write it back.',
        why: '`useSearchParams` is `useState` for the query string, and the difference is everything: the filtered view becomes a URL you can bookmark, paste into a ticket, or reload into. Two details in the replacement are worth keeping. Empty input clears the param rather than leaving a bare `?q=` hanging around. And `{ replace: true }` means typing does not push a history entry per keystroke — without it, Back walks the search backwards one character at a time.',
        requiresRender: false,
        reveal: {
          anchor: 'STEP 5',
          lines: 2,
          code: "  const [params, setParams] = useSearchParams();\n  const filter = params.get('q') || '';\n  const onFilterChange = value => setParams(value ? { q: value } : {}, { replace: true });"
        },
        checks: [
          {
            label: 'The filter comes from the query string',
            test: function (s) { return /useSearchParams\s*\(\s*\)/.test(s); },
            hint: '`const [params, setParams] = useSearchParams();` then `const filter = params.get(\'q\') || \'\';`'
          },
          {
            label: 'No useState is left holding the filter',
            test: function (s) { return !/\[\s*filter\s*,\s*setFilter\s*\]/.test(s); },
            hint: 'Delete the `useState` for the filter and update the input to call `setParams(...)` instead of `setFilter(...)`.'
          }
        ]
      },
      {
        id: 's6',
        title: 'Show the URL you have been building',
        do: 'Replace the line marked `STEP 6` inside `FakeUrlBar` so it reads the real location:\n\n`const { pathname, search } = useLocation();`\n\nand render `pathname + search`. Then press Run, open a job, and type in the filter.',
        why: 'The payoff, made visible. Click a row and the path becomes `/jobs/job_1002`; type in the box and `?q=contract` appears. That string is now the entire view state — hand it to someone else and they land exactly where you are. That is the thing `useState` can never give you, and the reason to reach for the router before reaching for state.',
        reveal: {
          anchor: 'STEP 6',
          code: '  const { pathname, search } = useLocation();\n  return <div className="mb-3 rounded-md bg-slate-100 px-3 py-1.5 font-mono text-[11px] text-slate-600">{pathname + search}</div>;'
        },
        checks: [
          {
            label: 'The bar reads the live location',
            test: function (s) { return /useLocation\s*\(\s*\)/.test(s); },
            hint: '`const { pathname, search } = useLocation();` and render `pathname + search`.'
          }
        ]
      }
    ]
  },

  challenges: [
    {
      id: 'L11-A',
      title: 'A protected route that remembers where you were going',

      brief: [
        '`/reports` is meant to require a session. Right now anyone can reach it.',
        'Build `<RequireAuth>` so an unauthenticated visitor is redirected to `/login` — with `replace`, so Back does not bounce them in a loop.',
        'Record the location they were trying to reach, and after login send them **there**, not to `/`.',
        'Log in, then use Back. You must not end up on the login screen again.',
        'Use `<Navigate>` for the redirect and `useNavigate` for the post-login jump. Do not fake either with an effect.'
      ],

      starter: [
        "// L11 challenge · Protected route with a return trip",
        "// Click Reports while logged out. It just... shows you the reports.",
        "",
        "function useFakeAuth() {",
        "  const [user, setUser] = useState(null);",
        "  return {",
        "    user: user,",
        "    signIn: () => setUser({ name: 'Dana Okoye' }),",
        "    signOut: () => setUser(null)",
        "  };",
        "}",
        "",
        "// The lab has no address bar, so the app prints its own.",
        "function UrlBar() {",
        "  const { pathname, search } = useLocation();",
        "  return <div className=\"mb-3 rounded-md bg-slate-100 px-3 py-1.5 font-mono text-[11px] text-slate-600\">{pathname + search}</div>;",
        "}",
        "",
        "// TODO 1: RequireAuth — render children when signed in, otherwise redirect",
        "//         to /login with replace, remembering the attempted location.",
        "function RequireAuth({ user, children }) {",
        "  return children;",
        "}",
        "",
        "function Login({ onSignIn }) {",
        "  // TODO 2: after signing in, navigate to wherever they were headed,",
        "  //         falling back to '/'. Use replace here too.",
        "  return (",
        "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
        "      <p className=\"mb-2 text-sm\">You need to sign in to see reports.</p>",
        "      <button onClick={onSignIn} className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">",
        "        Sign in as Dana",
        "      </button>",
        "    </div>",
        "  );",
        "}",
        "",
        "function Reports() {",
        "  return (",
        "    <div className=\"rounded-lg border border-slate-200 bg-white p-3\">",
        "      <p className=\"text-sm\">Extraction accuracy: 94.2%</p>",
        "      <p className=\"font-mono text-[11px] text-slate-500\">only visible to signed-in users</p>",
        "    </div>",
        "  );",
        "}",
        "",
        "function Home() {",
        "  return <p className=\"text-sm text-slate-600\">Public dashboard. Nothing secret here.</p>;",
        "}",
        "",
        "function App() {",
        "  const auth = useFakeAuth();",
        "",
        "  return (",
        "    <MemoryRouter initialEntries={['/']}>",
        "      <div>",
        "        <UrlBar />",
        "",
        "        <div className=\"mb-3 flex items-center gap-3\">",
        "          <Link to=\"/\" className=\"text-[13px] text-blue-600\">Home</Link>",
        "          <Link to=\"/reports\" className=\"text-[13px] text-blue-600\">Reports</Link>",
        "          <span className=\"ml-auto font-mono text-[11px] text-slate-500\">",
        "            {auth.user ? auth.user.name : 'signed out'}",
        "          </span>",
        "          {auth.user ? (",
        "            <button onClick={auth.signOut} className=\"rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px]\">",
        "              Sign out",
        "            </button>",
        "          ) : null}",
        "        </div>",
        "",
        "        <Routes>",
        "          <Route path=\"/\" element={<Home />} />",
        "          <Route path=\"/login\" element={<Login onSignIn={auth.signIn} />} />",
        "          <Route",
        "            path=\"/reports\"",
        "            element={<RequireAuth user={auth.user}><Reports /></RequireAuth>}",
        "          />",
        "        </Routes>",
        "      </div>",
        "    </MemoryRouter>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Two separate journeys. Getting bounced *out* of a page you cannot see, and getting sent *back* to it once you can. The second needs something carried across the redirect — where would you put it?',
        '`<Navigate>` takes a `state` prop, and whatever you put there is readable at the destination via `useLocation().state`. So the guard stashes the location it is rejecting, and the login screen reads it back. Both hops want `replace`: without it the protected URL and then the login URL both pile into history, and Back walks the user straight into the bounce again.',
        'In RequireAuth: `const location = useLocation();` then when there is no user, `return <Navigate to="/login" state={{ from: location }} replace />;`. In Login: `const navigate = useNavigate(); const location = useLocation();` and on sign-in `navigate(location.state?.from?.pathname || "/", { replace: true })`.',
        "Both pieces:\n\n  function RequireAuth({ user, children }) {\n    const location = useLocation();\n\n    if (!user) {\n      // `replace` keeps /reports out of history, so Back does not re-bounce.\n      return <Navigate to=\"/login\" state={{ from: location }} replace />;\n    }\n    return children;\n  }\n\n  function Login({ onSignIn }) {\n    const navigate = useNavigate();\n    const location = useLocation();\n    const from = (location.state && location.state.from && location.state.from.pathname) || '/';\n\n    function handle() {\n      onSignIn();\n      navigate(from, { replace: true });\n    }\n    ...\n  }\n\nOne caveat worth knowing: this works here because signIn and navigate happen in the same handler. If sign-in were async you would navigate after it resolved, not beside it — otherwise you redirect to a protected route a moment before the user exists, and the guard bounces you again."
      ],

      checks: [
        {
          label: 'RequireAuth redirects with Navigate',
          test: function (s) { return /<\s*Navigate[\s\S]{0,120}?to\s*=/.test(s); },
          hint: 'Return `<Navigate to="/login" ... />` from RequireAuth when there is no user. Rendering a redirect beats firing one from an effect, which flashes the protected content first.'
        },
        {
          label: 'The redirect replaces instead of pushing',
          test: function (s) { return /<\s*Navigate[^>]*\breplace\b/.test(s); },
          hint: 'Add `replace` to the Navigate. Without it `/reports` stays in history and Back bounces the user again.'
        },
        {
          label: 'The attempted location is carried across',
          test: function (s) { return /state\s*=\s*\{\{[^}]*from/.test(s); },
          hint: '`state={{ from: location }}` on the Navigate. That is the only thing that survives the redirect.'
        },
        {
          label: 'Login reads it back',
          test: function (s) { return /location\s*\.\s*state/.test(s); },
          hint: 'In Login, read `location.state.from.pathname` — guarded, because someone can navigate to /login directly with no state at all.'
        },
        {
          label: 'Login navigates imperatively after signing in',
          test: function (s) { return /useNavigate\s*\(\s*\)/.test(s) && /navigate\s*\(/.test(s); },
          hint: '`const navigate = useNavigate();` then `navigate(from, { replace: true })` in the click handler — this is the "after an action" case that Link cannot express.'
        },
        {
          label: 'The return trip also replaces',
          test: function (s) { return /navigate\s*\([^)]*replace\s*:\s*true/.test(s); },
          hint: '`navigate(from, { replace: true })`. Otherwise /login sits in history and Back returns the user to a login screen they have already used.'
        },
        {
          label: 'No effect-based redirect',
          test: function (s) { return !/useEffect[\s\S]{0,200}?navigate\s*\(/.test(s); },
          hint: 'Do not redirect from a `useEffect`. It runs after the render that already painted the protected content, so the secret flashes on screen before the bounce.'
        }
      ]
    }
  ]
};
