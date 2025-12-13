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
    // Depths
    public static readonly DEPTH_GRID = 0;
    public static readonly DEPTH_TRAP = 10;
    public static readonly DEPTH_WALL = 20;
    public static readonly DEPTH_ADVENTURER = 30;
    public static readonly DEPTH_HIGHLIGHT = 100;

    private gridSystem!: GridSystem;
    private pathfinding!: Pathfinding;
    private waveManager!: WaveManager;
    private economyManager!: EconomyManager;

    private gridGraphics: Phaser.GameObjects.Graphics | null = null;
    private highlightGraphics: Phaser.GameObjects.Graphics | null = null;
    private pathGraphics: Phaser.GameObjects.Graphics | null = null;
    private wallGraphics: Phaser.GameObjects.Graphics | null = null;
    // private trapGraphics: Phaser.GameObjects.Graphics | null = null; // Removed

    private trapGroup!: Phaser.GameObjects.Group;
    private trapSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

    private startPos = { x: 0, y: 0 };
    private endPos = { x: 9, y: 9 };

    private currentTool: Tool | null = null;
    private wallTool!: WallTool;
    private trapTool!: TrapTool;
    private sellTool!: SellTool;

    constructor() {
        super('MainScene');
    }

    preload() {
        // Load Assets
        this.load.image('floor', 'assets/floor.png');
        this.load.image('wall', 'assets/wall.png');
        this.load.image('trap_spike', 'assets/trap_spike.png');
        this.load.image('trap_spring', 'assets/trap_spring.png');

        // Elements
        this.load.image('oil', 'assets/oil.png');
        this.load.image('fire', 'assets/fire.png');
        this.load.image('lightning', 'assets/lightning.png');
        this.load.image('water', 'assets/water.png');
        this.load.image('poison', 'assets/poison.png');
        this.load.image('fan', 'assets/fan.png');

        // Hero Static Asset
        this.load.image('hero', 'assets/hero.png');
    }

    create() {
        // Animations
        // Animations - DEPRECATED
        // No longer using frame animations. Using Tweens.

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
        this.gridGraphics.setDepth(MainScene.DEPTH_GRID);

        this.highlightGraphics = this.add.graphics();
        this.highlightGraphics.setDepth(MainScene.DEPTH_HIGHLIGHT);

        this.pathGraphics = this.add.graphics();
        this.pathGraphics.setDepth(MainScene.DEPTH_HIGHLIGHT); // Path on top

        this.wallGraphics = this.add.graphics();
        this.wallGraphics.setDepth(MainScene.DEPTH_WALL);

        this.trapGroup = this.add.group();
        this.trapGroup.setDepth(MainScene.DEPTH_TRAP);

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
        this.syncTrapSprites();
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
            const { tool, trapConfig } = e.detail;

            if (tool === 'wall') {
                this.currentTool = this.wallTool;
            } else if (tool === 'trap') {
                this.currentTool = this.trapTool;
                if (trapConfig) {
                    this.trapTool.setTrap(trapConfig);
                }
            } else if (tool === 'sell') {
                this.currentTool = this.sellTool;
            }

            console.log(`Tool changed: ${tool}`, trapConfig);
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

                // Optional: Draw floor here if desired, but might be too resource heavy for graphics?
                // Using a persistent tilemap or sprites for floor is better.
                // For now, keeping wireframe grid.
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
        // this.wallGraphics.fillStyle(0x888888, 1);

        const width = this.gridSystem.getWidth();
        const height = this.gridSystem.getHeight();
        const tileSize = this.gridSystem.getTileSize();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (!this.gridSystem.isWalkable(x, y)) {
                    const origin = this.gridSystem.getGridOrigin(x, y);
                    // Use Image instead of Graphics? 
                    // Keeping wall as graphics for now as requested? 
                    // The checklist says "MainScene.ts ... load.image(wall)".
                    // But Adventurer.ts says "Adventurer Refactor".
                    // Trap Rendering Refactor says "Trap Rendering".
                    // I will use wall.png here by creating Sprites? 
                    // The prompt didn't explicitly ask to refactor Walls to sprites, but it said "ensure floor.png, wall.png".
                    // It's better to use sprites for walls too if I want it to look good.
                    // But I'll stick to graphics for walls if not explicitly asked to refactor Wall Rendering.
                    // Actually, "Trap Rendering Refactor" is Section 4. "Adventurer Refactor" is Section 3.
                    // Section 1 says "Ensure... wall.png".
                    // I'll stick to the requested scope for now (Trap Rendering).
                    this.wallGraphics.fillStyle(0x888888, 1);
                    this.wallGraphics.fillRect(origin.x, origin.y, tileSize, tileSize);
                }
            }
        }
    }

    private syncTrapSprites() {
        const width = this.gridSystem.getWidth();
        const height = this.gridSystem.getHeight();
        const tileSize = this.gridSystem.getTileSize();

        // Mark all sprites as potentially removable
        const processedKeys = new Set<string>();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cell = this.gridSystem.getCell(x, y);
                if (cell && cell.trap) {
                    const key = `${x},${y}`;
                    processedKeys.add(key);

                    let sprite = this.trapSprites.get(key);
                    const trapType = cell.trap.type; // e.g., 'spike', 'fan', 'oil'
                    // Map trap type to texture key
                    let textureKey = 'trap_spike'; // fallback
                    if (trapType === 'spike') textureKey = 'trap_spike';
                    else if (trapType === 'spring') textureKey = 'trap_spring';
                    else if (trapType === 'oil') textureKey = 'oil';
                    else if (trapType === 'fire') textureKey = 'fire';
                    else if (trapType === 'lightning') textureKey = 'lightning';
                    else if (trapType === 'water') textureKey = 'water';
                    else if (trapType === 'poison') textureKey = 'poison';
                    else if (trapType === 'fan') textureKey = 'fan';
                    // Note: If you have different trap types (e.g. 'physics'), check logical type mapping.
                    // In your earlier conversations, types were 'damage', 'slow', 'physics' + 'elemental'.
                    // I assume 'type' holds the specific key now or I need to check configs.
                    // Assuming trap.config.id or a mapped type. 
                    // Let's rely on trap.config.id or type.
                    // If trap.type is 'physics', check config.id (spring?).
                    // Let's assume the IDs align with asset names or simple logical mapping.

                    if (cell.trap.config.id === 'trap_spring') textureKey = 'trap_spring';
                    // Override based on specific known IDs if needed.

                    if (!sprite) {
                        const origin = this.gridSystem.getGridOrigin(x, y);
                        sprite = this.add.sprite(origin.x + tileSize / 2, origin.y + tileSize / 2, textureKey);
                        sprite.setDisplaySize(tileSize, tileSize); // Adjust to fit
                        this.trapGroup.add(sprite);
                        this.trapSprites.set(key, sprite);
                    } else {
                        // Update texture if changed (e.g. synergy transformation)
                        if (sprite.texture.key !== textureKey) {
                            sprite.setTexture(textureKey);
                        }
                    }

                    // Update Rotation
                    if (cell.trap.direction) {
                        const dir = cell.trap.direction;
                        let angle = 0;
                        if (dir === 'up') angle = 0;
                        else if (dir === 'right') angle = 90;
                        else if (dir === 'down') angle = 180;
                        else if (dir === 'left') angle = 270;
                        sprite.setAngle(angle);
                    }
                }
            }
        }

        // Cleanup removed traps
        for (const [key, sprite] of this.trapSprites) {
            if (!processedKeys.has(key)) {
                sprite.destroy();
                this.trapSprites.delete(key);
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
