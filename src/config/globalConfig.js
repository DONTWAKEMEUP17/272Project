export const globalConfig = {
  dataUrl: '/data/merged_anime_final_v4.csv',
  scrollOffset: 0.6,
  chart: {
    width: 1600,
    height: 700,
    margin: { top: 40, right: 20, bottom: 80, left: 100 }
  }
};

/**
 * 获取响应式图表配置，根据窗口宽度自动调整
 * @param {number} windowWidth - 当前窗口宽度
 * @returns {Object} 响应式图表配置
 */
export const getResponsiveChartConfig = (windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1600) => {
  let config;
  
  if (windowWidth >= 1400) {
    // 大屏桌面：最大化
    config = {
      width: Math.min(windowWidth - 100, 1600),
      height: 800,
      margin: { top: 20, right: 40, bottom: 120, left: 120 }
    };
  } else if (windowWidth >= 1000) {
    // 标准桌面
    config = {
      width: Math.min(windowWidth - 100, 1400),
      height: 750,
      margin: { top: 25, right: 30, bottom: 110, left: 110 }
    };
  } else if (windowWidth >= 768) {
    // 平板
    config = {
      width: Math.min(windowWidth - 60, 900),
      height: 600,
      margin: { top: 20, right: 25, bottom: 100, left: 90 }
    };
  } else if (windowWidth >= 480) {
    // 手机 (Medium)
    config = {
      width: Math.min(windowWidth - 40, 500),
      height: 500,
      margin: { top: 15, right: 20, bottom: 85, left: 70 }
    };
  } else {
    // 超小屏
    config = {
      width: Math.min(windowWidth - 30, 400),
      height: 400,
      margin: { top: 15, right: 15, bottom: 75, left: 60 }
    };
  }
  
  return config;
};
