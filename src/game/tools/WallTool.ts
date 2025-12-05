import { Tool } from './Tool';
import { MainScene } from '../scenes/MainScene';

export class WallTool implements Tool {
    private scene: MainScene;
    private cost: number = 10;

    constructor(scene: MainScene) {
        this.scene = scene;
    }

    handlePointerDown(gridX: number, gridY: number): void {
        const cell = this.scene.getGridSystem().getCell(gridX, gridY);
        if (!cell) return;

        // If there's a trap, maybe rotate it? Or do nothing?
        // Current logic: If trap exists, rotate it (convenience).
        if (cell.trap) {
            this.scene.rotateTrap(cell.trap);
            this.scene.refresh();
            return;
        }

        // Toggle Wall
        if (!cell.isWall) {
            // Build
            if (this.scene.getEconomyManager().canAfford(this.cost)) {
                if (this.scene.getGridSystem().toggleWall(gridX, gridY)) {
                    this.scene.getEconomyManager().spendGold(this.cost);
                    this.scene.refresh();
                }
            }
        } else {
            // Remove (Refund)
            if (this.scene.getGridSystem().toggleWall(gridX, gridY)) {
                // Should not happen if removing
            } else {
                this.scene.getEconomyManager().addGold(this.cost);
                this.scene.refresh();
            }
        }
    }

    handlePointerMove(gridX: number, gridY: number): void {
        this.scene.updateHighlight(gridX, gridY);
    }
}
