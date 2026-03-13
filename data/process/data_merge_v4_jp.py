"""
数据合并脚本 v4：改进版 - 使用MAL的日文名来匹配Bangumi，增强匹配率
输出格式：
- title (英文名)
- title_jp (日文名)
- title_cn (中文名)
- year
- genre
- mal_score, mal_rank, mal_votes, mal_percentile
- imdb_score, imdb_rank, imdb_votes, imdb_percentile
- bgm_score, bgm_rank, bgm_votes, bgm_percentile
"""

import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import re
import os

# ============ 配置 ============
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
SCRAPE_DIR = os.path.join(os.path.dirname(__file__), '..', 'scrape')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data', 'processed')
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============ 1. 读取数据 ============
def load_data():
    """读取三个平台的数据"""
    bangumi = pd.read_csv(os.path.join(SCRAPE_DIR, 'bangumi', 'bangumi_tv_jp_rank_2000plus.csv'))
    mal = pd.read_csv(os.path.join(SCRAPE_DIR, 'MAL', 'mal_top_tv_2000plus_400_jp.csv'))
    imdb = pd.read_csv(os.path.join(SCRAPE_DIR, 'imdb', 'imdb_popularity+rating.csv'))
    
    print("=" * 70)
    print("原始数据信息:")
    print(f"  Bangumi: {len(bangumi):4d} 条")
    print(f"  MAL:     {len(mal):4d} 条")
    print(f"  IMDB:    {len(imdb):4d} 条")
    print("=" * 70)
    
    return bangumi, mal, imdb


# ============ 2. 名称标准化 ============
def normalize_for_matching(name):
    """标准化名称用于匹配"""
    if pd.isna(name):
        return ""
    
    name = str(name).strip()
    # 去除特殊字符但保留中日英文字符和数字
    name = re.sub(r'[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]', '', name)
    name = name.lower()
    return name


# ============ 3. 匹配逻辑 ============
def match_anime(bangumi, mal, imdb):
    """
    匹配策略：
    1. 用MAL的日文名（title_jp）来匹配Bangumi的日文名（name）
    2. 用MAL的英文名（title）来匹配IMDB的英文名
    3. 一个MAL番只能对应一个Bangumi和一个IMDB
    """
    
    print("\n开始跨平台匹配...")
    
    # 标准化名称
    bangumi['norm_name_jp'] = bangumi['name'].apply(normalize_for_matching)
    bangumi['norm_name_cn'] = bangumi['name_cn'].fillna('').apply(normalize_for_matching)
    
    mal['norm_title_en'] = mal['title'].apply(normalize_for_matching)
    mal['norm_title_jp'] = mal['title_jp'].fillna('').apply(normalize_for_matching)
    
    imdb['norm_name'] = imdb['title'].apply(normalize_for_matching)
    
    matches = []
    matched_bgm_indices = set()
    matched_imdb_indices = set()
    
    for mal_idx, mal_row in mal.iterrows():
        mal_norm_en = mal_row['norm_title_en']
        mal_norm_jp = mal_row['norm_title_jp']
        mal_year = mal_row['year']
        mal_title = mal_row['title']
        mal_title_jp = mal_row['title_jp']
        
        bgm_idx = None
        bgm_score = 0
        imdb_idx = None
        imdb_score = 0
        
        # ===== Bangumi 匹配 (优先使用日文名) =====
        for idx_bgm, bgm_row in bangumi.iterrows():
            if idx_bgm in matched_bgm_indices:
                continue
                
            bgm_norm_jp = bgm_row['norm_name_jp']
            bgm_norm_cn = bgm_row['norm_name_cn']
            
            # 先尝试日文名匹配（权重更高）
            if mal_norm_jp and bgm_norm_jp:
                score = SequenceMatcher(None, mal_norm_jp, bgm_norm_jp).ratio()
                score *= 1.2  # 日文匹配权重提升
            else:
                # 回退到英文或中文名匹配
                score = SequenceMatcher(None, mal_norm_en, bgm_norm_cn).ratio()
            
            # 年份权重
            if pd.notna(bgm_row['year']) and pd.notna(mal_year):
                year_diff = abs(bgm_row['year'] - mal_year)
                if year_diff == 0:
                    score *= 1.0
                elif year_diff == 1:
                    score *= 0.9
                elif year_diff == 2:
                    score *= 0.7
                else:
                    score *= 0.3
            
            if score > bgm_score and score > 0.40:  # 提高阈值以获得更好的匹配
                bgm_score = score
                bgm_idx = idx_bgm
        
        if bgm_idx is not None:
            matched_bgm_indices.add(bgm_idx)
        
        # ===== IMDB 匹配 (使用英文名) =====
        for idx_imdb, imdb_row in imdb.iterrows():
            if idx_imdb in matched_imdb_indices:
                continue
                
            imdb_norm = imdb_row['norm_name']
            score = SequenceMatcher(None, mal_norm_en, imdb_norm).ratio()
            
            if pd.notna(imdb_row['year']) and pd.notna(mal_year):
                year_diff = abs(imdb_row['year'] - mal_year)
                if year_diff == 0:
                    score *= 1.0
                elif year_diff == 1:
                    score *= 0.9
                elif year_diff == 2:
                    score *= 0.7
                else:
                    score *= 0.3
            
            if score > imdb_score and score > 0.35:
                imdb_score = score
                imdb_idx = idx_imdb
        
        if imdb_idx is not None:
            matched_imdb_indices.add(imdb_idx)
        
        matches.append({
            'mal_idx': mal_idx,
            'mal_title': mal_title,
            'mal_title_jp': mal_title_jp,
            'mal_year': mal_year,
            'bgm_idx': bgm_idx,
            'bgm_score': bgm_score,
            'imdb_idx': imdb_idx,
            'imdb_score': imdb_score
        })
    
    matches_df = pd.DataFrame(matches)
    
    print(f"\n✓ 匹配完成")
    print(f"  - 总番数: {len(matches_df)}")
    print(f"  - 与Bangumi匹配: {matches_df['bgm_idx'].notna().sum()} 部")
    print(f"  - 与IMDB匹配: {matches_df['imdb_idx'].notna().sum()} 部")
    
    return matches_df, bangumi, mal, imdb


# ============ 4. 计算Percentile ============
def calculate_percentile(rank, total_count):
    """计算percentile排名"""
    if pd.isna(rank) or pd.isna(total_count):
        return None
    return round((total_count - rank + 1) / total_count * 100, 2)


# ============ 5. 提取和标准化genres ============
def extract_genres(mal_genres_str, bgm_tags_str=None, imdb_genres_str=None):
    """合并来自三个平台的genres"""
    
    genres = []
    
    # MAL genres
    if pd.notna(mal_genres_str):
        mal_genres = [g.strip() for g in str(mal_genres_str).split('|') if g.strip()]
        genres.extend(mal_genres)
    
    # IMDB genres (去掉Animation)
    if pd.notna(imdb_genres_str):
        imdb_genres = [g.strip() for g in str(imdb_genres_str).split('|') 
                       if g.strip() and g.strip() != 'Animation']
        for g in imdb_genres:
            if g not in genres:
                genres.append(g)
    
    # 去重
    genres = list(dict.fromkeys(genres))
    
    return '|'.join(genres)


# ============ 6. 合并数据 ============
def merge_datasets(matches_df, bangumi, mal, imdb):
    """
    以MAL为anchor，合并三个平台的数据
    """
    
    print("\n开始数据合并...")
    
    merged_rows = []
    
    for idx, match_row in matches_df.iterrows():
        mal_idx = int(match_row['mal_idx'])
        bgm_idx = match_row['bgm_idx']
        imdb_idx = match_row['imdb_idx']
        
        mal_data = mal.iloc[mal_idx]
        bgm_data = bangumi.iloc[int(bgm_idx)] if pd.notna(bgm_idx) else None
        imdb_data = imdb.iloc[int(imdb_idx)] if pd.notna(imdb_idx) else None
        
        # 英文标题 (使用MAL的英文名)
        title = mal_data['title']
        
        # 日文标题 (使用MAL的日文名)
        title_jp = mal_data['title_jp'] if pd.notna(mal_data['title_jp']) else ''
        
        # 中文标题 (优先使用Bangumi的中文名，否则为空)
        title_cn = bgm_data['name_cn'] if bgm_data is not None and pd.notna(bgm_data['name_cn']) else ''
        
        # 年份
        year = mal_data['year']
        
        # Genres
        genres = extract_genres(
            mal_data.get('genres'),
            bgm_data.get('tags') if bgm_data is not None else None,
            imdb_data.get('genres') if imdb_data is not None else None
        )
        
        # MAL 数据
        mal_rank = mal_data['rank']
        mal_score = mal_data['score']
        mal_votes = mal_data['scored_by']
        mal_total = len(mal)
        mal_percentile = calculate_percentile(mal_rank, mal_total)
        
        # Bangumi 数据
        if bgm_data is not None:
            bgm_rank = bgm_data['bgm_rank']
            bgm_score = bgm_data['score']
            bgm_votes = bgm_data['votes']
            bgm_total = len(bangumi)
            bgm_percentile = calculate_percentile(bgm_rank, bgm_total)
        else:
            bgm_rank = None
            bgm_score = None
            bgm_votes = None
            bgm_percentile = None
        
        # IMDB 数据
        if imdb_data is not None:
            imdb_rank = imdb_data['rank']
            imdb_score = imdb_data['rating']
            imdb_votes = imdb_data['rating_count']
            imdb_total = len(imdb)
            imdb_percentile = calculate_percentile(imdb_rank, imdb_total)
        else:
            imdb_rank = None
            imdb_score = None
            imdb_votes = None
            imdb_percentile = None
        
        merged_rows.append({
            'title': title,
            'title_jp': title_jp,
            'title_cn': title_cn,
            'year': year,
            'genre': genres,
            
            'mal_score': mal_score,
            'mal_rank': mal_rank,
            'mal_votes': mal_votes,
            'mal_percentile': mal_percentile,
            
            'imdb_score': imdb_score,
            'imdb_rank': imdb_rank,
            'imdb_votes': imdb_votes,
            'imdb_percentile': imdb_percentile,
            
            'bgm_score': bgm_score,
            'bgm_rank': bgm_rank,
            'bgm_votes': bgm_votes,
            'bgm_percentile': bgm_percentile,
        })
    
    merged = pd.DataFrame(merged_rows)
    
    print(f"✓ 合并完成：{len(merged)} 部动画")
    
    return merged


# ============ 7. 计算排名和Percentile ============
def calculate_ranks_and_percentiles(merged):
    """
    在合并的200部动画中，为每个平台计算新的排名和percentile
    """
    
    # MAL排名
    mal_count = merged['mal_score'].notna().sum()
    mal_sorted = merged[merged['mal_score'].notna()].sort_values('mal_score', ascending=False)
    mal_original_indices = mal_sorted.index.values
    mal_ranks = np.arange(1, len(mal_sorted) + 1)
    merged.loc[mal_original_indices, 'mal_rank'] = mal_ranks
    mal_percentiles = ((mal_count - mal_ranks + 1) / mal_count * 100).round(2)
    merged.loc[mal_original_indices, 'mal_percentile'] = mal_percentiles
    
    # IMDB排名
    imdb_count = merged['imdb_score'].notna().sum()
    if imdb_count > 0:
        imdb_sorted = merged[merged['imdb_score'].notna()].sort_values('imdb_score', ascending=False)
        imdb_original_indices = imdb_sorted.index.values
        imdb_ranks = np.arange(1, len(imdb_sorted) + 1)
        merged.loc[imdb_original_indices, 'imdb_rank'] = imdb_ranks
        imdb_percentiles = ((imdb_count - imdb_ranks + 1) / imdb_count * 100).round(2)
        merged.loc[imdb_original_indices, 'imdb_percentile'] = imdb_percentiles
    
    # Bangumi排名
    bgm_count = merged['bgm_score'].notna().sum()
    if bgm_count > 0:
        bgm_sorted = merged[merged['bgm_score'].notna()].sort_values('bgm_score', ascending=False)
        bgm_original_indices = bgm_sorted.index.values
        bgm_ranks = np.arange(1, len(bgm_sorted) + 1)
        merged.loc[bgm_original_indices, 'bgm_rank'] = bgm_ranks
        bgm_percentiles = ((bgm_count - bgm_ranks + 1) / bgm_count * 100).round(2)
        merged.loc[bgm_original_indices, 'bgm_percentile'] = bgm_percentiles
    
    return merged


# ============ 8. 主函数 ============
def main():
    """主流程"""
    
    # 1. 读取数据
    bangumi, mal, imdb = load_data()
    
    # 2. 匹配
    matches_df, bangumi, mal, imdb = match_anime(bangumi, mal, imdb)
    
    # 3. 合并
    merged = merge_datasets(matches_df, bangumi, mal, imdb)
    
    # 4. 重新计算排名和percentile
    merged = calculate_ranks_and_percentiles(merged)
    
    # 5. 保存
    output_file = os.path.join(OUTPUT_DIR, 'merged_anime_final_v4.csv')
    merged.to_csv(output_file, index=False, encoding='utf-8')
    
    print(f"\n✓ 最终数据保存到: {output_file}")
    print(f"\n最终统计:")
    print(f"  - 总番数: {len(merged)}")
    print(f"  - 有日文名: {(merged['title_jp'] != '').sum()}")
    print(f"  - 有中文名: {(merged['title_cn'] != '').sum()}")
    print(f"  - MAL数据完整: {merged['mal_score'].notna().sum()}")
    print(f"  - IMDB数据完整: {merged['imdb_score'].notna().sum()}")
    print(f"  - Bangumi数据完整: {merged['bgm_score'].notna().sum()}")
    
    print("\n前5行样本:")
    print(merged.head())
    
    return merged


if __name__ == "__main__":
    main()
