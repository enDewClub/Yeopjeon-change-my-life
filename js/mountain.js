// ═══════════════════════════════════════════════════════
// mountain.js - 산 클래스 (Mountain Class) + 렌더링
//
// Inventory / Field 와 같은 패턴. 산맵의 상태(2D 그리드 + 리스폰 타이머)와
// 행동(채집, 리스폰)을 한 객체에 캡슐화.
//
// 핵심 데이터 구조:
//   grid: 2D 배열. grid[y][x] 로 접근. 각 셀은 null (빈 칸) 또는 { plantId }
//   respawnTimerIds: 현재 돌고 있는 리스폰 setTimeout ID 들 (cleanup 용)
//
// 불변식 (항상 참):
//   grid 의 non-null 셀 수 + respawnTimerIds.size === PLANTS_ON_MAP
//   = "지금 보이는 식물 + 리스폰 대기중 식물 = 항상 같은 수"
//
// 외부 인터랙션:
//   pickPlant(x, y)  → 채집 시도. 인벤토리 추가까지 여기서 함.
//   dispose()        → resetGameState 시 호출. 모든 타이머 정리.
//
// pickPlant 반환값은 tagged union:
//   { ok: true, plantId }
//   { ok: false, reason: "outOfBounds" | "emptyCell" | "inventoryFull" }
//   — Field.harvest() 의 null 반환과 다른 이유: 실패 사유가 3가지이고
//     각 사유마다 UI 피드백이 다르기 때문 (null 만으로는 구분 불가).
// ═══════════════════════════════════════════════════════

class Mountain {
    // ─────────────────────────────────────────
    // 생성자: 빈 그리드 만들고 초기 식물 6개 배치
    // ─────────────────────────────────────────
    constructor() {
        const { GRID_WIDTH, GRID_HEIGHT, PLANTS_ON_MAP } = DATA.CONFIG.MOUNTAIN;

        // 2D 배열 초기화 (모두 null). grid[y][x] 순서 주의.
        this.grid = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            this.grid.push(new Array(GRID_WIDTH).fill(null));
        }

        // 리스폰 타이머 ID 추적 (dispose 에서 일괄 clearTimeout 용)
        this.respawnTimerIds = new Set();

        // 초기 식물 PLANTS_ON_MAP 개 배치
        for (let i = 0; i < PLANTS_ON_MAP; i++) {
            this.spawnPlant();
        }
    }

    // ─────────────────────────────────────────
    // 채집 — 외부에서 호출되는 메인 API
    // ─────────────────────────────────────────

    /**
     * 식물을 채집한다. 좌표 검증 → 인벤토리 추가 → 셀 비우기 → 리스폰 예약.
     * 인벤토리 추가가 가장 먼저 = 실패해도 그리드 상태 안 바뀜 (롤백 불필요).
     * @param {number} x
     * @param {number} y
     * @returns {{ok: true, plantId: string} | {ok: false, reason: string}}
     */
    pickPlant(x, y) {
        const { GRID_WIDTH, GRID_HEIGHT } = DATA.CONFIG.MOUNTAIN;

        // 1. 좌표 범위 체크
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
            return { ok: false, reason: "outOfBounds" };
        }

        // 2. 셀이 비어있나? (더블클릭 / 레이스 컨디션 방어)
        const cell = this.grid[y][x];
        if (cell === null) {
            return { ok: false, reason: "emptyCell" };
        }

        // 3. 인벤토리 추가 시도 (실패 가능 → 가장 먼저)
        const plantId = cell.plantId;
        const added = STATE.inventory.addItem(plantId, 1);
        if (!added) {
            // 인벤토리 꽉참. 식물은 땅에 그대로 둠. 타이머도 시작 안 함.
            return { ok: false, reason: "inventoryFull" };
        }

        // 4. 셀 비우기 + 리스폰 타이머 시작
        this.grid[y][x] = null;
        this.startRespawnTimer();

        return { ok: true, plantId };
    }

    // ─────────────────────────────────────────
    // 정리 — resetGameState 에서 호출
    // ─────────────────────────────────────────

    /**
     * 모든 대기중인 리스폰 타이머를 취소한다.
     * 호출 안 하면 좀비 타이머가 새 게임으로 넘어가서 식물을 토해냄.
     * Idempotent: 여러 번 불러도 안전.
     */
    dispose() {
        this.respawnTimerIds.forEach((id) => clearTimeout(id));
        this.respawnTimerIds.clear();
    }

    // ─────────────────────────────────────────
    // 내부 헬퍼 — 외부에서 직접 호출하지 말 것
    // ─────────────────────────────────────────

    /**
     * 빈 칸 하나 골라서 랜덤 식물 배치. 생성자 + 리스폰 타이머가 호출.
     * 빈 칸이 없으면 no-op (불변식 위배 — 콘솔 경고).
     */
    spawnPlant() {
        const cell = this.getRandomEmptyCell();
        if (cell === null) {
            console.warn("Mountain.spawnPlant: 빈 칸 없음 (불변식 위배)");
            return;
        }
        const plantId = this.getRandomPlantId();
        this.grid[cell.y][cell.x] = { plantId };
    }

    /**
     * 리스폰 타이머 하나 예약. RESPAWN_SECONDS 후 식물 1개를 새로 배치.
     * 타이머 ID 를 set 에 기록해서 dispose 에서 정리 가능하게 함.
     */
    startRespawnTimer() {
        const { RESPAWN_SECONDS } = DATA.CONFIG.MOUNTAIN;

        const id = setTimeout(() => {
            // 콜백 시작: 자기 ID 를 set 에서 먼저 제거 (한 번만 발화하므로)
            this.respawnTimerIds.delete(id);

            // 새 식물 배치
            this.spawnPlant();

            // 산맵에 있을 때만 다시 그림. 다른 맵에 있으면 다음 입장 때 보임.
            if (STATE.currentMap === "mountain") {
                renderMountain();
            }
        }, RESPAWN_SECONDS * 1000);

        this.respawnTimerIds.add(id);
    }

    /**
     * 빈 칸 좌표 하나 균등 랜덤 추첨.
     * 그리드 전체 스캔해서 빈 칸 모은 다음 추첨 (collect-and-pick).
     * 18칸이라 O(N) 부담 없음. 진정한 균등 분포 보장.
     * @returns {{x: number, y: number} | null}
     */
    getRandomEmptyCell() {
        // const empties = [];
        // for (let y = 0; y < this.grid.length; y++) {
        //     for (let x = 0; x < this.grid[y].length; x++) {
        //         if (this.grid[y][x] === null) {
        //             empties.push({ x, y });
        //         }
        //     }
        // }
        // if (empties.length === 0) return null;
        // return empties[Math.floor(Math.random() * empties.length)];
    }

    /**
     * 식물 ID 풀에서 랜덤 하나 추첨. 중복 허용 (가중치 없는 균등).
     * @returns {string}
     */
    getRandomPlantId() {
        const typesArray = DATA.CONFIG.MOUNTAIN.PLANT_TYPES_ARRAY;

        // return string: 랜덤으로 골라진 식물 이름 "doraji"
        // FUTURE: 희귀도 가중치 도입 시 [{id, weight}] 로 바꾸고 가중 추첨.
    }
}

// ═══════════════════════════════════════════════════════
// 렌더링 — 산맵의 식물 그리드를 화면에 그린다
// ═══════════════════════════════════════════════════════

/**
 * 산맵 식물을 #map-interactables 에 그린다.
 * 산맵이 아니거나 mountain 인스턴스가 없으면 no-op (top-guard 패턴).
 *
 * 빈 칸은 DOM 요소 없음 — 식물 있는 칸에만 <img.wild-plant> 추가.
 * 각 img 에 data-x / data-y 속성 → game.js 의 클릭 핸들러가 읽음.
 *
 * 그리드 컨테이너는 CSS Grid 로 6x3 배치.
 */
function renderMountain() {
    // 산맵 아니면 안 그림
    if (STATE.currentMap !== "mountain") return;
    if (!STATE.mountain) return;

    const container = $("map-interactables");

    // 기존 산 그리드가 있으면 제거 (중복 누적 방지)
    // 다른 상호작용 요소(밭, 업그레이더블)는 그대로 두기 위해 컨테이너 전체를
    // 비우지 않고, 우리 #mountain-grid 만 제거함.
    const oldGrid = $("mountain-grid");
    if (oldGrid) oldGrid.remove();

    const { GRID_WIDTH, GRID_HEIGHT } = DATA.CONFIG.MOUNTAIN;

    // 그리드 컨테이너 — CSS 에서 grid-template-columns/rows 정의됨
    const grid = document.createElement("div");
    grid.id = "mountain-grid";

    // 모든 셀에 대해 div 하나씩 (빈 칸은 비어있는 div, 식물은 img 포함)
    // 빈 칸도 div 를 두는 이유: CSS Grid 가 자동 배치하므로 좌표 순서 보장됨.
    // (식물 없는 칸은 보이지 않지만 그리드 슬롯은 차지)
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cellSlot = document.createElement("div");
            cellSlot.className = "mountain-cell";

            const cellData = STATE.mountain.grid[y][x];
            if (cellData !== null) {
                const img = document.createElement("img");
                img.className = "wild-plant";
                img.src = DATA.ITEMS[cellData.plantId].inGroundImage;
                img.alt = DATA.ITEMS[cellData.plantId].displayName;
                img.dataset.x = x;
                img.dataset.y = y;
                cellSlot.appendChild(img);
            }

            grid.appendChild(cellSlot);

            console.log("산!saved?" + DATA.ITEMS.ssuk.id);

            console.log(STATE.mountain.grid);
        }
    }

    container.appendChild(grid);
}
