# Soul Dungeon Development Log

## Project Overview
**Soul Dungeon** is a tower defense game where players build mazes and place traps to stop adventurers. The project uses a modern web stack (Electron, Vite, React, Phaser) for desktop deployment.

## Development Progress

### 1. Project Initialization
-   **Tech Stack**: Electron, Vite, React, TypeScript, Phaser.
-   **Configuration**: ESLint, TypeScript paths configured.
-   **Structure**:
    -   `electron/`: Main process code.
    -   `src/game/`: Phaser game logic (Scenes, Objects, Systems).
    -   `src/ui/`: React UI components.

### 2. Core Gameplay Systems
-   **Grid System**: 10x10 grid for placing walls and traps. Handles coordinate conversion (World <-> Grid) and collision checking.
-   **Pathfinding**: A* algorithm implementation for adventurer movement. Recalculates paths dynamically when walls/traps change.
-   **Economy System**: Gold management.
    -   Starting Gold: 100.
    -   Costs: Wall (10), Spike (20), Spring (30).
    -   Rewards: Kill Adventurer (+10), Sell Refund (50% for traps, 50% for walls).

### 3. Tool System (Refactoring)
-   **Strategy Pattern**: Implemented `Tool` interface to decouple interaction logic from `MainScene`.
-   **Tools**:
    -   `WallTool`: Build/Remove walls.
    -   `TrapTool`: Place traps (Spike, Spring). Rotates existing traps if clicked.
    -   `SellTool`: Remove traps/walls for a refund.

### 4. Trap System
-   **TrapSystem Class**: Centralized logic for trap effects.
-   **Trap Types**:
    -   **Spike**: Deals 30 flat damage upon entry.
    -   **Spring**: Teleports adventurer 2 tiles in a direction. Supports chain reactions (Spring -> Spring).
-   **Mechanics**:
    -   **Trigger Once**: Traps trigger only once when an adventurer enters the tile.
    -   **Recursive Trigger**: If a spring teleports an adventurer onto another trap, the new trap triggers immediately.

### 5. Trap System Normalization (Refactoring)
-   **Data-Driven Design**: Refactored `TrapSystem` to use `TrapConfig` and `TrapRegistry`.
-   **Extensibility**: Traps now defined in a central registry, supporting future types (elements, physics) without hardcoding.
-   **UI Integration**: `App.tsx` and `MainScene` updated to render traps dynamically based on config.

### 6. Adventurer System
-   **WaveManager**: Manages spawning waves of adventurers.
-   **Adventurer Class**:
    -   **Movement**: Moves along the calculated path.
    -   **Pause Logic**: Pauses for 0.5s at the center of each tile to simulate human-like behavior.
    -   **Teleportation**: Supports instant movement (Spring trap) with state reset to ensure correct logic flow.
    -   **Visuals**: Simple circle sprite with a health bar.

### 6. Debugging & Fixes
-   **Spring Trap Invincibility**: Fixed an issue where landing from a jump didn't trigger the target trap. (Solution: Recursive trigger check).
-   **Sequential Trap Failure**: Fixed an issue where the second trap in a chain failed to trigger. (Solution: `teleport` method resets `pauseTimer`).
-   **DevTools**: Enabled Electron DevTools by default for easier debugging.

### 7. Visual Polish & Feedback
-   **Spring Jump Animation**: Implemented `jumpTo` tween for spring traps, replacing instant teleportation with a parabolic jump arc.
-   **Adventurer Visuals**: Replaced circle sprite with a directional triangle (arrow) to clearly show facing direction.
-   **Emote System**:
    -   **Data-Driven**: Emotes defined in `TrapRegistry` (`emoteSuccess`, `emoteFail`).
    -   **Reactions**: Adventurers show '😖' on damage, '😱' on spring jump, and '🤕' when blocked.
    -   **Animation**: Pop-in and float-up fade-out animation for emote bubbles.
-   **Death Animation**: Adventurers now spin and fade out upon reaching 0 HP.

## Roadmap Status (Aligned with remark.md)

### Phase 1: Foundation & Chemical Synergy
- [x] Grid Map & Obstacles (Walls)
- [x] **Chemical Synergy** (Oil+Fire, Water+Lightning) <!-- Priority -->

### Phase 2: Physical Synergy
- [x] Physical Displacement (Spring)
- [x] Combo Detection (Recursive triggers)
- [ ] Dummy Simulation

### Phase 3: Adventurer AI & Lures
- [x] Basic Pathfinding & Movement
- [ ] **Advanced AI** (Knight, Glutton, Thief)
- [ ] Lure System
- [x] Visual Feedback (Damage Numbers, Emotes, Death Animation)

### 8. Visual & Animation Refactor (2025-12-06)
-   **Asset Integration**: Imported "Kenney Tiny Dungeon" assets to `public/assets`.
-   **Sprite-Based Rendering**:
    -   Refactored `MainScene` to use `Phaser.GameObjects.Sprite` for traps instead of geometric graphics.
    -   Implemented `syncTrapSprites` for robust sprite state management (add/update/remove).
-   **Adventurer Visuals**:
    -   Replaced triangle shape with `hero_run_sheet` sprite.
    -   Implemented directional movement animations (`run-down`, `run-right`, `run-up`) and flip logic.
    -   Restored class structure and fixed syntax errors during refactor.
-   **Visual Polish**:
    -   Enabled `pixelArt: true` in `GameConfig` for crisp retro visuals.
    -   Enforced render depths (Grid: 0, Trap: 10, Wall: 20, Adventurer: 30, Highlight: 100) to ensure correct layering.

### Phase 4: Game Loop & Content
- [ ] Day/Night Cycle (Shop, Economy)
- [ ] Relic System
- [ ] More Content (Levels, Monsters)

### 9. Visual Architecture Shift - Code-Driven Animation (2025-12-13)
*   **Topic**: Visual Architecture Shift - Code-Driven Animation.
*   **Changes**:
    *   Deprecated Frame-by-Frame animations to reduce asset dependency (Board Game Style).
    *   Refactored `Hero` and `Adventurer` to use Tween-based "Board Game Style" movement (Hop/Jump).
    *   Implemented procedural visual feedback for Attack (Lunge), Damage (Flash/Shake), and Death (Topple).

### 10. Trap System Architecture - Component Pattern (2025-12-13)
*   **Topic**: Trap System Refactoring - Trigger/Effect Separation.
*   **Architecture**:
    *   **Components**: Traps now use a flexible `Trigger` + `Effect` component system (`TrapConfig.components`).
    *   **Triggers**: Implemented `OnStepTrigger` (Event-driven) and `ProximityTrigger` (Update-driven).
    *   **Effects**: Implemented `PhysicalDamageEffect`, `RootEffect` (Status), and `AreaMagicEffect` (AoE).
*   **Prototypes**:
    *   **Spike Trap**: Migrated to Component system (OnStep + Damage).
    *   **Bear Trap**: Added logic (OnStep + Damage + Root).
    *   **Magic Rune**: Added logic (Proximity + AoE Magic).
*   **Refactoring**:
    *   Updated `TrapSystem` to support both legacy hardcoded effects (Spring) and new component-based traps simultaneously.
    *   Updated `WaveManager` to driver trap updates for proximity detection.

### 11. System Simplification: Elemental Redundancy Removal (2025-12-13)
-   **Topic**: System Simplification: Elemental Redundancy Removal.
-   **Changes**:
    -   Refactored `TrapSystem` and `TrapRegistry` to support only the core Oil+Fire synergy.
    -   Shifted design focus towards Physics interactions (Movement/Displacement) over static elemental combos.

### 12. Architectural Pivot (Visual Style)
-   **Decision**: Abandoned pixel art sprite sheets in favor of **Programmatic Animation (Tweens)**.
-   **Benefits**:
    -   Reduced asset dependency (no need to draw every frame).
    -   Easier to implement "Juicy" effects (Squash & Stretch) via code.
    -   Higher fidelity (resolution independent).
-   **Implementation**:
    -   Replaced `spritesheet` loading with `load.image`.
    -   Removed `Animation Manager` setup in `MainScene`.
    -   Implemented `Squash & Stretch` scaling tweens in `Hero` movement logic.

### 13. Visual Architecture Pivot (Juice Update)
-   **Content**: Abandoned Sprite Sheet animations in favor of Tween-based procedural animation for better visual feedback (Juice) and easier asset management. Refactored Adventurer and MainScene.

### 14. Refactoring & Componentization
-   **Goal**: Improve Separation of Concerns (SoC) and maintainability.
-   **Changes**:
    -   **Components**: Extracted `HealthBar` and `EmoteBubble` into reusable components; cleaned up `Adventurer` class.
    -   **Rendering**: Created `DungeonRenderer` system to handle grid, walls, and trap rendering, decoupling it from `MainScene`.
    -   **Logic**: Extracted internal physics logic from `TrapSystem` into specific handler methods.
    -   **Cleanup**: Deleted redundant `Hero.ts`.

### 15. Mechanics: Recursive Fire Propagation
-   **Content**: Implemented instant ignition system using recursion (Flood Fill). Placing Fire next to a line of Oil now instantly ignites the entire path. Aligned Burning Oil price with standard Oil.

### 16. [Dev Log] - AI Logic V2: Memory & Learning
- **Refactoring**: Rolled back complex personality logic to focus on deterministic pathfinding.
- **New Feature**: Added `trapMemory` to Adventurers.
- **New Feature**: Updated `Pathfinding` system to support `dynamic obstacles`.
- **Behavior Change**: Adventurers now permanently avoid tiles where they have previously taken damage, effectively treating known traps as walls.

### 17. [Dev Log] - Semantic Memory System
- **Refactoring**: Refactored Adventurer Memory from binary blocked-check to Semantic Map (Type/Detail).
- **Architecture**: Supports future features where different classes react differently to specific trap types.
- **Implementation**:
  - Adventurer now stores `MemoryCell { type, detail, timestamp }`.
  - Pathfinding accepts `memoryContext` to make informed routing decisions.
  - TrapSystem teaches Adventurer about trap identity upon trigger.

### 18. [Dev Log] - Debugging & Transparency
- **Logging**: Added console logs to `Pathfinding` (inspection) and `TrapSystem` (interaction) to clearly indicate when Adventurers encounter Walls or Traps.

### 19. AI Infrastructure (Deterministic Pathfinding)
- **Refactoring**: Refactored Pathfinding to support injected traversal rules. This enables deterministic AI behaviors (e.g., units logically treating traps as walls) without adding randomness.
- **Implementation**: Updated `findPath` to accept a `getTileCost` callback, allowing specific logic (Infinity cost = Wall) to be injected per pathfinding request.




### 20. Stamina & Roaming System (Time Attack Pivot)
- **Pivot**: Changed gameplay from "Fixed Path Defense" to "Survival Hunt".
- **Stamina**: Adventurers start with 40 Stamina. Moving consumes 1 Stamina/tile.
- **Roaming Logic (BFS)**: implemented `pathfinding.findNearestWalkableTile` for "Greedy Coverage" exploration.
- **Economic Consequence**: 
    - **Expire (Stamina=0)**: Adventurer fades out. Reward: **0 Gold**.
    - **Kill (HP=0)**: Adventurer dies. Reward: **+10 Gold**.
- **Panic Mode**: If trapped, adventurers enter "Panic" state and burn 1 Stamina/sec to prevent keeping them alive indefinitely.

### 21. Smart Trap Anxiety (AI Enhancement)
- **Feature**: Implemented "Trap Anxiety". Adventurers panic upon seeing a trap (-5 Stamina, '😨').
- **Logic**: 
  - **Detection**: Adventurers check the next tile for traps before moving.
  - **Memory**: Once detected, the trap is added to `knownTraps`.
  - **Rerouting**: Updated Pathfinding to support `excludeNodes` (known traps) and `preferredNodes` (visited tiles). AI now prefers retracing steps to find alternate routes rather than risking unknown tiles immediately.
- **Goal**: Simulation of cautious exploration and fear.

### 22. Refined Trap Anxiety Logic (Fear Differentiation)
- **Problem**: Adventurers were getting scared of Spring traps, which doesn't make sense (they should just walk into them).
- **Solution**: Introduced `isScary` flag in `TrapConfig`.
- **Implementation**:
  - `Spike`, `Fire`, `Bear Trap`: `isScary: true` -> Triggers Panic & Stamina Burn.
  - `Spring`: `isScary: false` -> Ignored by anxiety logic. Adventurers walk blindly into them.
- **Outcome**: Adventurers now intelligently avoid dangerous traps but fall for utility traps.

### 23. High-Fidelity "Peek & Panic" Animation
- **Visuals**: Implemented specific "Probe" tween sequence for Trap Anxiety.
- **Behavior**: Instead of just stopping, Adventurer now physically steps 40% into the dangerous tile, creates a "😨" emote, recoils back to origin, and then reroutes.
- **State Management**: Added `isPanicAnimating` flag to prevent movement logic conflicts during the probe animation.
- **Psychology**: Reinforces the "Smart Mouse" feel where adventurers visibly test the waters before panicking.

### 24. Visual Polish - Spring Trap Animation
- **Feature**: Added "Boing" animation for Spring Traps.
- **Visuals**: Trap sprite scales (1.0 -> 1.5 -> 1.0) using a `Back.out` ease when an Adventurer lands on it.
- **Sync**: Animation triggers exactly on `enteredNewTile` event, providing immediate visual feedback for the physics interaction.

### 25. Physics - Spring Trap Wall Collision
- **Mechanic**: Adventurers flung by Spring Traps check their trajectory for walls.
- **Collision**: If a wall is in the way, the adventurer flies towards it, crashes ('Bonk'), takes 15 damage, and rebounds to the start position.
- **Visuals**: Implemented `bonkAgainstWall` tween sequence with '😵' emote and camera shake.
- **Strategy**: Encourages players to use walls specifically as "Anvils" for their traps.

### 26. UI Cleanup
- **Changes**: Removed the yellow/cyan pathfinding preview line and the fixed red endpoint marker.
- **Reasoning**: The game has shifted from "Fixed Path TD" to "Dynamic Roaming Survival". Visualizing a single static path is misleading when adventurers are actively roaming, rerouting, and exploring.

### 27. Visual Polish - Entrance Asset
- **Change**: Replaced the generic green tile marker for the Entrance with a dedicated PNG asset (`entrance.png`).
- **Implementation**: Updated `DungeonRenderer` to render a sprite instead of a colored rectangle at the start position.

### 28. Mechanics - Panic Retreat & Bounty System
- **Feature**: Exhausted adventurers now attempt to flee back to the entrance instead of vanishing.
- **Behavior**: Upon reaching 0 Stamina, they regain 50% stamina, speed increases by 1.5x, and they run towards the spawn point.
- **Visuals**: Fleeing units trigger '😱' emote and are tinted Pale Blue.
- **Economy**: Killing a fleeing unit yields **Double Gold** (20g). If they escape, the player gets nothing.
- **Strategy**: Adds a "Mercy Kill" window where high-risk play is rewarded.

### 29. System - Level Loading
- **Feature**: Implemented JSON Map Loader.
- **Implementation**: The game now parses `level_01.json` to initialize the grid size, wall layout, and adventurer spawn point. This replaces the empty default grid.
- **Data Structure**: Standardized JSON format for levels defining `width`, `height`, and ASCII `layout`.

### 30. Visual Polish - Trap Animation Refinement
- **Update**: Refined Spring Trap animation logic.
- **Details**: Uses `killTweensOf` to prevent stacking, and ensures scaling is relative to current size (1.5x) with proper reset on complete.
- **Goal**: Improved visual responsiveness for rapid trap triggers.

### 31. Visual Update - Adventurer Sprite Replacement
- **Change**: Replaced the placeholder `hero.png` with `Adventurer_Male_LV1.png`.
- **Reason**: Upgrading character visuals to a more detailed sprite.

### 32. Bug Fix - Adventurer Movement Scaling
- **Issue**: Adventurer sprite size exploded during movement due to hardcoded absolute scale in squash & stretch tween.
- **Fix**: Updated `Adventurer.ts` to use relative scaling (`currentScale * factor`) for the move animation.

### 33. Visual Tweak - Adventurer Size
- **Change**: Increased Adventurer sprite size from 32x32 to 64x64.
- **Reason**: Improved visibility and presence on the 64x64 grid.

### 34. UI Layout Update - Status Bars
- **Change**: Moved Health and Stamina bars from above the character to below the character.
- **Reason**: Better visual composition with the larger character sprite.

### 35. Visual Update - Movement Animation
- **Change**: Replaced specific "Squash & Stretch" scaling with a "Hop" (Y-axis transition) animation for movement.
- **Reason**: Previous scaling effect was too subtle; hopping provides clearer visual feedback for step-by-step movement.

### 36. Balance Update - Stamina
- **Change**: Reduced Adventurer base Stamina from 40 to 25.
- **Reason**: Increasing difficulty/urgency by limiting the free roam duration.

### 37. Balance Update - Economy
- **Change**: Updated initial gold from 500 to 120.
- **Reason**: Rebalancing starting resources for tighter gameplay.

### 38. Localization (Traditional Chinese)
- **Change**: Translated Main UI (`App.tsx`) and Trap Names (`TrapRegistry.ts`) to Traditional Chinese.
- **Reason**: Enhancing accessibility for localized audience.

### 39. Phase Adjustment: Web Deployment Preparation
- **Strategy**: Pivoted to a **Hybrid Deployment Strategy** (Web/Electron).
- **Action**: Created `build:web` pipeline (`tsc && vite build`) to generate a static web build compatible with Netlify.
- **Goal**: Enable rapid alpha testing via web browser while keeping the Electron architecture for the final Steam release.
- **Tech**: Confirmed `localStorage` will be used for cross-platform save data compatibility.

### 40. Workflow Update: Web-First Development
- **Action**: Added `dev:web` script (`vite`) to `package.json`.
- **Benfit**: Allows standard browser development (Chrome) for faster iteration, treating Electron as a secondary release target.

### 41. Trap Durability System (Current)
-   **Stateful Traps**: Refactored `Trap` interface to hold runtime state (`remainingTriggers`).
-   **Durability Logic**:
    -   Implemented `maxTriggers` in `TrapConfig`.
    -   **Spike**: Infinite durability (-1).
    -   **Spring**: Single-use (1). Disappears after triggering.
-   **Lifecycle**: Traps automatically remove themselves from the grid (`GridSystem.removeTrap`) when durability reaches 0.

### 42. Trap Durability & Visuals (Reverted to Removal)
-   **Durability Logic**:
    -   Traps now maintain `remainingTriggers`.
    -   **Spring**: Configured to 1 use.
    -   **Spike/Elements**: Configured to -1 (Infinite).
-   **Exhaustion Behavior**:
    -   **Update**: Changed behavior from "Inactive/Ghost" back to **Auto-Remove**.
    -   When a trap's durability reaches 0, it is immediately removed from the grid.
    -   Removed transparency logic from `DungeonRenderer` as the sprite is simply destroyed.
    -   **Fix**: Added `grid-updated` event dispatch to `TrapSystem` removal logic to ensure the sprite is immediately cleared from the view.

### 43. Refactor: 實作情緒仲裁系統與陷阱物理動畫
- **Emote Arbitration (Adventurer)**:
  -   Introduced `EmotePriority` (NORMAL, HIGH).
  -   Implemented `requestEmote` to manage priority: HIGH interrupts NORMAL, while NORMAL is ignored if HIGH is playing.
  -   Updated Internal AI (Panic, Flee) to NORMAL.
  -   Updated Physical Reactions (Damage, Status) to HIGH.
-   **Diegetic Trap Feedback (Visuals)**:
    -   Removed Emoji Popups (`emoteSuccess`) from all traps.
    -   Implemented Physics-based Tween animations in `DungeonRenderer`:
        -   **Spike**: Fast Stab & Retract.
        -   **Bear Trap**: Rapid Snap & Shake.
        -   **Spring**: Squash & Stretch (Boing).
        -   **Magic**: Pulse & Rotate.
    -   Added 'trap-triggered' event bus to decouple Logic (TrapSystem) from Visuals (Renderer).
-   **Bug Fix**:
    -   Fixed `TypeError: adventurer.showEmote is not a function` in `PhysicalDamageEffect` and `AreaMagicEffect` by migrating them to `requestEmote` and `takeDamage`'s built-in feedback.

### 44. Balance Update - Economy (Testing)
-   **Change**: Increased initial gold from 120 to 1000.
-   **Reason**: Requested for testing purposes (Sandbox Mode).

### 45. Visual Polish - Spike Trap Animation
-   **Change**: Refined Spike Trap animation to be more physical.
-   **Sequence**:
    1.  **Anticipation**: Sinks down (`y+5`) and squashes (`scaleY*0.8`).
    2.  **Stab**: Rapidly thrusts up (`y-20`) and stretches (`scaleY*1.5`).
    3.  **Recover**: Returns to idle.
-   **Goal**: Better impact and "stabbing" feel.

### 46. Visual Polish & UX Refinements (2025-12-14)
- **Visuals (Bear Trap)**:
  - **Animation**: Enhanced Bear Trap with "Snap & Shake" tween sequence (Anticipation -> Snap -> Struggle).
  - **Feedback**: Added `Camera Shake` on snap and `Red Tint` to indicate damage/struggle.
  - **Sprite Management**: Updated `DungeonRenderer` to delay sprite destruction for single-use traps until the animation completes.
- **Balance (Traps)**:
  - **Bear Trap**: Changed `isScary` to `false`. Adventurers no longer panic when seeing a bear trap; they walk right into it.
- **UI (Sidebar)**:
  - **Simplification**: Removed the colored dot indicators from purchase buttons for a cleaner look.
- **System (Window)**:
  - **Config**: Set default window mode to `Fullscreen` in Electron `main.ts`.

### 47. Mechanics: Oiled Status & Slipping
- **Mechanics**: Implemented a status effect system where Adventurers accumulate 'grease' when stepping on Oil traps.
- **Rules**: After taking **3 steps** while Oiled, the adventurer triggers a **Slip** event.
- **Slip Outcome**:
  - **Animation**: Chaotic wobble/spin and '💫' emote.
  - **Stun**: Paused for 2.0 seconds.
  - **Effect**: Status is removed after slipping.
### 48. Mechanics: Campfire & Interactions
- **Mechanics**: Implemented **Campfire (營火)** trap.
- **Functionality**:
  - **Standard**: Investigating a campfire restores **5 SP** and applies a brief `stun` (Resting). Visual: `Thinking/Zzz` emote.
  - **Synergy (Oiled)**: If the Adventurer is **Oiled**, the campfire **IGNORES** healing and instead **IGNITES** the oil.
    - **Outcome**: Deal **30 Damage** immediately, remove Oiled status, and play `🔥` emote.
- **Goal**: Provides both a support tool for baiting (restore stamina so they live longer) and a punishment tool for oiled adventurers.

### 49. Mechanics: Volatile Ignition
- **Mechanics**: Implemented proximity ignition for **Oiled** adventurers.
- **Rules**:
  - If an Oiled adventurer attempts to step into a **Fire Source** (Fire Vent, Campfire, Burning Oil):
  - **Effect**: Immediate fumes explosion (30 Damage) and movement interrupt.
  - **Override**: This checks happens **BEFORE** Trap Panic. Meaning an Oiled adventurer won't be scared of a fire trap; they will just explode from the fumes before getting close enough to panic.
- **Goal**: Creates a unique interaction where players can use oil to force damage even on "Scary" traps that would normally be avoided.

