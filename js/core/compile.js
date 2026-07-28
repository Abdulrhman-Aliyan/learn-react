/* Turns editor text into a React component.

   Babel transforms the JSX, then the result is wrapped in a function whose
   parameters are the sandbox names — that is how exercise code gets useState
   and mockApi without importing anything. */

import Babel from '@babel/standalone';
import { SANDBOX_NAMES, SANDBOX_VALUES } from './sandbox.js';

export function compile(source) {
  let transpiled;
  try {
    transpiled = Babel.transform(source, {
      presets: [['react', { runtime: 'classic' }]],
      filename: 'exercise.jsx'
    }).code;
  } catch (err) {
    const e = new Error('Syntax error — ' + err.message.split('\n')[0]);
    e.phase = 'compile';
    e.detail = err.message;
    throw e;
  }

  const body = '"use strict";\n' + transpiled +
    '\n;return (typeof App !== "undefined") ? App : null;';

  let factory;
  try {
    factory = new Function(SANDBOX_NAMES.join(','), body);
  } catch (err) {
    const e = new Error('Could not build your code — ' + err.message);
    e.phase = 'compile';
    throw e;
  }

  const Component = factory.apply(null, SANDBOX_VALUES);
  if (typeof Component !== 'function') {
    const e = new Error(
      'No component named App was found. Your code must define a component ' +
      'called App — that is what gets rendered.'
    );
    e.phase = 'compile';
    throw e;
  }
  return Component;
}
