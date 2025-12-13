import Phaser from 'phaser';

export class EconomyManager extends Phaser.Events.EventEmitter {
    private gold: number;

    constructor(initialGold: number = 500) {
        super();
        this.gold = initialGold;
    }

    public getGold(): number {
        return this.gold;
    }

    public canAfford(cost: number): boolean {
        return this.gold >= cost;
    }

    public spendGold(amount: number): boolean {
        if (this.canAfford(amount)) {
            this.gold -= amount;
            this.emit('gold-updated', this.gold);
            return true;
        }
        return false;
    }

    public addGold(amount: number) {
        this.gold += amount;
        this.emit('gold-updated', this.gold);
    }
}
