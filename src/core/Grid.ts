export enum CellType {
  Empty,
  Wall,
  Trail,
  Target,
}

export interface GridConfig {
  cols: number;
  rows: number;
  walls: [number, number][];
  targets: [number, number][];
  start: [number, number];
  /** Move thresholds for [3-star, 2-star, 1-star] */
  stars: [number, number, number];
}

export class Grid {
  readonly cols: number;
  readonly rows: number;
  private cells: CellType[][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      this.cells[r] = new Array(cols).fill(CellType.Empty);
    }
  }

  get(col: number, row: number): CellType {
    if (!this.inBounds(col, row)) return CellType.Wall;
    return this.cells[row][col];
  }

  set(col: number, row: number, type: CellType): void {
    if (this.inBounds(col, row)) {
      this.cells[row][col] = type;
    }
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  isWalkable(col: number, row: number): boolean {
    const cell = this.get(col, row);
    return cell === CellType.Empty || cell === CellType.Target;
  }

  static fromConfig(config: GridConfig): Grid {
    const grid = new Grid(config.cols, config.rows);

    // Border walls
    for (let c = 0; c < config.cols; c++) {
      grid.set(c, 0, CellType.Wall);
      grid.set(c, config.rows - 1, CellType.Wall);
    }
    for (let r = 0; r < config.rows; r++) {
      grid.set(0, r, CellType.Wall);
      grid.set(config.cols - 1, r, CellType.Wall);
    }

    // Interior walls
    for (const [c, r] of config.walls) {
      grid.set(c, r, CellType.Wall);
    }
    for (const [c, r] of config.targets) {
      grid.set(c, r, CellType.Target);
    }
    return grid;
  }
}
