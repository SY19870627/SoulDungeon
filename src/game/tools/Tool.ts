export interface Tool {
    handlePointerDown(gridX: number, gridY: number): void;
    handlePointerMove(gridX: number, gridY: number): void;
}
