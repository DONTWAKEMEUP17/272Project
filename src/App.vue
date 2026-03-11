<template>
  <main class="app-shell">
    <header class="app-header">
      <h1>Anime Universe</h1>
      <p class="tagline">Exploring the Story Behind Anime Data · Understanding Trends Through Interactive Visualization</p>
      <p class="subtitle" v-if="globalState.activeStep !== null">
        <span class="step-indicator">Step {{ globalState.activeStep + 1 }}</span>
      </p>
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
    title: '🎬 Entry: The Breadth of the Anime World',
    body: 'Countless new anime productions emerge every year, forming a vast creative ecosystem. This visualization showcases the distribution of different anime genres, from action-packed adventures to healing slice-of-life. The diversity is remarkable. As you scroll down, we\'ll explore the stories hidden behind the data.'
  },
  {
    id: 'step-2',
    title: '📊 Comparison: The Relation Between Ratings and Popularity',
    body: 'Interestingly, an anime\'s popularity and its rating don\'t always correlate. Some niche masterpieces achieve exceptional ratings, while some big-budget productions may experience rating fluctuations due to content controversy. This finding challenges the common assumption that \'popular equals excellent.\'.'
  },
  {
    id: 'step-3',
    title: '🔍 Pattern: The Evolution of Time and Quality',
    body: 'With technological advances and improved production techniques, recent anime has shown a rising trend in overall quality. The emergence of streaming platforms has also transformed how anime is produced and distributed, providing creators more innovative opportunities. This evolution reflects healthy industry growth.'
  },
  {
    id: 'step-4',
    title: '⭐ Outliers: Those Exceptional Creations',
    body: 'Every dataset has outliers, and anime data is no exception. Some works stand out for their innovative storytelling, while others gain fame for their cross-cultural impact. These outliers often represent breakthrough moments and new directions for the industry.'
  },
  {
    id: 'step-5',
    title: '🎯 Conclusion: Insights Beyond the Data',
    body: 'Through this visualization journey, we\'ve not only seen charts and statistics, but built a bridge connecting data with stories, algorithms with emotions. Anime, as a cultural form, transcends pure data analysis and represents the infinite possibilities of human creativity.'
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

<style scoped>
.app-header .tagline {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  opacity: 0.95;
}

.app-header .subtitle {
  margin-top: 1rem;
  font-size: 0.95rem;
}

.step-indicator {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}
</style>
