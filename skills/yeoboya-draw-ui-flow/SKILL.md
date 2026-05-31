---
name: yeoboya-draw-ui-flow
description: "Use ONLY when yeoboya-continue-work triggers this skill for workType=feature/update after write-domain. NEVER invoke directly. Defines screens with unique IDs, user actions with unique IDs per screen, and the screen-transition diagram. Self-validates that every screen-action pair has an ID (used by draw-data-flow for ID-based linking). Publishes Notion page titled 'UI 흐름도'."
user-invocable: false
---

# yeoboya-draw-ui-flow

UI 흐름도 작성. **화면(screen)과 사용자 액션(user action)을 ID로 매핑**하여 후속 단계(draw-data-flow)와 연동 가능하게 한다.

## 1. 전제

- `stages.write-domain.status` ∈ {`done`, `published`}
- `stages.draw-ui-flow.status === "todo"` 또는 재실행

## 2. 입력 fetch

- 도메인 명세서 + 정책서 fetch

## 3. 작성 절차

본문 구조:

```
# UI 흐름도

## 1. 화면 정의
| 화면 ID | 화면명 | 설명 |
|---|---|---|
| S-001 | 로그인 | ... |
| S-002 | 홈 | ... |

## 2. 사용자 액션 정의 (화면 ID별)
| 액션 ID | 소속 화면 | 트리거 | 결과 |
|---|---|---|---|
| A-001 | S-001 | 로그인 버튼 탭 | 인증 API 호출 → S-002 이동 |
| A-002 | S-002 | 검색 입력 | 검색 결과 표시 |

## 3. 화면 전이 다이어그램
(mermaid 또는 텍스트 다이어그램)
```

화면 ID 패턴: `S-NNN`. 액션 ID 패턴: `A-NNN`. **모든 액션은 정확히 한 화면에 속한다.**

## 4. Self-validation (publish 직전)

- [ ] §1 화면 정의에 최소 1개 행, 화면 ID는 모두 유일 (`S-NNN` 패턴)
- [ ] §2 사용자 액션의 모든 액션 ID는 유일 (`A-NNN` 패턴)
- [ ] §2의 모든 "소속 화면" 값이 §1의 화면 ID에 존재
- [ ] §3 전이 다이어그램에 §1의 모든 화면 등장
- [ ] 도메인 명세서의 액터별로 최소 1개 화면이 존재 (사용자 확인)

## 5. publish

```
yeoboya-publish-notion 호출:
  task: <progress.task>
  mode: "dispatch"
  stage: "draw-ui-flow"
  title: "UI 흐름도"
  markdown: <본문>
```

## 6. 종료 안내

```
UI 흐름도 작성 완료. 다음 권장 단계: 데이터 흐름도.
새 세션에서 /yeoboya-continue-work을 호출하세요.
```
