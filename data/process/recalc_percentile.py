"""
重新计算 percentile 脚本
percentile = ((total_count - rank + 1) / total_count) * 100
其中 total_count 是该平台有评分的番数
"""

import pandas as pd
import numpy as np
import os

def recalculate_percentiles(csv_path):
    """
    重新计算所有 percentile
    """
    df = pd.read_csv(csv_path, encoding='utf-8')
    
    print(f"读取数据: {len(df)} 部动画")
    
    # ========== MAL percentile ==========
    mal_data = df[df['mal_score'].notna()].copy()
    mal_total = len(mal_data)
    print(f"\nMAL: {mal_total} 部有评分")
    
    mal_ranks = mal_data['mal_rank'].values.astype(int)
    mal_percentiles = ((mal_total - mal_ranks + 1) / mal_total * 100).round(2)
    
    df.loc[mal_data.index, 'mal_percentile'] = mal_percentiles
    
    # ========== IMDB percentile ==========
    imdb_data = df[df['imdb_score'].notna()].copy()
    imdb_total = len(imdb_data)
    print(f"IMDB: {imdb_total} 部有评分")
    
    imdb_ranks = imdb_data['imdb_rank'].values.astype(int)
    imdb_percentiles = ((imdb_total - imdb_ranks + 1) / imdb_total * 100).round(2)
    
    df.loc[imdb_data.index, 'imdb_percentile'] = imdb_percentiles
    
    # ========== Bangumi percentile ==========
    bgm_data = df[df['bgm_score'].notna()].copy()
    bgm_total = len(bgm_data)
    print(f"Bangumi: {bgm_total} 部有评分")
    
    bgm_ranks = bgm_data['bgm_rank'].values.astype(int)
    bgm_percentiles = ((bgm_total - bgm_ranks + 1) / bgm_total * 100).round(2)
    
    df.loc[bgm_data.index, 'bgm_percentile'] = bgm_percentiles
    
    # ========== 保存 ==========
    df.to_csv(csv_path, index=False, encoding='utf-8')
    
    print(f"\n✓ 已重新计算并保存到: {csv_path}")
    
    # 显示样本
    print("\n前10行样本:")
    print(df[['title', 'mal_rank', 'mal_percentile', 'imdb_rank', 'imdb_percentile', 'bgm_rank', 'bgm_percentile']].head(10))
    
    return df


if __name__ == "__main__":
    csv_path = "/Users/dontwakemeup/Desktop/Code/272project/272Project/data/process/merged_anime_final.csv"
    recalculate_percentiles(csv_path)
