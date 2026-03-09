import { reactive } from 'vue';

export function createGlobalState() {
  return reactive({
    rawData: [],
    isDataLoaded: false,
    activeStep: null
  });
}
