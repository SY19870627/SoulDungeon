import { ITrapTrigger, TriggerContext } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer } from '../../objects/Adventurer';
import Phaser from 'phaser';

export class ProximityTrigger implements ITrapTrigger {
    shouldTrigger(trap: Trap, adventurer: Adventurer, gridSystem: GridSystem, context: TriggerContext): boolean {
        const triggerConfig = trap.config.components?.triggers.find(t => t.type === 'proximity')?.config;
        const radius = triggerConfig?.radius || 1;

        // Trap World Position
        const trapWorld = gridSystem.gridToWorld(trap.x, trap.y);

        // Check distance
        const dist = Phaser.Math.Distance.Between(trapWorld.x, trapWorld.y, adventurer.x, adventurer.y);
        const worldRadius = radius * gridSystem.getTileSize();

        return dist <= worldRadius;
    }
}
