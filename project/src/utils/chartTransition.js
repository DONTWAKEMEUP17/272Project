/**
 * Compute opacity and stacking order for each chart layer.
 *
 * This creates a simple crossfade from the active chart to the next chart
 * while the user scrolls through the active text step.
 */
export function getChartLayerStyle(layerIndex, activeStep, stepProgress, totalLayers) {
  const clampedProgress = Math.max(0, Math.min(1, stepProgress));

  let opacity = 0;
  let zIndex = 1;

  if (layerIndex === activeStep) {
    opacity = 1 - clampedProgress;
    zIndex = 3;
  }

  const nextIndex = Math.min(activeStep + 1, totalLayers - 1);
  if (layerIndex === nextIndex) {
    opacity = activeStep === totalLayers - 1 ? 1 : clampedProgress;
    zIndex = 4;
  }

  return {
    opacity,
    zIndex
  };
}
