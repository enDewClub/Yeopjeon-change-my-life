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

// ═══════════════════════════════════════════════════════
// 아이템 정의 헬퍼 (Item Definition Helper - Factory Function)
//
// 30+ 개 아이템을 하나하나 풀어쓰면 코드가 너무 길어진다.
// 반복되는 부분(id, icon, type, growthStages)은 ID 와 카테고리만 알면
// 자동으로 만들 수 있다 → 사용자는 변하는 정보(가격, 이름 등)만 적으면 됨.
//
// 이 패턴을 "convention over configuration" 라고 함:
//   파일명을 규칙대로 만들면 (예: garlic_bud.png) 자동 처리,
//   규칙에서 벗어나면 그 필드만 명시적으로 덮어쓰기.
//
// 사용 예:
//   defineItems({
//     seeds: { potato_seed: { displayName: "감자 씨앗", buyPrice: 20, growsInto: "potato", growTime: 60, description: "..." } },
//     crops: { potato:      { displayName: "감자",     sellPrice: 7, description: "..." } },
//   })
//
// 파일 경로 규칙 (현재 farm 카테고리 기준):
//   icon              → img_assets/items/farm/{id}.png
//   growthStages.bud  → img_assets/items/farm/{growsInto}_bud.png
//   growthStages.growing/ready 도 동일 패턴
//
// 규칙에서 벗어나는 아이템은 def 에 직접 필드 넣으면 자동값을 덮어씀.
//   예: { ..., icon: "img_assets/items/special/magic_book.png" }
// ═══════════════════════════════════════════════════════
function defineItems({ seeds = {}, crops = {}, folder = "farm" }) {
    const items = {};

    // 경로 생성 단축 함수
    const path = (name) => `img_assets/items/${folder}/${name}.png`;

    // ─── 씨앗 처리 ──────────────────────────
    for (const [id, def] of Object.entries(seeds)) {
        items[id] = {
            id,
            type: "seed",
            icon: path(id),
            growthStages: {
                bud: path(`${def.growsInto}_bud`),
                growing: path(`${def.growsInto}_growing`),
                ready: path(`${def.growsInto}_ready`),
            },
            ...def, // 사용자가 넘긴 필드가 위 자동값보다 우선 (덮어쓰기 가능)
        };
    }

    // ─── 작물 처리 ──────────────────────────
    for (const [id, def] of Object.entries(crops)) {
        items[id] = {
            id,
            type: "crop",
            icon: path(id),
            ...def,
        };
    }

    return items;
}

const DATA = {
    // ═══════════════════════════════════════════════
    // 1. CONFIG - 게임 설정값 (밸런스 / 난이도 조정)
    // 숫자를 바꾸고 싶으면 여기서만 수정한다.
    // ═══════════════════════════════════════════════
    CONFIG: {
        STARTING_MONEY: 100, // 시작 소지금 (푼)
        INVENTORY_SIZE: 20, // 인벤토리 총 칸 수 (CSS는 10x2 그리드)
        STARTING_MAP: "home", // 게임 시작 시 진입할 맵
        // 시작 시 인벤토리에 넣어줄 아이템들 (테스트 + Step 1 시작 자원)
        STARTING_INVENTORY: [
            { itemId: "potato_seed", count: 3 },
            { itemId: "garlic_seed", count: 2 },
            { itemId: "tomato_seed", count: 1 },
        ],
        // 밭 설정값
        FIELD: {
            GRID_SIZE: 9, // 시각 표현용 (3x3)
            GROW_TIME_SECONDS: 5, // 자라는 데 걸리는 시간
            HARVEST_MIN: 1, // 수확량 최소
            HARVEST_MAX: 9, // 수확량 최대
        },
    },

    // ═══════════════════════════════════════════════
    // 2. MAPS - 모든 맵의 정보
    // 새 맵 추가 = 여기에 객체 하나 추가하면 끝. (코드 수정 X)
    //
    // 각 맵 객체 구조:
    //   displayName    : 화면에 보일 한글 이름
    //   bgImage        : 배경 이미지 경로 (img_assets 폴더 기준)
    //   exits          : 출구 - { 방향: "목적지맵ID" }
    //                    방향: "left" | "right" | "top" | "bottom"
    //   specialAction  : 특수 버튼 (선택사항 - 궁궐의 입궁하기 등)
    // ═══════════════════════════════════════════════
    MAPS: {
        // 집터 - 게임 시작 위치
        home: {
            displayName: "집터",
            bgImage: "img_assets/bg/home.png",
            exits: {
                left: "village", // 왼쪽 → 마을
                right: "field", // 오른쪽 → 밭
            },
        },

        // 마을 중심 - 상점, 궁궐로 가는 통로
        village: {
            displayName: "마을 중심",
            bgImage: "img_assets/bg/village.png",
            exits: {
                right: "home",
                left: "palace",
            },
            specialAction: {
                label: "상점 들어가기",
                actionType: "goStore",
            },
        },

        // 궁궐 - 입궁하면 엔딩
        palace: {
            displayName: "궁궐",
            bgImage: "img_assets/bg/palace.png",
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
            bgImage: "img_assets/bg/field.png",
            exits: {
                top: "home", // 위쪽 → 집터 (밭에서 나가기)
            },
        },
    },
    // ═══════════════════════════════════════════════
    // 3. ITEMS - 모든 아이템 정의
    //
    // 인벤토리는 아이템 ID 만 저장하고, 실제 정보는 여기서 조회.
    //   STATE.inventory.slots[0] = { itemId: "potato_seed", count: 3 }
    //   → 표시할 때 DATA.ITEMS["potato_seed"].displayName 로 조회
    //
    // 정의 방식: defineItems() 헬퍼로 자동 생성.
    //   - 카테고리별로 정리 (seeds, crops, ...)
    //   - 각 아이템은 변하는 정보(이름/가격/설명)만 적음
    //   - id, icon, type, growthStages 는 헬퍼가 ID 와 규칙으로 자동 생성
    //
    // 새 아이템 추가 = 해당 카테고리에 한 줄 추가하면 끝.
    // 이미지 파일은 규칙대로 img_assets/items/farm/{id}.png 위치에 두기.
    //
    // 필드 설명:
    //   displayName  : 화면 표시 이름 (한글)
    //   description  : 툴팁/상점 설명
    //   buyPrice     : 상점 구매가 (있으면 살 수 있음, 없으면 못 삼)
    //   sellPrice    : 상점 판매가 (있으면 팔 수 있음, 없으면 못 팜)
    //   growsInto    : 씨앗 → 자란 작물 ID (씨앗만)
    //   growTime     : 다 자라는 시간(초) (씨앗만)
    // ═══════════════════════════════════════════════
    ITEMS: defineItems({
        seeds: {
            potato_seed: {
                displayName: "감자 씨앗",
                description: "심으면 감자가 자라는 씨앗",
                buyPrice: 20,
                growsInto: "potato",
                growTime: 60,
            },
            garlic_seed: {
                displayName: "마늘 씨앗",
                description: "심으면 마늘이 자라는 씨앗",
                buyPrice: 10,
                growsInto: "garlic",
                growTime: 30,
            },
            tomato_seed: {
                displayName: "토마토 씨앗",
                description: "심으면 토마토가 자라는 씨앗",
                buyPrice: 15,
                growsInto: "tomato",
                growTime: 45,
            },
        },
        crops: {
            potato: {
                displayName: "감자",
                description: "수확한 감자",
                sellPrice: 7,
            },
            garlic: {
                displayName: "마늘",
                description: "수확한 마늘",
                sellPrice: 3,
            },
            tomato: {
                displayName: "토마토",
                description: "수확한 토마토",
                sellPrice: 5,
            },
        },
    }),
};

// DATA.ITEMS = {
//     potato_seed: { id, type: "seed", icon, growthStages, displayName, ... },
//     garlic_seed: { ... },
//     tomato_seed: { ... },
//     potato:      { id, type: "crop", icon, displayName, ... },
//     garlic:      { ... },
//     tomato:      { ... },
// }