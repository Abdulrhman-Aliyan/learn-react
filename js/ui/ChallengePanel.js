/* The challenge: same rig, no steps.

   You get the brief and a hint ladder. Hints come one rung at a time — nudge,
   concept, exact line, full answer — because a hint you had to ask for twice
   teaches more than one that was sitting there in the open. */

import React from 'react';
import { html } from '../core/html.js';
import { Rich } from './text.js';

const { useState, useEffect } = React;

const RUNG_LABEL = ['a nudge', 'the concept', 'the exact line', 'the whole answer'];

export function ChallengePanel({ challenge, results, hasRun, passed }) {
  const [shown, setShown] = useState(0);

  /* A new challenge starts with the ladder folded back up. */
  useEffect(function () { setShown(0); }, [challenge.id]);

  const hints = challenge.hints || [];
  const failing = results.filter(function (c) { return !c.passed; });

  return html`
    <div className="space-y-3">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">challenge</span>
        <h4 className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">${challenge.title}</h4>
      </div>

      <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        ${challenge.brief.map(function (b, i) {
          return html`
            <li key=${i} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
              <span><${Rich}>${b}<//></span>
            </li>`;
        })}
      </ul>

      ${passed ? html`
        <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-3">
          <p className="text-[13.5px] font-medium text-green-900 dark:text-green-200">Solved. Every check passes.</p>
        </div>
      ` : null}

      ${hasRun && failing.length ? html`
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">checks</div>
          ${results.map(function (c, i) {
            return html`
              <div key=${i} className="flex gap-2">
                <span className=${'mt-0.5 shrink-0 text-[12px] ' + (c.passed ? 'text-green-600 dark:text-green-400' : 'text-slate-300 dark:text-slate-600')}>
                  ${c.passed ? '✓' : '○'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className=${'text-[13px] ' + (c.passed ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300' : 'text-slate-800 dark:text-slate-200')}>
                    ${c.label}
                  </div>
                  ${!c.passed ? html`
                    <div className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      <${Rich}>${c.hint}<//>
                    </div>
                  ` : null}
                </div>
              </div>`;
          })}
        </div>
      ` : null}

      ${hints.length ? html`
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              ${'hints · ' + shown + ' of ' + hints.length}
            </span>
            ${shown < hints.length ? html`
              <button type="button" onClick=${function () { setShown(shown + 1); }}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                ${'Show ' + (RUNG_LABEL[shown] || 'the next hint')}
              </button>
            ` : null}
          </div>

          ${shown === 0 ? html`
            <p className="mt-2 text-[12.5px] text-slate-400 dark:text-slate-500">Try it cold first. The hints are here when you want them.</p>
          ` : null}

          ${hints.slice(0, shown).map(function (h, i) {
            return html`
              <div key=${i} className="mt-2.5 border-l-2 border-slate-200 dark:border-slate-800 pl-2.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">${RUNG_LABEL[i] || ('hint ' + (i + 1))}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300"><${Rich}>${h}<//></div>
              </div>`;
          })}
        </div>
      ` : null}
    </div>`;
}
