/* Shared by the check functions in the lesson files. */

/* How many times a pattern appears. The regex must be global. */
export function count(src, re) {
  return (src.match(re) || []).length;
}
