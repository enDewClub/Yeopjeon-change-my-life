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
