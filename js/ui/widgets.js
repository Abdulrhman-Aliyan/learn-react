/* Display helpers.
   These are handed to the sandbox as globals so exercise code can stay about
   state instead of markup — and they are reused by the lab's own chrome. */

import React from 'react';
import { html } from '../core/html.js';

/* Counts renders without causing any. This is the whole point of lessons 4 and 5. */
export function useRenderCount() {
  const n = React.useRef(0);
  n.current++;
  return n.current;
}

export function RenderBadge({ count }) {
  const hot = count > 6;
  return html`
    <span
      data-renders=${count}
      title="How many times this component has re-rendered since the last Run"
      className=${'ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ring-1 ' +
        (hot ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-slate-100 text-slate-500 ring-slate-200')}>
      ${'renders ' + count}
    </span>`;
}

export function Spinner({ className } = {}) {
  return html`
    <svg className=${'animate-spin ' + (className || 'h-4 w-4 text-blue-600')}
         viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
    </svg>`;
}

const STATUS_TONE = {
  done:       'text-green-700 ring-green-200 bg-green-50',
  processing: 'text-blue-700  ring-blue-200  bg-blue-50',
  queued:     'text-sky-700   ring-sky-200   bg-sky-50',
  failed:     'text-red-700   ring-red-200   bg-red-50'
};

export function StatusPill({ status }) {
  const tone = STATUS_TONE[status] || 'text-slate-600 ring-slate-200 bg-slate-100';
  return html`
    <span className=${'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1 ' + tone}>
      ${status}
    </span>`;
}

export function JobRow({ job, selected, onClick }) {
  return html`
    <button
      type="button"
      onClick=${onClick}
      className=${'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ' +
        (selected
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-slate-900">${job.file}</span>
        <span className="block font-mono text-[10px] text-slate-500">${job.id + ' · ' + job.pages + ' pages'}</span>
      </span>
      <${StatusPill} status=${job.status} />
    </button>`;
}

export function Panel({ title, count, children }) {
  return html`
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
        ${title}
        ${typeof count === 'number' ? html`<${RenderBadge} count=${count} />` : null}
      </div>
      ${children}
    </div>`;
}
