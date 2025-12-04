import { ToolType } from '../../data/tools';

export interface GridCell {
    x: number;
    y: number;
    type: ToolType | 'empty' | 'inferno' | 'electric_swamp' | 'toxic_cloud';
    rotate: number;
}

export type GridUpdateCallback = (x: number, y: number, type: string, rotate: number) => void;

interface ComboRule {
    parts: string[];
    result: string;
    msg: string;
}

export class GridSystem {
    private width: number;
    private height: number;
    private grid: GridCell[][];
    private onUpdate?: GridUpdateCallback;

    private combos: ComboRule[] = [
        { parts: ['oil', 'fire'], result: 'inferno', msg: '烈焰地獄！' },
        { parts: ['water', 'lightning'], result: 'electric_swamp', msg: '致命電網！' },
        { parts: ['poison', 'fan'], result: 'toxic_cloud', msg: '劇毒擴散！' }
    ];

    constructor(width: number, height: number, onUpdate?: GridUpdateCallback) {
        this.width = width;
        this.height = height;
        this.onUpdate = onUpdate;
        this.grid = [];
        this.initGrid();
    }

    private initGrid() {
        for (let y = 0; y < this.height; y++) {
            const row: GridCell[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({ x, y, type: 'empty', rotate: 0 });
            }
            this.grid.push(row);
        }
    }

    public getCell(x: number, y: number): GridCell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.grid[y][x];
    }

    public setCell(x: number, y: number, type: ToolType | 'empty', rotate: number = 0) {
        const cell = this.getCell(x, y);
        if (!cell) return;

        // Logic from game.html: if spring, rotate instead of replace if same tool
        if (cell.type === 'spring' && type === 'spring') {
            cell.rotate = (cell.rotate + 1) % 4;
            this.notifyUpdate(cell);
            return;
        }

        cell.type = type;
        cell.rotate = rotate;
        this.notifyUpdate(cell);

        if (type !== 'empty') {
            this.checkSynergy(x, y);
        }
    }

    private notifyUpdate(cell: GridCell) {
        if (this.onUpdate) {
            this.onUpdate(cell.x, cell.y, cell.type, cell.rotate);
        }
    }

    private checkSynergy(x: number, y: number) {
        const currentCell = this.getCell(x, y);
        if (!currentCell) return;

        const neighbors = [
            { x: x, y: y - 1 },
            { x: x, y: y + 1 },
            { x: x - 1, y: y },
            { x: x + 1, y: y }
        ];

        neighbors.forEach(n => {
            const nbCell = this.getCell(n.x, n.y);
            if (nbCell && nbCell.type !== 'empty') {
                this.combos.forEach(recipe => {
                    if ((recipe.parts[0] === currentCell.type && recipe.parts[1] === nbCell.type) ||
                        (recipe.parts[1] === currentCell.type && recipe.parts[0] === nbCell.type)) {
                        this.triggerCombo(currentCell, nbCell, recipe);
                    }
                });
            }
        });
    }

    private triggerCombo(c1: GridCell, c2: GridCell, recipe: ComboRule) {
        console.log(`✨ Synergy Triggered: ${recipe.msg}`);

        // Apply result to both cells
        // Note: In strict TS, we might need to cast string to specific union type if we want to be very safe,
        // but for now we trust our combo rules match the type definition.
        const resultType = recipe.result as any;

        c1.type = resultType;
        c1.rotate = 0;
        this.notifyUpdate(c1);

        c2.type = resultType;
        c2.rotate = 0;
        this.notifyUpdate(c2);
    }
}
