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
    bar.innerHTML = "";

    // 두 줄로 나누기: 0~9 = 첫 번째 줄, 10~19 = 두 번째 줄
    const slotsPerRow = 10;
    const rowCount = STATE.inventory.slotsArray.length / slotsPerRow;

    for (let row = 0; row < rowCount; row++) {
        // 프레임 컨테이너 (프레임 이미지 + 행 슬롯들)
        const rowFrame = document.createElement("div");
        rowFrame.className = "inventory-row-frame";

        const frameImg = document.createElement("img");
        frameImg.className = "inventory-row-frame-img";
        frameImg.src = "img_assets/ui/inventory_frame.png"; // 프레임 PNG 경로
        frameImg.alt = "";
        rowFrame.appendChild(frameImg);

        // 슬롯 10개가 담길 그리드
        const rowEl = document.createElement("div");
        rowEl.className = "inventory-row";

        for (let i = 0; i < slotsPerRow; i++) {
            const index = row * slotsPerRow + i;
            const slot = STATE.inventory.slotsArray[index];
            rowEl.appendChild(createSlotElement(slot, index));
        }

        rowFrame.appendChild(rowEl);
        bar.appendChild(rowFrame);
    }
    // 선택 상태가 바뀌었을 수 있으니 손에 든 아이템도 갱신
    renderHeldItem();
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
// 밭2 렌더링 (타일맵 + 물주기 버튼)
// 밭2 맵에서만 그림. 타일마다 상태에 따라 바닥/작물 이미지 달라짐.
// 크기/위치/이미지는 전부 DATA.CONFIG.FIELD2 에서 읽음.
// ═══════════════════════════════════════════════
function renderTileField() {
    // 밭2 맵이 아니면 아무것도 안 그림
    if (STATE.currentMap !== "field2") return;

    const container = $("map-interactables");
    container.innerHTML = ""; // 잔여물 제거 (재호출 시 중복 방지)

    const tileField = STATE.tileField;
    const cfg = DATA.CONFIG.FIELD2;

    // 1. 물주기 버튼 — 원래 밭과 같은 id 재사용
    //    → CSS / 근접체크 / 디스패처가 그대로 동작 (onWaterClick 이 맵 보고 분기)
    if (tileField.canWaterAny()) {
        const waterBtn = document.createElement("button");
        waterBtn.id = "btn-water";
        waterBtn.textContent = "물주기";
        container.appendChild(waterBtn);
    }

    // 2. 타일 그리드 — 위치/크기는 data 값으로 인라인 설정
    const gridWidth = cfg.GRID_WIDTH * cfg.TILE_SIZE;
    const gridHeight = cfg.GRID_HEIGHT * cfg.TILE_SIZE;
    // GRID_X / GRID_Y 가 null 이면 맵 가운데 자동 정렬
    const gridX = cfg.GRID_X ?? (DATA.CONFIG.MAP_WIDTH - gridWidth) / 2;
    const gridY = cfg.GRID_Y ?? (DATA.CONFIG.MAP_HEIGHT - gridHeight) / 2;

    const grid = document.createElement("div");
    grid.id = "tile-grid";
    grid.style.left = `${gridX}px`;
    grid.style.top = `${gridY}px`;
    grid.style.gridTemplateColumns = `repeat(${cfg.GRID_WIDTH}, ${cfg.TILE_SIZE}px)`;
    grid.style.gridTemplateRows = `repeat(${cfg.GRID_HEIGHT}, ${cfg.TILE_SIZE}px)`;

    tileField.forEachTile((x, y) => {
        grid.appendChild(createTileElement(x, y));
    });

    container.appendChild(grid);
}

/**
 * 타일 한 칸을 만들어서 반환한다.
 * 바닥(풀/흙) 은 background-image, 작물은 위에 겹치는 img.
 * @param {number} x - 타일 열
 * @param {number} y - 타일 행
 * @returns {HTMLElement}
 */
function createTileElement(x, y) {
    const tileField = STATE.tileField;
    const state = tileField.getTileState(x, y);
    const { TILE_IMAGES } = DATA.CONFIG.FIELD2;

    const tileEl = document.createElement("div");
    tileEl.className = `field-tile tile-${state}`; // 예: "field-tile tile-grass"
    tileEl.dataset.x = x; // 클릭 핸들러에서 활용
    tileEl.dataset.y = y;

    // 1. 바닥 이미지 — 풀 / 흙 / (자라는 중 + 젖은흙 이미지 있으면) 젖은 흙
    let groundImage = TILE_IMAGES.dirt;
    if (state === "grass") {
        groundImage = TILE_IMAGES.grass;
    } else if (state === "growing" && TILE_IMAGES.dirtWatered) {
        groundImage = TILE_IMAGES.dirtWatered;
    }
    tileEl.style.backgroundImage = `url("${groundImage}")`;

    // 2. 작물 이미지 — 원래 밭과 같은 growthStages 재사용
    const stageByState = { planted: "bud", growing: "growing", ready: "ready" };
    const seedId = tileField.getSeedId(x, y);
    if (seedId && stageByState[state]) {
        const cropImg = document.createElement("img");
        cropImg.className = "field-tile-crop";
        cropImg.src = DATA.ITEMS[seedId].growthStages[stageByState[state]];
        cropImg.alt = "";
        tileEl.appendChild(cropImg);
    }

    // 3. 지금 캐릭터가 파고 있는 타일이면 표시 (CSS 애니메이션)
    const character = STATE.character;
    if (
        character?.action === "digging" &&
        character.actionTarget.x === x &&
        character.actionTarget.y === y
    ) {
        tileEl.classList.add("being-dug");
    }

    return tileEl;
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
// 캐릭터 행동 표시 (땅파기 모션 on/off)
// 행동 시작/끝날 때만 호출 (매 프레임 X).
//   - #character 에 .digging 클래스 → CSS 흔들림 애니메이션
//   - DIGGING_IMAGE 가 있으면 베이스 이미지도 교체
// ═══════════════════════════════════════════════
function renderCharacterAction() {
    if (!STATE.character) return;

    const isDigging = STATE.character.action === "digging";
    $("character").classList.toggle("digging", isDigging);

    const { IMAGE, DIGGING_IMAGE } = DATA.CONFIG.CHARACTER;
    $("character-base").src =
        isDigging && DIGGING_IMAGE ? DIGGING_IMAGE : IMAGE;
}

// ═══════════════════════════════════════════════
// 손에 든 아이템 표시
// 선택된 아이템에 heldImage 가 있으면 (도구 등) 캐릭터 손 위치에 표시, 없으면 숨김.
// 위치/크기/기울기는 DATA.CONFIG.CHARACTER.HELD_ITEM 에서만 관리.
// 선택이 바뀔 때마다 호출 (renderInventory 끝에서 자동 호출).
// ═══════════════════════════════════════════════
function renderHeldItem() {
    const heldEl = $("character-held-item");
    const item = STATE.inventory?.getSelectedItem();

    // 선택 없음 / 들 수 없는 아이템 (씨앗 등) → 숨김
    if (!item?.heldImage) {
        heldEl.style.display = "none";
        return;
    }

    const { X, Y, WIDTH, HEIGHT, ROTATE } = DATA.CONFIG.CHARACTER.HELD_ITEM;

    heldEl.src = item.heldImage;
    heldEl.style.left = `${X}px`;
    heldEl.style.top = `${Y}px`;
    heldEl.style.width = `${WIDTH}px`;
    heldEl.style.height = `${HEIGHT}px`;
    heldEl.style.rotate = `${ROTATE}deg`; // transform 대신 rotate 속성 → 땅파기 애니메이션(transform)과 안 겹침
    heldEl.style.display = "block";
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
        document
            .querySelectorAll(".interact-target")
            .forEach((el) => el.classList.remove("interact-target"));
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

    const { EXIT_RADIUS, SPECIAL_RADIUS, FIELD_RADIUS, TILE_RADIUS } =
        DATA.CONFIG.PROXIMITY;
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

    // 밭2 타일 — 반경 밖 타일은 클릭 차단 (CSS 가 hover 강조도 끔)
    document
        .querySelectorAll(".field-tile")
        .forEach((el) => check(el, TILE_RADIUS));

    // E 키 대상 갱신 (반경 체크가 끝난 뒤여야 .out-of-range 가 최신)
    updateInteractTarget(cx, cy, mapRect);
}

// ═══════════════════════════════════════════════
// E 키 상호작용 대상 찾기 — 매 프레임 (refreshProximityStates 끝에서 호출)
//
// 반경 안(.out-of-range 아닌) 상호작용 요소 중 캐릭터 중심에 가장 가까운 것 하나에
// .interact-target 클래스 → CSS 가 강조 표시.
// E 키는 이 클래스 붙은 요소를 그냥 click() → 기존 클릭 핸들러가 그대로 처리.
// 새 상호작용 요소 추가하면 아래 목록에 셀렉터만 추가.
// ═══════════════════════════════════════════════
const INTERACTABLE_SELECTOR = [
    ".exit-btn",
    ".special-action-btn:not(.locked)", // 잠긴 버튼 (입궁 자격 부족) 은 제외
    ".field-cell",
    ".field-tile",
    ".wild-plant",
    "#btn-water",
    "#btn-harvest",
].join(", ");

function updateInteractTarget(cx, cy, mapRect) {
    let nearestEl = null;
    let nearestDistance = Infinity;

    document.querySelectorAll(INTERACTABLE_SELECTOR).forEach((el) => {
        if (el.classList.contains("out-of-range")) return; // 멀면 후보 아님

        const r = el.getBoundingClientRect();
        const ex = r.left - mapRect.left + r.width / 2;
        const ey = r.top - mapRect.top + r.height / 2;
        const distance = Math.hypot(ex - cx, ey - cy);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEl = el;
        }
    });

    // 이전 대상 강조 해제 → 새 대상 강조
    document.querySelectorAll(".interact-target").forEach((el) => {
        if (el !== nearestEl) el.classList.remove("interact-target");
    });
    nearestEl?.classList.add("interact-target");
}

// ═══════════════════════════════════════════════
// 아이템 비 연출 (대박 수확)
// #effects-layer 에 아이템 이미지 RAIN_COUNT 개를 랜덤 x 위치에서 떨어뜨림.
// 각 이미지는 CSS 애니메이션 끝나면 스스로 삭제 (animationend).
// 숫자는 DATA.CONFIG.JACKPOT 에서만 관리.
// ═══════════════════════════════════════════════
function playItemRain(itemId) {
    const layer = $("effects-layer");
    const {
        RAIN_COUNT,
        ITEM_SIZE,
        FALL_MIN_SECONDS,
        FALL_MAX_SECONDS,
        SPREAD_SECONDS,
    } = DATA.CONFIG.JACKPOT;
    const { MAP_WIDTH, MAP_HEIGHT } = DATA.CONFIG;

    const randomBetween = (min, max) => min + Math.random() * (max - min);

    for (let i = 0; i < RAIN_COUNT; i++) {
        const img = document.createElement("img");
        img.className = "rain-item";
        img.src = DATA.ITEMS[itemId].icon;
        img.alt = "";

        // 크기 + 시작 위치 (화면 위 밖에서 시작)
        img.style.width = `${ITEM_SIZE}px`;
        img.style.height = `${ITEM_SIZE}px`;
        img.style.left = `${randomBetween(0, MAP_WIDTH - ITEM_SIZE)}px`;
        img.style.top = `${-ITEM_SIZE}px`;

        // 개별 랜덤값 → 속도/시작시간/회전이 제각각이라 자연스러움
        img.style.animationDuration = `${randomBetween(FALL_MIN_SECONDS, FALL_MAX_SECONDS)}s`;
        img.style.animationDelay = `${randomBetween(0, SPREAD_SECONDS)}s`;
        img.style.setProperty(
            "--fall-distance",
            `${MAP_HEIGHT + ITEM_SIZE * 2}px`,
        );
        img.style.setProperty("--spin", `${randomBetween(-360, 360)}deg`);

        // 다 떨어지면 DOM 에서 제거 (쌓이지 않게)
        img.addEventListener("animationend", () => img.remove());

        layer.appendChild(img);
    }
}
