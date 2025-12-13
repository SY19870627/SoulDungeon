import Phaser from 'phaser';
import { GridSystem } from './GridSystem';

export class DungeonRenderer {
    // Depths
    public static readonly DEPTH_GRID = 0;
    public static readonly DEPTH_TRAP = 10;
    public static readonly DEPTH_WALL = 20;
    public static readonly DEPTH_ADVENTURER = 30;
    public static readonly DEPTH_HIGHLIGHT = 100;

    private scene: Phaser.Scene;
    private gridSystem: GridSystem;

    private gridGraphics: Phaser.GameObjects.Graphics;
    private wallGraphics: Phaser.GameObjects.Graphics;

    private trapGroup: Phaser.GameObjects.Group;
    private trapSprites: Map<string, Phaser.GameObjects.Sprite>;

    constructor(scene: Phaser.Scene, gridSystem: GridSystem) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.trapSprites = new Map();

        this.gridGraphics = scene.add.graphics();
        this.gridGraphics.setDepth(DungeonRenderer.DEPTH_GRID);

        this.wallGraphics = scene.add.graphics();
        this.wallGraphics.setDepth(DungeonRenderer.DEPTH_WALL);

        this.trapGroup = scene.add.group();
        this.trapGroup.setDepth(DungeonRenderer.DEPTH_TRAP);
    }

    public drawGrid(startPos: { x: number, y: number }, endPos: { x: number, y: number }) {
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
        const startOrigin = this.gridSystem.getGridOrigin(startPos.x, startPos.y);
        this.gridGraphics.fillStyle(0x00ff00, 0.5);
        this.gridGraphics.fillRect(startOrigin.x, startOrigin.y, tileSize, tileSize);

        const endOrigin = this.gridSystem.getGridOrigin(endPos.x, endPos.y);
        this.gridGraphics.fillStyle(0xff0000, 0.5);
        this.gridGraphics.fillRect(endOrigin.x, endOrigin.y, tileSize, tileSize);
    }

    public drawWalls() {
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

    public syncTrapSprites() {
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
                    const trapType = cell.trap.type;

                    // Map trap type to texture key
                    let textureKey = 'trap_spike';
                    if (cell.trap.config.id) {
                        const id = cell.trap.config.id;
                        // Direct mapping
                        if (id === 'spike') textureKey = 'trap_spike';
                        else if (id === 'spring') textureKey = 'trap_spring';
                        else if (id === 'bear_trap') textureKey = 'trap_bear';
                        else if (id === 'rune') textureKey = 'trap_rune';
                        else if (id === 'burning_oil') textureKey = 'burning_oil';
                        else if (['oil', 'fire', 'lightning', 'water', 'poison', 'fan'].includes(id)) {
                            textureKey = id;
                        } else {
                            // Fallback
                            textureKey = 'trap_spike';
                        }
                    }

                    if (!sprite) {
                        const origin = this.gridSystem.getGridOrigin(x, y);
                        sprite = this.scene.add.sprite(origin.x + tileSize / 2, origin.y + tileSize / 2, textureKey);
                        sprite.setDisplaySize(tileSize, tileSize);
                        this.trapGroup.add(sprite);
                        this.trapSprites.set(key, sprite);
                    } else {
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

    public refresh() {
        this.drawWalls();
        this.syncTrapSprites();
    }

    public animateTrapTrigger(gridX: number, gridY: number): void {
        const key = `${gridX},${gridY}`;
        const sprite = this.trapSprites.get(key);
        if (sprite) {
            this.scene.tweens.add({
                targets: sprite,
                scale: 1.5, // Relative directly? Or absolute? SetDisplaySize sets scale based on texture. 
                // Since we use setDisplaySize(tileSize, tileSize), the scale might be !1.
                // To be safe, let's use a scale multiplier or just hard punch it.
                // Better: scaleX/scaleY relative to current.
                scaleX: sprite.scaleX * 1.5,
                scaleY: sprite.scaleY * 1.5,
                duration: 150,
                yoyo: true,
                ease: 'Back.out'
            });
        }
    }
}
