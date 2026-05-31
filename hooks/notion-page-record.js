#!/usr/bin/env node
'use strict';

const {
  NOTION_WRITE_TOOLS, resolveStage, extractPagesFromInput, extractPageIds,
} = require('./lib/notion');
const { readStdin, allow, log } = require('./lib/hook-runtime');
const { readActiveTask, markStagePublished } = require('./lib/progress');

(async () => {
  const root = process.env.DEV_ROOT || process.cwd();
  const raw = await readStdin();

  let payload;
  try { payload = JSON.parse(raw); }
  catch { log({ hook: 'page-record', event: 'skip', reason: 'invalid-json' }); return allow(); }

  const toolName = payload?.tool_name || '';
  if (!NOTION_WRITE_TOOLS.has(toolName)) return allow();

  const pages = extractPagesFromInput(toolName, payload.tool_input);
  const ids = extractPageIds(payload.tool_response);

  if (!ids.length) {
    log({ hook: 'page-record', event: 'miss', reason: 'no-page-id-in-response', tool: toolName });
    return allow();
  }

  const task = readActiveTask(root);
  if (!task) {
    log({ hook: 'page-record', event: 'skip', reason: 'no-active-task' });
    return allow();
  }

  const len = Math.min(pages.length, ids.length);
  for (let i = 0; i < len; i++) {
    const stage = resolveStage(pages[i].title);
    if (!stage) {
      log({ hook: 'page-record', event: 'skip', reason: 'unknown-title', title: pages[i].title });
      continue;
    }
    const ok = markStagePublished(root, task, stage, ids[i]);
    if (ok) {
      log({ hook: 'page-record', event: 'capture', stage, title: pages[i].title, pageId: ids[i] });
    } else {
      log({ hook: 'page-record', event: 'skip', reason: 'not-done-or-missing-stage', stage });
    }
  }
  return allow();
})();
