/* Lesson-data guardrail. Run it after touching any lesson file:
 *
 *     node scripts/verify.mjs
 *
 * It imports the real grading engine — no browser, no mocks — and asserts the
 * invariants that make a walkthrough trustworthy:
 *
 *   1. Every marker a step points at exists in that lesson's starter.
 *   2. A fresh starter satisfies ZERO steps. A step that passes before you
 *      touch anything is a check that is not testing what it claims to.
 *   3. Pasting every step's reveal, in order, satisfies every step. If this
 *      fails, a step asks for an edit its own paste does not make, and the
 *      "Paste it in for me" button leads to a dead end.
 *   4. Pasting leaves brackets balanced — the cheap proxy for "still parses",
 *      since Babel is browser-only in this project.
 *   5. Every challenge fails on its untouched starter, and ships hints.
 */

import { runSteps, runChecks } from '../js/core/checks.js';
import { pasteAtMarker, findMarkerLine } from '../js/core/markers.js';
import { LESSONS } from '../js/lessons/index.js';

let failures = 0;
const fail = (m) => { console.log('  FAIL ' + m); failures++; };
const ok = (m) => console.log('  ok   ' + m);

const balance = (text, open, close) =>
  (text.split(open).length - 1) - (text.split(close).length - 1);

for (const lesson of LESSONS) {
  console.log('\n' + lesson.n + ' · ' + lesson.title);

  if (!lesson.explain || !lesson.explain.length) fail('no explain paragraphs');

  if (lesson.guided) {
    const g = lesson.guided;
    let src = g.starter;

    for (const step of g.steps) {
      if (!step.reveal) { fail(step.id + ' has no reveal'); continue; }
      if (findMarkerLine(g.starter, step.reveal.anchor) === -1) {
        fail(step.id + ' anchor "' + step.reveal.anchor + '" is not in the starter');
      }
    }

    const fresh = runSteps(g.steps, g.starter, false);
    if (fresh.activeIndex !== 0) fail('fresh starter does not open on step 1 (index ' + fresh.activeIndex + ')');
    else ok('fresh starter opens on step 1');

    if (fresh.doneCount !== 0) {
      fail('fresh starter already satisfies ' + fresh.doneCount + ' step(s) — a check is too loose');
      fresh.rows.filter(r => r.satisfied)
        .forEach(r => console.log('       already done: ' + r.step.id + ' ' + r.step.title));
    }

    for (const step of g.steps) {
      const next = pasteAtMarker(src, step.reveal.anchor, step.reveal.code, step.reveal.lines);
      if (next == null) { fail('could not paste ' + step.id + ' (marker gone)'); break; }
      src = next;
    }

    for (const [open, close] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      if (balance(src, open, close) !== balance(g.starter, open, close)) {
        fail('pasting every step changes ' + open + close + ' balance — a paste leaves broken syntax');
      }
    }

    const solved = runSteps(g.steps, src, true);
    if (!solved.allDone) {
      fail('pasting every step does NOT satisfy the walkthrough');
      solved.rows.filter(r => !r.satisfied).forEach(r => {
        r.checks.filter(c => !c.passed).forEach(c => console.log('       ' + r.step.id + ' → ' + c.label));
      });
    } else {
      ok('pasting all ' + g.steps.length + ' steps satisfies every check');
    }
  }

  for (const ch of lesson.challenges || []) {
    const res = runChecks(ch, ch.starter, false);
    const passing = res.filter(c => c.passed).length;
    if (passing === res.length) fail(ch.id + ': starter already passes everything');
    else ok(ch.id + ': ' + passing + '/' + res.length + ' pass on the untouched starter');

    if (!ch.hints || ch.hints.length < 2) fail(ch.id + ': fewer than 2 hints');
    if (!ch.brief || !ch.brief.length) fail(ch.id + ': no brief');
  }
}

console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'ALL CHECKS PASSED'));
process.exit(failures ? 1 : 0);
