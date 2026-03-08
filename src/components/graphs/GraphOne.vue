<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    <div ref="chartRef" class="graph-canvas" />
  </article>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useSharedData } from '../../composables/useSharedData';
import { buildGenreHeatmapData } from '../../utils/dataLoader';
import { drawHeatmap } from '../../utils/d3Chart';

const props = defineProps({
  title: {
    type: String,
    default: 'Genre × Platform Heatmap'
  }
});

const chartRef = ref(null);
const { globalConfig, loadData } = useSharedData();

onMounted(async () => {
  const rawData = await loadData();
  const heatmapData = buildGenreHeatmapData(rawData);
  drawHeatmap(chartRef.value, heatmapData, globalConfig.chart);
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
  min-height: 400px;
}
</style>
