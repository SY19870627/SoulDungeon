import Phaser from 'phaser';
import { GridSystem, Trap } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';
import { WaveManager } from '../systems/WaveManager';
import { EconomyManager } from '../systems/EconomyManager';
import { Tool } from '../tools/Tool';
import { WallTool } from '../tools/WallTool';
import { TrapTool } from '../tools/TrapTool';
import { SellTool } from '../tools/SellTool';

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

    private startPos = { x: 0, y: 0 };
    private endPos = { x: 9, y: 9 };

    private currentTool: Tool | null = null;
    private wallTool!: WallTool;
    private trapTool!: TrapTool;
    private sellTool!: SellTool;

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

        // Initialize Tools
        this.wallTool = new WallTool(this);
        this.trapTool = new TrapTool(this);
        this.sellTool = new SellTool(this);
        this.currentTool = this.wallTool; // Default

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
    }

    // --- Public API for Tools ---

    public getGridSystem(): GridSystem {
        return this.gridSystem;
    }

    public getEconomyManager(): EconomyManager {
        return this.economyManager;
    }

    public refresh() {
        this.drawWalls();
        this.drawTraps();
        this.updatePath();
    }

    public rotateTrap(trap: Trap) {
        if (!trap.direction) {
            trap.direction = 'up';
        }

        const directions = ['up', 'right', 'down', 'left'] as const;
        const currentIndex = directions.indexOf(trap.direction);
        const nextIndex = (currentIndex + 1) % 4;
        trap.direction = directions[nextIndex];
        console.log(`Rotated trap to ${trap.direction}`);
    }

    public updateHighlight(gridX: number, gridY: number) {
        if (!this.highlightGraphics) return;
        this.highlightGraphics.clear();

        const origin = this.gridSystem.getGridOrigin(gridX, gridY);
        const tileSize = this.gridSystem.getTileSize();

        this.highlightGraphics.fillStyle(0x00ff00, 0.3);
        this.highlightGraphics.fillRect(origin.x, origin.y, tileSize, tileSize);
    }

    // ---------------------------

    private setupEvents() {
        window.addEventListener('tool-changed', (e: any) => {
            const { tool, trap } = e.detail;

            if (tool === 'wall') {
                this.currentTool = this.wallTool;
            } else if (tool === 'trap') {
                this.currentTool = this.trapTool;
                if (trap) {
                    this.trapTool.setTrap(trap);
                }
            } else if (tool === 'sell') {
                this.currentTool = this.sellTool;
            }

            console.log(`Tool changed: ${tool}`, trap);
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
            if (gridPos && this.currentTool) {
                this.currentTool.handlePointerMove(gridPos.x, gridPos.y);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const gridPos = this.gridSystem.worldToGrid(pointer.x, pointer.y);
            if (gridPos && this.currentTool) {
                this.currentTool.handlePointerDown(gridPos.x, gridPos.y);
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

                    const padding = 10;
                    const cx = origin.x + tileSize / 2;
                    const cy = origin.y + tileSize / 2;

                    this.trapGraphics.fillRect(origin.x + padding, origin.y + padding, tileSize - padding * 2, tileSize - padding * 2);

                    // Draw direction indicator for Spring
                    if (cell.trap.type === 'spring' && cell.trap.direction) {
                        this.trapGraphics.fillStyle(0xffffff, 1);

                        const dir = cell.trap.direction;
                        const arrowSize = 10;

                        this.trapGraphics.beginPath();
                        if (dir === 'up') {
                            this.trapGraphics.moveTo(cx, cy - arrowSize);
                            this.trapGraphics.lineTo(cx - arrowSize, cy + arrowSize);
                            this.trapGraphics.lineTo(cx + arrowSize, cy + arrowSize);
                        } else if (dir === 'down') {
                            this.trapGraphics.moveTo(cx, cy + arrowSize);
                            this.trapGraphics.lineTo(cx - arrowSize, cy - arrowSize);
                            this.trapGraphics.lineTo(cx + arrowSize, cy - arrowSize);
                        } else if (dir === 'left') {
                            this.trapGraphics.moveTo(cx - arrowSize, cy);
                            this.trapGraphics.lineTo(cx + arrowSize, cy - arrowSize);
                            this.trapGraphics.lineTo(cx + arrowSize, cy + arrowSize);
                        } else if (dir === 'right') {
                            this.trapGraphics.moveTo(cx + arrowSize, cy);
                            this.trapGraphics.lineTo(cx - arrowSize, cy - arrowSize);
                            this.trapGraphics.lineTo(cx - arrowSize, cy + arrowSize);
                        }
                        this.trapGraphics.fillPath();
                    }
                }
            }
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
}
