import Phaser from 'phaser';
import { GridSystem } from './GridSystem';
import { Pathfinding } from './Pathfinding';
import { EconomyManager } from './EconomyManager';
import { Adventurer } from '../objects/Adventurer';
import { TrapSystem } from './TrapSystem';

export class WaveManager {
    private scene: Phaser.Scene;
    private gridSystem: GridSystem;
    private pathfinding: Pathfinding;
    private economyManager: EconomyManager | null = null;
    private trapSystem: TrapSystem;

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
        this.trapSystem = new TrapSystem();
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

        const adventurer = new Adventurer(this.scene, startWorld.x, startWorld.y, {
            id: Math.random().toString(36).substr(2, 9),
            hp: 100,
            maxHp: 100,
            speed: 2,
            path: path
        });

        this.adventurers.push(adventurer);
        console.log('Spawned adventurer:', adventurer.id);
    }

    public update(time: number, delta: number) {
        const dt = delta / 1000; // seconds

        for (let i = this.adventurers.length - 1; i >= 0; i--) {
            const adv = this.adventurers[i];

            // Check death
            if (adv.hp <= 0) {
                this.killAdventurer(i);
                continue;
            }

            // Move
            const reachedEnd = adv.move(dt, this.gridSystem);

            if (reachedEnd) {
                this.removeAdventurer(i);
                console.log('Adventurer reached treasure!');
                continue;
            }

            // Check traps
            const gridPos = this.gridSystem.worldToGrid(adv.x, adv.y);
            if (gridPos) {
                const cell = this.gridSystem.getCell(gridPos.x, gridPos.y);
                if (cell && cell.trap) {
                    this.trapSystem.trigger(adv, cell.trap, dt, this.gridSystem, this.pathfinding, this.endPos);
                }
            }
        }
    }

    private killAdventurer(index: number) {
        const adv = this.adventurers[index];
        adv.destroy(); // Remove visual
        this.adventurers.splice(index, 1);
        if (this.economyManager) {
            this.economyManager.addGold(10);
        }
        console.log('Adventurer died!');
    }

    private removeAdventurer(index: number) {
        const adv = this.adventurers[index];
        adv.destroy();
        this.adventurers.splice(index, 1);
    }


    public getAdventurers(): Adventurer[] {
        return this.adventurers;
    }
}
