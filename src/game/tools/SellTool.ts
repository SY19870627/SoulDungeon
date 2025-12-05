import { Tool } from './Tool';
import { MainScene } from '../scenes/MainScene';

export class SellTool implements Tool {
    private scene: MainScene;

    constructor(scene: MainScene) {
        this.scene = scene;
    }

    handlePointerDown(gridX: number, gridY: number): void {
        const cell = this.scene.getGridSystem().getCell(gridX, gridY);
        if (!cell) return;

        if (cell.trap) {
            const cost = cell.trap.config.cost;
            if (this.scene.getGridSystem().removeTrap(gridX, gridY)) {
                this.scene.getEconomyManager().addGold(cost);
                this.scene.refresh();
            }
        } else if (cell.isWall) {
            const WALL_COST = 10;
            // toggleWall returns true if wall is added, false if removed.
            // We want to remove, so we expect false.
            // But toggleWall toggles. So if it isWall, it will become not isWall (return false).
            if (!this.scene.getGridSystem().toggleWall(gridX, gridY)) {
                this.scene.getEconomyManager().addGold(WALL_COST);
                this.scene.refresh();
            }
        }
    }

    handlePointerMove(gridX: number, gridY: number): void {
        this.scene.updateHighlight(gridX, gridY);
    }
}
