# Game System Design Workflow — Reference Document

A consolidated reference for designing game systems before writing code. Built around two skills you're developing: **invariant thinking** (state always-true rules) and **failure-mode thinking** (what can go wrong, enumerated). The methodology is condensed from senior dev practices in formal methods, design by contract, BDD, and FMEA.

---

## How to use this document

- **Reference, not read-through.** Skim what you need; ignore the rest.
- **Active use → Section 5** (the recipe). Bookmark it.
- **Prompts → Section 6.** Copy-paste ready.
- **Concept refresher → Sections 1–3.** Revisit when you forget _why_ a step matters.
- **Stuck on what a step actually looks like → Section 7** (worked examples).
- **Templates → Section 10.** Paste into your own files.

Sections are independent. You don't have to read in order.

---

## Section 1 — Core concepts

### 1.1 The two skills you're building

Senior dev habits that this workflow trains:

1. **Invariant thinking.** For every piece of state, you can articulate the rules it must always satisfy. "Inventory has no two slots with the same itemId." "STATE.money is never negative." Once written, every operation is checkable against them.

2. **Failure-mode thinking.** Before writing an operation, you enumerate what could go wrong: bad input, missing resource, double-call, half-completed mutation. Failure is designed, not discovered.

The bugs that ship in your code (money disappears, render doesn't update) are almost always one of these two skills being skipped. The methodology in this doc is the explicit training-wheels version of habits senior devs run unconsciously.

### 1.2 Design vs implementation — keep them separate

Design = invariants, operations, sequences. Implementation = code.

Mixing them in one chat lets clever code paper over design gaps. The gap stays, the code obscures it. Doing design fully _before_ code makes gaps visible.

This is why the workflow has design prompts and implementation prompts in **separate** chats.

### 1.3 The five recurring shapes

Game systems don't have a universal "must-have fields" list. They have recurring shapes you learn to recognize. Once you can name the shape, the fields and failure modes mostly fall out.

**Definition vs Instance.**
Static description vs runtime occurrence. `DATA.ITEMS["potato_seed"]` is a definition (name, icon, price). A slot in inventory is an instance (`{itemId: "potato_seed", count: 3}`). Same pattern for upgradables: `DATA.UPGRADABLES.house` (definition with levels) vs `STATE.upgrades.house = 2` (instance state).

**Container with capacity.**
Inventory, store stock, field plots — all have: `capacity`, `contents`, `add` (with overflow), `remove` (with underflow), `query`. Every container method must answer: what does it return on failure, and is that return forced to be checked?

**State machine.**
Anything with phases is a state machine. Plot: empty → planted → growing → ready. Scene: title → game → store → ending. Required fields: current state, valid transitions, transition triggers. Implicit state machines are where bugs hide.

**Transaction.**
Multi-step mutations. Buy = "money decreases AND inventory increases, or neither." Plant = "seed decreases AND plot updates, or neither." Every operation touching two or more state pieces is a transaction and needs atomicity thinking.

**Effect / event.**
"Buy magic_book → upgrade house" is a generic `applyEffect(effect)` pipeline. Separates trigger (purchase) from effect (upgrade) from target (house) so each varies independently.

If you can name which shapes a feature uses before designing, the "what fields do I need" question mostly answers itself.

---

## Section 2 — The three core lists

### 2.1 The 7-step invariant list (per state variable)

For each piece of state, walk these in order. Stop only when each has an answer.

1. **Type** — what JS type? (`number`, `string`, `object | null`, `Array<{itemId, count}>`)
2. **Domain** — what values within that type are legal? (`integer ≥ 0`; string from enum; array of fixed length)
3. **Nullability** — can it be null/undefined? When?
4. **Relationships to other state** — must it be consistent with something else?
5. **Lifecycle** — initial value, runtime mutations, terminal value
6. **Authorized mutators** — which functions are allowed to change it?
7. **Atomicity** — does it change alone, or always with something else?
   **Reference tables — concrete options for each step.** Use these to recognize which option applies; don't invent new categories.

**Steps 1 + 2 — Type and Domain.** Pick the type, then narrow with a domain.

| Type        | Domain forms                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `number`    | range: `≥ 0`, `> 0`, `[0, max]`, `≤ buyPrice`; integer-only; multiple of N                      |
| `string`    | enum: `"empty" \| "planted" \| "growing"`; foreign key: must be in `keys(DATA.ITEMS)`; freeform |
| `boolean`   | true / false only (no further domain)                                                           |
| `object`    | required keys; type per field; range per field                                                  |
| `Array<T>`  | fixed length (`=== size`); max length; element type; no duplicates by subkey                    |
| `Map<K,V>`  | key type; value type; sparse vs dense                                                           |
| `T \| null` | when null is allowed (see step 3)                                                               |

**When the type is `object` or `Array<object>` — extra decisions before fields and types are settled.** Walk A–F in order. Each step strips one class of bug from the shape.

| Step  | Decision                            | Question                                                                                                                                                                                     | Example (from `STATE.mountain.plants[]`, see 7.4)                                   |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **A** | One vs many                         | Does the feature have one instance or N?                                                                                                                                                     | `plants: Plant[]` of length 6 — array, not a singular object                        |
| **B** | Field ownership                     | For each candidate field: does this data follow one instance through its whole lifecycle? If yes, field lives on the instance.                                                               | `timerId` lives on each `Plant`, not on the mountain wrapper                        |
| **C** | Discriminator                       | Does the instance have phases where different fields are meaningful? Name the discriminator as a string enum. Stages must be states the instance _lives in_, not events that happened to it. | `stage: "present" \| "respawning"` — two durable phases only                        |
| **D** | Nullability paired to discriminator | For each nullable field, name the discriminator state(s) in which it must be null. Write as an invariant, not as "independently nullable."                                                   | `stage === "present"` ⟹ `timerId === null && respawnEndsAt === null`                |
| **E** | Derived data                        | Can this field be computed from other fields? If yes, don't store it.                                                                                                                        | `occupiedPositions` computed as `plants.map(p => ({x: p.x, y: p.y}))`, never stored |
| **F** | Multiple representations            | Are two fields holding the same data in different shapes? Pick one canonical shape.                                                                                                          | Flat `plants[]` is canonical; 2D lookup built on demand in the renderer             |

**Anti-pattern reference — what each step rules out:**

| Step  | Wrong answer looks like                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `STATE.wildPlant = {...}` when there are 6 plants on the map                                                                           |
| **B** | Putting `respawnTimer` on the mountain wrapper when each plant has its own timer                                                       |
| **C** | `stage: "exists" \| "respawning" \| "picked"` — `"picked"` is a transient event, not a durable phase; storing it creates ghost entries |
| **D** | Four independently-nullable fields (`stage`, `pickedAt`, `timerId`, `respawnEndsAt`) = 2⁴ = 16 combinations, most nonsense             |
| **E** | `occupiedPositionsArr` stored alongside `plants[]` — derived state stored = guaranteed desync                                          |
| **F** | 2D grid `mountainFieldArray[y][x]` _and_ flat `currentWildPlantArr` holding the same data — two places to keep in sync, one will drift |

After A–F, the field list and types fall out:

- Discriminator → string enum (Step 1+2 table, `string` row)
- Lifecycle-spanning data → required field, type from Step 1+2 table
- Phase-specific data → field plus a discriminator-paired invariant (Step D), recorded in step 4 (Relationships)
- Derived data → not a field; helper function instead

**Step 3 — Nullability.** Pick one pattern.

| Pattern            | Meaning                                      |
| ------------------ | -------------------------------------------- |
| Never null         | always has a value after construction        |
| Null until set     | initial null, written once, never null after |
| Conditionally null | null only in named cases ("no selection")    |
| Always optional    | caller must handle null on every read        |

**Step 4 — Relationships.** Pick all that apply.

| Type              | Example                                               |
| ----------------- | ----------------------------------------------------- |
| Foreign key       | `slot.itemId` must be a key in `DATA.ITEMS`           |
| Index constraint  | `selectedSlotIndex` valid in `[0, slots.length)`      |
| Mutual exclusion  | only one of A or B set at a time                      |
| Sum / count bound | total across slots ≤ inventory size                   |
| Derived           | computable from other state — do not store, recompute |

**Step 5 — Lifecycle.** Answer all three.

| Phase    | Question                                                   |
| -------- | ---------------------------------------------------------- |
| Initial  | what value at construction / `resetGameState`?             |
| Runtime  | which functions mutate it and when?                        |
| Terminal | reset on restart, destroyed mid-session, or lives forever? |

**Step 6 — Mutators.** Pick the scope.

| Scope                            | Use when                                 |
| -------------------------------- | ---------------------------------------- |
| Sole owner (one method)          | invariants depend on coordinated changes |
| Restricted set (named functions) | several known entry points               |
| Open (any code may write)        | rare; trivial flags only                 |

**Step 7 — Atomicity.** Pick the pattern.

| Pattern                    | Example                                |
| -------------------------- | -------------------------------------- |
| Independent                | `STATE.currentScene`                   |
| Paired with one other      | money + inventory on buy               |
| Part of larger transaction | money + inventory + store stock on buy |

Output: a doc block at the top of the owning file. Five lines per state variable. Pasted in code as comments (Korean for the team).

### 2.2 The 9-step operation failure-mode list (per operation)

For each operation (function, button click, transition), walk these in order. Most are quick yes/no. The cumulative list is the failure surface.

1. **Preconditions** — what must be true to attempt this?
2. **Resources consumed** — for each, boundary values (broke, exact, just-short)
3. **Resources produced** — overflow, duplicate, no-room
4. **Input domain** — null, undefined, wrong type, out of range, malformed
5. **State context** — what scene/mode? called from wrong one?
6. **Concurrency / timing** — double-click, mid-flight, user leaves screen
7. **Boundary values** — 0, 1, max, max±1, negative, threshold
8. **Reversibility** — if a sub-step fails, can you roll back?
9. **Side effects** — render, sound, save — what do they touch, what if they fail?

Output: a failure-mode table per operation. Five columns: Trigger | Precondition | If violated | Detection | Response | User feedback.

### 2.3 The Given / When / Then sequence template

For each operation (especially transactions), write the sequence before the code.

```
Operation: [name]
Given (preconditions):
  - state condition 1
  - state condition 2
When (trigger):
  - user action

Sequence (numbered steps):
  1. check X; if fail → abort with [reason]
  2. mutate Y
  3. check Z (could this fail?); if yes → roll back step 2, abort
  4. mutate W
  5. trigger side effects (render, sound)

Then (postconditions):
  - state condition A is now true
  - invariants still hold (list which)

Failure outcomes:
  - if [reason 1]: state unchanged, message "..."
  - if [reason 2]: state unchanged, message "..."
```

Key rule: **order mutations so the failure-prone one comes first**. If addItem can fail (inventory full), call it before deducting money. Then no rollback is needed; the natural early-return handles it.

---

## Section 3 — The industry workflow (10 stages, screen to code)

The full sequence from "I have a screen mockup" to "code is shipped." Stages 1–7 are mostly your manual work; stages 8–10 use the prompts in Section 6.

### Stage 1 — Screen inventory (manual)

List every visible element on the screen. Don't filter. Just enumerate.

### Stage 2 — Interaction inventory (manual)

For every element that responds to input, list input type and what it triggers.

Table columns: Element | Input | Triggers

### Stage 3 — State inventory (manual)

For every visible element, identify what state backs it. This is where state gaps surface ("character position doesn't exist yet").

Table columns: Element | Backed by

### Stage 4 — Event flow mapping (manual)

Draw the arrow per interaction: trigger → state changes → re-renders. Transactions reveal themselves as operations that change two or more pieces of state.

### Stage 5 — System clustering (manual, sanity-checkable with Claude)

Group state + events that mutate together. Each cluster becomes a system (Inventory, Money, Field, Store, etc.). A system is a unit you'd hand to one person.

### Stage 6 — Cross-system transaction list (manual, 5 min) — **HIGH-VALUE STEP**

Pull out every operation touching two or more systems. These need the most careful design. The transaction list is what catches the "money disappears" class of bugs.

### Stage 7 — Per-system prep doc (manual)

For the system you're building next, write the prep document (template in 10.A). Inputs for the design prompt.

### Stage 8 — Design spec prompt

Prep doc → invariants, failure modes, sequences. (Prompts in Section 6.)

### Stage 9 — Blueprint prompt (skippable for small systems)

Design spec → classes, signatures, algorithms, dependency graph. Skip for systems that go straight from spec to code without ambiguity.

### Stage 10 — Implementation chat (fresh chat)

Blueprint (or design spec, if blueprint skipped) → code. Always in a new chat to avoid context pollution.

---

## Section 4 — Risk triage and calibration

Not every feature needs the full workflow. Calibrate effort to feature risk.

### 4.1 The 30-second triage

Answer four yes/no:

1. Does this operation change two or more pieces of state at once?
2. Does it touch money or inventory?
3. Does it persist new state across map or scene changes?
4. Does it introduce a system that doesn't exist yet?

- **0 yes → LOW.** Re-read relevant invariants, code.
- **1–2 yes → MEDIUM.** Compressed workflow (see 4.3).
- **3–4 yes → HIGH.** Full workflow (see 4.2).

### 4.2 HIGH risk: full workflow

All 10 steps of the recipe (Section 5). Estimated time: ~60 minutes before code. Use the staged prompts in Section 6.1 or the one-shot in 6.3.

Examples: store buy/sell, farming system, upgrade-on-purchase, save/load.

### 4.3 MEDIUM risk: compressed workflow

Recipe steps 1, 4, 5, 6, 9 only. Estimated time: ~25 minutes before code. Skip the design prompt; the prep doc + transaction list + invariants are enough.

Examples: new character movement, simple proximity check, single-screen UI addition with shared state.

### 4.4 LOW risk: just code

Re-read invariants for state you'll touch. Code. Test. Estimated time: 0–5 minutes pre-code.

Examples: add new item to DATA.ITEMS, add new map, add new upgrade tier following existing pattern, add a new render function for existing data.

### 4.5 What to ALWAYS keep regardless of risk

Even on LOW risk features:

- **Transaction identification.** If you touch 2+ state pieces, the operation needs atomicity thinking. Five minutes.
- **Invariant respect.** Re-read the invariants of state you're modifying before code. Two minutes.

If you skip these two, you ship the bugs that take hours to debug. Everything else can be compressed.

### 4.6 What's overkill for a solo/indie prototype

- The blueprint prompt (stage 9). Design spec → code is a short hop at your scope.
- Formal sequences for trivial operations. "Render inventory" doesn't need a Given/When/Then.
- Exhaustive edge-case enumeration for non-transaction operations.
- Full design prompt for single-system additions.

Senior devs calibrate per-feature. Junior devs formalize everything or formalize nothing. You're in the formalizing-everything phase, which is correct while learning — overcorrect now, calibrate later.

---

## Section 5 — The recipe (active workflow with time boxes)

This is the section you use day-to-day. Follow in order. Time boxes are caps, not targets.

### Pre-step: Triage (30 sec)

Run the 4-question triage from 4.1. Pick HIGH / MEDIUM / LOW. Write the choice down. It's your permission slip to skip steps.

### Open the doc

Create one file: `docs/design/[feature-name].md`. Specific name (`farming-phase1-plant-grow-harvest`, not `farming`).

Top of file:

```markdown
# [feature name] — Phase [N]

Status: DESIGNING
Risk: [HIGH | MEDIUM | LOW]
Started: [date]
```

Status `DESIGNING` = no code yet. When you flip to `DESIGNED`, design is locked, code starts.

### Step 1 — Purpose (2 min)

Write one sentence. "The farming system lets the player plant seeds on the field, wait for them to grow, and harvest crops into inventory."

If it doesn't fit in one sentence, split the feature into two systems.

**STOP** when the sentence exists. Don't polish.

### Step 2 — Visible elements (5 min, table)

```markdown
## 2. Visible elements

| Element | Where on screen | Already exists? |
| ------- | --------------- | --------------- |
```

Walk the mockup. Every visible thing. Mark which already exist.

**STOP** when 30 seconds of staring produces no new row.

### Step 3 — Interactions (5 min, table)

```markdown
## 3. Interactions

| Element | User action | Triggers |
| ------- | ----------- | -------- |
```

Include keyboard, click, timer-firing, scene-entry. For every interactive element from step 2.

**STOP** when every interactive element from step 2 has a row.

### Step 4 — Transactions (5 min, table) — **DO NOT SKIP**

```markdown
## 4. Transactions

| Operation | State A change | State B change | If A fails | If B fails |
| --------- | -------------- | -------------- | ---------- | ---------- |
```

For each row in step 3, ask: does it change 2+ state pieces? If yes, write a row. The last two columns are the work. This is the step that catches real bugs.

**STOP** when every multi-state operation has a row.

### Step 5 — New state, sketched (5 min)

```markdown
## 5. New state needed

- STATE.field = { stage, seedId, plantedAt }
- STATE.character = { x, y, facing }
```

Just nouns and rough shape. No types yet. Skip state that already exists.
Derive state, don't invent it. Walk steps 2 and 3 row by row:

Per visible element (step 2): what data, when changed, makes this element render differently? That data is its backing state. If it's already in STATE, skip; otherwise add it.
Per interaction (step 3): what does the trigger read or write? If that data isn't already in STATE, add it.

Group repeated structure into objects ({x, y, facing} not three loose vars). No types yet — types come in step 6. Worked example: Section 7.1 shows what this output looks like once formalized.

**STOP** when every visible element from step 2 has backing state AND every interaction from step 3 has a state piece it reads or writes.

### Step 6 — Invariants per new state (10 min per state)

For each new state, fill all seven:

```markdown
### STATE.[name]

1. Type:
2. Domain:
3. Nullable when:
4. Relationships:
5. Lifecycle:
6. Mutators:
7. Atomicity:
```

If you write "??" or "not sure," move on — capture as an open question.

**STOP** when every new state has seven lines (some may be "??").

### Step 7 — Operations (10 min)

TRANSACTIONS get full blocks:

```markdown
### plant(seedId)

- Preconditions: on field map; STATE.field.stage == "empty"; selected slot has seedId
- Failure: inventory has no seedId → abort
- Failure: field stage not empty → abort
- Mutation order: (1) inventory.removeItem (2) field.plant
  Rationale: if step 1 fails, field is untouched (no rollback needed)
- Re-renders: field, inventory, message
```

Non-transactions get one line:

```markdown
- selectSlot(index): toggles selection, no failure mode
- renderField(): reads STATE.field, redraws #map-interactables
```

**STOP** when every operation has a block or a line.

### Step 8 — Open questions (5 min)

```markdown
## 8. Open questions

- [BLOCKING] Can player leave field map while crop is growing?
- [BLOCKING] What happens to timer on map exit?
- [NON-BLOCKING] Sound effect on plant?
```

Sweep your doc for `??`, "not sure," "TBD." Each becomes a row. Tag each BLOCKING or NON-BLOCKING.

**STOP** when every uncertainty is captured.

### Step 9 — Decide BLOCKING questions

Two options:

**A. Decide yourself.** Answer each BLOCKING in one line below it.

**B. Brief prompt to Claude:**

```
Here's my design doc for [feature]. I have BLOCKING open questions
in section 8. Recommend an answer for each in one sentence with
one sentence of justification. Do not redesign anything else.

[paste doc]
```

**STOP** when every BLOCKING has an answer.

### Step 10 — Flip status, code

```markdown
Status: DESIGNED, [date]
```

Don't edit the doc anymore. Open implementation chat (or just start coding). Doc is reference, not draft.

### Compressed workflow (MEDIUM risk)

Steps 1, 4, 5, 6, 9 only. ~25 min total.

### Minimal workflow (LOW risk)

Read relevant invariants. Code. Test.

---

## Section 6 — Prompts (copy-paste ready)

All prompts share these meta-instructions implicitly: critical not validating, no implementation code unless explicitly asked, opinionated not options-listing, assumptions flagged explicitly, Korean comments only inside doc blocks that go into code.

### 6.1 Staged design prompts (HIGH risk, four stages in one chat)

Run in sequence in a single chat. Don't skip stages.

#### Stage 1 — State shape critique

```
Meta-instructions:
- I am designing a new game system. Do NOT write implementation code.
- Be critical. Assume my design has flaws and find them.
- Do not validate or praise structure unless explicitly asked.
- If you find fewer than 5 issues per major piece of state, you have
  not looked hard enough.
- Korean short comments only inside the final doc block I can paste
  into code. Everything else in English.

My system design is below. Walk the 7-step invariant list
(type, domain, nullability, relationships, lifecycle, mutators, atomicity)
for EACH state variable I've defined. For each variable, produce:

1. The completed 7-step analysis
2. Holes, ambiguities, or contradictions in my design
3. Questions I need to answer before this state can be implemented
4. A final invariants doc block (Korean comments) I can paste at the
   top of the owning file

DO NOT design operations yet. State only.

[paste the prep document]
```

#### Stage 2 — Operation design + failure modes

```
Meta-instructions: same as stage 1 (critical, no implementation, no praise).

State design from stage 1 is locked. Below is the finalized invariants
block and my draft list of operations.

For each operation:

1. Walk the 9-step failure-mode list:
   preconditions, resources consumed, resources produced, input domain,
   state context, concurrency, boundary values, reversibility, side effects

2. Produce a failure-mode table with columns:
   Trigger | Precondition | If violated | Detection | Response | User feedback

3. Identify which operations are cross-state transactions (touch more
   than one piece of state) and flag atomicity concerns explicitly.

4. List at least 3 edge cases per operation that I have NOT addressed.

DO NOT write Given/When/Then sequences yet. DO NOT write code.

[paste finalized invariants block from stage 1]
[paste operation list with signatures]
```

#### Stage 3 — Given / When / Then sequences

```
Meta-instructions: same as above.

State and failure modes are locked. Write Given/When/Then sequences for
each operation. For each:

- List preconditions explicitly (Given)
- Identify the trigger (When)
- Walk the sequence step by step, numbered
- For each mutation step, state what could fail and what the rollback is
- For multi-mutation operations, explicitly order mutations so that the
  failure-prone one comes FIRST (so rollback is unnecessary), or specify
  the explicit rollback path
- List postconditions (Then), including which invariants must still hold
- List all UI elements that need to re-render after success

DO NOT write code. Sequences only, as a spec I will hand to my
implementer.

[paste finalized invariants + failure-mode tables]
```

#### Stage 4 — Adversarial review

```
Meta-instructions:
- You are now an adversarial code reviewer who hates this design and
  wants to find reasons to reject it.
- Be ruthless. Find at least 10 things wrong with the design as specified.
- Rank them by severity (would-ship-bug > UX gap > minor smell).
- Do NOT suggest fixes. Just find problems.

Below is the complete design: invariants, failure modes, sequences.

What breaks?

[paste everything from stages 1-3]
```

### 6.2 Implementation chat (NEW chat, after design is locked)

```
I have a finished design spec for [system name]. Implement it exactly.
Do not redesign. If you think the design is wrong, flag it but do not
silently change it.

The codebase uses vanilla JS, no frameworks. Files: data.js, state.js,
inventory.js, ui.js, map.js, game.js. Korean short comments in code.

[paste invariants block]
[paste failure-mode tables]
[paste Given/When/Then sequences]
[paste relevant existing code files Claude needs to see]

Write the new code as edits to specific files, file by file, with
the exact lines to add or change. No full file rewrites.
```

### 6.3 One-shot full design (compressed alternative to 6.1)

Use when time is tight. Trade-off: Claude's first assumptions propagate everywhere. **Review the ASSUMPTIONS LOG before reading anything else and reject anything you don't want.**

```
META INSTRUCTIONS:
- You are a senior game developer doing greenfield design for a vanilla JS game.
- Make concrete recommendations. Do not list options without picking one.
  When picking, state briefly why and what tradeoff you accepted.
- Be opinionated. Default to industry-standard patterns over clever novelty.
- Flag every assumption you make in a dedicated ASSUMPTIONS LOG up front.
  Do NOT hide assumptions in prose elsewhere.
- Be critical of my prep doc. If a field/operation I drafted is wrong
  or insufficient, say so explicitly before recommending the replacement.
- Be ruthless about scope: anything I marked OUT must not appear in the
  design except as a future-memo.
- Output language: English for analysis. Korean short comments INSIDE
  code/doc blocks I will paste into files.
- Do not validate or praise my design. Do not soften critique.
- Do not write implementation code. Spec only.

Produce a complete design spec in one pass. I will use it directly as a
hand-off to implementation. Produce the following sections IN ORDER:

1. ASSUMPTIONS LOG
   Every gap in my prep doc you filled. Numbered.
   "Assumed X because Y. To override, tell me [Z]."
   Be exhaustive — this is the section I will review most carefully.

2. STATE SHAPE
   For each state variable, run the 7-step invariant analysis:
   type, domain, nullability, relationships, lifecycle, mutators, atomicity.
   End with a clean doc block (Korean short comments) I can paste at
   the top of the owning file.
   If my draft state was wrong, say so and propose the replacement.

3. OPERATIONS LIST
   Every operation (signature only).
   Tag each: [internal] vs [external API], [single-state] vs [cross-state].

4. FAILURE MODE TABLE — one table per operation
   Columns: Trigger | Precondition | If violated | Detection | Response | User feedback
   For cross-state operations, explicitly flag atomicity and order-of-mutations.

5. GIVEN / WHEN / THEN SEQUENCES — one per operation
   Numbered steps.
   Order mutations so failure-prone steps come first (no rollback needed)
   OR specify rollback explicitly.
   List all UI elements that must re-render after success.

6. EDGE CASES
   At least 5 per non-trivial operation that my prep doc did not address.

7. ADVERSARIAL REVIEW
   Pretend you hate this design. List at least 10 weaknesses, ranked
   by severity: ship-bug > UX gap > smell. Do not propose fixes here,
   just list.

8. SCOPE BOUNDARY MEMO
   Everything I marked out-of-scope, plus where in the design future
   expansion fits cleanly. Inline as TODO/FUTURE comments where applicable.

9. IMPLEMENTATION ORDER
   File-by-file change list, smallest-to-largest. Order so I can run
   the game after each step and verify before moving on.

PREP DOC:
[paste your prep doc here]

EXISTING CODE THAT MAY BE RELEVANT:
[paste data.js, state.js, inventory.js, and any other module the new
system touches. Trim irrelevant code to save tokens.]
```

**How to consume the output:**

1. Read ASSUMPTIONS LOG first. Reject anything wrong. Reply: "Assumption 3 wrong: [correction]. Assumption 7 wrong: [correction]. Regenerate sections 2 onward."
2. Read ADVERSARIAL REVIEW (section 7) second, before the actual design.
3. Read sections 2–6 with adversarial findings in mind.
4. Implement in section 9's order.

### 6.4 Blueprint / LLD prompt (skippable for small systems)

Use only when the gap between design spec and code is wide (multiple new files, non-trivial algorithms, ambiguous module boundaries). Skip for systems where the spec → code translation is obvious.

```
META INSTRUCTIONS:
- You are a senior game developer producing a low-level technical
  design doc for a vanilla JS game.
- Produce concrete blueprints, not options. Pick choices, justify
  briefly, accept tradeoff.
- Be opinionated about patterns, naming, and structure.
- Flag every implementation-level assumption in an ASSUMPTIONS LOG
  up front. Do not hide assumptions in prose.
- Do NOT write implementation code. This is a blueprint. Pseudocode
  is acceptable ONLY for non-trivial algorithms (more than ~10 lines
  of logic, or any non-obvious approach), clearly labeled as pseudocode.
- Use TypeScript-style type notation for fields and signatures even
  though the codebase is JS. These are documentation only, not actual
  types. Format: `fieldName: type` and `funcName(arg: type): returnType`.
- Korean short comments INSIDE doc blocks I will paste into files.
  English for analysis.
- Do not validate or praise. Critique any flaws in the spec before
  blueprinting.

I have a design spec (invariants, operations, sequences) for
[SYSTEM NAME]. I need the implementation blueprint I would hand to
an engineer. Produce, IN ORDER:

1. ASSUMPTIONS LOG
   Every implementation-level decision the spec did not specify.
   Numbered. Format: "Assumed X because Y. To override, tell me [Z]."

2. MODULE LAYOUT
   - Table: filename | role (one line) | exports | depends on
   - If new files are needed, justify each. If existing files need
     modification, list which sections of each.
   - Dependency graph: which module depends on which. Flag cycles
     explicitly. Flag any module that depends on too many others
     (more than 3) as a smell.

3. CLASS / OBJECT BLUEPRINTS
   For each class:
   - Fields: `name: type  // default value, mutability, who writes`
   - Constructor: `constructor(params): instance` with param types
   - Methods: `methodName(arg: type): returnType`
     - One-line purpose
     - Throws / returns-false conditions
     - Tag: [public API] / [internal helper] / [event handler]
   For singleton config objects (like DATA additions), same treatment.

4. MODULE-LEVEL FUNCTIONS (non-class)
   For each: full signature, one-line purpose, side-effects tag:
   [pure] / [mutates STATE] / [renders DOM] / [mutates + renders]

5. DATA STRUCTURE SHAPES
   Exact TypeScript-style shape for every non-primitive state piece
   and every object passed around. Include domain constraints inline:
   `count: number  // positive integer, >= 1`

6. ALGORITHM DECISIONS
   For each non-trivial piece of logic:
   - What approach chosen, in one sentence
   - One alternative considered and rejected, with reason
   - Time/space complexity if non-constant
   - Pseudocode if the implementation is not obvious

7. DESIGN PATTERN CHOICES
   List each pattern applied: where used, why over the naive alternative,
   what it replaces.

8. API SURFACE
   Per module: what's externally called vs internal-only.

9. CROSS-MODULE INTERACTION SEQUENCES
   For each cross-state operation, a call trace.

10. NAMING CONVENTIONS APPLIED
    Confirm conventions used; flag any new code that deviates.

11. OPEN IMPLEMENTATION QUESTIONS
    Tag each as [BLOCKING] or [NON-BLOCKING].

DESIGN SPEC:
[paste from previous prompt]

EXISTING CODE THE NEW SYSTEM MUST FIT WITH:
[paste relevant files, trimmed]
```

### 6.5 Targeted single-stage follow-ups

Use when one section of your design feels thin and you don't want to redo the whole prompt.

#### Critique a specific section

```
Here is section [X] of my design. Find at least 5 weaknesses in this
section specifically. Do not redesign other sections. Do not fix the
weaknesses — just list them, ranked by severity.

[paste section X]
```

#### Resolve a blocking question

```
Here's my design doc. I have one BLOCKING question:
[question]

Recommend an answer in one sentence. Justify in one sentence.
Don't redesign anything else.

[paste relevant context]
```

#### Sanity-check the transactions list

```
Here's my interactions table and my transactions table from a design
doc. Did I miss any transactions? An operation is a transaction if it
changes two or more pieces of state. List any operations I marked
as non-transactional that are actually transactional.

[paste tables]
```

#### Sanity-check the system clustering

```
Here's my list of state and operations for [feature]. I've grouped
them into systems as follows. Did I cluster correctly? Flag any
state-operation pair that should be in a different cluster, and any
cluster that should be split or merged.

[paste clustering]
```

---

## Section 7 — Worked examples

Concrete demonstrations of the lists applied to the existing game code.

### 7.1 State variable walk: `Inventory.slots`

Running the 7-step list.

**1. Type.** `Array` of fixed length `this.size`.

**2. Domain.** Each element is `null` OR `{ itemId: string, count: number }` where `itemId` must be a key in `DATA.ITEMS` and `count` is a positive integer (≥ 1).

**3. Nullability.** Array itself never null after construction. Individual elements can be null. The `null` carries meaning ("empty slot") — deliberate, not laziness.

**4. Relationships.**

- No two non-null elements share the same `itemId` (stacking rule).
- If `selectedSlotIndex` is not null, it must be a valid index into this array.
- Total count across slots bounded by `size × ∞` (no per-slot stack cap).

**5. Lifecycle.** Init: array of length `size`, all `null`. Runtime: mutated only via `addItem`/`removeItem`. Terminal: never destroyed within a session; `resetGameState` replaces the whole Inventory instance.

**6. Authorized mutators.** `addItem`, `removeItem`. External code reads slots but never writes directly.

**7. Atomicity.** Each `addItem`/`removeItem` is a single atomic slot change. Multi-step operations (buy) are atomic at higher level — `Inventory` itself doesn't know about money.

**Doc block to paste at the top of `inventory.js`:**

```js
// ─────────────────────────────────────────
// Inventory invariants (must always hold):
//   1. slots.length === this.size, fixed for instance lifetime
//   2. Each slot is null OR { itemId, count } where:
//      - itemId is a key in DATA.ITEMS
//      - count is a positive integer (>= 1)
//   3. No two non-null slots share the same itemId (stacking rule)
//   4. selectedSlotIndex is null OR an integer in [0, size)
//   5. slots[] is mutated ONLY by addItem and removeItem
//      (external code reads but never writes directly)
// ─────────────────────────────────────────
```

### 7.2 Operation walk: `Inventory.addItem(itemId, count)`

**1. Preconditions.** `itemId` must be a valid DATA.ITEMS key — currently NOT checked. `count` must be a positive integer — currently NOT checked.

**2. Resources consumed.** A slot, IF the item isn't already stacked. Zero slots if it is.

**3. Resources produced.** `count` units of `itemId` available.

**4. Input domain.**

- `itemId` undefined → currently stores `{itemId: undefined, count}`. Invariant violated silently.
- `itemId` typo (not in DATA.ITEMS) → same. Crashes at render time.
- `count = 0` → creates slot with count 0. Violates "count ≥ 1".
- `count` negative → bug compounds with later removeItem.

**5. State context.** Scene-agnostic. Correct.

**6. Concurrency.** JS single-threaded; multiple sync calls fine.

**7. Boundary values.**

- Empty + add: uses slot 0. ✓
- One left + add new: fills last slot, returns true. ✓
- Full + add NEW: returns false. ✓
- Full + add EXISTING: stacks, returns true. ✓
- count = 0: bug.
- count negative: bug.

**8. Reversibility.** Failure path doesn't mutate; no rollback needed. Well-designed.

**9. Side effects.** None direct. Caller responsible for render. Should be documented in JSDoc.

**Fix surfaced by walk:**

```js
addItem(itemId, count) {
    // 입력 검증 (invariant 보호)
    if (!DATA.ITEMS[itemId]) return false;
    if (!Number.isInteger(count) || count <= 0) return false;

    // ... 기존 로직
}
```

### 7.3 Transaction walk: `onBuyClick(itemId)` — the killer example

**1. Preconditions.** In store scene; itemId in DATA.ITEMS; `buyPrice` defined.

**2. Resources consumed.** `STATE.money` by `buyPrice`.

**3. Resources produced.** 1 unit of `itemId` in inventory.

**4. Input domain.** itemId comes from button data — low risk.

**5. State context.** Must be in store. Already true.

**6. Concurrency.** Double-click! Each click fires the handler. Without protection, rapid clicks deduct multiple times.

**7. Boundary values.**

- money = buyPrice exactly: can afford, → 0. ✓
- money = buyPrice − 1: cannot afford, abort.
- inventory full + new item (not stacked): **addItem returns false.**

**8. Reversibility — the critical step.**

Naive order:

```
1. STATE.money -= buyPrice   ← mutation
2. inventory.addItem(...)     ← may fail
```

If step 2 fails, money gone, item not received. **The bug.**

**Fix A — order mutations so failure-prone is first:**

```
1. if (!inventory.addItem(...)) return   ← check first
2. STATE.money -= buyPrice               ← only on success
```

**Fix B — explicit rollback:**

```
1. STATE.money -= buyPrice
2. if (!inventory.addItem(...)) {
       STATE.money += buyPrice           ← roll back
       return
   }
```

Fix A cleaner. Fix B generalizes if there are 3+ mutations.

**9. Side effects.** UI elements showing STATE.money:

- `#money-amount` (game scene)
- `#store-money-amount` (store scene) ← **`renderMoney()` was missing this**

UI showing inventory: `#inventory-bar`. UI showing buy buttons: affordability state changes. UI showing sell list: may change if bought into stackable.

**Sequence written before code:**

```
Operation: onBuyClick(itemId)
Given:
  - currentScene == "store"
  - itemId is in DATA.ITEMS
  - DATA.ITEMS[itemId].buyPrice is defined
When: click on buy button for itemId

Sequence:
  1. item = DATA.ITEMS[itemId]
  2. if !item.buyPrice → abort, msg "이 아이템은 살 수 없습니다"
  3. if STATE.money < item.buyPrice → abort, msg "돈이 부족합니다"
  4. if !STATE.inventory.addItem(itemId, 1) → abort, msg "인벤토리 가득"
  5. STATE.money -= item.buyPrice
  6. render: money (BOTH displays), inventory, store buy list, msg "구매 완료"

Then:
  - STATE.money decreased by buyPrice
  - inventory has one more itemId
  - invariants: money ≥ 0, no two slots share itemId
  - ALL displays consistent with state

Failure outcomes:
  - not buyable: no change, message
  - broke: no change, message
  - full: no change, message
```

Both real bugs (money disappears, store money frozen) fell directly out of the walk.

---

## Section 8 — When you get distracted

ADHD-specific recovery patterns. These map to specific failure modes you'll hit.

**Mid-step distraction → tangent.** When you come back, open the doc, find the first unchecked STOP, resume there. Don't reread. Just resume.

**Stuck on a step.** Write the partial answer plus `?? [what's confusing]` and move to the next step. The artifact captures the stuck point. You'll resolve it in step 8 (open questions).

**Spiraling on a decision.** Time-box: "5 minutes to pick, then I move on; if I can't pick, it goes to step 8 as non-blocking." Bad decision is fine; no decision is the trap.

**Re-designing what's already designed.** When you find yourself editing step 3 while doing step 7, stop. Add the edit as `[BLOCKING]` in step 8. Keep moving. Re-design once at the end, not continuously.

**Doc feels overwhelming.** Close the doc. Triage the feature again (4.1). If it's actually MEDIUM or LOW, you're doing too much. Drop to the compressed workflow.

**Lost in Claude's long reply.** Don't read linearly. Search the reply for: `ASSUMPTIONS`, `BLOCKING`, severity tags in adversarial review. Read those first. The rest is context.

**Multiple chats open, lost track.** Close all but one. Open the design doc. The doc is the source of truth; chats are scratchpad. If a chat had an important answer, paste it into the doc, then close the chat.

---

## Section 9 — Learning resources

Books and concepts that go deeper on what this doc compresses.

### On invariants and contracts

- **Bertrand Meyer, _Object-Oriented Software Construction_.** The original Design by Contract reference. Long; the chapters on contracts and invariants are the ones to read.
- **Hoare logic (preconditions / postconditions).** Academic but the mental model transfers.

### On behavior specs and sequences

- **Dan North's writings on BDD** (Given / When / Then). Practical version of Hoare-style specs.
- **Cucumber / Gherkin syntax.** Even if you don't use the tool, the syntax shapes how you think.

### On defensive programming

- **Steve McConnell, _Code Complete_.** Chapter 8 ("Defensive Programming") is the most directly applicable.
- **Steve Maguire, _Writing Solid Code_.** Older Microsoft book; still useful on assertion-driven development.

### On failure-mode thinking

- **FMEA (Failure Mode and Effects Analysis).** From reliability engineering; adapted to software in many places. Look up FMEA tutorials.
- **Google's SRE book** (free online). Chapters on postmortems and how production teams systematically catalog failure modes.

### On systems design judgment

- **John Ousterhout, _A Philosophy of Software Design_.** Short, opinionated. The chapter "Define errors out of existence" is the cleanest articulation of invariant thinking.

### On property-based testing (advanced, for later)

- **Hypothesis (Python), fast-check (JS), QuickCheck (Haskell).** Even reading the documentation teaches you "what properties must hold" thinking.

### On naming and structure

- **Martin Fowler, _Refactoring_.** Catalog of code smells and refactorings. Builds the vocabulary you need to articulate why a design choice is good or bad.

### Not on this list

General "clean code" books. They often present rules without the reasoning, which doesn't transfer well. The books above explain _why_, which is what generalizes.

---

## Section 10 — Templates (copy to your own files)

### 10.A — Design doc skeleton

Save this as a template; copy per feature.

```markdown
# [feature name] — Phase [N]

Status: DESIGNING
Risk: [HIGH | MEDIUM | LOW]
Started: [date]

## 1. Purpose (one sentence)

## 2. Visible elements

| Element | Where on screen | Already exists? |
| ------- | --------------- | --------------- |

## 3. Interactions

| Element | User action | Triggers |
| ------- | ----------- | -------- |

## 4. Transactions (operations touching 2+ state)

| Operation | State A change | State B change | If A fails | If B fails |
| --------- | -------------- | -------------- | ---------- | ---------- |

## 5. New state needed

- STATE.[name] = { ... }

## 6. Invariants per new state

### STATE.[name]

1. Type:
2. Domain:
3. Nullable when:
4. Relationships:
5. Lifecycle:
6. Mutators:
7. Atomicity:

## 7. Operations

### [transactional operation name]

- Preconditions:
- Failure modes:
- Mutation order:
- Re-renders:

- [non-transactional op]: one-line description

## 8. Open questions

- [BLOCKING] ...
- [NON-BLOCKING] ...

## 9. Resolution

(Answers to BLOCKING questions written here when decided.)

## 10. Out-of-scope memo

(Things explicitly deferred to future phases.)
```

### 10.B — Invariants doc block (paste into code file)

```js
// ─────────────────────────────────────────
// [모듈/상태 이름] invariants (must always hold):
//   1. [규칙 1]
//   2. [규칙 2]
//   3. [규칙 3]
//   4. 외부 코드는 읽기만, 변경은 [authorized mutators] 통해서만
// ─────────────────────────────────────────
```

### 10.C — Failure mode table template

```markdown
### onXClick(args)

| Trigger | Precondition | If violated | Detection | Response                 | User feedback |
| ------- | ------------ | ----------- | --------- | ------------------------ | ------------- |
| ...     | ...          | ...         | ...       | abort / rollback / retry | message text  |
```

### 10.D — Transaction table template

```markdown
## Transactions

| Operation | State A | A change | State B   | B change | Order           | Failure handling                           |
| --------- | ------- | -------- | --------- | -------- | --------------- | ------------------------------------------ |
| buy       | money   | -price   | inventory | +1 item  | B first, then A | A inventory full → abort, no A or B change |
```

### 10.E — Given / When / Then template

```markdown
Operation: [name]

Given:

- precondition 1
- precondition 2

When: [trigger]

Sequence:

1.
2.
3.

Then:

- postcondition 1
- invariants still holding: [list]

Failure outcomes:

- if [cause 1]: ...
- if [cause 2]: ...
```

### 10.F — Module layout table (for blueprint stage)

```markdown
| File         | Role                      | Exports   | Depends on           |
| ------------ | ------------------------- | --------- | -------------------- |
| inventory.js | Inventory class + methods | Inventory | data.js (DATA.ITEMS) |
```

---

## Quick-reference card (print this)

**Triage (30 sec):**

- 0 yes → LOW: re-read invariants, code
- 1–2 yes → MEDIUM: steps 1, 4, 5, 6, 9
- 3–4 yes → HIGH: full recipe

**Always do, regardless of risk:**

1. Identify transactions
2. Respect invariants for state you touch

**The two lists, condensed:**

For state variables:

1. Type → 2. Domain → 3. Nullability → 4. Relationships → 5. Lifecycle → 6. Mutators → 7. Atomicity

For operations:

1. Preconditions → 2. Resources consumed → 3. Resources produced → 4. Input domain → 5. State context → 6. Concurrency → 7. Boundary values → 8. Reversibility → 9. Side effects

**Mutation order rule:**
Failure-prone mutation first. No rollback needed if it aborts early.

**Render side-effect rule:**
List every UI element that reads the changed state. All must re-render.

**When stuck:**
Write `??` and move on. Capture in open questions. Don't spiral.

---

_End of reference document._
