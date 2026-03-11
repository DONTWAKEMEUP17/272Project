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
import { ScatterChart } from '../../utils/scatterChart';

const props = defineProps({
  title: {
    type: String,
    default: 'Rating Stability & Popularity - Scatter Plot'
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
let scatterInstance = null;

// Initialize scatter on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Create and initialize scatter instance with responsive config
  scatterInstance = new ScatterChart(chartConfig.value);
  scatterInstance.init(chartRef.value, rawData, props.sharedState || {});
});

// Watch for chart config changes (window resize) and update visualization
watch(chartConfig, (newConfig) => {
  if (scatterInstance) {
    scatterInstance.resize();
  }
}, { deep: true });

// Watch for step state changes and update visualization
watch(() => props.stepState, (newState) => {
  if (scatterInstance && newState) {
    scatterInstance.update(newState, props.sharedState || {});
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (scatterInstance && props.stepState) {
    scatterInstance.update(props.stepState, newState || {});
  }
}, { deep: true });

// Cleanup on unmount
onBeforeUnmount(() => {
  if (scatterInstance) {
    scatterInstance.destroy();
  }
});

// Expose Component Contract methods
defineExpose({
  init: (container, data, sharedState) => {
    if (!scatterInstance) {
      scatterInstance = new ScatterChart(globalConfig.chart);
    }
    scatterInstance.init(container, data, sharedState);
  },
  update: (stepState, sharedState) => {
    if (scatterInstance) {
      scatterInstance.update(stepState, sharedState);
    }
  },
  resize: () => {
    if (scatterInstance) {
      scatterInstance.resize();
    }
  },
  destroy: () => {
    if (scatterInstance) {
      scatterInstance.destroy();
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
  min-height: 700px;
}
</style>
