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
            switchScene("store");
            enterStore();
            break;
        // 미래에 추가될 수 있는 것들:
        // case "openInventoryMenu": ...
        // case "talkToNpc": ...
        default:
            console.warn(`알 수 없는 actionType: ${actionType}`);
    }
}
