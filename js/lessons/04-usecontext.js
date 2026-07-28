/* 04 · useContext
   Explanation and three challenges ported from the original lab. Work them in
   order: A builds the pattern, B measures the damage, C is the fix. */

import { count } from './helpers.js';

export default {
  n: '04',
  id: 'usecontext',
  title: 'useContext',
  subtitle: 'Sharing state, and the re-render tax',

  explain: [
    'Context moves a value down the tree without threading it through props. `createContext(default)` makes the channel, `<Ctx.Provider value={x}>` publishes on it, `useContext(Ctx)` reads it from any depth. It exists to kill prop drilling — that is all it promises.',
    "Here is the tax. Every component that calls `useContext(Ctx)` re-renders whenever the provider's `value` changes identity — *not* when the part it actually uses changes. Pass `value={{ user, throughput }}` and you create a brand-new object on every provider render, so all consumers re-render even if `user` never moved.",
    '`React.memo` does not save you. Memo compares props; context bypasses props entirely. A memoized consumer still re-renders on every context change.',
    'Three fixes, in order of value: split one context into several by how often each value changes, wrap stable values in `useMemo` so their identity holds, and put the fast-changing provider as low in the tree as it will go.'
  ],

  interview: 'Context is a dependency-injection tool, not a state manager — every consumer re-renders when the provider value changes identity, and memo cannot block that because context skips props. So I split contexts by change frequency: a stable useMemo-ed auth value in one, the fast-changing value in another that wraps as little of the tree as possible.',

  challenges: [
    {
      id: 'L04-A',
      title: 'Provide the current user',

      brief: [
        'Create `AuthContext`, provide `{ user, role }`, and read it deep in the tree — no prop drilling.',
        'Wrap the read in a `useAuth()` hook that **throws** outside the provider. Interviewers ask for this by name.',
        '`AdminOnly` renders its children only when the role is `admin`.'
      ],

      starter: [
        "// L04-A · Current user + role, shared across the dashboard",
        "",
        "// TODO 1: create the context (default undefined, so useAuth can detect misuse)",
        "// const AuthContext = ...",
        "",
        "// TODO 2: write useAuth() — read the context, throw a clear error if it is undefined",
        "function useAuth() {",
        "  return { user: { name: 'unknown' }, role: 'viewer' };",
        "}",
        "",
        "function AdminOnly({ children }) {",
        "  // TODO 3: render children only for role 'admin', otherwise the locked note",
        "  return children;",
        "}",
        "",
        "function Toolbar() {",
        "  return (",
        "    <div className=\"flex flex-wrap items-center gap-2\">",
        "      <button className=\"rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm\">Export CSV</button>",
        "      <AdminOnly>",
        "        <button className=\"rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700\">Purge queue</button>",
        "      </AdminOnly>",
        "    </div>",
        "  );",
        "}",
        "",
        "function AccountChip() {",
        "  const { user, role } = useAuth();",
        "  return (",
        "    <div className=\"flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2\">",
        "      <span className=\"grid h-7 w-7 place-items-center rounded bg-blue-100 font-mono text-[11px] text-blue-700\">",
        "        {user.name.slice(0, 2).toUpperCase()}",
        "      </span>",
        "      <span className=\"text-sm\">{user.name}</span>",
        "      <span className=\"font-mono text-[10px] uppercase tracking-wider text-slate-500\">{role}</span>",
        "    </div>",
        "  );",
        "}",
        "",
        "// Deliberately deep, to prove nothing is being drilled.",
        "function Sidebar() { return <div className=\"space-y-2\"><AccountChip /><Toolbar /></div>; }",
        "function Layout() { return <div className=\"space-y-3\"><Sidebar /></div>; }",
        "",
        "function App() {",
        "  const [role, setRole] = useState('viewer');",
        "  const user = { name: 'Dana Okoye', id: 'u_88' };",
        "",
        "  // TODO 4: wrap Layout in the provider and publish { user, role }",
        "  return (",
        "    <div className=\"space-y-3\">",
        "      <Layout />",
        "      <button",
        "        onClick={() => setRole(r => (r === 'admin' ? 'viewer' : 'admin'))}",
        "        className=\"rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white\">",
        "        {'Switch to ' + (role === 'admin' ? 'viewer' : 'admin')}",
        "      </button>",
        "    </div>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Four pieces have to line up: a channel, a publisher, a reader, and a guard for when the reader runs with no publisher above it.',
        '`createContext(undefined)` is deliberate — `undefined` is how `useAuth` tells "nobody mounted a provider" apart from "there is no user". Without a provider, every consumer silently receives the default and you debug the wrong thing for an hour.',
        "Create `const AuthContext = createContext(undefined);` at the top. In `useAuth`, read `useContext(AuthContext)` and `throw new Error('useAuth must be used inside <AuthContext.Provider>')` when it is undefined. `AdminOnly` calls `useAuth()` itself.",
        "The provider, memoized so consumers are not woken for nothing:\n\n  const value = useMemo(() => ({ user, role }), [role]);\n\n  return (\n    <AuthContext.Provider value={value}>\n      ...\n    </AuthContext.Provider>\n  );\n\nAnd AdminOnly:\n\n  const { role } = useAuth();\n  if (role !== 'admin') return <span className=\"font-mono text-[11px] text-slate-500\">admin only</span>;\n  return children;"
      ],

      checks: [
        {
          label: 'Context created',
          test: function (s) { return /createContext\s*\(/.test(s); },
          hint: '`const AuthContext = createContext(undefined)`. Passing undefined as the default is deliberate — it is how useAuth can tell "no provider" apart from "no user".'
        },
        {
          label: 'Provider wraps the tree',
          test: function (s) { return /<\s*\w*Context\s*\.\s*Provider[\s\S]{0,80}value\s*=/.test(s); },
          hint: 'Return `<AuthContext.Provider value={value}>` around the layout. A context with no provider silently hands every consumer the default value.'
        },
        {
          label: 'useAuth reads context and guards',
          test: function (s) { return /useContext\s*\(/.test(s) && /throw\s+new\s+Error/.test(s); },
          hint: 'Inside useAuth: `const ctx = useContext(AuthContext); if (ctx === undefined) throw new Error(...)`. The throw turns a silent wrong-value bug into a loud one.'
        },
        {
          label: 'AdminOnly gates on role',
          test: function (s) { return /function\s+AdminOnly[\s\S]{0,400}?role\s*(!==|===)\s*['"]admin['"]/.test(s); },
          hint: 'AdminOnly should call `useAuth()` itself and return the children only when `role === "admin"` — no props needed, that is the point of context.'
        },
        {
          label: 'Provider value is memoized',
          test: function (s) { return /useMemo\s*\(/.test(s); },
          hint: '`value={{ user, role }}` builds a new object on every render of App, waking every consumer. Use `const value = useMemo(() => ({ user, role }), [role]);`'
        }
      ]
    },

    {
      id: 'L04-B',
      title: 'Watch every consumer wake up',

      brief: [
        'This one is a measurement, not a fix. The provider holds a static user *and* a throughput number that ticks 4x a second, in one value object.',
        'Add `useRenderCount()` and pass `count={n}` to `Panel` in all three consumers.',
        'Wrap `AccountChip` in `memo`. Predict what happens before you run it.',
        '`StaticNote` reads no context — wrap it in `memo` too and compare.',
        'Expected: the two user panels climb just as fast as the gauge, and memo changes nothing for them. Only `StaticNote` stays at 1.'
      ],

      starter: [
        "// L04-B · One context, one fast-changing value, three consumers",
        "// Instrument it. Do not fix it yet — 04-C is the fix.",
        "",
        "const ScannerContext = createContext(undefined);",
        "",
        "function ScannerProvider({ children }) {",
        "  const [user] = useState({ name: 'Dana Okoye', role: 'admin' });",
        "  const [throughput, setThroughput] = useState(0);",
        "",
        "  useEffect(() => {",
        "    const id = setInterval(() => setThroughput(t => t + 3), 250);",
        "    return () => clearInterval(id);",
        "  }, []);",
        "",
        "  // A brand-new object on every tick.",
        "  return (",
        "    <ScannerContext.Provider value={{ user, throughput }}>",
        "      {children}",
        "    </ScannerContext.Provider>",
        "  );",
        "}",
        "",
        "// TODO 1: add useRenderCount() here and pass it to Panel's count prop",
        "function AccountChip() {",
        "  const { user } = useContext(ScannerContext);",
        "  return <Panel title=\"account · reads user only\"><p className=\"text-sm\">{user.name}</p></Panel>;",
        "}",
        "",
        "// TODO 2: same here",
        "function RoleBadge() {",
        "  const { user } = useContext(ScannerContext);",
        "  return <Panel title=\"role · reads user only\"><p className=\"font-mono text-sm text-blue-600\">{user.role}</p></Panel>;",
        "}",
        "",
        "// TODO 3: same here — this is the only one that SHOULD be re-rendering",
        "function ThroughputGauge() {",
        "  const { throughput } = useContext(ScannerContext);",
        "  return <Panel title=\"throughput · reads the fast value\"><p className=\"text-2xl font-semibold text-blue-600\">{throughput + ' pages/min'}</p></Panel>;",
        "}",
        "",
        "// TODO 4: wrap this in memo. It reads no context and takes no props.",
        "function StaticNote() {",
        "  return <Panel title=\"static · reads no context\"><p className=\"text-sm text-slate-500\">Nothing here depends on the provider.</p></Panel>;",
        "}",
        "",
        "// TODO 5: wrap AccountChip in memo as well, then predict the counter",
        "",
        "function App() {",
        "  return (",
        "    <ScannerProvider>",
        "      <div className=\"grid gap-3 sm:grid-cols-2\">",
        "        <AccountChip />",
        "        <RoleBadge />",
        "        <ThroughputGauge />",
        "        <StaticNote />",
        "      </div>",
        "    </ScannerProvider>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'Before running: which of these four components has any reason to re-render four times a second? Write your prediction down, then measure.',
        'memo compares *props*. `AccountChip` takes none, so memo has nothing to compare — and it re-renders anyway, because `useContext` subscribes it to the provider directly. Context is a side channel that goes around props entirely, which is exactly why memo cannot block it.',
        'Add `const renders = useRenderCount();` to each panel component and pass `count={renders}` to `Panel`. Then `const AccountChip = memo(function AccountChip() { ... });` and the same for `StaticNote`.',
        'The finished shape for the two memoized ones:\n\n  const AccountChip = memo(function AccountChip() {\n    const { user } = useContext(ScannerContext);\n    const renders = useRenderCount();\n    return <Panel title="account · reads user only" count={renders}>...</Panel>;\n  });\n\n  const StaticNote = memo(function StaticNote() {\n    const renders = useRenderCount();\n    return <Panel title="static · reads no context" count={renders}>...</Panel>;\n  });\n\nStaticNote freezes at 1. AccountChip does not. Same memo, opposite outcome — the difference is the useContext call.'
      ],

      checks: [
        {
          label: 'All four panels report a render count',
          test: function (s) { return count(s, /useRenderCount\s*\(/g) >= 4; },
          hint: 'Call `const renders = useRenderCount()` in each panel component and pass `count={renders}` to Panel. Without a number on screen you are guessing instead of measuring.'
        },
        {
          label: 'memo applied to at least two components',
          test: function (s) { return count(s, /memo\s*\(/g) >= 2; },
          hint: '`const AccountChip = memo(function AccountChip() { ... })` and the same for StaticNote. The comparison between those two is the entire lesson.'
        },
        {
          label: 'Still a single shared context',
          test: function (s) { return count(s, /createContext\s*\(/g) === 1; },
          hint: 'Keep one context here — this exercise is the diagnosis. Splitting it is 04-C.'
        },
        {
          label: 'Provider value still built inline',
          test: function (s) { return /value\s*=\s*\{\s*\{/.test(s); },
          hint: 'Leave `value={{ user, throughput }}` as it is. That literal is the thing you are measuring: a new object identity every 250ms.'
        }
      ]
    },

    {
      id: 'L04-C',
      title: 'Split the context, stop the churn',

      brief: [
        'Split into `UserContext` and `ThroughputContext` — use exactly those names.',
        '`useMemo` the user value so its identity survives the ticks.',
        'Each consumer reads only the context it needs. `ThroughputContext` should be read in exactly one place.',
        'Target: account and role freeze at 1 render, the gauge keeps climbing. Compare against 04-B side by side — that contrast is the answer to "how do you fix context re-renders".'
      ],

      starter: [
        "// L04-C · Two contexts, split by how often the value changes",
        "",
        "const UserContext = createContext(undefined);",
        "// TODO 1: create ThroughputContext",
        "",
        "function ScannerProvider({ children }) {",
        "  const [user] = useState({ name: 'Dana Okoye', role: 'admin' });",
        "  const [throughput, setThroughput] = useState(0);",
        "",
        "  useEffect(() => {",
        "    const id = setInterval(() => setThroughput(t => t + 3), 250);",
        "    return () => clearInterval(id);",
        "  }, []);",
        "",
        "  // TODO 2: memoize the user value so its identity does not change on every tick",
        "  // TODO 3: nest the two providers, fast one innermost",
        "  return (",
        "    <UserContext.Provider value={{ user }}>",
        "      {children}",
        "    </UserContext.Provider>",
        "  );",
        "}",
        "",
        "function AccountChip() {",
        "  const { user } = useContext(UserContext);",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"account · user context\" count={renders}><p className=\"text-sm\">{user.name}</p></Panel>;",
        "}",
        "",
        "function RoleBadge() {",
        "  const { user } = useContext(UserContext);",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"role · user context\" count={renders}><p className=\"font-mono text-sm text-blue-600\">{user.role}</p></Panel>;",
        "}",
        "",
        "function ThroughputGauge() {",
        "  // TODO 4: read ThroughputContext here, and only here",
        "  const throughput = 0;",
        "  const renders = useRenderCount();",
        "  return <Panel title=\"throughput · fast context\" count={renders}><p className=\"text-2xl font-semibold text-blue-600\">{throughput + ' pages/min'}</p></Panel>;",
        "}",
        "",
        "function App() {",
        "  return (",
        "    <ScannerProvider>",
        "      <div className=\"grid gap-3 sm:grid-cols-2\">",
        "        <AccountChip />",
        "        <RoleBadge />",
        "        <ThroughputGauge />",
        "      </div>",
        "    </ScannerProvider>",
        "  );",
        "}"
      ].join('\n'),

      hints: [
        'One channel is carrying two things that change at completely different rates. What if they were two channels?',
        'Splitting alone is not enough. `value={{ user }}` still builds a fresh object every time ScannerProvider re-renders — and it re-renders on every tick, because the throughput state lives in it. The split needs `useMemo` to hold the user value identity steady.',
        'Add `const ThroughputContext = createContext(0);`, memoize with `const userValue = useMemo(() => ({ user }), [user]);`, nest the providers with Throughput innermost, and read `useContext(ThroughputContext)` in ThroughputGauge only.',
        'The provider:\n\n  const userValue = useMemo(() => ({ user }), [user]);\n\n  return (\n    <UserContext.Provider value={userValue}>\n      <ThroughputContext.Provider value={throughput}>\n        {children}\n      </ThroughputContext.Provider>\n    </UserContext.Provider>\n  );\n\nAccount and role now sit at 1 render while the gauge climbs — because their context value never changes identity, and they never subscribe to the one that does.'
      ],

      checks: [
        {
          label: 'Two contexts exist',
          test: function (s) { return count(s, /createContext\s*\(/g) >= 2 && /ThroughputContext/.test(s); },
          hint: '`const ThroughputContext = createContext(0)`, alongside UserContext. Splitting by change frequency is the fix — one channel per rate of change.'
        },
        {
          label: 'Both providers are mounted',
          test: function (s) { return /UserContext\s*\.\s*Provider/.test(s) && /ThroughputContext\s*\.\s*Provider/.test(s); },
          hint: 'Nest them inside ScannerProvider, with the fast one innermost so it wraps as little of the tree as possible.'
        },
        {
          label: 'User value is memoized',
          test: function (s) { return /useMemo\s*\(\s*\(\s*\)\s*=>/.test(s); },
          hint: '`const userValue = useMemo(() => ({ user }), [user])`. Without it the object literal is recreated on every tick and you are back where you started, split contexts or not.'
        },
        {
          label: 'Throughput is read in exactly one component',
          test: function (s) { return count(s, /useContext\s*\(\s*ThroughputContext\s*\)/g) === 1; },
          hint: 'Only ThroughputGauge should call `useContext(ThroughputContext)`. Every extra reader is another component re-rendering four times a second.'
        },
        {
          label: 'User panels no longer touch the fast value',
          test: function (s) { return !/AccountChip[\s\S]{0,200}ThroughputContext/.test(s); },
          hint: 'AccountChip and RoleBadge must read UserContext only. One stray read puts them right back on the 250ms treadmill.'
        }
      ]
    }
  ]
};
