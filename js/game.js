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
    // 밭 클릭 핸들러 (이벤트 위임 패턴 - 인벤토리와 동일)
    // ═══════════════════════════════════════════════
    // #map-interactables 에 한 번만 리스너 → 안의 .field-cell 클릭 시 동작.
    // renderField 가 셀을 재생성해도 리스너 재등록 필요 없음.
    $("map-interactables").addEventListener("click", (event) => {
        // 밭 셀 클릭인지 확인
        const cell = event.target.closest(".field-cell");
        if (!cell) return; // 셀이 아닌 곳 클릭은 무시

        // 인벤토리에서 선택된 아이템 확인
        const selectedItem = STATE.inventory.getSelectedItem();

        // 씨앗 선택 안 됐으면 무시 (Phase 4 에서 안내 메시지 가능)
        if (!selectedItem || selectedItem.type !== "seed") return;

        // 밭에 심기 시도 (empty 가 아니면 false 반환)
        const success = STATE.field.plant(selectedItem.id);
        if (!success) return;

        // 성공 → 인벤토리에서 씨앗 1개 차감 + 선택 해제
        STATE.inventory.removeItem(selectedItem.id, 1);
        STATE.inventory.deselectSlot();

        // 화면 다시 그리기
        renderInventory();
        renderField();

        // 메시지 영역에 심기 완료 알림
        $("message-area").textContent =
            `심기 완료: ${selectedItem.displayName}`;
    });

    // 상점의 "나가기" 버튼
    // $("btn-leave-store").addEventListener("click", onLeaveStore);

    // 엔딩의 "다시하기" 버튼
    $("btn-restart").addEventListener("click", startNewGame);

    // 게임 시작!
    startNewGame();
    renderMoney();
    renderInventory();
    renderSelectedItemMessage();
});
