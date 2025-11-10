import type { IGameConfig } from "../../config/GameConfig";
import type { ILogger } from "../../core/logging/ILogger";
import type { GridCell } from "../../core/GridCell";
import type { PipeQueue } from "../../core/PipeQueue";
import type { Pipe } from "../../core/Pipe";
import { FlowNetwork } from "../../core/FlowNetwork";


/**
 * Handles all game rendering (grid, pipes, effects, etc.)
 */
export class AssetRenderer {
  private flowGraphics?: Phaser.GameObjects.Graphics;
  private readonly pipeSprites = new Map<GridCell, Phaser.GameObjects.Image>();
  private queueSprites: Phaser.GameObjects.Image[] = [];

  private readonly offsetX: number;
  private readonly offsetY: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly logger: ILogger
  ) {
    const { width: gridW, height: gridH, cellSize } = this.config.grid;
    const { width: canvasW, height: canvasH } = this.config.canvas;

    // Compute top-left offset to center the grid on the canvas
    const gridPixelWidth = gridW * cellSize;
    const gridPixelHeight = gridH * cellSize;

    this.offsetX = (canvasW - gridPixelWidth) / 2;
    this.offsetY = (canvasH - gridPixelHeight) / 2;

    this.logger.debug(`AssetRenderer centered grid: offset=(${this.offsetX}, ${this.offsetY})`);

    this.flowGraphics = this.scene.add.graphics({ lineStyle: { width: 3, color: 0x00ffff } });
    this.flowGraphics.setDepth(50);
  }

  renderGridBackground(): void {
    const { cellSize, width, height } = this.config.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.scene.add
          .image(this.offsetX + x * cellSize, this.offsetY + y * cellSize, "grid-cell")
          .setOrigin(0)
          .setDepth(0);
      }
    }

    this.logger.debug(`Grid background rendered: ${width}x${height} cells`);
  }

  renderFlowPreview(): void {
    if (!this.flowGraphics) return;

    this.flowGraphics.clear();

    const { cellSize } = this.config.grid;
    const half = cellSize / 2;

    // 1) Draw completed/visited ports (bright / full)
    const visited = FlowNetwork.getVisitedPortsSnapshot();
    for (const entry of visited) {
      const pipe = entry.pipe;
      const center = this.gridToWorld(pipe.position.x, pipe.position.y);

      for (const dir of entry.dirs) {
        const endX = center.worldX + dir.dx * half;
        const endY = center.worldY + dir.dy * half;

        // draw center -> edge (completed)
        this.flowGraphics.lineStyle(4, 0x00ffff, 1); // full cyan
        this.flowGraphics.lineBetween(center.worldX, center.worldY, endX, endY);
      }
    }

    // 2) Draw active partial fills (animated)
    const { pipe, entryDir, exitDir, progress } = FlowNetwork.getActiveState();
    const center = this.gridToWorld(pipe.position.x, pipe.position.y);

    // compute entry point (edge)
    const entryPoint = {
      x: center.worldX + entryDir.dx * half,
      y: center.worldY + entryDir.dy * half,
    };

    // if exit known, animate from entry edge -> exit edge proportional to progress
    if (exitDir) {
      // fraction from entry edge through center to exit edge:
      // 0..50% -> entry edge -> center, 50..100% -> center -> exit edge
      if (progress <= 50) {
        const t = progress / 50; // 0..1 entryEdge -> center
        const ix = entryPoint.x + (center.worldX - entryPoint.x) * t;
        const iy = entryPoint.y + (center.worldY - entryPoint.y) * t;
        this.flowGraphics.lineStyle(3, 0x0088ff, 1);
        this.flowGraphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
      } else {
        // draw full from entry edge to center (already may be drawn by visited), plus partial to exit
        const t = (progress - 50) / 50; // 0..1 center -> exitEdge
        const exitEdge = {
          x: center.worldX + exitDir.dx * half,
          y: center.worldY + exitDir.dy * half,
        };
        const ix = center.worldX + (exitEdge.x - center.worldX) * t;
        const iy = center.worldY + (exitEdge.y - center.worldY) * t;

        // ensure center -> partial exit is drawn
        this.flowGraphics.lineStyle(3, 0x0088ff, 1);
        this.flowGraphics.lineBetween(center.worldX, center.worldY, ix, iy);
      }
    } else {
      // exit unknown -> animate from entry edge toward center only
      const t = Math.min(1, progress / 100);
      const ix = entryPoint.x + (center.worldX - entryPoint.x) * t;
      const iy = entryPoint.y + (center.worldY - entryPoint.y) * t;

      this.flowGraphics.lineStyle(3, 0x0088ff, 1);
      this.flowGraphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
    }
  }

  renderPipe(pipe: Pipe): void {
    const { cellSize } = this.config.grid;
    const x = this.offsetX + pipe.position.x * cellSize + cellSize / 2;
    const y = this.offsetY + pipe.position.y * cellSize + cellSize / 2;

    const sprite = this.scene.add
      .image(x, y, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
      .setDepth(1);

    this.pipeSprites.set(pipe.position, sprite);
  }

  renderQueue(queue: PipeQueue): void {
    const { cellSize } = this.config.grid;
    const spacing = 8;
    const startX = this.config.canvas.width / 2 - 50;
    const startY = 80;

    this.queueSprites.forEach(s => s.destroy());
    this.queueSprites.length = 0;

    queue.contents.forEach((pipe, i) => {
      const sprite = this.scene.add.image(
        startX + i * (cellSize * 0.7 + spacing),
        startY,
        pipe.assetKey
      )
        .setOrigin(0.5)
        .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
        .setDepth(100);

      this.queueSprites.push(sprite);
    });

    this.logger.debug(`[AssetRenderer] Rendered pipe queue (${queue.contents.length})`);
  }

  updatePipeFlow(pipe: Pipe): void {
    const sprite = this.pipeSprites.get(pipe.position);
    if (!sprite) return;

    const state = FlowNetwork.getActiveState();
    if (!state) {
      sprite.setTint(0xffffff);
      sprite.setAlpha(0.5);
      return;
    }

    const progress = state.progress;
    sprite.setTint(0x00aaff);
    sprite.setAlpha(0.5 + 0.5 * (progress / 100));

    if (progress >= 100) {
      sprite.setTint(0x00ffff);
      sprite.setAlpha(1);
    }
  }

  /**
   * Convert world coordinates (scene/camera space) to grid indices.
   * Returns null if the world point is outside the grid bounds.
   */
  public worldToGrid(worldX: number, worldY: number): { x: number; y: number } | null {
    const { cellSize, width, height } = this.config.grid;

    const localX = worldX - this.offsetX;
    const localY = worldY - this.offsetY;

    const gridX = Math.floor(localX / cellSize);
    const gridY = Math.floor(localY / cellSize);

    if (gridX < 0 || gridY < 0 || gridX >= width || gridY >= height) {
      return null;
    }

    return { x: gridX, y: gridY };
  }

  /**
   * Convert grid indices to world coordinates (center of cell).
   */
  public gridToWorld(x: number, y: number): { worldX: number; worldY: number } {
    const { cellSize } = this.config.grid;
    return {
      worldX: this.offsetX + x * cellSize + cellSize / 2,
      worldY: this.offsetY + y * cellSize + cellSize / 2,
    };
  }
}