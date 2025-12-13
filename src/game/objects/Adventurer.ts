import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';

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

    // Pause Logic
    private pauseTimer: number = 0;
    private readonly PAUSE_DURATION: number = 0.5; // 0.5 seconds pause

    // Visuals
    private bodySprite: Phaser.GameObjects.Sprite;
    private healthBarBg: Phaser.GameObjects.Rectangle;
    private healthBarFg: Phaser.GameObjects.Rectangle;
    private emoteText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, config: AdventurerConfig) {
        super(scene, x, y);
        this.scene.add.existing(this);
        this.setDepth(MainScene.DEPTH_ADVENTURER);

        this.id = config.id;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.path = config.path;

        // Create Body (Sprite)
        this.bodySprite = scene.add.sprite(0, 0, 'hero_run_sheet', 0);
        this.bodySprite.setDisplaySize(32, 32); // Adjust size relative to tile (64)
        this.add(this.bodySprite);

        // Create Health Bar
        const barWidth = 40;
        const barHeight = 6;
        const barY = -25;

        this.healthBarBg = scene.add.rectangle(0, barY, barWidth, barHeight, 0xff0000);
        this.healthBarFg = scene.add.rectangle(0, barY, barWidth, barHeight, 0x00ff00);

        // Align health bar to start from left
        this.healthBarFg.setOrigin(0, 0.5);
        this.healthBarBg.setOrigin(0, 0.5);
        // Center the whole bar group
        this.healthBarBg.x = -barWidth / 2;
        this.healthBarFg.x = -barWidth / 2;

        this.add(this.healthBarBg);
        this.add(this.healthBarFg);

        // Create Emote Text
        this.emoteText = scene.add.text(0, -45, '', { fontSize: '24px' });
        this.emoteText.setOrigin(0.5);
        this.emoteText.setVisible(false);
        this.add(this.emoteText);
    }

    public showEmote(emoji: string, duration: number = 1000) {
        if (!this.scene) return;

        // Stop any existing animations on the emote text
        this.scene.tweens.killTweensOf(this.emoteText);

        this.emoteText.setText(emoji);
        this.emoteText.setVisible(true);
        this.emoteText.setScale(0);
        this.emoteText.setAlpha(1);
        this.emoteText.y = -45; // Reset position in case it was floating up

        // Pop in
        this.scene.tweens.add({
            targets: this.emoteText,
            scale: 1.2,
            duration: 200,
            ease: 'Back.out',
            onComplete: () => {
                if (!this.scene) return;
                // Fade out after delay
                this.scene.tweens.add({
                    targets: this.emoteText,
                    alpha: 0,
                    y: this.emoteText.y - 20, // Float up
                    duration: 500,
                    delay: duration - 700,
                    onComplete: () => {
                        if (!this.scene) return;
                        this.emoteText.setVisible(false);
                        this.emoteText.y = -45; // Reset position
                    }
                });
            }
        });
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        this.updateHealthBar();
    }

    private updateHealthBar() {
        const percent = Math.max(0, this.hp / this.maxHp);
        this.healthBarFg.scaleX = percent;
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

        // 5. Start Move (Hop)
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

        // Hop Tween (Visual)
        this.scene.tweens.add({
            targets: this.bodySprite,
            y: -20, // Hop up
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeOut'
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
