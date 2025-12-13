import Phaser from 'phaser';
import { HeroDefinition } from '../../data/heroes';

export class Hero extends Phaser.GameObjects.Container {
    private bodySprite: Phaser.GameObjects.Sprite;
    private hpBar: Phaser.GameObjects.Graphics;
    private maxHp: number;
    public currentHp: number;
    public gridX: number;
    public gridY: number;
    public definition: HeroDefinition;

    constructor(scene: Phaser.Scene, x: number, y: number, definition: HeroDefinition) {
        super(scene, x, y);
        this.definition = definition;
        this.maxHp = definition.hp;
        this.currentHp = definition.hp;
        this.gridX = 0; // Initial grid pos
        this.gridY = 0;

        // Visuals - Board Game Piece Style
        this.bodySprite = scene.add.sprite(0, 0, 'hero_run_sheet', 0);
        this.bodySprite.setDisplaySize(48, 48);
        this.add(this.bodySprite);

        // HP Bar
        this.hpBar = scene.add.graphics();
        this.updateHpBar();
        this.add(this.hpBar);

        scene.add.existing(this);
    }

    public updateHpBar() {
        this.hpBar.clear();
        const width = 40;
        const height = 4;
        const x = -width / 2;
        const y = 20;

        // Background
        this.hpBar.fillStyle(0x333333);
        this.hpBar.fillRect(x, y, width, height);

        // Fill
        const pct = Math.max(0, this.currentHp / this.maxHp);
        let color = 0x2ecc71;
        if (pct < 0.6) color = 0xf1c40f;
        if (pct < 0.3) color = 0xe74c3c;

        this.hpBar.fillStyle(color);
        this.hpBar.fillRect(x, y, width * pct, height);
    }

    public takeDamage(amount: number) {
        this.currentHp -= amount;
        this.updateHpBar();

        // Hit effect (Damage)
        this.playDamageAnimation();

        return this.currentHp <= 0;
    }

    public playDamageAnimation() {
        // Flash Color
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

    public playAttackAnimation(targetX: number, targetY: number): Promise<void> {
        return new Promise(resolve => {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            const lungeDist = 20;

            const offsetX = Math.cos(angle) * lungeDist;
            const offsetY = Math.sin(angle) * lungeDist;

            this.scene.tweens.add({
                targets: this.bodySprite, // Tween bodySprite so container position stays valid? 
                // Or tween container? If we tween container, 'this.x' changes.
                // It's safer to tween bodySprite for "visual only" movements if we want logical position to remain fixed?
                // But the prompt says "Move 10px towards target". 
                // If I move the container, grid logic might get confused if it reads x/y during anim.
                // Let's tween bodySprite (relative to container 0,0).
                x: offsetX,
                y: offsetY,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.bodySprite.setPosition(0, 0); // Reset
                    resolve();
                }
            });
        });
    }

    public playDeathAnimation(onComplete?: () => void) {
        this.scene.tweens.add({
            targets: this,
            angle: 90, // Topple
            alpha: 0,
            duration: 500,
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
    }

    public moveGrid(gridX: number, gridY: number, gridSize: number): Promise<void> {
        this.gridX = gridX;
        this.gridY = gridY;

        return new Promise(resolve => {
            // Linear Move
            this.scene.tweens.add({
                targets: this,
                x: gridX * gridSize + gridSize / 2,
                y: gridY * gridSize + gridSize / 2,
                duration: 300,
                ease: 'Linear',
                onComplete: () => resolve()
            });

            // Hop Effect (Arc)
            this.scene.tweens.add({
                targets: this.bodySprite,
                y: -20, // Jump height (relative)
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeOut'
            });
        });
    }
}
