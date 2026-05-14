# 엽전하나로바뀐내인생 - 개발 가이드

> **새 파일을 만들거나 구조를 바꿀 때마다 같이 업데이트할 것.**
> 마지막 업데이트: Step 0-2 완료 시점

---

## 1. 프로젝트 개요

플레이어는 농사 → 채집 → 판매를 통해 재산을 모아 궁궐에 입성하는 것이 목표.

**기술 스택**: 순수 HTML / CSS / JavaScript (라이브러리 없음)
**Canvas**: Step 3 부터 사용 (캐릭터 걷기). Step 0~2 는 DOM 만 사용.

---

## 2. 개발 단계 (Roadmap)

| Step | 내용                                                     | 상태    |
| ---- | -------------------------------------------------------- | ------- |
| 0    | 큰틀 - 맵 이동, 인벤토리/소지금 표시 (버튼 기반)         | 진행 중 |
| 1    | 농사 (밭 3x3, 심기, 자라기, 수확) + 상점 + 집 업그레이드 | -       |
| 2    | 채집 (산 맵), 물주기 시스템, 의상 업그레이드             | -       |
| 3    | 캐릭터 걷기 (스프라이트, WASD), 낮밤, 사운드, 튜토리얼   | -       |

---

## 3. 파일 구조

```
index.html              ← 진입점, 모든 씬 HTML
css/
  tokens.css            ← 디자인 토큰 (색상, 폰트, 간격, 크기)
  style.css             ← 실제 스타일 (tokens 변수 사용)
js/
  data.js               ← 정적 데이터 (변하지 않음)
  state.js              ← 동적 상태 (게임 중 변함)        [Step 0-3]
  ui.js                 ← 공통 UI 함수 (씬 전환, 인벤토리 그리기) [Step 0-4]
  map.js                ← 맵 렌더링 + 출구 버튼 생성       [Step 0-5]
  game.js               ← 메인 로직, 이벤트 연결           [Step 0-6]
  farm.js               ← 농사 로직                       [Step 1]
  shop.js               ← 상점 로직                       [Step 1]
assets/
  bg/                   ← 맵 배경 이미지
  items/                ← 아이템 아이콘
  sprites/              ← 캐릭터 스프라이트                [Step 3]
DEV_GUIDE.md            ← 이 문서
```

---

## 4. 어디에 뭐가 있는지 (Where Things Live)

> 핵심 원칙: **각 정보는 한 곳에만 존재한다** (Single Source of Truth).
> 어디에 있는지 헷갈리면 이 표를 본다.

### 4.1 인벤토리

| 무엇                   | 어디                                | 왜                         |
| ---------------------- | ----------------------------------- | -------------------------- |
| 칸 크기 (56px)         | `tokens.css`                        | 시각 — CSS가 모양 담당     |
| 칸 개수 (20)           | `data.js` → `CONFIG.INVENTORY_SIZE` | 게임 규칙 — JS가 로직 담당 |
| 레이아웃 (10×2 그리드) | `style.css` → `#inventory-bar`      | 시각 — CSS가 배치 담당     |
| 인벤토리 내용          | `state.js` → `STATE.inventory`      | 동적 상태 — 게임 중 변함   |
| 인벤토리 그리는 함수   | `ui.js` → `renderInventory()`       | 동작 로직                  |

### 4.2 맵

| 무엇                                   | 어디                                   |
| -------------------------------------- | -------------------------------------- |
| 맵 목록과 연결 (출구)                  | `data.js` → `DATA.MAPS`                |
| 배경 이미지 경로                       | `data.js` → `DATA.MAPS[id].bgImage`    |
| 맵 영역 크기 (960×540)                 | `tokens.css` → `--canvas-width/height` |
| 출구 버튼 위치 (left/right/top/bottom) | `style.css` → `.exit-btn-*` 클래스     |
| 현재 어느 맵인지                       | `state.js` → `STATE.currentMap`        |
| 맵 전환 함수                           | `map.js` → `renderMap(mapId)`          |

### 4.3 소지금

| 무엇              | 어디                                |
| ----------------- | ----------------------------------- |
| 시작 소지금 (100) | `data.js` → `CONFIG.STARTING_MONEY` |
| 현재 소지금       | `state.js` → `STATE.money`          |
| 화면 표시 함수    | `ui.js` → `renderMoney()`           |
| 표시 위치/색깔    | `style.css` → `#money-display`      |

### 4.4 색상 / 폰트 / 간격

모두 `tokens.css` 의 `:root` 변수. `style.css` 에서 `var(--xxx)` 로 사용.

색깔 하나 바꾸려면 → `tokens.css` 한 곳만 수정.

---

## 5. 데이터 흐름 (Data Flow)

```
  ┌─────────┐
  │  DATA   │  (정적 - 안 변함)
  └────┬────┘
       │
       ▼
  ┌─────────┐                    ┌──────────┐
  │  STATE  │ ◄── 사용자 입력 ── │  Events  │
  │ (동적)  │      / 시간 흐름   │ 핸들러   │
  └────┬────┘                    └──────────┘
       │
       ▼
  ┌─────────┐
  │   UI    │  → 화면
  │ 함수    │
  └─────────┘
```

- **DATA**: 게임 규칙. 정해지면 안 바뀜. 읽기 전용.
- **STATE**: 지금 상황. 계속 바뀜. 읽기/쓰기.
- **UI 함수**: DATA + STATE 를 보고 화면을 다시 그림.
- **이벤트 핸들러**: 클릭 등이 일어나면 → STATE 변경 → UI 함수 호출.

이 패턴은 React, Vue 같은 프레임워크도 똑같이 씀. 우리는 수동으로 함.

---

## 6. 명명 규칙 (Naming Conventions)

| 종류                     | 스타일                     | 예시                                         |
| ------------------------ | -------------------------- | -------------------------------------------- |
| 변수, 함수               | `camelCase`                | `playerMoney`, `renderInventory()`           |
| 상수 (절대 안 변하는 값) | `UPPER_SNAKE_CASE`         | `STARTING_MONEY`, `INVENTORY_SIZE`           |
| 클래스                   | `PascalCase`               | `Player`, `Crop`                             |
| 불리언                   | `is/has/can/should` + 명사 | `isHarvestable`, `hasSeeds`, `canPlant`      |
| 이벤트 핸들러            | `on` + 사건                | `onTitleStart`, `onMapExitClick`             |
| 동작                     | 동사 먼저                  | `plantSeed`, `addToInventory`, `switchScene` |
| 게터/세터                | `get`/`set` + 명사         | `getCurrentMap`, `setMoney`                  |
| 배열                     | 복수형                     | `seeds`, `crops`, `inventorySlots`           |
| ID 키                    | snake_case                 | `"potato_seed"`, `"home"`                    |

`var` 절대 사용 금지. `const` 기본, 재할당 필요한 경우만 `let`.

---

## 7. 자주 하는 작업 (How Do I...)

### 새 맵 추가하기

1. `data.js` → `DATA.MAPS` 에 새 객체 추가 (`displayName`, `bgImage`, `exits`)
2. `assets/bg/` 에 배경 이미지 파일 넣기
3. 다른 맵의 `exits` 에 이 맵으로 가는 연결 추가
4. **이 문서의 파일 구조 / 단계 표 업데이트**

코드는 안 건드려도 됨. (Data-Driven Design 의 장점)

### 새 아이템 추가하기 [Step 1+]

1. `data.js` → `DATA.ITEMS` 에 새 객체 추가
2. `assets/items/` 에 아이콘 파일 넣기

### 시작 소지금 바꾸기

`data.js` → `DATA.CONFIG.STARTING_MONEY` 한 줄 수정

### 게임 색상 / 폰트 / 간격 바꾸기

`css/tokens.css` 의 해당 변수만 수정

### 인벤토리 칸 수 바꾸기

- 총 개수만 변경: `data.js` → `INVENTORY_SIZE`
- 행/열 비율도 변경: 위 + `style.css` 의 `#inventory-bar` grid 설정

### 새 씬 추가하기 (예: 튜토리얼)

1. `index.html` 에 `<div id="scene-튜토리얼" class="scene">` 추가
2. `style.css` 에 `#scene-튜토리얼` 스타일 추가
3. `ui.js` 의 `switchScene()` 으로 전환 가능

---

## 8. 디자인 결정 기록 (Design Decisions)

> "왜 이렇게 했지?" 를 기록하는 곳. 6개월 뒤의 우리가 헷갈리지 않게.
> 새 결정을 내릴 때마다 한 줄 추가.

| 결정                             | 이유                                                           | 날짜             |
| -------------------------------- | -------------------------------------------------------------- | ---------------- |
| Step 0 는 Canvas 안 씀           | 걷기 캐릭터 없으니까 DOM 으로 충분. Step 3 에서 도입.          | Step 0 계획 시   |
| 객체 사용 (parallel array 안 씀) | 인덱스 동기화 안 해도 됨, 확장 쉬움, 매니아 코드 안 만듦       | Step 0 계획 시   |
| `STATE` 한 객체로 묶기           | 전역 변수 흩어진 것보다 디버깅 쉬움, 저장/불러오기 미래에 쉬움 | Step 0 계획 시   |
| `tokens.css` 분리                | 디자인 변경 시 한 파일만 건드림, 일관성 유지                   | Step 0-1         |
| Noto Sans KR 사용                | 한국어 글리프 완벽 지원, 무료, 추후 변경 가능                  | Step 0-1         |
| 0-9 단계 incremental 빌드        | 학습 + 점진적 확장, 한 번에 다 만들면 디버깅 지옥              | 프로젝트 시작 시 |

---

## 9. 문서 관리 규칙

이 문서를 살아있게 유지하는 방법:

1. **새 파일 추가** → 파일 구조 섹션 업데이트
2. **새 데이터 필드 추가** → "Where Things Live" 표에 추가
3. **결정 내림** → "Design Decisions" 에 한 줄 추가
4. **새 기능 추가** → "How do I..." 에 단계 추가
5. **함수 시그니처 변경** → JSDoc 주석 업데이트

> 문서는 코드의 일부. 같이 PR 에 포함시키기.
