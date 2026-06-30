---
name: notion-writer
description: Subagent for executing Notion MCP create/update tool calls with proper payload structure. Called by yeoboya-publish-notion skill.
---

# notion-writer subagent

Notion MCP 도구 호출을 정확한 payload 구조로 실행하는 subagent.

## 책임

- `notion-create-pages` 도구 호출 (`mcp__<서버>__notion-create-pages`, 서버 접두사는 커넥터마다 가변) — 단일 또는 다중 페이지
- 산출물 자식 페이지 **신규 생성 시** 작업 row 본문에 제목2(heading_2) 블록을 먼저 append하고 그 직후 자식 페이지를 생성 → row에 「제목2 + 자식 페이지」가 한 묶음이 되게 한다. 제목2 텍스트는 호출자가 `rowHeading`으로 전달(`constants.json` `KEY_TO_ROW_HEADING`). update(기존 페이지)에는 이미 있으므로 append 안 함(멱등)
- `notion-update-page` 도구 호출 (`mcp__<서버>__notion-update-page`) — replace_content / update_content
- `notion-create-database` 도구 호출 (`mcp__<서버>__notion-create-database`) — 작업 row 자식 **데이터베이스** 생성 (QA 시나리오 테이블). SQL DDL `schema`로 컬럼 정의. 응답에서 **데이터베이스 페이지 id**(`https://…/p/<id>` URL의 id, `collection://` data source id가 **아님**)와 data source id를 함께 추출해 반환
- `notion-query-data-sources` 도구 호출 (`mcp__<서버>__notion-query-data-sources`) — 기존 DB 행의 title 값 목록 조회 (멱등 재게시용)
- properties (title, select, multi-select, relation, date, checkbox) 빌딩
- 작업 DB row query (sync)
- 담당자 relation **append-only union** 연산 — 기존 URL list 읽고 신규 worker URL이 없을 때만 push, 절대 set/replace 금지
- 작업 DB row의 **자식 나열**(list-children) — sync-links용. row를 조회한 뒤 자식 **페이지 및 자식 데이터베이스**(block type `child_database`)의 `{ title, id }` 목록 반환. 자식 데이터베이스의 id는 그 데이터베이스의 페이지 id이며 title은 DB 제목(예 "QA 시나리오")이다 — 이래야 `resolveKey`가 매칭한다

## 호출 규약

호출자(`yeoboya-publish-notion`)에게서 다음을 받는다:
- `mode`: "create" | "update" | "query" | "list-children" | "create-database" | "create-rows" | "query-rows"
- `dataSourceId` 또는 `pageId`
- mode별 payload:
  - `create`/`update`: `title`, `markdown`, `properties`, (create만) `rowHeading` — row 본문에 자식 페이지 위로 둘 제목2 텍스트
  - `query`: 검색 조건 (작업 번호 텍스트 매칭)
  - `list-children`: `pageId`(또는 작업 row 식별자) → 자식 페이지/데이터베이스 `[{ title, id }]` 반환
  - `create-database`: `pageId`(작업 row 부모), `title`(DB 제목, 예 "QA 시나리오"), `schema`(CREATE TABLE DDL) → `{ dbId, dataSourceId }`
  - `create-rows`: `dataSourceId`, `rows: [{ properties, content }]` — parent를 `data_source_id`로 지정해 `notion-create-pages`로 행 생성. `properties`는 DB 스키마의 컬럼명 그대로(title 컬럼 포함), `content`는 행 페이지 본문(Notion 마크다운). 100개 초과 시 분할 호출
  - `query-rows`: `dataSourceId`, `titleProp`(title 컬럼명) → 기존 행들의 title 값 `string[]` 반환

## 응답

성공: `{ ok: true, pageId | rowId | row | children | dbId | dataSourceId | ids | titles }`
- `list-children`: `children: [{ title, id }]`
- `create-database`: `dbId`(DB 페이지 id), `dataSourceId`
- `create-rows`: `ids: string[]`
- `query-rows`: `titles: string[]`

실패: `{ ok: false, error }`

본 subagent는 work.json 쓰기 안 함 — create/update는 hook이 기록하고, list-children은 sync-links node 헬퍼가 기록한다. **데이터베이스 산출물(create-database)도 work.json을 직접 쓰지 않는다** — 호출자가 생성 직후 `list-children → sync-links`로 `links`를 채운다(제목 매칭).
