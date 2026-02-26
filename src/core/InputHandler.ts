import { Direction } from './Direction';

const SWIPE_THRESHOLD = 30;

export class InputHandler {
  private scene: Phaser.Scene;
  private onMove: (dir: Direction) => void;
  private startX = 0;
  private startY = 0;
  private swiping = false;

  private onUndo: () => void;
  private onRestart: () => void;

  constructor(scene: Phaser.Scene, onMove: (dir: Direction) => void, onUndo: () => void, onRestart: () => void) {
    this.scene = scene;
    this.onMove = onMove;
    this.onUndo = onUndo;
    this.onRestart = onRestart;
    this.setupTouch();
    this.setupKeyboard();
  }

  private setupTouch(): void {
    this.scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.startX = p.x;
      this.startY = p.y;
      this.swiping = true;
    });

    this.scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.swiping) return;
      this.swiping = false;

      const dx = p.x - this.startX;
      const dy = p.y - this.startY;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.onMove(dx > 0 ? Direction.Right : Direction.Left);
      } else {
        this.onMove(dy > 0 ? Direction.Down : Direction.Up);
      }
    });
  }

  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    keyboard.on('keydown-UP', () => this.onMove(Direction.Up));
    keyboard.on('keydown-DOWN', () => this.onMove(Direction.Down));
    keyboard.on('keydown-LEFT', () => this.onMove(Direction.Left));
    keyboard.on('keydown-RIGHT', () => this.onMove(Direction.Right));
    keyboard.on('keydown-W', () => this.onMove(Direction.Up));
    keyboard.on('keydown-S', () => this.onMove(Direction.Down));
    keyboard.on('keydown-A', () => this.onMove(Direction.Left));
    keyboard.on('keydown-D', () => this.onMove(Direction.Right));
    keyboard.on('keydown-U', () => this.onUndo());
    keyboard.on('keydown-R', () => this.onRestart());
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
  }
}
