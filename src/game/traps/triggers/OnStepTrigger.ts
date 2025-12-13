import { ITrapTrigger, TriggerContext } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer } from '../../objects/Adventurer';

export class OnStepTrigger implements ITrapTrigger {
    shouldTrigger(trap: Trap, adventurer: Adventurer, gridSystem: GridSystem, context: TriggerContext): boolean {
        // Only trigger on explicit 'enter' event (when moving into tile)
        if (context !== 'enter') return false;

        const gridPos = gridSystem.worldToGrid(adventurer.x, adventurer.y);
        if (!gridPos) return false;

        const cell = gridSystem.getCell(gridPos.x, gridPos.y);
        // Ensure the adventurer is actually on this trap's cell
        return cell?.trap === trap;
    }
}
