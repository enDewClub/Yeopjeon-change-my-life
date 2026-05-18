// ═══════════════════════════════════════════════════════
// store.js - 상점 시스템 (1단계)
//
// HTML 요소 ID (필요할 때 $("id") 로 가져오기):
//   #store-buy-section    - 구매 목록 들어가는 자리
//   #store-sell-section   - 판매 목록 들어가는 자리
//   #store-money-amount   - 소지금 표시
// ═══════════════════════════════════════════════════════

// ───────────────────────────────────────────────
// 헬퍼 함수 (작은 거 - 먼저 만들기)
// ───────────────────────────────────────────────

function canAfford(price) {
    // 체크할 것:
    //   - STATE.money 가 price 이상이면 true 리턴
    //   - 아니면 false 리턴
}

function getItemSellTotal(itemId) {
    // 체크할 것:
    //   - DATA.ITEMS[itemId] 에서 sellPrice 가져오기
    //   - STATE.inventory.getItemCount(itemId) 로 갯수 가져오기
    //   - 둘 곱한 값 리턴
}

// ───────────────────────────────────────────────
// 화면 그리기 함수
// ───────────────────────────────────────────────

function renderStoreBuyList() {
    // 체크할 것:
    //   - #store-buy-section 비우기 (innerHTML = "")
    //   - DATA.ITEMS 의 buyPrice 있는 아이템들만 순회
    //   - 각각 버튼 만들어서 추가 (아이콘 + 가격, 클릭하면 onBuyClick 호출)
    //   - 참고: ui.js 의 createSlotElement 가 비슷한 패턴
}

function renderStoreSellList() {
    // 체크할 것:
    //   - #store-sell-section 비우기
    //   - STATE.inventory.slots 순회 (null 인 칸은 건너뛰기)
    //   - 각 슬롯마다 버튼 만들어서 추가 (아이콘 + 갯수 + 판매가, 클릭하면 onSellClick 호출)
    //   - 참고: ui.js 의 renderInventory 가 비슷한 순회 패턴
}

function renderStoreMoney() {
    // 체크할 것:
    //   - $("store-money-amount").textContent 를 STATE.money 로 설정
}

// ───────────────────────────────────────────────
// 이벤트 핸들러
// ───────────────────────────────────────────────

function onBuyClick(itemId) {
    // 체크할 것:
    //   - DATA.ITEMS[itemId] 로 아이템 정보 가져오기
    //   - canAfford(item.buyPrice) 가 false 면 그냥 return (돈 부족)
    //   - STATE.money 에서 buyPrice 빼기
    //   - STATE.inventory.addItem(itemId, 1)
    //   - renderStoreMoney() 와 renderStoreSellList() 호출
}

function onSellClick(itemId) {
    // 체크할 것:
    //   - DATA.ITEMS[itemId] 가져오기
    //   - STATE.inventory.getItemCount(itemId) 로 갯수 가져오기
    //   - 갯수가 0 이면 그냥 return
    //   - 총금액 = getItemSellTotal(itemId) 호출
    //   - STATE.money 에 총금액 더하기
    //   - STATE.inventory.removeItem(itemId, 갯수)
    //   - renderStoreMoney() 와 renderStoreSellList() 호출
}

function onLeaveStore() {
    // 체크할 것:
    //   - switchScene("game") 호출
    //   - renderInventory() 호출 (상점에서 변한 인벤토리를 메인 화면에도 반영)
}

// ───────────────────────────────────────────────
// 씬 진입 (상점 들어올 때 한 번 호출)
// ───────────────────────────────────────────────

function enterStore() {
    // 체크할 것:
    //   - renderStoreBuyList()
    //   - renderStoreSellList()
    //   - renderStoreMoney()
}
