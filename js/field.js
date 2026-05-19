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
    constructor() {
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
     * 물을 준다. planted → growing, 타이머 시작
     * @returns {boolean} 성공 여부
     */
    water() {
        // TODO Phase 2
        return false;
    }

    /**
     * 시간 다 됐는지 체크. growing → ready 자동 전환.
     * 렌더 루프에서 매번 호출됨.
     * @returns {boolean} 방금 ready 로 바뀌었으면 true
     */
    checkGrowth() {
        // TODO Phase 2
        return false;
    }

    /**
     * 수확. ready → empty. 작물 종류와 갯수 반환.
     * 인벤토리 추가는 호출자가 처리.
     * @returns {{cropId: string, count: number} | null}
     */
    harvest() {
        // TODO Phase 3
        return null;
    }

    // ─────────────────────────────────────────
    // 조회 메서드
    // ─────────────────────────────────────────

    /**
     * UI 타이머용. 남은 초 (올림). growing 이 아니면 null.
     * @returns {number | null}
     */
    getRemainingTime() {
        // TODO Phase 2
        return null;
    }
}
