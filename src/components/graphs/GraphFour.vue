<template>
  <article class="graph-card step">
    <h2 class="graph-title">{{ title }}</h2>
    
    <!-- Genre Selection -->
    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchGenre" 
          type="text" 
          placeholder="Search or enter genre names (separate with commas)"
          @keyup.enter="handleGenreFilter"
          class="search-input"
        />
        <button @click="handleGenreFilter" class="search-btn">Filter</button>
        <button @click="clearFilter" class="clear-btn">Show All</button>
      </div>
      
      <div v-if="availableGenres.length > 0" class="suggested-genres">
        <span class="label">Popular Genres:</span>
        <button 
          v-for="genre in availableGenres.slice(0, 10)" 
          :key="genre"
          @click="addGenreToSelection(genre)"
          class="genre-tag"
        >
          {{ genre }}
        </button>
      </div>
      
      <div v-if="selectedGenres.length > 0" class="selected-genres">
        <span class="label">Selected:</span>
        <div v-for="genre in selectedGenres" :key="genre" class="selected-tag">
          {{ genre }}
          <button @click="removeGenre(genre)">✕</button>
        </div>
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

const handleGenreFilter = () => {
  const input = searchGenre.value.trim();
  if (input) {
    const genres = input.split(',').map(g => g.trim()).filter(g => g);
    selectedGenres.value = genres;
    if (radarInstance) {
      radarInstance.filterByGenres(genres);
    }
    searchGenre.value = '';
  }
};

const addGenreToSelection = (genre) => {
  if (!selectedGenres.value.includes(genre)) {
    selectedGenres.value.push(genre);
    if (radarInstance) {
      radarInstance.filterByGenres(selectedGenres.value);
    }
  }
};

const removeGenre = (genre) => {
  selectedGenres.value = selectedGenres.value.filter(g => g !== genre);
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

.suggested-genres {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}

.label {
  font-weight: bold;
  color: #666;
  margin-right: 0.2rem;
  font-size: 0.8rem;
}

.genre-tag {
  padding: 0.2rem 0.5rem;
  background: white;
  border: 1px solid #00D9FF;
  color: #00D9FF;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s;
}

.genre-tag:hover {
  background: #00D9FF;
  color: white;
}

.selected-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.5rem;
  background: #00D9FF;
  color: #000;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.8rem;
}

.selected-tag button {
  background: none;
  border: none;
  color: #000;
  cursor: pointer;
  font-weight: bold;
  padding: 0;
}

.graph-canvas {
  width: 100%;
  height: auto;
}
</style>
