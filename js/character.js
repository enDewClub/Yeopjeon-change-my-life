// ═══════════════════════════════════════════════════════
// character.js - 캐릭터 클래스 (Character Class)
//
// 플레이어 캐릭터의 위치(x, y)와 이동 로직을 캡슐화.
// Inventory/Field 와 같은 패턴: 자기 상태는 자기가 관리.
//
// 좌표계: #map-area 기준 픽셀. (0, 0) 이 좌상단.
// 위치는 캐릭터 이미지의 좌상단 모서리 기준.
//
// 사용 예:
//   STATE.character = new Character();
//   STATE.character.setPosition(440, 230);  // 맵 진입 시 시작 위치
//   STATE.character.move(2, 0);             // 매 프레임 살짝 이동
// ═══════════════════════════════════════════════════════

class Character {
    constructor() {
        this.x = 0;
        this.y = 0;

        // 행동 상태 — 이동이 아닌 "뭔가 하는 중" (땅파기 등)
        // idle 이 아니면 이동 불가 (game.js 의 입력 처리에서 막음)
        this.action = "idle"; // "idle" | "digging"
        this.actionEndTime = null; // 행동 끝나는 timestamp
        this.actionTarget = null; // 행동 대상 (땅파기면 { x, y } 타일 좌표)
    }

    /**
     * 캐릭터를 절대 위치로 옮긴다. (맵 진입 시 시작 위치 세팅용)
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * dx, dy 만큼 이동. 맵 경계 밖으로는 못 나감 (clamp).
     * 이동 거리 계산은 호출자(game.js 의 게임 루프)가 책임짐.
     * @param {number} dx - x 방향 변위 (음수=왼쪽)
     * @param {number} dy - y 방향 변위 (음수=위쪽)
     */
    move(dx, dy) {
        const { WIDTH, HEIGHT } = DATA.CONFIG.CHARACTER;
        const maxX = DATA.CONFIG.MAP_WIDTH - WIDTH;
        const maxY = DATA.CONFIG.MAP_HEIGHT - HEIGHT;

        this.x = Math.max(0, Math.min(maxX, this.x + dx));
        this.y = Math.max(0, Math.min(maxY, this.y + dy));
    }

    // ─────────────────────────────────────────
    // 행동 (땅파기 등) — 시간 걸리는 행동
    // Character 는 "뭘 언제까지 하는지" 만 기억.
    // 끝났을 때 실제 효과(타일 → 흙)는 호출자(game.js)가 처리.
    // ─────────────────────────────────────────

    /** @returns {boolean} 지금 뭔가 하는 중? (이동/다른 행동 막을 때 사용) */
    isBusy() {
        return this.action !== "idle";
    }

    /**
     * 땅파기 시작. 이미 다른 행동 중이면 실패.
     * @param {number} tileX - 팔 타일 x
     * @param {number} tileY - 팔 타일 y
     * @param {number} durationSeconds - 걸리는 시간 (DATA.CONFIG.FIELD2.DIG_SECONDS)
     * @returns {boolean} 성공 여부
     */
    startDigging(tileX, tileY, durationSeconds) {
        if (this.isBusy()) return false;

        this.action = "digging";
        this.actionEndTime = Date.now() + durationSeconds * 1000;
        this.actionTarget = { x: tileX, y: tileY };
        return true;
    }

    /**
     * 행동 시간이 끝났으면 idle 로 되돌리고 끝난 행동 정보를 반환.
     * 게임 루프에서 매 프레임 호출.
     * @returns {{action: string, target: object} | null} 방금 끝났으면 정보, 아니면 null
     */
    finishActionIfDone() {
        if (!this.isBusy()) return null;
        if (Date.now() < this.actionEndTime) return null;

        const finished = { action: this.action, target: this.actionTarget };

        this.action = "idle";
        this.actionEndTime = null;
        this.actionTarget = null;
        return finished;
    }

    // ─────────────────────────────────────────
    // 중심점 좌표 (proximity 체크 등에서 사용)
    // x, y 는 좌상단 모서리라 중심점은 +size/2.
    // ─────────────────────────────────────────

    getCenterX() {
        return this.x + DATA.CONFIG.CHARACTER.WIDTH / 2;
    }

    getCenterY() {
        return this.y + DATA.CONFIG.CHARACTER.HEIGHT / 2;
    }
}
