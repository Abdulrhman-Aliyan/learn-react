/* The guided walkthrough.

   Exactly one step is active. Steps above it are done and collapsed, steps
   below it are locked and dimmed. The active step carries the whole
   instruction — what to type, why it is the answer, and an escape hatch. */

import React from 'react';
import { html } from '../core/html.js';
import { Rich } from './text.js';

const { useState } = React;

function Tick({ state }) {
  const base = 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ';
  if (state === 'done') {
    return html`<span className=${base + 'bg-green-600 text-white'} aria-hidden="true">✓</span>`;
  }
  if (state === 'active') {
    return html`<span className=${base + 'bg-blue-600 text-white'} aria-hidden="true">▸</span>`;
  }
  return html`<span className=${base + 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600'} aria-hidden="true">•</span>`;
}

function ActiveStep({ row, revealed, onReveal, onPaste, hasRun }) {
  const step = row.step;
  const failing = row.checks.filter(function (c) { return !c.passed; });

  return html`
    <div className="rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 p-3.5">
      <div className="flex gap-2.5">
        <${Tick} state="active" />
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">${step.title}</h4>

          <div className="mt-2 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
            <${Rich}>${step.do}<//>
          </div>

          ${step.why ? html`
            <p className="mt-2.5 border-l-2 border-blue-400 dark:border-blue-700 pl-2.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">Why: </span><${Rich}>${step.why}<//>
            </p>
          ` : null}

          ${revealed && step.reveal ? html`
            <div className="mt-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">the line</div>
              <pre className="thin-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 font-mono text-[12px] leading-relaxed text-slate-800 dark:text-slate-200">${step.reveal.code}</pre>
            </div>
          ` : null}

          <div className="mt-3 flex flex-wrap gap-2">
            ${step.reveal && !revealed ? html`
              <button type="button" onClick=${function () { onReveal(step); }}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Show me the line
              </button>
            ` : null}

            ${step.reveal && revealed ? html`
              <button type="button" onClick=${function () { onPaste(step); }}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Paste it in for me
              </button>
            ` : null}
          </div>

          ${hasRun && failing.length ? html`
            <div className="mt-3 space-y-1.5 border-t border-blue-200 dark:border-blue-900 pt-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">not passing yet</div>
              ${failing.map(function (c, i) {
                return html`
                  <div key=${i} className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">${c.label}. </span><${Rich}>${c.hint}<//>
                  </div>`;
              })}
            </div>
          ` : null}
        </div>
      </div>
    </div>`;
}

export function StepList({ result, revealedIds, onReveal, onPaste, hasRun }) {
  const [showDone, setShowDone] = useState(false);
  const rows = result.rows;
  const doneRows = rows.filter(function (r) { return r.state === 'done'; });

  return html`
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          ${'guided task · ' + result.doneCount + ' of ' + rows.length}
        </span>
        ${doneRows.length ? html`
          <button type="button" onClick=${function () { setShowDone(!showDone); }}
            className="rounded px-2 py-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300">
            ${showDone ? 'hide finished' : 'show finished'}
          </button>
        ` : null}
      </div>

      ${result.allDone ? html`
        <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-3">
          <p className="text-[13.5px] font-medium text-green-900 dark:text-green-200">Every step passes. The walkthrough is done.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-green-800 dark:text-green-300">
            Now try the challenge below — same tools, no steps.
          </p>
        </div>
      ` : null}

      ${rows.map(function (row) {
        if (row.state === 'done') {
          if (!showDone) {
            return html`
              <div key=${row.step.id} className="flex items-center gap-2.5 px-1 py-1">
                <${Tick} state="done" />
                <span className="text-[13px] text-slate-400 dark:text-slate-500 line-through decoration-slate-300">${row.step.title}</span>
              </div>`;
          }
          return html`
            <div key=${row.step.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              <div className="flex gap-2.5">
                <${Tick} state="done" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300">${row.step.title}</h4>
                  <div className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <${Rich}>${row.step.do}<//>
                  </div>
                </div>
              </div>
            </div>`;
        }

        if (row.state === 'active' && !result.allDone) {
          return html`
            <${ActiveStep}
              key=${row.step.id}
              row=${row}
              revealed=${revealedIds.indexOf(row.step.id) !== -1}
              onReveal=${onReveal}
              onPaste=${onPaste}
              hasRun=${hasRun} />`;
        }

        return html`
          <div key=${row.step.id} className="flex items-center gap-2.5 px-1 py-1">
            <${Tick} state="locked" />
            <span className="text-[13px] text-slate-400 dark:text-slate-500">${row.step.title}</span>
          </div>`;
      })}
    </div>`;
}
