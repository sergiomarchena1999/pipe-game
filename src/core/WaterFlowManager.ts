import type { ILogger } from "./logging/ILogger";
import type { FlowEventData, PipeFlow, WaterFlowState } from "./PipeFlow";
import { PipeType, type Pipe } from "./Pipe";
import { Direction } from "./Direction";
import type { Grid } from "./Grid";


/**
 * Manages the state of the water flow.
 * Keeps track of the connected pipes and allows stepwise progression.
 */
export class WaterFlowManager {
  /** Ordered list of connected pipes (path) */
  private static path: Pipe[] = [];

  /** Keeps track of visited connections in Cross pipes */
  private static visitedCrossConnections = new Map<Pipe, Set<Direction>>();

  /**
   * Initializes the flow system from the grid's start pipe.
   */
  static initialize(grid: Grid, logger: ILogger): void {
    const startPipe = grid.startPipe;
    
    this.path = [startPipe];
    this.visitedCrossConnections.clear();

    // Set up event listeners on the start pipe's flow
    this.setupFlowListeners(startPipe, grid, logger);

    logger.info(`Flow initialized at ${startPipe.position} facing ${startPipe.direction}`);
  }

  /**
   * Set up event listeners for a pipe's flow
   */
  private static setupFlowListeners(pipe: Pipe, grid: Grid, logger: ILogger): void {
    pipe.flow.on("flowReached50", (data) => this.onFlowReached50(data, logger));
    pipe.flow.on("flowCompleted", (data) => this.onFlowCompleted(data, grid, logger));
  }

  /**
   * Event handler: Water reached 50% in a pipe
   */
  private static onFlowReached50(data: FlowEventData, logger: ILogger): void {
    const { pipe } = data;
    const flow = pipe.flow;
    
    logger.debug(`Water reached 50% at ${pipe.position}, seeking exit...`);

    // Try to find an exit
    const entryDir = flow.getEntryDirection();
    if (!entryDir) {
      flow.noExitFound();
      return;
    }

    const exitDir = this.findExitDirection(pipe, entryDir, logger);
    if (exitDir) {
      flow.confirmExit(exitDir);
      logger.debug(`Exit found: ${pipe.position} will exit to ${exitDir}`);
    } else {
      flow.noExitFound();
      logger.debug(`No exit available at ${pipe.position}, water will stay in pipe`);
    }
  }

  /**
   * Event handler: Pipe is full
   */
  private static onFlowCompleted(data: FlowEventData, grid: Grid, logger: ILogger): void {
    const { pipe, exitDirection } = data;
    
    if (!exitDirection) {
      logger.debug(`Pipe full at ${pipe.position}, water stays (no exit)`);
      return;
    }

    // Try to start water in the next pipe
    const nextPos = {
      x: pipe.position.x + exitDirection.dx,
      y: pipe.position.y + exitDirection.dy
    };

    if (!grid.isValidPosition(nextPos.x, nextPos.y)) {
      logger.debug(`Flow cannot continue: out of bounds`);
      return;
    }

    const nextPipe = grid.getPipeAt(nextPos.x, nextPos.y);
    if (!nextPipe) {
      logger.debug(`Flow waiting: no pipe at (${nextPos.x}, ${nextPos.y})`);
      return;
    }

    const entryDir = exitDirection.opposite;
    const connections = nextPipe.getConnections();
    
    if (!connections.includes(entryDir)) {
      logger.warn(`Next pipe at ${nextPos.x}, ${nextPos.y} doesn't accept water from ${entryDir}`);
      return;
    }

    // Set up event listeners for the new pipe
    this.setupFlowListeners(nextPipe, grid, logger);

    // Start filling the next pipe
    nextPipe.flow.startFilling(entryDir);
    this.path.push(nextPipe);

    // Track cross connections
    if (nextPipe.type === PipeType.Cross) {
      if (!this.visitedCrossConnections.has(nextPipe)) {
        this.visitedCrossConnections.set(nextPipe, new Set());
      }
      this.visitedCrossConnections.get(nextPipe)!.add(entryDir);
    }

    logger.info(`Flow advanced to ${nextPipe.position}`);
  }

  /**
   * Gets the full path of connected pipes.
   */
  static get pipes(): readonly Pipe[] {
    return this.path;
  }

  /**
   * Updates all active water flows
   */
  static update(deltaTime: number, flowSpeed: number): void {
    for (const pipe of this.path) {
      pipe.flow.update(deltaTime, flowSpeed);
    }
  }

  /**
   * Find a valid exit direction for water at 50%
   */
  private static findExitDirection(pipe: Pipe, entryDir: Direction, logger: ILogger): Direction | null {
    if (pipe.type === PipeType.Cross) {
      return this.chooseCrossExit(pipe, entryDir, logger);
    }

    return pipe.getExitDirection(entryDir);
  }

  /**
   * Choose exit for cross pipes, avoiding already-used directions
   */
  private static chooseCrossExit(
    cross: Pipe,
    entry: Direction,
    logger: ILogger
  ): Direction | null {
    if (!this.visitedCrossConnections.has(cross)) {
      this.visitedCrossConnections.set(cross, new Set());
    }

    const usedExits = this.visitedCrossConnections.get(cross)!;
    const possibleExits = cross.getConnections()
      .filter(d => d !== entry && !usedExits.has(d));

    if (possibleExits.length === 0) {
      logger.debug(`Cross at ${cross.position} has no available exits`);
      return null;
    }

    const preferredExit = entry.opposite;
    const nextExit = possibleExits.includes(preferredExit) ? preferredExit : possibleExits[0];

    usedExits.add(nextExit);
    return nextExit;
  }

  /**
   * Get the flow state for a specific pipe
   */
  static getFlowForPipe(pipe: Pipe): PipeFlow {
    return pipe.flow;
  }

  /**
   * Returns an iterator of pipes with their flow states
   */
  static *flowStates(): Iterable<{ pipe: Pipe; state: WaterFlowState }> {
    for (const pipe of this.path) {
      yield { pipe, state: pipe.flow.getState() };
    }
  }

  /**
   * Resets the entire flow state.
   */
  static reset(logger?: ILogger): void {
    // Reset all pipe flows
    for (const pipe of this.path) {
      pipe.flow.reset();
    }
    
    this.path = [];
    this.visitedCrossConnections.clear();

    logger?.info("Water flow reset");
  }
}