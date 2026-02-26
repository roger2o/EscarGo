import Phaser from 'phaser';
import { Grid, CellType, GridConfig } from '../core/Grid';
import { Direction, DIR_DELTA } from '../core/Direction';
import { InputHandler } from '../core/InputHandler';
import { gardenLevels } from '../levels/garden';
import { Theme, getThemeForWorld } from '../core/Theme';
import { solve, SolveResult } from '../core/Solver';
import { getProgress, saveProgress } from '../core/Progress';

/** Milliseconds between each auto-move tick */
const TICK_MS = 350;

/** Maximum cell size in pixels to prevent comically large tiles */
const MAX_CELL = 52;

/** Clean sans-serif font stack */
const FONT_FAMILY = 'Segoe UI, Roboto, Helvetica, Arial, sans-serif';

export class GameScene extends Phaser.Scene {
  private grid!: Grid;
  private levelConfig!: GridConfig;
  private currentLevel = 0;
  private snailCol = 0;
  private snailRow = 0;
  private facing: Direction = Direction.Right;
  private nextDirection: Direction | null = null;
  private moveCount = 0;
  private targetsLeft = 0;
  private inputHandler!: InputHandler;
  private gameOver = false;
  private paused = false;

  // Solver
  private solveResult: SolveResult | null = null;

  // Replay
  private replaying = false;
  private replayPath: Direction[] = [];
  private replayIndex = 0;
  private replayTimer: Phaser.Time.TimerEvent | null = null;
  private replayUI: Phaser.GameObjects.GameObject[] = [];

  // Theme
  private theme: Theme = getThemeForWorld('garden');

  // Auto-move
  private moveTimer: Phaser.Time.TimerEvent | null = null;
  private animProgress = 0;
  private animFromCol = 0;
  private animFromRow = 0;
  private isAnimating = false;

  // Display objects
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private snailGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private uiText!: Phaser.GameObjects.Text;
  private restartBtn!: Phaser.GameObjects.Text;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private cellSize = 0;

  // Overlay
  private overlayElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.inputHandler = new InputHandler(
      this,
      (dir) => this.steer(dir),
      () => {},
      () => this.loadLevel(this.currentLevel),
    );
    const progress = getProgress();
    this.currentLevel = Math.min(progress.currentLevel, gardenLevels.length - 1);
    this.applyTheme();
    this.loadLevel(this.currentLevel);
    this.scale.on('resize', () => this.redraw());
  }

  private applyTheme(): void {
    this.theme = getThemeForWorld('garden');
    this.cameras.main.setBackgroundColor(this.theme.sceneBg);
    document.body.style.background = this.theme.htmlBg;
  }

  private steer(dir: Direction): void {
    if (this.gameOver || this.replaying) return;

    const opposite: Record<Direction, Direction> = {
      [Direction.Up]: Direction.Down,
      [Direction.Down]: Direction.Up,
      [Direction.Left]: Direction.Right,
      [Direction.Right]: Direction.Left,
    };
    if (dir === opposite[this.facing]) return;

    this.nextDirection = dir;
  }

  private loadLevel(index: number): void {
    if (this.moveTimer) {
      this.moveTimer.destroy();
      this.moveTimer = null;
    }

    // Clean up replay state
    this.stopReplay();
    this.solveResult = null;

    this.levelConfig = gardenLevels[index];
    this.grid = Grid.fromConfig(this.levelConfig);
    this.snailCol = this.levelConfig.start[0];
    this.snailRow = this.levelConfig.start[1];
    this.facing = Direction.Right;
    this.nextDirection = null;
    this.moveCount = 0;
    this.targetsLeft = this.levelConfig.targets.length;
    this.gameOver = false;
    this.paused = false;
    this.isAnimating = false;

    this.grid.set(this.snailCol, this.snailRow, CellType.Trail);

    this.destroyOverlay();
    this.clearDisplay();
    this.glowGraphics = this.add.graphics();
    this.gridGraphics = this.add.graphics();
    this.snailGraphics = this.add.graphics();

    const t = this.theme;

    this.uiText = this.add.text(0, 0, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: t.colors.uiText,
    });

    this.restartBtn = this.add.text(0, 0, '\u21bb Restart', {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      fontStyle: '500',
      color: t.colors.buttonText,
      backgroundColor: '#' + t.colors.buttonBg.toString(16).padStart(6, '0'),
      padding: { x: 14, y: 9 },
    }).setInteractive({ useHandCursor: true });
    this.restartBtn.on('pointerdown', () => this.loadLevel(this.currentLevel));

    this.redraw();

    this.moveTimer = this.time.addEvent({
      delay: TICK_MS,
      loop: true,
      callback: () => this.tick(),
    });
  }

  private tick(): void {
    if (this.gameOver || this.paused) return;

    if (this.nextDirection !== null) {
      this.facing = this.nextDirection;
      this.nextDirection = null;
    }

    const [dx, dy] = DIR_DELTA[this.facing];
    const newCol = this.snailCol + dx;
    const newRow = this.snailRow + dy;

    if (!this.grid.isWalkable(newCol, newRow)) {
      this.crash();
      return;
    }

    if (this.grid.get(newCol, newRow) === CellType.Target) {
      this.targetsLeft--;
    }

    this.animFromCol = this.snailCol;
    this.animFromRow = this.snailRow;

    this.grid.set(newCol, newRow, CellType.Trail);
    this.snailCol = newCol;
    this.snailRow = newRow;
    this.moveCount++;

    this.animProgress = 0;
    this.isAnimating = true;

    this.drawGrid();
    this.drawUI();

    if (this.targetsLeft <= 0) {
      this.win();
    }
  }

  update(_time: number, delta: number): void {
    if (!this.isAnimating) return;

    this.animProgress += delta / TICK_MS;
    if (this.animProgress >= 1) {
      this.animProgress = 1;
      this.isAnimating = false;
    }

    const drawCol = this.animFromCol + (this.snailCol - this.animFromCol) * this.animProgress;
    const drawRow = this.animFromRow + (this.snailRow - this.animFromRow) * this.animProgress;
    this.drawSnailAt(drawCol, drawRow);
  }

  private crash(): void {
    this.gameOver = true;
    if (this.moveTimer) {
      this.moveTimer.destroy();
      this.moveTimer = null;
    }

    this.solveResult = solve(this.levelConfig);

    let msg = 'Crashed!\nHit an obstacle';
    if (this.solveResult.found) {
      msg += `\nOptimal: ${this.solveResult.optimalMoveCount} moves`;
    }

    const buttons: { label: string; action: () => void }[] = [
      { label: 'Retry', action: () => this.loadLevel(this.currentLevel) },
    ];
    if (this.solveResult.found) {
      buttons.push({ label: 'Show Path', action: () => this.startReplay() });
    }

    this.showOverlay(msg, buttons);
  }

  private win(): void {
    this.gameOver = true;
    if (this.moveTimer) {
      this.moveTimer.destroy();
      this.moveTimer = null;
    }

    this.solveResult = solve(this.levelConfig);

    const stars = this.getStars();
    saveProgress(this.currentLevel, stars);

    let msg = `Level Complete!\n${this.makeStarDisplay(stars)}\nMoves: ${this.moveCount}`;
    if (this.solveResult.found) {
      msg += `\nOptimal: ${this.solveResult.optimalMoveCount} moves`;
    }

    const buttons: { label: string; action: () => void }[] = [
      { label: 'Next Level', action: () => this.nextLevel() },
      { label: 'Retry', action: () => this.loadLevel(this.currentLevel) },
    ];
    if (this.solveResult.found) {
      buttons.push({ label: 'Show Path', action: () => this.startReplay() });
    }

    this.showOverlay(msg, buttons);
  }

  // --- Replay system ---

  private startReplay(): void {
    if (!this.solveResult?.found) return;

    this.destroyOverlay();
    this.replayPath = this.solveResult.moves;
    this.replayIndex = 0;
    this.replaying = true;

    // Reset grid to fresh state
    this.grid = Grid.fromConfig(this.levelConfig);
    this.snailCol = this.levelConfig.start[0];
    this.snailRow = this.levelConfig.start[1];
    this.facing = this.replayPath[0] ?? Direction.Right;
    this.moveCount = 0;
    this.targetsLeft = this.levelConfig.targets.length;
    this.grid.set(this.snailCol, this.snailRow, CellType.Trail);
    this.isAnimating = false;

    this.drawGrid();
    this.drawSnailAt(this.snailCol, this.snailRow);
    this.drawUI();
    this.showReplayUI();

    this.replayTimer = this.time.addEvent({
      delay: TICK_MS,
      loop: true,
      callback: () => this.replayTick(),
    });
  }

  private replayTick(): void {
    if (this.replayIndex >= this.replayPath.length) {
      this.finishReplay();
      return;
    }

    const dir = this.replayPath[this.replayIndex];
    this.facing = dir;
    this.replayIndex++;

    const [dx, dy] = DIR_DELTA[this.facing];
    const newCol = this.snailCol + dx;
    const newRow = this.snailRow + dy;

    if (this.grid.get(newCol, newRow) === CellType.Target) {
      this.targetsLeft--;
    }

    this.animFromCol = this.snailCol;
    this.animFromRow = this.snailRow;

    this.grid.set(newCol, newRow, CellType.Trail);
    this.snailCol = newCol;
    this.snailRow = newRow;
    this.moveCount++;

    this.animProgress = 0;
    this.isAnimating = true;

    this.drawGrid();
    this.drawUI();
  }

  private finishReplay(): void {
    if (this.replayTimer) {
      this.replayTimer.destroy();
      this.replayTimer = null;
    }
    this.destroyReplayUI();
    this.replaying = false;

    this.showOverlay('Optimal Path Complete!', [
      { label: 'Watch Again', action: () => this.startReplay() },
      { label: 'Retry', action: () => this.loadLevel(this.currentLevel) },
      { label: 'Next Level', action: () => this.nextLevel() },
    ]);
  }

  private stopReplay(): void {
    if (this.replayTimer) {
      this.replayTimer.destroy();
      this.replayTimer = null;
    }
    this.destroyReplayUI();
    this.replaying = false;
    this.replayPath = [];
    this.replayIndex = 0;
  }

  private showReplayUI(): void {
    this.destroyReplayUI();
    const { width } = this.scale;
    const t = this.theme;

    const label = this.add.text(width / 2, 12, 'Replaying optimal path...', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      fontStyle: 'bold',
      color: t.colors.uiText,
    }).setOrigin(0.5, 0);
    this.replayUI.push(label);

    const stopBtn = this.add.text(width / 2, 36, 'Stop', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: t.colors.buttonText,
      backgroundColor: '#' + t.colors.buttonBg.toString(16).padStart(6, '0'),
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    stopBtn.on('pointerdown', () => {
      this.stopReplay();
      this.loadLevel(this.currentLevel);
    });
    this.replayUI.push(stopBtn);
  }

  private destroyReplayUI(): void {
    this.replayUI.forEach((el) => el.destroy());
    this.replayUI = [];
  }

  private nextLevel(): void {
    this.destroyOverlay();
    this.currentLevel = (this.currentLevel + 1) % gardenLevels.length;
    this.loadLevel(this.currentLevel);
  }

  private clearDisplay(): void {
    if (this.glowGraphics) this.glowGraphics.destroy();
    if (this.gridGraphics) this.gridGraphics.destroy();
    if (this.snailGraphics) this.snailGraphics.destroy();
    if (this.uiText) this.uiText.destroy();
    if (this.restartBtn) this.restartBtn.destroy();
  }

  private calculateLayout(): void {
    const { width, height } = this.scale;
    const padding = 20;
    const uiTopHeight = 50;
    const uiBtnHeight = 50;
    const availW = width - padding * 2;
    const availH = height - padding * 2 - uiTopHeight - uiBtnHeight;

    const calculated = Math.floor(Math.min(availW / this.grid.cols, availH / this.grid.rows));
    this.cellSize = Math.min(calculated, MAX_CELL);
    const gridW = this.cellSize * this.grid.cols;
    const gridH = this.cellSize * this.grid.rows;
    this.gridOffsetX = Math.floor((width - gridW) / 2);
    this.gridOffsetY = Math.floor((height - gridH + uiTopHeight - uiBtnHeight) / 2);
  }

  private redraw(): void {
    this.calculateLayout();
    this.drawGrid();
    this.drawSnailAt(this.snailCol, this.snailRow);
    this.drawUI();
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    const glow = this.glowGraphics;
    g.clear();
    glow.clear();

    const t = this.theme;
    const cs = this.cellSize;
    const gap = t.cellGap ? cs * t.cellGap : 0;
    const radius = t.cellRadius ? cs * t.cellRadius : 0;
    const shadow = t.shadow;

    // Grid frame
    const frameInset = 4;
    const frameX = this.gridOffsetX - frameInset;
    const frameY = this.gridOffsetY - frameInset;
    const frameW = this.grid.cols * cs + frameInset * 2;
    const frameH = this.grid.rows * cs + frameInset * 2;
    const frameRadius = 6;

    // Frame shadow
    if (shadow) {
      g.fillStyle(shadow.color, shadow.alpha * 0.6);
      g.fillRoundedRect(
        frameX + shadow.offsetX + 1,
        frameY + shadow.offsetY + 1,
        frameW, frameH, frameRadius
      );
    }
    // Frame border
    g.lineStyle(2, t.colors.uiBorder, 0.6);
    g.strokeRoundedRect(frameX, frameY, frameW, frameH, frameRadius);

    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const x = this.gridOffsetX + c * cs + gap;
        const y = this.gridOffsetY + r * cs + gap;
        const size = cs - gap * 2;
        const cell = this.grid.get(c, r);

        // Wall shadow (drawn before wall)
        if (cell === CellType.Wall && shadow) {
          g.fillStyle(shadow.color, shadow.alpha);
          if (t.roundedCells && radius > 0) {
            g.fillRoundedRect(x + shadow.offsetX, y + shadow.offsetY, size, size, radius);
          } else {
            g.fillRect(x + shadow.offsetX, y + shadow.offsetY, size, size);
          }
        }

        // Cell background
        let color: number;
        switch (cell) {
          case CellType.Wall:
            color = t.colors.wall;
            break;
          case CellType.Trail:
            color = t.colors.trail;
            break;
          default:
            color = (c + r) % 2 === 0 ? t.colors.empty : t.colors.emptyAlt;
        }

        g.fillStyle(color, 1);
        if (t.roundedCells && radius > 0) {
          g.fillRoundedRect(x, y, size, size, radius);
        } else {
          g.fillRect(x, y, size, size);
        }

        // Grid line (skip on trail cells so they merge smoothly)
        if (cell !== CellType.Trail) {
          g.lineStyle(1, t.colors.gridLine, t.colors.gridLineAlpha);
          if (t.roundedCells && radius > 0) {
            g.strokeRoundedRect(x, y, size, size, radius);
          } else {
            g.strokeRect(x, y, size, size);
          }
        }

        // Trail detail - lighter center stripe
        if (cell === CellType.Trail) {
          if (t.glow?.trail) {
            glow.fillStyle(t.glow.trail.color, t.glow.trail.alpha);
            const expand = t.glow.trail.blur;
            glow.fillRoundedRect(x - expand / 2, y - expand / 2, size + expand, size + expand, radius + 4);
          }
          // Inner gradient effect: lighter center stripe
          g.fillStyle(t.colors.trailDetail, 0.25);
          const inset = cs * 0.2;
          g.fillRoundedRect(x + inset - gap, y + inset - gap, size - (inset - gap) * 2, size - (inset - gap) * 2, 3);
          // Even lighter core
          g.fillStyle(t.colors.trailDetail, 0.15);
          const innerInset = cs * 0.32;
          g.fillRoundedRect(x + innerInset - gap, y + innerInset - gap, size - (innerInset - gap) * 2, size - (innerInset - gap) * 2, 2);
        }

        // Target
        if (cell === CellType.Target) {
          if (t.glow?.target) {
            glow.fillStyle(t.glow.target.color, t.glow.target.alpha);
            const expand = t.glow.target.blur;
            const tcx = x + size / 2;
            const tcy = y + size / 2;
            glow.fillCircle(tcx, tcy, size * 0.45 + expand / 2);
          }
          this.drawTarget(g, x + size / 2, y + size / 2, size * 0.35);
        }

        // Wall detail
        if (cell === CellType.Wall) {
          g.fillStyle(t.colors.wallDetail, 1);
          const inset = cs * 0.1;
          if (t.roundedCells && radius > 0) {
            g.fillRoundedRect(x + inset - gap, y + inset - gap, size - (inset - gap) * 2, size - (inset - gap) * 2, radius * 0.6);
          } else {
            g.fillRect(x + inset - gap, y + inset - gap, size - (inset - gap) * 2, size - (inset - gap) * 2);
          }
          g.fillStyle(t.colors.wallHighlight, 0.5);
          g.fillRect(x + inset * 2 - gap, y + inset * 2 - gap, cs * 0.3, cs * 0.3);
        }
      }
    }
  }

  /** Draw a polished orb/gem target instead of a crude flower */
  private drawTarget(g: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number): void {
    const t = this.theme;

    // Shadow underneath
    if (t.shadow) {
      g.fillStyle(t.shadow.color, t.shadow.alpha * 0.5);
      g.fillCircle(cx + 1, cy + 2, radius * 0.85);
    }

    // Outer glow ring
    g.fillStyle(t.colors.petalColors[0], 0.3);
    g.fillCircle(cx, cy, radius * 1.1);

    // Main colored disc
    g.fillStyle(t.colors.target, 1);
    g.fillCircle(cx, cy, radius * 0.8);

    // Mid ring for depth
    g.fillStyle(t.colors.petalColors[1] ?? t.colors.target, 0.5);
    g.fillCircle(cx, cy, radius * 0.6);

    // Inner highlight dot (specular)
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx - radius * 0.2, cy - radius * 0.2, radius * 0.22);
  }

  private drawSnailAt(col: number, row: number): void {
    const g = this.snailGraphics;
    g.clear();

    const t = this.theme;
    const cs = this.cellSize;
    const cx = this.gridOffsetX + col * cs + cs / 2;
    const cy = this.gridOffsetY + row * cs + cs / 2;
    const r = cs * 0.38;

    // Drop shadow under snail
    if (t.shadow) {
      g.fillStyle(t.shadow.color, t.shadow.alpha * 0.6);
      g.fillCircle(cx + t.shadow.offsetX, cy + t.shadow.offsetY, r * 0.95);
    }

    // Glow under snail (neon theme)
    if (t.glow?.snail) {
      g.fillStyle(t.glow.snail.color, t.glow.snail.alpha);
      g.fillCircle(cx, cy, r + t.glow.snail.blur);
    }

    // Shell - 3 concentric layers for gradient-like depth
    g.fillStyle(t.colors.snailShell, 1);
    g.fillCircle(cx, cy, r);
    g.fillStyle(t.colors.snail, 0.9);
    g.fillCircle(cx, cy, r * 0.78);
    g.fillStyle(t.colors.snail, 0.5);
    g.fillCircle(cx, cy, r * 0.55);

    // Shell spiral
    g.lineStyle(1.5, t.colors.snailShell, 0.7);
    g.beginPath();
    for (let i = 0; i < 24; i++) {
      const sp = i / 24;
      const angle = sp * Math.PI * 3;
      const sr = sp * r * 0.55;
      const sx = cx + Math.cos(angle) * sr;
      const sy = cy + Math.sin(angle) * sr;
      if (i === 0) g.moveTo(sx, sy);
      else g.lineTo(sx, sy);
    }
    g.strokePath();

    // Head - slightly larger ratio for cuter look
    const [dx, dy] = DIR_DELTA[this.facing];
    const headX = cx + dx * r * 0.75;
    const headY = cy + dy * r * 0.75;
    g.fillStyle(t.colors.snailHead, 1);
    g.fillCircle(headX, headY, r * 0.48);

    // Eyes on stalks with smooth curves
    const eyeOffset = r * 0.22;
    const perpX = -dy;
    const perpY = dx;
    for (const side of [-1, 1]) {
      const ex = headX + dx * r * 0.2 + perpX * eyeOffset * side;
      const ey = headY + dy * r * 0.2 + perpY * eyeOffset * side;

      // Eye stalk - thicker, smoother
      g.lineStyle(2.5, t.colors.snailHead, 0.9);
      g.beginPath();
      const stalkBaseX = headX + perpX * eyeOffset * side * 0.3;
      const stalkBaseY = headY + perpY * eyeOffset * side * 0.3;
      const ctrlX = (stalkBaseX + ex) / 2 + perpX * side * r * 0.05;
      const ctrlY = (stalkBaseY + ey) / 2 + perpY * side * r * 0.05;
      g.moveTo(stalkBaseX, stalkBaseY);
      // Approximate a curve with a midpoint
      g.lineTo(ctrlX, ctrlY);
      g.lineTo(ex, ey);
      g.strokePath();

      // Eye white (slightly larger)
      g.fillStyle(t.colors.snailEyeWhite, 1);
      g.fillCircle(ex, ey, r * 0.16);
      // Pupil
      g.fillStyle(t.colors.snailEyePupil, 1);
      g.fillCircle(ex + dx * r * 0.04, ey + dy * r * 0.04, r * 0.09);
    }
  }

  private drawUI(): void {
    const { width } = this.scale;
    const stars = this.getStars();
    const starStr = this.makeStarDisplay(stars);

    this.uiText.setText(
      `Level ${this.currentLevel + 1}   Moves: ${this.moveCount}   ${starStr}   Targets: ${this.targetsLeft}`
    );
    this.uiText.setPosition(width / 2 - this.uiText.width / 2, 12);

    const btnY = this.gridOffsetY + this.grid.rows * this.cellSize + 15;
    this.restartBtn.setPosition(width / 2 - this.restartBtn.width / 2, btnY);
  }

  private getStars(): number {
    const [s3, s2] = this.levelConfig.stars;
    if (this.moveCount <= s3) return 3;
    if (this.moveCount <= s2) return 2;
    return 1;
  }

  private makeStarDisplay(stars: number): string {
    return '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars);
  }

  // --- Overlay system ---

  private showOverlay(message: string, buttons: { label: string; action: () => void }[]): void {
    this.destroyOverlay();
    const { width, height } = this.scale;
    const t = this.theme;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, width, height);
    this.overlayElements.push(bg);

    const panelW = Math.min(width * 0.8, 320);
    const lineCount = message.split('\n').length;
    const panelH = 80 + lineCount * 26 + (buttons.length > 2 ? 100 : 55);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    // Panel shadow
    if (t.shadow) {
      const panelShadow = this.add.graphics();
      panelShadow.fillStyle(t.shadow.color, t.shadow.alpha * 0.7);
      panelShadow.fillRoundedRect(
        panelX + t.shadow.offsetX + 2,
        panelY + t.shadow.offsetY + 2,
        panelW, panelH, 16
      );
      this.overlayElements.push(panelShadow);
    }

    const panel = this.add.graphics();
    panel.fillStyle(t.colors.uiBackground, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, t.colors.uiBorder, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    this.overlayElements.push(panel);

    const text = this.add.text(width / 2, panelY + 30, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      fontStyle: 'bold',
      color: t.colors.uiText,
      align: 'center',
    }).setOrigin(0.5, 0);
    this.overlayElements.push(text);

    // Layout buttons: if <=2, single row; if >2, stack into rows of 2
    const btnH = 40;
    const btnGap = 10;
    const rowCount = Math.ceil(buttons.length / 2);
    const firstBtnY = panelY + panelH - rowCount * (btnH + btnGap) - 10;

    buttons.forEach((btn, i) => {
      const row = Math.floor(i / 2);
      const rowStart = row * 2;
      const rowLen = Math.min(2, buttons.length - rowStart);
      const col = i - rowStart;
      const btnW = (panelW - (rowLen + 1) * btnGap) / rowLen;
      const bx = panelX + btnGap + col * (btnW + btnGap);
      const by = firstBtnY + row * (btnH + btnGap);

      const btnGraphics = this.add.graphics();
      btnGraphics.fillStyle(t.colors.buttonBg, 1);
      btnGraphics.fillRoundedRect(bx, by, btnW, btnH, 8);
      this.overlayElements.push(btnGraphics);

      const btnText = this.add.text(bx + btnW / 2, by + btnH / 2, btn.label, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: t.colors.buttonText,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btnText.on('pointerdown', () => {
        this.destroyOverlay();
        btn.action();
      });
      this.overlayElements.push(btnText);
    });
  }

  private destroyOverlay(): void {
    this.overlayElements.forEach((el) => el.destroy());
    this.overlayElements = [];
  }
}
