export const globalConfig = {
  dataUrl: '/data/merged_anime_final_v4.csv',
  scrollOffset: 0.6,
  chart: {
    width: 1600,
    height: 700,
    margin: { top: 40, right: 20, bottom: 80, left: 100 }
  },
  // 赛博朋克2077配色方案
  cyberpunkPalette: {
    primary: '#FF006E',      // 霓虹粉红
    primaryLight: '#FF4D94', // 浅粉红
    primary2: '#FF1493',     // 深粉红
    primary_soft: '#C20052', // 柔和粉红
    accent: '#00D9FF',       // 霓虹青蓝
    accentLight: '#4DD9FF',  // 浅青蓝
    accent2: '#00FFFF',      // 纯青蓝
    accent_soft: '#00B8D4',  // 柔和青蓝
    success: '#39FF14',      // 霓虹绿
    success_soft: '#2ACC2C', // 柔和绿
    warning: '#FFFF00',      // 霓虹黄
    warning_soft: '#E6D909', // 柔和黄
    danger: '#FF0000',       // 霓虹红
    // 热力图专用柔和配色
    heatmap: {
      low: '#1a0a33',        // 深紫
      mid: '#4a148c',        // 中紫蓝
      high: '#00D9FF'        // 青蓝
    },
    platform: {
      mal: '#FF006E',        // MAL - 粉红
      imdb: '#00D9FF',       // IMDb - 青蓝
      bgm: '#39FF14'         // Bangumi - 绿色
    },
    backgrounds: {
      dark: '#0a0e27',       // 深黑背景
      darker: '#000000',     // 纯黑
      grid: '#1a2050'        // 网格线颜色
    },
    text: {
      primary: '#e0e0ff',    // 紫蓝文字
      secondary: '#a0a0ff'   // 浅紫文字
    }
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
      width: Math.min(windowWidth - 100, 660),
      height: 330,
      margin: { top: 44, right: 22, bottom: 55, left: 67 }
    };
  } else if (windowWidth >= 1000) {
    // 标准桌面
    config = {
      width: Math.min(windowWidth - 100, 579),
      height: 303,
      margin: { top: 50, right: 16, bottom: 50, left: 61 }
    };
  } else if (windowWidth >= 768) {
    // 平板
    config = {
      width: Math.min(windowWidth - 60, 413),
      height: 287,
      margin: { top: 38, right: 14, bottom: 47, left: 50 }
    };
  } else if (windowWidth >= 480) {
    // 手机 (Medium)
    config = {
      width: Math.min(windowWidth - 40, 231),
      height: 248,
      margin: { top: 30, right: 11, bottom: 41, left: 38 }
    };
  } else {
    // 超小屏
    config = {
      width: Math.min(windowWidth - 30, 193),
      height: 209,
      margin: { top: 24, right: 8, bottom: 36, left: 33 }
    };
  }
  
  return config;
};

/**
 * 获取基于容器尺寸的响应式图表配置。
 * 适用于分屏/侧边栏布局，避免只按 window.innerWidth 计算导致图表拥挤。
 * @param {number} containerWidth - 图表容器可用宽度
 * @param {number} containerHeight - 图表容器可用高度
 * @returns {Object} 响应式图表配置
 */
export const getContainerResponsiveChartConfig = (containerWidth, containerHeight = 0) => {
  const safeWidth = Math.max(320, containerWidth || (typeof window !== 'undefined' ? window.innerWidth : 1600));
  const safeHeight = Math.max(0, containerHeight || 0);

  let config;

  if (safeWidth >= 1400) {
    config = {
      width: Math.min(safeWidth, 660),
      height: 330,
      margin: { top: 44, right: 22, bottom: 55, left: 67 }
    };
  } else if (safeWidth >= 1000) {
    config = {
      width: Math.min(safeWidth, 579),
      height: 303,
      margin: { top: 44, right: 16, bottom: 47, left: 58 }
    };
  } else if (safeWidth >= 768) {
    config = {
      width: safeWidth,
      height: 287,
      margin: { top: 36, right: 13, bottom: 44, left: 47 }
    };
  } else if (safeWidth >= 480) {
    config = {
      width: safeWidth,
      height: 248,
      margin: { top: 28, right: 10, bottom: 38, left: 38 }
    };
  } else {
    config = {
      width: safeWidth,
      height: 209,
      margin: { top: 22, right: 7, bottom: 33, left: 31 }
    };
  }

  if (safeHeight > 0) {
    const boundedHeight = Math.max(360, Math.min(config.height, safeHeight - 16));
    config.height = boundedHeight;
  }

  return config;
};
