import { Tool } from './Tool';
import { MainScene } from '../scenes/MainScene';
import { Trap, TrapConfig } from '../systems/GridSystem';
import { TrapSystem } from '../systems/TrapSystem';

export class TrapTool implements Tool {
    private scene: MainScene;
    private trapConfig: TrapConfig | null = null;

    constructor(scene: MainScene) {
        this.scene = scene;
    }

    setTrap(config: TrapConfig) {
        console.log('TrapTool: setTrap', config);
        this.trapConfig = config;
    }

    handlePointerDown(gridX: number, gridY: number): void {
        console.log('TrapTool: handlePointerDown', gridX, gridY, this.trapConfig);
        if (!this.trapConfig) return;

        const cell = this.scene.getGridSystem().getCell(gridX, gridY);
        if (!cell) return;

        // Place Trap
        if (this.scene.getEconomyManager().canAfford(this.trapConfig.cost)) {
            const newTrap: Trap = {
                config: this.trapConfig,
                direction: 'up',
                type: this.trapConfig.type,
                cooldownTimer: 0,
                x: gridX,
                y: gridY
            };

            if (this.scene.getGridSystem().placeTrap(gridX, gridY, newTrap)) {
                this.scene.getEconomyManager().spendGold(this.trapConfig.cost);

                // Check for synergy transformation
                TrapSystem.checkAndApplySynergy(this.scene.getGridSystem(), gridX, gridY);

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
