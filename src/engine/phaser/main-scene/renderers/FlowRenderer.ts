import type { WorldContainer } from "../../WorldContainer";
import type { IGameConfig } from "../../../../config/GameConfig";
import { FlowNetwork } from "../../../../core/FlowNetwork";


/** Handles rendering of flow animations and preview */
export class FlowRenderer {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly world: WorldContainer
  ) {
    this.graphics = this.scene.add.graphics({
      lineStyle: { width: 3, color: 0x00ffff }
    });
    this.graphics.setDepth(50);
    this.world.add(this.graphics);
  }

  renderPreview(): void {
    this.graphics.clear();
    this.renderCompletedPorts();
    this.renderActiveFlow();
  }

  private renderCompletedPorts(): void {
    const { cellSize } = this.config.grid;
    const half = cellSize / 2;

    const visited = FlowNetwork.getVisitedPortsSnapshot();
    
    for (const entry of visited) {
      const center = this.world.gridToLocal(
        entry.pipe.position.x,
        entry.pipe.position.y
      );

      for (const dir of entry.dirs) {
        const endX = center.x + dir.dx * half;
        const endY = center.y + dir.dy * half;

        this.graphics.lineStyle(4, 0x00ffff, 1);
        this.graphics.lineBetween(center.x, center.y, endX, endY);
      }
    }
  }

  private renderActiveFlow(): void {
    const state = FlowNetwork.getActiveState();
    if (!state) return;

    const { pipe, entryDir, exitDir, progress } = state;
    const { cellSize } = this.config.grid;
    const half = cellSize / 2;

    const center = this.world.gridToLocal(pipe.position.x, pipe.position.y);

    // Determine entry point
    const entryPoint = entryDir
      ? {
          x: center.x + entryDir.dx * half,
          y: center.y + entryDir.dy * half,
        }
      : { x: center.x, y: center.y };

    if (exitDir) {
      this.renderFlowWithExit(entryPoint, center, exitDir, half, progress);
    } else {
      this.renderFlowToCenter(entryPoint, center, progress);
    }
  }

  private renderFlowWithExit(
    entryPoint: { x: number; y: number },
    center: { x: number; y: number },
    exitDir: { dx: number; dy: number },
    half: number,
    progress: number
  ): void {
    this.graphics.lineStyle(3, 0x0088ff, 1);

    if (progress <= 50) {
      // Entry edge -> center
      const t = progress / 50;
      const ix = entryPoint.x + (center.x - entryPoint.x) * t;
      const iy = entryPoint.y + (center.y - entryPoint.y) * t;
      this.graphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
    } else {
      // Center -> exit edge
      const t = (progress - 50) / 50;
      const exitEdge = {
        x: center.x + exitDir.dx * half,
        y: center.y + exitDir.dy * half,
      };
      const ix = center.x + (exitEdge.x - center.x) * t;
      const iy = center.y + (exitEdge.y - center.y) * t;
      this.graphics.lineBetween(center.x, center.y, ix, iy);
    }
  }

  private renderFlowToCenter(
    entryPoint: { x: number; y: number },
    center: { x: number; y: number },
    progress: number
  ): void {
    const t = Math.min(1, progress / 100);
    const ix = entryPoint.x + (center.x - entryPoint.x) * t;
    const iy = entryPoint.y + (center.y - entryPoint.y) * t;

    this.graphics.lineStyle(3, 0x0088ff, 1);
    this.graphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
  }

  /** Clear all flow graphics */
  clear(): void {
    this.graphics.clear();
  }
}