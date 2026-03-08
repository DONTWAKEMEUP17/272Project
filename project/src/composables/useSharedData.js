import { inject } from 'vue';
import { csv } from 'd3';

export function useSharedData() {
  const globalConfig = inject('globalConfig');
  const globalState = inject('globalState');

  const loadData = async () => {
    if (globalState.isDataLoaded) {
      return globalState.rawData;
    }

    const data = await csv(globalConfig.dataUrl);
    globalState.rawData = data;
    globalState.isDataLoaded = true;
    return data;
  };

  return {
    globalConfig,
    globalState,
    loadData
  };
}
