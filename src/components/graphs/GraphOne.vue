<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    <div ref="chartRef" class="graph-canvas" />
  </article>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeUnmount, defineExpose } from 'vue';
import { useSharedData } from '../../composables/useSharedData';
import { useResponsiveConfig } from '../../composables/useResponsiveConfig';
import { buildGenreHeatmapData } from '../../utils/dataLoader';
import { HeatmapChart } from '../../utils/heatmapChart';

const props = defineProps({
  title: {
    type: String,
    default: 'Genre × Platform Heatmap'
  },
  stepState: {
    type: Object,
    default: null
  },
  sharedState: {
    type: Object,
    default: null
  }
});

const chartRef = ref(null);
const { loadData } = useSharedData();
const { chartConfig } = useResponsiveConfig();
let heatmapInstance = null;
let rawHeatmapData = null;

// Initialize heatmap on mount
onMounted(async () => {
  const rawData = await loadData();
  rawHeatmapData = buildGenreHeatmapData(rawData);
  
  // Create and initialize heatmap instance with responsive config
  heatmapInstance = new HeatmapChart(chartConfig.value);
  heatmapInstance.init(chartRef.value, rawHeatmapData, props.sharedState || {});
});

// Watch for chart config changes (window resize) and update visualization
watch(chartConfig, (newConfig) => {
  if (heatmapInstance) {
    heatmapInstance.resize();
  }
}, { deep: true });

// Watch for step state changes and update visualization
watch(() => props.stepState, (newState) => {
  if (heatmapInstance && newState) {
    heatmapInstance.update(newState, props.sharedState || {});
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (heatmapInstance && props.stepState) {
    heatmapInstance.update(props.stepState, newState || {});
  }
}, { deep: true });

// Cleanup on unmount
onBeforeUnmount(() => {
  if (heatmapInstance) {
    heatmapInstance.destroy();
  }
});

// Expose Component Contract methods for external use
defineExpose({
  init: (container, data, sharedState) => {
    if (!heatmapInstance) {
      heatmapInstance = new HeatmapChart(globalConfig.chart);
    }
    heatmapInstance.init(container, data, sharedState);
  },
  update: (stepState, sharedState) => {
    if (heatmapInstance) {
      heatmapInstance.update(stepState, sharedState);
    }
  },
  resize: () => {
    if (heatmapInstance) {
      heatmapInstance.resize();
    }
  },
  destroy: () => {
    if (heatmapInstance) {
      heatmapInstance.destroy();
    }
  }
});
</script>

<style scoped>
.graph-card {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.graph-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
}

.graph-canvas {
  width: 100%;
  min-height: 500px;
}
</style>
