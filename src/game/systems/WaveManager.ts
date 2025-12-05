import Phaser from 'phaser';
import { GridSystem, Adventurer } from './GridSystem';
import { Pathfinding } from './Pathfinding';
import { EconomyManager } from './EconomyManager';

export class WaveManager {
    private scene: Phaser.Scene;
    private gridSystem: GridSystem;
    private pathfinding: Pathfinding;
    private economyManager: EconomyManager | null = null;

    private adventurers: Adventurer[] = [];
    private spawnTimer: Phaser.Time.TimerEvent | null = null;

    private startPos = { x: 0, y: 0 };
    private endPos = { x: 9, y: 9 };

    private waveConfig = {
        count: 5,
        interval: 2000, // ms
        spawned: 0
    };

    constructor(scene: Phaser.Scene, gridSystem: GridSystem, pathfinding: Pathfinding) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.pathfinding = pathfinding;
    }

    public setEconomyManager(economyManager: EconomyManager) {
        this.economyManager = economyManager;
    }

    public startWave() {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }

        this.waveConfig.spawned = 0;
        this.spawnTimer = this.scene.time.addEvent({
            delay: this.waveConfig.interval,
            callback: this.spawnAdventurer,
            callbackScope: this,
            repeat: this.waveConfig.count - 1
        });

        // Spawn first one immediately
        this.spawnAdventurer();
    }

    private spawnAdventurer() {
        const path = this.pathfinding.findPath(this.startPos, this.endPos);
        if (path.length === 0) {
            console.warn('No path for adventurer!');
            return;
        }

        const startWorld = this.gridSystem.gridToWorld(this.startPos.x, this.startPos.y);

        const adventurer: Adventurer = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'warrior',
            hp: 100,
            maxHp: 100,
            speed: 2, // 2 tiles per second
            gridPosition: { ...this.startPos },
            worldPosition: { ...startWorld },
            path: path,
            progress: 0
        };

        this.adventurers.push(adventurer);
        console.log('Spawned adventurer:', adventurer.id);
    }

    public update(time: number, delta: number) {
        const dt = delta / 1000; // seconds

        for (let i = this.adventurers.length - 1; i >= 0; i--) {
            const adv = this.adventurers[i];
            this.updateAdventurer(adv, dt, i);
        }
    }

    private updateAdventurer(adv: Adventurer, dt: number, index: number) {
        if (adv.hp <= 0) {
            // Dead
            this.adventurers.splice(index, 1);
            if (this.economyManager) {
                this.economyManager.addGold(10); // Reward 10 gold
            }
            console.log('Adventurer died!');
            return;
        }

        if (adv.path.length <= 1) {
            // Reached end
            this.adventurers.splice(index, 1);
            console.log('Adventurer reached treasure!');
            return;
        }

        // Move along path
        adv.progress += adv.speed * dt;

        if (adv.progress >= 1) {
            // Reached next tile
            adv.progress -= 1;
            adv.path.shift(); // Remove current tile

            if (adv.path.length > 0) {
                adv.gridPosition = { ...adv.path[0] };

                // Check for traps on new tile
                const cell = this.gridSystem.getCell(adv.gridPosition.x, adv.gridPosition.y);
                if (cell && cell.trap) {
                    this.triggerTrap(adv, cell.trap);
                }
            }
        }

        // Interpolate world position
        if (adv.path.length > 1) {
            const currentTile = adv.path[0];
            const nextTile = adv.path[1];

            const currentWorld = this.gridSystem.gridToWorld(currentTile.x, currentTile.y);
            const nextWorld = this.gridSystem.gridToWorld(nextTile.x, nextTile.y);

            adv.worldPosition.x = Phaser.Math.Linear(currentWorld.x, nextWorld.x, adv.progress);
            adv.worldPosition.y = Phaser.Math.Linear(currentWorld.y, nextWorld.y, adv.progress);
        }
    }

    private triggerTrap(adv: Adventurer, trap: any) {
        console.log(`Trap triggered: ${trap.type}`);
        if (trap.type === 'spike') {
            adv.hp -= 50; // Deal 50 damage
        } else if (trap.type === 'spring') {
            // Push back logic (simplified: just delay progress or move back one tile if possible)
            // For now, let's just stun them (reduce progress) or deal minor damage
            adv.progress = -0.5; // Push back progress
        }
    }

    public getAdventurers(): Adventurer[] {
        return this.adventurers;
    }
}
