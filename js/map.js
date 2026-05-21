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

    // STATE 업데이트 - 현재 어느 맵인지 기록
    STATE.currentMap = mapId;

    // 1. 배경 이미지 설정
    setMapBackground(map);

    // 2. 출구 + 특수 버튼 생성
    renderMapButtons(map);

    // 3. 상호작용 요소 초기화 (Step 1+ 에서 밭/채집식물 등 채울 곳)
    // (renderField 가 내부에서 clear + 재렌더 처리. 밭 맵이 아니면 자동으로 비움)
    $("map-interactables").innerHTML = "";
    renderField();

    //맵 진입 시 캐릭터 세팅 (위치 리셋이 일어나는 곳)
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

    // 캐릭터 다니는 맵 → src/크기 세팅 후 표시
    const { WIDTH, HEIGHT, IMAGE } = DATA.CONFIG.CHARACTER;
    charEl.src = IMAGE;
    charEl.style.width = `${WIDTH}px`;
    charEl.style.height = `${HEIGHT}px`;
    charEl.style.display = "block";

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
    btn.textContent = specialAction.label;

    btn.addEventListener("click", () =>
        handleSpecialAction(specialAction.actionType),
    );

    return btn;
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
