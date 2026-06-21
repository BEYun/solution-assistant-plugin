const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function tmpRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), 'yb-session-resume-')); }

function runHook(root) {
  return spawnSync(process.execPath, [path.join(__dirname, '..', 'session-resume.js')], {
    env: { ...process.env, DEV_ROOT: root, DEV_LOG_DIR: path.join(root, 'logs') },
    encoding: 'utf8',
    input: '',
  });
}

test('emits empty stdout (silent) when no activeWork', () => {
  const root = tmpRoot();
  const result = runHook(root);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '');
});

test('emits resume block with work + workType + route-work when work.json exists', () => {
  const root = tmpRoot();
  const ws = path.join(root, '.workflow', 'workspace.json');
  fs.mkdirSync(path.dirname(ws), { recursive: true });
  fs.writeFileSync(ws, JSON.stringify({ activeWork: 'DCL-1234' }));
  const wf = path.join(root, '.workflow', 'DCL-1234', 'work.json');
  fs.mkdirSync(path.dirname(wf), { recursive: true });
  fs.writeFileSync(wf, JSON.stringify({ work: 'DCL-1234', workType: 'feature', links: { 'write-policy': 'p-1' } }));
  const result = runHook(root);
  assert.equal(result.status, 0);
  const ctx = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /<yeoboya-workflow-resume>/);
  assert.match(ctx, /DCL-1234/);
  assert.match(ctx, /feature/);
  assert.match(ctx, /\/yeoboya-route-work/);
});

test('emits create-work guidance when activeWork present but no work.json', () => {
  const root = tmpRoot();
  const ws = path.join(root, '.workflow', 'workspace.json');
  fs.mkdirSync(path.dirname(ws), { recursive: true });
  fs.writeFileSync(ws, JSON.stringify({ activeWork: 'DCL-9999' }));
  const result = runHook(root);
  const ctx = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /DCL-9999/);
  assert.match(ctx, /\/yeoboya-create-work/);
});
