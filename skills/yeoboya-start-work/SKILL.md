---
name: yeoboya-start-work
description: "Use when the user invokes /yeoboya-start-work <작업번호>, or expresses intent to start a new feature/update/bugfix task in this codebase ('새 작업 시작', '기능 추가 시작', '버그 수정 작업 시작'). Bootstraps a new task: validates workspace, asks workType explicitly (no inference), creates .workflow/<task>/progress.json with WORKTYPE_STAGES[<workType>] keys initialized to todo, and registers/updates the task DB row in Notion via yeoboya-publish-notion. NEVER infers workType — always ask. Always allows parallel work; existing progress.json triggers a safety gate only when SAME task number is reused."
---

# yeoboya-start-work

새 작업 부트스트랩. workType은 사용자가 명시 선택 (추론 금지).

## 1. 입력 검증

- `<작업번호>` 형식 검증: 정규식 `^[A-Z]+-\d+$` (예: DCL-1234, AID-99). 실패 시 형식 안내 후 종료
- `.workflow/workspace.json` 존재 확인. 없으면 "/yeoboya-setup-workspace를 먼저 실행하세요" 안내 후 종료

## 2. 같은 작업번호 안전 게이트

`.workflow/<작업번호>/progress.json`이 존재하면 사용자에게 명시 게이트:

```
이 작업번호로 진행 중인 progress.json이 있습니다. 새로 시작하면 기존 진행 상태가 덮어써집니다.
재개하시려면 /yeoboya-continue-work을 사용하세요.
그래도 새로 시작하시겠습니까? (네 / 아니요)
```

"네" 외 응답 → 종료. 다른 작업번호의 진행 중 작업이 있어도 *병렬 작업을 허용* — 별도 게이트 없음.

## 3. workType 게이트 (명시 질문)

```
작업 유형을 선택하세요:
  - 기능 추가 (feature)
  - 기능 수정 (update)
  - 버그 수정 (bugfix)
```

문자열 매칭 — "feature", "기능 추가", "추가" 등 일반 동의어 허용. 모호하면 재질문.

## 4. 작업명 입력

```
작업명을 입력해주세요 (예: "라이브 방송 검색 기능"):
```

## 5. workType=update 전용: referenceTask 게이트

```
참고할 기존 feature 작업이 있나요?
  - 있음 → 참고 작업번호 입력 (예: DCL-1230)
  - 없음 → 독립 신규로 진행
```

참고 작업번호 입력 시 형식 검증.

## 6. progress.json 초기화

`references/state-schema.md §4 WORKTYPE_STAGES[<workType>]` 키 셋으로 stages 객체 빌드. 모든 stage status는 `"todo"`. 작성:

```json
{
  "task": "<작업번호>",
  "workType": "<feature|update|bugfix>",
  "name": "<작업명>",
  "stages": { ... },
  "referenceTask": "<선택 시만>"
}
```

`.workflow/<작업번호>/progress.json`에 쓰기.

## 7. Notion 작업 DB row 등록

`yeoboya-publish-notion` 호출 (mode="dispatch", 또는 sync 후 dispatch):
1. sync로 row 존재 확인
2. row 없으면 create. 있으면 update (workType / 작업명 / 담당자 / referenceTask 속성 반영)
3. **도메인 추출**: sync 결과의 '도메인' select 속성 → progress의 별도 필드 또는 후속 stage skill에서 참조. 비어 있으면 사용자 입력 게이트:
   ```
   Notion 작업 row에 '도메인' 값이 비어 있습니다. 도메인을 입력해주세요 (예: 라이브방송):
   ```

## 8. activeTask 갱신

`.workflow/workspace.json`의 `activeTask` 필드를 `<작업번호>`로 갱신.

## 9. 종료 안내

```
작업 부트스트랩 완료: <작업번호> · <workType 한국어 라벨>
다음 단계 진행은 새 세션에서 /yeoboya-continue-work을 호출하세요.
```

stage 자동 trigger **없음** — 사용자가 명시적으로 새 세션 + continue-work으로 진행.

## 10. Self-validation

progress.json 저장 직전 검증:
- `task` 형식 일치
- `workType ∈ {feature, update, bugfix}`
- `stages` 키 셋이 `WORKTYPE_STAGES[<workType>]`와 정확히 일치
- `referenceTask`는 update + 사용자 선택 시에만 존재
