import { ITrapEffect } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer } from '../../objects/Adventurer';
import { Pathfinding } from '../../systems/Pathfinding';
import { TrapSystem } from '../../systems/TrapSystem';

export class ApplyStatusEffect implements ITrapEffect {
    apply(
        trap: Trap,
        adventurer: Adventurer,
        gridSystem: GridSystem,
        pathfinding: Pathfinding,
        trapSystem: TrapSystem,
        dt: number,
        adventurers: Adventurer[]
    ): void {
        if (trap.config.components) {
            // Find the effect config for this type
            const effectConfig = trap.config.components.effects.find(e => e.type === 'apply_status');
            if (effectConfig && effectConfig.config) {
                const { status, duration } = effectConfig.config;
                if (status) {
                    adventurer.applyStatus(status, duration || 0);
                }
            }
        }
    }
}
