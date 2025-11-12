import { Direction } from "../domain/Direction";


export enum PipeType {
  Straight = "straight",
  Corner = "corner",
  Cross = "cross",
  Start = "start",
}

export interface PipeShape {
  id: string;
  connections: readonly Direction[];
  reusable?: boolean;
}

export const PipeShapes: Record<PipeType, PipeShape> = {
  straight: { id: PipeType.Straight, connections: [Direction.Left, Direction.Right] },
  corner: { id: PipeType.Corner, connections: [Direction.Up, Direction.Right] },
  cross: { id: PipeType.Cross, connections: Direction.All, reusable: true },
  start: { id: PipeType.Start, connections: [Direction.Right] }
};