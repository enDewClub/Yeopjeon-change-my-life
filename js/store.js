// ═══════════════════════════════════════════════════════
// store.js - 상점 시스템 (Shop System)
//
// 마을 중심의 '상점' 버튼을 누르면 진입하는 씬.
//
// 1단계 (지금 만드는 거): 클릭하면 즉시 구매/판매. 팝업 없음.
// 2단계 (나중): 팝업창에서 수량 선택. (1단계 끝나고 추가 예정)
//
// 흐름:
//   마을 → '상점' 버튼 클릭
//     → onEnterShopClick()      (씬 전환 + 초기 렌더)
//   상점 안에서 '구매하기' 버튼 클릭
//     → onBuyItemClick(itemId)  (소지금 차감 + 인벤 추가)
//     → renderInStore()         (다시 그리기)
//   인벤 아이템 클릭
//     → onSellItemClick(itemId) (다 팔고 소지금 증가)
//     → renderInStore()
//   '나가기' 버튼 클릭
//     → onExitShopClick()       (게임 씬으로)
//
// 작업 순서 (작은 거 → 큰 거):
//   1. canAfford            (제일 단순, 다른 함수 안 씀)
//   2. renderBuyItemButton  (헬퍼)
//   3. renderSellItemButton (헬퍼)
//   4. renderBuyItemList    (위 헬퍼 사용)
//   5. renderSellItemList   (위 헬퍼 사용)
//   6. renderInStore        (위 3개 다 호출하는 묶음)
//   7. onEnterShopClick     (씬 전환 + renderInStore)
//   8. onExitShopClick      (씬 전환만)
//   9. onBuyItemClick       (위 다 사용)
//  10. onSellItemClick      (위 다 사용)
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 1. 헬퍼 함수 (Helpers)
// 다른 함수들 안에서 쓰는 작은 도구.
// ═══════════════════════════════════════════════

/**
 * 현재 소지금으로 가격을 낼 수 있는지 확인한다.
 * @param {number} price - 비교할 가격
 * @returns {boolean} 충분하면 true, 부족하면 false
 */
function canAfford(price) {
    // pseudocode:
    // STATE.money 가 price 이상이면 true, 아니면 false 리턴
    // 코드:
}

// ═══════════════════════════════════════════════
// 2. 씬 진입 / 종료
// ═══════════════════════════════════════════════

/**
 * 상점 씬으로 들어간다.
 * 마을의 '상점' 특수 버튼이 눌렸을 때 map.js 에서 호출됨.
 */
function onEnterShopClick() {
    // pseudocode:
    // 1. switchScene("shop") 호출 (씬 전환)
    // 2. renderInStore() 호출 (상점 안 모든 요소 그리기)
    // 코드:
}

/**
 * 상점 씬을 종료하고 게임 씬으로 돌아간다.
 * 상점의 '나가기' 버튼이 눌렸을 때 호출됨 (game.js 에 연결됨).
 * 게임 씬으로 돌아가면 인벤/소지금 표시도 새로 그려야 함.
 */
function onExitShopClick() {
    // pseudocode:
    // 1. switchScene("game") 호출
    // 2. renderInventory() 호출 (게임 씬의 인벤 바 갱신)
    // 3. renderMoney() 호출 (게임 씬의 소지금 갱신)
    // 코드:
}

// ═══════════════════════════════════════════════
// 3. 마스터 렌더러
// 상점 안 모든 요소를 한 번에 그리는 함수.
// 처음 들어올 때 + 구매/판매 후 갱신 때 호출.
// ═══════════════════════════════════════════════

/**
 * 상점 안의 모든 UI 요소를 그린다.
 */
function renderStore() {
    // pseudocode:
    // 1. renderBuyItemList() 호출
    // 2. renderSellItemList() 호출
    // 3. renderMoney() 호출 (ui.js 에 이미 있음 — 그대로 부르기)
    // 코드:
}

// ═══════════════════════════════════════════════
// 4. 구매 영역 (Buy Section)
// 살 수 있는 아이템들. 가격 고정이라 한 번 그리고 끝.
// ═══════════════════════════════════════════════

/**
 * 살 수 있는 아이템 리스트를 #shop-buy-section 안에 그린다.
 * DATA.ITEMS 의 아이템 중 buyPrice 가 있는 것만.
 */
function renderBuyItemList() {
    // pseudocode:
    // 1. #shop-buy-section 의 안 내용 비우기 (다시 그리기 위해)
    // 2. DATA.ITEMS 의 각 아이템(itemId, item)을 순회
    //    - item.buyPrice 가 없으면 건너뛰기 (못 사는 거)
    //    - 있으면: renderBuyItemButton(itemId) 로 버튼 만들어서 추가
    // 힌트:
    //   객체 순회: for (const itemId in DATA.ITEMS) { ... }
    //              또는 Object.keys(DATA.ITEMS).forEach(itemId => { ... })
    //   요소 비우기: element.innerHTML = ""
    //   요소 추가: element.appendChild(...)
    // 코드:
}

/**
 * 구매 버튼 하나를 만들어서 리턴한다. (renderBuyItemList 가 사용)
 * 버튼 안에 아이콘 + 이름 + 가격이 보여야 함.
 * 클릭하면 onBuyItemClick(itemId) 가 호출되도록 이벤트 리스너 등록.
 * @param {string} itemId
 * @returns {HTMLElement}
 */
function renderBuyItemButton(itemId) {
    // pseudocode:
    // 1. DATA.ITEMS[itemId] 로 아이템 정보 가져오기
    // 2. <button> element 만들기
    // 3. 안에 아이콘 <img> + 이름 <span> + 가격 <span> 추가
    // 4. 버튼에 click 이벤트 리스너 추가: onBuyItemClick(itemId) 호출
    // 5. 버튼 리턴
    // 힌트:
    //   element 만들기: document.createElement("button")
    //   클래스 추가: el.className = "shop-buy-btn"
    //   클릭 등록: btn.addEventListener("click", () => onBuyItemClick(itemId))
    //   참고: ui.js 의 createSlotElement 가 비슷한 패턴 — img + count span
    // 코드:
}

// ═══════════════════════════════════════════════
// 5. 판매 영역 (Sell Section)
// 인벤토리 안의 아이템들. 인벤 바뀌면 다시 그려야 함.
// ═══════════════════════════════════════════════

/**
 * 인벤토리 안의 팔 수 있는 아이템들을 #shop-sell-section 안에 그린다.
 * 빈 슬롯은 무시, sellPrice 없는 아이템도 무시.
 */
function renderSellItemList() {
    // pseudocode:
    // 1. #shop-sell-section 의 안 내용 비우기
    // 2. STATE.inventory.slots 의 각 slot 을 순회
    //    - slot 이 null 이면 건너뛰기 (빈 슬롯)
    //    - DATA.ITEMS[slot.itemId].sellPrice 가 없으면 건너뛰기 (못 팜)
    //    - 있으면: renderSellItemButton(slot) 로 버튼 만들어서 추가
    // 힌트:
    //   순회: STATE.inventory.slots.forEach((slot) => { ... })
    //   참고: ui.js 의 renderInventory 가 비슷한 패턴
    // 코드:
}

/**
 * 판매 버튼 하나를 만들어서 리턴한다. (renderSellItemList 가 사용)
 * 버튼 안에 아이콘 + 갯수 + 판매가가 보여야 함.
 * 클릭하면 onSellItemClick(slot.itemId) 호출.
 * @param {object} slot - { itemId, count }
 * @returns {HTMLElement}
 */
function renderSellItemButton(slot) {
    // pseudocode:
    // 1. DATA.ITEMS[slot.itemId] 로 아이템 정보 가져오기 (sellPrice 필요)
    // 2. <button> element 만들기
    // 3. 안에 아이콘 + 갯수 + 판매가 추가
    // 4. 클릭 이벤트 리스너: onSellItemClick(slot.itemId) 호출
    // 5. 버튼 리턴
    // 코드:
}

// ═══════════════════════════════════════════════
// 6. 구매 / 판매 액션 — 1단계 버전
//
// 1단계: 클릭 = 즉시 구매/판매 (팝업 없음)
// 2단계 (LATER): 클릭 = 팝업 띄움, 팝업에서 수량 선택 후 구매/판매
// → 함수 이름은 그대로, 안의 코드만 2단계에서 바뀜
// ═══════════════════════════════════════════════

/**
 * 구매 버튼을 클릭했을 때 호출.
 * 1단계: 즉시 아이템 1개 구매.
 * @param {string} itemId
 */
function onBuyItemClick(itemId) {
    // pseudocode:
    // 1. DATA.ITEMS[itemId] 로 아이템 정보 가져오기 (buyPrice 필요)
    // 2. canAfford(item.buyPrice) 가 false 면 return (돈 부족)
    // 3. STATE.money 에서 buyPrice 빼기
    // 4. STATE.inventory.addItem(itemId, 1) 호출
    // 5. renderInStore() 호출 (화면 다시 그리기)
    // 코드:
}

/**
 * 판매 아이템을 클릭했을 때 호출.
 * 1단계: 인벤토리에 있는 그 아이템을 모두 한 번에 판매.
 * @param {string} itemId
 */
function onSellItemClick(itemId) {
    // pseudocode:
    // 1. DATA.ITEMS[itemId] 로 아이템 정보 가져오기 (sellPrice 필요)
    // 2. STATE.inventory.getItemCount(itemId) 로 갯수 알아내기
    // 3. 갯수가 0 이면 return (팔 게 없음 — 안전장치)
    // 4. 총 금액 = 갯수 × sellPrice 계산
    // 5. STATE.money 에 총 금액 더하기
    // 6. STATE.inventory.removeItem(itemId, 갯수) 호출 (전부 제거)
    // 7. renderInStore() 호출
    // 코드:
}

// ═══════════════════════════════════════════════════════
// ⬇️ 2단계 LATER - 아래는 1단계에서는 안 만듦
// ═══════════════════════════════════════════════════════
// onBuyClick(itemId, count)       팝업의 '사기' 버튼 → 실제 구매
// onSellClick(itemId, count)      팝업의 '팔기' 버튼 → 실제 판매
// onShopCancelClick()             팝업 '안구매/안판매' 버튼
// onAddCountClick()               팝업 수량 + 버튼
// onSubtractCountClick()          팝업 수량 - 버튼
// renderPopupWindow()             팝업창 자체 그리기
// renderStoreNpc()                상점 NPC 캐릭터/말풍선
//
// 1단계 다 만들고 작동하는 거 확인한 후에 위 함수들 추가하면 됨.
// 그때 onBuyItemClick / onSellItemClick 의 본문도 바뀜 (직접 처리 → 팝업 띄우기).
