import { Adventurer } from '../objects/Adventurer';
import { Trap, GridSystem } from './GridSystem';
import { Pathfinding } from './Pathfinding';

export type TrapEffect = (
    adventurer: Adventurer,
    trap: Trap,
    dt: number,
    gridSystem: GridSystem,
    pathfinding: Pathfinding,
    endPos: { x: number, y: number },
    trapSystem: TrapSystem,
    depth: number
) => void;

export class TrapSystem {
    private effects: Record<string, TrapEffect> = {};

    constructor() {
        this.registerDefaultEffects();
    }

    private registerDefaultEffects() {
        this.effects['spike'] = (adv, trap, dt) => {
            // Flat damage on entry
            console.log(`Spike trap dealing 30 damage to ${adv.id}`);
            adv.takeDamage(30);
        };

        this.effects['spring'] = (adv, trap, dt, gridSystem, pathfinding, endPos, trapSystem, depth) => {
            const direction = trap.direction || 'up';
            let dx = 0;
            let dy = 0;

            if (direction === 'up') dy = -2;
            else if (direction === 'down') dy = 2;
            else if (direction === 'left') dx = -2;
            else if (direction === 'right') dx = 2;

            const currentGrid = gridSystem.worldToGrid(adv.x, adv.y);
            if (!currentGrid) return;

            const targetX = currentGrid.x + dx;
            const targetY = currentGrid.y + dy;

            // Check bounds and walls
            if (gridSystem.isWalkable(targetX, targetY)) {
                // Valid jump
                console.log(`Spring! Jumping to ${targetX}, ${targetY}`);

                // Teleport
                const targetWorld = gridSystem.gridToWorld(targetX, targetY);

                // Recalculate Path
                const newPath = pathfinding.findPath({ x: targetX, y: targetY }, endPos);

                if (newPath.length > 0) {
                    adv.teleport(targetWorld.x, targetWorld.y, newPath);
                } else {
                    console.log('No path from jump target!');
                    adv.teleport(targetWorld.x, targetWorld.y, []); // Stop moving
                }

                // Check for trap at landing position (Recursive Trigger)
                const landingCell = gridSystem.getCell(targetX, targetY);
                if (landingCell && landingCell.trap) {
                    console.log('Landed on another trap!');
                    trapSystem.trigger(adv, landingCell.trap, dt, gridSystem, pathfinding, endPos, depth + 1);
                }

            } else {
                // Hit a wall or out of bounds
                console.log('Spring blocked!');
                adv.takeDamage(20);
            }
        };
    }

    public trigger(
        adv: Adventurer,
        trap: Trap,
        dt: number,
        gridSystem: GridSystem,
        pathfinding: Pathfinding,
        endPos: { x: number, y: number },
        depth: number = 0
    ) {
        if (depth > 5) {
            console.warn('Trap recursion depth exceeded!');
            return;
        }

        const effect = this.effects[trap.type];
        if (effect) {
            effect(adv, trap, dt, gridSystem, pathfinding, endPos, this, depth);
        }
    }
}
