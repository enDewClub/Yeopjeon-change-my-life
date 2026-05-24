// ═══════════════════════════════════════════════════════
// inventory.js - 인벤토리 클래스 (Inventory Class)
//
// 플레이어의 인벤토리 상태(슬롯 배열)와 행동(추가/제거/선택)을
// 한 곳에 묶은 객체. data.js / state.js 처럼 분리하지 않고
// 클래스로 합치는 이유:
//   - 인벤토리의 데이터(slotsArray)와 그걸 다루는 로직이 항상 같이 다님
//   - "인벤토리는 자기 자신을 관리한다" 라는 캡슐화(encapsulation)
//   - API 가 깔끔해짐: STATE.inventory.addItem("garlic_seed", 3)
//
// 사용 예:
//   STATE.inventory = new Inventory(20);
//   STATE.inventory.addItem("potato_seed", 3);  // 추가
//   STATE.inventory.hasItem("potato_seed", 1);  // 있는지 확인
//   STATE.inventory.selectSlot(0);              // 슬롯 선택
//   STATE.inventory.getSelectedItem();          // → DATA.ITEMS.potato_seed
// ═══════════════════════════════════════════════════════

class Inventory {
    // ─────────────────────────────────────────
    // 생성자: 새 인벤토리 만들기
    // ─────────────────────────────────────────

    /**
     * @param {number} size - 슬롯 총 갯수 (보통 20)
     */
    constructor(size) {
        this.size = size; // 슬롯 갯수
        this.slotsArray = new Array(size).fill(null); // 슬롯 배열 (null = 빈 칸, 아니면 { itemId, count })
        this.selectedSlotIndex = null; // 현재 선택된 슬롯 위치 (없으면 null)
    }

    // ─────────────────────────────────────────
    // 아이템 추가 / 제거
    // ─────────────────────────────────────────

    /**
     * 인벤토리에 아이템을 추가한다.
     * 같은 아이템이 이미 있으면 그 슬롯에 갯수만 더하고,
     * 없으면 빈 슬롯을 찾아서 새로 넣는다.
     * (같은 아이템은 항상 한 슬롯에만 있도록 관리.)
     * @param {string} itemId - DATA.ITEMS 의 키 (예: "potato_seed")
     * @param {number} count - 추가할 갯수
     * @returns {boolean} 성공 true / 인벤토리 꽉 차서 실패 false
     */
    addItem(itemId, count) {
        // 1. 같은 아이템 슬롯이 이미 있나? 있으면 거기에 쌓기
        const existingIndex = this.slotsArray.findIndex(
            (slot) => slot !== null && slot.itemId === itemId,
        );

        if (existingIndex !== -1) {
            this.slotsArray[existingIndex].count += count;
            return true;
        }

        // 2. 없으면 빈 슬롯 찾아서 새로 넣기
        const emptyIndex = this.slotsArray.findIndex((slot) => slot === null);

        if (emptyIndex === -1) {
            return false; // 빈 슬롯도 없음 → 인벤토리 꽉참
        }

        this.slotsArray[emptyIndex] = { itemId, count };
        console.log(
            "Added stuff to my inventory!" + STATE.inventory.slotsArray,
        );
        return true;
    }

    /**
     * 인벤토리에서 아이템을 제거한다.
     * 갯수가 0 이 되면 슬롯을 null 로 비운다.
     * @param {string} itemId
     * @param {number} count - 제거할 갯수
     * @returns {boolean} 성공 true / 갯수 부족 false
     */
    removeItem(itemId, count) {
        if (!this.hasItem(itemId, count)) return false;

        const slotIndex = this.slotsArray.findIndex(
            (slot) => slot !== null && slot.itemId === itemId,
        );

        this.slotsArray[slotIndex].count -= count;

        // 갯수가 0 이하면 슬롯 비우기
        if (this.slotsArray[slotIndex].count <= 0) {
            this.slotsArray[slotIndex] = null;
        }

        return true;
    }

    // ─────────────────────────────────────────
    // 아이템 조회 (읽기만, 인벤토리 안 바뀜)
    // ─────────────────────────────────────────

    /**
     * 특정 아이템이 count 갯수 이상 있는지 확인한다.
     * @param {string} itemId
     * @param {number} count - 필요한 갯수 (기본 1)
     * @returns {boolean}
     */
    hasItem(itemId, count = 1) {
        return this.getItemCount(itemId) >= count;
    }

    /**
     * 특정 아이템이 현재 몇 개 있는지 반환한다.
     * (같은 아이템은 한 슬롯에만 있도록 addItem 이 보장하므로 단순.)
     * @param {string} itemId
     * @returns {number}
     */
    getItemCount(itemId) {
        const slot = this.slotsArray.find(
            (slot) => slot !== null && slot.itemId === itemId,
        );
        return slot ? slot.count : 0;
    }

    // ─────────────────────────────────────────
    // 슬롯 선택 / 해제
    // ─────────────────────────────────────────

    /**
     * 슬롯을 선택한다. 이미 선택된 슬롯을 다시 클릭하면 해제(토글).
     * 빈 슬롯도 선택 가능 (UI 쪽에서 빈 슬롯 클릭 무시할지 결정).
     * @param {number} index - 슬롯 위치 (0 ~ size-1)
     */
    selectSlot(index) {
        if (this.selectedSlotIndex === index) {
            this.selectedSlotIndex = null; // 토글: 같은 슬롯 다시 클릭 → 해제
        } else {
            this.selectedSlotIndex = index;
        }
    }

    /**
     * 선택을 강제로 해제한다.
     * (예: 씨앗을 심은 후 자동 해제)
     */
    deselectSlot() {
        this.selectedSlotIndex = null;
    }

    /**
     * 현재 선택된 아이템의 정의(DATA.ITEMS 엔트리)를 반환한다.
     * 선택된 게 없거나 빈 슬롯이면 null.
     * @returns {object|null}
     */
    getSelectedItem() {
        if (this.selectedSlotIndex === null) return null;

        const slot = this.slotsArray[this.selectedSlotIndex];
        if (slot === null) return null;

        return DATA.ITEMS[slot.itemId];
    }
}
