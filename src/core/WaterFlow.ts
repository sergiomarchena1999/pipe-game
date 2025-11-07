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

  /**
   * Keeps track of visited connections in Cross pipes.
   * Map<Pipe, Set<"Entry→Exit">>
   */
  private static visitedCrossConnections = new Map<Pipe, Map<Direction, Direction>>();

  /**
   * Initializes the flow system from the grid's start pipe.
   */
  static initialize(grid: Grid, logger: ILogger): void {
    const startPipe = (grid as any)._startPipe as Pipe | undefined;
    if (!startPipe) {
      throw new Error("No start pipe defined");
    }

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

    const { pipe: nextPipe, entryDirection, exitDirection } = next;

    logger.debug(
      `Flow advanced: ${this.lastPipe.position} → ${nextPipe.position} (${entryDirection} → ${exitDirection})`
    );

    this.path.push(nextPipe);
    this.lastPipe = nextPipe;
    this.currentExit = exitDirection;
    this.connectedCount++;

    // Register memory for Cross usage
    if (nextPipe.type === PipeType.Cross) {
      if (!this.visitedCrossConnections.has(nextPipe)) {
        this.visitedCrossConnections.set(nextPipe, new Map());
      }
      this.visitedCrossConnections.get(nextPipe)!.set(entryDirection, exitDirection);
    }

    return true;
  }

  /**
   * Determines the next pipe and the entry/exit directions for the water.
   * Handles Cross pipe memory so it doesn't reuse directions already taken.
   */
  public static getNextPipeInFlow(grid: Grid, fromPipe: Pipe, exitDirection: Direction, logger: ILogger) :
    { pipe: Pipe; entryDirection: Direction; exitDirection: Direction } | null {
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
      logger.debug(
        `Flow ends: pipe at (${nextX}, ${nextY}) doesn't accept water from ${entryDirection}`
      );
      return null;
    }

    let nextExit: Direction | null = null;
    if (nextPipe.type === PipeType.Cross) {
        const usedMap = this.visitedCrossConnections.get(nextPipe) ?? new Map<Direction, Direction>();
        const usedExits = Array.from(usedMap.values());
        console.log({usedExits})

        // Posibles salidas: no la entrada ni usadas
        const possibleExits = connections.filter(dir => dir !== entryDirection && !usedExits.includes(dir));

        // Filtrar solo salidas que tengan un pipe vecino y que este acepte la entrada
        const validExits = possibleExits.filter(dir => {
            const nx = nextPipe.position.x + dir.dx;
            const ny = nextPipe.position.y + dir.dy;
            if (!grid.isValidPosition(nx, ny)) return false;
            const neighbor = grid.getPipeAt(nx, ny);
            if (!neighbor) return false;

            const neighborEntry = dir.opposite;
            return neighbor.getConnections().includes(neighborEntry);
        });

        if (validExits.length === 0) return null;

        nextExit = validExits[0];
    } else {
      const possibleExits = connections.filter((d) => d !== entryDirection);
      nextExit = possibleExits[0] ?? null;
    }

    if (!nextExit) {
      logger.debug(`Flow ends: no valid exit from pipe at (${nextX}, ${nextY})`);
      return null;
    }

    return { pipe: nextPipe, entryDirection, exitDirection: nextExit };
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