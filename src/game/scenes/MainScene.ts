import Phaser from 'phaser';
import { ToolType, TOOLS } from '../../data/tools';
import { GridSystem } from '../systems/GridSystem';
import { Hero } from '../objects/Hero';
import { HEROES, HeroType } from '../../data/heroes';

// Define combo visuals mapping
const COMBO_VISUALS: Record<string, { icon: string, color: number }> = {
    inferno: { icon: '🌋', color: 0xe74c3c },
    electric_swamp: { icon: '💠', color: 0x3498db },
    toxic_cloud: { icon: '🤢', color: 0x2ecc71 }
};

export class MainScene extends Phaser.Scene {
    private gridSize = 50;
    private mapSize = 7;
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private items: Map<string, Phaser.GameObjects.Text>;
    private currentTool: ToolType = 'spring';
    private gridSystem!: GridSystem;

    private heroes: Hero[] = [];
    private isSimulating = false;

    constructor() {
        super({ key: 'MainScene' });
        this.items = new Map();
    }

    create() {
        // Initialize Grid System
        this.gridSystem = new GridSystem(this.mapSize, this.mapSize, (x, y, type, rotate) => {
            this.updateGridVisual(x, y, type, rotate);
        });

        this.createGrid();
        this.setupInteraction();

        // Listen for tool changes from React
        this.game.events.on('tool-changed', (tool: ToolType) => {
            this.currentTool = tool;
        });

        // Listen for spawn events
        this.game.events.on('spawn-hero', (type: HeroType) => {
            this.spawnHero(type);
        });
    }

    private createGrid() {
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0x444444, 1);

        const totalSize = this.gridSize * this.mapSize;

        for (let x = 0; x <= totalSize; x += this.gridSize) {
            this.gridGraphics.moveTo(x, 0);
            this.gridGraphics.lineTo(x, totalSize);
        }

        for (let y = 0; y <= totalSize; y += this.gridSize) {
            this.gridGraphics.moveTo(0, y);
            this.gridGraphics.lineTo(totalSize, y);
        }

        this.gridGraphics.strokePath();

        const offsetX = (this.cameras.main.width - totalSize) / 2;
        const offsetY = (this.cameras.main.height - totalSize) / 2;
        this.cameras.main.setScroll(-offsetX, -offsetY);
    }

    private setupInteraction() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;

            const gridX = Math.floor(worldX / this.gridSize);
            const gridY = Math.floor(worldY / this.gridSize);

            if (gridX >= 0 && gridX < this.mapSize && gridY >= 0 && gridY < this.mapSize) {
                this.handleGridClick(gridX, gridY, pointer);
            }
        });
    }

    private handleGridClick(x: number, y: number, pointer: Phaser.Input.Pointer) {
        // Right click or Eraser
        if (pointer.rightButtonDown() || this.currentTool === 'eraser') {
            this.gridSystem.setCell(x, y, 'empty' as any); // 'empty' is handled as clear
            return;
        }

        // Place item via System
        this.gridSystem.setCell(x, y, this.currentTool);
    }

    private updateGridVisual(x: number, y: number, type: string, rotate: number) {
        const key = `${x},${y}`;

        // Always remove old visual first
        if (this.items.has(key)) {
            this.items.get(key)?.destroy();
            this.items.delete(key);
        }

        if (type === 'empty') return;

        let icon = '';
        let color = '#ffffff';

        // Check standard tools
        const toolDef = TOOLS.find(t => t.id === type);
        if (toolDef) {
            icon = toolDef.icon;
        }
        // Check combos
        else if (COMBO_VISUALS[type]) {
            icon = COMBO_VISUALS[type].icon;
            // We could use tint, but for Text object color style is string
            // For now just use icon
        }

        if (!icon) return;

        const text = this.add.text(
            x * this.gridSize + this.gridSize / 2,
            y * this.gridSize + this.gridSize / 2,
            icon,
            { fontSize: '32px', color: color }
        );
        text.setOrigin(0.5);
        text.setRotation(rotate * Math.PI / 2); // 90 degrees per rotation step

        this.items.set(key, text);

        // Animation
        this.tweens.add({
            targets: text,
            scale: { from: 0.5, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }

    private async spawnHero(type: HeroType) {
        if (this.isSimulating) return; // Simple single-hero simulation for now
        this.isSimulating = true;

        const def = HEROES[type];
        const startX = 0;
        const startY = 0;

        const hero = new Hero(this,
            startX * this.gridSize + this.gridSize / 2,
            startY * this.gridSize + this.gridSize / 2,
            def
        );
        hero.gridX = startX;
        hero.gridY = startY;
        this.heroes.push(hero);

        await this.runSimulation(hero);
    }

    private async runSimulation(hero: Hero) {
        let steps = 0;
        const maxSteps = 30;

        while (steps < maxSteps && hero.currentHp > 0) {
            steps++;
            await new Promise(r => setTimeout(r, 500)); // Wait a bit

            // 1. AI Decision
            const nextPos = this.gridSystem.getSmartMove(hero.gridX, hero.gridY, hero.definition.id);

            // 2. Move
            await hero.moveGrid(nextPos.x, nextPos.y, this.gridSize);

            // 3. Check Traps/Environment
            this.checkCellInteraction(hero);

            // 4. Check Goal
            if (hero.gridX === this.mapSize - 1 && hero.gridY === this.mapSize - 1) {
                console.log('Hero escaped!');
                hero.setAlpha(0.5);
                break;
            }
        }

        if (hero.currentHp <= 0) {
            console.log('Hero died!');
            hero.destroy();
        } else {
            // Cleanup after run
            setTimeout(() => {
                hero.destroy();
                this.heroes = this.heroes.filter(h => h !== hero);
            }, 1000);
        }

        this.isSimulating = false;
    }

    private checkCellInteraction(hero: Hero) {
        const cell = this.gridSystem.getCell(hero.gridX, hero.gridY);
        if (!cell) return;

        let damage = 0;

        // Trap Logic
        if (cell.type === 'spike') damage = 30;
        if (cell.type === 'inferno') damage = 60;
        if (cell.type === 'electric_swamp') damage = 60;
        if (cell.type === 'toxic_cloud') damage = 50;

        // Spring Logic (Instant Move)
        if (cell.type === 'spring') {
            // TODO: Implement spring push logic similar to game.html
            // For now just log it
            console.log('Spring triggered!');
        }

        // Lure Logic (Eat it)
        if (cell.type === hero.definition.lure) {
            console.log('Lure eaten!');
            this.gridSystem.setCell(hero.gridX, hero.gridY, 'empty');
        }

        if (damage > 0) {
            const dead = hero.takeDamage(damage);
            if (dead) {
                // Hero death handled in loop
            }
        }
    }
}
