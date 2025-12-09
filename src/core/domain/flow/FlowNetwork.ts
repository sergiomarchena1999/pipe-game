import EventEmitter from "eventemitter3";
import type { ILogger } from "../../logging/ILogger";
import type { Pipe, PipePort } from "../pipe/Pipe";
import type { Direction } from "../Direction";
import type { Grid } from "../grid/Grid";


/** Represents the state of water flowing through a single pipe. */
interface ActivePipeState {
  pipe: Pipe;
  entryDir: Direction | null;
  exitDir: Direction | null;
  progress: number;       // 0–100
  delayRemaining: number; // seconds
}

/** Cache key for path calculation memoization. */
type PathCacheKey = string;

/** Cached path calculation result. */
interface PathResult {
  readonly direction: Direction | null;
  readonly length: number;
}

interface FlowNetworkEvents {
  /** Emitted when water completes flowing through a pipe (reaches 100% progress) */
  onPipeFlowed: (pipe: Pipe) => void;
  /** Emitted when water gets stuck (no valid exit direction available) */
  onFlowStuck: (pipe: Pipe) => void;
  /** Emitted when water tries to exit but there's no connecting pipe */
  onNoPathAvailable: (pipe: Pipe, exitDir: Direction) => void;
}

/**
 * Central flow network that simulates water flowing through pipes.
 * Handles path-finding, progress tracking, and port usage marking.
 * Emits events for score tracking and win/lose conditions.
 */
export class FlowNetwork extends EventEmitter<FlowNetworkEvents> {
  private activeStates: ActivePipeState[] = [];
  private visitedPorts = new Map<Pipe, Set<Direction>>();
  private pathCache = new Map<PathCacheKey, PathResult>();

  constructor(
    private readonly grid: Grid,
    private readonly logger: ILogger
  ) { super(); }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Initializes water flow from the start pipe. */
  initialize(startDelaySeconds = 0): void {
    const startPipe = this.grid.tryGetStartPipe();
    if (!startPipe) {
      this.logger.warn("Cannot initialize flow: no start pipe");
      return;
    }

    // Start flow from first open port
    const firstPort = startPipe.openPorts[0];
    if (!firstPort) {
      this.logger.warn("Start pipe has no open ports");
      return;
    }

    this.activeStates = [{
      pipe: startPipe,
      entryDir: null,
      exitDir: firstPort,
      progress: 0,
      delayRemaining: startDelaySeconds,
    }];

    this.visitedPorts.clear();
    this.pathCache.clear();
    this.logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  /**
   * Updates water flow simulation.
   * @param delta Time elapsed in seconds
   * @param speed Progress units per second (e.g., 50 = 2 seconds to traverse a pipe)
   */
  update(delta: number, speed: number) {
    const newStates: ActivePipeState[] = [];

    for (const state of this.activeStates) {
      // Handle initial delay
      if (state.delayRemaining > 0) {
        state.delayRemaining -= delta;
        newStates.push(state);
        continue;
      }

      // Mark entry port as used when flow enters
      if (state.entryDir && !state.exitDir) {
        state.pipe.markPortUsed(state.entryDir);
      }

      // Determine exit direction when flow enters pipe
      const prevProgress = state.progress;
      if (state.entryDir && prevProgress == 0) {
        state.exitDir = this.selectExitDirection(state.pipe, state.entryDir);
        
        // Check if flow is stuck (no valid exit)
        if (!state.exitDir) {
          this.logger.warn(`Flow stuck at ${state.pipe.position} - no valid exit`);
          this.emit("onFlowStuck", state.pipe);
          continue; // Don't add to newStates - flow ends here
        }
      }

      // Advance progress
      state.progress += speed * delta;

      // Mark entry port as visited when reaching pipe center
      if (state.entryDir && prevProgress < 50 && state.progress >= 50) {
        this.markVisited(state.pipe, state.entryDir);
      }

      // Keep flowing if not complete
      if (state.progress < 100) {
        newStates.push(state);
        continue;
      }

      // Flow completed this pipe - emit event
      if (prevProgress < 100 && state.progress >= 100) {
        this.emit("onPipeFlowed", state.pipe);
        
        // Mark exit port
        if (state.exitDir) {
          this.markVisited(state.pipe, state.exitDir);
          state.pipe.markPortUsed(state.exitDir);
        }
      }

      // Try to continue to next pipe
      if (!state.exitDir) continue;

      const nextPipe = this.grid.getNeighborPipe(state.pipe.position, state.exitDir);

      // No pipe at exit - emit event
      if (!nextPipe) {
        this.logger.debug(`No pipe available at ${state.pipe.position} exit ${state.exitDir.name}`);
        this.emit("onNoPathAvailable", state.pipe, state.exitDir);
        continue;
      }

      // Pipe is being bombed - emit event
      if (nextPipe.isBombing) {
        this.logger.debug(`Pipe at ${state.pipe.position} is being bombed`);
        this.emit("onNoPathAvailable", state.pipe, state.exitDir);
        continue;
      }

      // Pipe doesn't accept connection - emit event
      if (!nextPipe.accepts(state.exitDir.opposite)) {
        this.logger.debug(`Pipe at ${nextPipe.position} doesn't accept connection from ${state.exitDir.name}`);
        this.emit("onNoPathAvailable", state.pipe, state.exitDir);
        continue;
      }

      // Flow continues to next pipe
      newStates.push({
        pipe: nextPipe,
        entryDir: state.exitDir.opposite,
        exitDir: null,
        progress: 0,
        delayRemaining: 0,
      });

      this.logger.debug(`Flow advanced from ${state.pipe.position} to ${nextPipe.position}`);
    }

    this.activeStates = newStates;
  }

  /** Gets the current active flow state (for rendering). */
  getActiveState(): ActivePipeState | undefined {
    return this.activeStates[0];
  }

  /** Gets a snapshot of all visited ports (for rendering). */
  getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }> {
    return Array.from(this.visitedPorts.entries()).map(([pipe, dirs]) => ({
      pipe,
      dirs: Array.from(dirs),
    }));
  }

  /** Clears all flow state and cache. */
  clear(): void {
    this.activeStates = [];
    this.visitedPorts.clear();
    this.logger.info("Flow network cleared");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  /**
   * Selects which exit port water should take from a pipe.
   * Uses longest-path heuristic with memoization.
   */
  private selectExitDirection(pipe: Pipe, entryDir: Direction): Direction | null {
    const openPorts = pipe.openPorts.filter(d => d !== entryDir);
    if (openPorts.length === 0) return null;

    // Get available (unvisited) ports
    const visited = this.visitedPorts.get(pipe);
    const availablePorts = openPorts.filter(d => !visited?.has(d));

    // If only one choice, take it
    if (availablePorts.length === 1) {
      return availablePorts[0];
    }

    // If no unvisited ports, flow ends
    if (availablePorts.length === 0) {
      return null;
    }

    // Use longest-path heuristic to choose best exit
    const { direction } = this.calculateLongestPath(pipe, pipe.getPort(entryDir)!, new Set());
    if (direction) {
      this.logger.debug(`Selected exit ${direction.name} from ${pipe.position} (longest path)`);
      return direction;
    }

    // Fallback to first available port
    return availablePorts[0];
  }

  /** Marks a port as visited (water has flowed through it). */
  private markVisited(pipe: Pipe, dir: Direction): void {
    if (!this.visitedPorts.has(pipe)) {
      this.visitedPorts.set(pipe, new Set());
    }
    this.visitedPorts.get(pipe)!.add(dir);
  }

  /**
   * Calculates the longest path from a pipe/direction combination.
   * Uses memoization to avoid recalculating the same paths.
   */
  private calculateLongestPath(pipe: Pipe, entryPort: PipePort, visitedInPath: Set<PipePort>): PathResult {
    // Generate cache key based on pipe and entry port direction
    const cacheKey = this.createCacheKey(pipe, entryPort.direction);
    const cached = this.pathCache.get(cacheKey);
    if (cached) return cached;

    // Mark port as visited
    visitedInPath.add(entryPort);

    let bestDirection: Direction | null = null;
    let maxLength = -1;

    const openPorts = pipe.openPorts.filter(d => d !== entryPort.direction);
    for (const exitDir of openPorts) {
      const nextPipe = this.grid.getNeighborPipe(pipe.position, exitDir);
      if (!nextPipe) continue;

      const oppositePort = nextPipe.getPort(exitDir.opposite);
      if (!oppositePort || oppositePort.used) continue;

      // Skip if this port was already visited in the current path (avoid cycles)
      if (visitedInPath.has(oppositePort)) continue;

      // Recursively calculate downstream path
      const subVisited = new Set(visitedInPath);
      const { length: downstreamLength } = this.calculateLongestPath(
        nextPipe,
        oppositePort,
        subVisited
      );

      const totalLength = 1 + downstreamLength;
      if (totalLength > maxLength) {
        maxLength = totalLength;
        bestDirection = exitDir;
      }
    }

    const result: PathResult = {
      direction: bestDirection ?? null,
      length: Math.max(0, maxLength),
    };

    // Cache result
    this.pathCache.set(cacheKey, result);
    return result;
  }

  /** Creates a unique cache key for a pipe and entry direction. */
  private createCacheKey(pipe: Pipe, entryDir: Direction): PathCacheKey {
    return `${pipe.position.toString()},${entryDir.name}`;
  }

  /**
   * Invalidates cached paths that involve a specific pipe.
   * Call this when a pipe is placed or removed.
   */
  invalidatePathCache(affectedPipe: Pipe): void {
    const keysToDelete: PathCacheKey[] = [];
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(affectedPipe.position.toString())) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.pathCache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug(`Invalidated ${keysToDelete.length} cache entries for ${affectedPipe.position}`);
    }
  }
}