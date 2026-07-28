/* Blocks you will otherwise type twenty times tonight.
   ${1:name} placeholders are Monaco snippet syntax; plainSnippet() strips them
   for the fallback editor, which has no snippet support. */

export const LAB_SNIPPETS = [
  {
    label: 'uq-query',
    detail: 'useQuery with all four states',
    doc: 'Pending, error with retry, empty, success.',
    body: [
      'const { data, isPending, isError, error, isFetching, refetch } = useQuery({',
      '  queryKey: [\'${1:jobs}\'],',
      '  queryFn: ${2:mockApi.listJobs}',
      '});',
      '',
      'if (isPending) return <div className="text-sm text-slate-500">Loading...</div>;',
      'if (isError) return (',
      '  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">',
      '    <p className="text-sm text-red-700">{error.message}</p>',
      '    <button onClick={() => refetch()} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700">Retry</button>',
      '  </div>',
      ');',
      'if (data.length === 0) return <p className="text-sm text-slate-500">Nothing here yet.</p>;',
      '$0'
    ]
  },
  {
    label: 'uq-mutation',
    detail: 'useMutation + invalidateQueries',
    doc: 'The write, then let the affected keys refetch themselves.',
    body: [
      'const queryClient = useQueryClient();',
      'const ${1:upload} = useMutation({',
      '  mutationFn: ${2:file} => mockApi.uploadDocument({ file: ${2:file} }),',
      '  onSuccess: () => {',
      '    queryClient.invalidateQueries({ queryKey: [\'${3:jobs}\'] });',
      '  }',
      '});$0'
    ]
  },
  {
    label: 'uq-poll',
    detail: 'refetchInterval that stops itself',
    doc: 'Polls until status is done, then returns false.',
    body: [
      'refetchInterval: query => (',
      '  query.state.data && query.state.data.status === \'done\' ? false : ${1:1500}',
      '),$0'
    ]
  },
  {
    label: 'zu-store',
    detail: 'zustand store with actions',
    doc: 'State and actions together, derived values through get().',
    body: [
      'const use${1:Ui}Store = create((set, get) => ({',
      '  ${2:selectedId}: null,',
      '',
      '  select: id => set(state => ({ selectedId: state.selectedId === id ? null : id })),',
      '  $0',
      '}));'
    ]
  },
  {
    label: 'zu-shallow',
    detail: 'useShallow selector',
    doc: 'For a selector that returns a new object.',
    body: [
      'const { ${1:total}, ${2:failed} } = use${3:Job}Store(useShallow(s => ({',
      '  ${1:total}: s.${4:jobs}.length,',
      '  ${2:failed}: s.${4:jobs}.filter(j => j.status === \'failed\').length',
      '})));$0'
    ]
  },
  {
    label: 'ef-cleanup',
    detail: 'useEffect with cleanup',
    doc: 'Subscribe, then tear down on unmount and before every re-run.',
    body: [
      'useEffect(() => {',
      '  const id = setInterval(() => {',
      '    $0',
      '  }, ${1:1000});',
      '',
      '  return () => clearInterval(id);',
      '}, [${2}]);'
    ]
  },
  {
    label: 'ef-fetch',
    detail: 'useEffect fetch on mount, with cancellation',
    doc: 'The raw version React Query replaces. Note the cancelled flag.',
    body: [
      'useEffect(() => {',
      '  let cancelled = false;',
      '',
      '  ${1:mockApi.listJobs}()',
      '    .then(data => { if (!cancelled) { $0 } })',
      '    .catch(err => { if (!cancelled) setError(err.message); });',
      '',
      '  return () => { cancelled = true; };',
      '}, []);'
    ]
  },
  {
    label: 'ctx-split',
    detail: 'context + provider + guarded hook',
    doc: 'The useAuth pattern interviewers ask for by name.',
    body: [
      'const ${1:Auth}Context = createContext(undefined);',
      '',
      'function use${1:Auth}() {',
      '  const ctx = useContext(${1:Auth}Context);',
      '  if (ctx === undefined) {',
      '    throw new Error(\'use${1:Auth} must be used inside <${1:Auth}Context.Provider>\');',
      '  }',
      '  return ctx;',
      '}$0'
    ]
  },
  {
    label: 'ref-timer',
    detail: 'timer handle in a ref',
    doc: 'The UI never renders the handle, so it is not state.',
    body: [
      'const timerRef = useRef(null);',
      '',
      'useEffect(() => {',
      '  timerRef.current = setInterval(() => {',
      '    $0',
      '  }, ${1:1000});',
      '',
      '  return () => clearInterval(timerRef.current);',
      '}, [${2}]);'
    ]
  },
  {
    label: 'ref-previous',
    detail: 'previous value in a ref',
    doc: 'Compare first, assign afterwards.',
    body: [
      'const prev${1:Status}Ref = useRef(null);',
      '',
      'useEffect(() => {',
      '  if (prev${1:Status}Ref.current === ${2:\'processing\'} && ${3:status} === ${4:\'done\'}) {',
      '    $0',
      '  }',
      '  prev${1:Status}Ref.current = ${3:status};',
      '}, [${3:status}]);'
    ]
  }
];

/* Placeholders are for Monaco; the plain editor gets clean text. */
export function plainSnippet(body) {
  return body.join('\n')
    .replace(/\$\{\d+:([^}]*)\}/g, '$1')
    .replace(/\$\{\d+\}/g, '')
    .replace(/\$0/g, '');
}
