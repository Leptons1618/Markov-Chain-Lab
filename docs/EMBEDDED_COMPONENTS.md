# Embedding React Components in Markdown

You can embed interactive React components directly in markdown using a fenced code block with the language `component`. Components are lazy‑loaded, mounted only when they enter the viewport, and designed to minimize CPU and memory usage.

## Syntax

````md
```component
{"name":"FlipConvergence","props":{"trials":1000,"updateIntervalMs":30,"batch":50}}
```
````

- `name` must match a key in the component registry
- `props` are passed to the component as JSON

You can also use a simple key:value format if JSON is inconvenient:

````md
```component
name: FlipConvergence
props: {"trials":800,"batch":40}
```
````

## Available Components

- `FlipConvergence` – Simulates coin flips and plots running mean convergence to the true probability (default p=0.5)
  - Props: `p?` (number), `trials?` (number), `updateIntervalMs?` (number), `batch?` (number), `maxPoints?` (number), `height?` (number)
- `FlipCard` – Simple CSS flip animation (Heads/Tails)
  - Props: `intervalMs?` (number), `size?` (number)

## Performance Notes

- Components are loaded with `React.lazy` and only when scrolled into view via `IntersectionObserver`.
- The convergence chart lazy-loads `recharts` and decimates the data to cap memory (`maxPoints`).
- Simulations pause automatically when the tab is hidden to save CPU.
- Animations are kept lightweight and can be disabled (e.g., by pausing or reducing intervals).

## Extending the Registry

To add your own components, register them in `components/markdown-renderer.tsx` under `componentRegistry`:

```ts
const componentRegistry = {
  FlipConvergence: () => import("@/components/demos/FlipConvergence"),
  FlipCard: () => import("@/components/demos/FlipCard"),
  // Add more
  MyCustomViz: () => import("@/components/demos/MyCustomViz"),
}
```

Then use it in markdown:

````md
```component
{"name":"MyCustomViz","props":{"foo":"bar"}}
```
````
