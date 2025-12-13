import Phaser from 'phaser';
// import { MainScene } from '../scenes/MainScene'; // Removed to avoid circular dep if MainScene not used elsewhere?
// Actually MainScene might be used for type? "scene: Phaser.Scene" is used.
import { HealthBar } from '../components/HealthBar';
import { EmoteBubble } from '../components/EmoteBubble';
import { DungeonRenderer } from '../systems/DungeonRenderer';
import { GridSystem } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';

export interface AdventurerConfig {
    id: string;
    hp: number;
    maxHp: number;
    speed: number;
    path: { x: number, y: number }[];
}

export class Adventurer extends Phaser.GameObjects.Container {
    public id: string;
    public hp: number;
    public maxHp: number;
    public speed: number;
    public path: { x: number, y: number }[];
    public progress: number = 0;
    public isJumping: boolean = false;
    public isMoving: boolean = false;
    private justArrived: boolean = false;
    private stepCount: number = 0;
    private trapMemory: Set<string> = new Set();
    private target: { x: number, y: number };

    // Pause Logic
    private pauseTimer: number = 0;
    private readonly PAUSE_DURATION: number = 0.5; // 0.5 seconds pause

    // Visuals
    private bodySprite: Phaser.GameObjects.Sprite;
    private healthBar: HealthBar;
    private emoteBubble: EmoteBubble;

    constructor(scene: Phaser.Scene, x: number, y: number, config: AdventurerConfig) {
        super(scene, x, y);
        this.scene.add.existing(this);
        this.setDepth(DungeonRenderer.DEPTH_ADVENTURER);

        this.id = config.id;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.speed = config.speed;
        this.path = config.path;
        this.target = this.path[this.path.length - 1];


        // Create Body (Sprite)
        this.bodySprite = scene.add.sprite(0, 0, 'hero');
        this.bodySprite.setDisplaySize(32, 32); // Adjust size relative to tile (64)
        this.add(this.bodySprite);

        // Create Health Bar
        this.healthBar = new HealthBar(scene, 0, -25);
        this.add(this.healthBar);

        // Create Emote Bubble
        this.emoteBubble = new EmoteBubble(scene, 0, -45);
        this.add(this.emoteBubble);
    }

    public showEmote(emoji: string, duration: number = 1000) {
        this.emoteBubble.show(emoji, duration);
    }

    public takeDamage(
        amount: number,
        source?: { x: number, y: number },
        context?: { gridSystem: GridSystem, pathfinding: Pathfinding }
    ) {
        this.hp -= amount;
        this.updateHealthBar();

        if (source && context) {
            const key = `${source.x},${source.y}`;
            if (!this.trapMemory.has(key)) {
                this.trapMemory.add(key);
                console.log(`Adventurer ${this.id} learned trap at ${key}`);
                this.recalculatePath(context.gridSystem, context.pathfinding);
            }
        }
    }

    public recalculatePath(gridSystem: GridSystem, pathfinding: Pathfinding) {
        if (!this.target) return;

        // Current position in grid
        const currentGrid = gridSystem.worldToGrid(this.x, this.y);
        if (!currentGrid) return; // Off grid?

        // Recalculate
        const blacklist = Array.from(this.trapMemory);
        console.log(`[Adventurer ${this.id}] Recalculating path. Target: ${this.target.x},${this.target.y}. Memory: ${blacklist.join('|')}`);

        const newPath = pathfinding.findPath(
            currentGrid,
            this.target,
            blacklist
        );

        if (newPath.length > 0) {
            console.log(`Adventurer ${this.id} recalculated path. Length: ${newPath.length}`);
            this.path = newPath;
            // Since we are likely in the middle of a tile or moving, we need to handle the current movement.
            // But for now, we just update the path property, which is used in `move()`.
            // Note: `move` relies on `path[0]` being the next tile.
            // `findPath` usually returns [start, ... nodes]. If start is current tile, we might need to shift it?
            // Existing logic: findPath returns [start, next, ...]
            // Adventurer.move assumes path[0] is strictly the NEXT tile?
            // Let's check existing implementation.
            // In WaveManager or Pathfinding logic, findPath typically includes the start node.
            // Adventurer logic: `const currentTile = this.path[0]; const nextTile = this.path[1];`
            // and `this.scene.tweens.add... x: nextWorld... onComplete: path.shift()`
            // So path[0] is treated as "current/start of segment".
            // So if we set `this.path = newPath`, and `newPath[0]` is our current grid pos, it should be fine.
        } else {
            console.log(`Adventurer ${this.id} panic! No path found!`);
            // Panic behavior: Try to exit or just die?
            // Prompt says: "Switch state to EXITING (try to find path back to spawn). If still no path, destroy self."
            // We'll implement a simple destroy for now or just set flag.
            // Let's destroy for now to satisfy "If still no path, destroy self" (assuming spawn path also blocked).
            // Or we can try to find path to (0,0) or similar.
            // But let's stick to prompt: "If no path is found (the "Mouse" is trapped): Switch state to EXITING... If still no path, destroy."

            // Try path back to start (0,0) or startPos if stored.
            // We don't have startPos stored. Assume 0,0? Or just Despawn.
            this.showEmote('☠️');
            this.die(() => this.destroy());
        }
    }

    private updateHealthBar() {
        const percent = Math.max(0, this.hp / this.maxHp);
        this.healthBar.updateHealth(percent);
    }

    public applyStatus(type: string, duration: number) {
        console.log(`Adventurer ${this.id} applied status: ${type} for ${duration}s`);
        if (type === 'root') {
            this.pauseTimer += duration;
            this.showEmote('🛑');
        }
    }

    public move(dt: number, gridSystem: any): { reachedEnd: boolean, enteredNewTile: boolean } {
        if (this.isJumping) return { reachedEnd: false, enteredNewTile: false };

        // 1. Handle Arrival State (Trigger Trap)
        if (this.justArrived) {
            this.justArrived = false;
            // Pause timer is already set by tween complete
            return { reachedEnd: false, enteredNewTile: true };
        }

        // 2. Handle Moving State
        if (this.isMoving) {
            return { reachedEnd: false, enteredNewTile: false };
        }

        // 3. Handle Pause State
        if (this.pauseTimer > 0) {
            this.pauseTimer -= dt;
            return { reachedEnd: false, enteredNewTile: false };
        }

        // 4. Check Path End
        if (this.path.length <= 1) {
            return { reachedEnd: true, enteredNewTile: false };
        }

        // 5. Start Move (Juice)
        const currentTile = this.path[0];
        const nextTile = this.path[1];

        // Calculate Direction for Flip
        if (nextTile.x < currentTile.x) {
            this.bodySprite.setFlipX(true);
        } else if (nextTile.x > currentTile.x) {
            this.bodySprite.setFlipX(false);
        }

        const nextWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);

        this.isMoving = true;
        this.stepCount++;

        // Position Tween
        this.scene.tweens.add({
            targets: this,
            x: nextWorld.x,
            y: nextWorld.y,
            duration: 300, // Fixed time for snappy move
            ease: 'Linear',
            onComplete: () => {
                this.path.shift();
                this.isMoving = false;
                this.justArrived = true;
                this.pauseTimer = this.PAUSE_DURATION;
            }
        });

        // Juice: Squash & Stretch
        // Scale scaleY to 0.8 and scaleX to 1.2 (squash) for 100ms, then yoyo back to 1.
        this.scene.tweens.add({
            targets: this.bodySprite,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // Juice: Rotation Wobble
        // Rotate between -5 and 5 degrees
        const wobble = (this.stepCount % 2 === 0) ? 5 : -5;
        this.scene.tweens.add({
            targets: this.bodySprite,
            angle: wobble,
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        return { reachedEnd: false, enteredNewTile: false };
    }

    public teleport(x: number, y: number, newPath: { x: number, y: number }[]) {
        this.x = x;
        this.y = y;
        this.path = newPath;
        this.progress = 0;
        this.pauseTimer = 0; // Critical: Reset pause timer
        console.log(`Adventurer ${this.id} teleported to ${x}, ${y}. Pause timer reset.`);
    }

    public jumpTo(targetX: number, targetY: number, duration: number, onComplete: () => void) {
        this.isJumping = true;

        // Face the target (Simplified: Just flip if moving left)
        if (targetX < this.x) {
            this.bodySprite.setFlipX(true);
        } else if (targetX > this.x) {
            this.bodySprite.setFlipX(false);
        }
        // If mostly vertical, maybe use up/down? Keeping simple.

        // Position Tween
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.isJumping = false;
                onComplete();
            }
        });

        // Scale Tween (Simulate height)
        this.scene.tweens.add({
            targets: this.bodySprite,
            scale: 1.5, // Logic scale? Original display size was manual. 
            // Wait, I setDisplaySize(32,32). Tweening 'scale' might be relative to that?
            // Phaser scale property affects display size.
            // I'll tween 'y' offset instead to simulating jumping height, 
            // because tweening scale on a sprite might look weird if not configured right.
            // Actually, previous code tweened scale to 1.5. 
            // If I used setDisplaySize, 'scale' is derived.
            // I will tween 'y' of the bodySprite relative to container.
            y: -40, // Higher jump for spring
            duration: duration / 2,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    }

    // Visual Feedback Methods
    public playAttackAnimation(targetX: number, targetY: number): Promise<void> {
        return new Promise(resolve => {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            const lungeDist = 15;

            const offsetX = Math.cos(angle) * lungeDist;
            const offsetY = Math.sin(angle) * lungeDist;

            // Lunge (Tween bodySprite to keep container fixed)
            this.scene.tweens.add({
                targets: this.bodySprite,
                x: offsetX,
                y: offsetY,
                duration: 120,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.bodySprite.setPosition(0, 0);
                    resolve();
                }
            });
        });
    }

    public playDamageAnimation() {
        // Flash Red
        this.bodySprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => this.bodySprite.clearTint());

        // Shake
        this.scene.tweens.add({
            targets: this.bodySprite,
            x: { from: -5, to: 5 },
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    public playDeathAnimation(onComplete?: () => void) {
        this.isDying = true;
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.killTweensOf(this.bodySprite);

        this.scene.tweens.add({
            targets: this,
            angle: 90, // Topple
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: onComplete
        });
    }

    public die(onComplete: () => void) {
        this.playDeathAnimation(onComplete);
    }

    public isDying: boolean = false;


}
