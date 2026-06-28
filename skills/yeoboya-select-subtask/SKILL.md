---
name: yeoboya-select-subtask
description: "사용자가 /yeoboya-select-subtask을 호출하거나, 세부작업 목록을 열거나 작업을 진행하려는 의도를 표현할 때('작업 진행', '세부작업 목록', '다음 세부 작업') 사용한다. .workflow/에서 작업(각각 work.json을 가짐)을 스캔하고, 사용자가 하나를 고르게 하며(activeWork는 [현재]로 표시), 추천 없이 workType별로 다르게 구성된 세부작업 목록(그룹별)을 보여준 뒤 Skill 도구로 선택된 yeoboya-<key> 스킬을 trigger한다. 구현에 착수하기 전 write-code 진입 게이트(sync-links + 필수 문서 검사; workType=feature는 정책서/UI 흐름도/데이터 흐름도가 없으면 하드 블록)를 포함한다."
user-invocable: true
---

# yeoboya-select-subtask

작업 선택 + 전체 세부작업 목록 표시 + Skill 도구로 trigger.

## 1. 작업 목록 스캔

`.workflow/` 디렉토리를 스캔하여 `work.json`이 있는 모든 작업 폴더를 수집:

```
진행 중 작업 목록:
  - [DCL-1234] 라이브 방송 검색 — 기능 추가 [현재]
  - [DCL-1245] 클럽 입장 시 알림 — 버그 수정

어느 작업을 진행하시겠어요? 작업번호를 입력하세요.
```

`[현재]` 마커는 `workspace.json`의 `activeWork`와 일치하는 작업에 부착. 목록이 비어 있으면 안내 후 종료. 작업번호가 1개뿐이면 자동 선택 (안내만 출력).

## 2. activeWork 갱신

사용자 선택 → `workspace.json`의 `activeWork` 필드를 선택된 작업번호로 갱신.

## 3. 세부작업 목록 표시

`references/state-schema.md §4`의 `SUBTASK_GROUPS[<workType>]`(work.json.workType) 그룹·키 순서로 표시한다. 라벨은 `SUBTASK_LABELS[<key>][<workType>]`. **workType에 따라 노출 그룹·세부작업·라벨이 다르다** (feature/update 5그룹·10개, bugfix 4그룹·6개). 마커 규칙:

| 조건 | 마커 |
|---|---|
| `work.json.links`에 해당 키 존재 | ✓ |
| 그 외 | (공백) |

추천 마커(▶)는 없다. 모든 세부 작업은 동등하게 나열된다.

예시 (feature):
```
[DCL-1234 · 라이브 방송 검색 · 기능 추가]

세부작업 목록 (원하는 세부 작업을 선택하세요):
  ◆ 기획
    ✓ 기획서 검토
      정책서 작성
  ◆ 설계
      도메인 명세서
      UI 흐름도
    ✓ 데이터 흐름도
      QA 시나리오
  ◆ 개발
      코드 작성
      코드 리뷰
  ◆ QA 대응
      QA 버그 수정
  ◆ 종결
      작업 종결
```

예시 (bugfix):
```
[DCL-1245 · 클럽 입장 알림 · 버그 수정]

세부작업 목록 (원하는 세부 작업을 선택하세요):
  ◆ 진단
      버그 분석
      QA 시나리오
  ◆ 개발
      버그 수정
      코드 리뷰
  ◆ QA 대응
      QA 버그 수정
  ◆ 종결
      작업 종결
```

> update는 feature와 구성이 동일하고 라벨만 '수정'(정책서 수정·코드 수정 등)이다.

키·라벨 매핑은 `references/state-schema.md §4`의 `SUBTASK_GROUPS`/`SUBTASK_LABELS` 참조.

## 4. 메뉴 (자연어 응답)

"진행할 세부 작업 이름을 입력하세요 (종료: '취소')."

세부 작업 이름은 `SUBTASK_LABELS`의 한국어 라벨 또는 키(예: `write-policy`) 모두 매칭. **단축키(y/s/n) 사용 금지.**

## 5. 응답 분기

| 응답 | 동작 |
|---|---|
| 세부 작업 이름 (`links`에 없음) | 해당 세부 작업 trigger (§6 게이트 → §7) |
| 세부 작업 이름 (`links`에 이미 존재) | "이 세부 작업은 이미 Notion 페이지가 있습니다. 다시 실행하면 기존 페이지를 갱신합니다. 진행할까요? (네/아니요)" → "네"면 trigger |
| "취소" / "종료" | 종료 |

**작업 종결 전용 선행 확인** (세부 작업 이름 매칭 후, trigger 전):

`work.json.reviewDone`을 확인한다.
- `false`이면 즉시 하드 블록:
  ```
  코드 리뷰가 완료되지 않았습니다. 코드 리뷰(review-code)를 먼저 진행해 주세요.
  ```
  메뉴(§4)로 복귀. "네/아니요" 게이트 없음.
- `true`이면 기존 흐름대로 trigger.

이 블록(reviewDone 확인)은 workType에 무관하게 항상 하드 블록이다. (write-code 게이트(§6)의 하드 블록은 feature 한정인 것과 구분된다.)

## 6. 진입 게이트

### 6.1 write-code 필수 문서 (대상이 `write-code`일 때만)

trigger 직전:

1. **선행 문서 sync** — `yeoboya-publish-notion mode="sync-links"`(work=작업번호)를 호출해 작업 row 자식 페이지를 `work.json.links`에 동기화한다.
2. **필수 집합 검사** — 필수 집합 = `{write-policy, draw-ui-flow, draw-data-flow}`. 동기화된 `work.json.links`에서 각 키 존재를 확인한다. 누락 키의 라벨은 `SUBTASK_LABELS`(`references/state-schema.md §4`)로 변환.
   - **workType=feature**: 누락 키가 하나라도 있으면 **하드 블록**:
     ```
     코드 작성에는 다음 문서가 Notion에 먼저 있어야 합니다: <누락 라벨 목록>.
     해당 문서를 직접 작성하거나 세부 작업으로 생성한 뒤 다시 시도하세요.
     ```
     §4 메뉴로 복귀. 진행 불가.
   - **workType=update 또는 bugfix**: 누락이 있어도 경고 후 확인:
     ```
     다음 문서가 아직 없습니다: <누락 라벨 목록>. 그래도 코드 작성을 진행할까요? (네/아니요)
     ```
     "네" 외 응답 → §4 메뉴 복귀.
3. 통과 시:
   - feature: `기획·설계 산출물 확정됨, 코드 작성을 진행합니다.` 안내 후 §7 trigger.
   - update/bugfix: 위 확인을 통과하면 §7 trigger.

이 게이트는 feature에 한해 하드 블록이다. 다른 세부 작업에는 이 검사를 적용하지 않는다.

### 6.2 버그 분석 선행 경고 (대상이 `write-qa`이고 `workType=bugfix`일 때만)

trigger 직전, `work.json.links`에 `analyze-bug`이 없으면 **소프트 경고**:
```
버그 분석이 아직 없습니다. 그래도 QA 시나리오를 진행할까요? (네/아니요)
```
"네"면 §7 trigger. 그 외 응답은 §4 메뉴로 복귀. **차단(하드 블록)이 아니다.** (update/bugfix write-code 경고와 동일 UX 패턴)

write-code(§6.1 하드 블록)와 이 경고(§6.2 소프트)가 게이트의 전부다. 그 외 세부 작업에는 선행조건이 없다.

> 참고: `write-code`는 feature/update 뷰에만, `write-qa`는 bugfix `진단` 그룹에 존재한다(§3). 따라서 6.1은 feature/update에서만, 6.2는 bugfix에서만 발동한다.

## 7. 세부 작업 trigger

Skill 도구로 해당 `yeoboya-<key>` skill 호출. 전달 컨텍스트:

- `work` (작업번호)
- `workType`
- 필요 시 `referenceWork`

## 8. 세부 작업 완료 후 종료

trigger된 skill이 완료 안내를 출력하면 본 skill은 **반복하지 않고 즉시 종료**. 사용자는 새 세션에서 `/yeoboya-select-subtask`를 다시 호출.

## 9. Self-validation

trigger 전:
- 선택한 키가 현재 workType의 `SUBTASK_GROUPS[<workType>]`에 **노출되는 키**인지 검증(`SUBTASK_LIST` 등록부 + workType 뷰 양쪽). 노출되지 않는 키면 trigger 금지.
- 대상이 `write-code`이면 §6.1 절차(sync-links 실행 → 필수 집합 검사)를 수행했는지 검증. feature인데 필수 3종이 동기화된 links에 모두 존재하지 않으면 trigger 금지.
- 대상이 `write-qa`이고 `workType=bugfix`이면 §6.2 경고를 거쳤는지 검증.
