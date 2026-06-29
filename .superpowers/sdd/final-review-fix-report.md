# Final Review Fix Report (2026-06-29 Code Review)

Generated: 2026-06-29

## Fix 1 (I1) — references/state-schema.md §6 step (2)

File: `references/state-schema.md`, line 160

Changed: `mode="sync"` child-listing → `mode="list-children"` (read-only, work.json 미기록) with explicit `[{title,id}]` return description and clarification that `pageId` is the matched value.

## Fix 2 (I2) — references/state-schema.md §6 step (3) provenance link source

File: `references/state-schema.md`, after line 181 (after existing "병기할 수 있다" sentence)

Added:
> 메타/헤더 "이전 버전"의 `(노션 링크)`는 분기 A에서 `notion-fetch`한 seed 페이지의 Notion URL(seed `pageId` 기반)을 사용한다. 분기 B에는 노션 링크가 없다(`코드베이스 (<지정 경로>)`만 기록).

## Fix 3 (I1 interface) — skills/yeoboya-publish-notion/SKILL.md

File: `skills/yeoboya-publish-notion/SKILL.md`

(a) §3 mode list (line 31): Added `"list-children"` to mode union + description bullet (line 35).

(b) New §5.6 section inserted between §5.5 and §6 (lines 66–74):
- Row lookup via workDbDataSourceUrl (same as §5 sync)
- notion-writer list-children read-only call returning [{title,id}]
- Explicit no-write guarantee; title→key matching delegated to caller

(c) §6 interface code block (line 77): mode union updated to include "list-children".
Added `(list-children만)` comment block (lines 91–92): work만 필요, work.json 미기록 (§5.6).

## Fix 4 (Mi1) — 4 template files: fix raw `|` in 변경 이력 table cells

All 4 files changed the last cell of the example 변경 이력 row from:
`| <referenceWork 작업번호 | 코드베이스: <경로> | —> |`
to:
`| <referenceWork 작업번호 / 코드베이스: <경로> / —> |`

Files changed:
- `skills/yeoboya-write-policy/references/policy-template.md` (line 89)
- `skills/yeoboya-write-domain/references/domain-template.md` (line 61)
- `skills/yeoboya-draw-ui-flow/references/ui-flow-template.md` (line 94)
- `skills/yeoboya-draw-data-flow/references/data-flow-template.md` (line 68)

## Fix 5 (spec alignment) — docs/superpowers/specs/2026-06-29-update-codebase-derivation-design.md

Two occurrences updated to name `list-children`:
- Line 29 (decision 6): changed `직접 읽어 제목 매칭` → `read-only(list-children)로 나열해 제목 매칭`
- Line 50 (§3 step 2): changed `publish-notion mode=sync`...`rowId 획득 → 그 row 자식 페이지를 읽어` → `publish-notion mode="list-children"`...`row 자식 페이지를 read-only 나열해`

Note: line 50 used unquoted `mode=sync` (not `mode="sync"`) — adapted exact match accordingly.

## Verify Outputs

### 1. grep list-children in both files (PASS)
```
references/state-schema.md:160: ... mode="list-children"(work=referenceWork) ...
skills/yeoboya-publish-notion/SKILL.md:31: mode: "dispatch" | "sync" | "sync-links" | "list-children"
skills/yeoboya-publish-notion/SKILL.md:35: - `list-children`: ...
skills/yeoboya-publish-notion/SKILL.md:66: ## 5.6 list-children 흐름 (read-only)
skills/yeoboya-publish-notion/SKILL.md:69: notion-writer `list-children`(read-only) ...
skills/yeoboya-publish-notion/SKILL.md:77: mode: "dispatch" | "sync" | "sync-links" | "list-children"
skills/yeoboya-publish-notion/SKILL.md:91: (list-children만)
```

### 2. §6 child-listing line says list-children, not sync (PASS)
`grep -rn 'mode="sync".*자식|자식 페이지를 나열해' references/state-schema.md` → 0 results (no old sync phrasing remains).

### 3. No raw pipe in template cells (PASS)
`grep -rn '코드베이스: <경로> |' skills/*/references/*.md` → 0 results.

### 4. templates.test.js: pass 8, fail 0 (PASS)

### 5. All hook tests: pass 59, fail 0 (PASS)

## Commit SHA

(Updated after commit)
