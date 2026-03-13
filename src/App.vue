<template>
  <main class="app-shell">
    <header class="app-header">
      <h1>Do different communities systematically favor different genres?</h1>
      <p class="tagline">Anime is discussed and rated by communities across many online platforms, each with its own audience and cultural context. </p>
      <p class="tagline"> But do these communities have distinct preferences?</p>
      <p class="tagline">In this project, we compare anime ratings from three major platforms: <a href="https://myanimelist.net/" target="_blank" class="platform-link">MyAnimeList</a>, <a href="https://www.imdb.com/" target="_blank" class="platform-link">IMDb</a>, and <a href="https://bgm.tv/" target="_blank" class="platform-link">Bangumi</a>. Rather than simply asking which platform gives higher scores, we investigate a deeper question: do different communities systematically favor different genres?</p>
      <p class="subtitle" v-if="globalState.activeStep !== null">
        <!-- <span class="step-indicator">Step {{ globalState.activeStep + 1 }}</span> -->
      </p>
      <p class="hint-text">💡 <strong>Tip:</strong> Click on the <u>underlined text</u> to highlight corresponding elements in the chart</p>
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
          <p v-if="step.bodyHtml" v-html="step.body" @click="handleHighlightClick" class="story-content"></p>
          <p v-else class="story-content">{{ step.body }}</p>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup>
import { inject, ref, provide } from 'vue';
import GraphOne from './components/graphs/GraphOne.vue';
import GraphTwo from './components/graphs/GraphTwo.vue';
import GraphThree from './components/graphs/GraphThree.vue';
import GraphFour from './components/graphs/GraphFour.vue';
import GraphFive from './components/graphs/GraphFive.vue';
import { useScrollama } from './composables/useScrollama';
import { getChartLayerStyle } from './utils/chartTransition';

const globalConfig = inject('globalConfig');
const globalState = inject('globalState');

// 高亮状态管理
const highlightState = ref({
  type: null, // 'genre', 'anime', 'platform', etc.
  value: null, // 具体的高亮值
  intensity: 0 // 0-1, 高亮强度
});

// 提供高亮状态给子组件
provide('highlightState', highlightState);

// Placeholder story copy for each chart panel.
const steps = [
  {
    id: 'step-1',
    title: '🎬 Are rating patterns consistent across genres and platforms?',
    body: `(*Hover over the cells, you can see more details.) \n The heatmap is your first clue. We use percentiles instead of raw ratings to normalize across platforms that use different rating scales. \n We can see that <span class="interactive-text" data-highlight-type="genre" data-highlight-value="Thriller,Avant Garde,Boys Love,Crime,Family,Sci-Fi, History, Sport">different communities do have different genre preferences</span>. 
    \n The takeaway: The answer to our central question is right here: no, rating patterns are NOT consistent.`,
    bodyHtml: true
  },
  {
    id: 'step-2',
    title: '📊 How do individual anime titles distribute within each platform\'s rating ecosystem?',
    body: ` Now let's zoom in. Each dot is a real anime. Red, Blue, Green —each color represents a platform. Dot size indicates vote count. You may notice that the MyAnimeList swarm contains many larger circles, while Bangumi and IMDb tend to have smaller ones. \n Hover over a title you recognize. See how it bounces between ranks depending on the community? 
    \n Key insight1: <span class="interactive-text" data-highlight-type="anime" data-highlight-value="Shingeki no Kyojin Season 3 Part 2">individual titles don't occupy the same "rank space" across communities</span>. A hit on MyAnimeList might be middling on IMDb.  
    \n Key insight2: <span class="interactive-text" data-highlight-type="anime" data-highlight-value="Kimetsu no Yaiba">popularity doesn't guarantee agreement</span>. Some of the most popular anime are rated very differently across platforms, showing that even widely watched titles can be divisive. 
    \n Key insight3: <span class="interactive-text" data-highlight-type="anime" data-highlight-value="Gin no Saji 2nd Season">Community size shapes ratings, but audience preference shapes participation.</span> While MAL often shows the highest participation overall, there are still individual titles where IMDb collects even more votes than MAL. Some anime thrive within specialized fandom communities, while others spread more widely across general media audiences.
    \n The takeaway: the anime world isn't a single hierarchy. `, 
    bodyHtml: true
  },
  {
    id: 'step-3',
    title: '🔍 Does popularity influence rating stability across communities?',
    body: `The x-axis is popularity, the y-axis is score, and the color represents stability. Key finding: almost all anime cluster are green (low variance), **regardless of popularity**. 
    \nClick the buttons above to filter by stability: "Stable" (green), "Moderate" (yellow), "Unstable" (red). Notice the unstable zone is nearly empty—just one outlier. 
    \n The takeaway: This reveals the core pattern: communities reach consensus on *how good* a title is, but disagree on *which* genres matter. The 0-10 scale constrains variance, but the deeper truth is that quality judgment is shared—only preference diverges.`,
    bodyHtml: true
  },
  {
    id: 'step-4',
    title: '⭐ Which genres show systematic platform preference?',
    body: `The radar chart is your magnifying glass. Pick a genre and watch the shape transform across platforms. Three axes—one for each community—extending outward from the center.

Look at a <span class="interactive-text" data-highlight-type="radar-shape" data-highlight-value="pointy">jagged, pointy radar with spikes going in different directions</span>? That's disagreement written in geometry. One platform's spike shoots to the top while another stays short. That's a genre where communities truly diverge. Now look at a <span class="interactive-text" data-highlight-type="radar-shape" data-highlight-value="round">smooth, round radar</span>—that's consensus. All three platforms agree this genre is great (or mediocre).

Pick different genres using the filter above. Which ones transform into sharp stars? Those are your flashpoint genres—Romance, Action, Psychological—where communities take polar opposite positions. Try it. The shape reveals truth: some genres are bridges that communities agree on, while others are battlegrounds where taste differs fundamentally.`,
    bodyHtml: true
  },
  {
    id: 'step-5',
    title: '🎯 How do these genre preferences translate into different ranking structures?',
    body: `This is the final reveal. Watch the parallel coordinates. Three vertical lines—one per platform. Lines connecting them represent anime, colored by their stability. <span class="interactive-text" data-highlight-type="line-type" data-highlight-value="stable">Follow a green line as it drifts smoothly across platforms—those communities agree, the anime ranks consistently</span>. Now <span class="interactive-text" data-highlight-type="line-type" data-highlight-value="divergent">trace a red line that zigzags wildly, jumping from top to bottom as it moves right</span>—that anime is a totally different tier depending on who you ask.

Here's the complete story: the genre preferences you discovered earlier—those warm and cool heatmap cells—they cascade down into individual title rankings. When MyAnimeList loves a genre, its anime float higher. When Bangumi favors something else, different titles rise. The lines crossing and diverging aren't random—they're the fingerprint of systematic genre bias.

Step back and see it all together: from macro genre preferences down to micro individual rankings, every layer reveals the same truth. Communities don't just rate differently. They see the anime world through different lenses entirely.`,
    bodyHtml: true
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

// 处理交互式文本的点击
const handleHighlightClick = (event) => {
  if (event.target.classList.contains('interactive-text')) {
    const highlightType = event.target.dataset.highlightType;
    let highlightValue = event.target.dataset.highlightValue;
    
    // 如果值包含逗号，分割成数组
    if (highlightValue && highlightValue.includes(',')) {
      highlightValue = highlightValue.split(',').map(v => v.trim());
    }
    
    // 如果点击的是已经高亮的文本，则取消高亮
    const isSameHighlight = Array.isArray(highlightValue) 
      ? Array.isArray(highlightState.value.value) && 
        JSON.stringify(highlightValue.sort()) === JSON.stringify(highlightState.value.value.sort())
      : highlightState.value.value === highlightValue;
    
    if (highlightState.value.type === highlightType && isSameHighlight) {
      highlightState.value.type = null;
      highlightState.value.value = null;
      highlightState.value.intensity = 0;
      // 清除shared state中的anime高亮
      if (highlightType === 'anime') {
        globalState.highlightAnimeTitle = null;
      }
    } else {
      // 设置新的高亮
      highlightState.value.type = highlightType;
      highlightState.value.value = highlightValue;
      highlightState.value.intensity = 1;
      // 如果是anime类型，传到globalState
      if (highlightType === 'anime') {
        globalState.highlightAnimeTitle = highlightValue;
      }
    }
  }
};
</script>

<style scoped>
.app-header h1 {
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
}

.app-header .tagline {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  opacity: 0.95;
}

.platform-link {
  color: #00D9FF;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.platform-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.app-header .subtitle {
  margin-top: 1rem;
  font-size: 0.95rem;
}

.hint-text {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #00D9FF;
  font-style: italic;
  opacity: 0.9;
}

.step-indicator {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.story-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

<style>
.interactive-text {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  background: rgba(0, 217, 255, 0.1);
  color: #00D9FF;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: #00D9FF;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  border-bottom: none;
}

.interactive-text:hover {
  background: rgba(0, 217, 255, 0.2);
  text-decoration-color: #00D9FF;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 217, 255, 0.2);
}

.interactive-text.active {
  background: rgba(0, 217, 255, 0.3);
  text-decoration-color: #00D9FF;
  box-shadow: 0 0 12px rgba(0, 217, 255, 0.4);
}
</style>
