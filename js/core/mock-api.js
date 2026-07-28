/* The fake OCR backend. setTimeout only — there is no network here.
   It fails about 20% of the time on purpose, because an exercise that only
   ever succeeds teaches you nothing about the error branch. */

import { Runtime, recordCall } from './runtime.js';

const FILE_NAMES = [
  'invoice-4417.pdf', 'contract-acme-v3.pdf', 'receipt-scan-0091.jpg',
  'passport-page1.png', 'shipping-manifest.tiff', 'lab-results-88.pdf',
  'w9-form-signed.pdf', 'delivery-note-2210.jpg'
];

let JOB_SEQ = 1000;

function makeJob(over) {
  const base = {
    id: 'job_' + (++JOB_SEQ),
    file: FILE_NAMES[Math.floor(Math.random() * FILE_NAMES.length)],
    status: 'queued',
    pages: 1 + Math.floor(Math.random() * 24),
    confidence: null,
    progress: 0,
    createdAt: Date.now()
  };
  return Object.assign(base, over || {});
}

export const apiConfig = { failureRate: 0.2, forceFailNext: false, latency: [380, 900] };

/* Handed back when a tripwire fires: settles never, so the runaway loop stops
   dead instead of throwing an error nobody asked for. */
const NEVER = new Promise(function () {});

function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function rand(a, b) { return a + Math.random() * (b - a); }

function shouldFail() {
  if (apiConfig.forceFailNext) { apiConfig.forceFailNext = false; return true; }
  return Math.random() < apiConfig.failureRate;
}

function apiCall(label, work, opts) {
  const options = opts || {};
  const rate = recordCall(label);

  if (rate.burst > 40) {
    Runtime.halt(
      'Request storm: ' + rate.burst + ' API calls in 2 seconds.\n' +
      'Something is fetching on every render. Check the dependency array — and ' +
      'remember that an object or array literal in the deps is a new reference every time.'
    );
    return NEVER;
  }
  if (rate.repeats > 20) {
    Runtime.halt(
      'Runaway effect: "' + label + '" has now run ' + rate.repeats + ' times and shows no sign of stopping.\n' +
      'This is what useEffect with no dependency array does — fetch, setState, re-render, fetch again, forever.\n' +
      'Add the second argument: }, []).'
    );
    return NEVER;
  }

  Runtime.log('api', label + ' →');
  return delay(rand(apiConfig.latency[0], apiConfig.latency[1])).then(function () {
    if (!options.neverFails && shouldFail()) {
      Runtime.log('fail', label + ' ✗ 503 extraction service unavailable');
      throw new Error('503 — extraction service unavailable. Try again.');
    }
    const out = work();
    Runtime.log('ok', label + ' ✓');
    return out;
  });
}

let DB = [];

function seedDB() {
  JOB_SEQ = 1000;
  DB = [
    makeJob({ file: 'invoice-4417.pdf',       status: 'done',       pages: 3,  confidence: 0.97, progress: 100 }),
    makeJob({ file: 'contract-acme-v3.pdf',   status: 'processing', pages: 18, confidence: null, progress: 40 }),
    makeJob({ file: 'receipt-scan-0091.jpg',  status: 'failed',     pages: 1,  confidence: null, progress: 0 }),
    makeJob({ file: 'shipping-manifest.tiff', status: 'queued',     pages: 7,  confidence: null, progress: 0 }),
    makeJob({ file: 'w9-form-signed.pdf',     status: 'done',       pages: 2,  confidence: 0.88, progress: 100 })
  ];
}
seedDB();

export const mockApi = {
  /* Every job in the queue. */
  listJobs: function () {
    return apiCall('listJobs', function () {
      return DB.map(function (j) { return Object.assign({}, j); });
    });
  },

  /* One job by id. Every read nudges a processing job forward, so polling
     exercises actually converge on "done" instead of spinning. */
  getJob: function (id) {
    return apiCall('getJob ' + id, function () {
      const job = DB.find(function (j) { return j.id === id; });
      if (!job) throw new Error('404 — no job with id ' + id);
      if (job.status === 'processing' || job.status === 'queued') {
        job.status = 'processing';
        job.progress = Math.min(100, job.progress + 22 + Math.floor(Math.random() * 12));
        if (job.progress >= 100) {
          job.status = 'done';
          job.confidence = Math.round(rand(0.82, 0.99) * 100) / 100;
        }
      }
      return Object.assign({}, job);
    }, { neverFails: true });
  },

  uploadDocument: function (input) {
    const name = (input && input.file) || 'untitled.pdf';
    return apiCall('uploadDocument ' + name, function () {
      const job = makeJob({ file: name, status: 'processing', progress: 8 });
      DB = [job].concat(DB);
      return Object.assign({}, job);
    });
  },

  retryJob: function (id) {
    return apiCall('retryJob ' + id, function () {
      const job = DB.find(function (j) { return j.id === id; });
      if (!job) throw new Error('404 — no job with id ' + id);
      job.status = 'processing';
      job.progress = 5;
      job.confidence = null;
      return Object.assign({}, job);
    });
  },

  /* A fresh long job that needs 4–5 polls to finish. */
  startExtraction: function (name) {
    return apiCall('startExtraction', function () {
      const job = makeJob({ file: name || 'contract-acme-v3.pdf', status: 'processing', progress: 0 });
      DB = [job].concat(DB);
      return Object.assign({}, job);
    }, { neverFails: true });
  },

  reset: function () { seedDB(); }
};
