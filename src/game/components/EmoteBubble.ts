import Phaser from 'phaser';

export class EmoteBubble extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.scene.add.existing(this);
    }

    public show(emoji: string, duration: number = 1000) {
        // Create a new text object for this specific emote
        const bubble = this.scene.add.text(0, 0, emoji, { fontSize: '24px' });
        bubble.setOrigin(0.5);
        this.add(bubble);

        // Initial state
        bubble.setScale(0);
        bubble.setAlpha(1);
        bubble.y = 0;

        // 1. Pop In (Scale)
        this.scene.tweens.add({
            targets: bubble,
            scale: { from: 0, to: 1.2 },
            duration: 200,
            ease: 'Back.out'
        });

        // 2. Float Up (Movement) - starts immediately
        this.scene.tweens.add({
            targets: bubble,
            y: -30,
            duration: 1000,
            ease: 'Sine.out'
        });

        // 3. Fade Out - starts late
        this.scene.tweens.add({
            targets: bubble,
            alpha: 0,
            duration: 300,
            delay: 700,
            onComplete: () => {
                bubble.destroy();
            }
        });
    }
}
