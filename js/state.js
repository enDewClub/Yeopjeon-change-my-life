// ═══════════════════════════════════════════════════════
// state.js - 게임 동적 상태 (Runtime State)
//
// 게임 중에 바뀌는 값들이 여기 들어간다. data.js 와 정반대:
//   data.js  → 게임 규칙 (정해지면 안 변함, 읽기 전용)
//   state.js → 현재 상황 (계속 변함, 읽기/쓰기)
//
// 어떤 정보든 "변할 수 있나?" 로 판단:
//   변함 → state.js
//   안 변함 → data.js
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// STATE - 게임 현재 상태 (한 객체로 모든 동적 데이터 관리)
// 디버깅: 콘솔에 `STATE` 만 쳐도 전체 상태 한눈에 보임.
// ═══════════════════════════════════════════════
const STATE = {
    currentScene: "title", // 현재 씬: "title" | "game" | "ending"
    currentMap: null, // 현재 맵 ID (게임 중일 때만, 아니면 null)
    money: 0, // 현재 소지금 (푼)
    inventory: [], // 인벤토리 슬롯 배열
    // 각 슬롯: null (빈 칸) 또는 { itemId, count }
};

// ═══════════════════════════════════════════════
// 함수
// ═══════════════════════════════════════════════

/**
 * STATE 를 게임 시작 시점의 값으로 리셋한다.
 * 시작/재시작 두 경우에 모두 호출됨.
 * currentScene 은 안 건드림 - 씬 결정은 호출하는 쪽 책임.
 */
function resetGameState() {
    STATE.currentMap = DATA.CONFIG.STARTING_MAP;
    STATE.money = DATA.CONFIG.STARTING_MONEY;
    STATE.inventory = createEmptyInventory();
}

/**
 * 빈 인벤토리 배열을 만들어서 반환한다.
 * 길이는 DATA.CONFIG.INVENTORY_SIZE (=20).
 * 모든 슬롯은 null (빈 칸). 아이템 들어오면 { itemId, count } 로 바뀜.
 */
function createEmptyInventory() {
    // new Array(N).fill(null) → 길이 N 짜리, 전부 null 인 배열
    return new Array(DATA.CONFIG.INVENTORY_SIZE).fill(null);
}
