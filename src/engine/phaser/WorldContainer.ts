import type { IGameConfig } from "../../config/GameConfig";
import { GridPosition } from "../../core/domain/grid/GridPosition";


/**
 * Container that manages all game elements and handles automatic positioning/resizing.
 * All game elements should be added to this container instead of directly to the scene.
 */
export class WorldContainer {
  private container: Phaser.GameObjects.Container;
  private readonly cellSize: number;
  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private background!: Phaser.GameObjects.TileSprite;

  constructor(private readonly scene: Phaser.Scene, private readonly config: IGameConfig) {
    this.cellSize = config.grid.cellSize;
    this.gridWidth = config.grid.width;
    this.gridHeight = config.grid.height;

    // Create main container that will hold everything
    this.container = this.scene.add.container(0, 0);
    
    // Add full-screen background directly to the scene
    this.background = this.scene.add
      .tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, "tile-background")
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.repositionContainer();
    this.scene.scale.on("resize", this.handleResize, this);
  }

  /** Add a game object to the world container */
  add(gameObject: Phaser.GameObjects.GameObject): void {
    this.container.add(gameObject);
    this.container.sort("depth");
  }

  /** Remove a game object from the world container */
  remove(gameObject: Phaser.GameObjects.GameObject): void {
    this.container.remove(gameObject);
  }

  /**
   * Convert world coordinates (canvas) to GridPosition.
   * Returns null if outside bounds.
   */
  worldToGrid(worldX: number, worldY: number): GridPosition | null {
    const localX = worldX - this.container.x;
    const localY = worldY - this.container.y;

    const gx = Math.floor(localX / this.cellSize);
    const gy = Math.floor(localY / this.cellSize);

    return GridPosition.create(gx, gy, this.gridWidth, this.gridHeight);
  }

  /** Convert GridPosition to container-local coordinates (cell center) */
  gridToLocal(pos: GridPosition): { x: number; y: number } {
    return {
      x: pos.x * this.cellSize + this.cellSize / 2,
      y: pos.y * this.cellSize + this.cellSize / 2,
    };
  }

  /** Convert GridPosition to top-left corner in container-local coordinates */
  gridToLocalCorner(pos: GridPosition | { x: number; y: number }): { x: number; y: number } {
    return {
      x: pos.x * this.cellSize,
      y: pos.y * this.cellSize,
    };
  }

  /** Get starting position for the queue (left of grid) */
  getQueuePosition(): { x: number; y: number; startY: number } {
    const queueX = -this.cellSize * 2 - this.cellSize / 2;
    const gridCenterY = (this.gridHeight * this.cellSize) / 2;
    return { x: queueX, y: gridCenterY, startY: 0 };
  }

  /** 
   * Convert queue position to top-left corner in container-local coordinates.
   * Queue is positioned to the left of the grid with 2 cell units of spacing.
   * Queue coordinates: x=0 is the single column, y starts at 0 (bottom) and goes up
   */
  queueToLocalCorner(pos: { x: number; y: number }): { x: number; y: number } {
    // Queue is 3 cells to the left of the grid (with the spacing)
    const queueOffsetX = -this.cellSize * 3;
    
    // Queue is vertically centered with the grid
    const gridCenterY = (this.gridHeight * this.cellSize) / 2;
    const maxQueueHeight = this.config.queue.maxSize * this.cellSize;
    const queueStartY = gridCenterY - maxQueueHeight / 2;
    
    return {
      x: queueOffsetX + pos.x * this.cellSize,
      y: queueStartY + pos.y * this.cellSize,
    };
  }

  /** Get total grid dimensions in pixels */
  getGridDimensions(): { width: number; height: number } {
    return {
      width: this.gridWidth * this.cellSize,
      height: this.gridHeight * this.cellSize
    };
  }

  /** Handle resizing */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.background.setSize(gameSize.width, gameSize.height);
    this.repositionContainer();
  }

  /** Center the container in the viewport */
  private repositionContainer(): void {
    const gridPixelWidth = this.gridWidth * this.cellSize;
    const gridPixelHeight = this.gridHeight * this.cellSize;

    const canvasW = this.scene.scale.width;
    const canvasH = this.scene.scale.height;

    const offsetX = (canvasW - gridPixelWidth) / 2;
    const offsetY = (canvasH - gridPixelHeight) / 2;

    this.container.setPosition(offsetX, offsetY);
  }

  /** Cleanup */
  destroy(): void {
    this.scene.scale.off("resize", this.repositionContainer, this);
    this.container.destroy();
  }
}