import type { IGameConfig } from "../../config/GameConfig";


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

  constructor(private readonly scene: Phaser.Scene, config: IGameConfig) {
    this.cellSize = config.grid.cellSize;
    this.gridWidth = config.grid.width;
    this.gridHeight = config.grid.height;

    // Create main container that will hold everything
    this.container = this.scene.add.container(0, 0);
    
    // Add full-screen background directly to the scene
    this.background = this.scene.add
      .tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, "tile-background")
      .setOrigin(0)
      .setScrollFactor(0) // Keep background fixed to camera
      .setDepth(-10);

    // Initial positioning
    this.repositionContainer();

    // Auto-reposition on resize
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
   * Convert world coordinates (relative to canvas) to grid indices.
   * Returns null if outside grid bounds.
   */
  worldToGrid(worldX: number, worldY: number): { x: number; y: number } | null {
    // Convert canvas coordinates to container-local coordinates
    const localX = worldX - this.container.x;
    const localY = worldY - this.container.y;

    const gridX = Math.floor(localX / this.cellSize);
    const gridY = Math.floor(localY / this.cellSize);

    if (gridX < 0 || gridY < 0 || gridX >= this.gridWidth || gridY >= this.gridHeight) {
      return null;
    }

    return { x: gridX, y: gridY };
  }

  /** Convert grid indices to container-local coordinates (center of cell) */
  gridToLocal(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.cellSize + this.cellSize / 2,
      y: y * this.cellSize + this.cellSize / 2,
    };
  }

  /** Get top-left corner of a grid cell in container-local coordinates */
  gridToLocalCorner(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.cellSize,
      y: y * this.cellSize,
    };
  }

  /** Get the position where the queue should start (left of grid) */
  getQueuePosition(): { x: number; y: number; startY: number } {
    // Queue is positioned 1 cell to the left of the grid
    const queueX = -this.cellSize * 2 - this.cellSize / 2;

    // Center the queue vertically relative to the grid
    const gridCenterY = (this.gridHeight * this.cellSize) / 2;
    return {
      x: queueX,
      y: gridCenterY,
      startY: 0 // Queue items will be positioned relative to this
    };
  }

  /** Get total grid dimensions in pixels */
  getGridDimensions(): { width: number; height: number } {
    return {
      width: this.gridWidth * this.cellSize,
      height: this.gridHeight * this.cellSize
    };
  }

  /** Handle resizing: adjust both container and background */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.background.setSize(gameSize.width, gameSize.height);
    this.repositionContainer();
  }

  /** Centers the container in the viewport */
  private repositionContainer(): void {
    const gridPixelWidth = this.gridWidth * this.cellSize;
    const gridPixelHeight = this.gridHeight * this.cellSize;

    const canvasW = this.scene.scale.width;
    const canvasH = this.scene.scale.height;

    const offsetX = (canvasW - gridPixelWidth) / 2;
    const offsetY = (canvasH - gridPixelHeight) / 2;

    this.container.setPosition(offsetX, offsetY);
  }

  /** Cleanup when scene is destroyed */
  destroy(): void {
    this.scene.scale.off("resize", this.repositionContainer, this);
    this.container.destroy();
  }
}