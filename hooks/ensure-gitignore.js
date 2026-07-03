#!/usr/bin/env node
'use strict';

const { ensureGitignore } = require('./lib/gitignore');

const root = process.argv[2] || process.env.DEV_ROOT || process.cwd();
const { added, file } = ensureGitignore(root);
if (added.length) process.stdout.write(`gitignore 갱신(${file}): +${added.length}개\n${added.map((e) => '  ' + e).join('\n')}\n`);
else process.stdout.write(`gitignore 이미 최신(${file})\n`);
process.exit(0);
