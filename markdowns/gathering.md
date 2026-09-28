System: Gathering - Phase 1

1. Purpose (one sentence)
   Let the player pick and gather wild ground plants from the ground. (click -> picked -> add 1 to inventory)
2. User-facing interactions
   Triggers + what the player sees:

Player on mountain map → clicks a square that has wildPlant in it -> it is picked and added to inventory (only 1 at a time)
when a plant is picked, it is respawned in another random square after 30sec. 3. State this system reads / writes
Reads: STATE.inventory(cause need space in the inventory to add?), STATE.currentMap
Writes: STATE.mountain (new), STATE.inventory (on pick) 4. Lifecycle
Init: when game starts (or first time mountain map is entered)
Persists: ?
Reset: on resetGameState, not on map exit, because if plant picked -> respawn timer starts, and this should continue even when outside the map. 5. Scope (in / out for this phase)
IN: 6 random wildPlant type chosen to show up on random tile, pick one at a time(click on the tile), 30sec timer for respawn(to match the count 6 on the map, a random plant again, just has to be 6of them on mountainmap(includes both shown+respawing status) )
OUT: 6. First-draft state shape
My best guess at what to store. Mark uncertainty.

DATA.CONFIG.MOUNTAIN: {
GRID_SIZE: (6 \* 3) grid (2D array 6 x position and 3 y position)
TOTAL_NUM_OF_WILDPLANTS: 6 (how many should be there includes - first render, repawning + shown)
RESPAWN_SECONDS: 10,
PICK_MIN: 1,
PICK_MAX: 1,

        },

DATA.ITEMS.wildPlant = {id:string, displayName:string,description:string, sellPrice: number ..}

STATE.wildPlant = { Id: string, stage: "exists" | "respawing" | "picked", pickedAt: number (timestamp) | null, timerId: number | null // for clearTimeout on reset? } Uncertain: should there be a separate timer object?
STATE.mountainField = currentWildPlantArr: {x:number, y:number, plantId:string}[](that is shown to players to pick, wildplantid arrary), respawn?waiting?WildPlantArr: {x:number, y:number, plantId:string, respawntimer?}[] will be added to currentWildPlantArr after the timer is done, mountainFieldArray: WildPlant?[][](2Darray, and each tile: plantId? what else needed? ) }
ouccupiedPositionsArr: currentWildPlantArr + waitingWildPlantArr (x, y) positions array, so when getting random positions, will not use these 7. First-draft operations (signatures only)
getRandomWildPlant() → String
getRandomPosition() -> {x:numer, y:number}
get randomxy that is not xy in occupiedpositionarr
place?render?WildPlant() → boolean
this will show render the currentwildPlantArr on the screen
pickPlant() -> boolean
this will add plantId to inventory, remove xy of the plant from currArr, and add randomplant to waitingWildPlantArr with 10sec time on
onTimerEnd() → void (internal) 8. Open questions
the wildPlant that is pickable type is wild, and it has two stages, inground (shown imaged on the moutainField, and inventory image how to make items in this case? like crop, should it be inground and gathered? (two diff images and yeah..)
better to keep the respawing timer in plant obj or mountainfield obj?!
when to choose random tile, as soon as respawn starts, it chooses current empty position and save it for respawn? (then the tiles should know the data?) or better to after 30sec is over, find a empty spot at that time and render plant there?
should keep the information about how many needs respawn.. where? keep an array of lined up
shouldnt the STATE.mountain fields be one type? like timerId: number | null is this ok? shouldnt it be number only? when to allow null?
numOfWildPlants(bettername for number of plants there should be? like this can later be 8 or 10 based on the situation, and it will have 10 random plants…?)
