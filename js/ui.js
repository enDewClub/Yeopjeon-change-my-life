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

    // 상점안에서 TODO 둘이 통일하기
    $("store-money-amount").textContent = STATE.money;
}

// ═══════════════════════════════════════════════
// 인벤토리 표시
// ═══════════════════════════════════════════════

/**
 * 인벤토리 전체를 다시 그린다.
 * STATE.inventory.slotsArray 의 각 슬롯마다 div 하나씩 생성.
 * 선택된 슬롯에는 .selected 클래스 추가.
 */
function renderInventory() {
    const bar = $("inventory-bar");
    bar.innerHTML = ""; // 기존 슬롯 모두 지우기

    STATE.inventory.slotsArray.forEach((slot, index) => {
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
    if (field.state === "growing") {
        const timer = document.createElement("div");
        timer.id = "field-timer";
        const remaining = field.getRemainingTime();
        timer.textContent = remaining !== null ? `${remaining}초` : "";
        container.appendChild(timer);
    }
    // 2. 물주기 버튼 (상단 우측) — Phase 2 에서 핸들러 연결
    if (field.canWater()) {
        const waterBtn = document.createElement("button");
        waterBtn.id = "btn-water";
        waterBtn.textContent = "물주기";
        container.appendChild(waterBtn);
    }

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
            // imageSrc = DATA.ITEMS[field.seedId].icon; // 씨앗 주머니
            imageSrc = DATA.ITEMS[field.seedId].growthStages.bud; // 새싹
        } else if (field.state === "growing") {
            imageSrc = DATA.ITEMS[field.seedId].growthStages.growing; // 성장과정
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
    if (field.canHarvest()) {
        const harvestBtn = document.createElement("button");
        harvestBtn.id = "btn-harvest";
        harvestBtn.textContent = "수확하기";
        container.appendChild(harvestBtn);
    }
}
// ═══════════════════════════════════════════════
// 맵 위 업그레이더블 렌더 (집 등 — renderLocation.mapId 가 있는 것들)
//
// 현재 맵 (STATE.currentMap) 에 배치되는 모든 업그레이더블을 그린다.
// 각 업그레이더블은 컨테이너 div + 자식 레이어 img 구조 (캐릭터와 동일 패턴).
// 미래에 굴뚝 연기/간판 같은 추가 레이어는 컨테이너에 자식으로 더 붙이면 됨.
// ═══════════════════════════════════════════════
function renderUpgradablesForMap() {
    const container = $("map-interactables");

    for (const id in STATE.upgrades) {
        const upgradable = STATE.upgrades[id];
        const loc = upgradable.definition.renderLocation;

        // 현재 맵에 배치되는 것만 (mapId 매칭).
        // 옷처럼 캐릭터에 입는 건 setupCharacterForMap 이 처리하므로 여기선 스킵.
        if (loc?.mapId !== STATE.currentMap) continue;

        // 컨테이너 div — 위치/크기는 여기서 결정
        const wrapper = document.createElement("div");
        wrapper.className = "map-upgradable";
        wrapper.dataset.upgradableId = id; // 디버깅 / 미래 조회용
        wrapper.style.left = `${loc.x}px`;
        wrapper.style.top = `${loc.y}px`;
        wrapper.style.width = `${loc.width}px`;
        wrapper.style.height = `${loc.height}px`;

        // 메인 레이어 img (현재 레벨의 이미지)
        const mainLayer = document.createElement("img");
        mainLayer.className = "upgradable-layer";
        mainLayer.src = upgradable.getCurrentLevelData().image;
        wrapper.appendChild(mainLayer);

        // 미래: 추가 레이어 (굴뚝 연기, 간판 등) 여기에 더 appendChild

        container.appendChild(wrapper);
    }
}

// ═══════════════════════════════════════════════
// 캐릭터 위치 반영 — 매 프레임 호출됨 (game.js 의 rAF 루프)
// 가볍게 유지: transform 만 갱신. src/크기/표시여부는 map.js 가 맵 진입 시 한 번만.
// ═══════════════════════════════════════════════
function renderCharacter() {
    if (!STATE.character) return;
    const charEl = $("character");
    charEl.style.transform = `translate(${STATE.character.x}px, ${STATE.character.y}px)`;
}

// ═══════════════════════════════════════════════
// 근접 상호작용 체크 — 매 프레임 호출 (game.js 의 rAF 루프)
//
// 거리 계산: 캐릭터 중심점 ↔ 버튼 중심점, Euclidean (√(dx² + dy²)).
// 버튼이 반경 밖이면 .out-of-range 클래스 추가 → CSS 가 흐리게 + 클릭 차단.
// 반경 값은 data.js 의 DATA.CONFIG.PROXIMITY 에서만 관리.
// ═══════════════════════════════════════════════
function refreshProximityStates() {
    if (!STATE.character) return;

    const map = DATA.MAPS[STATE.currentMap];

    // 캐릭터 없는 맵 → 잔여 .out-of-range 클래스 모두 제거 (방어 코드)
    if (!map?.characterStart) {
        document
            .querySelectorAll(".out-of-range")
            .forEach((el) => el.classList.remove("out-of-range"));
        return;
    }

    const cx = STATE.character.getCenterX();
    const cy = STATE.character.getCenterY();

    // 버튼 위치는 뷰포트 기준이라 #map-area 기준으로 환산
    const mapRect = $("map-area").getBoundingClientRect();

    const check = (el, radius) => {
        const r = el.getBoundingClientRect();
        const ex = r.left - mapRect.left + r.width / 2;
        const ey = r.top - mapRect.top + r.height / 2;
        const distance = Math.hypot(ex - cx, ey - cy);
        el.classList.toggle("out-of-range", distance > radius);
    };

    const { EXIT_RADIUS, SPECIAL_RADIUS, FIELD_RADIUS } = DATA.CONFIG.PROXIMITY;

    document
        .querySelectorAll(".exit-btn")
        .forEach((el) => check(el, EXIT_RADIUS));
    document
        .querySelectorAll(".special-action-btn")
        .forEach((el) => check(el, SPECIAL_RADIUS));
    document
        .querySelectorAll(".field-cell")
        .forEach((el) => check(el, FIELD_RADIUS));

    const water = $("btn-water");
    if (water) check(water, FIELD_RADIUS);
    const harvest = $("btn-harvest");
    if (harvest) check(harvest, FIELD_RADIUS);

    document
        .querySelectorAll(".wild-plant")
        .forEach((el) => check(el, FIELD_RADIUS));
}
