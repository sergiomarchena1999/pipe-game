import { WaterFlowManager } from "../../core/WaterFlowManager";
import type { IGameConfig } from "../../config/GameConfig";
import type { ILogger } from "../../core/logging/ILogger";
import type { GridCell } from "../../core/GridCell";
import type { PipeQueue } from "../../core/PipeQueue";
import type { Pipe } from "../../core/Pipe";


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

    const pipes = WaterFlowManager.pipes;
    if (pipes.length === 0) return;

    for (const pipe of pipes) {
      const center = this.gridToWorld(pipe.position.x, pipe.position.y);

      const entryDir = pipe.flow.getEntryDirection();
      const exitDir = pipe.flow.getExitDirection();

      // Skip pipes that haven't started flowing
      if (!entryDir && !exitDir) continue;

      // Compute entry and exit points (edges of the cell)
      const { cellSize } = this.config.grid;
      const half = cellSize / 2;

      let entryPoint = { worldX: center.worldX, worldY: center.worldY };
      if (entryDir) {
        entryPoint = {
          worldX: center.worldX + entryDir.dx * half,
          worldY: center.worldY + entryDir.dy * half
        };
      }

      let exitPoint = { worldX: center.worldX, worldY: center.worldY };
      if (exitDir) {
        exitPoint = {
          worldX: center.worldX + exitDir.dx * half,
          worldY: center.worldY + exitDir.dy * half
        };
      }

      // Draw entry-to-center line
      if (entryDir) {
        this.flowGraphics.lineBetween(entryPoint.worldX, entryPoint.worldY, center.worldX, center.worldY);
      }

      // Draw center-to-exit line
      if (exitDir) {
        this.flowGraphics.lineBetween(center.worldX, center.worldY, exitPoint.worldX, exitPoint.worldY);
      }
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

    const state = pipe.flow.getState();
    switch (state.status) {
      case "empty":
        sprite.setTint(0xffffff);
        sprite.setAlpha(0.5);
        break;

      case "filling":
        sprite.setTint(0x00aaff);
        sprite.setAlpha(0.5 + 0.5 * (state.progress / 100)); // fades in as it fills
        break;

      case "full":
        sprite.setTint(0x00ffff);
        sprite.setAlpha(1);
        break;
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