/* The lesson registry: order on screen is order in this array.

   Every lesson module default-exports one object:

     n, id, title, subtitle    identity, shown in the rail
     explain: [ string ]       paragraphs; `backticks` and **stars** allowed
     interview: string         the one-paragraph answer to say out loud
     reference: [ block ]      optional reading blocks (see ui/text.js)
     guided: { id, title, starter, steps }   optional walkthrough
     challenges: [ challenge ] optional, each { id, title, brief, starter, hints, checks }

   A step is { id, title, do, why, reveal: { anchor, code }, checks }.
   `anchor` is the marker text planted in the starter ("STEP 3"); pasting
   replaces that whole line with `code`, so `code` carries its own indentation.

   Adding a walkthrough to a ported lesson means adding a `guided` block here —
   no engine code changes. */

import usestate from './01-usestate.js';
import useeffect from './02-useeffect.js';
import useref from './03-useref.js';
import usereducer from './04-usereducer.js';
import memoization from './05-memo.js';
import customHooks from './06-custom-hooks.js';
import usecontext from './07-usecontext.js';
import zustand from './08-zustand.js';
import redux from './09-redux.js';
import reactQuery from './10-react-query.js';
import final from './12-final.js';

export const LESSONS = [
  usestate,
  useeffect,
  useref,
  usereducer,
  memoization,
  customHooks,
  usecontext,
  zustand,
  redux,
  reactQuery,
  final
];

export function findLesson(id) {
  return LESSONS.find(function (l) { return l.id === id; });
}
