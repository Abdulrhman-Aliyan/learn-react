/* Monaco is the editor VS Code is built on.
   Loading it is optional on purpose: if the CDN or the network is missing, the
   lab falls back to a plain textarea and everything else keeps working. */

import { Runtime } from '../core/runtime.js';
import { SANDBOX_TYPES } from './types.js';
import { LAB_SNIPPETS } from './snippets.js';

const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

export const MONACO_THEME = 'lab-light';

function configureMonaco(monaco) {
  /* A light theme to match the page. Stock 'vs' is close, but its comment grey
     is too faint next to Tailwind slate. */
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7C3AED' },
      { token: 'string', foreground: '047857' },
      { token: 'number', foreground: 'B45309' },
      { token: 'tag', foreground: '0369A1' },
      { token: 'attribute.name', foreground: '7C3AED' },
      { token: 'attribute.value', foreground: '047857' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editorLineNumber.foreground': '#CBD5E1',
      'editorLineNumber.activeForeground': '#2563EB',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editorCursor.foreground': '#2563EB',
      'editor.selectionBackground': '#DBEAFE',
      'editorIndentGuide.background1': '#F1F5F9',
      'editorIndentGuide.activeBackground1': '#CBD5E1'
    }
  });

  const ts = monaco.languages.typescript;
  const options = {
    target: ts.ScriptTarget.ES2020,
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.React,
    allowNonTsExtensions: true,
    noEmit: true
  };
  ts.javascriptDefaults.setCompilerOptions(options);
  ts.typescriptDefaults.setCompilerOptions(options);

  /* Completions and hovers on, red squiggles for real syntax errors only.
     A false "cannot find name" at midnight helps nobody. */
  const diagnostics = {
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true
  };
  ts.javascriptDefaults.setDiagnosticsOptions(diagnostics);
  ts.typescriptDefaults.setDiagnosticsOptions(diagnostics);

  ts.javascriptDefaults.addExtraLib(SANDBOX_TYPES, 'ts:lab-globals.d.ts');
  ts.typescriptDefaults.addExtraLib(SANDBOX_TYPES, 'ts:lab-globals.d.ts');

  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: function (model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      return {
        suggestions: LAB_SNIPPETS.map(function (s) {
          return {
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.body.join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail,
            documentation: { value: s.doc },
            range: range,
            sortText: '0' + s.label
          };
        })
      };
    }
  });
}

/* ---- loading, as a tiny observable store --------------------------------- */

let monacoPromise = null;
const state = { status: 'loading', listeners: new Set() };

function setStatus(next) {
  if (state.status === next) return;
  state.status = next;
  state.listeners.forEach(function (fn) { fn(); });
}

export const monacoStore = {
  subscribe: function (fn) {
    state.listeners.add(fn);
    return function () { state.listeners.delete(fn); };
  },
  getSnapshot: function () { return state.status; }
};

export function loadMonaco() {
  if (monacoPromise) return monacoPromise;

  monacoPromise = new Promise(function (resolve, reject) {
    if (window.monaco && window.monaco.editor) return resolve(window.monaco);

    const script = document.createElement('script');
    script.src = MONACO_CDN + '/loader.js';
    script.async = true;

    script.onload = function () {
      try {
        /* Workers cannot be created from another origin, so wrap the CDN
           worker in a same-origin blob that importScripts it. */
        window.MonacoEnvironment = {
          getWorkerUrl: function () {
            const shim = 'self.MonacoEnvironment = { baseUrl: "' + MONACO_CDN + '/" };\n' +
                         'importScripts("' + MONACO_CDN + '/base/worker/workerMain.js");';
            return URL.createObjectURL(new Blob([shim], { type: 'text/javascript' }));
          }
        };
        window.require.config({ paths: { vs: MONACO_CDN } });
        window.require(['vs/editor/editor.main'], function () {
          try { configureMonaco(window.monaco); resolve(window.monaco); }
          catch (err) { reject(err); }
        }, reject);
      } catch (err) { reject(err); }
    };

    script.onerror = function () { reject(new Error('Could not reach the Monaco CDN')); };
    document.head.appendChild(script);

    window.setTimeout(function () { reject(new Error('Monaco timed out')); }, 20000);
  });

  monacoPromise
    .then(function () { setStatus('ready'); })
    .catch(function (err) {
      Runtime.log('fail', 'code editor: ' + err.message + ' — using the plain editor');
      setStatus('plain');
    });

  return monacoPromise;
}
