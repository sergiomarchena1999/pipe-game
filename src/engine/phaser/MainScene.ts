import Phaser from "phaser";
import { PhaserAssetLoader } from "./PhaserAssetLoader";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import type { Logger } from "../../utils/Logger";
import type { Pipe } from "../../core/Pipe";

import gridCell from "../../assets/grid-background.png";
import pipeStraight from "../../assets/pipes/pipe-straight.png";
import pipeCorner from "../../assets/pipes/pipe-corner.png";
import pipeCross from "../../assets/pipes/pipe-cross.png";
import pipeStart from "../../assets/pipes/pipe-start.png";

/**
 * Rendering depth layers for proper z-ordering.
 */
const enum RenderDepth {
  Background = 0,
  Pipes = 1,
  Effects = 2,
}

/**
 * Asset registry mapping logical names to file paths.
 */
const ASSET_REGISTRY = {
  "grid-cell": gridCell,
  "pipe-straight": pipeStraight,
  "pipe-corner": pipeCorner,
  "pipe-cross": pipeCross,
  "pipe-start": pipeStart,
} as const;

/**
 * Main game scene responsible for rendering the grid and pipes.
 * Subscribes to game state events to update the display.
 */
export class MainScene extends Phaser.Scene {
  private readonly config: IGameConfig;
  private readonly state: GameState;
  private readonly logger: Logger;
  private readonly pipeSprites: Map<string, Phaser.GameObjects.Image>;

  constructor(config: IGameConfig, state: GameState, logger: Logger) {
    super({ key: "MainScene" });
    this.config = config;
    this.state = state;
    this.logger = logger;
    this.pipeSprites = new Map();
  }

  /**
   * Phaser lifecycle: Load all required assets.
   */
  preload(): void {
    const loader = new PhaserAssetLoader(this);
    loader.loadImages(ASSET_REGISTRY);
    loader.startLoading();
  }

  /**
   * Phaser lifecycle: Set up the initial scene.
   */
  create(): void {
    this.renderGridBackground();
    this.subscribeToGameEvents();
  }

  /**
   * Renders the grid background cells.
   */
  private renderGridBackground(): void {
    const { cellSize, width, height } = this.config.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.add
          .image(x * cellSize, y * cellSize, "grid-cell")
          .setOrigin(0)
          .setDepth(RenderDepth.Background);
      }
    }

    this.logger.debug(`Grid background rendered: ${width}x${height} cells`);
  }

  /**
   * Sets up event listeners for game state changes.
   */
  private subscribeToGameEvents(): void {
    this.state.once("initialized", (grid) => {
      const startPipe = grid.startPipe;
      this.logger.info(
        `Rendering start pipe at (${startPipe.position.x}, ${startPipe.position.y}) ` +
        `with rotation ${startPipe.rotation}°`
      );
      this.createPipeSprite(startPipe);
    });
  }

  /**
   * Creates and positions a sprite for the given pipe.
   */
  private createPipeSprite(pipe: Pipe): Phaser.GameObjects.Image {
    const { cellSize } = this.config.grid;
    const centerX = pipe.position.x * cellSize + cellSize / 2;
    const centerY = pipe.position.y * cellSize + cellSize / 2;

    const sprite = this.add
      .image(centerX, centerY, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.rotation))
      .setDepth(RenderDepth.Pipes);

    const spriteKey = this.getPipeKey(pipe);
    this.pipeSprites.set(spriteKey, sprite);

    return sprite;
  }

  /**
   * Generates a unique key for tracking pipe sprites.
   */
  private getPipeKey(pipe: Pipe): string {
    return `${pipe.position.x},${pipe.position.y}`;
  }
}