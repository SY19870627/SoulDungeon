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
        memoryContext?: Map<string, { type: string, detail: string }> | string[],
        getTileCost?: (x: number, y: number) => number
    ): Point[] {
        const memorySize = memoryContext instanceof Map ? memoryContext.size : (Array.isArray(memoryContext) ? memoryContext.length : 0);
        // console.log(`[Pathfinding] findPath from ${start.x},${start.y} to ${end.x},${end.y}. MemoryKeys: ${memorySize}`);

        if (!this.gridSystem.isWalkable(start.x, start.y) || !this.gridSystem.isWalkable(end.x, end.y)) {
            // console.log(`[Pathfinding] Start or End unwalkable`);
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
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                // 1. Check Custom Cost (Deterministic Rules)
                let moveCost = 1;
                if (getTileCost) {
                    const cost = getTileCost(neighborPos.x, neighborPos.y);
                    if (cost === Infinity) {
                        // Treated as unwalkable
                        continue;
                    }
                    moveCost = cost;
                }

                // 2. Semantic Memory Check (Legacy/Fallback)
                const cell = this.gridSystem.getCell(neighborPos.x, neighborPos.y);
                // Logging removed to reduce noise as per "Deterministic" focus usually implies clean logic, 
                // but keeping functionality.

                if (memoryContext) {
                    if (memoryContext instanceof Map) {
                        if (memoryContext.has(neighborKey)) {
                            const memory = memoryContext.get(neighborKey);
                            if (memory && memory.type === 'trap') {
                                // console.log(`[Pathfinding] Avoiding known trap at ${neighborKey}`);
                                continue;
                            }
                        }
                    } else if (Array.isArray(memoryContext)) {
                        if (memoryContext.includes(neighborKey)) {
                            continue;
                        }
                    }
                }

                if (!this.gridSystem.isWalkable(neighborPos.x, neighborPos.y)) {
                    continue;
                }

                const gScore = currentNode.g + moveCost;
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

    public findNearestWalkableTile(start: Point, visited: Set<string>): Point | null {
        const queue: Point[] = [start];
        const checked = new Set<string>();
        checked.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = `${current.x},${current.y}`;

            // If this tile is walkable and NOT visited (and not the start itself, strictly speaking, 
            // but if start is already visited it won't trigger unless we handle start separately.
            // Assuming 'visited' includes current position if we just stepped there.
            // We want to find a target to GO TO.
            if (!visited.has(key) && this.gridSystem.isWalkable(current.x, current.y)) {
                return current;
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const nKey = `${neighbor.x},${neighbor.y}`;
                if (!checked.has(nKey)) {
                    checked.add(nKey);
                    // Only add to queue if walkable? 
                    // BFS for "nearest unvisited" implies we traverse the grid.
                    // If walls block us, we shouldn't pass through them.
                    // So yes, isWalkable check is needed for traversal too.
                    if (this.gridSystem.isWalkable(neighbor.x, neighbor.y)) {
                        queue.push(neighbor);
                    }
                }
            }
        }

        return null;
    }
}
