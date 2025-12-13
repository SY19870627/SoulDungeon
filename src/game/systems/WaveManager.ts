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
        count: 1,
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

        // Spawn first one immediately
        this.spawnAdventurer();

        if (this.waveConfig.count > 1) {
            this.spawnTimer = this.scene.time.addEvent({
                delay: this.waveConfig.interval,
                callback: this.spawnAdventurer,
                callbackScope: this,
                repeat: this.waveConfig.count - 2 // repeat is "how many times AFTER the first one"
            });
        }
    }

    private spawnAdventurer() {
        // Removed initial pathfinding. Adventurer decides their own path.

        const startWorld = this.gridSystem.gridToWorld(this.startPos.x, this.startPos.y);

        const adventurer = new Adventurer(this.scene, startWorld.x, startWorld.y, {
            id: Math.random().toString(36).substr(2, 9),
            hp: 100,
            maxHp: 100,
            speed: 2
        }, this.gridSystem, this.pathfinding);

        this.adventurers.push(adventurer);
        console.log('Spawned adventurer:', adventurer.id);
    }

    public update(time: number, delta: number) {
        const dt = delta / 1000; // seconds

        // Update Trap System (Proximity Triggers / Cooldowns)
        this.trapSystem.update(dt, this.gridSystem, this.adventurers, this.pathfinding, this.endPos);

        for (let i = this.adventurers.length - 1; i >= 0; i--) {
            const adv = this.adventurers[i];

            // Cleanup if destroyed (Expired or Killed)
            if (!adv.scene || adv.isDying) {
                // If marked dying, wait for it to be destroyed? 
                // Actually adv.die() plays animation then calls onComplete.
                // adv.expire() plays animation then calls destroy().
                // If destroy() is called, Phaser removes it from display list.
                // We need to remove it from our list too if it's null/destroyed.
                // But wait, `adv` object still exists unless we splice it.
                // Phaser GameObjects checks: if (!adv.active)
            }

            if (!adv.active) {
                this.adventurers.splice(i, 1);
                continue;
            }

            // Check death (HP <= 0)
            if (adv.hp <= 0) {
                if (!adv.isDying) {
                    adv.die(() => this.killAdventurer(adv));
                }
                continue;
            }

            // Move
            if (adv.isDying) continue; // Don't move if dying

            const { reachedEnd, enteredNewTile } = adv.move(dt, this.gridSystem);

            // reachedEnd is now purely internal to path segment. 
            // Adventurer decidesNextPath automatically.
            // If adventurer runs out of stamina, they call expire() -> isDying -> destoy.

            // Check traps only if entered new tile
            if (enteredNewTile) {
                const gridPos = this.gridSystem.worldToGrid(adv.x, adv.y);
                if (gridPos) {
                    const cell = this.gridSystem.getCell(gridPos.x, gridPos.y);
                    if (cell && cell.trap) {
                        console.log(`WaveManager triggering trap at ${gridPos.x}, ${gridPos.y} for ${adv.id}`);
                        this.trapSystem.trigger(adv, cell.trap, dt, this.gridSystem, this.pathfinding, this.endPos);
                    }
                }
            }
        }
    }

    private killAdventurer(adv: Adventurer) {
        const index = this.adventurers.indexOf(adv);
        if (index !== -1) {
            adv.destroy(); // Remove visual
            this.adventurers.splice(index, 1);
            if (this.economyManager) {
                const reward = 10 * adv.getBountyMultiplier();
                this.economyManager.addGold(reward);
                console.log(`Adventurer died (Killed)! Gold Awarded: ${reward} (Multiplier: ${adv.getBountyMultiplier()}x)`);
            }
        }
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
