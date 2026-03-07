# Component Contract

All visualization modules must follow the same interface so they can be mounted into the shared scrollytelling framework.

---

## 1. Required Methods

Each visualization component must expose the following methods:

### `init(container, data, sharedState)`
Initial render of the visualization.

**Arguments**
- `container`: DOM element where the chart will be rendered
- `data`: full processed dataset
- `sharedState`: global shared state object

**Responsibilities**
- create SVG / canvas / HTML structure
- set scales
- render initial marks
- register internal event listeners

---

### `update(stepState, sharedState)`
Update visualization when scroll step or interaction changes.

**Arguments**
- `stepState`: state object defined in `step_config.json`
- `sharedState`: current global shared state

**Responsibilities**
- respond to selected genre / highlighted title / mode
- animate transitions if needed
- update annotations and emphasis

---

### `resize()`
Recalculate layout and rerender when window size changes.

---

### `destroy()`
Clean up event listeners, timers, and DOM elements if needed.

---

## 2. Shared State Format

All components must read from and/or write to the same shared state shape.

```js
{
  selectedGenre: null,
  highlightGenre: null,
  highlightTitle: null,
  hoveredTitle: null,
  selectedPlatform: null,
  yearRange: [2000, 2025],
  mode: null
}