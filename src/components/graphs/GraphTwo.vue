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
import { BeeswarmChart } from '../../utils/beeswarmChart';

const props = defineProps({
  title: {
    type: String,
    default: 'Individual Anime Ratings - Beeswarm Plot'
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
let beeswarmInstance = null;

// Initialize beeswarm on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Create and initialize beeswarm instance with responsive config
  beeswarmInstance = new BeeswarmChart(chartConfig.value);
  beeswarmInstance.init(chartRef.value, rawData, props.sharedState || {});
});

// Watch for chart config changes (window resize) and update visualization
watch(chartConfig, (newConfig) => {
  if (beeswarmInstance) {
    beeswarmInstance.resize();
  }
}, { deep: true });

// Watch for step state changes and update visualization
watch(() => props.stepState, (newState) => {
  if (beeswarmInstance && newState) {
    beeswarmInstance.update(newState, props.sharedState || {});
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (beeswarmInstance && props.stepState) {
    beeswarmInstance.update(props.stepState, newState || {});
  }
}, { deep: true });

// Cleanup on unmount
onBeforeUnmount(() => {
  if (beeswarmInstance) {
    beeswarmInstance.destroy();
  }
});

// Expose Component Contract methods
defineExpose({
  init: (container, data, sharedState) => {
    if (!beeswarmInstance) {
      beeswarmInstance = new BeeswarmChart(globalConfig.chart);
    }
    beeswarmInstance.init(container, data, sharedState);
  },
  update: (stepState, sharedState) => {
    if (beeswarmInstance) {
      beeswarmInstance.update(stepState, sharedState);
    }
  },
  resize: () => {
    if (beeswarmInstance) {
      beeswarmInstance.resize();
    }
  },
  destroy: () => {
    if (beeswarmInstance) {
      beeswarmInstance.destroy();
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
