// ═══════════════════════════════════════════════════════
// tile_field.js - 타일 밭 클래스 (TileField Class)
//
// 밭2 전용. 작은 타일들이 격자(타일맵)로 깔린 밭.
// 기존 Field 를 그대로 재사용: 각 타일이 "파지면" Field 인스턴스를 하나 가짐.
//   - 안 파진 타일 → { dug: false, crop: null }           = 풀
//   - 파진 타일    → { dug: true,  crop: Field 인스턴스 }  = 흙 이후 단계는 Field 가 관리
//
// 타일 상태 흐름:
//   grass → dig() → dirt (= Field 의 "empty")
//         → plant() → planted → water() → growing → ready
//         → harvest() → dirt (다시 풀로 안 돌아감 → 바로 재심기 가능)
//
// 좌표: (x, y) = (열, 행). (0, 0) 이 좌상단. 저장은 tiles[y][x].
//
// Field / Inventory 와 같은 원칙: 자기 상태만 관리.
// 인벤토리 차감/추가, 사운드, 렌더는 호출자(game.js) 책임.
//
// 사용 예:
//   STATE.tileField = new TileField();
//   STATE.tileField.dig(3, 2);
//   STATE.tileField.plant(3, 2, "potato_seed");
//   STATE.tileField.waterAll();              // 심어진 타일 전부 물주기
//   STATE.tileField.checkGrowth();           // 틱마다 → 방금 다 자란 타일 목록
//   STATE.tileField.harvest(3, 2);           // { cropId, count }
// ═══════════════════════════════════════════════════════

class TileField {
    // ─────────────────────────────────────────
    // 생성자
    // ─────────────────────────────────────────

    /**
     * @param {object} config - DATA.CONFIG.FIELD2 (크기, 성장시간, 수확량 등)
     */
    constructor(config = DATA.CONFIG.FIELD2) {
        this.config = config;
        this.width = config.GRID_WIDTH; // 가로 타일 수
        this.height = config.GRID_HEIGHT; // 세로 타일 수

        // 2차원 배열 tiles[y][x]. 처음엔 전부 풀.
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push({ dug: false, crop: null });
            }
            this.tiles.push(row);
        }
    }

    // ─────────────────────────────────────────
    // 조회 (읽기만, 상태 안 바뀜)
    // ─────────────────────────────────────────

    /**
     * 타일 객체 반환. 범위 밖이면 null.
     * @returns {{dug: boolean, crop: Field|null} | null}
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.tiles[y][x];
    }

    /**
     * 타일의 현재 상태 이름.
     * @returns {"grass"|"dirt"|"planted"|"growing"|"ready"|null} 범위 밖이면 null
     */
    getTileState(x, y) {
        const tile = this.getTile(x, y);
        if (!tile) return null;
        if (!tile.dug) return "grass";

        // Field 의 "empty" 가 밭2 에서는 "dirt" (파놓은 흙)
        return tile.crop.state === "empty" ? "dirt" : tile.crop.state;
    }

    /**
     * 타일에 심긴 씨앗 ID. 없으면 null. (렌더 시 성장 이미지 찾을 때 사용)
     * @returns {string|null}
     */
    getSeedId(x, y) {
        return this.getTile(x, y)?.crop?.seedId ?? null;
    }

    /** @returns {boolean} 삽으로 팔 수 있는 타일? */
    canDig(x, y) {
        return this.getTileState(x, y) === "grass";
    }

    /** @returns {boolean} 씨앗 심을 수 있는 타일? */
    canPlant(x, y) {
        return this.getTileState(x, y) === "dirt";
    }

    /** @returns {boolean} 수확할 수 있는 타일? */
    canHarvest(x, y) {
        return this.getTileState(x, y) === "ready";
    }

    /** @returns {boolean} 물줄 타일이 하나라도 있나? (물주기 버튼 표시용) */
    canWaterAny() {
        return this.tiles.some((row) =>
            row.some((tile) => tile.crop?.canWater()),
        );
    }

    /**
     * 모든 타일을 순회한다. (좌상단 → 우하단 순서)
     * @param {(x: number, y: number, tile: object) => void} callback
     */
    forEachTile(callback) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                callback(x, y, this.tiles[y][x]);
            }
        }
    }

    // ─────────────────────────────────────────
    // 변경 (상태 바꿈)
    // ─────────────────────────────────────────

    /**
     * 땅을 판다. grass → dirt.
     * 파는 순간 그 타일 전용 Field 인스턴스 생성 (이후 단계는 Field 가 관리).
     * @returns {boolean} 성공 여부
     */
    dig(x, y) {
        if (!this.canDig(x, y)) return false;

        const tile = this.getTile(x, y);
        tile.dug = true;
        tile.crop = new Field(this.config); // FIELD2 설정값(성장시간/수확량) 사용
        return true;
    }

    /**
     * 씨앗을 심는다. dirt → planted
     * @param {string} seedId
     * @returns {boolean} 성공 여부
     */
    plant(x, y, seedId) {
        if (!this.canPlant(x, y)) return false;
        return this.getTile(x, y).crop.plant(seedId);
    }

    /**
     * 심어진(planted) 타일 전부 물주기. planted → growing
     * (원래 밭처럼 물주기 버튼 하나로 처리)
     * @returns {number} 물 준 타일 수 (0 이면 아무것도 안 함)
     */
    waterAll() {
        let wateredCount = 0;
        this.forEachTile((x, y, tile) => {
            if (tile.crop?.water()) wateredCount++;
        });
        return wateredCount;
    }

    /**
     * 모든 타일 성장 체크. growing → ready 자동 전환.
     * 틱(setInterval)에서 매번 호출됨.
     * @returns {Array<{x: number, y: number}>} 방금 ready 로 바뀐 타일들 (알림용)
     */
    checkGrowth() {
        const justReadyTiles = [];
        this.forEachTile((x, y, tile) => {
            if (tile.crop?.checkGrowth()) justReadyTiles.push({ x, y });
        });
        return justReadyTiles;
    }

    /**
     * 수확. ready → dirt. 작물 종류와 랜덤 갯수 반환.
     * 인벤토리 추가는 호출자가 처리.
     * @returns {{cropId: string, count: number} | null}
     */
    harvest(x, y) {
        if (!this.canHarvest(x, y)) return null;
        return this.getTile(x, y).crop.harvest(); // Field 가 "empty"(=dirt) 로 리셋
    }
}
