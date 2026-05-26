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
function defineItems({
    seeds = {},
    crops = {},
    wildPlants = {},
    consumables = {},
    folder = "farm",
}) {
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
    // ─── 야생 식물(채집식물) 처리 ──────────────────────
    // 산에서 채집. icon (인벤토리용) + inGroundImage (땅 위 표시용) 두 이미지.
    // seed/crop 처럼 두 아이템으로 나누지 않는 이유: 정체성은 그대로고
    // 보여지는 모습만 다르기 때문 (한 아이템 + 두 이미지).
    for (const [id, def] of Object.entries(wildPlants)) {
        items[id] = {
            id,
            type: "wildPlant",
            icon: path(id),
            inGroundImage: path(`${id}_ready`),
            ...def,
        };
    }

    // ─── Consumable 처리 ──────────────────────────
    // farm 폴더와 별개로 special 폴더 사용 (씨앗/작물과 시각적으로 구분)
    for (const [id, def] of Object.entries(consumables)) {
        items[id] = {
            id,
            type: "consumable",
            icon: `img_assets/items/special/${id}.png`,
            ...def, // 사용자가 넘긴 필드가 자동값보다 우선
        };
    }

    return items;
}

// ═══════════════════════════════════════════════════════
// 업그레이더블 재산 정의 헬퍼 (Upgradable Property Factory)
//
// 집, 옷 같이 레벨업되는 재산을 정의.
// 이미지 경로는 폴더 규칙대로 자동 생성:
//   img_assets/upgradables/{id}/{level}.png
// 규칙에서 벗어나면 levels 안의 원소에 image 직접 넣으면 덮어쓰기 가능.
// ═══════════════════════════════════════════════════════
function defineUpgradableProperties(definitions) {
    const result = {};

    for (const [id, def] of Object.entries(definitions)) {
        // 각 레벨에 자동 이미지 경로 부여 (이미 있으면 유지)
        const levels = def.levels.map((lvl) => ({
            image: `img_assets/upgradables/${id}/${lvl.level}.png`,
            ...lvl,
        }));

        result[id] = {
            id,
            ...def,
            levels,
        };
    }

    return result;
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
        // 맵 영역 크기 (tokens.css 의 --canvas-width/height 와 동일 유지)
        MAP_WIDTH: 960,
        MAP_HEIGHT: 540,

        // 캐릭터 설정값
        CHARACTER: {
            WIDTH: 500 / 3, // 화면 표시 너비 (원본 500x600 비율 무시, 정사각 표시)
            HEIGHT: 600 / 3, // 화면 표시 높이
            SPEED: 400, // 이동 속도 (픽셀/초). 숫자 키우면 빨라짐.
            IMAGE: "img_assets/characters/player_character_shade.png",
        },

        // 근접 상호작용 거리 설정 (캐릭터 중심점 ↔ 버튼 중심점, Euclidean 거리, 픽셀)
        // 캐릭터가 이 반경 안에 있어야 버튼 클릭 가능. 멀면 흐리게 + 클릭 비활성.
        // 숫자만 바꾸면 즉시 반영됨.
        PROXIMITY: {
            EXIT_RADIUS: 120, // 출구 버튼 (.exit-btn)
            SPECIAL_RADIUS: 120, // 특수 액션 버튼 (입궁하기, 상점 들어가기)
            FIELD_RADIUS: 150, // 밭 관련 (셀, 물주기, 수확하기)
        },

        STORE_INVENTORY: [
            "potato_seed",
            "garlic_seed",
            "tomato_seed",
            "carrot_seed",
            "sweetPotato_seed",
            // "honey_tteock",
        ],

        // 산맵 채집 설정
        // 6 x 3 그리드, 항상 6개 식물 유지 (보이는 것 + 리스폰 대기중).
        // 리스폰: 채집되면 10초 뒤 빈 칸 중 하나에 랜덤 식물로 새로 나타남.
        MOUNTAIN: {
            GRID_WIDTH: 6, // 가로 칸 수 (x: 0..5)
            GRID_HEIGHT: 3, // 세로 칸 수 (y: 0..2)
            PLANTS_ON_MAP: 6, // 동시에 맵에 존재하는 총 식물 수
            RESPAWN_SECONDS: 10, // 채집 후 리스폰까지 시간 (초)
            PLANT_TYPES_ARRAY: [
                // 추첨 풀. 중복 허용 (3개가 같은 종류여도 OK).
                "ssuk",
                "pyogo",
                "doraji",
                "dalrae",
                "duduck",
                "dureup",
                "gosari"
            ],
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
            bgImage: "img_assets/bg/map_home.png",
            characterStart: { x: 440, y: 230 }, // 맵 가운데 (960/2-40, 540/2-40)
            exits: {
                left: "village", // 왼쪽 → 마을
                right: "field", // 오른쪽 → 밭
            },
        },

        // 마을 중심 - 상점, 궁궐로 가는 통로
        village: {
            displayName: "마을 중심",
            bgImage: "img_assets/bg/map_village.png",
            characterStart: { x: 440, y: 230 }, // 맵 가운데. 필요 시 여기 좌표만 수정.
            exits: {
                right: "home",
                left: "palace",
                top: "mountain_enterance",
            },
            specialAction: {
                label: "상점 들어가기",
                actionType: "goStore",
            },
        },

        // 궁궐 - 입궁하면 엔딩
        palace: {
            displayName: "궁궐",
            bgImage: "img_assets/bg/map_gyeongbokgung2.png",
            characterStart: { x: 440, y: 230 }, // 맵 가운데. 필요 시 여기 좌표만 수정.
            exits: {
                right: "village", // 오른쪽 → 마을
            },
            // 궁궐에만 있는 특수 버튼: 누르면 엔딩으로 간다
            specialAction: {
                label: "입궁하기",
                actionType: "goEnding",
                // 입궁 조건. 여러 조건은 모두 만족해야 함 (AND).
                // 새 조건 추가 = 객체 하나 더 푸시 — 다른 코드 수정 없음.
                // TODO Stage 2: 옷 조건 추가 시 { upgradableId: "clothes", minLevel: 3 } 한 줄 추가
                requires: [{ upgradableId: "house", minLevel: 2 }],
                lockedLabel: "입궁 자격 부족",
            },
        },

        // 밭 - 농사 짓는 곳
        field: {
            displayName: "밭",
            bgImage: "img_assets/bg/map_field_topdown.png",
            characterStart: { x: 440, y: 60 }, // 상단 출구 근처 (집터에서 진입한 느낌).
            exits: {
                top: "home", // 위쪽 → 집터 (밭에서 나가기)
            },
        },

        // 산 - 야생 식물 채집하는 곳
        mountain: {
            displayName: "산",
            bgImage: "img_assets/bg/map_mountain(sample).png",
            exits: {
                left: "mountain_enterance", // 왼쪽 → 산입구로 돌아가기
            },
            // 캐릭터는 왼쪽 끝에서 시작 (출구 근처)
            characterStart: { x: 0, y: 240 },
        },
        mountain_enterance: {
            displayName: "산입구",
            bgImage: "img_assets/bg/map_gathering(sample).png",
            exits: {
                right: "mountain", // 오른쪽 → 산(채집)으로 돌아가기
                bottom: "village",
            },
            // specialAction: {
            //     label: "호랑이상점 들어가기",
            //     actionType: "goTigerShop",
            // },
            // 맵 가운데
            characterStart: { x: 440, y: 230 },
        },
    },

    // ═══════════════════════════════════════════════
    // 3. UPGRADABLE_PROPERTIES - 캐릭터의 업그레이드 가능한 재산
    //
    // 인벤토리 아이템(ITEMS)과 별개. 수량 개념 없고, 항상 하나만 존재하며 레벨이 있음.
    //   예: 집(초가집 → 기와집 → 양옥), 옷(누더기 → 무명옷 → 비단옷)
    //
    // 새 재산 추가 = 여기에 객체 하나 추가하면 끝.
    // 레벨업 효과는 ITEMS 의 consumable 이 effect.targetId 로 가리킴.
    //
    // renderLocation 종류:
    //   { mapId: "home" }       → 해당 맵에 배치 (집, 우물 등)
    //   { on: "character" }     → 캐릭터에 입힘 (옷, 모자 등)
    // ═══════════════════════════════════════════════
    UPGRADABLE_PROPERTIES: defineUpgradableProperties({
        house: {
            displayName: "집",
            // home 맵 위에 별도 이미지 레이어로 띄움 (배경 분리됨, 투명 PNG 사용)
            renderLocation: {
                mapId: "home",
                x: 380,
                y: 15,
                width: 280,
                height: 280,
            },
            startLevel: 1,
            levels: [
                { level: 1, displayName: "초가집" },
                { level: 2, displayName: "초가기와집" },
                { level: 3, displayName: "기와집" },
            ],
        },
        clothes: {
            displayName: "옷",
            // TODO Stage 2: 레이어드 스프라이트 (베이스 + 옷 오버레이) 로 전환
            // 지금은 캐릭터 이미지 자체를 통째로 교체
            renderLocation: { on: "character" },
            startLevel: 1,
            levels: [
                { level: 1, displayName: "누더기" },
                { level: 2, displayName: "무명옷" },
                { level: 3, displayName: "비단옷" },
            ],
        },
    }),

    // ═══════════════════════════════════════════════
    // 3. ITEMS - 모든 아이템 정의
    //
    // 인벤토리는 아이템 ID 만 저장하고, 실제 정보는 여기서 조회.
    //   STATE.inventory.slotsArray[0] = { itemId: "potato_seed", count: 3 }
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
    ITEMS: {
        ...defineItems({
            seeds: {
                potato_seed: {
                    displayName: "감자 씨앗",
                    description: "감자 씨앗이 담긴 주머니입니다.",
                    buyPrice: 20,
                    growsInto: "potato",
                    growTime: 60,
                },
                garlic_seed: {
                    displayName: "마늘 씨앗",
                    description: "마늘 씨앗이 담긴 주머니입니다.",
                    buyPrice: 10,
                    growsInto: "garlic",
                    growTime: 30,
                },
                tomato_seed: {
                    displayName: "토마토 씨앗",
                    description: "토마토 씨앗이 담긴 주머니입니다.",
                    buyPrice: 15,
                    growsInto: "tomato",
                    growTime: 45,
                },
                carrot_seed: {
                    displayName: "당근 씨앗",
                    description: "당근 씨앗이 담긴 주머니입니다.",
                    buyPrice: 15,
                    growsInto: "carrot",
                    growTime: 45,
                },
                sweetPotato_seed: {
                    displayName: "고구마 씨앗",
                    description: "고구마 씨앗이 담긴 주머니입니다.",
                    buyPrice: 20,
                    growsInto: "sweetPotato",
                    growTime: 45,
                },
            },
            crops: {
                potato: {
                    displayName: "감자",
                    description:
                        "다양한 요리와 민간요법에 쓰이는 구황작물입니다. \n식이섬유가 풍부해 포만감이 오래 유지되는 것이 특징입니다. \n감자밭에서 바늘찾지 말고 튼실한 감자 찾으세요.",
                    sellPrice: 7,
                },
                garlic: {
                    displayName: "마늘",
                    description:
                        "곰이 즐겨먹던 바로 그 마늘입니다. \n특유의 냄새와 매운맛이 특징입니다. \n문둥이 콧구멍에 박힌 마늘씨를 파먹지 않게 주의하세요.",
                    sellPrice: 3,
                },
                tomato: {
                    displayName: "토마토",
                    description:
                        "다양한 영양소를 품고 있는 동그란 열매입니다. \n토마토를 식용하는 것이 도입된 것은 오래 지나지 않았습니다. \n사과가 되지 말고 토마토가 되세요.",
                    sellPrice: 5,
                },
                carrot: {
                    displayName: "당근",
                    description:
                        "껍질 채 먹는 것이 좋은 뿌리채소입니다. \n당나라에서 온 뿌리채소라는 뜻으로 당근이라는 이름이 붙었으나 근거는 희박합니다. \n엽전인생이 지루하다면 당근을 한 번 흔들어보세요.",
                    sellPrice: 5,
                },
                sweetPotato: {
                    displayName: "고구마",
                    description:
                        "탄수화물 함량이 많아 주식을 대체할 수 있는 뿌리채소입니다. \n잎자루는 나물로 식용하고, 뿌리는 그대로 쪄서 먹거나 전, 튀김, 엿 등으로 요리합니다. \n이 세상에 고구마 꽃이 피지 않길 바라봅니다.",
                    sellPrice: 7,
                },
            },
            consumables: {
                magic_book_2: {
                    displayName: "신비로운 책",
                    description:
                        "알 수 없는 신비로운 힘에 휩싸여 있는 책입니다. \n이 책을 구매하면 집이 보다 살기 좋아질 것 같습니다.",
                    buyPrice: 200,
                    consumedAt: "purchase",
                    effect: { kind: "upgrade", targetId: "house", toLevel: 2 },
                },
                // magic_book_3: {
                //     displayName: "비법서",
                //     description: "집을 양옥으로 만들어준다",
                //     buyPrice: 500,
                //     consume네dAt: "purchase",
                //     effect: { kind: "upgrade", targetId: "house", toLevel: 3 },
                // },
                magic_silk_2: {
                    displayName: "신비로운 비단",
                    description:
                        "알 수 없는 신비로운 힘에 휩싸여 있는 비단입니다. \n이 비단을 구매하면 옷이 보다 기품있어질 것 같습니다.",
                    buyPrice: 150,
                    consumedAt: "purchase",
                    effect: {
                        kind: "upgrade",
                        targetId: "clothes",
                        toLevel: 2,
                    },
                },
                // magic_silk_3: {
                //     displayName: "신비한 비단",
                //     description: "비단옷으로 갈아입혀준다",
                //     buyPrice: 400,
                //     consumedAt: "purchase",
                //     effect: { kind: "upgrade", targetId: "clothes", toLevel: 3 },
                // },
            },
        }),
        // 산 채집 아이템: img_assets/items/mountain/
        // 주디TODO: 식물리스트 업데이트
        ...defineItems({
            wildPlants: {
                ssuk: {
                    displayName: "쑥",
                    description: "건국신화에 나오는 바로 그 쑥입니다. 먹으면 '쑥쑥' 자라는 쑥… \n쑥은 성질이 따듯해 냉증 치료에 효과적이라고 합니다. \n쑥대도 삼밭에 나면 곧아진다고 하니 매일 엽전인생 플레이 하는 것을 잊지마세요.",
                    sellPrice: 1,
                },
                gosari: {
                     displayName: "고사리",
                     description: "다양한 민요에 등장하는 고사리는 삶아서 말려 먹으면 약이 되고, 생으로 먹으면 독이 됩니다. \n보통 새순이 올라와 어린 잎이 자라기 전에 수확해서 먹습니다. \n시기를 놓치지 않기 위해서 2~3일에 한 번씩 수확을 해야 하니 \n고사리도 꺾을 때 꺾는다는 속담이 생긴 듯 합니다. ",
                     sellPrice: 1,
                },
                pyogo: {
                    displayName: "표고버섯",
                    description: "생명의 비약이라고도 불리는 표고버섯입니다. \n향과 맛, 효능까지 일품이어서 올바르게 섭취하면 건강에 많은 도움을 줍니다. 특유의 감칠맛과 풍부한 영양소로 인해 산에서 나는 고기라고도 불립니다.",
                    sellPrice: 2,
                },
                doraji: {
                    displayName: "도라지",
                    description: "산삼처럼 생겼으나 산삼이 아닌 도라지입니다. \n맛이 맵고 온화하며 독이 있다는 문헌 기록이 있습니다. \n약재로도 쓰이며 오래 묵은 도라지는 산삼보다 좋다는 말이 있을 정도로 몸에 좋은 식물이라고 하네요.",
                    sellPrice: 2,
                },
                duduck: {
                     displayName: "더덕",
                     description: "특유의 향과 쌉싸름하면서 단맛이 나는 덩굴식물입니다. \n뿌리가 도라지나 인삼과 비슷한 게 특징이며, 어릴땐 먹기 싫었지만 갈수록 그 맛에 중독되었어요. 맵게 양념한게 맛있더라고요. \n아삭하고.. 엽전 크기 이상으로 통통하고 곧게 뻗은 것을 고르세요 ",
                     sellPrice: 2,
                },
                dureup: {
                     displayName: "두릅",
                     description: "두릅은 두릅나무의 어린 순을 가리키는 말입니다. \n봄 두릅은 금이요 가을 두릅은 은이다 라는 말이 있을 정도로 \n봄철에 나는 두릅의 영양소와 향이 뛰어납니다. \n세릅 네릅 아닌 두릅입니다…",
                     sellPrice: 2,
                },
                dalrae: {
                     displayName: "달래",
                     description: "냉이와 함께 봄에 나는 나물로, 맛이 매콤하고 향긋합니다. \n달래는 달랑달랑 매달린 동그란 모양의 알뿌리에서 유래된 말이며, \n특유의 매운맛과 따듯한 성질 때문에 작은 마늘이라고도 불립니다.",
                     sellPrice: 1,
                },
            },
            folder: "gathering",
        }),
    },
};

// DATA.ITEMS = {
//     potato_seed: { id, type: "seed", icon, growthStages, displayName, ... },
//     garlic_seed: { ... },
//     tomato_seed: { ... },
//     potato:      { id, type: "crop", icon, displayName, ... },
//     garlic:      { ... },
//     tomato:      { ... },
// }
