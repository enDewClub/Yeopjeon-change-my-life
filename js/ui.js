// ═══════════════════════════════════════════════════════
// ui.js - 공통 UI 함수 모음
//
// 화면을 그리는 함수들. STATE 를 읽어서 DOM 에 반영한다.
// 패턴: STATE 가 바뀌면 → UI 함수 호출 → 화면 업데이트.
//
// UI 함수는 "지금 STATE 가 이러니까 화면을 이렇게 그려라" 만 함.
// STATE 를 직접 바꾸지 않음 (그건 game.js / map.js 같은 로직 파일의 일).
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 도우미: DOM 요소 가져오기 단축
//   document.getElementById("xxx") → $("xxx")
// ═══════════════════════════════════════════════
const $ = (id) => document.getElementById(id);

// ═══════════════════════════════════════════════
// 씬 전환
// ═══════════════════════════════════════════════

/**
 * 화면(씬)을 전환한다.
 * 모든 .scene 에서 .active 제거 → 타겟 씬에 .active 추가.
 * @param {string} sceneName - "title" | "game" | "ending"
 */
function switchScene(sceneName) {
    // 모든 씬 비활성화
    document.querySelectorAll(".scene").forEach((scene) => {
        scene.classList.remove("active");
    });

    // 타겟 씬만 활성화
    $(`scene-${sceneName}`).classList.add("active");

    // STATE 동기화
    STATE.currentScene = sceneName;
}

// ═══════════════════════════════════════════════
// 소지금 표시
// ═══════════════════════════════════════════════

/**
 * 현재 소지금을 화면에 표시한다. (STATE.money → #money-amount)
 */
function renderMoney() {
    $("money-amount").textContent = STATE.money;
}

// ═══════════════════════════════════════════════
// 인벤토리 표시
// ═══════════════════════════════════════════════

/**
 * 인벤토리 전체를 다시 그린다.
 * STATE.inventory 배열의 각 슬롯마다 div 하나씩 생성해서 #inventory-bar 에 붙임.
 */
function renderInventory() {
    const bar = $("inventory-bar");
    bar.innerHTML = ""; // 기존 슬롯 모두 지우기

    STATE.inventory.forEach((slot, index) => {
        bar.appendChild(createSlotElement(slot, index));
    });
}

/**
 * 인벤토리 슬롯 한 칸을 만들어서 반환한다.
 * slot 이 null 이면 빈 칸, 아니면 아이콘 + 갯수 표시.
 * @param {object|null} slot - { itemId, count } 또는 null
 * @param {number} index - 슬롯 위치 (0 ~ INVENTORY_SIZE-1)
 * @returns {HTMLElement}
 */
function createSlotElement(slot, index) {
    const slotEl = document.createElement("div");
    slotEl.className = "inventory-slot";
    slotEl.dataset.slotIndex = index; // 나중에 클릭 핸들러에서 활용

    // 빈 칸이면 그대로 반환
    if (slot === null) return slotEl;

    // 아이템이 있으면 아이콘 + 갯수 추가 (Step 1 부터 실제 사용)
    const item = DATA.ITEMS[slot.itemId];

    const icon = document.createElement("img");
    icon.className = "inventory-slot-icon";
    icon.src = item.icon;
    icon.alt = item.displayName;
    slotEl.appendChild(icon);

    const count = document.createElement("span");
    count.className = "inventory-slot-count";
    count.textContent = slot.count;
    slotEl.appendChild(count);

    return slotEl;
}
