<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    <div ref="chartRef" class="graph-canvas" />
  </article>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeUnmount, defineExpose } from 'vue';
import { useSharedData } from '../../composables/useSharedData';
import { RadarChart } from '../../utils/radarChart';

const props = defineProps({
  title: {
    type: String,
    default: 'Genre Bias Profiles - Radar Gallery'
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
const { globalConfig, loadData } = useSharedData();
let radarInstance = null;

// Initialize radar on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Create and initialize radar instance
  radarInstance = new RadarChart(globalConfig.chart);
  radarInstance.init(chartRef.value, rawData, props.sharedState || {});
});

// Watch for step state changes and update visualization
watch(() => props.stepState, (newState) => {
  if (radarInstance && newState) {
    radarInstance.update(newState, props.sharedState || {});
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (radarInstance && props.stepState) {
    radarInstance.update(props.stepState, newState || {});
  }
}, { deep: true });

// Handle window resize
const handleResize = () => {
  if (radarInstance) {
    radarInstance.resize();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (radarInstance) {
    radarInstance.destroy();
  }
});

// Expose Component Contract methods
defineExpose({
  init: (container, data, sharedState) => {
    if (!radarInstance) {
      radarInstance = new RadarChart(globalConfig.chart);
    }
    radarInstance.init(container, data, sharedState);
  },
  update: (stepState, sharedState) => {
    if (radarInstance) {
      radarInstance.update(stepState, sharedState);
    }
  },
  resize: () => {
    if (radarInstance) {
      radarInstance.resize();
    }
  },
  destroy: () => {
    if (radarInstance) {
      radarInstance.destroy();
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
