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

    public findPath(
        start: Point,
        end: Point,
        excludeNodes?: Set<string>,
        preferredNodes?: Set<string>
    ): Point[] {
        if (!this.gridSystem.isWalkable(start.x, start.y) || !this.gridSystem.isWalkable(end.x, end.y)) {
            return [];
        }

        const openSet: Node[] = [];
        const closedSet: Set<string> = new Set();
        const openSetMap: Map<string, Node> = new Map(); // Optimization to lookup nodes in openSet

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
        openSetMap.set(`${start.x},${start.y}`, startNode);

        while (openSet.length > 0) {
            // Find node with lowest f score
            // For better performance in large grids, a PriorityQueue should be used.
            // For now, simple array search is okay for small grids.
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
            const currentKey = `${currentNode.x},${currentNode.y}`;
            openSetMap.delete(currentKey);
            closedSet.add(currentKey);

            // Check neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighborPos of neighbors) {
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                // Check Exclude Nodes (Treat as Wall)
                if (excludeNodes && excludeNodes.has(neighborKey)) {
                    continue;
                }

                if (!this.gridSystem.isWalkable(neighborPos.x, neighborPos.y)) {
                    continue;
                }

                // Calculate Cost
                let moveCost = 1;
                if (preferredNodes && preferredNodes.has(neighborKey)) {
                    moveCost = 0.8;
                }

                const gScore = currentNode.g + moveCost;

                let neighborNode = openSetMap.get(neighborKey);

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
                    openSetMap.set(neighborKey, neighborNode);
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
            // Since we check isWalkable later, just bounding check here might be enough, 
            // but relying on GridSystem.getCell to ensure it's in bounds.
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

    public findNearestWalkableTile(start: Point, visited: Set<string>, excludeNodes?: Set<string>): Point | null {
        const queue: Point[] = [start];
        const checked = new Set<string>();
        checked.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = `${current.x},${current.y}`;

            // Check conditions
            const isExcluded = excludeNodes ? excludeNodes.has(key) : false;

            // We want a tile that is:
            // 1. Not in visited (we want something new)
            // 2. Is Walkable
            // 3. Not Excluded
            if (!visited.has(key) && this.gridSystem.isWalkable(current.x, current.y) && !isExcluded) {
                return current;
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const nKey = `${neighbor.x},${neighbor.y}`;
                if (!checked.has(nKey)) {
                    checked.add(nKey);

                    // Only traverse if walkable and not excluded?
                    // If a node is excluded (known trap), we probably shouldn't pass through it to find other nodes?
                    // But if it's just a trap, maybe we can see PAST it?
                    // For safety, let's treat excluded nodes as Walls in BFS as well.
                    const isNeighborExcluded = excludeNodes ? excludeNodes.has(nKey) : false;

                    if (this.gridSystem.isWalkable(neighbor.x, neighbor.y) && !isNeighborExcluded) {
                        queue.push(neighbor);
                    }
                }
            }
        }

        return null;
    }
}

