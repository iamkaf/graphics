import { useMemo, useState } from "react";
import { Box, Image } from "lucide-react";
import PixiDemo from "./demos/PixiDemo";
import PixiGridPainterDemo from "./demos/PixiGridPainterDemo";
import ThreeDemo from "./demos/ThreeDemo";

const DEMOS = [
  {
    id: "pixi",
    title: "Pixi Hello World",
    icon: Image,
    iconClassName: "text-cyan-600",
    component: PixiDemo,
    notes: "A simple 2D scene with a rotating square and ticker updates from pixi.js.",
  },
  {
    id: "pixi-grid",
    title: "Pixi Grid Painter",
    icon: Image,
    iconClassName: "text-emerald-600",
    component: PixiGridPainterDemo,
    notes:
      "A grid-based map editor where you can choose blocks and paint directly onto the tile map.",
  },
  {
    id: "three",
    title: "Three Hello World",
    icon: Box,
    iconClassName: "text-purple-600",
    component: ThreeDemo,
    notes: "A simple 3D scene with a rotating mesh, camera, and animation loop.",
  },
];

type Demo = (typeof DEMOS)[number];
const demoMap = Object.fromEntries(DEMOS.map((d) => [d.id, d])) as Record<string, Demo>;

type DemoId = Demo["id"];

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoId>("pixi");
  const active = demoMap[activeDemo];
  const DemoComponent = useMemo(() => active.component, [active.component]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="h-16 border-b border-slate-300 bg-white px-4 py-3">
        <h1 className="text-2xl font-medium">Graphics experiments</h1>
      </header>

      <div className="grid h-[calc(100svh-4rem)] grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-300 bg-white p-4 lg:border-b-0 lg:border-r">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Demo menu
          </h2>
          <ul className="space-y-2">
            {DEMOS.map((demo) => (
              <li key={demo.id}>
                <button
                  type="button"
                  onClick={() => setActiveDemo(demo.id)}
                  aria-current={activeDemo === demo.id || undefined}
                  className={`w-full border px-3 py-2 text-left text-sm transition-colors ${
                    activeDemo === demo.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <demo.icon
                      className={`h-4 w-4 ${activeDemo === demo.id ? "text-white" : demo.iconClassName}`}
                    />
                    <span>{demo.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex min-h-0 flex-col p-4">
          <section className="border border-slate-300 bg-white p-3">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
              Active engine: {active.id}.js
            </p>
            <p className="text-sm text-slate-700">{active.notes}</p>
          </section>

          <section className="mt-4 min-h-0 flex-1 border border-slate-300 bg-white p-2">
            <DemoComponent key={activeDemo} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
