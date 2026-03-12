/**
 * Compute opacity and stacking order for each chart layer.
 *
 * This creates a simple crossfade from the active chart to the next chart
 * while the user scrolls through the active text step.
 * 
 * DISABLED: Temporarily disabled to fix window mismatch issues
 */
export function getChartLayerStyle(layerIndex, activeStep, stepProgress, totalLayers) {
  // Temporarily disabled - only show the active layer
  let opacity = 0;
  let zIndex = 1;

  if (layerIndex === activeStep) {
    opacity = 1;  // Always fully opaque for active layer
    zIndex = 3;
  }

  return {
    opacity,
    zIndex
  };
}
