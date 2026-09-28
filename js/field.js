// ═══════════════════════════════════════════════════════
// field.js - 밭 클래스 (Field Class)
//
// Inventory 와 같은 패턴: 밭의 상태(state, seedId, growEndTime)와
// 행동(plant/water/checkGrowth/harvest)을 한 객체에 캡슐화.
//
// 상태 머신:
//   empty → plant() → planted → water() → growing → checkGrowth() → ready → harvest() → empty
//
// Field 는 자기 상태만 관리. 인벤토리 차감/추가는 호출자(game.js)의 책임.
// (Inventory 가 외부를 안 건드리는 패턴과 일관)
//
// 사용 예:
//   STATE.field = new Field();
//   STATE.field.plant("potato_seed");
//   STATE.field.water();
//   STATE.field.checkGrowth();          // 렌더 루프에서 매 프레임 호출
//   const result = STATE.field.harvest(); // { cropId, count }
// ═══════════════════════════════════════════════════════

class Field {
    // ─────────────────────────────────────────
    // 생성자
    // ─────────────────────────────────────────
    constructor(config = DATA.CONFIG.FIELD) {
        this.config = config; // 설정값 (GROW_TIME_SECONDS, HARVEST_MIN, HARVEST_MAX)
        this.state = "empty"; // "empty" | "planted" | "growing" | "ready"
        this.seedId = null; // 심긴 씨앗 ID (empty 일 땐 null)
        this.growEndTime = null; // 자람 완료 timestamp (growing 일 때만)
    }

    // ─────────────────────────────────────────
    // 상태 전환 메서드 (Phase 1~3 에서 구현)
    // ─────────────────────────────────────────

    /**
     * 씨앗을 심는다. empty → planted
     * 인벤토리 차감은 호출자가 처리 (Inventory 와 같은 패턴).
     * @param {string} seedId
     * @returns {boolean} 성공 여부 (이미 심긴 상태 등이면 false)
     */
    plant(seedId) {
        if (this.state !== "empty") return false;

        this.state = "planted";
        this.seedId = seedId;
        return true;
    }

    /**
     * 물을 준다. planted → growing. 타이머 시작 (growEndTime 설정).
     * @returns {boolean} 성공 여부
     */
    water() {
        if (this.state !== "planted") return false;

        this.state = "growing";
        this.growEndTime =
            Date.now() + DATA.CONFIG.FIELD.GROW_TIME_SECONDS * 1000;
        return true;
    }

    /**
     * 시간 다 됐는지 체크 후 자동 전환. growing → ready.
     * 렌더 루프/틱에서 매번 호출됨.
     * @returns {boolean} 방금 ready 로 바뀌었으면 true (알림용)
     */
    checkGrowth() {
        if (this.state !== "growing") return false;
        if (Date.now() < this.growEndTime) return false;

        // 시간 다 됨 → ready 로 전환
        this.state = "ready";
        this.growEndTime = null;
        return true;
    }

    /**
     * 수확. ready → empty. 작물 종류와 랜덤 갯수 반환.
     * 인벤토리 추가는 호출자가 처리.
     * @returns {{cropId: string, count: number} | null}
     */
    harvest() {
        if (this.state !== "ready") return null;

        // 작물 ID 와 랜덤 수확량 결정
        const cropId = DATA.ITEMS[this.seedId].growsInto;
        const { HARVEST_MIN, HARVEST_MAX } = this.config; //DATA.CONFIG.FIELD;
        const count =
            Math.floor(Math.random() * (HARVEST_MAX - HARVEST_MIN + 1)) +
            HARVEST_MIN;

        // 최대 수확량이면 대박 (연출은 호출자가 처리 — Field 는 판정만)
        const isJackpot = count === HARVEST_MAX;

        // 밭 리셋
        this.state = "empty";
        this.seedId = null;
        this.growEndTime = null;

        return { cropId, count, isJackpot };
    }

    // ─────────────────────────────────────────
    // 조회 메서드
    // ─────────────────────────────────────────

    /**
     * UI 타이머용. 남은 초 (올림). growing 이 아니면 null.
     * @returns {number | null}
     */
    getRemainingTime() {
        if (this.state !== "growing") return null;
        const remainingMs = this.growEndTime - Date.now();
        return Math.max(0, Math.ceil(remainingMs / 1000));
    }

    // ─────────────────────────────────────────
    // 상태 조회 헬퍼 (UI 가 버튼 표시 여부 결정할 때 사용)
    // 단순히 state 비교지만 의미가 명확해짐.
    // ─────────────────────────────────────────

    /** @returns {boolean} 새 씨앗을 심을 수 있는 상태? */
    canPlant() {
        return this.state === "empty";
    }

    /** @returns {boolean} 물을 줄 수 있는 상태? */
    canWater() {
        return this.state === "planted";
    }

    /** @returns {boolean} 수확할 수 있는 상태? */
    canHarvest() {
        return this.state === "ready";
    }
}
