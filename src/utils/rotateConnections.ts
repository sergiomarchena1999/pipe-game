import { Direction } from "../core/domain/Direction";


/**
 * Rotates a list of directions to match a given facing direction.
 * Assumes the shape's default orientation is facing Right (0°).
 *
 * This implementation rotates by angle instead of relying on array index order.
 */
export function rotateConnections(
  connections: readonly Direction[],
  facing: Direction
): Direction[] {
  // Right is the shape's default facing (0°)
  const rightAngle = Direction.Right.angle; // should be 0
  const targetAngle = facing.angle;

  // number of degrees to rotate clockwise
  const rotateDegrees = ((targetAngle - rightAngle) + 360) % 360;

  return connections.map(orig => {
    const newAngle = (orig.angle + rotateDegrees) % 360;
    return Direction.fromAngle(newAngle);
  });
}