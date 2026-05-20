// ═══════════════════════════════════════════════════════
// game.js - 메인 게임 흐름 + 이벤트 연결
//
// 역할:
//   1. 페이지 로드 시 초기화
//   2. 씬 간 전환 핸들러 (시작하기, 다시하기)
//   3. 모든 이벤트 리스너 연결
//
// "이 게임 어디서 시작해?" → 맨 아래 DOMContentLoaded 리스너 부터.
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 씬 흐름 함수
// ═══════════════════════════════════════════════

/**
 * 타이틀 화면으로 이동한다.
 * 페이지 처음 로드 + 다시하기 두 경우 모두 사용.
 * STATE 는 건드리지 않음 - 시작하기 누를 때 리셋됨.
 */
function startNewGame() {
    switchScene("title");
    STATE.inventory = new Inventory(10);
}

/**
 * 타이틀의 "시작하기" 버튼 클릭 시 호출.
 * STATE 리셋 → 게임 씬으로 전환 → 맵/인벤토리/소지금 그리기.
 */
function onTitleStart() {
    resetGameState();
    switchScene("game");
    renderMap(STATE.currentMap); // STATE.currentMap 는 resetGameState 에서 "home" 으로 설정됨
    renderInventory();
    renderMoney();
}

// ═══════════════════════════════════════════════
// 이벤트 연결 (페이지 로드 시 실행)
// ═══════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    // 타이틀의 "시작하기" 버튼
    $("btn-game-start").addEventListener("click", onTitleStart);

    // ═══════════════════════════════════════════════
    // 인벤토리 클릭 핸들러 (이벤트 위임 패턴)
    // ═══════════════════════════════════════════════
    // #inventory-bar 에 한 번만 리스너 붙임 → 안의 어떤 슬롯을 클릭해도 동작.
    // 슬롯마다 따로 리스너를 붙이지 않아서 효율적이고, renderInventory
    // 가 슬롯을 다시 만들어도 리스너 재등록 필요 없음.
    $("inventory-bar").addEventListener("click", (event) => {
        // 클릭된 요소에서 가장 가까운 .inventory-slot 찾기
        const slotEl = event.target.closest(".inventory-slot");
        if (!slotEl) return; // 슬롯이 아닌 곳 클릭한 거면 무시

        const index = Number(slotEl.dataset.slotIndex);

        // 빈 슬롯 클릭은 무시 (선택할 게 없음)
        if (STATE.inventory.slots[index] === null) return;

        STATE.inventory.selectSlot(index);

        // 화면 다시 그리기 (선택 표시 + 메시지 갱신)
        renderInventory();
        renderSelectedItemMessage();
    });

    // ═══════════════════════════════════════════════
    // 밭 관련 클릭 핸들러들 (디스패처에서 호출)
    // ═══════════════════════════════════════════════

    /**
     * 밭 셀 클릭 → 선택된 씨앗을 심는다.
     */
    function onFieldCellClick() {
        const selectedItem = STATE.inventory.getSelectedItem();
        if (!selectedItem || selectedItem.type !== "seed") return;

        const success = STATE.field.plant(selectedItem.id);
        if (!success) return;

        STATE.inventory.removeItem(selectedItem.id, 1);
        STATE.inventory.deselectSlot();

        renderInventory();
        renderField();
        $("message-area").textContent =
            `심기 완료: ${selectedItem.displayName}`;
    }

    /**
     * 물주기 버튼 클릭 → 성장 시작.
     */
    function onWaterClick() {
        const success = STATE.field.water();
        if (!success) return; // planted 상태가 아니면 무시

        renderField();
        $("message-area").textContent = ""; // 이전 메시지 지움, 타이머가 시각적 피드백
    }

    /**
     * 수확하기 버튼 클릭 → 작물을 인벤토리에 추가 + 밭 리셋.
     * 인벤토리에 선택된 아이템이 있어도 그대로 둠 (씨앗이면 바로 다시 심기 가능).
     */
    function onHarvestClick() {
        const result = STATE.field.harvest();
        if (!result) return; // ready 상태가 아니면 무시

        const { cropId, count } = result;

        // 인벤토리에 작물 추가
        STATE.inventory.addItem(cropId, count);

        // 화면 갱신
        renderInventory();
        renderField();

        // 메시지 — 사용자가 선택해둔 씨앗 메시지를 덮어씀 (의도된 동작)
        const cropName = DATA.ITEMS[cropId].displayName;
        $("message-area").textContent = `수확 완료: ${cropName} ${count}개`;
    }

    // ═══════════════════════════════════════════════
    // 밭 영역 클릭 디스패처 (이벤트 위임)
    // #map-interactables 안의 어떤 요소를 눌렀는지 확인 후 적절한 핸들러로 분기
    // ═══════════════════════════════════════════════
    $("map-interactables").addEventListener("click", (event) => {
        // 밭 셀 클릭 → 심기 시도
        if (event.target.closest(".field-cell")) {
            onFieldCellClick();
            return;
        }
        // 물주기 버튼 클릭
        if (event.target.id === "btn-water") {
            onWaterClick();
            return;
        }
        // 수확하기 버튼 클릭
        if (event.target.id === "btn-harvest") {
            onHarvestClick();
            return;
        }
    });

    // 상점의 "나가기" 버튼
    $("btn-leave-store").addEventListener("click", onExitStoreClick);

    // 엔딩의 "다시하기" 버튼
    $("btn-restart").addEventListener("click", startNewGame);

    // 게임 시작!
    startNewGame();
    renderMoney();
    renderInventory();
    renderSelectedItemMessage();

    // ═══════════════════════════════════════════════
    // 밭 성장 틱 (0.5초마다)
    // - growing 상태면 시간 체크 후 ready 로 자동 전환
    // - 타이머 숫자만 가볍게 업데이트 (전체 리렌더 X)
    // ═══════════════════════════════════════════════
    setInterval(() => {
        const field = STATE.field;
        if (!field || field.state !== "growing") return;

        const justReady = field.checkGrowth();

        if (justReady) {
            // 성장 완료 → 전체 리렌더 + 알림 메시지
            renderField();
            const cropId = DATA.ITEMS[field.seedId].growsInto;
            const cropName = DATA.ITEMS[cropId].displayName;
            $("message-area").textContent = `${cropName}이(가) 다 자랐습니다!`;
        } else {
            // 아직 자라는 중 → 타이머 숫자만 업데이트 (밭 맵일 때만 존재)
            const timer = $("field-timer");
            if (timer) timer.textContent = `${field.getRemainingTime()}초`;
        }
    }, 500);
});
