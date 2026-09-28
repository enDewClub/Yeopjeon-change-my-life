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
    //console.log(STATE.inventory.slotsArray[1].type);
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
     * 밭2 에서는 심어진 타일 전부 한 번에 물주기 (같은 버튼 id 공유).
     */
    function onWaterClick() {
        // 밭2 (타일밭)
        if (STATE.currentMap === "field2") {
            const wateredCount = STATE.tileField.waterAll();
            if (wateredCount === 0) return;

            renderTileField();
            $("message-area").textContent =
                `${wateredCount}칸에 물을 주었습니다`;
            return;
        }

        // 원래 밭
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
    // 밭2 (타일밭) 클릭 핸들러들 (디스패처에서 호출)
    // ═══════════════════════════════════════════════

    /**
     * 타일 클릭 → 타일 상태 + 선택된 아이템으로 행동 결정.
     *   ready             → 수확 (뭘 들고 있든)
     *   grass + 파기 도구  → 땅파기 시작 (DIG_SECONDS 후 흙으로)
     *   grass + 도구 없음  → 안내 메시지
     *   dirt  + 씨앗       → 심기
     *   그 외              → 무시
     */
    function onTileClick(x, y) {
        if (STATE.character.isBusy()) return; // 땅 파는 중엔 다른 행동 X

        const state = STATE.tileField.getTileState(x, y);
        const selectedItem = STATE.inventory.getSelectedItem();

        if (state === "ready") {
            onTileHarvest(x, y);
            return;
        }
        if (state === "grass") {
            // 아이템 ID 대신 toolAction 으로 판단 → 나중에 다른 파기 도구 추가해도 동작
            if (selectedItem?.toolAction === "dig") {
                onTileDigStart(x, y);
            } else {
                $("message-area").textContent =
                    "삽을 들어야 땅을 팔 수 있습니다";
            }
            return;
        }
        if (state === "dirt" && selectedItem?.type === "seed") {
            onTilePlant(x, y, selectedItem);
            return;
        }
    }

    /**
     * 땅파기 시작 → 캐릭터 행동 상태로 전환. 실제로 흙이 되는 건 onDigFinished.
     */
    function onTileDigStart(x, y) {
        const started = STATE.character.startDigging(
            x,
            y,
            DATA.CONFIG.FIELD2.DIG_SECONDS,
        );
        if (!started) return;

        renderCharacterAction(); // 파는 모션 on
        renderTileField(); // 파는 중인 타일 표시
        $("message-area").textContent = "땅을 파는 중...";
    }

    /**
     * 땅파기 시간 끝 → 타일을 흙으로. (게임 루프의 updateCharacterAction 에서 호출)
     */
    function onDigFinished(x, y) {
        const success = STATE.tileField.dig(x, y);

        renderCharacterAction(); // 모션 off
        if (STATE.currentMap === "field2") renderTileField();

        if (!success) return;
        playSfx("dock");
        $("message-area").textContent = "땅을 팠습니다. 씨앗을 심을 수 있어요.";
    }

    /**
     * 흙 타일에 선택된 씨앗 심기.
     * 원래 밭과 다르게 선택 유지 → 여러 칸 연속으로 심기 편함. 씨앗 다 쓰면 해제.
     */
    function onTilePlant(x, y, seedItem) {
        const success = STATE.tileField.plant(x, y, seedItem.id);
        if (!success) return;
        playSfx("dock");

        STATE.inventory.removeItem(seedItem.id, 1);
        const remaining = STATE.inventory.getItemCount(seedItem.id);
        if (remaining === 0) STATE.inventory.deselectSlot();

        renderInventory();
        renderTileField();
        $("message-area").textContent =
            `심기 완료: ${seedItem.displayName} (남은 씨앗 ${remaining}개)`;
    }

    /**
     * 다 자란 타일 수확 → 인벤토리에 추가. 타일은 흙으로 돌아감 (바로 재심기 가능).
     */
    function onTileHarvest(x, y) {
        const result = STATE.tileField.harvest(x, y);
        if (!result) return;
        playSfx("dock");

        const { cropId, count } = result;
        STATE.inventory.addItem(cropId, count);

        renderInventory();
        renderTileField();

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

        // 밭2 타일 클릭 → 파기 / 심기 / 수확
        const tileEl = event.target.closest(".field-tile");
        if (tileEl) {
            onTileClick(Number(tileEl.dataset.x), Number(tileEl.dataset.y));
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
        const key = e.key.toLowerCase();
        pressedKeys.add(key);

        // 꾹 누르고 있을 때 반복 입력 무시 (한 번 누르면 한 번만)
        if (e.repeat) return;

        // 물주기 단축키 → 물주기 버튼 클릭과 같은 동작
        if (key === DATA.CONFIG.KEYS.WATER) onWaterKey();
    });

    /**
     * 물주기 단축키.
     * 버튼 클릭과 규칙을 똑같이 맞춤:
     *   - 버튼이 없으면 (물줄 게 없음 / 밭 맵 아님) → 무시
     *   - 버튼이 .out-of-range 면 (캐릭터가 멀면) → 무시
     *   - 땅 파는 중이면 → 무시
     */
    function onWaterKey() {
        if (STATE.currentScene !== "game") return;
        if (STATE.character?.isBusy()) return;

        const waterBtn = $("btn-water");
        if (!waterBtn) return;

        onWaterClick();
    }
    window.addEventListener("keyup", (e) => {
        pressedKeys.delete(e.key.toLowerCase());
    });

    /**
     * 눌린 키에서 이동 벡터 뽑아서 캐릭터 이동.
     * 대각선은 정규화해서 속도 일정 유지 (안 하면 √2 배 빨라짐).
     */
    function updateCharacterFromInput(delta) {
        if (STATE.character.isBusy()) return; // 땅 파는 중엔 이동 불가

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

    /**
     * 캐릭터 행동(땅파기 등) 시간이 끝났는지 매 프레임 체크.
     * 끝났으면 행동 종류별 완료 처리.
     */
    function updateCharacterAction() {
        const finished = STATE.character.finishActionIfDone();
        if (!finished) return;

        if (finished.action === "digging") {
            onDigFinished(finished.target.x, finished.target.y);
        }
        // 미래: case "watering", "chopping" ...
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
            updateCharacterAction(); // 행동 끝났나 체크 (이동보다 먼저)
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

    // ═══════════════════════════════════════════════
    // 밭2 성장 틱 (0.5초마다)
    // - 모든 타일 checkGrowth → 방금 다 자란 타일 있으면 리렌더 + 알림
    // - 타일별 타이머 숫자는 없음 (타일이 작아서). 젖은 흙 + 성장 이미지가 피드백.
    // ═══════════════════════════════════════════════
    setInterval(() => {
        const tileField = STATE.tileField;
        if (!tileField) return;

        const justReadyTiles = tileField.checkGrowth();
        if (justReadyTiles.length === 0) return;

        if (STATE.currentMap === "field2") renderTileField();
        $("message-area").textContent =
            `밭2 작물 ${justReadyTiles.length}칸이 다 자랐습니다!`;
    }, 500);
});
