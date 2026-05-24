// ═══════════════════════════════════════════════
// 효과 적용 (Consumable 의 effect 객체 처리)
// effect.kind 별로 분기. 새 효과 종류 추가하려면 case 추가.
// ═══════════════════════════════════════════════

/**
 * Consumable 의 effect 를 적용한다.
 * @param {object} effect - { kind, targetId, toLevel, ... }
 * @returns {boolean} 성공 true / 실패 false
 */
function applyEffect(effect) {
    switch (effect.kind) {
        case "upgrade":
            return applyUpgrade(effect.targetId, effect.toLevel);
        // 미래: case "heal": ...
        // 미래: case "buff": ...
        default:
            console.warn(`알 수 없는 effect.kind: ${effect.kind}`);
            return false;
    }
}

/**
 * 업그레이더블 재산을 toLevel 로 올린다.
 * Upgradable.upgradeTo 가 한 단계씩만 올라가도록 강제하므로 여기선 그대로 전달.
 * @returns {boolean} 성공 여부
 */
function applyUpgrade(targetId, toLevel) {
    const upgradable = STATE.upgrades[targetId];
    if (!upgradable) return false;

    // TODO 미래: 업그레이드 효과음 / 짧은 애니메이션 트리거
    return upgradable.upgradeTo(toLevel);
}

// resetGameState()
// applyEffect({ kind: "upgrade", targetId: "house", toLevel: 2 })  // → true
// STATE.upgrades.house.currentLevel                                 // → 2
// applyEffect({ kind: "upgrade", targetId: "house", toLevel: 3 })  // → true
// applyEffect({ kind: "upgrade", targetId: "house", toLevel: 4 })  // → false (최대 초과)
// applyEffect({ kind: "unknown_kind" })                             // → false + 콘솔 경고
// resetGameState()
// applyEffect({ kind: "upgrade", targetId: "house", toLevel: 3 })  // → false (1→3 한 번에 못 감)

// ═══════════════════════════════════════════════
// 특정 업그레이더블의 "다음 단계" 에 맞는 consumable id 를 찾는다.
// 상점 구매 목록 렌더링 시 사용 — "이 업그레이더블 다음 단계용 아이템이 뭐지?".
// 이미 최대 레벨이면 null (그 업그레이더블 관련 버튼은 안 그림).
// ═══════════════════════════════════════════════
function findNextUpgradeConsumableId(upgradableId) {
    const upgradable = STATE.upgrades[upgradableId];
    if (!upgradable || upgradable.isAtMaxLevel()) return null;

    const nextLevel = upgradable.currentLevel + 1;

    // DATA.ITEMS 에서 조건 맞는 consumable 검색
    //   - type 이 "consumable"
    //   - effect.kind 가 "upgrade"
    //   - effect.targetId 가 이 업그레이더블
    //   - effect.toLevel 이 다음 레벨
    for (const id in DATA.ITEMS) {
        const item = DATA.ITEMS[id];
        if (
            item.type === "consumable" &&
            item.effect?.kind === "upgrade" &&
            item.effect.targetId === upgradableId &&
            item.effect.toLevel === nextLevel
        ) {
            return id;
        }
    }
    return null;
}
// resetGameState()
// findNextUpgradeConsumableId("house")                              // → "magic_book_2"
// findNextUpgradeConsumableId("clothes")                            // → "magic_silk_2"
// STATE.upgrades.house.upgradeTo(2)
// findNextUpgradeConsumableId("house")                              // → "magic_book_3"
// STATE.upgrades.house.upgradeTo(3)
// findNextUpgradeConsumableId("house")                              // → null (최대 레벨)
// findNextUpgradeConsumableId("nonexistent")                        // → null
