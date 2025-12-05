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

    // Visuals
    private bodySprite: Phaser.GameObjects.Arc;
    private healthBarBg: Phaser.GameObjects.Rectangle;
    private healthBarFg: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number, config: AdventurerConfig) {
        super(scene, x, y);
        this.scene.add.existing(this);

        this.id = config.id;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.path = config.path;

        // Create Body (Circle)
        this.bodySprite = scene.add.circle(0, 0, 15, 0xffffff);
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
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        this.updateHealthBar();
    }

    private updateHealthBar() {
        const percent = Math.max(0, this.hp / this.maxHp);
        this.healthBarFg.scaleX = percent;
    }



    public move(dt: number, gridSystem: any): boolean {
        // Returns true if reached end
        if (this.path.length <= 1) return true;

        this.progress += this.speed * dt;

        if (this.progress >= 1) {
            this.progress -= 1;
            this.path.shift();

            // Check for traps on new tile (This logic might need to stay in WaveManager or be passed in)
            // For now, we just update position. 
            // We can return "entered new tile" status or similar if needed.
        }

        if (this.path.length > 1) {
            const currentTile = this.path[0];
            const nextTile = this.path[1];

            const currentWorld = gridSystem.gridToWorld(currentTile.x, currentTile.y);
            const nextWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);

            this.x = Phaser.Math.Linear(currentWorld.x, nextWorld.x, this.progress);
            this.y = Phaser.Math.Linear(currentWorld.y, nextWorld.y, this.progress);
        }

        return false;
    }
}
