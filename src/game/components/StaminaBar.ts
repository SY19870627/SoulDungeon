import Phaser from 'phaser';

export class StaminaBar extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private fg: Phaser.GameObjects.Rectangle;
    private barWidth: number;
    private barHeight: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number = 40, height: number = 6) {
        super(scene, x, y);
        this.barWidth = width;
        this.barHeight = height;

        // Background (Dark Gray/Black)
        this.bg = scene.add.rectangle(0, 0, width, height, 0x333333);
        // Foreground (Blue)
        this.fg = scene.add.rectangle(0, 0, width, height, 0x0088ff);

        this.bg.setOrigin(0, 0.5);
        this.fg.setOrigin(0, 0.5);

        // Center relative to container
        this.bg.x = -width / 2;
        this.fg.x = -width / 2;

        this.add(this.bg);
        this.add(this.fg);
    }

    public updateStamina(pct: number) {
        const p = Phaser.Math.Clamp(pct, 0, 1);
        this.fg.scaleX = p;
    }
}
