import Phaser from 'phaser';
import { HeroDefinition } from '../../data/heroes';

export class Hero extends Phaser.GameObjects.Container {
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

        // Visuals
        const text = scene.add.text(0, 0, definition.icon, { fontSize: '32px' });
        text.setOrigin(0.5);
        this.add(text);

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

        // Hit effect
        this.scene.tweens.add({
            targets: this,
            scale: { from: 1.2, to: 1 },
            duration: 100,
            yoyo: true
        });

        return this.currentHp <= 0;
    }

    public moveGrid(gridX: number, gridY: number, gridSize: number): Promise<void> {
        this.gridX = gridX;
        this.gridY = gridY;

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                x: gridX * gridSize + gridSize / 2,
                y: gridY * gridSize + gridSize / 2,
                duration: 300,
                ease: 'Power2',
                onComplete: () => resolve()
            });
        });
    }
}
