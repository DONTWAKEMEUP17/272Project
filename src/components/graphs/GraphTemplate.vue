<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    <div ref="chartRef" class="graph-canvas" />
  </article>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useSharedData } from '../../composables/useSharedData';
import { buildRandomBarData } from '../../utils/dataLoader';
import { drawBarChart } from '../../utils/d3Chart';

const props = defineProps({
  title: {
    type: String,
    required: true
  }
});

const chartRef = ref(null);
const { globalConfig, loadData } = useSharedData();

onMounted(async () => {
  const rawData = await loadData();
  const placeholderData = buildRandomBarData(rawData, 8);
  drawBarChart(chartRef.value, placeholderData, globalConfig.chart);
});
</script>
