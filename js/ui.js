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
 * STATE.inventory.slots 의 각 슬롯마다 div 하나씩 생성.
 * 선택된 슬롯에는 .selected 클래스 추가.
 */
function renderInventory() {
    const bar = $("inventory-bar");
    bar.innerHTML = ""; // 기존 슬롯 모두 지우기

    STATE.inventory.slots.forEach((slot, index) => {
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
    // 현재 선택된 슬롯이면 .selected 클래스 추가 (CSS 에서 시각적 강조)
    if (index === STATE.inventory.selectedSlotIndex) {
        slotEl.classList.add("selected");
    }
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
// ═══════════════════════════════════════════════
// 선택된 아이템 메시지 표시
// ═══════════════════════════════════════════════

/**
 * 현재 선택된 아이템 이름을 메시지 영역에 표시한다.
 * 선택된 게 없거나 빈 슬롯이면 메시지 영역을 비운다.
 */
function renderSelectedItemMessage() {
    const item = STATE.inventory.getSelectedItem();
    const messageEl = $("message-area");

    if (item === null) {
        messageEl.textContent = "";
    } else {
        messageEl.textContent = `현재 선택한 아이템: ${item.displayName}`;
    }
}
// ═══════════════════════════════════════════════
// 밭 렌더링 (3x3 그리드 + 타이머 + 버튼들)
// 밭 맵에서만 그림. STATE.field.state 에 따라 내용 달라짐.
// ═══════════════════════════════════════════════

function renderField() {
    const container = $("map-interactables");

    // 밭 맵이 아니면 아무것도 안 그림
    if (STATE.currentMap !== "field") return;

    container.innerHTML = ""; // 잔여물 제거 (재호출 시 중복 방지)
    const field = STATE.field;

    // 1. 타이머 (상단 중앙) — growing 일 때만 텍스트 표시 (:empty CSS 로 자동 숨김)
    const timer = document.createElement("div");
    timer.id = "field-timer";
    const remaining = field.getRemainingTime();
    timer.textContent = remaining !== null ? `${remaining}초` : "";
    container.appendChild(timer);

    // 2. 물주기 버튼 (상단 우측) — Phase 2 에서 핸들러 연결
    const waterBtn = document.createElement("button");
    waterBtn.id = "btn-water";
    waterBtn.textContent = "물주기";
    container.appendChild(waterBtn);

    // 3. 3x3 밭 그리드 (중앙) — 상태에 따라 셀 내용 달라짐
    const grid = document.createElement("div");
    grid.id = "field-grid";

    for (let i = 0; i < DATA.CONFIG.FIELD.GRID_SIZE; i++) {
        const cell = document.createElement("div");
        cell.className = "field-cell";
        cell.dataset.cellIndex = i;

        // 상태별로 셀에 표시할 이미지 결정
        let imageSrc = null;
        if (field.state === "planted") {
            imageSrc = DATA.ITEMS[field.seedId].icon; // 씨앗 주머니
        } else if (field.state === "growing") {
            imageSrc = DATA.ITEMS[field.seedId].growthStages.growing; // 새싹
        } else if (field.state === "ready") {
            imageSrc = DATA.ITEMS[field.seedId].growthStages.ready; // 다 자란 모습
        }
        // empty 일 땐 imageSrc 가 null → 빈 셀

        if (imageSrc) {
            const img = document.createElement("img");
            img.src = imageSrc;
            img.className = "field-cell-icon";
            cell.appendChild(img);
        }

        // TODO Phase 2: growing 상태 → 새싹 이미지 (growthStages.growing)
        // TODO Phase 3: ready 상태 → 다 자란 이미지 (growthStages.ready)

        grid.appendChild(cell);
    }
    container.appendChild(grid);

    // 4. 수확하기 버튼 (우하단) — Phase 3 에서 핸들러 연결
    const harvestBtn = document.createElement("button");
    harvestBtn.id = "btn-harvest";
    harvestBtn.textContent = "수확하기";
    container.appendChild(harvestBtn);
}
