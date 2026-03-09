<template>
  <main class="app-shell">
    <header class="app-header">
      <h1>Anime Data Scrollytelling (Course Project)</h1>
      <p>Sticky chart + scrolling narrative text (Scrollama sticky overlay pattern).</p>
      <p v-if="globalState.activeStep !== null">Active step: {{ globalState.activeStep + 1 }}</p>
    </header>

    <section class="scrolly-layout">
      <aside class="sticky-panel">
        <div class="chart-stack" aria-live="polite">
          <div
            v-for="(graph, index) in graphComponents"
            :key="graph.key"
            class="chart-layer"
            :style="getChartLayerStyle(index, activeStep, stepProgress, graphComponents.length)"
            :aria-hidden="index !== activeStep"
          >
            <component :is="graph.component" />
          </div>
        </div>
      </aside>

      <section class="story-panel" aria-label="Scrollytelling steps">
        <article
          v-for="(step, index) in steps"
          :key="step.id"
          class="story-step step"
          :class="{ 'is-active': index === activeStep }"
          :data-step="index"
        >
          <h2>{{ step.title }}</h2>
          <p>{{ step.body }}</p>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup>
import { inject, ref } from 'vue';
import GraphOne from './components/graphs/GraphOne.vue';
import GraphTwo from './components/graphs/GraphTwo.vue';
import GraphThree from './components/graphs/GraphThree.vue';
import GraphFour from './components/graphs/GraphFour.vue';
import GraphFive from './components/graphs/GraphFive.vue';
import { useScrollama } from './composables/useScrollama';
import { getChartLayerStyle } from './utils/chartTransition';

const globalConfig = inject('globalConfig');
const globalState = inject('globalState');

// Placeholder story copy for each chart panel.
const steps = [
  {
    id: 'step-1',
    title: 'Step 1 · Entry Point',
    body: 'This placeholder paragraph introduces the first chart. As you continue scrolling, the narrative text keeps moving while the chart area remains sticky.'
  },
  {
    id: 'step-2',
    title: 'Step 2 · Comparison',
    body: 'Use this section to explain a second perspective in your dataset. The background chart crossfades into the next graph when this step becomes active.'
  },
  {
    id: 'step-3',
    title: 'Step 3 · Pattern',
    body: 'This text block can highlight an emerging pattern and prepare the viewer for another visual transition in the sticky chart container.'
  },
  {
    id: 'step-4',
    title: 'Step 4 · Outlier',
    body: 'Describe outliers, anomalies, or a key turning point here. The sticky overlay keeps the chart fixed, creating a clean scrollytelling rhythm.'
  },
  {
    id: 'step-5',
    title: 'Step 5 · Closing',
    body: 'Conclude the narrative in the final step. You can replace this copy with your real story and keep the same Scrollama-driven interaction.'
  }
];

const graphComponents = [
  { key: 'graph-1', component: GraphOne },
  { key: 'graph-2', component: GraphTwo },
  { key: 'graph-3', component: GraphThree },
  { key: 'graph-4', component: GraphFour },
  { key: 'graph-5', component: GraphFive }
];

const activeStep = ref(0);
const stepProgress = ref(0);

globalState.activeStep = activeStep.value;

useScrollama({
  stepSelector: '.story-step',
  offset: globalConfig.scrollOffset,
  progress: true,
  onStepEnter: ({ index }) => {
    activeStep.value = index;
    stepProgress.value = 0;
    globalState.activeStep = index;
  },
  onStepProgress: ({ index, progress }) => {
    // Keep transition progress tied only to the currently active step.
    if (index === activeStep.value) {
      stepProgress.value = progress;
    }
  }
});
</script>
