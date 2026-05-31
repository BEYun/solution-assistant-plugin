# yeoboya-workflow plugin v2

5개 서비스(달라, 클럽라이브, 여보야, 클럽5678, AI식단) × 2 플랫폼(iOS, Android) × 3 workType(feature, update, bugfix) 개발 워크플로우 자동화.

## 필수 설치사항

- **superpowers 플러그인** (brainstorming, writing-plans, executing-plans 등)
- **Notion MCP** (`mcp__claude_ai_Notion__*` 도구군)

둘 중 하나라도 누락되면 `/yeoboya-setup-workspace`가 차단한다.

## SOT 분리

| 데이터 | SOT |
|---|---|
| 진행 상태 (stage status, workType) | 로컬 `.workflow/<작업번호>/progress.json` |
| write-code phase 진행 | 로컬 `.workflow/<작업번호>/code-phases.json` |
| 산출물 본문 (정책서/흐름도/QA 등) | Notion |
| 워크스페이스 설정 | 로컬 `.workflow/workspace.json` |

연결 규칙: `progress.stages[<key>].notionPageId`로 로컬 상태와 Notion 산출물을 연결.

상태는 로컬, 내용은 Notion. 두 SOT의 의미가 충돌하면: 상태값을 Notion 페이지 존재 여부로 추론하지 않고, 내용을 progress.json 필드로 추론하지 않는다.

## skill 호출 규약

- **user-invocable 진입은 3개**: `/yeoboya-setup-workspace`, `/yeoboya-start-work`, `/yeoboya-continue-work`
- stage skill은 모두 `user-invocable: false`. `continue-work`이 Skill 도구로 trigger한다
- **stage 단위 세션 분리 권장**: stage 완료 후 새 세션에서 `/yeoboya-continue-work` 재호출
- **write-code 진입 게이트**: `continue-work`이 write-code stage trigger 직전 사용자 확인 게이트를 띄운다

## skill self-validation 원칙

각 stage skill은 Notion publish 직전 자기 산출물을 자체 검증한다. 검증 체크리스트는 각 skill 본문 또는 `skills/<name>/references/`에 명시. content-validate hook은 없다.

## 상태/스키마/상수 단일 출처

상태 파일 스키마, 모든 stage 키와 라벨 매핑, workType별 부분집합 — 전부 `references/state-schema.md`에 있다. skill 본문에 중복 정의 금지.
