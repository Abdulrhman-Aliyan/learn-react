/* The right-hand column: the running component, the halt banner, and the log.

   Everything the learner's code does is contained here. A crash is caught by
   the boundary and translated; a runaway loop is caught by the tripwires in
   core/runtime.js and surfaces as a halt banner. */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { html } from '../core/html.js';
import { Runtime } from '../core/runtime.js';
import { explainError } from '../core/errors.js';

const { useMemo, useRef, useEffect, useSyncExternalStore } = React;

/* ---- error boundary ------------------------------------------------------ */

class PreviewBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) { return { err: err }; }

  componentDidCatch(err) {
    if (this.props.onError) this.props.onError(err);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null });
  }

  render() {
    if (!this.state.err) return this.props.children;

    const message = String(this.state.err.message || this.state.err);
    const coaching = explainError(message);

    return html`
      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-600 dark:text-red-400">runtime error</div>
        <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-red-700 dark:text-red-300">${message}</p>
        ${coaching ? html`
          <p className="mt-2.5 border-l-2 border-red-300 dark:border-red-800 pl-2.5 text-[13px] leading-relaxed text-red-900 dark:text-red-200">${coaching}</p>
        ` : null}
      </div>`;
  }
}

/* ---- sandbox log --------------------------------------------------------- */

const LOG_TONE = {
  api:  'text-blue-600 dark:text-blue-400',
  ok:   'text-green-700 dark:text-green-300',
  fail: 'text-red-600 dark:text-red-400',
  user: 'text-slate-900 dark:text-slate-100'
};

export function SandboxLog() {
  useSyncExternalStore(Runtime.subscribe, Runtime.getSnapshot);
  const boxRef = useRef(null);
  const lines = Runtime.lines;

  useEffect(function () {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lines.length]);

  return html`
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">sandbox log</span>
        <button
          type="button"
          onClick=${function () { Runtime.clear(); }}
          className="rounded px-2 py-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300">
          clear
        </button>
      </div>
      <div ref=${boxRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        ${lines.length === 0
          ? html`<p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">Nothing logged yet. Call log('…') from your code, or run something that touches mockApi.</p>`
          : lines.map(function (l) {
              return html`
                <div key=${l.id} className="flex gap-2 font-mono text-[11px] leading-relaxed">
                  <span className="shrink-0 text-slate-300 dark:text-slate-600">${l.stamp}</span>
                  <span className=${(LOG_TONE[l.kind] || 'text-slate-600 dark:text-slate-400') + ' break-all'}>${l.text}</span>
                </div>`;
            })}
      </div>
    </div>`;
}

/* ---- preview ------------------------------------------------------------- */

export function Preview({ Component, compileError, runId, onRuntimeError }) {
  useSyncExternalStore(Runtime.subscribe, Runtime.getSnapshot);

  /* A fresh client per run, so a cached query from the last attempt cannot
     make this one look like it works. */
  const client = useMemo(function () {
    return new QueryClient({
      defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } }
    });
  }, [runId]);

  const halted = Runtime.halted;

  return html`
    <div className="space-y-3">
      ${halted ? html`
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">preview halted</div>
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-amber-900 dark:text-amber-200">${halted}</p>
          <p className="mt-2 text-[12px] text-amber-700 dark:text-amber-400">Fix the cause, then press Run again.</p>
        </div>
      ` : null}

      ${compileError ? html`
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-600 dark:text-red-400">
            ${compileError.phase === 'compile' ? 'compile error' : 'error'}
          </div>
          <p className="mt-1.5 whitespace-pre-line font-mono text-[12px] leading-relaxed text-red-700 dark:text-red-300">
            ${compileError.message}
          </p>
        </div>
      ` : null}

      ${Component && !compileError && !halted ? html`
        <${PreviewBoundary} resetKey=${runId} onError=${onRuntimeError}>
          <${QueryClientProvider} client=${client}>
            <${Component} />
          <//>
        <//>
      ` : null}

      ${!Component && !compileError ? html`
        <p className="text-[13px] text-slate-400 dark:text-slate-500">Press Run to mount your component here.</p>
      ` : null}
    </div>`;
}
