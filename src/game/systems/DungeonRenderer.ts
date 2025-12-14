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
    private entranceSprite: Phaser.GameObjects.Sprite | null = null;

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

    public drawGrid(startPos: { x: number, y: number }) {
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

        // Draw Start marker (Entrance)
        const startOrigin = this.gridSystem.getGridOrigin(startPos.x, startPos.y);

        if (this.entranceSprite) {
            this.entranceSprite.destroy();
        }

        this.entranceSprite = this.scene.add.sprite(startOrigin.x + tileSize / 2, startOrigin.y + tileSize / 2, 'entrance');
        this.entranceSprite.setDisplaySize(tileSize, tileSize);
        this.entranceSprite.setDepth(DungeonRenderer.DEPTH_GRID + 1); // Slightly above grid lines
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
                        else if (id === 'campfire') textureKey = 'trap_campfire'; // New Mapping
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
                        sprite.setData('baseScaleX', sprite.scaleX);
                        sprite.setData('baseScaleY', sprite.scaleY);
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
        // Cleanup removed traps
        for (const [key, sprite] of this.trapSprites) {
            if (!processedKeys.has(key)) {
                // If sprite is animating (e.g. trigger animation), let it finish before destroying
                if (this.scene.tweens.isTweening(sprite)) {
                    this.trapSprites.delete(key); // Stop tracking it
                    // Force destroy after safe delay
                    this.scene.time.delayedCall(1000, () => {
                        if (sprite && sprite.active) sprite.destroy();
                    });
                } else {
                    sprite.destroy();
                    this.trapSprites.delete(key);
                }
            }
        }
    }

    public refresh() {
        this.drawWalls();
        this.syncTrapSprites();
    }

    public animateTrapTrigger(gridX: number, gridY: number, trapId?: string): void {
        const key = `${gridX},${gridY}`;
        const sprite = this.trapSprites.get(key);
        if (sprite) {
            this.scene.tweens.killTweensOf(sprite); // Stop existing animations

            // Use stored base scale if available, otherwise fallback (safer init)
            let baseX = sprite.getData('baseScaleX');
            let baseY = sprite.getData('baseScaleY');

            if (baseX === undefined || baseY === undefined) {
                baseX = sprite.scaleX;
                baseY = sprite.scaleY;
                sprite.setData('baseScaleX', baseX);
                sprite.setData('baseScaleY', baseY);
            }

            // Force reset to base scale to ensure clean start
            sprite.setScale(baseX, baseY);
            sprite.setAlpha(1);

            switch (trapId) {
                case 'spike':
                    // Spike Animation: Sink -> Stab -> Return
                    const startY = sprite.y; // Keep track of original Y
                    this.scene.tweens.chain({
                        targets: sprite,
                        tweens: [
                            // 1. Anticipation (Sink & Squash)
                            {
                                y: startY + 15,
                                scaleY: baseY * 0.8,
                                scaleX: baseX * 1.2,
                                duration: 80,
                                ease: 'Quad.out'
                            },
                            // 2. Attack (Thrust Up & Stretch)
                            {
                                y: startY - 20,
                                scaleY: baseY * 1.5,
                                scaleX: baseX * 0.7,
                                duration: 50,
                                ease: 'Back.out'
                            },
                            // 3. Recover (Return to idle)
                            {
                                y: startY,
                                scaleY: baseY,
                                scaleX: baseX,
                                duration: 150,
                                ease: 'Quad.out'
                            }
                        ]
                    });
                    break;

                case 'bear_trap':
                    // 強化版捕獸夾動畫: 蓄力 -> 咬合 -> 晃動
                    sprite.setTint(0xffaa00); // 閃爍顏色警告

                    const originX = sprite.x;

                    this.scene.tweens.chain({
                        targets: sprite,
                        tweens: [
                            // 1. Anticipation (張開)
                            {
                                scaleX: baseX * 1.4,
                                scaleY: baseY * 0.8,
                                duration: 100,
                                ease: 'Quad.out'
                            },
                            // 2. Snap (咬合)
                            {
                                scaleX: baseX * 0.4, // 夾緊
                                scaleY: baseY * 1.2,
                                duration: 50,
                                ease: 'Back.in',
                                onComplete: () => {
                                    // 咬合瞬間震動畫面
                                    this.scene.cameras.main.shake(100, 0.002);
                                    sprite.setTint(0xff0000); // 變紅代表傷害
                                }
                            },
                            // 3. Struggle/Shake (掙扎晃動)
                            {
                                targets: sprite,
                                x: { from: originX - 3, to: originX + 3 },
                                duration: 40,
                                yoyo: true,
                                repeat: 5, // 持續約 200ms
                                ease: 'Linear'
                            },
                            // 4. Hold & Reset
                            {
                                scaleX: baseX,
                                scaleY: baseY,
                                x: originX,
                                duration: 200,
                                delay: 200,
                                onComplete: () => {
                                    sprite.clearTint();
                                }
                            }
                        ]
                    });
                    break;

                case 'campfire':
                    // Pulse / Warm Glow Animation
                    this.scene.tweens.add({
                        targets: sprite,
                        scaleX: baseX * 1.1,
                        scaleY: baseY * 1.1,
                        duration: 500,
                        yoyo: true,
                        repeat: 1,
                        ease: 'Sine.easeInOut'
                    });
                    this.scene.tweens.add({
                        targets: sprite,
                        alpha: 0.8,
                        duration: 300,
                        yoyo: true,
                        repeat: 3
                    });
                    break;
                case 'spring':
                    // Boing: Press then Shoot
                    this.scene.tweens.chain({
                        targets: sprite,
                        tweens: [
                            {
                                scaleY: baseY * 0.5,
                                scaleX: baseX * 1.4,
                                duration: 100,
                                ease: 'Quad.out'
                            },
                            {
                                scaleY: baseY * 1.5,
                                scaleX: baseX * 0.8,
                                duration: 150,
                                ease: 'Back.out'
                            },
                            {
                                scaleY: baseY,
                                scaleX: baseX,
                                duration: 100,
                                ease: 'Bounce.out'
                            }
                        ]
                    });
                    break;

                case 'rune':
                case 'fire':
                case 'burning_oil':
                    // Pulse: Alpha Flash + Rotate/Scale
                    this.scene.tweens.add({
                        targets: sprite,
                        alpha: 0.5,
                        scaleX: baseX * 1.2,
                        scaleY: baseY * 1.2,
                        angle: sprite.angle + 15,
                        duration: 150,
                        yoyo: true,
                        repeat: 2
                    });
                    break;

                default:
                    // Default Bounce
                    this.scene.tweens.add({
                        targets: sprite,
                        scaleX: baseX * 1.5,
                        scaleY: baseY * 1.5,
                        duration: 100,
                        yoyo: true,
                        ease: 'Back.out'
                    });
                    break;
            }
        }
    }
}
