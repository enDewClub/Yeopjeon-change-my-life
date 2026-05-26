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
// 사운드 (Audio)
// - SFX: 짧은 효과음. currentTime=0 으로 빠른 연속 재생 가능.
// - BGM: 배경음악. 루프 + 볼륨 낮춤. 시작은 반드시 유저 클릭 핸들러 안에서.
// ═══════════════════════════════════════════════
const SFX = {
    dock: new Audio("audio_assets/dock.mp3"),
    coin: new Audio("audio_assets/coin.wav"),
    welcome: new Audio("audio_assets/amazingwelcome.mp3"),
};
// 미리 로드해두기 — 첫 클릭 때 지연 방지
for (const a of Object.values(SFX)) {
    a.preload = "auto";
    a.volume = 0.8;
    a.load();
}
function playSfx(name) {
    const a = SFX[name];
    a.currentTime = 0;
    a.play();
}

const BGM = new Audio("audio_assets/bgm.mp3");
BGM.loop = true;
BGM.volume = 0.4;
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
    BGM.play();

    // SFX 워밍업 — 짧게 재생하고 바로 멈춤. 다음 클릭부터 즉시 발화.
    for (const a of Object.values(SFX)) {
        a.play()
            .then(() => {
                a.pause();
                a.currentTime = 0;
            })
            .catch(() => {});
    }

    resetGameState();
    switchScene("game");
    renderMap(STATE.currentMap); // STATE.currentMap 는 resetGameState 에서 "home" 으로 설정됨
    renderInventory();
    renderMoney();
    console.log(STATE.inventory.slotsArray[1].type);
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
        if (STATE.inventory.slotsArray[index] === null) return;

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
        playSfx("dock"); // ← 추가. 실제 성공했을 때만 울림.

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
        playSfx("dock"); // ← 추가. 실제 수확 성공했을 때만 울림.

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
        // 산 식물 클릭 → 채집
        const plantEl = event.target.closest(".wild-plant");
        if (plantEl) {
            const x = Number(plantEl.dataset.x);
            const y = Number(plantEl.dataset.y);
            onPlantClick(x, y);
            return;
        }

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

    /**
     * 산 식물 클릭 → 채집 시도.
     * pickPlant 의 tagged 반환값으로 분기:
     *   ok        → 인벤토리/맵 다시 그리고 성공 메시지
     *   inventoryFull → 메시지만 표시 (그리드 변화 없음)
     *   emptyCell / outOfBounds → 조용히 무시 (레이스 컨디션 / 잘못된 클릭)
     */
    function onPlantClick(x, y) {
        const result = STATE.mountain.pickPlant(x, y);

        if (result.ok) {
            playSfx("dock"); // ← 추가. 채집 성공했을 때만 울림.
            const name = DATA.ITEMS[result.plantId].displayName;
            renderMountain();
            renderInventory();
            $("message-area").textContent = `${name}을(를) 채집했습니다`;
            return;
        }

        if (result.reason === "inventoryFull") {
            $("message-area").textContent = "가방이 가득 찼습니다!";
            return;
        }

        // emptyCell, outOfBounds → 조용히 무시
    }

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
    // 키보드 입력 — 눌린 키 집합 관리
    // keydown/keyup 으로 Set 에 추가/제거 → 매 프레임 게임 루프가 읽음.
    // WASD + 화살표 둘 다 지원.
    // ═══════════════════════════════════════════════
    const pressedKeys = new Set();
    window.addEventListener("keydown", (e) => {
        pressedKeys.add(e.key.toLowerCase());
    });
    window.addEventListener("keyup", (e) => {
        pressedKeys.delete(e.key.toLowerCase());
    });

    /**
     * 눌린 키에서 이동 벡터 뽑아서 캐릭터 이동.
     * 대각선은 정규화해서 속도 일정 유지 (안 하면 √2 배 빨라짐).
     */
    function updateCharacterFromInput(delta) {
        let dx = 0;
        let dy = 0;
        if (pressedKeys.has("arrowleft") || pressedKeys.has("a")) dx -= 1;
        if (pressedKeys.has("arrowright") || pressedKeys.has("d")) dx += 1;
        if (pressedKeys.has("arrowup") || pressedKeys.has("w")) dy -= 1;
        if (pressedKeys.has("arrowdown") || pressedKeys.has("s")) dy += 1;

        if (dx === 0 && dy === 0) return;

        // 대각선 정규화
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;

        const distance = DATA.CONFIG.CHARACTER.SPEED * delta;
        STATE.character.move(dx * distance, dy * distance);
    }

    // ═══════════════════════════════════════════════
    // 게임 루프 (requestAnimationFrame, ~60fps)
    // - delta 시간 기반 → 프레임 드랍 있어도 속도 일정
    // - 게임 씬 + 캐릭터 다니는 맵에서만 작동 (다른 씬에선 무시)
    // ═══════════════════════════════════════════════
    let lastFrameTime = performance.now();
    function gameLoop(now) {
        const delta = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (STATE.currentScene === "game" && STATE.character) {
            updateCharacterFromInput(delta);
            renderCharacter();
            refreshProximityStates(); // 매 프레임 버튼 활성/비활성 갱신
        }
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);

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
