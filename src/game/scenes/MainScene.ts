import Phaser from 'phaser';
import { GridSystem, Trap } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';
import { WaveManager } from '../systems/WaveManager';
import { EconomyManager } from '../systems/EconomyManager';

export class MainScene extends Phaser.Scene {
    private gridSystem!: GridSystem;
    private pathfinding!: Pathfinding;
    private waveManager!: WaveManager;
    private economyManager!: EconomyManager;

    private gridGraphics: Phaser.GameObjects.Graphics | null = null;
    private highlightGraphics: Phaser.GameObjects.Graphics | null = null;
    private pathGraphics: Phaser.GameObjects.Graphics | null = null;
    private wallGraphics: Phaser.GameObjects.Graphics | null = null;
    private trapGraphics: Phaser.GameObjects.Graphics | null = null;
    private adventurerGraphics: Phaser.GameObjects.Graphics | null = null;

    private startPos = { x: 0, y: 0 };
    private endPos = { x: 9, y: 9 };

    private selectedTrap: Trap | null = null;

    constructor() {
        super('MainScene');
    }

    create() {
        // Calculate offsets to center the grid
        const gridWidth = 10;
        const gridHeight = 10;
        const tileSize = 64;

        const totalWidth = gridWidth * tileSize;
        const totalHeight = gridHeight * tileSize;

        const offsetX = (this.scale.width - totalWidth) / 2;
        const offsetY = (this.scale.height - totalHeight) / 2;

        // Initialize GridSystem with calculated offsets
        this.gridSystem = new GridSystem(gridWidth, gridHeight, tileSize, offsetX, offsetY);
        this.pathfinding = new Pathfinding(this.gridSystem);
        this.waveManager = new WaveManager(this, this.gridSystem, this.pathfinding);
        this.economyManager = new EconomyManager(100); // Start with 100 gold
        this.waveManager.setEconomyManager(this.economyManager);

        this.gridGraphics = this.add.graphics();
        this.highlightGraphics = this.add.graphics();
        this.pathGraphics = this.add.graphics();
        this.wallGraphics = this.add.graphics();
        this.trapGraphics = this.add.graphics();
        this.adventurerGraphics = this.add.graphics();

        this.drawGrid();
        this.setupInput();
        this.setupEvents();
        this.updatePath(); // Initial path

        // Initial gold update
        this.time.delayedCall(100, () => {
            window.dispatchEvent(new CustomEvent('gold-updated', { detail: this.economyManager.getGold() }));
        });
    }

    update(time: number, delta: number) {
        this.waveManager.update(time, delta);
        this.drawAdventurers();
    }

    private setupEvents() {
        window.addEventListener('select-trap', (e: any) => {
            const trap = e.detail as Trap | null;
            this.selectedTrap = trap;
            console.log('Selected trap:', trap);
        });

        window.addEventListener('start-wave', () => {
            console.log('Starting wave...');
            this.waveManager.startWave();
        });

        this.economyManager.on('gold-updated', (gold: number) => {
            window.dispatchEvent(new CustomEvent('gold-updated', { detail: gold }));
        });
    }

    private drawGrid() {
        if (!this.gridGraphics) return;

        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(2, 0xffffff, 0.5);

        const width = this.gridSystem.getWidth();
        const height = this.gridSystem.getHeight();
        const tileSize = this.gridSystem.getTileSize();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const origin = this.gridSystem.getGridOrigin(x, y);
                this.gridGraphics.strokeRect(origin.x, origin.y, tileSize, tileSize);
            }
        }

        // Draw Start and End markers
        const startOrigin = this.gridSystem.getGridOrigin(this.startPos.x, this.startPos.y);
        this.gridGraphics.fillStyle(0x00ff00, 0.5); // Green for Start
        this.gridGraphics.fillRect(startOrigin.x, startOrigin.y, tileSize, tileSize);

        const endOrigin = this.gridSystem.getGridOrigin(this.endPos.x, this.endPos.y);
        this.gridGraphics.fillStyle(0xff0000, 0.5); // Red for End
        this.gridGraphics.fillRect(endOrigin.x, endOrigin.y, tileSize, tileSize);
    }

    private setupInput() {
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            const gridPos = this.gridSystem.worldToGrid(pointer.x, pointer.y);
            this.updateHighlight(gridPos);
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const gridPos = this.gridSystem.worldToGrid(pointer.x, pointer.y);
            if (gridPos) {
                if (this.selectedTrap) {
                    // Place trap
                    if (this.economyManager.canAfford(this.selectedTrap.cost)) {
                        if (this.gridSystem.placeTrap(gridPos.x, gridPos.y, this.selectedTrap)) {
                            this.economyManager.spendGold(this.selectedTrap.cost);
                            this.drawTraps();
                        } else {
                            // Maybe remove trap if clicking on existing one?
                            // Removing logic could also refund? For now, simple remove.
                            this.gridSystem.removeTrap(gridPos.x, gridPos.y);
                            this.drawTraps();
                        }
                    } else {
                        console.log('Not enough gold!');
                    }
                } else {
                    // Toggle wall (Cost: 10 for example, or free for now? Let's make it cost 10)
                    const WALL_COST = 10;
                    const cell = this.gridSystem.getCell(gridPos.x, gridPos.y);

                    if (cell && !cell.isWall) {
                        // Building wall
                        if (this.economyManager.canAfford(WALL_COST)) {
                            if (this.gridSystem.toggleWall(gridPos.x, gridPos.y)) {
                                this.economyManager.spendGold(WALL_COST);
                                this.drawWalls();
                                this.updatePath();
                            }
                        }
                    } else {
                        // Removing wall (Refund? Or just remove)
                        if (this.gridSystem.toggleWall(gridPos.x, gridPos.y)) {
                            // Wall removed (toggleWall returns new state, so if false it means removed)
                        } else {
                            // Wall removed
                            this.drawWalls();
                            this.updatePath();
                        }
                    }
                }
            }
        });
    }

    private drawWalls() {
        if (!this.wallGraphics) return;
        this.wallGraphics.clear();
        this.wallGraphics.fillStyle(0x888888, 1);

        const width = this.gridSystem.getWidth();
        const height = this.gridSystem.getHeight();
        const tileSize = this.gridSystem.getTileSize();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (!this.gridSystem.isWalkable(x, y)) {
                    const origin = this.gridSystem.getGridOrigin(x, y);
                    this.wallGraphics.fillRect(origin.x, origin.y, tileSize, tileSize);
                }
            }
        }
    }

    private drawTraps() {
        if (!this.trapGraphics) return;
        this.trapGraphics.clear();

        const width = this.gridSystem.getWidth();
        const height = this.gridSystem.getHeight();
        const tileSize = this.gridSystem.getTileSize();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cell = this.gridSystem.getCell(x, y);
                if (cell && cell.trap) {
                    const origin = this.gridSystem.getGridOrigin(x, y);
                    this.trapGraphics.fillStyle(cell.trap.color, 0.8);
                    // Draw a smaller rect for trap
                    const padding = 10;
                    this.trapGraphics.fillRect(origin.x + padding, origin.y + padding, tileSize - padding * 2, tileSize - padding * 2);
                }
            }
        }
    }

    private drawAdventurers() {
        if (!this.adventurerGraphics) return;
        this.adventurerGraphics.clear();

        const adventurers = this.waveManager.getAdventurers();

        for (const adv of adventurers) {
            // Draw adventurer body
            this.adventurerGraphics.fillStyle(0xffffff, 1); // White for adventurers
            this.adventurerGraphics.fillCircle(adv.worldPosition.x, adv.worldPosition.y, 15);

            // Draw Health Bar
            const width = 40;
            const height = 6;
            const x = adv.worldPosition.x - width / 2;
            const y = adv.worldPosition.y - 25;

            // Background (Red)
            this.adventurerGraphics.fillStyle(0xff0000, 1);
            this.adventurerGraphics.fillRect(x, y, width, height);

            // Foreground (Green)
            const hpPercent = Math.max(0, adv.hp / adv.maxHp);
            this.adventurerGraphics.fillStyle(0x00ff00, 1);
            this.adventurerGraphics.fillRect(x, y, width * hpPercent, height);
        }
    }

    private updatePath() {
        if (!this.pathGraphics) return;
        this.pathGraphics.clear();

        const path = this.pathfinding.findPath(this.startPos, this.endPos);

        if (path.length > 0) {
            this.pathGraphics.lineStyle(4, 0xffff00, 1); // Yellow path
            this.pathGraphics.beginPath();

            const startWorld = this.gridSystem.gridToWorld(path[0].x, path[0].y);
            this.pathGraphics.moveTo(startWorld.x, startWorld.y);

            for (let i = 1; i < path.length; i++) {
                const worldPos = this.gridSystem.gridToWorld(path[i].x, path[i].y);
                this.pathGraphics.lineTo(worldPos.x, worldPos.y);
            }

            this.pathGraphics.strokePath();
        }
    }

    private updateHighlight(gridPos: { x: number, y: number } | null) {
        if (!this.highlightGraphics) return;

        this.highlightGraphics.clear();

        if (gridPos) {
            const origin = this.gridSystem.getGridOrigin(gridPos.x, gridPos.y);
            const tileSize = this.gridSystem.getTileSize();

            this.highlightGraphics.fillStyle(0x00ff00, 0.3);
            this.highlightGraphics.fillRect(origin.x, origin.y, tileSize, tileSize);
        }
    }
}
