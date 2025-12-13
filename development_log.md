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
