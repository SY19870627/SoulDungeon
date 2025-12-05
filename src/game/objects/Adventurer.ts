import Phaser from 'phaser';

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

    // Pause Logic
    private pauseTimer: number = 0;
    private readonly PAUSE_DURATION: number = 0.5; // 0.5 seconds pause

    // Visuals
    private bodySprite: Phaser.GameObjects.Triangle;
    private healthBarBg: Phaser.GameObjects.Rectangle;
    private healthBarFg: Phaser.GameObjects.Rectangle;
    private emoteText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, config: AdventurerConfig) {
        super(scene, x, y);
        this.scene.add.existing(this);

        this.id = config.id;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.path = config.path;

        // Create Body (Arrow/Triangle)
        // Points relative to (0,0): Tip(10,0), BackTop(-10,-10), BackBottom(-10,10)
        this.bodySprite = scene.add.triangle(0, 0, 10, 0, -10, -10, -10, 10, 0xffffff);
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

        // Returns true if reached end
        if (this.path.length <= 1) return { reachedEnd: true, enteredNewTile: false };

        // Handle Pause
        if (this.pauseTimer > 0) {
            this.pauseTimer -= dt;
            if (this.pauseTimer <= 0) {
                // Pause finished, proceed to next tile
                this.progress -= 1;
                this.path.shift();
            } else {
                // Still paused
                return { reachedEnd: false, enteredNewTile: false };
            }
        }

        this.progress += this.speed * dt;

        if (this.progress >= 1) {
            // Reached target tile, start pause
            this.pauseTimer = this.PAUSE_DURATION;

            // Snap to exact target position
            const nextTile = this.path[1];
            const nextWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);
            this.x = nextWorld.x;
            this.y = nextWorld.y;

            // We just arrived at the center of the new tile. Trigger trap now!
            console.log(`Adventurer ${this.id} entered new tile: ${nextTile.x}, ${nextTile.y}`);
            return { reachedEnd: false, enteredNewTile: true };
        }

        if (this.path.length > 1) {
            const currentTile = this.path[0];
            const nextTile = this.path[1];

            const currentWorld = gridSystem.gridToWorld(currentTile.x, currentTile.y);
            const nextWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);

            this.x = Phaser.Math.Linear(currentWorld.x, nextWorld.x, this.progress);
            this.y = Phaser.Math.Linear(currentWorld.y, nextWorld.y, this.progress);

            // Update Rotation
            const angle = Phaser.Math.Angle.Between(currentWorld.x, currentWorld.y, nextWorld.x, nextWorld.y);
            this.bodySprite.rotation = angle;
        }

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

        // Face the target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.bodySprite.rotation = angle;

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
            scale: 1.5,
            duration: duration / 2,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    }

    public isDying: boolean = false;

    public die(onComplete: () => void) {
        this.isDying = true;

        // Stop any movement or other tweens
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.killTweensOf(this.bodySprite);

        this.scene.tweens.add({
            targets: this,
            scale: 0,
            angle: 360,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: onComplete
        });
    }
}
