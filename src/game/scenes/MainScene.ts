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
    private pathGraphics: Phaser.GameObjects.Graphics | null = null;

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

        // Initialize Renderer
        this.dungeonRenderer = new DungeonRenderer(this, this.gridSystem);

        this.highlightGraphics = this.add.graphics();
        this.highlightGraphics.setDepth(DungeonRenderer.DEPTH_HIGHLIGHT);

        this.pathGraphics = this.add.graphics();
        this.pathGraphics.setDepth(DungeonRenderer.DEPTH_HIGHLIGHT); // Path on top

        // Initialize Tools
        this.wallTool = new WallTool(this);
        this.trapTool = new TrapTool(this);
        this.sellTool = new SellTool(this);
        this.currentTool = this.wallTool; // Default

        this.dungeonRenderer.drawGrid(this.startPos, this.endPos);
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
        this.dungeonRenderer.refresh();
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
