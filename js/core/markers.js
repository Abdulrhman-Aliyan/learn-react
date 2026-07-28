/* Step markers.

   A step's marker sits on exactly one line of the starter — either a standalone
   comment line, or trailing a line the step rewrites. Three forms appear in the
   lesson files:

     let jobs = SEED;   // STEP 1     the line is rewritten
     // STEP 3                        standalone, replaced outright
     <input ... />{...}               in JSX, the brace-and-block-comment form,
                                      since a line comment there would render
                                      as visible text

   Marker text is matched as a substring, so every form works, and the marker
   moves with the learner's edits in a way a line number never could. */

export function findMarkerLine(source, marker) {
  const lines = source.split('\n');
  return lines.findIndex(function (l) { return l.indexOf(marker) !== -1; });
}

/* Replaces the marker's line with `code`, verbatim — lesson files author the
   absolute indentation they want.

   `lineCount` extends the replacement past the marker's own line, for a step
   that collapses a run of lines into one thing (four useState calls becoming a
   single useReducer, say). It counts from the marker line inclusive.

   Returns null when the marker is gone, which means the learner has already
   edited past needing this. */
export function pasteAtMarker(source, marker, code, lineCount) {
  const lines = source.split('\n');
  const at = findMarkerLine(source, marker);
  if (at === -1) return null;

  const span = Math.max(1, lineCount || 1);
  return lines.slice(0, at).concat(code.split('\n'), lines.slice(at + span)).join('\n');
}
