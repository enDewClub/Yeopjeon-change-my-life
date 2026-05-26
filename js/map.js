// ═══════════════════════════════════════════════════════
// map.js - 맵 렌더링 + 출구 버튼 생성
//
// renderMap(mapId) 가 메인 함수.
// 맵 ID 받으면 → 배경 이미지 + 출구 버튼들 + 특수 버튼 다 그려줌.
//
// 새 맵 추가하려면 data.js 의 DATA.MAPS 에만 추가하면 됨.
// 이 파일은 안 건드려도 자동으로 작동함 (Data-Driven Design).
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 메인: 맵 렌더링
// ═══════════════════════════════════════════════

/**
 * 맵을 화면에 그린다. (배경 + 출구 버튼 + 특수 버튼)
 * @param {string} mapId - "home" | "village" | "palace" | "field"
 */
function renderMap(mapId) {
    const map = DATA.MAPS[mapId];
    STATE.currentMap = mapId;

    // 1. 배경 이미지
    setMapBackground(map);

    // 2. 출구 + 특수 버튼
    renderMapButtons(map);

    // 3. 상호작용 요소 비우고 → 각 종류별 추가
    //    순서 주의: renderField 가 내부에서 또 비우므로 upgradables 보다 먼저 호출.
    $("map-interactables").innerHTML = "";
    renderField(); // 밭 셀 (밭 맵일 때만 내용 추가, 아니면 no-op)
    renderMountain(); // 산 식물 (산맵일 때만)
    renderUpgradablesForMap(); // 집 등 (현재 맵에 배치된 것들)

    // 4. 캐릭터 (위치 리셋 + 베이스/옷 src 세팅)
    setupCharacterForMap(map);
}
// ═══════════════════════════════════════════════
// 배경 이미지
// ═══════════════════════════════════════════════

/**
 * 맵의 배경 이미지를 #map-bg 에 설정한다.
 */
function setMapBackground(map) {
    const bg = $("map-bg");
    bg.src = map.bgImage;
    bg.alt = map.displayName;
}
// ═══════════════════════════════════════════════
// 캐릭터를 현재 맵에 맞게 세팅
// - characterStart 가 있는 맵: 시작 위치로 옮기고 표시
// - 없는 맵: 숨김
//
// 매번 시작 위치로 리셋되는 동작이 여기서 일어남.
// (나중에 "들어온 방향에 따라 위치 다르게" 로 바꾸려면 이 함수만 손보면 됨)
// ═══════════════════════════════════════════════
function setupCharacterForMap(map) {
    const charEl = $("character");

    // 캐릭터 다니지 않는 맵 → 숨기고 끝
    if (!map.characterStart) {
        charEl.style.display = "none";
        return;
    }

    const { WIDTH, HEIGHT, IMAGE } = DATA.CONFIG.CHARACTER;

    // 크기는 컨테이너에 (자식 레이어들은 CSS inset:0 으로 따라옴)
    charEl.style.width = `${WIDTH}px`;
    charEl.style.height = `${HEIGHT}px`;
    charEl.style.display = "block";

    // 각 레이어 src 설정
    //   베이스: 변하지 않는 캐릭터 본체
    //   옷: 현재 옷 레벨에 맞는 투명 PNG 오버레이
    $("character-base").src = IMAGE;
    $("character-clothes").src =
        STATE.upgrades.clothes.getCurrentLevelData().image;
    // $("character-hat").src =
    //     STATE.upgrades.hats.getCurrentLevelData().image;

    // 시작 위치로 이동 + 초기 한 번 렌더
    STATE.character.setPosition(map.characterStart.x, map.characterStart.y);
    renderCharacter();
}

// ═══════════════════════════════════════════════
// 출구 + 특수 버튼 생성
// ═══════════════════════════════════════════════

/**
 * 맵의 모든 버튼(출구 + 특수)을 다시 그린다.
 * 기존 버튼은 다 지우고 새로 만듦.
 */
function renderMapButtons(map) {
    const container = $("map-exits");
    container.innerHTML = ""; // 기존 버튼 모두 지우기

    // 출구 버튼들 - map.exits 의 각 방향마다 버튼 하나씩
    for (const direction in map.exits) {
        const targetMapId = map.exits[direction];
        container.appendChild(createExitButton(direction, targetMapId));
    }

    // 특수 버튼 (입궁하기 같은 거) - 있는 맵에만
    if (map.specialAction) {
        container.appendChild(createSpecialActionButton(map.specialAction));
    }
}

/**
 * 출구 버튼 하나 생성. 클릭 시 해당 맵으로 이동.
 * @param {string} direction - "left" | "right" | "top" | "bottom"
 * @param {string} targetMapId - 이동할 맵 ID
 */
function createExitButton(direction, targetMapId) {
    const targetMap = DATA.MAPS[targetMapId];

    const btn = document.createElement("button");
    btn.className = `exit-btn exit-btn-${direction}`;
    btn.textContent = targetMap.displayName;

    // 클릭 → 그 맵으로 이동
    btn.addEventListener("click", () => renderMap(targetMapId));

    return btn;
}

/**
 * 특수 액션 버튼 생성. (예: 궁궐의 "입궁하기")
 * @param {object} specialAction - { label, actionType }
 */
function createSpecialActionButton(specialAction) {
    const btn = document.createElement("button");
    btn.className = "special-action-btn";

    // 조건 충족 여부에 따라 라벨 / 잠금 클래스 결정
    const unlocked = isSpecialActionUnlocked(specialAction);
    btn.textContent = unlocked
        ? specialAction.label
        : (specialAction.lockedLabel ?? specialAction.label);

    if (!unlocked) btn.classList.add("locked");

    btn.addEventListener("click", () => {
        // 잠금 상태면 클릭 무시 (방어 코드 — CSS 가 시각적으로도 막지만 JS 도 막음)
        if (!isSpecialActionUnlocked(specialAction)) return;
        handleSpecialAction(specialAction.actionType);
    });

    return btn;
}
// ═══════════════════════════════════════════════
// 특수 액션의 조건이 모두 충족됐는지 검사 (AND).
// requires 배열이 없거나 비어있으면 항상 통과.
// 새 조건 종류 추가하려면 여기에 분기 추가 (지금은 upgradable 레벨만 지원).
// ═══════════════════════════════════════════════
function isSpecialActionUnlocked(specialAction) {
    if (!specialAction.requires) return true;

    return specialAction.requires.every((req) => {
        const upgradable = STATE.upgrades[req.upgradableId];
        return upgradable && upgradable.currentLevel >= req.minLevel;
    });
}

/**
 * 특수 액션 처리. actionType 별로 분기.
 * 새 액션 추가하려면 case 추가하면 됨.
 */
function handleSpecialAction(actionType) {
    switch (actionType) {
        case "goEnding":
            switchScene("ending");
            break;
        case "goStore":
            onEnterStoreClick();
            break;
        // 미래에 추가될 수 있는 것들:
        // case "openInventoryMenu": ...
        // case "talkToNpc": ...
        default:
            console.warn(`알 수 없는 actionType: ${actionType}`);
    }
}
