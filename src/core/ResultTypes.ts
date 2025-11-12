
/**
 * Represents the result of an operation that can succeed or fail.
 * Prefer this over null returns or throwing exceptions in application logic.
 */
export type Result<T, E = string> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export namespace Result {
  export function ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  }

  export function fail<E>(error: E): Result<never, E> {
    return { success: false, error };
  }

  export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> {
    return result.success ? ok(fn(result.value)) : result;
  }

  export function flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> {
    return result.success ? fn(result.value) : result;
  }
}

// ============================================================================
// Domain Error Types
// ============================================================================

export type PlacePipeError =
  | 'game_not_initialized'
  | 'invalid_position'
  | 'cell_blocked'
  | 'cell_occupied'
  | 'bomb_started'
  | 'queue_empty';

export type BombError =
  | 'max_bombs_reached'
  | 'cannot_bomb_start_pipe'
  | 'pipe_blocked'
  | 'queue_empty';

export type GridError =
  | 'already_initialized'
  | 'initialization_failed'
  | 'position_mismatch'
  | 'position_out_of_bounds'
  | 'cell_blocked'
  | 'no_empty_cells'
  | 'no_valid_direction';