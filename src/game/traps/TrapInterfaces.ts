import { Adventurer } from '../objects/Adventurer';
import { Trap, GridSystem } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';
import { TrapSystem } from '../systems/TrapSystem';

export type TriggerContext = 'enter' | 'update';

export interface ITrapTrigger {
    shouldTrigger(
        trap: Trap,
        adventurer: Adventurer,
        gridSystem: GridSystem,
        context: TriggerContext
    ): boolean;
}

export interface ITrapEffect {
    apply(
        trap: Trap,
        adventurer: Adventurer,
        gridSystem: GridSystem,
        pathfinding: Pathfinding,
        trapSystem: TrapSystem,
        dt: number,
        adventurers: Adventurer[]
    ): void;
}
