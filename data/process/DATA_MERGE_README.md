# 数据合并脚本说明

## 📋 数据结构

最终输出文件：`data/processed/merged_anime_final.csv`

### 列说明

| 列名 | 说明 | 来源 |
|------|------|------|
| `title` | 英文标题 | MAL |
| `year` | 发布年份 | MAL |
| `genre` | 类型（多源聚合） | MAL\|Bangumi\|IMDB |
| `mal_score` | MAL评分 | MAL |
| `mal_rank` | MAL内排名（重new computed） | MAL |
| `mal_votes` | MAL投票数/评分人数 | MAL (scored_by) |
| `mal_percentile` | MAL百分位排名 | 计算 |
| `imdb_score` | IMDB评分 | IMDB |
| `imdb_rank` | IMDB内排名（重new computed） | IMDB |
| `imdb_votes` | IMDB投票数/评分人数 | IMDB |
| `imdb_percentile` | IMDB百分位排名 | 计算 |
| `bgm_score` | Bangumi评分 | Bangumi |
| `bgm_rank` | Bangumi内排名（重new computed） | Bangumi |
| `bgm_votes` | Bangumi投票数 | Bangumi |
| `bgm_percentile` | Bangumi百分位排名 | 计算 |

## 📊 数据统计（当前）

- **总动画数**: 200 部（以MAL为基）
- **Bangumi匹配**: 25 部 (12.5%)
- **IMDB匹配**: 150 部 (75%)
- **三平台数据完整**: 21 部 (10.5%)

### 评分范围
- **MAL**: 8.26 - 9.28 (平均: 8.54)
- **IMDB**: 6.20 - 9.10 (平均: 8.42)
- **Bangumi**: 7.20 - 9.20 (平均: 7.91)

### 投票数范围
- **MAL**: 3,260 - 3,034,485
- **IMDB**: 19 - 691,912
- **Bangumi**: 5,250 - 30,021

## 🔧 使用方法

### 从命令行运行

```bash
python data_merge_v3.py
```

### 脚本工作流程

1. **加载数据**: 从三个源加载数据
   - `data/bangumi.csv` (329条)
   - `data/mal.csv` (200条)
   - `imdb/imdb_top200_popularity+rating.csv` (392条)

2. **名称标准化**: 将所有标题标准化用于匹配
   - 去除特殊字符
   - 保留中日英文文字和数字
   - 小写转换

3. **跨平台匹配**:
   - 使用名称相似度 (SequenceMatcher)
   - 使用年份作为权重约束
   - 相同年份: 100%权重
   - 相差1年: 90%权重
   - 相差2年: 70%权重
   - 超过2年: 30%权重
   - 匹配阈值: 0.35

4. **数据合并**:
   - 以MAL为anchor（基础数据集）
   - 为每个平台保留原始评分和投票数
   - 合并genres信息

5. **排名和百分位计算**:
   - 在合并的200部动画中重新计算排名
   - 百分位 = ((总数 - 排名 + 1) / 总数) * 100
   - 排名1 = 100百分位, 排名最后 ≈ 0.5百分位

6. **输出**:
   - 保存到 `data/processed/merged_anime_final.csv`

## 🔍 目前的匹配问题和改进建议

### Bangumi匹配低的原因:
1. **名称差异大**: Bangumi使用日文/中文名字，MAL使用英文名字
2. **匹配算法限制**: 需要在MAL和Bangumi之间找到相似性
3. **数据源**: 当前的Bangumi数据(329条)可能不完全包含所有热门番

### 改进建议:
1. 使用更多新爬的Bangumi数据（目前使用的是data/bangumi.csv）
2. 降低匹配阈值（目前是0.35，可以试试0.30）
3. 使用外部匹配表或API（AniDB等）
4. 手动验证和修正低置信度的匹配

## 📝 输出示例

```csv
title,year,genre,mal_score,mal_rank,mal_votes,mal_percentile,imdb_score,imdb_rank,imdb_votes,imdb_percentile,bgm_score,bgm_rank,bgm_votes,bgm_percentile
Sousou no Frieren,2023,Adventure|Drama|Fantasy|Comedy,9.28,1.0,817072,100.0,8.9,1.0,67529.0,100.0,,1.0,,100.0
Steins;Gate,2011,Drama|Sci-Fi|Suspense|Comedy,9.07,4.0,1506218,98.5,8.8,4.0,90568.0,98.0,,4.0,,88.0
Clannad: After Story,2008,Drama|Romance|Crime,8.93,18,695805,91.5,8.9,6.0,468861.0,98.72,9.2,2.0,30021.0,99.7
```

## 🔗 数据源

- **MAL**: `data/mal.csv`
- **Bangumi**: `data/bangumi.csv`
- **IMDB**: `imdb/imdb_top200_popularity+rating.csv`

## ⚙️ 修改脚本配置

编辑 `data_merge_v3.py` 中的匹配阈值：

```python
# 行 ~130-140
if score > bgm_score and score > 0.35:  # 调整这个数字
```

降低阈值可以增加匹配数，但可能降低准确性。

## 📌 注意事项

1. **percentile计算**: 基于当前合并的200部动画，不是原始平台的全部数据
2. **投票数**: 
   - MAL使用 `scored_by`（评分人数）
   - IMDB使用 `rating_count`（评分人数）
   - Bangumi使用 `votes`（投票数）
3. **缺失数据**: 用空字符串表示，可根据需要填充或删除
4. **类型合并**: 自动去重并合并来自三个平台的类型信息
