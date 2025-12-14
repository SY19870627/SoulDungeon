import { Adventurer } from '../objects/Adventurer';
import { Trap, GridSystem } from './GridSystem';
import { Pathfinding } from './Pathfinding';
import { TRAP_DEFINITIONS } from '../data/TrapRegistry';
import { ITrapTrigger, ITrapEffect, TriggerContext } from '../traps/TrapInterfaces';
import { OnStepTrigger } from '../traps/triggers/OnStepTrigger';
import { ProximityTrigger } from '../traps/triggers/ProximityTrigger';
import { PhysicalDamageEffect } from '../traps/effects/PhysicalDamageEffect';
import { RootEffect } from '../traps/effects/RootEffect';
import { AreaMagicEffect } from '../traps/effects/AreaMagicEffect';
import { ApplyStatusEffect } from '../traps/effects/ApplyStatusEffect';
import { CampfireEffect } from '../traps/effects/CampfireEffect';

export type LegacyTrapEffect = (
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
    private legacyEffects: Record<string, LegacyTrapEffect> = {};
    private triggers: Record<string, ITrapTrigger> = {};
    private effects: Record<string, ITrapEffect> = {};

    constructor() {
        this.registerLegacyEffects();
        this.registerComponents();
    }

    private registerComponents() {
        this.triggers['onStep'] = new OnStepTrigger();
        this.triggers['proximity'] = new ProximityTrigger();

        this.effects['physical_damage'] = new PhysicalDamageEffect();
        this.effects['root'] = new RootEffect();
        this.effects['area_magic'] = new AreaMagicEffect();
        this.effects['apply_status'] = new ApplyStatusEffect();
        this.effects['campfire_effect'] = new CampfireEffect();
    }

    private registerLegacyEffects() {
        this.legacyEffects['damage'] = (adv, trap, dt, gridSystem, pathfinding) => {
            const damage = trap.config.damage || 0;
            console.log(`${trap.config.name} trap dealing ${damage} damage to ${adv.id}`);
            adv.takeDamage(damage, { x: trap.x, y: trap.y }, { gridSystem, pathfinding });
        };

        this.legacyEffects['physics'] = (adv, trap, dt, gridSystem, pathfinding, endPos, trapSystem, depth) => {
            this.handlePhysicsTrap(adv, trap, dt, gridSystem, pathfinding, endPos, trapSystem, depth);
        };
    }

    private handlePhysicsTrap(
        adv: Adventurer,
        trap: Trap,
        dt: number,
        gridSystem: GridSystem,
        pathfinding: Pathfinding,
        endPos: { x: number, y: number },
        trapSystem: TrapSystem,
        depth: number
    ) {
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

        if (gridSystem.isWalkable(targetX, targetY)) {
            console.log(`${trap.config.name}! Jumping to ${targetX}, ${targetY}`);

            const targetWorld = gridSystem.gridToWorld(targetX, targetY);

            adv.jumpTo(targetWorld.x, targetWorld.y, 500, () => {
                // Teleport logic first to set position
                adv.teleport(targetWorld.x, targetWorld.y, []);

                // Then recalculate path (using memory)
                adv.recalculatePath(gridSystem, pathfinding);

                const landingCell = gridSystem.getCell(targetX, targetY);
                if (landingCell && landingCell.trap) {
                    trapSystem.trigger(adv, landingCell.trap, dt, gridSystem, pathfinding, endPos, depth + 1);
                }
            });

        } else {
            console.log('Spring blocked!');
            adv.takeDamage(20, { x: trap.x, y: trap.y }, { gridSystem, pathfinding });
        }
    }

    public update(dt: number, gridSystem: GridSystem, adventurers: Adventurer[], pathfinding: Pathfinding, endPos: { x: number, y: number }) {
        const width = gridSystem.getWidth();
        const height = gridSystem.getHeight();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cell = gridSystem.getCell(x, y);
                if (cell && cell.trap) {
                    const trap = cell.trap;

                    if (trap.cooldownTimer > 0) {
                        trap.cooldownTimer -= dt;
                    }

                    if (trap.config.components && trap.cooldownTimer <= 0) {
                        this.processTriggers(trap, adventurers, gridSystem, 'update', dt, pathfinding, endPos);
                    }
                }
            }
        }
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
        if (depth > 5) return;

        if (trap.cooldownTimer > 0) return;

        // Durability Check
        if (trap.remainingTriggers === 0) return;

        let shouldRemove = false;
        if (trap.remainingTriggers > 0) {
            trap.remainingTriggers--;
            if (trap.remainingTriggers === 0) {
                shouldRemove = true;
            }
        }

        console.log(`[TrapSystem] Encountered Trap at ${trap.x},${trap.y} (Type: ${trap.config.type})`);

        // Semantic Memory: Learn the trap
        if (adv && typeof adv.remember === 'function') {
            adv.remember(trap.x, trap.y, 'trap', trap.config.type);
        }

        if (trap.config.components) {
            this.processTriggers(trap, [adv], gridSystem, 'enter', dt, pathfinding, endPos);
        } else {
            const effect = this.legacyEffects[trap.config.type];
            if (effect) {
                // Legacy Dispatch
                window.dispatchEvent(new CustomEvent('trap-triggered', {
                    detail: { x: trap.x, y: trap.y, id: trap.config.id }
                }));
                effect(adv, trap, dt, gridSystem, pathfinding, endPos, this, depth);
            }
        }

        if (shouldRemove) {
            console.log("Trap exhausted and removed");
            gridSystem.removeTrap(trap.x, trap.y);
            window.dispatchEvent(new CustomEvent('grid-updated'));
        }
    }

    private processTriggers(
        trap: Trap,
        adventurers: Adventurer[],
        gridSystem: GridSystem,
        context: TriggerContext,
        dt: number,
        pathfinding: Pathfinding,
        endPos: { x: number, y: number }
    ) {
        if (!trap.config.components) return;

        for (const triggerDef of trap.config.components.triggers) {
            const trigger = this.triggers[triggerDef.type];
            if (trigger) {
                let triggered = false;
                let triggeringAdventurer: Adventurer | null = null;

                for (const adv of adventurers) {
                    if (trigger.shouldTrigger(trap, adv, gridSystem, context)) {
                        triggered = true;
                        triggeringAdventurer = adv;
                        break;
                    }
                }

                if (triggered && triggeringAdventurer) {
                    // Component Dispatch
                    window.dispatchEvent(new CustomEvent('trap-triggered', {
                        detail: { x: trap.x, y: trap.y, id: trap.config.id }
                    }));

                    this.fireEffects(trap, triggeringAdventurer, gridSystem, dt, adventurers, pathfinding);

                    if (trap.config.cooldown) {
                        trap.cooldownTimer = trap.config.cooldown;
                    }
                    return;
                }
            }
        }
    }

    private fireEffects(
        trap: Trap,
        primaryTarget: Adventurer,
        gridSystem: GridSystem,
        dt: number,
        allAdventurers: Adventurer[],
        pathfinding: Pathfinding
    ) {
        if (!trap.config.components) return;

        for (const effectDef of trap.config.components.effects) {
            const effect = this.effects[effectDef.type];
            if (effect) {
                effect.apply(trap, primaryTarget, gridSystem, pathfinding, this, dt, allAdventurers);
            }
        }
    }

    private static igniteOil(gridSystem: GridSystem, x: number, y: number) {
        const cell = gridSystem.getCell(x, y);
        if (!cell || !cell.trap || cell.trap.config.id !== 'oil') {
            return;
        }

        // Transform 'oil' -> 'burning_oil'
        const burningOilConfig = TRAP_DEFINITIONS['burning_oil'];
        if (burningOilConfig) {
            console.log(`Igniting oil at ${x},${y}`);
            gridSystem.removeTrap(x, y);
            gridSystem.placeTrap(x, y, {
                config: burningOilConfig,
                type: burningOilConfig.type,
                cooldownTimer: 0,
                remainingTriggers: -1,
                x: x,
                y: y
            });
            window.dispatchEvent(new CustomEvent('grid-updated'));
        }

        // Recursive Propagation (Flood Fill) to Neighbors
        // Add delay for visual spread effect
        setTimeout(() => {
            const neighbors = [
                { x: x + 1, y: y }, { x: x - 1, y: y },
                { x: x, y: y + 1 }, { x: x, y: y - 1 }
            ];

            for (const n of neighbors) {
                TrapSystem.igniteOil(gridSystem, n.x, n.y);
            }
        }, 150);
    }

    public static checkAndApplySynergy(gridSystem: GridSystem, x: number, y: number) {
        const centerCell = gridSystem.getCell(x, y);
        if (!centerCell || !centerCell.trap) return;

        const centerTrap = centerCell.trap;
        const centerConfig = centerTrap.config;

        const neighbors = [
            { x: x + 1, y: y }, { x: x - 1, y: y },
            { x: x, y: y + 1 }, { x: x, y: y - 1 }
        ];

        // Scenario A: Placed Oil
        if (centerConfig.id === 'oil') {
            let ignited = false;
            // Check if any neighbor is fire
            for (const n of neighbors) {
                const cell = gridSystem.getCell(n.x, n.y);
                if (cell && cell.trap && cell.trap.config.element === 'fire') {
                    ignited = true;
                    break;
                }
            }

            if (ignited) {
                TrapSystem.igniteOil(gridSystem, x, y);
            }
        }
        // Scenario B: Placed Fire Source (Fire or Burning Oil)
        else if (centerConfig.element === 'fire') {
            // Check all neighbors for oil
            for (const n of neighbors) {
                TrapSystem.igniteOil(gridSystem, n.x, n.y);
            }
        }
    }
}
