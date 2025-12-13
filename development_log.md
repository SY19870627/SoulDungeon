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
