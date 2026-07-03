'use strict';

const fs = require('node:fs');
const path = require('node:path');

// `.assistant/` 아래 로컬 전용(커밋 금지) 파일들. `.assistant/` 전체가 아니라
// 파일별로 무시한다 — task.json/workspace.json 등은 커밋 대상이기 때문.
const HEADER = '# solution-assistant (local-only)';
const GITIGNORE_ENTRIES = [
  '.assistant/improvement-log.jsonl',
  '.assistant/.friction-session/',
  '.assistant/insights.html',
  '.assistant/.insights-narrative.html',
];

// 대상 repo의 .gitignore에 누락된 엔트리만 idempotent하게 덧붙인다.
// 반환: { added: string[], file: string }
function ensureGitignore(root) {
  const file = path.join(root, '.gitignore');
  let existing = '';
  try { existing = fs.readFileSync(file, 'utf8'); } catch {}

  const present = new Set(existing.split('\n').map((l) => l.trim()));
  const missing = GITIGNORE_ENTRIES.filter((e) => !present.has(e));
  if (!missing.length) return { added: [], file };

  let out = existing;
  if (out.length && !out.endsWith('\n')) out += '\n';
  if (!present.has(HEADER)) out += HEADER + '\n';
  out += missing.join('\n') + '\n';

  fs.writeFileSync(file, out);
  return { added: missing, file };
}

module.exports = { ensureGitignore, GITIGNORE_ENTRIES, HEADER };
