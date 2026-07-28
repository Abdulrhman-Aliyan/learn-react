/* Lesson copy is plain strings, so it stays readable in the lesson files and
   diffs cleanly. Two bits of formatting, both borrowed from Markdown:
   `backticks` for inline code and **stars** for emphasis. Anything more
   elaborate belongs in a block, not in a sentence. */

import React from 'react';
import { html } from '../core/html.js';

function emphasise(text, keyPrefix) {
  return text.split('**').map(function (chunk, i) {
    if (i % 2 === 0) return chunk;
    return html`<strong key=${keyPrefix + '-' + i} className="font-semibold text-slate-900 dark:text-slate-100">${chunk}</strong>`;
  });
}

export function Rich({ children }) {
  const text = String(children == null ? '' : children);

  return html`
    <${React.Fragment}>
      ${text.split('`').map(function (part, i) {
        if (i % 2 === 0) return emphasise(part, 'e' + i);
        return html`<code key=${i}
          className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[0.875em] text-blue-700 dark:text-blue-300">${part}</code>`;
      })}
    <//>`;
}

/* Paragraph list: what `explain` in every lesson file is made of. */
export function Prose({ paragraphs }) {
  return html`
    <div className="prose-lesson text-[14px] text-slate-700 dark:text-slate-300">
      ${paragraphs.map(function (p, i) {
        return html`<p key=${i}><${Rich}>${p}<//></p>`;
      })}
    </div>`;
}

/* Reference sections, for a lesson that is reading rather than exercises.
   A block is { heading } plus any of: paragraphs, code, bullets, columns.
   A column is { title, tone: 'good' | 'bad' | 'neutral', bullets }. */

const COLUMN_TONE = {
  good:    { box: 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40', title: 'text-green-800 dark:text-green-300' },
  bad:     { box: 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40',     title: 'text-red-800 dark:text-red-300' },
  neutral: { box: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',    title: 'text-slate-600 dark:text-slate-400' }
};

function Bullets({ items, className }) {
  return html`
    <ul className=${'space-y-1.5 ' + (className || 'text-[13.5px] text-slate-700 dark:text-slate-300')}>
      ${items.map(function (b, i) {
        return html`
          <li key=${i} className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
            <span><${Rich}>${b}<//></span>
          </li>`;
      })}
    </ul>`;
}

export function Reference({ blocks }) {
  return html`
    <div className="space-y-7">
      ${blocks.map(function (block, i) {
        const tone = COLUMN_TONE.neutral;
        return html`
          <section key=${i}>
            ${block.heading ? html`
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">${block.heading}</h3>
            ` : null}

            ${block.paragraphs ? html`<${Prose} paragraphs=${block.paragraphs} />` : null}

            ${block.code ? html`
              <pre className="thin-scroll overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 font-mono text-[12px] leading-[19px] text-slate-800 dark:text-slate-200">${block.code}</pre>
            ` : null}

            ${block.bullets ? html`<div className=${block.code ? 'mt-3' : ''}><${Bullets} items=${block.bullets} /></div>` : null}

            ${block.columns ? html`
              <div className="grid gap-3 md:grid-cols-2">
                ${block.columns.map(function (col, k) {
                  const t = COLUMN_TONE[col.tone] || tone;
                  return html`
                    <div key=${k} className=${'rounded-lg border p-4 ' + t.box}>
                      <h4 className=${'mb-2 font-mono text-[10px] uppercase tracking-[0.15em] ' + t.title}>${col.title}</h4>
                      <${Bullets} items=${col.bullets} className="text-[13px] text-slate-700 dark:text-slate-300" />
                    </div>`;
                })}
              </div>
            ` : null}
          </section>`;
      })}
    </div>`;
}
