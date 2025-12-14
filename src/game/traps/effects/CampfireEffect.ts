import { ITrapEffect } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer, EmotePriority } from '../../objects/Adventurer';
import { Pathfinding } from '../../systems/Pathfinding';
import { TrapSystem } from '../../systems/TrapSystem';

export class CampfireEffect implements ITrapEffect {
    apply(
        trap: Trap,
        adventurer: Adventurer,
        gridSystem: GridSystem,
        pathfinding: Pathfinding,
        trapSystem: TrapSystem,
        dt: number,
        adventurers: Adventurer[]
    ): void {
        console.log(`Applying Campfire effect to ${adventurer.id}`);

        // Check for Oiled Synergy
        if (adventurer.hasStatus('oiled')) {
            // Synergy: Oiled + Fire = BOOM logic? Or just burn interaction
            console.log("Campfire ignited Oiled adventurer!");

            // 1. Remove Oiled
            adventurer.removeStatus('oiled');

            // 2. Deal Damage (Ignition)
            adventurer.takeDamage(30, { x: trap.x, y: trap.y }, { gridSystem, pathfinding });

            // 3. Visual
            adventurer.requestEmote('🔥', EmotePriority.HIGH);

            // 4. Maybe ignite the tile itself if we had floor effects? 
            // For now, just damage the unit.

        } else {
            // Normal Effect: Rest
            console.log("Adventurer resting at Campfire.");

            // 1. Recover Stamina
            adventurer.recoverStamina(5);

            // 2. Pause (Stun/Rest)
            adventurer.applyStatus('stun', 1.5);

            // 3. Visual
            adventurer.requestEmote('💤', EmotePriority.NORMAL);
        }

        // Campfire is generally single use (handled by maxTriggers in config), 
        // so after this trigger, it should be naturally removed by TrapSystem logic.
    }
}
