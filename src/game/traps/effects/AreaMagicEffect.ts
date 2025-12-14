import { ITrapEffect } from '../TrapInterfaces';
import { Trap, GridSystem } from '../../systems/GridSystem';
import { Adventurer, EmotePriority } from '../../objects/Adventurer';
import { TrapSystem } from '../../systems/TrapSystem';
import { Pathfinding } from '../../systems/Pathfinding';
import Phaser from 'phaser';

export class AreaMagicEffect implements ITrapEffect {
    apply(trap: Trap, adventurer: Adventurer, gridSystem: GridSystem, pathfinding: Pathfinding, trapSystem: TrapSystem, dt: number, adventurers: Adventurer[]): void {
        const effectConfig = trap.config.components?.effects.find(e => e.type === 'area_magic')?.config;
        const radius = effectConfig?.radius || 2;
        const damage = effectConfig?.damage || 15;

        // Trap World Pos
        const trapWorld = gridSystem.gridToWorld(trap.x, trap.y);
        const worldRadius = radius * gridSystem.getTileSize();

        console.log(`[AreaMagic] BOOM! Radius ${radius}, Damage ${damage}`);

        // Visual Feedback
        const scene = adventurer.scene;
        if (scene) {
            const gfx = scene.add.circle(trapWorld.x, trapWorld.y, worldRadius, 0x00ffff, 0.3);
            scene.tweens.add({
                targets: gfx,
                scale: 1.2,
                alpha: 0,
                duration: 500,
                onComplete: () => gfx.destroy()
            });
        }

        // Apply Damage to all in range
        adventurers.forEach(target => {
            const dist = Phaser.Math.Distance.Between(trapWorld.x, trapWorld.y, target.x, target.y);
            if (dist <= worldRadius) {
                target.takeDamage(damage, { x: trap.x, y: trap.y }, { gridSystem, pathfinding });
                target.requestEmote('🎇', EmotePriority.HIGH);
            }
        });
    }
}
