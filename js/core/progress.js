/* Progress lives in localStorage and is deliberately small: which challenges
   have been passed, and how far into each guided walkthrough you got.

   Shape:
     { challenges: { 'L01-C': true }, steps: { 'usestate': 3 }, draft: { 'L01-C': '...' } }

   Every read is defensive. Private-mode browsers throw on localStorage, and a
   lab that refuses to start because it cannot save is worse than one that
   forgets your place. */

const STORE_KEY = 'react-state-lab:v2';

function read() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      challenges: parsed.challenges || {},
      steps: parsed.steps || {},
      draft: parsed.draft || {}
    };
  } catch (e) {
    return { challenges: {}, steps: {}, draft: {} };
  }
}

function write(data) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    /* Private mode, or the quota is full. Losing the bookmark is survivable. */
  }
}

export const progress = {
  all: read,

  markChallenge: function (id, passed) {
    const data = read();
    if (passed) data.challenges[id] = true; else delete data.challenges[id];
    write(data);
    return data;
  },

  /* Highest step reached, so reopening a lesson does not send you back to 1. */
  markSteps: function (lessonId, doneCount) {
    const data = read();
    if (doneCount > (data.steps[lessonId] || 0)) {
      data.steps[lessonId] = doneCount;
      write(data);
    }
    return data;
  },

  saveDraft: function (exerciseId, source) {
    const data = read();
    data.draft[exerciseId] = source;
    write(data);
  },

  getDraft: function (exerciseId) {
    return read().draft[exerciseId] || null;
  },

  clearDraft: function (exerciseId) {
    const data = read();
    delete data.draft[exerciseId];
    write(data);
  },

  reset: function () {
    write({ challenges: {}, steps: {}, draft: {} });
  }
};
