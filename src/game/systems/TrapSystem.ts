import { Adventurer } from '../objects/Adventurer';
import { Trap, GridSystem } from './GridSystem';
import { Pathfinding } from './Pathfinding';
import { TRAP_DEFINITIONS } from '../data/TrapRegistry';

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
            if (trap.config.emoteSuccess) {
                adv.showEmote(trap.config.emoteSuccess);
            }
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
                if (trap.config.emoteSuccess) {
                    adv.showEmote(trap.config.emoteSuccess);
                }

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
                if (trap.config.emoteFail) {
                    adv.showEmote(trap.config.emoteFail);
                }
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

    public static checkAndApplySynergy(gridSystem: GridSystem, x: number, y: number) {
        const centerCell = gridSystem.getCell(x, y);
        if (!centerCell || !centerCell.trap) return;

        const centerTrap = centerCell.trap;
        const centerElement = centerTrap.config.element;
        if (!centerElement) return;

        const neighbors = [
            { x: x + 1, y: y }, { x: x - 1, y: y },
            { x: x, y: y + 1 }, { x: x, y: y - 1 }
        ];

        let upgradeCenter = false;
        let newCenterTrapId = '';

        for (const n of neighbors) {
            const cell = gridSystem.getCell(n.x, n.y);
            if (cell && cell.trap) {
                const neighborTrap = cell.trap;
                const neighborElement = neighborTrap.config.element;
                if (!neighborElement) continue;

                let synergyFound = false;
                let newNeighborTrapId = '';

                // Inferno: Oil + Fire (or Inferno)
                if ((centerElement === 'oil' && (neighborElement === 'fire' || neighborElement === 'fire')) ||
                    ((centerElement === 'fire' || centerElement === 'fire') && neighborElement === 'oil')) {
                    synergyFound = true;
                    newNeighborTrapId = 'inferno';
                    newCenterTrapId = 'inferno';
                }

                // Electric Swamp: Water + Lightning (or Electric Swamp)
                if ((centerElement === 'water' && (neighborElement === 'lightning' || neighborElement === 'lightning')) ||
                    ((centerElement === 'lightning' || centerElement === 'lightning') && neighborElement === 'water')) {
                    synergyFound = true;
                    newNeighborTrapId = 'electric_swamp';
                    newCenterTrapId = 'electric_swamp';
                }

                if (synergyFound) {
                    // Upgrade Neighbor
                    // We need to construct a new Trap object. 
                    // Since we don't have the full TRAP_DEFINITIONS here easily without importing, 
                    // let's assume we can import it.
                    // But to avoid circular dependency issues if TrapRegistry imports GridSystem (it doesn't),
                    // we should be fine.

                    // Actually, let's just use the ID and let the caller handle it? 
                    // No, this method is static, it should do the work.
                    // We need to import TRAP_DEFINITIONS.

                    const newTrapConfig = TRAP_DEFINITIONS[newNeighborTrapId];
                    if (newTrapConfig) {
                        console.log(`Upgrading neighbor at ${n.x},${n.y} to ${newNeighborTrapId}`);
                        gridSystem.removeTrap(n.x, n.y);
                        gridSystem.placeTrap(n.x, n.y, { config: newTrapConfig, type: newTrapConfig.type });
                    }
                    upgradeCenter = true;
                }
            }
        }

        if (upgradeCenter && newCenterTrapId) {
            const newTrapConfig = TRAP_DEFINITIONS[newCenterTrapId];
            if (newTrapConfig) {
                console.log(`Upgrading center at ${x},${y} to ${newCenterTrapId}`);
                gridSystem.removeTrap(x, y);
                gridSystem.placeTrap(x, y, { config: newTrapConfig, type: newTrapConfig.type });
            }
        }
    }
}
