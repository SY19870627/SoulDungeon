import { GridSystem } from './GridSystem';

interface Point {
    x: number;
    y: number;
}

interface Node {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // Total cost (g + h)
    parent: Node | null;
}

export class Pathfinding {
    private gridSystem: GridSystem;

    constructor(gridSystem: GridSystem) {
        this.gridSystem = gridSystem;
    }

    public findPath(start: Point, end: Point): Point[] {
        if (!this.gridSystem.isWalkable(start.x, start.y) || !this.gridSystem.isWalkable(end.x, end.y)) {
            return [];
        }

        const openSet: Node[] = [];
        const closedSet: Set<string> = new Set();

        const startNode: Node = {
            x: start.x,
            y: start.y,
            g: 0,
            h: this.heuristic(start, end),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        openSet.push(startNode);

        while (openSet.length > 0) {
            // Find node with lowest f score
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }

            const currentNode = openSet[currentIndex];

            // Check if reached end
            if (currentNode.x === end.x && currentNode.y === end.y) {
                return this.reconstructPath(currentNode);
            }

            // Move current from open to closed
            openSet.splice(currentIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);

            // Check neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighborPos of neighbors) {
                if (closedSet.has(`${neighborPos.x},${neighborPos.y}`)) {
                    continue;
                }

                if (!this.gridSystem.isWalkable(neighborPos.x, neighborPos.y)) {
                    continue;
                }

                const gScore = currentNode.g + 1; // Assuming cost is 1 for orthogonal movement
                let neighborNode = openSet.find(n => n.x === neighborPos.x && n.y === neighborPos.y);

                if (!neighborNode) {
                    neighborNode = {
                        x: neighborPos.x,
                        y: neighborPos.y,
                        g: gScore,
                        h: this.heuristic(neighborPos, end),
                        f: 0,
                        parent: currentNode
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.g = gScore;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = currentNode;
                }
            }
        }

        return []; // No path found
    }

    private heuristic(a: Point, b: Point): number {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private getNeighbors(node: Point): Point[] {
        const neighbors: Point[] = [];
        const dirs = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];

        for (const dir of dirs) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;
            if (this.gridSystem.getCell(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }

    private reconstructPath(node: Node): Point[] {
        const path: Point[] = [];
        let current: Node | null = node;
        while (current) {
            path.push({ x: current.x, y: current.y });
            current = current.parent;
        }
        return path.reverse();
    }
}
