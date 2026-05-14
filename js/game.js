// ═══════════════════════════════════════════════════════
// game.js - 메인 게임 흐름 + 이벤트 연결
//
// 역할:
//   1. 페이지 로드 시 초기화
//   2. 씬 간 전환 핸들러 (시작하기, 다시하기)
//   3. 모든 이벤트 리스너 연결
//
// "이 게임 어디서 시작해?" → 맨 아래 DOMContentLoaded 리스너 부터.
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════
// 씬 흐름 함수
// ═══════════════════════════════════════════════

/**
 * 타이틀 화면으로 이동한다.
 * 페이지 처음 로드 + 다시하기 두 경우 모두 사용.
 * STATE 는 건드리지 않음 - 시작하기 누를 때 리셋됨.
 */
function startNewGame() {
    switchScene("title");
}

/**
 * 타이틀의 "시작하기" 버튼 클릭 시 호출.
 * STATE 리셋 → 게임 씬으로 전환 → 맵/인벤토리/소지금 그리기.
 */
function onTitleStart() {
    resetGameState();
    switchScene("game");
    renderMap(STATE.currentMap); // STATE.currentMap 는 resetGameState 에서 "home" 으로 설정됨
    renderInventory();
    renderMoney();
}

// ═══════════════════════════════════════════════
// 이벤트 연결 (페이지 로드 시 실행)
// ═══════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    // 타이틀의 "시작하기" 버튼
    $("btn-game-start").addEventListener("click", onTitleStart);

    // 엔딩의 "다시하기" 버튼
    $("btn-restart").addEventListener("click", startNewGame);

    // 게임 시작!
    startNewGame();
});
