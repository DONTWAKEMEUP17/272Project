<template>
  <main class="app-shell">
    <header class="app-header">
      <h1>Anime Data Scrollytelling (Course Project)</h1>
      <p>Vue + D3 + Scrollama scaffold with 5 graph modules.</p>
      <p v-if="globalState.activeStep !== null">Active step: {{ globalState.activeStep + 1 }}</p>
    </header>

    <section class="graph-grid">
      <GraphOne />
      <GraphTwo />
      <GraphThree />
      <GraphFour />
      <GraphFive />
    </section>
  </main>
</template>

<script setup>
import { inject } from 'vue';
import GraphOne from './components/graphs/GraphOne.vue';
import GraphTwo from './components/graphs/GraphTwo.vue';
import GraphThree from './components/graphs/GraphThree.vue';
import GraphFour from './components/graphs/GraphFour.vue';
import GraphFive from './components/graphs/GraphFive.vue';
import { useScrollama } from './composables/useScrollama';

const globalConfig = inject('globalConfig');
const globalState = inject('globalState');

useScrollama({
  stepSelector: '.step',
  offset: globalConfig.scrollOffset,
  onStepEnter: ({ index }) => {
    globalState.activeStep = index;
  }
});
</script>
