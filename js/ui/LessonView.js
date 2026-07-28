/* One lesson, three tabs.

   Explain reads as an article. Guided and Challenge share the same rig: the
   left column carries the instructions, the right column the editor and the
   live preview.

   All grading is derived from `source` on every keystroke, which is what makes
   a step tick the moment you type the right thing. Only "renders without
   crashing" waits for a Run, because that is the one fact regex cannot know. */

import React from 'react';
import { html } from '../core/html.js';
import { compile } from '../core/compile.js';
import { runSteps, runChecks } from '../core/checks.js';
import { pasteAtMarker } from '../core/markers.js';
import { Runtime } from '../core/runtime.js';
import { mockApi } from '../core/mock-api.js';
import { progress } from '../core/progress.js';
import { Editor, EDITOR_STATUS_LABEL, useEditorStatus } from '../editor/Editor.js';
import { Preview, SandboxLog } from './Preview.js';
import { StepList } from './StepList.js';
import { ChallengePanel } from './ChallengePanel.js';
import { Prose, Reference, Rich } from './text.js';

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function TabButton({ active, disabled, onClick, children, hint }) {
  const base = 'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ';
  const tone = disabled
    ? 'cursor-not-allowed text-slate-300'
    : active
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100';
  return html`
    <button type="button" disabled=${disabled} onClick=${onClick} title=${hint || ''} className=${base + tone}>
      ${children}
    </button>`;
}

export function LessonView({ lesson }) {
  const hasGuided = !!(lesson.guided && lesson.guided.steps && lesson.guided.steps.length);
  const challenges = lesson.challenges || [];

  const [tab, setTab] = useState('explain');
  const [challengeIndex, setChallengeIndex] = useState(0);

  const challenge = challenges[challengeIndex] || null;
  const exercise = tab === 'guided' ? lesson.guided : tab === 'challenge' ? challenge : null;
  const exerciseId = exercise ? exercise.id : null;

  const [source, setSource] = useState('');
  const [run, setRun] = useState({ Component: null, error: null, runId: 0 });
  const [runtimeError, setRuntimeError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [revealedIds, setRevealedIds] = useState([]);

  const editorApi = useRef(null);
  const saveTimer = useRef(null);

  /* Switching exercise: load the saved draft if there is one, otherwise the
     starter. Everything about the previous attempt is dropped. */
  useEffect(function () {
    if (!exercise) return;
    const draft = progress.getDraft(exercise.id);
    const next = draft != null ? draft : exercise.starter;
    setSource(next);
    setRun({ Component: null, error: null, runId: 0 });
    setRuntimeError(null);
    setHasRun(false);
    setRevealedIds([]);
    Runtime.clear();
    if (editorApi.current) editorApi.current.setValue(next);
  }, [exerciseId]);

  /* Draft autosave, debounced so a fast typist is not writing localStorage on
     every keystroke. */
  const onSourceChange = useCallback(function (next) {
    setSource(next);
    if (!exerciseId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function () {
      progress.saveDraft(exerciseId, next);
    }, 400);
  }, [exerciseId]);

  useEffect(function () {
    return function () { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const renderOk = hasRun && !run.error && !runtimeError;

  const stepResult = useMemo(function () {
    if (!hasGuided) return null;
    return runSteps(lesson.guided.steps, source, renderOk);
  }, [lesson, source, renderOk, hasGuided]);

  const challengeResults = useMemo(function () {
    if (!challenge) return [];
    return runChecks(challenge, source, renderOk);
  }, [challenge, source, renderOk]);

  const challengePassed = challengeResults.length > 0 &&
    challengeResults.every(function (c) { return c.passed; });

  /* Persist the marks worth remembering between sessions. */
  useEffect(function () {
    if (tab === 'guided' && stepResult) progress.markSteps(lesson.id, stepResult.doneCount);
  }, [tab, stepResult && stepResult.doneCount, lesson.id]);

  useEffect(function () {
    if (tab === 'challenge' && challengePassed && challenge) {
      progress.markChallenge(challenge.id, true);
    }
  }, [tab, challengePassed, challenge]);

  const doRun = useCallback(function () {
    Runtime.clear();
    mockApi.reset();
    setRuntimeError(null);
    try {
      const Component = compile(source);
      setRun(function (prev) { return { Component: Component, error: null, runId: prev.runId + 1 }; });
    } catch (err) {
      setRun(function (prev) { return { Component: null, error: err, runId: prev.runId + 1 }; });
    }
    setHasRun(true);
  }, [source]);

  const doReset = useCallback(function () {
    if (!exercise) return;
    progress.clearDraft(exercise.id);
    setSource(exercise.starter);
    if (editorApi.current) editorApi.current.setValue(exercise.starter);
    setRun({ Component: null, error: null, runId: 0 });
    setRuntimeError(null);
    setHasRun(false);
    Runtime.clear();
  }, [exercise]);

  const onReveal = useCallback(function (step) {
    setRevealedIds(function (prev) {
      return prev.indexOf(step.id) === -1 ? prev.concat([step.id]) : prev;
    });
    if (editorApi.current && step.reveal && step.reveal.anchor) {
      editorApi.current.revealMarker(step.reveal.anchor);
    }
  }, []);

  const onPaste = useCallback(function (step) {
    if (!step.reveal) return;
    const next = pasteAtMarker(source, step.reveal.anchor, step.reveal.code);
    if (next == null) return;
    onSourceChange(next);
    if (editorApi.current) {
      editorApi.current.setValue(next);
      editorApi.current.clearMarker();
    }
  }, [source, onSourceChange]);

  const editorStatus = useEditorStatus();
  const statusLabel = EDITOR_STATUS_LABEL[editorStatus] || EDITOR_STATUS_LABEL.loading;

  /* ---- explain tab: one wide column ------------------------------------- */

  if (tab === 'explain') {
    return html`
      <div className="mx-auto max-w-3xl px-6 py-8">
        <${LessonHeader} lesson=${lesson} tab=${tab} setTab=${setTab}
                         hasGuided=${hasGuided} hasChallenge=${challenges.length > 0} />

        <${Prose} paragraphs=${lesson.explain} />

        ${lesson.reference ? html`
          <div className="mt-8 border-t border-slate-200 pt-7">
            <${Reference} blocks=${lesson.reference} />
          </div>
        ` : null}

        ${lesson.interview ? html`
          <div className="mt-7 rounded-lg border border-slate-200 bg-white p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">say this in an interview</div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-700"><${Rich}>${lesson.interview}<//></p>
          </div>
        ` : null}

        <div className="mt-7 flex flex-wrap gap-2">
          ${hasGuided ? html`
            <button type="button" onClick=${function () { setTab('guided'); }}
              className="rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-700">
              Start the guided task →
            </button>
          ` : null}
          ${challenges.length ? html`
            <button type="button" onClick=${function () { setTab('challenge'); }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              ${hasGuided
                ? 'Skip to the challenge'
                : (challenges.length > 1 ? 'Go to the challenges' : 'Go to the challenge')}
            </button>
          ` : null}
        </div>

        ${!hasGuided && challenges.length ? html`
          <p className="mt-4 text-[12.5px] leading-relaxed text-slate-400">
            This lesson has its explanation and challenges, but no step-by-step walkthrough yet.
          </p>
        ` : null}

        ${!hasGuided && !challenges.length ? html`
          <p className="mt-7 text-[12.5px] leading-relaxed text-slate-400">
            Reading only — there is nothing to run for this one.
          </p>
        ` : null}
      </div>`;
  }

  /* ---- guided and challenge: split view ---------------------------------- */

  return html`
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-200 bg-white px-6 pt-5">
        <${LessonHeader} lesson=${lesson} tab=${tab} setTab=${setTab}
                         hasGuided=${hasGuided} hasChallenge=${challenges.length > 0} compact=${true} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,9fr)]">

        <div className="thin-scroll min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50 px-5 py-5">
          ${tab === 'guided' && stepResult ? html`
            <${StepList}
              result=${stepResult}
              revealedIds=${revealedIds}
              onReveal=${onReveal}
              onPaste=${onPaste}
              hasRun=${hasRun} />
          ` : null}

          ${tab === 'challenge' && challenge ? html`
            <div className="space-y-3">
              ${challenges.length > 1 ? html`
                <div className="flex flex-wrap gap-1">
                  ${challenges.map(function (c, i) {
                    const on = i === challengeIndex;
                    return html`
                      <button key=${c.id} type="button"
                        onClick=${function () { setChallengeIndex(i); }}
                        className=${'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ' +
                          (on ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50')}>
                        ${String.fromCharCode(65 + i)}
                      </button>`;
                  })}
                </div>
              ` : null}

              <${ChallengePanel}
                challenge=${challenge}
                results=${challengeResults}
                hasRun=${hasRun}
                passed=${challengePassed} />
            </div>
          ` : null}
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick=${doRun}
                className="rounded-md bg-blue-600 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700">
                Run
              </button>
              <button type="button" onClick=${doReset}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
                Reset
              </button>
            </div>
            <span title=${statusLabel.title} className=${'font-mono text-[10px] uppercase tracking-[0.15em] ' + statusLabel.tone}>
              ${statusLabel.text}
            </span>
          </div>

          <div className="min-h-0 flex-[3] border-b border-slate-200">
            <${Editor}
              value=${source}
              docKey=${exerciseId || 'none'}
              onChange=${onSourceChange}
              onReady=${function (api) { editorApi.current = api; }} />
          </div>

          <div className="thin-scroll min-h-0 flex-[2] overflow-y-auto bg-slate-50 px-4 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">preview</div>
            <${Preview}
              Component=${run.Component}
              compileError=${run.error}
              runId=${run.runId}
              onRuntimeError=${function (err) { setRuntimeError(err); }} />
          </div>

          <div className="max-h-44 min-h-0 shrink-0 border-t border-slate-200 bg-white">
            <${SandboxLog} />
          </div>
        </div>
      </div>
    </div>`;
}

function LessonHeader({ lesson, tab, setTab, hasGuided, hasChallenge, compact }) {
  return html`
    <div className=${compact ? 'pb-3' : 'mb-6'}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-mono text-[11px] text-slate-400">${lesson.n}</span>
        <h2 className=${(compact ? 'text-[18px]' : 'text-[26px]') + ' font-semibold tracking-tight text-slate-900'}>
          ${lesson.title}
        </h2>
        <span className="text-[13px] text-slate-500">${lesson.subtitle}</span>
      </div>

      <div className=${(compact ? 'mt-2.5' : 'mt-4') + ' flex gap-1'}>
        <${TabButton} active=${tab === 'explain'} onClick=${function () { setTab('explain'); }}>Explain<//>
        <${TabButton}
          active=${tab === 'guided'}
          disabled=${!hasGuided}
          hint=${hasGuided ? '' : 'No step-by-step walkthrough for this lesson yet.'}
          onClick=${function () { if (hasGuided) setTab('guided'); }}>Guided task<//>
        <${TabButton}
          active=${tab === 'challenge'}
          disabled=${!hasChallenge}
          onClick=${function () { if (hasChallenge) setTab('challenge'); }}>Challenge<//>
      </div>
    </div>`;
}
