import type { Grid } from "./Grid";
import type { Pipe } from "./Pipe";
import type { ILogger } from "./logging/ILogger";


/**
 * Represents the result of a water flow analysis.
 */
export interface FlowResult {
  /** Pipes traversed in flow order (includes the start pipe). */
  pipes: Pipe[];
  /** Total number of connected cells. */
  count: number;
}

/**
 * Calculates the full water flow path starting from the grid's start pipe.
 * Traverses connected pipes until the flow stops.
 *
 * @param grid The active game grid.
 * @param logger Optional logger for debug output.
 * @returns Object containing the visited pipes and the total cell count.
 */
export function calculateWaterFlow(grid: Grid, logger: ILogger): FlowResult {
  const startPipe = (grid as any)._startPipe as Pipe | undefined;
  if (!startPipe) {
    throw new Error("No start pipe defined");
  }

  const visited: Pipe[] = [startPipe];
  let currentPipe = startPipe;
  let currentExit = startPipe.direction;

  while (true) {
    const next = grid.getNextPipeInFlow(currentPipe.position.x, currentPipe.position.y, currentExit);
    if (!next) {
      logger.debug(`Flow stopped at ${currentPipe.position}`);
      break;
    }

    const { pipe: nextPipe, entryDirection, exitDirection } = next;
    logger.debug(`Flow from ${currentPipe.position} → ${nextPipe.position} (${entryDirection} → ${exitDirection})`);

    visited.push(nextPipe);
    currentPipe = nextPipe;
    currentExit = exitDirection;
  }

  return { pipes: visited, count: visited.length };
}