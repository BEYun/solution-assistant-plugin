---
name: yeoboya-publish-notion
description: "MANDATORY for any Notion page write or task DB row mutation in yeoboya-workflow. NEVER call `notion-create-pages` or `notion-update-page` directly from a stage skill — invoke this skill first. It handles task DB row upsert (dispatch), workspace-aware property setting, and surfaces the page title that the `notion-page-record` hook needs for the done→published transition. Use when any stage skill (write-policy, write-domain, draw-ui-flow, draw-data-flow, write-qa) needs to publish its deliverable, or when start-work needs to register/sync the task DB row."
user-invocable: false
---

# yeoboya-publish-notion

Notion 쓰기의 단일 진입점. 모든 stage skill은 산출물을 publish할 때 본 skill을 통해 Notion에 쓴다.

## 1. 도구 호출 규약

- create 경로: `mcp__claude_ai_Notion__notion-create-pages`
- update 경로: `mcp__claude_ai_Notion__notion-update-page` (기존 `notionPageId`가 있을 때)
- **upsert 규칙**: `progress.stages[<stage>].notionPageId`가 있으면 update, 없으면 create

## 2. 페이지 제목 규약 (hook이 stage 추론에 사용)

| Stage | 페이지 제목 |
|---|---|
| write-policy | 정책서 |
| write-domain | 도메인 명세서 |
| draw-ui-flow | UI 흐름도 |
| draw-data-flow | 데이터 흐름도 |
| write-qa | QA 시나리오 |

이 매핑은 `references/state-schema.md §4 STAGE_TITLE_TO_KEY`와 일치해야 한다. 변경 시 hook lib `notion.js`의 `TITLE_TO_STAGE`도 함께 갱신.

## 3. 호출 형태

호출 시 다음 파라미터를 받는다:

- `task`: 작업번호 (e.g., "DCL-1234")
- `stage`: stage 키 (e.g., "write-policy")
- `mode`: "dispatch" | "sync"
  - `dispatch`: stage 산출물 페이지 create/update. payload에는 `title`, `markdown`, 옵션 properties
  - `sync`: 작업 DB row 조회. start-work에서 도메인 추출용

## 4. dispatch 흐름

1. `task`로 progress.json 로드 → `stages[stage].notionPageId` 확인
2. workspace.json 로드 → `notion.taskDbDataSourceUrl`, `notion.workerPageId`, `notion.domainMapping` 가져오기
3. notionPageId가 있으면 update-page (replace_content), 없으면 create-pages
4. response 결과 출력. **별도 progress 업데이트 없음** — `notion-page-record` hook이 처리.

## 5. sync 흐름

1. workspace.json의 `notion.taskDbDataSourceUrl`로 작업 DB query
2. `<task>` 키 매칭되는 row 조회
3. 반환: `{ rowId, workType, 작업명, 도메인, 담당자[] }` (없는 필드는 null)

## 6. 호출자 (start-work / stage skills)에게 노출되는 인터페이스

```
yeoboya-publish-notion 호출 파라미터:
  task: "DCL-1234"
  mode: "dispatch" | "sync"
  (dispatch만) stage: "<stage 키>"
  (dispatch만) title: "<페이지 제목 — §2 표 참조>"
  (dispatch만) markdown: "<페이지 본문>"
  (dispatch만) properties?: { workType?, 작업명?, 도메인?, 담당자? }
```

## 7. 에이전트 사용

본 skill은 `agents/notion-writer.md`를 subagent로 호출하여 실제 도구 호출과 페이로드 빌딩을 위임할 수 있다. 단순 호출은 본 skill 본문에서 직접 처리.
