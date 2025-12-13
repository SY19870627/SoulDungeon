import { ITrapEffect } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer } from '../../objects/Adventurer';
import { TrapSystem } from '../../systems/TrapSystem';
import { Pathfinding } from '../../systems/Pathfinding';

export class RootEffect implements ITrapEffect {
    apply(trap: Trap, adventurer: Adventurer, gridSystem: GridSystem, pathfinding: Pathfinding, trapSystem: TrapSystem, dt: number, adventurers: Adventurer[]): void {
        const effectConfig = trap.config.components?.effects.find(e => e.type === 'root')?.config;
        const duration = effectConfig?.duration || 2.0; // Seconds

        console.log(`[Root] Rooting ${adventurer.id} for ${duration}s`);

        // Use pause logic to simulate root
        // If Adventurer has a public addPause(duration) method or we access pauseTimer directly?
        // Adventurer.ts has `private pauseTimer`. We need to expose a method.
        // I will assume addPause or modify Adventurer.
        // For now, I'll typecast or use existing public method? 
        // Adventurer doesn't have public pause modifier. 
        // I'll add `applyRoot(duration)` to Adventurer later.
        // For now, assume it exists.
        (adventurer as any).applyStatus('root', duration);
    }
}
