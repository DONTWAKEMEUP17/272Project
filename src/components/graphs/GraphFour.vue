<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    
    <!-- Genre Selection -->
    <div class="controls">
      <div class="all-genres">
        <span class="label">All Genres:</span>
        <button 
          v-for="genre in availableGenres" 
          :key="genre"
          @click="toggleGenreSelection(genre)"
          :class="['genre-button', { selected: selectedGenres.includes(genre) }]"
        >
          {{ genre }}
        </button>
      </div>
      
      <div class="action-buttons">
        <button @click="clearFilter" class="clear-btn">Clear All</button>
      </div>
    </div>

    <div ref="chartRef" class="graph-canvas" />
  </article>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeUnmount, defineExpose } from 'vue';
import { useSharedData } from '../../composables/useSharedData';
import { useResponsiveConfig } from '../../composables/useResponsiveConfig';
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
const { loadData } = useSharedData();
const { chartConfig } = useResponsiveConfig();
let radarInstance = null;

const searchGenre = ref('');
const selectedGenres = ref([]);
const availableGenres = ref([]);

const toggleGenreSelection = (genre) => {
  if (selectedGenres.value.includes(genre)) {
    selectedGenres.value = selectedGenres.value.filter(g => g !== genre);
  } else {
    selectedGenres.value.push(genre);
  }
  
  if (radarInstance) {
    if (selectedGenres.value.length === 0) {
      radarInstance.filterByGenres(null);
    } else {
      radarInstance.filterByGenres(selectedGenres.value);
    }
  }
};

const clearFilter = () => {
  selectedGenres.value = [];
  searchGenre.value = '';
  if (radarInstance) {
    radarInstance.filterByGenres(null);
  }
};

// Initialize radar on mount
onMounted(async () => {
  const rawData = await loadData();
  
  // Get available genres
  const genresSet = new Set();
  rawData.forEach(anime => {
    if (anime.genre) {
      const genres = anime.genre.split('|').map(g => g.trim());
      genres.forEach(g => genresSet.add(g));
    }
  });
  availableGenres.value = Array.from(genresSet).sort();
  
  // Create and initialize radar instance with responsive config
  radarInstance = new RadarChart(chartConfig.value);
  radarInstance.init(chartRef.value, rawData, props.sharedState || {});
});

// Watch for chart config changes (window resize) and update visualization
watch(chartConfig, (newConfig) => {
  if (radarInstance) {
    radarInstance.resize();
  }
}, { deep: true });

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

// Cleanup on unmount
onBeforeUnmount(() => {
  if (radarInstance) {
    radarInstance.destroy();
  }
});

// Expose Component Contract methods
defineExpose({
  init: (container, data, sharedState) => {
    if (!radarInstance) {
      radarInstance = new RadarChart(chartConfig.value);
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
  padding: 0.8rem 1rem 1rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.graph-title {
  margin-bottom: 0.3rem;
  font-size: 1.3rem;
  color: #333;
}

.controls {
  margin-bottom: 0.2rem;
  padding: 0.3rem;
  background: #f5f5f5;
  border-radius: 6px;
}

.search-box {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.search-input {
  flex: 1;
  padding: 0.3rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #00D9FF;
}

.search-btn {
  padding: 0.3rem 0.8rem;
  background: #00D9FF;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
  transition: opacity 0.3s;
}

.search-btn:hover {
  opacity: 0.8;
}

.all-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  margin-bottom: 0.3rem;
}

.label {
  font-weight: bold;
  color: #666;
  margin-right: 0.3rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.genre-button {
  padding: 0.3rem 0.6rem;
  background: white;
  border: 2px solid #ddd;
  color: #333;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s;
}

.genre-button:hover {
  border-color: #00D9FF;
  color: #00D9FF;
}

.genre-button.selected {
  background: #00D9FF;
  border-color: #00D9FF;
  color: #000;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 0.3rem;
  justify-content: flex-end;
}

.clear-btn {
  padding: 0.3rem 0.8rem;
  background: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s;
}

.clear-btn:hover {
  background: #666;
}

.graph-canvas {
  width: 100%;
  height: auto;
}
</style>
