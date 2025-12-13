export type TrapType = 'damage' | 'physics' | 'elemental';

export interface TrapConfig {
    id: string;
    name: string;
    type: TrapType;
    color: number;
    cost: number;
    damage?: number;
    element?: string; // 'fire', 'water', 'oil', 'lightning'
    cooldown?: number;
    pushDistance?: number;
    emoteSuccess?: string;
    emoteFail?: string;
    isScary?: boolean; // If true, triggers anxiety logic (panic). If false, adventurers walk into it.

    // Component System
    components?: {
        triggers: { type: string, config?: any }[];
        effects: { type: string, config?: any }[];
    };
}

export interface Trap {
    // The static config data
    config: TrapConfig;
    // Dynamic state
    direction?: 'up' | 'down' | 'left' | 'right';
    cooldownTimer: number; // For cooldown management
    x: number;
    y: number;
    // We can keep these for backward compatibility or convenience, 
    // but eventually they should come from config
    type: string;
}

export interface Adventurer {
    id: string;
    type: string;
    hp: number;
    maxHp: number;
    speed: number; // Tiles per second
    gridPosition: { x: number, y: number };
    worldPosition: { x: number, y: number };
    path: { x: number, y: number }[];
    progress: number; // 0 to 1 between current and next tile
}

export interface Tile {
    x: number;
    y: number;
    isWall: boolean;
    trap: Trap | null;
}

export class GridSystem {
    private width: number;
    private height: number;
    private tileSize: number;
    private offsetX: number;
    private offsetY: number;
    private cells: Tile[][];

    constructor(width: number, height: number, tileSize: number, offsetX: number = 0, offsetY: number = 0) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.cells = [];
        this.initialize();
    }

    private initialize() {
        for (let x = 0; x < this.width; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.cells[x][y] = { x, y, isWall: false, trap: null };
            }
        }
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getTileSize(): number {
        return this.tileSize;
    }

    public getCell(x: number, y: number): Tile | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.cells[x][y];
        }
        return null;
    }

    public toggleWall(x: number, y: number): boolean {
        const cell = this.getCell(x, y);
        if (cell) {
            // Cannot place wall if there is a trap
            if (cell.trap) return false;

            cell.isWall = !cell.isWall;
            return cell.isWall;
        }
        return false;
    }

    public placeTrap(x: number, y: number, trap: Trap): boolean {
        const cell = this.getCell(x, y);
        if (cell && !cell.isWall && !cell.trap) {
            cell.trap = trap;
            return true;
        }
        return false;
    }

    public removeTrap(x: number, y: number): boolean {
        const cell = this.getCell(x, y);
        if (cell && cell.trap) {
            cell.trap = null;
            return true;
        }
        return false;
    }

    public isWalkable(x: number, y: number): boolean {
        const cell = this.getCell(x, y);
        // Traps are generally walkable, walls are not
        return cell ? !cell.isWall : false;
    }

    public worldToGrid(x: number, y: number): { x: number, y: number } | null {
        const gridX = Math.floor((x - this.offsetX) / this.tileSize);
        const gridY = Math.floor((y - this.offsetY) / this.tileSize);

        if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
            return { x: gridX, y: gridY };
        }
        return null;
    }

    public gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
        return {
            x: this.offsetX + gridX * this.tileSize + this.tileSize / 2,
            y: this.offsetY + gridY * this.tileSize + this.tileSize / 2
        };
    }

    public getGridOrigin(gridX: number, gridY: number): { x: number, y: number } {
        return {
            x: this.offsetX + gridX * this.tileSize,
            y: this.offsetY + gridY * this.tileSize
        };
    }
}
