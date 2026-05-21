// ═══════════════════════════════════════════════════════
// store.js - 상점 시스템 (Store System)
//
// 마을 중심의 '상점' 버튼을 누르면 진입하는 씬.
//
// 1단계 (지금):
//   - 구매: 클릭 = 즉시 1개 구매 (팝업 X)
//   - 판매: 클릭 = 그 아이템 전부 판매 (팝업 X)
//
// 2단계 (나중): 팝업창에서 수량 선택.
//
// 흐름:
//   마을 → '상점' 버튼 클릭
//     → onEnterStoreClick()    (씬 전환 + 초기 렌더)
//   상점 구매 버튼 클릭
//     → onBuyItemClick(itemId) → onBuyClick(itemId)
//   상점 판매 아이템 클릭
//     → onSellItemClick(itemId) → onSellClick(itemId)
//   '나가기' 버튼 클릭
//     → onExitStoreClick()
//
// 작업 순서 (작은 거 → 큰 거):
//   1. isAffordable, calculateTotalPrice      (헬퍼)
//   2. onEnterStoreClick, onExitStoreClick,
//      onBuyItemClick, onSellItemClick        (단순 핸들러)
//   3. onBuyClick, onSellClick                (실제 액션)
//   4. renderStore, renderBuyItemList, ...    (렌더 - 나중 차례)
//
// ─── 테스트 사용법 ─────────────────────────────
// 각 함수 밑에 console.log 테스트가 코멘트로 있음.
// 함수 채운 후 → 한 줄씩 코멘트 풀기 (// 제거) → HTML 새로고침 → F12 콘솔에서 값 확인.
// 콘솔 출력값과 옆에 적힌 expected (→ 옆) 가 같으면 통과 ✅
// `resetGameState()` 가 깨끗한 상태로 초기화함 (소지금 100, 시작 인벤).
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 1. 헬퍼 함수 (Helpers)
// ═══════════════════════════════════════════════

/**
 * 가진 돈으로 가격을 낼 수 있는지 확인한다.
 * @param {number} myMoney   - 지금 가진 돈
 * @param {number} itemPrice - 사려는 물건 값
 * @returns {boolean} 살 수 있으면 true, 아니면 false
 */
function isAffordable(myMoney, itemPrice) {
    //1 소지금>=아이템 가격이면 살 수 있음
    if(myMoney>=itemPrice){
    return true;
    }
    //2 소지금<아이템 가격이면 살 수 없음
    else return false;
}

// ─── isAffordable 테스트 ──────────────────────
//console.log(isAffordable(100, 50));    // → true   (충분)
//console.log(isAffordable(50, 50));     // → true   (딱 맞음)
//console.log(isAffordable(30, 50));     // → false  (부족)
//console.log(isAffordable(0, 100));     // → false  (돈 0)
//console.log(isAffordable(100, 0));     // → true   (공짜)

/**
 * 총 금액을 계산한다. (단가 × 수량)
 * @param {number} itemPrice - 단가 (한 개 가격)
 * @param {number} count     - 수량
 * @returns {number} totalPrice
 */
function calculateTotalPrice(itemPrice, count) {
    return itemPrice * count;
}

// ─── calculateTotalPrice 테스트 ──────────────
 //console.log(calculateTotalPrice(7, 3));      // → 21
 //console.log(calculateTotalPrice(10, 1));     // → 10  (1개)
 //console.log(calculateTotalPrice(5, 0));      // → 0   (수량 0)
 //console.log(calculateTotalPrice(0, 5));      // → 0   (공짜)
 //console.log(calculateTotalPrice(100, 10));   // → 1000

// ═══════════════════════════════════════════════
// 2. 씬 진입/종료 + 단순 클릭 핸들러
// 짧은 함수들 - 대부분 다른 함수 호출만 함.
// ═══════════════════════════════════════════════

/**
 * 상점 씬으로 들어간다.
 * 마을의 '상점' 특수 버튼이 눌렸을 때 map.js 에서 호출됨.
 *
 * ★ 이 함수는 layout 참고용으로 미리 작성됨 (다른 함수 채울 때 형식 참고)
 */
function onEnterStoreClick() {
    // 1. 씬 전환
    switchScene("store");

    // 2. 상점 안의 모든 UI 요소 그리기
    renderStore();
}

// ─── onEnterStoreClick 테스트 ────────────────
// resetGameState();
// onEnterStoreClick();
// console.log(STATE.currentScene);    // → "store"
//
// onExitStoreClick();                 // 다시 나가기
// onEnterStoreClick();                // 다시 들어가기
// console.log(STATE.currentScene);    // → "store"

/**
 * 상점 씬을 종료하고 게임 씬으로 돌아간다.
 * 게임 씬 인벤바 + 소지금 표시도 새로 그려줘야 함 (상점에서 바뀐 게 있으니까).
 */
function onExitStoreClick() {
    // 1. 씬 전환
    switchScene("game");

    // 2. 상점에서 옷/집을 업그레이드했을 수 있으니 현재 맵 다시 그리기 
    renderMap(STATE.currentMap);

    // 3. 인벤토리 다시 그리기 (상점에서 변경됐을 수 있음)
    renderInventory();

    // 4. 소지금 다시 그리기 (상점에서 변경됐을 수 있음)
    renderMoney();
}

// ─── onExitStoreClick 테스트 ─────────────────
 //resetGameState();
 //onEnterStoreClick();
// console.log(STATE.currentScene);    // → "store"
 //onExitStoreClick();
 //console.log(STATE.currentScene);    // → "game"
// (그리고 화면에서 게임 씬의 인벤바, 소지금이 새로 그려졌는지 눈으로 확인)

/**
 * 구매 아이템 버튼이 클릭됐을 때.
 * 1단계: 곧장 onBuyClick(itemId) 호출.
 * (2단계에선 팝업창을 띄우는 걸로 바뀜)
 * @param {string} itemId
 */
function onBuyItemClick(itemId) {
    //1 해당아이템 DATA.ITEMS[itemId] 을 selectedItem 변수이름에 저장하기
    let selectedItem = DATA.ITEMS[itemId] ;

    //2 구매하기함수를 불러오기 onBuyClick(itemId)
    onBuyClick(itemId);

    //3 저장된 정보 (DATA.ITEMS[itemId].display,  DATA.ITEMS[itemId].icon,
    //DATA.ITEMS[itemId].description) 를 구매하기 함수에 보여준다. 
}

// ─── onBuyItemClick 테스트 (onBuyClick 과 결과 같아야 함) ──
// resetGameState();
// onBuyItemClick("garlic_seed");
// console.log(STATE.money);                                   // → 90
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 3
//
// resetGameState();
// onBuyItemClick("potato_seed");
// console.log(STATE.money);                                   // → 80

/**
 * 판매 아이템 버튼이 클릭됐을 때.
 * 1단계: 곧장 onSellClick(itemId) 호출.
 * @param {string} itemId
 */
function onSellItemClick(itemId) {
    //1) 해당아이템 DATA.ITEMS[itemId] 을 selectedItem 변수로 이름에 저장하기
    let selectedItem = DATA.ITEMS[itemId] ;
    //2) 판매하기 함수를 불러오기 
    onSellClick(itemId);

    //3) 저장된 정보 (DATA.ITEMS[itemId].display,  DATA.ITEMS[itemId].icon,
    //DATA.ITEMS[itemId].description) 를 구매하기 함수에 보여준다. 
}

// ─── onSellItemClick 테스트 (onSellClick 과 결과 같아야 함) ──
 resetGameState();
 STATE.inventory.addItem("garlic", 3);
 onSellItemClick("garlic");
 console.log(STATE.money);                              // → 109 (100 + 3*3)
 console.log(STATE.inventory.getItemCount("garlic"));   // → 0

// ═══════════════════════════════════════════════
// 3. 액션 함수 — 실제 구매 / 판매
// ═══════════════════════════════════════════════

/**
 * 아이템을 1개 구매한다 (1단계).
 * 돈 부족하면 아무 일도 안 함.
 * @param {string} itemId
 */
function onBuyClick(itemId) {
    let selectedItem = DATA.ITEMS[itemId];
    
// 1) 살 수 있는 돈이 있는지 체크 (가진 돈, 아이템 가격)
    if (isAffordable(STATE.money, selectedItem.buyPrice) === false) {
        return; 
    }

    // 2) 인벤토리에 아이템 1개 추가
    let isAdded = STATE.inventory.addItem(itemId, 1);

    // 3) 추가에 성공했을 때만 실제로 돈을 깎음
    if (isAdded === true) {
        let totalPrice = calculateTotalPrice(selectedItem.buyPrice, 1);
        STATE.money = STATE.money - totalPrice;
        
    } else {
        // addItem이 false를 리턴했다면 인벤토리가 꽉 찬 것
        displayStoreMessage("인벤토리가 꽉 차서 살 수 없습니다!");
    }
}

// ─── onBuyClick 테스트 ──────────────────────
// ① 정상 구매
// resetGameState();
// onBuyClick("garlic_seed");
// console.log(STATE.money);                                   // → 90
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 3
//
// ② 돈 부족 → 변동 없음
// resetGameState(); STATE.money = 5;
// onBuyClick("garlic_seed");
// console.log(STATE.money);                                   // → 5
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 2
//
// ③ 딱 맞는 돈
// resetGameState(); STATE.money = 10;
// onBuyClick("garlic_seed");
// console.log(STATE.money);                                   // → 0
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 3
//
// ④ 여러 번 구매 (같은 슬롯에 쌓이는지)
// resetGameState();
// onBuyClick("garlic_seed"); onBuyClick("garlic_seed"); onBuyClick("garlic_seed");
// console.log(STATE.money);                                   // → 70
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 5
//
// ⑤ 다른 아이템 구매
// resetGameState();
// onBuyClick("potato_seed");
// console.log(STATE.money);                                   // → 80
//ㄴ console.log(STATE.inventory.getItemCount("potato_seed"));   // → 4


/**
 * 인벤토리의 그 아이템을 전부 판매한다 (1단계).
 * 인벤에 없으면 아무 일도 안 함.
 * @param {string} itemId
 */
function onSellClick(itemId) {
    let selectedItem = DATA.ITEMS[itemId];
    
    // 1) 인벤토리에 해당 아이템이 몇 개 있는지 체크하기
    let sellCount = STATE.inventory.getItemCount(itemId);

    // 2) 인벤토리에 아이템이 0개 이하로 있으면 아무 일도 안 함
    if (sellCount <= 0) {
        return; 
    }

    // 3) 인벤토리에서 그 아이템을 개수만큼 전부 제거하기
    let isRemoved = STATE.inventory.removeItem(itemId, sellCount);

    // 4) 인벤토리에서 제거 성공하면, 소지금에서 차감
    if (isRemoved === true) {
        // 총 판매 금액 = 단가 * 가지고 있던 수량 전부
        let totalEarned = calculateTotalPrice(selectedItem.sellPrice, sellCount);
        
        // 돈을 더해서 다시 STATE.money에 저장
        STATE.money = STATE.money + totalEarned;
    }
}

// ─── onSellClick 테스트 ──────────────────────
// ① 정상 판매 (다 팔림)
 resetGameState();
 STATE.inventory.addItem("garlic", 3);
 onSellClick("garlic");
 console.log(STATE.money);                              // → 109 (100 + 3*3)
 console.log(STATE.inventory.getItemCount("garlic"));   // → 0
//
// ② 팔 게 없음 → 변동 없음
 resetGameState();
 onSellClick("garlic");
 console.log(STATE.money);                              // → 100 (변동 X)
//
// ③ 1개만 판매
 resetGameState();
 STATE.inventory.addItem("potato", 1);
 onSellClick("potato");
 console.log(STATE.money);                              // → 107
 console.log(STATE.inventory.getItemCount("potato"));   // → 0
//
// ④ 큰 수량 판매
 resetGameState();
 STATE.inventory.addItem("potato", 10);
 onSellClick("potato");
 console.log(STATE.money);                              // → 170 (100 + 7*10)
 console.log(STATE.inventory.getItemCount("potato"));   // → 0

// ═══════════════════════════════════════════════
// 4. 마스터 렌더러
// ═══════════════════════════════════════════════

function renderStore() {
    renderMoney();
    renderStoreNpc();
    renderExitStoreButton();
    renderBuyItemList();
    renderSellItemList();
}

// ═══════════════════════════════════════════════
// 5. 구매 영역 렌더
// ═══════════════════════════════════════════════
//
function renderBuyItemButton(itemId) {
    // 클릭한 아이템의 저장된 정보(아이콘 이름/가격)를 불러와서 버튼을 그린다

    // 1. 해당 아이템 DATA.ITEMS[itemId] 를 item 변수에 저장
    const item = DATA.ITEMS[itemId];

    // 2. <button> element 를 만들고 className = "store-item-button" 부여
    const btn = document.createElement("button");
    btn.className = "store-item-button";

    // 3. <img> element 만들기:
    //    - src = item.icon
    //    - alt = item.displayName
    //    - 버튼에 appendChild
    const icon = document.createElement("img");
    icon.src = item.icon;
    icon.alt = item.displayName;
    btn.appendChild(icon);

    // 4. <span> element 만들기:
    //    - textContent = item.displayName
    //    - 버튼에 appendChild
    const name = document.createElement("span");
    name.textContent = item.displayName;
    btn.appendChild(name);

    // 5. <span> element 만들기:
    //    - textContent = item.buyPrice + "푼"
    //    - 버튼에 appendChild
    const price = document.createElement("span");
    price.textContent = item.buyPrice + "푼";
    btn.appendChild(price);

    // 6. 클릭 핸들러 부착 — addEventListener("click", () => onBuyItemClick(itemId))
    btn.addEventListener("click", () => onBuyItemClick(itemId));

    // 7. 버튼을 return
    return btn;
}

function renderBuyItemList() {
    // 1. 컨테이너 가져오기
    const container = $("shop-buy-section");

    // 2. 기존 버튼 다 지우기
    container.innerHTML = "";

    // 3. DATA.CONFIG.STORE_INVENTORY의 각 itemId를 돌면서 구매아이템버튼 만들기
    const storeItems = DATA.CONFIG.STORE_INVENTORY;

    // 4. 반복문을 돌면서 배열에 있는 itemId를 하나씩 꺼내 만들기
    storeItems.forEach((itemId) => {
        const item = DATA.ITEMS[itemId];

        // 5. 버튼 컨테이너에 추가
        container.appendChild(renderBuyItemButton(itemId));
    });
}

// ═══════════════════════════════════════════════
// 6. 판매 영역 렌더
// ═══════════════════════════════════════════════
function renderSellItemButton(itemId) {
    // 1. 해당 아이템 DATA.ITEMS[itemId] 를 item 변수에 저장
    const item = DATA.ITEMS[itemId];

    // 2. <button> element 를 만들고 className = "store-item-button" 부여
    const btn = document.createElement("button");
    btn.className = "store-item-button";

    // 3. <img> element 만들기:
    //    - src = item.icon
    //    - alt = item.displayName
    //    - 버튼에 appendChild
    const icon = document.createElement("img");
    icon.src = item.icon;
    icon.alt = item.displayName;
    btn.appendChild(icon);

    // 4. <span> element 만들기 — 인벤토리에서 갯수를 직접 조회해서 표시:
    //    - textContent = "×" + STATE.inventory.getItemCount(itemId)
    //    - 버튼에 appendChild
    const count = document.createElement("span");
    count.textContent = "×" + STATE.inventory.getItemCount(itemId);
    btn.appendChild(count);

    // 5. <span> element 만들기:
    //    - textContent = item.sellPrice + "푼"
    //    - 버튼에 appendChild
    const price = document.createElement("span");
    price.textContent = item.sellPrice + "푼";
    btn.appendChild(price);

    // 6. 클릭 핸들러 부착 — addEventListener("click", () => onSellItemClick(itemId))
    btn.addEventListener("click", () => onSellItemClick(itemId));

    // 7. 버튼을 return
    return btn;
}

function renderSellItemList() {
    //1. 컨테이너 가져오기
    const container = $("shop-sell-section");

    //2. 기존 버튼 다 지우기 
    container.innerHTML = "";

    //3. STATE.inventory.slots 의 각 슬롯을 돌면서 판매아이템버튼 만들기 
    //   1) - 슬롯이 null 이면?
    //    2)- 슬롯의아이템이 가격이 없다면? 건너뛰기
   //    3)- 버튼을 만들어서 container 에 붙이기 
    container.appendChild(renderSellItemButton(slot));
}

// ═══════════════════════════════════════════════════════
// ⬇️ 2단계 LATER — 1단계에서는 안 만듦
// ═══════════════════════════════════════════════════════
// onStoreCancelClick()      팝업 닫기 버튼
// onAddCountClick()         팝업 수량 +1
// onSubtractCountClick()    팝업 수량 -1
// renderBuyPopup(itemId)    구매 팝업창
// renderSellPopup(itemId)   판매 팝업창
// renderStoreNpc()          NPC 캐릭터/말풍선
