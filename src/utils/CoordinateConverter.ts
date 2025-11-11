import type { IGameConfig } from "../config/GameConfig";


/** Handles conversion between grid and world coordinates */
export class CoordinateConverter {
  public readonly offsetX: number;
  public readonly offsetY: number;

  constructor(private readonly config: IGameConfig) {
    const { width: gridW, height: gridH, cellSize } = this.config.grid;
    const { width: canvasW, height: canvasH } = this.config.canvas;

    const gridPixelWidth = gridW * cellSize;
    const gridPixelHeight = gridH * cellSize;

    this.offsetX = (canvasW - gridPixelWidth) / 2;
    this.offsetY = (canvasH - gridPixelHeight) / 2;
  }

  /**
   * Convert world coordinates to grid indices.
   * Returns null if outside grid bounds.
   */
  worldToGrid(worldX: number, worldY: number): { x: number; y: number } | null {
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

  /** Convert grid indices to world coordinates (center of cell) */
  gridToWorld(x: number, y: number): { worldX: number; worldY: number } {
    const { cellSize } = this.config.grid;
    return {
      worldX: this.offsetX + x * cellSize + cellSize / 2,
      worldY: this.offsetY + y * cellSize + cellSize / 2,
    };
  }

  /** Get top-left corner of a grid cell in world coordinates */
  gridToWorldCorner(x: number, y: number): { worldX: number; worldY: number } {
    const { cellSize } = this.config.grid;
    return {
      worldX: this.offsetX + x * cellSize,
      worldY: this.offsetY + y * cellSize,
    };
  }
}