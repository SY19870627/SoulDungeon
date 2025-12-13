import Phaser from 'phaser';

export class EmoteBubble extends Phaser.GameObjects.Container {
    private text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.text = scene.add.text(0, 0, '', { fontSize: '24px' });
        this.text.setOrigin(0.5);
        this.add(this.text);

        this.setVisible(false);
    }

    public show(emoji: string, duration: number = 1000) {
        // Kill existing tweens on container
        this.scene.tweens.killTweensOf(this);

        this.text.setText(emoji);
        this.setVisible(true);
        this.setScale(0); // scale container
        this.setAlpha(1);
        this.y = 0; // Reset local Y if needed, or rely on parent positioning

        // Pop in
        this.scene.tweens.add({
            targets: this,
            scale: 1.2,
            duration: 200,
            ease: 'Back.out',
            onComplete: () => {
                // Fade out after delay
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    y: this.y - 20, // Float up
                    duration: 500,
                    delay: duration - 700,
                    onComplete: () => {
                        this.setVisible(false);
                        this.y = 0; // Reset position
                    }
                });
            }
        });
    }
}
