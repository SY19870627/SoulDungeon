import { Tool } from './Tool';
import { MainScene } from '../scenes/MainScene';
import { Trap } from '../systems/GridSystem';

export class TrapTool implements Tool {
    private scene: MainScene;
    private trapTemplate: Trap | null = null;

    constructor(scene: MainScene) {
        this.scene = scene;
    }

    setTrap(trap: Trap) {
        this.trapTemplate = trap;
    }

    handlePointerDown(gridX: number, gridY: number): void {
        if (!this.trapTemplate) return;

        const cell = this.scene.getGridSystem().getCell(gridX, gridY);
        if (!cell) return;

        // Place Trap
        if (this.scene.getEconomyManager().canAfford(this.trapTemplate.cost)) {
            const newTrap = { ...this.trapTemplate, direction: 'up' as const };

            if (this.scene.getGridSystem().placeTrap(gridX, gridY, newTrap)) {
                this.scene.getEconomyManager().spendGold(this.trapTemplate.cost);
                this.scene.refresh();
            } else {
                // If failed (e.g. occupied), try to rotate
                if (cell.trap) {
                    this.scene.rotateTrap(cell.trap);
                    this.scene.refresh();
                }
            }
        } else {
            console.log('Not enough gold!');
            // Allow rotation even if no gold
            if (cell.trap) {
                this.scene.rotateTrap(cell.trap);
                this.scene.refresh();
            }
        }
    }

    handlePointerMove(gridX: number, gridY: number): void {
        this.scene.updateHighlight(gridX, gridY);
    }
}
