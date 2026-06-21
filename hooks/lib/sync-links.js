#!/usr/bin/env node
'use strict';

const { readStdin, log } = require('./hook-runtime');
const { syncLinks } = require('./work');

function out(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
  process.exit(0);
}

(async () => {
  const work = process.argv[2];
  if (!work) {
    process.stderr.write('usage: sync-links.js <work>\n');
    process.exit(1);
  }
  const root = process.env.DEV_ROOT || process.cwd();
  const raw = await readStdin();

  let children;
  try { children = JSON.parse(raw); }
  catch {
    log({ hook: 'sync-links', event: 'skip', reason: 'invalid-json', work });
    return out({});
  }
  if (!Array.isArray(children)) children = [];

  const links = syncLinks(root, work, children);
  if (links === null) {
    log({ hook: 'sync-links', event: 'skip', reason: 'no-work-json', work });
    return out({});
  }
  log({ hook: 'sync-links', event: 'sync', work, count: children.length });
  return out(links);
})();
