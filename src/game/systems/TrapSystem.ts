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
        this.effects['damage'] = (adv, trap, dt) => {
            // Flat damage on entry
            const damage = trap.config.damage || 0;
            console.log(`${trap.config.name} trap dealing ${damage} damage to ${adv.id}`);
            adv.takeDamage(damage);
        };

        this.effects['physics'] = (adv, trap, dt, gridSystem, pathfinding, endPos, trapSystem, depth) => {
            const direction = trap.direction || 'up';
            const pushDistance = trap.config.pushDistance || 0;
            let dx = 0;
            let dy = 0;

            if (direction === 'up') dy = -pushDistance;
            else if (direction === 'down') dy = pushDistance;
            else if (direction === 'left') dx = -pushDistance;
            else if (direction === 'right') dx = pushDistance;

            const currentGrid = gridSystem.worldToGrid(adv.x, adv.y);
            if (!currentGrid) return;

            const targetX = currentGrid.x + dx;
            const targetY = currentGrid.y + dy;

            // Check bounds and walls
            if (gridSystem.isWalkable(targetX, targetY)) {
                // Valid jump
                console.log(`${trap.config.name}! Jumping to ${targetX}, ${targetY}`);

                // Teleport
                const targetWorld = gridSystem.gridToWorld(targetX, targetY);

                // Use Jump Animation
                adv.jumpTo(targetWorld.x, targetWorld.y, 500, () => {
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
                });

            } else {
                // Hit a wall or out of bounds
                console.log('Spring blocked!');
                adv.takeDamage(20); // Collision damage could also be config based later
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

        const effect = this.effects[trap.config.type];
        if (effect) {
            effect(adv, trap, dt, gridSystem, pathfinding, endPos, this, depth);
        }
    }
}
