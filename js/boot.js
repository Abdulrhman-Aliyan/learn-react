/* Entry point.

   Everything below this file is a plain ES module, so the browser resolves the
   graph itself — no bundler, no build step. The cost is that the page must be
   served over http; the fatal screen in index.html says so.

   Imports are dynamic on purpose. A static import is hoisted above any
   try/catch in this file, so a CDN that fails to answer would blow up with a
   blank page and a console message nobody sees. Awaiting them here means a
   failure lands on the fatal screen with instructions.

   Note the deliberate absence of StrictMode: it double-invokes effects on
   mount, and lessons 02 and 03 are largely about counting exactly how many
   times an effect ran. */

const HOW_TO_SERVE = window.HOW_TO_SERVE ||
  'Serve this folder over http (npx serve .) and open the URL it prints.';

try {
  const [reactMod, domMod, htmlMod, runtimeMod, shellMod] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./core/html.js'),
    import('./core/runtime.js'),
    import('./ui/Shell.js')
  ]);

  const React = reactMod.default || reactMod;
  const { createRoot } = domMod;
  const { html } = htmlMod;
  const { Runtime } = runtimeMod;
  const { Shell } = shellMod;

  if (!React || !React.useState) throw new Error('React failed to load from the CDN.');

  createRoot(document.getElementById('root')).render(html`<${Shell} />`);

  clearTimeout(window.__labBootTimer);
  window.__lab = { Runtime: Runtime };

  /* Learner code runs inside an error boundary, but a throw from a timer or a
     rejected promise lands outside it. Route those to the sandbox log so they
     stay visible instead of disappearing into the console.

     Cross-origin scripts — Monaco's CDN bundle and its worker — report as a
     bare "Script error." with no stack, because the browser will not leak
     details across origins. Those are never the learner's code, and three of
     them sitting in the log before you have run anything is pure noise. */
  window.addEventListener('error', function (e) {
    const message = e.message || String(e.error || '');
    const opaque = !e.error && (!message || /^script error\.?$/i.test(message));
    if (opaque) return;
    Runtime.log('fail', 'uncaught: ' + message);
  });

  window.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    if (reason.indexOf('Halted') === -1) {
      Runtime.log('fail', 'unhandled rejection: ' + reason);
    }
    e.preventDefault();
  });
} catch (err) {
  clearTimeout(window.__labBootTimer);
  window.__labFatal(
    'The lab could not start: ' + (err && err.message ? err.message : String(err)),
    HOW_TO_SERVE
  );
}
