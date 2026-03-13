# Anime Cross-Community Genre Preference Analysis / 动画跨社区类型偏好分析

> **Question / 核心问题**  
> Do different online communities systematically favor different anime genres?  
> 不同在线社区是否会系统性地偏好不同的动画类型？

A scrollytelling data-visualization project built with **Vue 3 + Vite + D3 + Scrollama**.  
本项目是一个基于 **Vue 3 + Vite + D3 + Scrollama** 的滚动叙事可视化应用。

---

## Table of Contents / 目录

- [Project Overview / 项目概览](#project-overview--项目概览)
- [Features / 功能特性](#features--功能特性)
- [Tech Stack / 技术栈](#tech-stack--技术栈)
- [Data Sources / 数据来源](#data-sources--数据来源)
- [Getting Started / 快速开始](#getting-started--快速开始)
- [Scripts / 命令说明](#scripts--命令说明)
- [Project Structure / 项目结构](#project-structure--项目结构)
- [Visualization Narrative / 叙事流程](#visualization-narrative--叙事流程)
- [Responsive Design Notes / 响应式说明](#responsive-design-notes--响应式说明)
- [Team Workflow Suggestions / 团队协作建议](#team-workflow-suggestions--团队协作建议)

---

## Project Overview / 项目概览

This repository compares anime ratings across three major platforms:

- **MyAnimeList (MAL)**
- **IMDb**
- **Bangumi (BGM)**

Instead of only comparing absolute scores, the project focuses on:

1. Genre-level preference differences (platform affinity)
2. Title-level distribution patterns
3. Popularity vs. cross-platform stability
4. Genre bias profiles
5. Rank divergence behavior

本仓库对比三大平台（MAL、IMDb、Bangumi）对同一批动画的评分模式，不仅关注“谁打分更高”，更关注“不同社区是否偏好不同类型”。可视化叙事包含类型偏好、个体分布、热度与稳定性、类型画像以及排名分歧五个层次。

---

## Features / 功能特性

- Scrollytelling layout with sticky visual stage / 左图固定 + 右文滚动叙事
- Multiple coordinated D3 views / 多图联动的 D3 可视化
- Shared global state for cross-chart interaction / 全局状态实现图间联动
- Genre filtering and hover highlighting / 类型筛选与悬浮高亮
- Responsive behavior for split-screen and common breakpoints / 面向常见断点与分屏场景的响应式适配

---

## Tech Stack / 技术栈

- **Framework**: Vue 3 (Composition API)
- **Bundler**: Vite
- **Visualization**: D3.js
- **Scroll control**: Scrollama
- **Language**: JavaScript (ES Modules)

---

## Data Sources / 数据来源

Main merged dataset:

- `public/data/merged_anime_final_v4.csv`

Additional raw/intermediate data and scripts:

- `data/` (cleaning, scraping, merge scripts, interim CSVs)

> Note / 说明：Data files are partially duplicated under `data/` and `public/data/` for processing vs. frontend serving.

---

## Getting Started / 快速开始

### 1) Install dependencies / 安装依赖

```bash
npm install
```

### 2) Run development server / 启动开发环境

```bash
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).  
然后在浏览器访问 Vite 输出的本地地址（通常是 `http://localhost:5173`）。

### 3) Production build / 生产构建

```bash
npm run build
```

### 4) Preview build / 本地预览构建结果

```bash
npm run preview
```

---

## Scripts / 命令说明

- `npm run dev` — start local dev server / 启动开发服务器
- `npm run build` — create production bundle / 生成生产包
- `npm run preview` — preview production bundle locally / 本地预览生产包

---

## Project Structure / 项目结构

```text
.
├── src/
│   ├── components/graphs/      # GraphOne ~ GraphFive Vue components
│   ├── utils/                  # D3 chart classes and transitions
│   ├── composables/            # shared data, responsive config, scroll hooks
│   ├── config/                 # global config and responsive chart sizing
│   ├── store/                  # global reactive state
│   ├── styles/                 # global CSS
│   └── App.vue                 # scrollytelling shell
├── public/data/                # datasets served to frontend
├── data/                       # data processing and scraping scripts
├── vite.config.js
└── package.json
```

---

## Visualization Narrative / 叙事流程

1. **Heatmap** — Genre × Platform affinity  
   **热力图**：类型与平台偏好关系
2. **Beeswarm** — Distribution of individual anime ratings  
   **蜂群图**：单部作品在平台中的分布
3. **Scatter** — Popularity vs. rating stability  
   **散点图**：热度与跨平台稳定性
4. **Radar Gallery** — Genre bias profiles  
   **雷达图画廊**：类型偏好画像
5. **Parallel Coordinates** — Rank divergence across platforms  
   **平行坐标**：跨平台排名分歧

---

## Responsive Design Notes / 响应式说明

This project targets common desktop/laptop usage and supports split-screen scenarios in Chromium-based browsers.

- Container-aware chart sizing / 图表尺寸基于容器宽高而非仅窗口宽度
- Adaptive chart canvas heights / 图表画布高度采用自适应约束
- Mobile/tablet breakpoints in global and component styles / 全局与组件层面断点控制

Recommendation: when validating responsive behavior, keep browser height at full screen and test widths from narrow split-screen to full window.  
建议在“窗口高度保持全屏”的条件下，从分屏窄宽度到全屏宽度逐步测试。

---

## Team Workflow Suggestions / 团队协作建议

- Keep chart logic in `src/utils/*Chart.js` and UI controls in Vue components.
- Avoid hardcoding pixel dimensions in component styles when possible.
- Prefer container-based resize logic for D3 views.
- Document data processing changes under `data/process/`.

将图表计算逻辑集中在 `utils`，将交互控件保留在 Vue 组件；尽量避免固定像素尺寸，优先使用容器驱动的响应式策略；数据处理变更建议同步记录在 `data/process/`。

---

## License / 许可

No explicit license file is currently provided in this repository. Add a `LICENSE` file if public reuse is intended.  
当前仓库未提供明确许可证。如需公开复用，请补充 `LICENSE` 文件。
