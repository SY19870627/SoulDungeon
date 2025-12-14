import Phaser from 'phaser';
import { GridSystem, Trap } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';
import { WaveManager } from '../systems/WaveManager';
import { EconomyManager } from '../systems/EconomyManager';
import { DungeonRenderer } from '../systems/DungeonRenderer';
import { Tool } from '../tools/Tool';
import { WallTool } from '../tools/WallTool';
import { TrapTool } from '../tools/TrapTool';
import { SellTool } from '../tools/SellTool';

export class MainScene extends Phaser.Scene {
    private gridSystem!: GridSystem;
    private pathfinding!: Pathfinding;
    private waveManager!: WaveManager;
    private economyManager!: EconomyManager;
    private dungeonRenderer!: DungeonRenderer;

    private highlightGraphics: Phaser.GameObjects.Graphics | null = null;

    private startPos = { x: 0, y: 0 };

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
        this.load.image('trap_bear', 'assets/trap_bear.png'); // New
        this.load.image('trap_rune', 'assets/trap_rune.png'); // New

        // Load Level Data
        this.load.json('level1', 'levels/level_01.json');

        // Elements
        this.load.image('oil', 'assets/oil.png');
        this.load.image('fire', 'assets/fire.png');
        this.load.image('burning_oil', 'assets/burning_oil.png'); // New

        // Element Fallbacks/Renamed?
        this.load.image('lightning', 'assets/lightning.png');
        this.load.image('water', 'assets/water.png');
        this.load.image('poison', 'assets/poison.png');
        this.load.image('fan', 'assets/fan.png');

        // Hero Static Asset
        this.load.image('hero', 'assets/Adventurer_Male_LV1.png');
        this.load.image('entrance', 'assets/entrance.png'); // New Entrance Asset
    }

    create() {
        // Calculate offsets to center the grid
        // Initialize GridSystem from Level Data
        const levelData = this.cache.json.get('level1');
        const gridWidth = levelData.width;
        const gridHeight = levelData.height;
        const tileSize = 64;

        const totalWidth = gridWidth * tileSize;
        const totalHeight = gridHeight * tileSize;

        const offsetX = (this.scale.width - totalWidth) / 2;
        const offsetY = (this.scale.height - totalHeight) / 2;

        this.gridSystem = new GridSystem(gridWidth, gridHeight, tileSize, offsetX, offsetY);

        // Parse Layout
        const layout = levelData.layout;
        for (let y = 0; y < layout.length; y++) {
            const row = layout[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === 'W') {
                    this.gridSystem.toggleWall(x, y);
                } else if (char === 'S') {
                    this.startPos = { x, y };
                }
            }
        }

        this.pathfinding = new Pathfinding(this.gridSystem);
        this.waveManager = new WaveManager(this, this.gridSystem, this.pathfinding);
        this.waveManager.setSpawnPoint(this.startPos); // New
        this.economyManager = new EconomyManager(1000); // Start with 1000 gold
        this.waveManager.setEconomyManager(this.economyManager);

        // Initialize Renderer
        this.dungeonRenderer = new DungeonRenderer(this, this.gridSystem);

        this.highlightGraphics = this.add.graphics();
        this.highlightGraphics.setDepth(DungeonRenderer.DEPTH_HIGHLIGHT);

        // Initialize Tools
        this.wallTool = new WallTool(this);
        this.trapTool = new TrapTool(this);
        this.sellTool = new SellTool(this);
        this.currentTool = this.wallTool; // Default

        this.dungeonRenderer.drawGrid(this.startPos);
        this.setupInput();
        this.setupEvents();

        // Initial gold update
        this.time.delayedCall(100, () => {
            window.dispatchEvent(new CustomEvent('gold-updated', { detail: this.economyManager.getGold() }));
        });

        // Initial Refresh to render loaded walls
        this.refresh();
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
        this.dungeonRenderer.refresh();
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

    public animateTrapTrigger(gridX: number, gridY: number, trapId?: string) {
        this.dungeonRenderer.animateTrapTrigger(gridX, gridY, trapId);
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

        window.addEventListener('grid-updated', () => {
            this.refresh();
        });

        window.addEventListener('trap-triggered', (e: any) => {
            const detail = e.detail;
            if (detail) {
                this.animateTrapTrigger(detail.x, detail.y, detail.id);
            }
        });
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
}
