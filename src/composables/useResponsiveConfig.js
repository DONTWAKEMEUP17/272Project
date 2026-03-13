import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { getResponsiveChartConfig } from '../config/globalConfig';

/**
 * 响应式图表配置钩子
 * 监听窗口大小变化，自动返回适应当前屏幕的图表配置
 * 
 * @returns {Object} {
 *   chartConfig: Ref<Object>, // 当前的响应式图表配置
 *   isSmallScreen: Computed<boolean>, // 是否小屏幕 (< 768px)
 *   isMediumScreen: Computed<boolean>, // 是否中等屏幕 (768-1000px)
 *   isLargeScreen: Computed<boolean>, // 是否大屏幕 (>= 1000px)
 *   windowWidth: Ref<number> // 当前窗口宽度
 * }
 */
export function useResponsiveConfig() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1600);
  const chartConfig = ref(getResponsiveChartConfig(windowWidth.value));

  // 屏幕大小判断
  const isSmallScreen = computed(() => windowWidth.value < 768);
  const isMediumScreen = computed(() => windowWidth.value >= 768 && windowWidth.value < 1000);
  const isLargeScreen = computed(() => windowWidth.value >= 1000);

  // 防抖处理窗口大小变化
  let resizeTimeout = null;
  const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      windowWidth.value = window.innerWidth;
      chartConfig.value = getResponsiveChartConfig(windowWidth.value);
    }, 300);
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimeout) clearTimeout(resizeTimeout);
  });

  return {
    chartConfig,
    windowWidth,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen
  };
}
