---
name: yeoboya-write-qa
description: "yeoboya-select-subtask이 이 세부 작업을 trigger할 때만 사용한다. 직접 호출 금지. 이전 산출물(UI 흐름도, 데이터 흐름도, write-code 커밋)로부터 QA 시나리오를 도출해 'QA 시나리오' Notion 데이터베이스(테이블)로 게시한다. 각 행은 하나의 테스트 케이스(속성: 케이스 ID·액터·카테고리·시나리오·관련 API / Socket·테스트 결과)이고, 행 본문에 사전 조건·테스트 단계·기대 결과를 정의한다."
user-invocable: false
---

# yeoboya-write-qa

QA 시나리오 작성. 산출물은 마크다운 페이지가 아니라 **작업 row 자식 데이터베이스(테이블)** "QA 시나리오"다 — 행마다 한 테스트 케이스, 속성으로 필터·정렬·그룹핑이 가능하고 테스트 결과를 사람이 직접 채워 넣는다(참고 구조: DallaGame TC).

## 1. 전제

- work.json 존재.
- **진입 시 sync (필수 첫 동작)**: `yeoboya-publish-notion mode="sync-links"`(work=작업번호)를 1회 호출해 작업 row 자식(페이지·데이터베이스)을 `work.json.links`에 동기화한다 — (a) 다른 작업자가 만든 선행 문서를 links에서 인식, (b) 본 산출물(QA 시나리오 DB)이 이미 있으면 publish가 append-only 재게시가 되어 중복 DB·행을 막는다.

## 2. 입력 fetch

- UI 흐름도 (화면/사용자 액션 → 시나리오 도출의 출발점)
- 데이터 흐름도 / 통신 명세서 (API 엔드포인트·Socket 이벤트 → `관련 API / Socket` 채움)
- write-code 또는 fix-bug 커밋 (`git log --grep='[<작업번호>]'`) — 실제 구현된 동작 확인

## 3. 테이블 스키마

DB 제목은 항상 "QA 시나리오"(`KEY_TO_TITLE['write-qa'][0]`). 컬럼:

| 속성 | 타입 | 비고 |
|---|---|---|
| 케이스 ID | title | `QA-NNN` 패턴, 유일 |
| 액터 | select | 사용자 / 게스트 / 관리자 / 시스템 / 공통 |
| 카테고리 | select | 기본 로드 / 사용자 인터랙션 / API 데이터 검증 / 에러 처리 / 권한/조건 분기 / 화면 전환 / 소켓 이벤트 |
| 시나리오 | text | 한 줄 요약 (무엇을 검증하는가) |
| 관련 API / Socket | text | 데이터 흐름도의 엔드포인트/이벤트. 없으면 `로컬` 또는 공란 |
| 테스트 결과 | select | 미테스트(기본) / Pass / Fail / N/A — 신규 행은 모두 `미테스트`, 실제 결과는 QA 수행 시 사람이 채움 |

DDL (publish 시 `schema`로 전달):

```sql
CREATE TABLE (
  "케이스 ID" TITLE,
  "액터" SELECT('사용자':blue, '게스트':orange, '관리자':purple, '시스템':gray, '공통':default),
  "카테고리" SELECT('기본 로드':blue, '사용자 인터랙션':green, 'API 데이터 검증':orange, '에러 처리':red, '권한/조건 분기':purple, '화면 전환':gray, '소켓 이벤트':brown),
  "시나리오" RICH_TEXT,
  "관련 API / Socket" RICH_TEXT,
  "테스트 결과" SELECT('미테스트':default, 'Pass':green, 'Fail':red, 'N/A':gray)
)
```

뷰는 만들지 않는다(기본 테이블 뷰면 충분). select 옵션은 위 범용 세트를 사용하고, 행 값은 반드시 이 옵션 중 하나여야 한다.

## 4. 행(케이스) 본문 구조

각 행 페이지의 본문(`content`)은 아래 3개 섹션을 모두 정의한다:

```markdown
## 사전 조건
- <테스트 시작 전 갖춰야 할 상태 — 로그인 여부, 데이터, 진입 화면 등>

## 테스트 단계
1. <사용자/시스템 동작 1>
2. <동작 2>

## 기대 결과
- <각 단계 후 관찰되어야 하는 결과 — 화면 전환, 표시 데이터, 에러 메시지 등>
```

## 5. 작성 절차

1. UI 흐름도의 화면·사용자 액션을 따라가며 케이스를 도출한다. **골든 패스 / 엣지·예외 / 회귀**를 카테고리로 흡수한다:
   - 정상 경로 → `기본 로드` · `사용자 인터랙션` · `화면 전환`
   - 예외/경계 → `에러 처리` · `권한/조건 분기`
   - API/Socket 검증 → `API 데이터 검증` · `소켓 이벤트`
2. 각 케이스에 `QA-NNN`(001부터) 부여, 액터·카테고리·시나리오를 정한다.
3. 데이터 흐름도에서 대응 엔드포인트/이벤트를 찾아 `관련 API / Socket`을 채운다.
4. 행 본문에 사전 조건·테스트 단계·기대 결과를 작성한다.
5. `테스트 결과`는 전부 `미테스트`로 둔다.

## 6. Self-validation (publish 직전)

- [ ] 케이스 ID가 `QA-NNN` 패턴이고 유일
- [ ] 모든 행에 액터·카테고리·시나리오·테스트 결과가 채워짐 (`테스트 결과`=미테스트)
- [ ] 액터·카테고리·테스트 결과 값이 §3 select 옵션 안에 있음
- [ ] 카테고리 커버리지: 정상 경로(`기본 로드`/`사용자 인터랙션`/`화면 전환` 중)와 예외(`에러 처리`/`권한/조건 분기` 중) 각 최소 1개
- [ ] API/Socket을 거치는 케이스는 `관련 API / Socket`이 데이터 흐름도 명세와 일치
- [ ] 모든 행 본문에 사전 조건·테스트 단계·기대 결과 3개 섹션이 존재

## 7. publish

```
yeoboya-publish-notion 호출:
  work: <작업번호>
  mode: "dispatch-db"
  key: "write-qa"
  schema: <§3 DDL>
  rows:
    - properties: { "케이스 ID": "QA-001", "액터": "사용자", "카테고리": "기본 로드",
                    "시나리오": "...", "관련 API / Socket": "POST /auth/login", "테스트 결과": "미테스트" }
      content: "## 사전 조건\n...\n## 테스트 단계\n1. ...\n## 기대 결과\n- ..."
    - ...
```

publish-notion이 신규면 DB 생성+행 추가 후 `sync-links`로 `links['write-qa']`(=DB id)를 기록하고, 재게시면 기존 케이스 ID는 보존(append-only)하고 새 케이스만 추가한다(§4.5). 본 스킬은 work.json·links를 직접 쓰지 않는다.

## 8. 종료 안내

```
QA 시나리오 작성 완료. 다음 권장 단계: <다음 단계>.
새 세션에서 /yeoboya-select-subtask을 호출하세요.
```

`<다음 단계>`는 workType별로 채운다 (SUBTASK_GROUPS상 write-qa 다음 = "개발" 그룹): feature → "코드 작성", update → "코드 수정", bugfix → "버그 수정".
