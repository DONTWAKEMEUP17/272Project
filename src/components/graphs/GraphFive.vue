<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    <div class="stats-panel" v-if="stats">
      <div class="stat-item">
        <span class="stat-label">Stable:</span>
        <span class="stat-value stable">{{ stats.stable }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Moderate:</span>
        <span class="stat-value moderate">{{ stats.moderate }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Divergent:</span>
        <span class="stat-value divergent">{{ stats.divergent }}</span>
      </div>
    </div>
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
const stats = ref(null);
const { loadData } = useSharedData();
const { chartConfig } = useResponsiveConfig();
let parallelInstance = null;

const updateStats = () => {
  if (parallelInstance && parallelInstance.getDisagreementStats) {
    stats.value = parallelInstance.getDisagreementStats();
  }
};

// Initialize parallel coordinate on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Create and initialize parallel coordinate instance with responsive config
  parallelInstance = new ParallelCoordinateChart(chartConfig.value);
  parallelInstance.init(chartRef.value, rawData, props.sharedState || {});
  updateStats();
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
    updateStats();
  }
}, { deep: true });

// Watch for shared state changes
watch(() => props.sharedState, (newState) => {
  if (parallelInstance && props.stepState) {
    parallelInstance.update(props.stepState, newState || {});
    updateStats();
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

.stats-panel {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
}

.stat-value {
  font-weight: 700;
  font-size: 1.2rem;
  min-width: 40px;
  display: inline-block;
}

.stat-value.stable {
  color: #4ade80;
}

.stat-value.moderate {
  color: #facc15;
}

.stat-value.divergent {
  color: #ff4757;
}

@media (max-width: 900px) {
  .stats-panel {
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
  }
}
</style>
