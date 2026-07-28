/* Page frame: the lesson rail on the left, the current lesson on the right.
   The rail is hidden below the lg breakpoint, where a plain <select> in the
   top bar takes over navigation. */

import React from 'react';
import { html } from '../core/html.js';
import { LESSONS } from '../lessons/index.js';
import { progress } from '../core/progress.js';
import { LessonView } from './LessonView.js';

const { useState, useCallback } = React;

function RailItem({ lesson, active, done, onSelect }) {
  const base = 'w-full rounded-md px-3 py-2 text-left transition-colors ';
  const tone = active ? 'bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-white/70 dark:hover:bg-slate-800/70';

  return html`
    <button type="button" onClick=${onSelect} className=${base + tone}>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">${lesson.n}</span>
        <span className=${'text-[13.5px] font-medium ' + (active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300')}>
          ${lesson.title}
        </span>
        ${done ? html`<span className="ml-auto text-[11px] text-green-600 dark:text-green-400" title="Challenge solved">✓</span>` : null}
      </div>
      <div className="mt-0.5 pl-[26px] text-[11.5px] leading-snug text-slate-400 dark:text-slate-500">${lesson.subtitle}</div>
    </button>`;
}

export function Shell() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(progress.all);

  const lesson = LESSONS[index];

  const select = useCallback(function (i) {
    setIndex(i);
    setSaved(progress.all());
  }, []);

  const done = saved.challenges || {};
  const allChallenges = LESSONS.reduce(function (acc, l) { return acc.concat(l.challenges || []); }, []);
  const solved = allChallenges.filter(function (c) { return done[c.id]; }).length;
  const total = allChallenges.length;

  return html`
    <div className="flex h-full min-h-0">

      <aside className="thin-scroll hidden w-64 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-3 lg:block">
        <div className="px-3 pb-3 pt-2">
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">React State Lab</h1>
          <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">
            Explain, then a guided task, then a challenge.
          </p>
        </div>

        <nav className="space-y-0.5">
          ${LESSONS.map(function (l, i) {
            return html`
              <${RailItem}
                key=${l.id}
                lesson=${l}
                active=${i === index}
                done=${(l.challenges || []).length > 0 &&
                       (l.challenges || []).every(function (c) { return !!done[c.id]; })}
                onSelect=${function () { select(i); }} />`;
          })}
        </nav>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 px-3 pt-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">progress</div>
          <div className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">${solved + ' of ' + total + ' challenges solved'}</div>
          <button
            type="button"
            onClick=${function () {
              progress.reset();
              setSaved(progress.all());
            }}
            className="mt-2 rounded px-1 font-mono text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            reset progress
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2 lg:hidden">
          <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">React State Lab</span>
          <select
            value=${String(index)}
            onChange=${function (e) { select(Number(e.target.value)); }}
            className="ml-auto rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[13px] text-slate-700 dark:text-slate-300">
            ${LESSONS.map(function (l, i) {
              return html`<option key=${l.id} value=${String(i)}>${l.n + ' · ' + l.title}</option>`;
            })}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <${LessonView} key=${lesson.id} lesson=${lesson} />
        </div>
      </main>
    </div>`;
}
