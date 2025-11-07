import { describe, it, expect } from "vitest";
import { calculateWaterFlow } from "../../src/core/WaterFlow";
import { Grid } from "../../src/core/Grid";
import { GridCell } from "../../src/core/GridCell";
import { Pipe, PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";

describe("calculateWaterFlow", () => {
  it("recorre una línea recta de pipes conectados", () => {
    const grid = new Grid(3, 1, globalThis.mockLogger);
    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);
    const c2 = new GridCell(2, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const p1 = new Pipe(PipeType.Straight, c1, Direction.Right);
    const p2 = new Pipe(PipeType.Straight, c2, Direction.Right);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(p1);
    (grid as any).cells[0][2].setPipe(p2);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(3);
    expect(result.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Straight,
      PipeType.Straight,
    ]);
  });

  it("se detiene si no hay pipe siguiente", () => {
    const grid = new Grid(2, 1, globalThis.mockLogger);
    const c0 = new GridCell(0, 0);
    const start = new Pipe(PipeType.Start, c0, Direction.Right);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(1);
    expect(result.pipes[0]).toBe(start);
  });

  it("gira correctamente a través de un corner", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);
    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);
    const c2 = new GridCell(1, 1);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const corner = new Pipe(PipeType.Corner, c1, Direction.Left); // Left–Down
    const end = new Pipe(PipeType.Straight, c2, Direction.Down);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(corner);
    (grid as any).cells[1][1].setPipe(end);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(3);
    expect(result.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Corner,
      PipeType.Straight,
    ]);
  });

  it("se detiene si el siguiente pipe no conecta físicamente", () => {
    const grid = new Grid(2, 1, globalThis.mockLogger);
    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const wrong = new Pipe(PipeType.Corner, c1, Direction.Right); // conexiones Up–Right → no conecta por Left

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(wrong);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(1); // se queda solo en el start
  });

  it("maneja correctamente un grid vacío o sin start pipe", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);
    (grid as any)._startPipe = undefined;

    expect(() => calculateWaterFlow(grid, globalThis.mockLogger)).toThrow();
  });
});

describe("calculateWaterFlow con Cross pipes", () => {
  it("fluye en línea recta a través de una cross (entrada izquierda → salida derecha)", () => {
    const grid = new Grid(3, 1, globalThis.mockLogger);

    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);
    const c2 = new GridCell(2, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const cross = new Pipe(PipeType.Cross, c1, Direction.Up);
    const straight = new Pipe(PipeType.Straight, c2, Direction.Right);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(cross);
    (grid as any).cells[0][2].setPipe(straight);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(3);
    expect(result.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Cross,
      PipeType.Straight,
    ]);
  });

  it("fluye a través de cross girando hacia abajo (entrada izquierda → salida abajo)", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);

    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);
    const c2 = new GridCell(1, 1);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const cross = new Pipe(PipeType.Cross, c1, Direction.Up);
    const downPipe = new Pipe(PipeType.Straight, c2, Direction.Down);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(cross);
    (grid as any).cells[1][1].setPipe(downPipe);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(3);
    expect(result.pipes[1].type).toBe(PipeType.Cross);
    expect(result.pipes[2].type).toBe(PipeType.Straight);
  });

  it("se detiene si la salida de la cross no tiene conexión válida", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);

    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const cross = new Pipe(PipeType.Cross, c1, Direction.Up);
    // No hay nada conectado abajo/derecha → debe detenerse

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(cross);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(2);
    expect(result.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Cross,
    ]);
  });

  it("detecta bucle cuando dos cross se conectan entre sí (sin salida)", () => {
    const grid = new Grid(2, 1, globalThis.mockLogger);

    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);

    const start = new Pipe(PipeType.Cross, c0, Direction.Up);
    const cross2 = new Pipe(PipeType.Cross, c1, Direction.Up);

    // Conectamos ambos lados: start → cross2, y cross2 → start (ciclo)
    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(cross2);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    // Debe detenerse y no entrar en bucle infinito
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.count).toBeLessThan(10);
  });

  it("permite que el flujo atraviese dos cross en secuencia", () => {
    const grid = new Grid(4, 1, globalThis.mockLogger);

    const c0 = new GridCell(0, 0);
    const c1 = new GridCell(1, 0);
    const c2 = new GridCell(2, 0);
    const c3 = new GridCell(3, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const cross1 = new Pipe(PipeType.Cross, c1, Direction.Up);
    const cross2 = new Pipe(PipeType.Cross, c2, Direction.Up);
    const end = new Pipe(PipeType.Straight, c3, Direction.Right);

    (grid as any)._startPipe = start;
    (grid as any).cells[0][0].setPipe(start);
    (grid as any).cells[0][1].setPipe(cross1);
    (grid as any).cells[0][2].setPipe(cross2);
    (grid as any).cells[0][3].setPipe(end);

    const result = calculateWaterFlow(grid, globalThis.mockLogger);

    expect(result.count).toBe(4);
    expect(result.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Cross,
      PipeType.Cross,
      PipeType.Straight,
    ]);
  });
});