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
import { ParallelCoordinateChart } from '../../utils/parallelCoordinateChart';

const props = defineProps({
  title: {
    type: String,
    default: 'Ranking Divergence - Parallel Coordinates'
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
let parallelInstance = null;

// Initialize parallel coordinate on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Create and initialize parallel coordinate instance with responsive config
  parallelInstance = new ParallelCoordinateChart(chartConfig.value);
  parallelInstance.init(chartRef.value, rawData, props.sharedState || {});
});

// Watch for chart config changes (window resize) and update visualization
watch(chartConfig, (newConfig) => {
  if (parallelInstance) {
    parallelInstance.resize();
  }
}, { deep: true });

// Watch for step state changes and update visualization
watch(() => props.stepState, (newState) => {
  if (parallelInstance && newState) {
    parallelInstance.update(newState, props.sharedState || {});
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (parallelInstance && props.stepState) {
    parallelInstance.update(props.stepState, newState || {});
  }
}, { deep: true });

// Cleanup on unmount
onBeforeUnmount(() => {
  if (parallelInstance) {
    parallelInstance.destroy();
  }
});

// Expose Component Contract methods
defineExpose({
  init: (container, data, sharedState) => {
    if (!parallelInstance) {
      parallelInstance = new ParallelCoordinateChart(chartConfig.value);
    }
    parallelInstance.init(container, data, sharedState);
  },
  update: (stepState, sharedState) => {
    if (parallelInstance) {
      parallelInstance.update(stepState, sharedState);
    }
  },
  resize: () => {
    if (parallelInstance) {
      parallelInstance.resize();
    }
  },
  destroy: () => {
    if (parallelInstance) {
      parallelInstance.destroy();
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
  height: auto;
}
</style>
