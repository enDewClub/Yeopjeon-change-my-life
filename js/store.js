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
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 1. 헬퍼 함수 (Helpers)
// ═══════════════════════════════════════════════

/**
 * 상점 상단의 메시지 영역에 문자열을 표시한다.
 * 성공/실패/안내 등 어떤 케이스든 같은 함수 호출.
 * 빈 문자열을 넘기면 메시지 영역을 비운다.
 * @param {string} messageString
 */
function displayStoreMessage(messageString) {
    $("store-message").textContent = messageString;
}

/**
 * 가진 돈으로 가격을 낼 수 있는지 확인한다.
 * @param {number} myMoney   - 지금 가진 돈
 * @param {number} itemPrice - 사려는 물건 값
 * @returns {boolean} 살 수 있으면 true, 아니면 false
 */
function isAffordable(myMoney, itemPrice) {
    //1 소지금>=아이템 가격이면 살 수 있음
    if (myMoney >= itemPrice) {
        return true;
    }
    //2 소지금<아이템 가격이면 살 수 없음
    else return false;
}

// ─── isAffordable 테스트 ──────────────────────
// console.log(isAffordable(100, 50));    // → true   (충분)
// console.log(isAffordable(50, 50));     // → true   (딱 맞음)
// console.log(isAffordable(30, 50));     // → false  (부족)
// console.log(isAffordable(0, 100));     // → false  (돈 0)
// console.log(isAffordable(100, 0));     // → true   (공짜)

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
// console.log(calculateTotalPrice(7, 3));      // → 21
// console.log(calculateTotalPrice(10, 1));     // → 10  (1개)
// console.log(calculateTotalPrice(5, 0));      // → 0   (수량 0)
// console.log(calculateTotalPrice(0, 5));      // → 0   (공짜)
// console.log(calculateTotalPrice(100, 10));   // → 1000

/**
 * 지금 살 수 있는 최대 갯수.
 * 돈 한도와 인벤토리 빈 칸 한도 중 작은 쪽.
 */
function getMaxBuyCount(itemId) {
    // 1. 가격으로 살 수 있는 최대 = floor(소지금 / 단가)
    const item = DATA.ITEMS[itemId];
    const moneyMax = Math.floor(STATE.money / item.buyPrice);

    // 2. 같은 아이템 슬롯이 이미 있으면 칸 제약 없음 (스택), 없으면 빈 슬롯 하나 있어야 함
    const alreadyHas = STATE.inventory.hasItem(itemId, 1);
    const hasEmptySlot = STATE.inventory.slotsArray.some((s) => s === null);
    const invMax = alreadyHas ? Infinity : hasEmptySlot ? Infinity : 0;

    // 3. min(돈한도, 인벤한도) 반환. 0이면 0.
    return Math.min(moneyMax, invMax);
}

/**
 * 지금 팔 수 있는 최대 갯수 = 인벤에 있는 그 아이템 갯수.
 */
function getMaxSellCount(itemId) {
    return STATE.inventory.getItemCount(itemId);
}
// ═══════════════════════════════════════════════
// 2. 씬 진입/종료 + 단순 클릭 핸들러
// ═══════════════════════════════════════════════

/**
 * 상점 씬으로 들어간다.
 * 마을의 '상점' 특수 버튼이 눌렸을 때 map.js 에서 호출됨.
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

/**
 * 상점 씬을 종료하고 게임 씬으로 돌아간다.
 * 게임 씬 인벤바 + 소지금 표시도 새로 그려줘야 함 (상점에서 바뀐 게 있으니까).
 */
function onExitStoreClick() {
    // 1. 씬 전환
    switchScene("game");

    // 2. 현재 맵 다시 그리기 (혹시 모를 변경 대비)
    renderMap(STATE.currentMap);

    // 3. 인벤토리 다시 그리기 (상점에서 변경됐을 수 있음)
    renderInventory();

    // 4. 소지금 다시 그리기 (상점에서 변경됐을 수 있음)
    renderMoney();
}

// ─── onExitStoreClick 테스트 ─────────────────
// resetGameState();
// onEnterStoreClick();
// console.log(STATE.currentScene);    // → "store"
// onExitStoreClick();
// console.log(STATE.currentScene);    // → "game"

/**
 * 구매 아이템 버튼이 클릭됐을 때.
 * 1단계: 곧장 onBuyClick(itemId) 호출.
 * (2단계에선 팝업창을 띄우는 걸로 바뀜)
 * @param {string} itemId
 */
function onBuyItemClick(itemId) {
    // 1단계: 구매하기 함수 호출했었음
    // onBuyClick(itemId);

    // 2단계: 구매 팝업 띄우기
    // consumable 이면 buyConsumable 모드, 아니면 buy
    const item = DATA.ITEMS[itemId];
    const mode = item.consumedAt === "purchase" ? "buyConsumable" : "buy";
    showStorePopup(itemId, mode);
}

// ─── onBuyItemClick 테스트 (onBuyClick 과 결과 같아야 함) ──
// resetGameState();
// onBuyItemClick("garlic_seed");
// console.log(STATE.money);                                   // → 90
// console.log(STATE.inventory.getItemCount("garlic_seed"));   // → 3

/**
 * 판매 아이템 버튼이 클릭됐을 때.
 * 1단계: 곧장 onSellClick(itemId) 호출.
 * @param {string} itemId
 */
function onSellItemClick(itemId) {
    // 1단계: 판매하기 함수 호출했었음
    // onSellClick(itemId);

    // 2단계: 판매팝업 호출
    showStorePopup(itemId, "sell");
}

// ─── onSellItemClick 테스트 (onSellClick 과 결과 같아야 함) ──
// resetGameState();
// STATE.inventory.addItem("garlic", 3);
// onSellItemClick("garlic");
// console.log(STATE.money);                              // → 109 (100 + 3*3)
// console.log(STATE.inventory.getItemCount("garlic"));   // → 0

// ═══════════════════════════════════════════════
// 3. 액션 함수 — 실제 구매 / 판매
// ═══════════════════════════════════════════════

/**
 * 아이템을 1개 구매한다 (1단계).
 * 돈 부족하거나 인벤 꽉차면 메시지 표시 후 종료.
 * @param {string} itemId
 */
function onBuyClick(itemId, count) {
    let selectedItem = DATA.ITEMS[itemId];

    // 총 가격 계산하기
    let totalPrice = calculateTotalPrice(selectedItem.buyPrice, count);

    // 살 수 있는 돈이 있는지 체크 (가진 돈, 아이템 가격)
    if (isAffordable(STATE.money, selectedItem.buyPrice) === false) {
        // 돈 부족 → 메시지 표시하고 종료
        displayStoreMessage("돈이 부족합니다!");
        return;
    }

    // 아이템 타입별 처리
    if (selectedItem.consumedAt === "purchase") {
        // Consumable: 인벤토리 우회 → 효과 즉시 발동
        const success = applyEffect(selectedItem.effect);
        if (!success) {
            // 효과 적용 실패 시 환불 (방어 코드 — 정상 흐름에선 발생 안 함)
            STATE.money += selectedItem.buyPrice;
            return;
        }
        // 성공시 차감
        STATE.money = STATE.money - selectedItem.buyPrice;

        // 화면 갱신: 소지금 + 구매목록(돈 변동으로 affordability 변함) + 판매목록(살 수 있는 작물 산 경우 대비)
        renderMoney();
        renderBuyItemList();
        renderSellItemList();
        // 성공 메시지
        displayStoreMessage(`구매 완료: ${selectedItem.displayName}`);
    } else {
        // 일반 아이템: 인벤토리에 추가
        // 1) 인벤토리에 아이템 1개 추가
        let isAdded = STATE.inventory.addItem(itemId, count);

        // 2) 추가에 성공했을 때만 실제로 돈을 깎고 화면 갱신
        if (isAdded === true) {
            STATE.money = STATE.money - totalPrice;
            // 화면 갱신: 소지금 + 구매목록(돈 변동으로 affordability 변함) + 판매목록(살 수 있는 작물 산 경우 대비)
            renderMoney();
            renderBuyItemList();
            renderSellItemList();
            // 성공 메시지
            displayStoreMessage(`구매 완료: ${selectedItem.displayName}`);
            // 성공 시 팝업 닫기
            closeStorePopup();
        } else {
            // addItem 이 false 를 리턴했다면 인벤토리가 꽉 찬 것
            displayStoreMessage("인벤토리가 꽉 차서 살 수 없습니다!");
        }
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
// console.log(STATE.inventory.getItemCount("potato_seed"));   // → 4

/**
 * 인벤토리의 그 아이템을 전부 판매한다 (1단계).
 * 인벤에 없으면 아무 일도 안 함.
 * @param {string} itemId
 */
function onSellClick(itemId, sellCount) {
    let selectedItem = DATA.ITEMS[itemId];

    // 1) 인벤토리에 해당 아이템이 몇 개 있는지 체크하기
    // let sellCount = STATE.inventory.getItemCount(itemId);

    // 2) 인벤토리에 아이템이 0개 이하로 있으면 아무 일도 안 함
    if (sellCount <= 0) {
        return;
    }

    // 3) 인벤토리에서 그 아이템을 개수만큼 전부 제거하기
    let isRemoved = STATE.inventory.removeItem(itemId, sellCount);

    // 4) 인벤토리에서 제거 성공하면, 소지금에 더해주고 화면 갱신
    if (isRemoved === true) {
        // 총 판매 금액 = 단가 * 가지고 있던 수량 전부
        let totalEarned = calculateTotalPrice(
            selectedItem.sellPrice,
            sellCount,
        );

        // 돈을 더해서 다시 STATE.money 에 저장
        STATE.money = STATE.money + totalEarned;

        // 5) 화면 갱신: 소지금 + 구매목록(돈 늘었으니 affordability 갱신) + 판매목록(다 팔린 아이템 사라져야 함)
        renderMoney();
        renderBuyItemList();
        renderSellItemList();

        // 6) 성공 메시지
        displayStoreMessage(
            `판매 완료: ${selectedItem.displayName} ${sellCount}개 (+${totalEarned}푼)`,
        );
        // 성공 시 팝업 닫기
        closeStorePopup();
    }
}

// ─── onSellClick 테스트 ──────────────────────
// ① 정상 판매 (다 팔림)
// resetGameState();
// STATE.inventory.addItem("garlic", 3);
// onSellClick("garlic");
// console.log(STATE.money);                              // → 109 (100 + 3*3)
// console.log(STATE.inventory.getItemCount("garlic"));   // → 0
//
// ② 팔 게 없음 → 변동 없음
// resetGameState();
// onSellClick("garlic");
// console.log(STATE.money);                              // → 100 (변동 X)
//
// ③ 1개만 판매
// resetGameState();
// STATE.inventory.addItem("potato", 1);
// onSellClick("potato");
// console.log(STATE.money);                              // → 107
// console.log(STATE.inventory.getItemCount("potato"));   // → 0
//
// ④ 큰 수량 판매
// resetGameState();
// STATE.inventory.addItem("potato", 10);
// onSellClick("potato");
// console.log(STATE.money);                              // → 170 (100 + 7*10)
// console.log(STATE.inventory.getItemCount("potato"));   // → 0

// ═══════════════════════════════════════════════
// 4. 마스터 렌더러
// ═══════════════════════════════════════════════

function renderStore() {
    renderMoney();
    // renderStoreNpc();
    renderExitStoreButton();
    renderBuyItemList();
    renderSellItemList();
    // TODO 미래: NPC 영역 렌더 (renderStoreNpc) — Stage 2 에서 추가
}

// ═══════════════════════════════════════════════
// 5. 구매 영역 렌더
// ═══════════════════════════════════════════════

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
    const container = $("store-buy-section");

    // 2. 기존 버튼 다 지우기
    container.innerHTML = "";

    // 3. 일반 구매 아이템 - DATA.CONFIG.STORE_INVENTORY 의 정해진 목록을 순회
    const storeItems = DATA.CONFIG.STORE_INVENTORY;
    storeItems.forEach((itemId) => {
        container.appendChild(renderBuyItemButton(itemId));
    });

    // 4. 업그레이드 consumable - 업그레이더블별로 "다음 단계" 하나씩만 동적으로 추가
    //    STORE_INVENTORY 와 다르게 상태(STATE.upgrades) 에 따라 표시되는 게 달라지므로 별도 처리.
    //    이미 최대 레벨이면 findNextUpgradeConsumableId 가 null 반환 → 안 그림.
    // TODO 미래: 일반 아이템 / 특수 아이템 섹션 분리 (지금은 한 목록에 섞임)
    for (const upgradableId in STATE.upgrades) {
        const consumableId = findNextUpgradeConsumableId(upgradableId);
        if (consumableId) {
            container.appendChild(renderBuyItemButton(consumableId));
        }
    }
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
    // 1. 컨테이너 가져오기
    const container = $("store-sell-section");

    // 2. 기존 버튼 다 지우기
    container.innerHTML = "";

    // 3. STATE.inventory.slots 의 각 슬롯을 돌면서 판매아이템버튼 만들기
    STATE.inventory.slotsArray.forEach((slot) => {
        //   1) 슬롯이 null 이면 건너뛰기 (빈 칸)
        if (slot === null) return;

        //   2) 슬롯의 아이템이 sellPrice 없으면 건너뛰기 (씨앗은 못 팜)
        const item = DATA.ITEMS[slot.itemId];
        if (!item.sellPrice) return;

        //   3) 버튼을 만들어서 container 에 붙이기 (itemId 만 넘김)
        container.appendChild(renderSellItemButton(slot.itemId));
    });
}

// ═══════════════════════════════════════════════
// 7. 팝업
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 2. 팝업 모드 → 행동 매핑 (mode 분기는 여기 한 곳만)
// ═══════════════════════════════════════════════

/**
 * 현재 팝업의 max 갯수를 반환. mode 분기는 이 함수에서만 함.
 * renderStorePopup 도, onAddCountClick 도 이 함수 호출.
 */
function getStorePopupMax() {
    if (STATE.storePopup === null) return 0;

    const { mode, itemId } = STATE.storePopup;
    switch (mode) {
        case "buy":
            return getMaxBuyCount(itemId);
        case "sell":
            return getMaxSellCount(itemId);
        case "buyConsumable":
            return 1;
        default:
            return 0;
    }
}

/**
 * 팝업의 confirm 버튼이 눌렸을 때 실행할 액션.
 * mode 별로 onBuyClick/onSellClick 호출.
 */
function onStoreConfirmClick() {
    if (STATE.storePopup === null) return;
    const { mode, itemId, count } = STATE.storePopup;
    switch (mode) {
        case "buy":
        case "buyConsumable":
            onBuyClick(itemId, count);
            break;
        case "sell":
            onSellClick(itemId, count);
            break;
    }
}
/**
 * 팝업 열기. modeType = "buy" | "sell" | "buyConsumable"
 */
function showStorePopup(itemId, modeType) {
    STATE.storePopup = {
        mode: modeType,
        itemId: itemId,
        count: 1,
    };
    renderStorePopup();
}

/**
 * 팝업 닫기. 취소/구매성공/판매성공 모두 여기로.
 */
function closeStorePopup() {
    STATE.storePopup = null;
    $("store-popup").innerHTML = ""; // 또는 .classList.remove("active") — 렌더 방식에 맞춰
}

// ═══════════════════════════════════════════════
// 5. 팝업 렌더
// ═══════════════════════════════════════════════

function renderStorePopup() {
    const container = $("store-popup");
    container.innerHTML = ""; // 매번 새로 그림

    // 1. null 방어 (팝업 닫혀있으면 빈 채로 끝)
    if (STATE.storePopup === null) return;

    // 2. 상태 읽기
    const { mode, itemId, count } = STATE.storePopup;
    const item = DATA.ITEMS[itemId];
    const max = getStorePopupMax();

    // ─── 왼쪽 영역: 아이콘 + 이름 ───────────────
    const left = document.createElement("div");
    left.className = "store-popup-left";

    const icon = document.createElement("img");
    icon.className = "store-popup-icon";
    icon.src = item.icon;
    icon.alt = item.displayName;
    left.appendChild(icon);

    const name = document.createElement("div");
    name.className = "store-popup-name";
    name.textContent = item.displayName;
    left.appendChild(name);

    container.appendChild(left);

    // ─── 오른쪽 영역: 설명 + 카운터 + 버튼 ───────
    const right = document.createElement("div");
    right.className = "store-popup-right";

    // 3a. 설명
    const desc = document.createElement("div");
    desc.className = "store-popup-description";
    desc.textContent = item.description;
    right.appendChild(desc);

    // 3b. 카운터 (- count + ) — max > 1 일 때만 표시
    //     consumable 처럼 max === 1 이면 영역 자체를 안 그림
    if (max > 1) {
        const counter = document.createElement("div");
        counter.className = "store-popup-counter";

        const minusBtn = document.createElement("button");
        minusBtn.className = "store-popup-minus";
        minusBtn.textContent = "−";
        minusBtn.disabled = count <= 1; // 1 이면 더 못 내려감
        minusBtn.addEventListener("click", onSubtractCountClick);
        counter.appendChild(minusBtn);

        const countDisplay = document.createElement("span");
        countDisplay.className = "store-popup-count";
        countDisplay.textContent = count;
        counter.appendChild(countDisplay);

        const plusBtn = document.createElement("button");
        plusBtn.className = "store-popup-plus";
        plusBtn.textContent = "+";
        plusBtn.disabled = count >= max; // max 면 더 못 올라감
        plusBtn.addEventListener("click", onAddCountClick);
        counter.appendChild(plusBtn);

        right.appendChild(counter);
    }

    // 3c. 버튼 영역 (안 사겠소 | 사겠소)
    const buttons = document.createElement("div");
    buttons.className = "store-popup-buttons";

    // 취소 버튼 — 라벨은 mode 따라
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "store-popup-cancel";
    cancelBtn.textContent = mode === "sell" ? "안 팔겠소" : "안 사겠소";
    cancelBtn.addEventListener("click", onStoreCancelClick);
    buttons.appendChild(cancelBtn);

    // 확정 버튼 — 라벨은 mode 따라, max 가 0 이면 disabled
    // (살 돈 부족 / 인벤 꽉참 / 인벤 0개 같은 케이스 UX 차단.
    //  onBuyClick/onSellClick 안에서도 한번 더 방어함.)
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "store-popup-confirm";
    confirmBtn.textContent = mode === "sell" ? "팔겠소" : "사겠소";
    confirmBtn.disabled = max < 1;
    confirmBtn.addEventListener("click", onStoreConfirmClick);
    buttons.appendChild(confirmBtn);

    right.appendChild(buttons);

    container.appendChild(right);
}
// ═══════════════════════════════════════════════
// 6. 팝업 클릭 핸들러 (주디작업)
// ═══════════════════════════════════════════════

/**
 * '안사기' / '안팔기' 버튼 클릭 시.
 */
function onStoreCancelClick() {
    // 1. closeStorePopup() 호출하면 끝.
    //    STATE 정리 + DOM 정리 둘 다 closeStorePopup 안에서 처리됨.
    // 반환값 없음.
}

/**
 * 수량 +1 버튼 클릭 시.
 */
function onAddCountClick() {
    // 수량조절기에 + 버튼을 눌렀을때 사용되는 함수
    // 구매/판매하려는 수치(STATE.storePopup.count)에 +1을 하고, 그때마다 팝업을 다시 그린다(숫자가 바뀌니까)
    // 수치가 이미 최대값(getStorePopupMax()을 이용)이면 더이상 더하지 않는다
    //
    // 1. STATE.storePopup 가 null 이면 그냥 return (방어 — 팝업 안 열려있는데 호출된 케이스)
    //
    // 2. 할 수 있는 최대값 이상 넘어가면 안된다고하기 :
    //    let max = getStorePopupMax();
    //     getStorePopupMax 함 읽어보고 이용해보아용
    //
    // 3. 수치가 max 보다 작을 때만 +=1
    //    (이미 max 면 아무것도 안 함)
    //
    // 4. 숫자 하나 더해질때마다 renderStorePopup() 호출해서 팝업 다시 그리기
    //
    // 반환값 없음.
}

/**
 * 수량 -1 버튼 클릭 시.
 */
function onSubtractCountClick() {
    // 1. STATE.storePopup 가 null 이면 return (방어)
    //
    // 2. STATE.storePopup.count 가 1 보다 클 때만 -=1
    //    (최소 1 유지. 0 으로 내려가면 안 됨)
    //
    // 3. renderStorePopup() 호출해서 팝업 다시 그리기
    //
    // 반환값 없음.
}

// ═══════════════════════════════════════════════
// 7. NPC + 나가기 버튼 (1단계 stub — 2단계에서 채울 예정)
// ═══════════════════════════════════════════════

function renderStoreNpc() {
    // 2단계에서 NPC 캐릭터/말풍선 추가 예정
}

function renderExitStoreButton() {
    // 1단계엔 HTML 에 정적으로 있고 game.js 에서 핸들러 연결됨 — 비워둠
}
