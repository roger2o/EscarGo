import { GridConfig } from '../core/Grid';

// All levels include automatic border walls from Grid.fromConfig.
// Playable area is (1,1) to (cols-2, rows-2).

export const gardenLevels: GridConfig[] = [
  // Level 1: Big open field, one target (12x10)
  {
    cols: 12, rows: 10,
    walls: [],
    targets: [[10, 5]],
    start: [1, 5],
    stars: [12, 20, 99],
  },
  // Level 2: Two targets, wide open (14x12)
  {
    cols: 14, rows: 12,
    walls: [],
    targets: [[12, 1], [12, 10]],
    start: [1, 6],
    stars: [18, 28, 99],
  },
  // Level 3: Central wall obstacle (14x12)
  {
    cols: 14, rows: 12,
    walls: [
      [7, 4], [7, 5], [7, 6], [7, 7],
    ],
    targets: [[12, 1], [1, 10], [12, 10]],
    start: [1, 1],
    stars: [24, 34, 99],
  },
  // Level 4: Corridor with pillars (16x12)
  {
    cols: 16, rows: 12,
    walls: [
      [4, 3], [4, 4],
      [8, 3], [8, 4],
      [12, 3], [12, 4],
      [4, 7], [4, 8],
      [8, 7], [8, 8],
      [12, 7], [12, 8],
    ],
    targets: [[14, 1], [14, 10], [7, 5], [1, 10]],
    start: [1, 5],
    stars: [28, 40, 99],
  },
  // Level 5: Winding snake run (18x14)
  {
    cols: 18, rows: 14,
    walls: [
      // Horizontal barriers with gaps
      [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
      [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6],
      [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9],
    ],
    targets: [[16, 2], [1, 7], [16, 12], [8, 11]],
    start: [1, 1],
    stars: [36, 50, 99],
  },

  // Level 6: Garden Gate - wall divides grid, one narrow gap (12x10)
  {
    cols: 12, rows: 10,
    walls: [
      [6, 1], [6, 2], [6, 3], [6, 4],
      [6, 6], [6, 7], [6, 8],
    ],
    targets: [[3, 2], [9, 2], [9, 7], [3, 7]],
    start: [1, 1],
    stars: [22, 32, 99],
  },

  // Level 7: Flower Beds - 2x2 wall clusters with targets in channels (14x10)
  {
    cols: 14, rows: 10,
    walls: [
      [4, 3], [5, 3], [4, 4], [5, 4],
      [9, 3], [10, 3], [9, 4], [10, 4],
      [4, 6], [5, 6], [4, 7], [5, 7],
      [9, 6], [10, 6], [9, 7], [10, 7],
    ],
    targets: [[7, 2], [2, 5], [12, 5], [7, 8], [7, 5]],
    start: [1, 1],
    stars: [26, 38, 99],
  },

  // Level 8: The Greenhouse - two rooms, one doorway (14x12)
  {
    cols: 14, rows: 12,
    walls: [
      // Vertical divider with single gap at row 6
      [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
      [7, 7], [7, 8], [7, 9], [7, 10],
    ],
    targets: [[3, 2], [3, 9], [5, 5], [10, 2], [10, 9]],
    start: [1, 1],
    stars: [28, 40, 99],
  },

  // Level 9: Stepping Stones - dense pillar field (12x12)
  {
    cols: 12, rows: 12,
    walls: [
      [3, 3], [5, 3], [7, 3], [9, 3],
      [2, 5], [4, 5], [6, 5], [8, 5], [10, 5],
      [3, 7], [5, 7], [7, 7], [9, 7],
      [2, 9], [4, 9], [6, 9], [8, 9], [10, 9],
    ],
    targets: [[1, 1], [10, 1], [5, 6], [1, 10], [10, 10]],
    start: [5, 4],
    stars: [28, 42, 99],
  },

  // Level 10: Hedge Rows - alternating walls force S-curves (14x12)
  {
    cols: 14, rows: 12,
    walls: [
      // Row from left, gap on right
      [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],
      // Row from right, gap on left
      [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
      // Row from left, gap on right
      [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
      // Row from right, gap on left
      [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
    ],
    targets: [[12, 2], [1, 4], [12, 6], [1, 8], [12, 10]],
    start: [1, 1],
    stars: [32, 46, 99],
  },

  // Level 11: The Bottleneck - three chambers with tight 1-tile passages (16x12)
  {
    cols: 16, rows: 12,
    walls: [
      // First divider (gap at row 3)
      [5, 1], [5, 2],
      [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10],
      // Second divider (gap at row 8)
      [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
      [10, 9], [10, 10],
    ],
    targets: [[3, 2], [3, 8], [7, 5], [13, 2], [13, 8]],
    start: [1, 5],
    stars: [30, 44, 99],
  },

  // Level 12: Tight Squeeze - compact grid, lots of walls (10x10)
  {
    cols: 10, rows: 10,
    walls: [
      [3, 2], [4, 2],
      [6, 2], [7, 2],
      [2, 4], [3, 4],
      [5, 4], [5, 5],
      [7, 4], [8, 4],
      [3, 6], [4, 6],
      [6, 7], [7, 7],
    ],
    targets: [[1, 1], [8, 1], [1, 8], [8, 8], [5, 3]],
    start: [4, 5],
    stars: [24, 36, 99],
  },

  // Level 13: Spiral Garden - walls form a spiral (14x14)
  {
    cols: 14, rows: 14,
    walls: [
      // Outer spiral arm (top, going right)
      [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],
      // Right side going down
      [11, 4], [11, 5], [11, 6], [11, 7], [11, 8], [11, 9], [11, 10],
      // Bottom going left
      [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10],
      // Left side going up
      [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
      // Inner arm
      [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
      [9, 6], [9, 7], [9, 8],
      [5, 8], [6, 8], [7, 8], [8, 8],
    ],
    targets: [[1, 1], [12, 1], [12, 12], [1, 12], [7, 7], [6, 2]],
    start: [1, 2],
    stars: [38, 54, 99],
  },

  // Level 14: Root Network - branching corridors (16x14)
  {
    cols: 16, rows: 14,
    walls: [
      // Horizontal trunk
      [1, 6], [2, 6], [3, 6], [4, 6],
      [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
      // Upper branches
      [4, 2], [4, 3], [4, 4],
      [8, 1], [8, 2], [8, 3], [8, 4],
      [12, 2], [12, 3], [12, 4],
      // Lower branches
      [4, 8], [4, 9], [4, 10], [4, 11],
      [8, 8], [8, 9], [8, 10], [8, 11],
      [12, 8], [12, 9], [12, 10],
    ],
    targets: [[2, 2], [6, 1], [10, 1], [14, 2], [2, 10], [10, 12], [14, 10]],
    start: [6, 6],
    stars: [40, 58, 99],
  },

  // Level 15: Final Bloom - complex mixed layout (18x14)
  {
    cols: 18, rows: 14,
    walls: [
      // Central cross
      [9, 4], [9, 5], [9, 6], [9, 7], [9, 8], [9, 9],
      [6, 7], [7, 7], [8, 7], [10, 7], [11, 7], [12, 7],
      // Corner blocks
      [3, 2], [4, 2], [3, 3], [4, 3],
      [13, 2], [14, 2], [13, 3], [14, 3],
      [3, 10], [4, 10], [3, 11], [4, 11],
      [13, 10], [14, 10], [13, 11], [14, 11],
      // Extra obstacles
      [7, 4], [11, 4],
      [7, 10], [11, 10],
    ],
    targets: [[1, 1], [16, 1], [1, 12], [16, 12], [9, 1], [9, 12], [5, 7]],
    start: [1, 6],
    stars: [44, 62, 99],
  },
];
