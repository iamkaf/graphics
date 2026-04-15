import { Application, extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics, type Ticker } from "pixi.js";
import { useCallback, useRef, useState } from "react";

extend({ Container, Graphics });

function RotatingShapes() {
  const squareRef = useRef<Graphics>(null);
  const ringRef = useRef<Graphics>(null);
  const groupRef = useRef<Container>(null);
  const { app } = useApplication();

  useTick(
    useCallback((ticker: Ticker) => {
      if (squareRef.current) squareRef.current.rotation += 0.015 * ticker.deltaTime;
      if (ringRef.current) ringRef.current.rotation -= 0.013 * ticker.deltaTime;
    }, []),
  );

  useTick(
    useCallback(() => {
      if (groupRef.current) {
        groupRef.current.x = app.screen.width / 2;
        groupRef.current.y = app.screen.height / 2;
      }
    }, [app]),
  );

  const drawSquare = useCallback((g: Graphics) => {
    g.clear().rect(-50, -50, 100, 100).fill(0x38bdf8);
  }, []);

  const drawRing = useCallback((g: Graphics) => {
    g.clear().rect(-55, -55, 110, 110).stroke({ color: 0x0ea5e9, width: 6 });
  }, []);

  return (
    <pixiContainer ref={groupRef}>
      <pixiGraphics ref={squareRef} draw={drawSquare} />
      <pixiGraphics ref={ringRef} draw={drawRing} />
    </pixiContainer>
  );
}

export default function PixiDemo() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className="demo-canvas border border-slate-300 bg-slate-900"
      aria-label="Pixi.js demo canvas container"
    >
      {container && (
        <Application antialias background="#0f172a" resizeTo={container}>
          <RotatingShapes />
        </Application>
      )}
    </div>
  );
}
