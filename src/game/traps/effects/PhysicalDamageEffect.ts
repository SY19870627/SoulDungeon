import { ITrapEffect } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer } from '../../objects/Adventurer';
import { TrapSystem } from '../../systems/TrapSystem';
import { Pathfinding } from '../../systems/Pathfinding';

export class PhysicalDamageEffect implements ITrapEffect {
    apply(trap: Trap, adventurer: Adventurer, gridSystem: GridSystem, pathfinding: Pathfinding, trapSystem: TrapSystem, dt: number, adventurers: Adventurer[]): void {
        const effectConfig = trap.config.components?.effects.find(e => e.type === 'physical_damage')?.config;
        const damage = effectConfig?.damage || trap.config.damage || 10;

        console.log(`[PhysicalDamage] Dealing ${damage} to ${adventurer.id}`);
        adventurer.takeDamage(damage);

        // Visual feedback
        if (trap.config.emoteSuccess) {
            adventurer.showEmote(trap.config.emoteSuccess);
        } else {
            adventurer.showEmote('😖');
        }
    }
}
