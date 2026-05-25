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
    inventory: null, // Inventory 인스턴스 (resetGameState 에서 생성)
    // 각 슬롯: null (빈 칸) 또는 { itemId, count }
    field: null,
    character: null, // Character 인스턴스 (resetGameState 에서 생성)
    upgrades: {}, // { house: Upgradable, clothes: Upgradable } - resetGameState 에서 채움
    storePopup: null, // 열려있으면 { mode: "buy"|"sell", itemId, count }, 닫혀있으면 null
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

    // 새 캐릭터 인스턴스 생성 (위치는 renderMap 이 맵별 시작점으로 세팅)
    STATE.character = new Character();

    // 새 인벤토리 생성 (이전 인벤토리는 가비지 컬렉터가 알아서 정리)
    STATE.inventory = new Inventory(DATA.CONFIG.INVENTORY_SIZE);

    // 시작 아이템 채우기
    DATA.CONFIG.STARTING_INVENTORY.forEach(({ itemId, count }) => {
        STATE.inventory.addItem(itemId, count);
    });

    //  새 밭 인스턴스 생성
    STATE.field = new Field();

    // 업그레이더블 재산 초기화 (집, 옷 등) — DATA 정의된 모든 재산을 자동으로 등록.
    // TODO 미래: 저장/로드 도입 시 저장된 레벨로 복원.
    STATE.upgrades = {};
    for (const [id, def] of Object.entries(DATA.UPGRADABLE_PROPERTIES)) {
        STATE.upgrades[id] = new Upgradable(def);
    }

    STATE.storePopup = null; // 팝업 닫힌 상태로 시작
}
