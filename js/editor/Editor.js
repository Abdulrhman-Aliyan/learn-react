/* The code pane.

   Two implementations behind one interface. Monaco when it loads, a plain
   textarea when it does not. Both hand the same imperative API back through
   onReady, so nothing upstream has to care which one is running:

     insert(bodyLines)     drop a snippet at the cursor
     revealMarker(text)    scroll to a marker comment and highlight its line
     focus()

   The editor is uncontrolled once mounted — Monaco owns the buffer. `docKey`
   is how the parent says "this is a different exercise now, replace it". */

import React from 'react';
import { html } from '../core/html.js';
import { loadMonaco, monacoStore, currentTheme } from './monaco.js';
import { plainSnippet } from './snippets.js';

const { useState, useEffect, useRef, useSyncExternalStore, useCallback } = React;

/* ---- Monaco -------------------------------------------------------------- */

function MonacoPane({ value, docKey, onChange, onReady }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef(null);
  const latest = useRef({ value, onChange, onReady });
  latest.current = { value, onChange, onReady };

  useEffect(function () {
    const monaco = window.monaco;
    const editor = monaco.editor.create(hostRef.current, {
      value: latest.current.value,
      language: 'javascript',
      theme: currentTheme(),
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 20,
      tabSize: 2,
      insertSpaces: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'off',
      renderLineHighlight: 'line',
      smoothScrolling: true,
      padding: { top: 12, bottom: 12 },
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      suggestOnTriggerCharacters: true,
      quickSuggestions: { other: true, comments: false, strings: false },
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      snippetSuggestions: 'top',
      parameterHints: { enabled: true },
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      fixedOverflowWidgets: true
    });

    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection([]);

    const sub = editor.onDidChangeModelContent(function () {
      latest.current.onChange(editor.getValue());
    });

    latest.current.onReady({
      kind: 'monaco',

      /* Monaco owns its buffer, so replacing the text is an explicit call
         rather than something that falls out of a prop change. */
      setValue: function (text) {
        if (editor.getValue() !== text) editor.setValue(text);
      },

      insert: function (body) {
        const controller = editor.getContribution('snippetController2');
        if (controller) controller.insert(body.join('\n'));
        else editor.trigger('lab', 'type', { text: plainSnippet(body) });
        editor.focus();
      },

      /* Marker comments survive edits in a way line numbers do not, which is
         why a step anchors to text rather than to a position. */
      revealMarker: function (marker) {
        const model = editor.getModel();
        if (!model) return false;
        const hits = model.findMatches(marker, false, false, false, null, false);
        if (!hits.length) return false;

        const line = hits[0].range.startLineNumber;
        editor.revealLineInCenter(line);
        decorationsRef.current.set([{
          range: new window.monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: 'step-anchor-line',
            linesDecorationsClassName: 'step-anchor-glyph'
          }
        }]);
        return true;
      },

      clearMarker: function () {
        if (decorationsRef.current) decorationsRef.current.set([]);
      },

      focus: function () { editor.focus(); }
    });

    return function () {
      sub.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  /* A new exercise: replace the buffer wholesale. Guarded so ordinary typing,
     which also flows through `value`, never resets the cursor. */
  useEffect(function () {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getValue() !== value) editor.setValue(value);
    if (decorationsRef.current) decorationsRef.current.set([]);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [docKey]);

  return html`<div ref=${hostRef} className="h-full w-full"></div>`;
}

/* ---- textarea fallback --------------------------------------------------- */

function PlainPane({ value, docKey, onChange, onReady }) {
  const areaRef = useRef(null);
  const gutterRef = useRef(null);
  const latest = useRef({ onChange, onReady });
  latest.current = { onChange, onReady };

  useEffect(function () {
    const area = areaRef.current;

    latest.current.onReady({
      kind: 'plain',

      /* The textarea is controlled, so the parent's state is the buffer. */
      setValue: function (text) { latest.current.onChange(text); },

      insert: function (body) {
        const text = plainSnippet(body);
        const start = area.selectionStart;
        const next = area.value.slice(0, start) + text + area.value.slice(area.selectionEnd);
        latest.current.onChange(next);
        window.requestAnimationFrame(function () {
          area.focus();
          area.selectionStart = area.selectionEnd = start + text.length;
        });
      },

      revealMarker: function (marker) {
        const at = area.value.indexOf(marker);
        if (at === -1) return false;
        const line = area.value.slice(0, at).split('\n').length;
        area.focus();
        area.selectionStart = at;
        area.selectionEnd = at + marker.length;
        area.scrollTop = Math.max(0, (line - 6) * 20);
        return true;
      },

      clearMarker: function () {},
      focus: function () { area.focus(); }
    });
  }, []);

  /* Tab should indent, not leave the editor. */
  const onKeyDown = useCallback(function (e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const area = e.target;
    const start = area.selectionStart;
    const next = area.value.slice(0, start) + '  ' + area.value.slice(area.selectionEnd);
    latest.current.onChange(next);
    window.requestAnimationFrame(function () {
      area.selectionStart = area.selectionEnd = start + 2;
    });
  }, []);

  const syncScroll = useCallback(function (e) {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  }, []);

  const lineCount = value.split('\n').length;
  const numbers = [];
  for (let i = 1; i <= lineCount; i++) numbers.push(i);

  return html`
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-slate-900">
      <div ref=${gutterRef}
           className="code-metrics select-none overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-3 text-right text-slate-400 dark:text-slate-500">
        ${numbers.map(function (n) { return html`<div key=${n}>${n}</div>`; })}
      </div>
      <textarea
        ref=${areaRef}
        key=${docKey}
        className="editor code-metrics thin-scroll h-full w-full flex-1 bg-white dark:bg-slate-900 px-3 py-3 text-slate-800 dark:text-slate-200 outline-none"
        spellCheck=${false}
        autoCapitalize="off"
        autoCorrect="off"
        value=${value}
        onKeyDown=${onKeyDown}
        onScroll=${syncScroll}
        onChange=${function (e) { latest.current.onChange(e.target.value); }}
      ></textarea>
    </div>`;
}

/* ---- switch -------------------------------------------------------------- */

export function Editor(props) {
  const status = useSyncExternalStore(monacoStore.subscribe, monacoStore.getSnapshot);

  useEffect(function () { loadMonaco(); }, []);

  if (status === 'ready') return html`<${MonacoPane} ...${props} />`;
  if (status === 'plain') return html`<${PlainPane} ...${props} />`;

  /* Still downloading Monaco. The plain editor works in the meantime, and
     swapping to Monaco later carries the text across via `value`. */
  return html`<${PlainPane} ...${props} />`;
}

export const EDITOR_STATUS_LABEL = {
  loading: { text: 'loading code editor', tone: 'text-slate-400 dark:text-slate-500', title: 'Downloading the Monaco editor. The plain editor works in the meantime.' },
  ready:   { text: 'VS Code editor', tone: 'text-blue-600 dark:text-blue-400', title: 'Monaco — the editor VS Code is built on. Ctrl+Space for suggestions, F1 for the command palette.' },
  plain:   { text: 'plain editor', tone: 'text-slate-400 dark:text-slate-500', title: 'Monaco could not be reached, so the lab is using its built-in editor. Everything still works.' }
};

export function useEditorStatus() {
  return useSyncExternalStore(monacoStore.subscribe, monacoStore.getSnapshot);
}
