import { Adventurer } from '../objects/Adventurer';
import { Trap, GridSystem } from './GridSystem';
import { Pathfinding } from './Pathfinding';

export type TrapEffect = (
    adventurer: Adventurer,
    trap: Trap,
    dt: number,
    gridSystem: GridSystem,
    pathfinding: Pathfinding,
    endPos: { x: number, y: number }
) => void;

export class TrapSystem {
    private effects: Record<string, TrapEffect> = {};

    constructor() {
        this.registerDefaultEffects();
    }

    private registerDefaultEffects() {
        this.effects['spike'] = (adv, trap, dt) => {
            // Continuous damage: 50 per second
            adv.takeDamage(50 * dt);
        };

        this.effects['spring'] = (adv, trap, dt, gridSystem, pathfinding, endPos) => {
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
                adv.x = targetWorld.x;
                adv.y = targetWorld.y;
                adv.progress = 0; // Reset progress

                // Recalculate Path
                const newPath = pathfinding.findPath({ x: targetX, y: targetY }, endPos);
                if (newPath.length > 0) {
                    adv.path = newPath;
                } else {
                    console.log('No path from jump target!');
                    adv.path = []; // Stop moving
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
        endPos: { x: number, y: number }
    ) {
        const effect = this.effects[trap.type];
        if (effect) {
            effect(adv, trap, dt, gridSystem, pathfinding, endPos);
        }
    }
}
