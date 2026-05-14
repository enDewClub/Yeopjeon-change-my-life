// ═══════════════════════════════════════════════════════
// data.js - 게임의 정적 데이터 (Static Data)
//
// 게임 시작부터 끝까지 변하지 않는 값들이 여기 들어간다.
//   예: 맵 정보, 아이템 정의, 시작 소지금, 인벤토리 크기...
//
// 반대로, 게임 중에 바뀌는 값(현재 소지금, 인벤토리 내용 등)은
// state.js 에 들어간다.
//
// 규칙: data 는 읽기만, state 는 읽기/쓰기. (이렇게 분리해야 관리 쉬움)
// ═══════════════════════════════════════════════════════

const DATA = {
    // ═══════════════════════════════════════════════
    // 1. CONFIG - 게임 설정값 (밸런스 / 난이도 조정)
    // 숫자를 바꾸고 싶으면 여기서만 수정한다.
    // ═══════════════════════════════════════════════
    CONFIG: {
        STARTING_MONEY: 100, // 시작 소지금 (푼)
        INVENTORY_SIZE: 20, // 인벤토리 총 칸 수 (CSS는 10x2 그리드)
        STARTING_MAP: "home", // 게임 시작 시 진입할 맵
    },

    // ═══════════════════════════════════════════════
    // 2. MAPS - 모든 맵의 정보
    // 새 맵 추가 = 여기에 객체 하나 추가하면 끝. (코드 수정 X)
    //
    // 각 맵 객체 구조:
    //   displayName    : 화면에 보일 한글 이름
    //   bgImage        : 배경 이미지 경로 (assets 폴더 기준)
    //   exits          : 출구 - { 방향: "목적지맵ID" }
    //                    방향: "left" | "right" | "top" | "bottom"
    //   specialAction  : 특수 버튼 (선택사항 - 궁궐의 입궁하기 등)
    // ═══════════════════════════════════════════════
    MAPS: {
        // 집터 - 게임 시작 위치
        home: {
            displayName: "집터",
            bgImage: "assets/bg/home.png",
            exits: {
                left: "village", // 왼쪽 → 마을
                right: "field", // 오른쪽 → 밭
            },
        },

        // 마을 중심 - 상점, 궁궐로 가는 통로
        village: {
            displayName: "마을 중심",
            bgImage: "assets/bg/village.png",
            exits: {
                right: "home", // 오른쪽 → 집터
                left: "palace", // 왼쪽 → 궁궐
            },
        },

        // 궁궐 - 입궁하면 엔딩
        palace: {
            displayName: "궁궐",
            bgImage: "assets/bg/palace.png",
            exits: {
                right: "village", // 오른쪽 → 마을
            },
            // 궁궐에만 있는 특수 버튼: 누르면 엔딩으로 간다
            specialAction: {
                label: "입궁하기",
                actionType: "goEnding",
            },
        },

        // 밭 - 농사 짓는 곳 (Step 1 에서 3x3 그리드 추가 예정)
        field: {
            displayName: "밭",
            bgImage: "assets/bg/field.png",
            exits: {
                top: "home", // 위쪽 → 집터 (밭에서 나가기)
            },
        },
    },

    // ═══════════════════════════════════════════════
    // 3. ITEMS - 모든 아이템 정의 (Step 1 부터 채워짐)
    //
    // 인벤토리는 아이템 자체를 저장하지 않고 ID 로만 참조한다.
    //   예: inventory[0] = { itemId: "potato_seed", count: 3 }
    //   → 실제 아이템 정보(이름, 아이콘 등)는 여기서 DATA.ITEMS.potato_seed 로 찾는다.
    //
    // 이렇게 하는 이유: 아이템 정보가 바뀌어도 인벤토리는 안 바꿔도 됨.
    //                  (한 곳에서만 관리 = Single Source of Truth)
    //
    // 각 아이템 객체 구조 (예시 - Step 1 에서 채워질 예정):
    //   displayName : "감자 씨앗"
    //   icon        : "assets/items/potato_seed.png"
    //   type        : "seed" | "crop" | "tool" 등
    //   buyPrice    : 상점에서 살 때 가격 (씨앗만)
    //   sellPrice   : 상점에서 팔 때 가격 (작물만)
    //   growsInto   : 자라면 어떤 아이템이 되는지 (씨앗만)
    // ═══════════════════════════════════════════════
    ITEMS: {
        // Step 1 부터 여기에 추가됨 - 감자 씨앗, 토마토 씨앗, 감자, 토마토...
        potato: {
            displayName: "감자 씨앗",
            icon: "assets/items/potato_seed.png",
            type: "seed",
            buyPrice: 1,
            sellPrice: 1,
            growsInto: "potato",
        },
    },
};
