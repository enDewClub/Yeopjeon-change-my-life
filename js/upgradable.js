// ═══════════════════════════════════════════════════════
// upgradable.js - 업그레이드 가능한 재산 클래스 (Upgradable Property)
//
// 집, 옷 같은 "캐릭터의 재산" 을 표현한다.
// 인벤토리 아이템(Inventory)과 달리 수량이 없고, 하나의 레벨 값만 가짐.
//   data.js → DATA.UPGRADABLE_PROPERTIES 에서 정의 (정적)
//   state.js → STATE.upgrades.{id} 에 인스턴스 저장 (동적)
//
// 같은 패턴: Inventory/Field/Character — 자기 상태는 자기가 관리.
//
// 사용 예:
//   STATE.upgrades.house = new Upgradable(DATA.UPGRADABLE_PROPERTIES.house);
//   STATE.upgrades.house.upgradeTo(2);
//   STATE.upgrades.house.getCurrentLevelData();  // → { level: 2, image: ... }
// ═══════════════════════════════════════════════════════

class Upgradable {
    /**
     * @param {object} definition - DATA.UPGRADABLE_PROPERTIES 의 한 엔트리
     */
    constructor(definition) {
        this.definition = definition; // 정의 (id, levels, renderLocation 등)
        this.currentLevel = definition.startLevel; // 시작 레벨 (보통 1)
    }

    // ─────────────────────────────────────────
    // 조회 (읽기만, 상태 안 바뀜)
    // ─────────────────────────────────────────

    /**
     * 현재 레벨의 데이터 ({ level, displayName, image, ... }) 를 반환한다.
     * UI 렌더링 시 이미지/이름 가져올 때 사용.
     * @returns {object}
     */
    getCurrentLevelData() {
        return this.definition.levels.find(
            (l) => l.level === this.currentLevel,
        );
    }

    /**
     * 정의된 최대 레벨 (levels 배열 길이).
     * @returns {number}
     */
    getMaxLevel() {
        return this.definition.levels.length;
    }

    /**
     * 이미 최대 레벨인지 여부. (상점에서 더 이상 안 보여줄 때 사용)
     * @returns {boolean}
     */
    isAtMaxLevel() {
        return this.currentLevel >= this.getMaxLevel();
    }

    // ─────────────────────────────────────────
    // 변경 (상태 바꿈)
    // ─────────────────────────────────────────

    /**
     * 특정 레벨로 업그레이드한다.
     * 한 단계씩만 올라가도록 강제 (defensive — 잘못된 순서로 못 올림).
     * @param {number} toLevel
     * @returns {boolean} 성공 true / 잘못된 요청 false
     */
    upgradeTo(toLevel) {
        // 한 단계씩만 올라가도록 강제 (현재 레벨 + 1 이어야 함)
        if (toLevel !== this.currentLevel + 1) return false;
        // 최대 레벨 초과 방지
        if (toLevel > this.getMaxLevel()) return false;

        this.currentLevel = toLevel;
        return true;
    }
}
