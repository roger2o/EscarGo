import { Direction, DIR_DELTA } from './Direction';
import { CellType, GridConfig } from './Grid';

export interface SolveResult {
  found: boolean;
  moves: Direction[];
  optimalMoveCount: number;
  timedOut: boolean;
}

// Cell values matching CellType enum
const EMPTY = CellType.Empty;
const WALL = CellType.Wall;
const TRAIL = CellType.Trail;
const TARGET = CellType.Target;

const NODE_LIMIT = 500_000;

/** All four directions in enum order */
const ALL_DIRS: Direction[] = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
];

/** Opposite direction lookup */
const OPPOSITE: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left,
};

/**
 * Build a flat Uint8Array grid from a GridConfig, applying border walls,
 * interior walls, targets, and the starting trail cell.
 */
function buildGrid(config: GridConfig): Uint8Array {
  const { cols, rows } = config;
  const grid = new Uint8Array(cols * rows); // all EMPTY (0)

  // Border walls
  for (let c = 0; c < cols; c++) {
    grid[c] = WALL;                          // top
    grid[(rows - 1) * cols + c] = WALL;      // bottom
  }
  for (let r = 0; r < rows; r++) {
    grid[r * cols] = WALL;                   // left
    grid[r * cols + cols - 1] = WALL;        // right
  }

  for (const [c, r] of config.walls) grid[r * cols + c] = WALL;
  for (const [c, r] of config.targets) grid[r * cols + c] = TARGET;

  // Start cell becomes trail
  grid[config.start[1] * cols + config.start[0]] = TRAIL;

  return grid;
}

/**
 * Greedy nearest-target chain heuristic (Manhattan).
 * From position (col, row), greedily pick the closest remaining target,
 * then from there the next closest, etc. Returns total Manhattan distance.
 * This is admissible for IDA* (never overestimates, since the snail must
 * traverse at least the Manhattan distance to reach each target in sequence).
 */
function heuristic(
  col: number,
  row: number,
  targetCols: Int8Array,
  targetRows: Int8Array,
  alive: Uint8Array,
  count: number,
): number {
  if (count === 0) return 0;

  // Copy alive flags so we can mark visited
  const used = new Uint8Array(alive);
  let cx = col;
  let cy = row;
  let total = 0;
  let remaining = count;

  while (remaining > 0) {
    let bestDist = 0x7fffffff;
    let bestIdx = -1;
    for (let i = 0; i < used.length; i++) {
      if (!used[i]) continue;
      const d = Math.abs(targetCols[i] - cx) + Math.abs(targetRows[i] - cy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    total += bestDist;
    cx = targetCols[bestIdx];
    cy = targetRows[bestIdx];
    used[bestIdx] = 0;
    remaining--;
  }

  return total;
}

/**
 * Flood-fill reachability check. Returns false if any alive target
 * is unreachable from (col, row) through walkable cells.
 */
function allTargetsReachable(
  grid: Uint8Array,
  cols: number,
  rows: number,
  col: number,
  row: number,
  targetCols: Int8Array,
  targetRows: Int8Array,
  alive: Uint8Array,
  aliveCount: number,
): boolean {
  if (aliveCount === 0) return true;

  const size = cols * rows;
  const visited = new Uint8Array(size);
  // BFS using a simple queue (preallocated array)
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  const startIdx = row * cols + col;
  visited[startIdx] = 1;
  queue[tail++] = startIdx;

  let found = 0;

  while (head < tail) {
    const idx = queue[head++];
    const c = idx % cols;
    const r = (idx - c) / cols;

    // Check if this is an alive target
    for (let t = 0; t < alive.length; t++) {
      if (alive[t] && targetCols[t] === c && targetRows[t] === r) {
        found++;
        if (found === aliveCount) return true;
        break;
      }
    }

    // Expand neighbors (up, down, left, right)
    const neighbors = [idx - cols, idx + cols, idx - 1, idx + 1];
    for (let n = 0; n < 4; n++) {
      const ni = neighbors[n];
      if (ni < 0 || ni >= size) continue;
      // Prevent horizontal wrapping
      if (n === 2 && c === 0) continue;
      if (n === 3 && c === cols - 1) continue;
      if (visited[ni]) continue;
      const cell = grid[ni];
      if (cell === WALL || cell === TRAIL) continue;
      visited[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return found >= aliveCount;
}

/**
 * Solve a level using IDA* (Iterative Deepening A*).
 * Returns the optimal sequence of Direction moves (one per tick).
 */
export function solve(config: GridConfig): SolveResult {
  const { cols, rows } = config;
  const grid = buildGrid(config);
  const startCol = config.start[0];
  const startRow = config.start[1];

  const numTargets = config.targets.length;
  const targetCols = new Int8Array(numTargets);
  const targetRows = new Int8Array(numTargets);
  for (let i = 0; i < numTargets; i++) {
    targetCols[i] = config.targets[i][0];
    targetRows[i] = config.targets[i][1];
  }
  const alive = new Uint8Array(numTargets);
  alive.fill(1);

  // Path stack for recording moves
  const path: Direction[] = [];
  let nodeCount = 0;
  let timedOut = false;

  // We need to search over all initial facing directions since the snail
  // hasn't committed to a direction yet on the first move.
  // Actually, from the game code, the snail starts facing Right.
  // But the solver should find optimal over any initial direction.
  // Let's try all 4 initial directions.

  function search(
    col: number,
    row: number,
    facing: Direction,
    g: number,
    bound: number,
    targetsRemaining: number,
  ): number {
    // Returns: -1 if found, otherwise minimum f that exceeded bound
    const h = heuristic(col, row, targetCols, targetRows, alive, targetsRemaining);
    const f = g + h;
    if (f > bound) return f;
    if (targetsRemaining === 0) return -1; // solved!

    nodeCount++;
    if (nodeCount > NODE_LIMIT) {
      timedOut = true;
      return 0x7fffffff;
    }

    let minExceeded = 0x7fffffff;

    // Try 3 directions: straight, turn left, turn right (never reverse)
    for (let d = 0; d < 4; d++) {
      const dir = ALL_DIRS[d];
      if (dir === OPPOSITE[facing]) continue; // no 180

      const [dx, dy] = DIR_DELTA[dir];
      const nc = col + dx;
      const nr = row + dy;
      const ni = nr * cols + nc;
      const cell = grid[ni];

      if (cell === WALL || cell === TRAIL) continue;

      const wasTarget = cell === TARGET;
      let targetIdx = -1;
      if (wasTarget) {
        for (let t = 0; t < numTargets; t++) {
          if (alive[t] && targetCols[t] === nc && targetRows[t] === nr) {
            targetIdx = t;
            break;
          }
        }
      }

      // Apply move
      grid[ni] = TRAIL;
      const newRemaining = wasTarget ? targetsRemaining - 1 : targetsRemaining;
      if (targetIdx >= 0) alive[targetIdx] = 0;

      // Prune: check reachability only when we just placed trail (which could cut off targets)
      let reachable = true;
      if (newRemaining > 0) {
        reachable = allTargetsReachable(
          grid, cols, rows, nc, nr,
          targetCols, targetRows, alive, newRemaining,
        );
      }

      if (reachable) {
        path.push(dir);
        const result = search(nc, nr, dir, g + 1, bound, newRemaining);
        if (result === -1) return -1; // found!
        if (result < minExceeded) minExceeded = result;
        path.pop();
      }

      // Restore
      grid[ni] = cell;
      if (targetIdx >= 0) alive[targetIdx] = 1;

      if (timedOut) return 0x7fffffff;
    }

    return minExceeded;
  }

  // IDA* loop - try all 4 initial directions
  const initialH = heuristic(startCol, startRow, targetCols, targetRows, alive, numTargets);
  let bound = initialH;

  for (let iter = 0; iter < 300; iter++) {
    // Try each possible initial direction
    let globalMin = 0x7fffffff;

    for (let d = 0; d < 4; d++) {
      const initDir = ALL_DIRS[d];
      const [dx, dy] = DIR_DELTA[initDir];
      const nc = startCol + dx;
      const nr = startRow + dy;
      const ni = nr * cols + nc;
      const cell = grid[ni];

      if (cell === WALL || cell === TRAIL) continue;

      const wasTarget = cell === TARGET;
      let targetIdx = -1;
      if (wasTarget) {
        for (let t = 0; t < numTargets; t++) {
          if (alive[t] && targetCols[t] === nc && targetRows[t] === nr) {
            targetIdx = t;
            break;
          }
        }
      }

      // Apply first move
      grid[ni] = TRAIL;
      const newRemaining = wasTarget ? numTargets - 1 : numTargets;
      if (targetIdx >= 0) alive[targetIdx] = 0;

      path.push(initDir);
      const result = search(nc, nr, initDir, 1, bound, newRemaining);

      if (result === -1) {
        // Found solution
        return {
          found: true,
          moves: [...path],
          optimalMoveCount: path.length,
          timedOut: false,
        };
      }

      path.pop();

      // Restore
      grid[ni] = cell;
      if (targetIdx >= 0) alive[targetIdx] = 1;

      if (result < globalMin) globalMin = result;
      if (timedOut) break;
    }

    if (timedOut) break;
    if (globalMin === 0x7fffffff) break; // no solution possible
    bound = globalMin;
  }

  return {
    found: false,
    moves: [],
    optimalMoveCount: 0,
    timedOut,
  };
}
