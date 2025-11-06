import type { Direction } from "./Direction";
import type { PipeType } from "./Pipe";


/**
 * Shared contract for any pipe representation.
 * Used by both in-grid pipes and queued pipes.
 */
export interface PipeDescriptor {
  /** The pipe’s type (straight, curve, cross, start). */
  readonly type: PipeType;

  /** The pipe’s direction (right, down, left, up). */
  readonly direction: Direction;
}