import { Direction } from "./Direction";
import type { ILogger } from "./logging/ILogger";
import type { Grid } from "./Grid";
import { PipeType, type Pipe } from "./Pipe";


/**
 * Manages the state of the water flow.
 * Keeps track of the connected pipes and allows stepwise progression.
 */
export class WaterFlowManager {
  /** Total number of connected pipes */
  private static connectedCount = 0;

  /** Ordered list of connected pipes (path) */
  private static path: Pipe[] = [];

  /** The last pipe in the current path */
  private static lastPipe: Pipe | null = null;

  /** The current direction of the flow */
  private static currentExit: Direction | null = null;

  /** Keeps track of visited pipes */
  private static visitedPipes = new Set<Pipe>();

  /** Keeps track of visited connections in Cross pipes. */
  private static visitedCrossConnections = new Map<Pipe, Set<Direction>>();

  /**
   * Initializes the flow system from the grid's start pipe.
   */
  static initialize(grid: Grid, logger: ILogger): void {
    const startPipe = grid.startPipe;
    this.path = [startPipe];
    this.lastPipe = startPipe;
    this.currentExit = startPipe.direction;
    this.connectedCount = 1;
    this.visitedPipes = new Set([startPipe]);
    this.visitedCrossConnections.clear();

    logger.info(`Flow initialized at ${startPipe.position} facing ${startPipe.direction}`);
  }

  /**
   * Gets the current number of connected pipes.
   */
  static get count(): number {
    return this.connectedCount;
  }

  /**
   * Gets the full path of connected pipes.
   */
  static get pipes(): readonly Pipe[] {
    return this.path;
  }

  /**
   * Gets the last connected pipe.
   */
  static get last(): Pipe | null {
    return this.lastPipe;
  }

  /**
   * Attempts to advance the flow one step forward.
   * Called when a new pipe is placed.
   *
   * @returns true if the flow advanced, false otherwise.
   */
  static tryAdvance(grid: Grid, logger: ILogger): boolean {
    if (!this.lastPipe || !this.currentExit) {
      logger.warn("Flow not initialized or already stopped.");
      return false;
    }

    const next = this.getNextPipeInFlow(grid, this.lastPipe, this.currentExit, logger);
    if (!next) {
      logger.debug(`Flow cannot advance from ${this.lastPipe.position}`);
      return false;
    }

    const entryDirection = this.currentExit.opposite;
    const { pipe: nextPipe, exitDirection } = next;
    logger.debug(`Flow advanced: ${this.lastPipe.position} → ${nextPipe.position} (${entryDirection} → ${exitDirection})`);

    this.path.push(nextPipe);
    this.lastPipe = nextPipe;
    this.currentExit = exitDirection;
    this.connectedCount++;

    // Register memory for Cross usage
    if (nextPipe.type === PipeType.Cross) {
      if (!this.visitedCrossConnections.has(nextPipe)) {
        this.visitedCrossConnections.set(nextPipe, new Set());
      }
      this.visitedCrossConnections.get(nextPipe)!.add(entryDirection);
      this.visitedCrossConnections.get(nextPipe)!.add(exitDirection);
    }

    return true;
  }

  /**
   * Determines the next pipe and the entry/exit directions for the water.
   * Handles Cross pipe memory so it doesn't reuse directions already taken.
   */
  public static getNextPipeInFlow(grid: Grid, fromPipe: Pipe, exitDirection: Direction, logger: ILogger) :
    { pipe: Pipe; exitDirection: Direction } | null {
    const nextX = fromPipe.position.x + exitDirection.dx;
    const nextY = fromPipe.position.y + exitDirection.dy;

    if (!grid.isValidPosition(nextX, nextY)) {
      logger.debug(`Flow ends: out of bounds at (${nextX}, ${nextY})`);
      return null;
    }

    const nextPipe = grid.getPipeAt(nextX, nextY);
    if (!nextPipe) {
      logger.debug(`Flow ends: no pipe at (${nextX}, ${nextY})`);
      return null;
    }

    const entryDirection = exitDirection.opposite;
    const connections = nextPipe.getConnections();

    if (!connections.includes(entryDirection)) {
      logger.debug(`Flow ends: pipe at (${nextX}, ${nextY}) doesn't accept water from ${entryDirection}`);
      return null;
    }

    let nextExit: Direction | null = null;
    if (nextPipe.type === PipeType.Cross) {
      nextExit = this.chooseCrossExit(grid, nextPipe, entryDirection, logger);
      if (nextExit == null) return null;
    } else {
      const possibleExits = connections.filter(d => d !== entryDirection);
      if (possibleExits.length === 0) {
        logger.debug(`Flow ends: pipe at (${nextX}, ${nextY}) has no valid exit`);
        return null;
      }
      nextExit = possibleExits[0];
    }

    return { pipe: nextPipe, exitDirection: nextExit };
  }

  private static chooseCrossExit(grid: Grid, cross: Pipe, entry: Direction, logger: ILogger): Direction | null {
    if (!this.visitedCrossConnections.has(cross)) {
      this.visitedCrossConnections.set(cross, new Set());
    }

    const usedExits = this.visitedCrossConnections.get(cross)!;
    const possibleExits = cross.getConnections()
      .filter(d => d !== entry && !usedExits.has(d))
      .filter(d => {
        const { x, y } = cross.position;
        const nx = x + d.dx;
        const ny = y + d.dy;
        const neighbor = grid.getPipeAt(nx, ny);
        return neighbor != null && neighbor.type != PipeType.Start;
      });

      
    if (possibleExits.length === 0) {
      logger.debug(`Cross at ${cross.position} has no available exits with connected neighbors`);
      return null;
    }

    const preferredExit = entry.opposite;
    const nextExit = possibleExits.includes(preferredExit) ? preferredExit : possibleExits[0];

    usedExits.add(nextExit);
    return nextExit;
  }

  /**
   * Resets the entire flow state.
   */
  static reset(logger?: ILogger): void {
    this.path = [];
    this.lastPipe = null;
    this.currentExit = null;
    this.connectedCount = 0;
    this.visitedPipes.clear();
    this.visitedCrossConnections.clear();

    logger?.info("Water flow reset");
  }
}