/* Grading.

   A check is { label, test(cleanSource, rawSource) -> boolean, hint }.
   Nothing here executes the learner's code — the preview already does that.
   These read the source text, which is why comments are stripped first. */

/* Strip comments before testing, so a TODO comment that happens to mention
   useState never counts as an answer. The step markers planted in starter code
   are comments as well, which is what stops a marker naming step 3 from
   satisfying step 3. */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1 ');
}

function evaluate(checks, clean, raw) {
  return (checks || []).map(function (c) {
    let passed = false;
    try { passed = !!c.test(clean, raw); } catch (e) { passed = false; }
    return { label: c.label, hint: c.hint, passed: passed };
  });
}

const RENDER_CHECK = {
  label: 'Renders without crashing',
  hint: 'Read the error under the preview — it names the line. A blank preview usually means App returned nothing.'
};

/* ---- challenges ---------------------------------------------------------- */

/* Flat list, "renders without crashing" first. */
export function runChecks(item, source, renderOk) {
  const clean = stripComments(source);
  const list = evaluate(item.checks, clean, source);
  list.unshift({ label: RENDER_CHECK.label, hint: RENDER_CHECK.hint, passed: !!renderOk });
  return list;
}

/* ---- guided steps -------------------------------------------------------- */

/* Grades every step in one pass and works out where the learner is.
   Rules, in the order they matter:

   1. A step is satisfied when all of its own checks pass.
   2. The active step is the first unsatisfied one. Everything after it is
      locked, everything before it reads as done.
   3. Satisfying steps out of order is fine. Someone who writes the whole
      solution in one go ticks them all at once, which is correct, and being
      scolded for working ahead would be obnoxious.
   4. "Renders without crashing" gates only the final step. Half-finished edits
      crash constantly, and blocking step 3 on a momentarily broken preview
      would make the walkthrough unusable. The crash is reported separately. */
export function runSteps(steps, source, renderOk) {
  const clean = stripComments(source);
  const list = (steps || []).map(function (step, i) {
    const checks = evaluate(step.checks, clean, source);
    const isLast = i === steps.length - 1;
    const needsRender = step.requiresRender === true || (isLast && step.requiresRender !== false);

    if (needsRender) {
      checks.push({ label: RENDER_CHECK.label, hint: RENDER_CHECK.hint, passed: !!renderOk });
    }
    const satisfied = checks.length > 0 && checks.every(function (c) { return c.passed; });
    return { step: step, checks: checks, satisfied: satisfied };
  });

  let activeIndex = list.findIndex(function (r) { return !r.satisfied; });
  const allDone = activeIndex === -1;
  if (allDone) activeIndex = list.length - 1;

  return {
    rows: list.map(function (r, i) {
      return Object.assign({}, r, {
        index: i,
        state: r.satisfied ? 'done' : (i === activeIndex ? 'active' : 'locked')
      });
    }),
    activeIndex: activeIndex,
    doneCount: list.filter(function (r) { return r.satisfied; }).length,
    allDone: allDone
  };
}
