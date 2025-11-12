import type { WorldContainer } from "../WorldContainer";
import type { IGameConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../../core/logging/ILogger";

import type { GridPosition } from "../../../core/domain/grid/GridPosition";
import type { FlowNetwork } from "../../../core/domain/flow/FlowNetwork";
import type { PipeQueue } from "../../../core/domain/pipe/PipeQueue";
import type { Grid } from "../../../core/domain/grid/Grid";
import type { Pipe } from "../../../core/domain/pipe/Pipe";

import { CursorRenderer } from "./renderers/CursorRenderer";
import { QueueRenderer } from "./renderers/QueueRenderer";
import { GridRenderer } from "./renderers/GridRenderer";
import { PipeRenderer } from "./renderers/PipeRenderer";
import { FlowRenderer } from "./renderers/FlowRenderer";


/**
 * Orchestrates all game rendering through specialized renderer components.
 * This is a facade that delegates to focused, single-responsibility renderers.
 */
export class AssetRenderer {
  // Specialized renderers
  private readonly gridRenderer: GridRenderer;
  private readonly cursorRenderer: CursorRenderer;
  private readonly pipeRenderer: PipeRenderer;
  private readonly queueRenderer: QueueRenderer;
  private readonly flowRenderer: FlowRenderer;

  constructor(
    scene: Phaser.Scene,
    config: IGameConfig,
    private readonly worldContainer: WorldContainer,
    flowNetwork: FlowNetwork,
    logger: ILogger
  ) {
    // Initialize specialized renderers with world container
    this.gridRenderer = new GridRenderer(scene, config, worldContainer, logger);
    this.cursorRenderer = new CursorRenderer(scene, worldContainer, logger);
    this.pipeRenderer = new PipeRenderer(scene, worldContainer);
    this.queueRenderer = new QueueRenderer(scene, config, worldContainer, logger);
    this.flowRenderer = new FlowRenderer(scene, config, worldContainer, flowNetwork);
  }

  renderGridBackground(grid: Grid): void {
    this.gridRenderer.renderBackground(grid);
  }

  /** Adds a pipe sprite to the grid. */
  addPipe(pipe: Pipe): void {
    this.pipeRenderer.render(pipe);
  }

  /** Removes a pipe sprite from the grid. */
  removePipe(pos: GridPosition): void {
    this.pipeRenderer.remove(pos);
  }

  renderQueue(queue: PipeQueue): void {
    this.queueRenderer.render(queue);
  }

  renderWaterFlow(): void {
    this.flowRenderer.renderPreview();
  }

  updateGridCursor(worldX: number, worldY: number): void {
    this.cursorRenderer.update(worldX, worldY);
  }

  hideGridCursor(): void {
    this.cursorRenderer.hide();
  }

  /** Starts a bomb animation at the specified grid cell. */
  startBombAnimation(pos: GridPosition, durationMs: number, onComplete?: () => void): void {
    this.pipeRenderer.startBombAnimation(pos, durationMs, onComplete);
  }

  worldToGrid(worldX: number, worldY: number): GridPosition | null {
    return this.worldContainer.worldToGrid(worldX, worldY);
  }

  gridToWorld(pos: GridPosition): { x: number; y: number } {
    return this.worldContainer.gridToLocal(pos);
  }

  /** Clean up all resources */
  destroy(): void {
    this.queueRenderer.destroy();
    this.pipeRenderer.clear();
    this.flowRenderer.clear();
  }
}