import { Application, extend } from "@pixi/react";
import { Container, Graphics, type FederatedPointerEvent } from "pixi.js";
import { Brush, PaintBucket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FpsCounter from "../components/FpsCounter";

extend({ Container, Graphics });

type BlockDefinition = {
  name: string;
  color: number;
  label: string;
};

const STORAGE_KEY = "pixi-grid-painter";

const TILE_SIZE = 24;
const GRID_COLUMNS = 20;
const GRID_ROWS = 16;

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    name: "Empty",
    color: 0x0f172a,
    label: "Clear tile",
  },
  {
    name: "Grass",
    color: 0x22c55e,
    label: "Grass block",
  },
  {
    name: "Sand",
    color: 0xeab308,
    label: "Sand block",
  },
  {
    name: "Water",
    color: 0x0ea5e9,
    label: "Water block",
  },
  {
    name: "Stone",
    color: 0x64748b,
    label: "Stone block",
  },
  {
    name: "Brick",
    color: 0xdc2626,
    label: "Brick block",
  },
];

type TileGrid = number[][];

type PaintTool = "brush" | "bucket";

function createEmptyGrid(): TileGrid {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLUMNS }, () => 0));
}

function loadState(): { grid: TileGrid; selectedBlock: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { grid: TileGrid; selectedBlock: number };
      if (
        Array.isArray(parsed.grid) &&
        parsed.grid.length === GRID_ROWS &&
        parsed.grid.every((row) => Array.isArray(row) && row.length === GRID_COLUMNS) &&
        typeof parsed.selectedBlock === "number"
      ) {
        return parsed;
      }
    }
  } catch {}
  return { grid: createEmptyGrid(), selectedBlock: 1 };
}

function saveState(grid: TileGrid, selectedBlock: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid, selectedBlock }));
  } catch {}
}

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function MapLayer({
  grid,
  onPaint,
  tool,
  canvasWidth,
  canvasHeight,
}: {
  grid: TileGrid;
  onPaint: (column: number, row: number) => void;
  tool: PaintTool;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const mapRef = useRef<Container>(null);

  const mapWidth = GRID_COLUMNS * TILE_SIZE;
  const mapHeight = GRID_ROWS * TILE_SIZE;
  const mapX = Math.max(0, Math.floor((canvasWidth - mapWidth) / 2));
  const mapY = Math.max(0, Math.floor((canvasHeight - mapHeight) / 2));

  const paintAtPointer = useCallback(
    (event: FederatedPointerEvent) => {
      if (event.button !== 0 && event.buttons !== 1) return;

      const layer = mapRef.current;
      if (!layer) return;

      const point = event.getLocalPosition(layer);
      const column = Math.floor(point.x / TILE_SIZE);
      const row = Math.floor(point.y / TILE_SIZE);

      if (column < 0 || row < 0 || column >= GRID_COLUMNS || row >= GRID_ROWS) {
        return;
      }

      onPaint(column, row);
    },
    [onPaint],
  );

  const drawLayer = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.rect(0, 0, mapWidth, mapHeight).fill(0x020617);

      for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let column = 0; column < GRID_COLUMNS; column += 1) {
          const tileIndex = grid[row][column];
          const block = BLOCK_DEFINITIONS[tileIndex] ?? BLOCK_DEFINITIONS[0];

          graphics
            .rect(column * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .fill(block.color);
        }
      }

      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const x = column * TILE_SIZE;
        graphics
          .moveTo(x, 0)
          .lineTo(x, mapHeight)
          .stroke({ width: 1, color: 0x334155, alpha: 0.35 });
      }

      for (let row = 0; row <= GRID_ROWS; row += 1) {
        const y = row * TILE_SIZE;
        graphics
          .moveTo(0, y)
          .lineTo(mapWidth, y)
          .stroke({ width: 1, color: 0x334155, alpha: 0.35 });
      }
    },
    [grid, mapHeight, mapWidth],
  );

  return (
    <pixiContainer
      ref={mapRef}
      x={mapX}
      y={mapY}
      eventMode="static"
      onPointerDown={paintAtPointer}
      onPointerMove={tool === "brush" ? paintAtPointer : undefined}
    >
      <pixiGraphics draw={drawLayer} />
    </pixiContainer>
  );
}

function floodFill(
  grid: TileGrid,
  startRow: number,
  startColumn: number,
  fillValue: number,
): TileGrid {
  const targetValue = grid[startRow][startColumn];
  if (targetValue === fillValue) return grid;

  const nextGrid = grid.map((row) => [...row]);
  const queue: [number, number][] = [[startRow, startColumn]];

  while (queue.length > 0) {
    const [row, column] = queue.shift()!;

    if (row < 0 || row >= GRID_ROWS || column < 0 || column >= GRID_COLUMNS) {
      continue;
    }

    if (nextGrid[row][column] !== targetValue) {
      continue;
    }

    nextGrid[row][column] = fillValue;

    queue.push([row + 1, column]);
    queue.push([row - 1, column]);
    queue.push([row, column + 1]);
    queue.push([row, column - 1]);
  }

  return nextGrid;
}

export default function PixiGridPainterDemo() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedBlock, setSelectedBlock] = useState(() => loadState().selectedBlock);
  const [grid, setGrid] = useState<TileGrid>(() => loadState().grid);
  const [paintTool, setPaintTool] = useState<PaintTool>("brush");

  const paintedTiles = useMemo(() => grid.flat().filter((tile) => tile !== 0).length, [grid]);

  useEffect(() => {
    saveState(grid, selectedBlock);
  }, [grid, selectedBlock]);

  const paintCell = useCallback(
    (column: number, row: number) => {
      setGrid((prevGrid) => {
        if (prevGrid[row][column] === selectedBlock) return prevGrid;

        const nextGrid = prevGrid.map((rowTiles) => [...rowTiles]);
        nextGrid[row][column] = selectedBlock;
        return nextGrid;
      });
    },
    [selectedBlock],
  );

  const fillCell = useCallback(
    (column: number, row: number) => {
      setGrid((prevGrid) => {
        const nextGrid = floodFill(prevGrid, row, column, selectedBlock);
        if (nextGrid === prevGrid) return prevGrid;
        return nextGrid;
      });
    },
    [selectedBlock],
  );

  const paint = useCallback(
    (column: number, row: number) => {
      if (paintTool === "bucket") {
        fillCell(column, row);
        return;
      }

      paintCell(column, row);
    },
    [fillCell, paintCell, paintTool],
  );

  const clearMap = useCallback(() => {
    const empty = createEmptyGrid();
    setGrid(empty);
  }, []);

  const activeBlock = BLOCK_DEFINITIONS[selectedBlock] ?? BLOCK_DEFINITIONS[0];

  return (
    <div className="grid h-full gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-4">
      <aside className="border border-slate-300 bg-white p-3 text-sm">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Block chooser
        </h2>
        <p className="mb-2 text-xs text-slate-600">Active block</p>
        <p className="mb-3 rounded border border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
          {activeBlock.name} - {activeBlock.label}
        </p>

        <div className="space-y-2">
          <div className="mb-3">
            <p className="mb-2 text-xs text-slate-600">Tool</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaintTool("brush")}
                aria-pressed={paintTool === "brush"}
                className={`rounded border px-2 py-1 text-left text-xs transition-colors ${
                  paintTool === "brush"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-100"
                }`}
              >
                <span className="inline-flex gap-1">
                  <Brush className="h-4 w-4" />
                  <span>Brush</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaintTool("bucket")}
                aria-pressed={paintTool === "bucket"}
                className={`rounded border px-2 py-1 text-left text-xs transition-colors ${
                  paintTool === "bucket"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-100"
                }`}
              >
                <span className="inline-flex gap-1">
                  <PaintBucket className="h-4 w-4" />
                  <span>Bucket</span>
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            {paintTool === "brush" ? "Left click + drag" : "Left click"} to paint
          </p>

          {BLOCK_DEFINITIONS.map((block, index) => (
            <button
              key={block.name}
              type="button"
              onClick={() => setSelectedBlock(index)}
              aria-pressed={selectedBlock === index}
              className={`flex w-full items-center gap-2 rounded border px-2 py-2 text-left text-slate-900 transition-colors ${
                selectedBlock === index
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white hover:bg-slate-100"
              }`}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: toCssColor(block.color),
              }}
            >
              <span
                aria-hidden
                className="h-4 w-4 rounded"
                style={{ backgroundColor: toCssColor(block.color) }}
              />
              <span className="text-xs font-medium">{block.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Painted tiles</p>
          <p className="text-sm font-semibold text-slate-700">{paintedTiles}</p>
        </div>

        <button
          type="button"
          onClick={clearMap}
          className="mt-3 w-full border border-rose-300 bg-rose-50 px-2 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100"
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span>Clear map</span>
          </span>
        </button>
      </aside>

      <div
        ref={setContainer}
        className="demo-canvas relative border border-slate-300 bg-slate-900"
        aria-label="Pixi.js tile map editor canvas"
      >
        {container && (
          <Application antialias background="#0f172a" resizeTo={container}>
            <MapLayer
              grid={grid}
              onPaint={paint}
              tool={paintTool}
              canvasWidth={container.clientWidth}
              canvasHeight={container.clientHeight}
            />
          </Application>
        )}
        <FpsCounter />
      </div>
    </div>
  );
}
