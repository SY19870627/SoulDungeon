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

### 5. Adventurer System
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

## Next Steps
-   **Visual Polish**: Floating damage numbers, better sprites.
-   **Content Expansion**: More trap types, different adventurer types.
-   **Game Loop**: Win/Loss conditions, multiple levels.
