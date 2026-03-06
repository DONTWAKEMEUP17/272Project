"""
改进版数据清理脚本：更好的跨平台匹配策略
"""

import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import re
import os

# ============ 配置 ============
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data', 'processed')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============ 1. 读取数据 ============
def load_data():
    """读取三个平台的数据"""
    bangumi = pd.read_csv(os.path.join(DATA_DIR, 'bangumi.csv'))
    mal = pd.read_csv(os.path.join(DATA_DIR, 'mal.csv'))
    imdb = pd.read_csv(os.path.join(DATA_DIR, 'imdb_popularity+rating.csv'))
    
    print("=" * 60)
    print("原始数据信息:")
    print(f"  Bangumi: {len(bangumi):4d} 条  | 字段: {list(bangumi.columns)[:4]}")
    print(f"  MAL:     {len(mal):4d} 条  | 字段: {list(mal.columns)[:4]}")
    print(f"  IMDB:    {len(imdb):4d} 条  | 字段: {list(imdb.columns)[:4]}")
    print("=" * 60)
    
    return bangumi, mal, imdb


# ============ 2. Genre 标准化 ============
def extract_genres_from_bangumi_tags(tags_str):
    """
    从Bangumi的tags中提取真正的genre类型
    """
    if pd.isna(tags_str):
        return []
    
    genre_mapping = {
        '战斗': 'Action', '热血': 'Action', '战争': 'Action', '动作': 'Action',
        '冒险': 'Adventure', '剧情': 'Drama', '推理': 'Mystery', '悬疑': 'Suspense',
        '科幻': 'Sci-Fi', 'SF': 'Sci-Fi', '异世界': 'Fantasy', '奇幻': 'Fantasy', '魔法': 'Fantasy',
        '恋爱': 'Romance', '爱情': 'Romance', '纯爱': 'Romance',
        '搞笑': 'Comedy', '日常': 'Slice of Life', '治愈': 'Slice of Life', '治愈系': 'Slice of Life',
        '运动': 'Sports', '竞技': 'Sports', '体育': 'Sports',
        '音乐': 'Music', '励志': 'Inspirational', '心理': 'Psychology', '犯罪': 'Crime',
        '恐怖': 'Horror', '致郁': 'Psychological', '猎奇': 'Psychological',
        '灵异': 'Supernatural', '超自然': 'Supernatural', '怪谈': 'Supernatural',
        '历史': 'Historical', '美食': 'Slice of Life',
    }
    
    tags_list = str(tags_str).split('|')
    genres = []
    
    for tag in tags_list:
        tag = tag.strip()
        if tag in genre_mapping:
            genres.append(genre_mapping[tag])
    
    genres = list(dict.fromkeys(genres))
    return genres


def normalize_for_matching(name):
    """标准化名称用于匹配：去除特殊字符、标点、空格"""
    if pd.isna(name):
        return ""
    
    name = str(name).strip()
    # 保留中文、日文、英文和数字
    name = re.sub(r'[^\w\u4e00-\u9fff\u3040-\u309f]', '', name)
    name = name.lower()
    return name


def extract_keywords(name):
    """
    从番名中提取关键词
    对于"X Season Y"、"X 第Y季"等模式的处理
    """
    if pd.isna(name):
        return set()
    
    name = str(name)
    # 移除季数信息
    name = re.sub(r'(\d+(?:st|nd|rd|th)|Season \d+|第[\d一二三四五六七八九]*季|Part[\d\.]+)', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', '', name)
    
    # 分解成token
    tokens = re.findall(r'\w+|\u4e00-\u9fff+', name, re.UNICODE)
    return set(tokens)


# ============ 3. 改进的匹配逻辑 ============
def match_anime_improved(bangumi, mal, imdb):
    """
    改进的匹配策略：
    1. 优先使用年份作为约束
    2. 使用名称相似度作为辅助
    3. 适当降低要求以增加匹配覆盖率
    """
    
    print("\n开始跨平台匹配（改进版）...")
    
    # 标准化所有名称
    bangumi['norm_name'] = bangumi['name_cn'].fillna(bangumi['name']).apply(normalize_for_matching)
    mal['norm_name'] = mal['title'].apply(normalize_for_matching)
    imdb['norm_name'] = imdb['title'].apply(normalize_for_matching)
    
    matches = []
    matched_bgm_indices = set()
    matched_imdb_indices = set()
    
    for mal_idx, mal_row in mal.iterrows():
        mal_norm = mal_row['norm_name']
        mal_year = mal_row['year']
        mal_title = mal_row['title']
        
        bgm_idx = None
        bgm_score = 0
        imdb_idx = None
        imdb_score = 0
        
        # ===== Bangumi 匹配 =====
        for idx_bgm, bgm_row in bangumi.iterrows():
            if idx_bgm in matched_bgm_indices:  # 一个Bangumi番只能匹配一个MAL
                continue
                
            bgm_norm = bgm_row['norm_name']
            
            # 相似度计算
            score = SequenceMatcher(None, mal_norm, bgm_norm).ratio()
            
            # 年份权重：同年完全匹配，相差1年0.9，相差2年0.7，相差超过2年0.3
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
            
            if score > bgm_score and score > 0.3:  # 降低阈值
                bgm_score = score
                bgm_idx = idx_bgm
        
        # Mark as matched
        if bgm_idx is not None:
            matched_bgm_indices.add(bgm_idx)
        
        # ===== IMDB 匹配 =====
        for idx_imdb, imdb_row in imdb.iterrows():
            if idx_imdb in matched_imdb_indices:
                continue
                
            imdb_norm = imdb_row['norm_name']
            
            score = SequenceMatcher(None, mal_norm, imdb_norm).ratio()
            
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
            
            if score > imdb_score and score > 0.3:
                imdb_score = score
                imdb_idx = idx_imdb
        
        if imdb_idx is not None:
            matched_imdb_indices.add(imdb_idx)
        
        matches.append({
            'mal_idx': mal_idx,
            'mal_title': mal_title,
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
    print(f"  - 平均匹配分数 (Bangumi): {matches_df[matches_df['bgm_idx'].notna()]['bgm_score'].mean():.3f}")
    print(f"  - 平均匹配分数 (IMDB): {matches_df[matches_df['imdb_idx'].notna()]['imdb_score'].mean():.3f}")
    
    return matches_df, bangumi, mal, imdb


# ============ 4. 合并数据 ============
def merge_cross_platform_data(matches_df, bangumi, mal, imdb):
    """合并三个平台的数据"""
    
    merged_rows = []
    
    for idx, match_row in matches_df.iterrows():
        mal_idx = int(match_row['mal_idx'])
        bgm_idx = match_row['bgm_idx']
        imdb_idx = match_row['imdb_idx']
        
        mal_data = mal.iloc[mal_idx]
        bgm_data = bangumi.iloc[int(bgm_idx)] if pd.notna(bgm_idx) else None
        imdb_data = imdb.iloc[int(imdb_idx)] if pd.notna(imdb_idx) else None
        
        # 选择最好的番名（优先中文）
        if bgm_data is not None and pd.notna(bgm_data.get('name_cn')):
            anime_name = bgm_data['name_cn']
        elif bgm_data is not None and pd.notna(bgm_data.get('name')):
            anime_name = bgm_data['name']
        else:
            anime_name = mal_data['title']
        
        year = mal_data['year']
        
        # 合并genres
        genres = []
        
        if pd.notna(mal_data['genres']):
            mal_genres = str(mal_data['genres']).split('|')
            genres.extend(mal_genres)
        
        if bgm_data is not None and pd.notna(bgm_data.get('tags')):
            bgm_genres = extract_genres_from_bangumi_tags(bgm_data['tags'])
            for genre in bgm_genres:
                if genre not in genres:
                    genres.append(genre)
        
        if imdb_data is not None and pd.notna(imdb_data.get('genres')):
            imdb_genres = [g.strip() for g in str(imdb_data['genres']).split('|') 
                          if g.strip() != 'Animation']
            for genre in imdb_genres:
                if genre not in genres:
                    genres.append(genre)
        
        merged_rows.append({
            'anime_name': anime_name,
            'year': year,
            'genres': '|'.join(genres),
            'bgm_score': bgm_data['score'] if bgm_data is not None else None,
            'mal_score': mal_data['score'],
            'imdb_rating': imdb_data['rating'] if imdb_data is not None else None,
            'mal_members': mal_data['members'],
            'mal_url': mal_data['url'],
            'bgm_url': bgm_data['url'] if bgm_data is not None else None,
            'imdb_url': imdb_data['url'] if imdb_data is not None else None,
        })
    
    merged = pd.DataFrame(merged_rows)
    return merged


# ============ 5. 主函数 ============
def main():
    """主流程"""
    
    bangumi, mal, imdb = load_data()
    
    # 匹配和合并
    matches_df, bangumi, mal, imdb = match_anime_improved(bangumi, mal, imdb)
    merged = merge_cross_platform_data(matches_df, bangumi, mal, imdb)
    
    # 保存合并数据
    output_path = os.path.join(OUTPUT_DIR, 'merged_anime_data.csv')
    merged.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n✓ 合并数据已保存: {output_path}")
    
    # 保存匹配信息（用于审查）
    review_path = os.path.join(OUTPUT_DIR, 'matching_review.csv')
    review_df = matches_df[matches_df['bgm_score'] < 0.7]
    if len(review_df) > 0:
        review_df.to_csv(review_path, index=False, encoding='utf-8-sig')
        print(f"⚠ 低置信度匹配 ({len(review_df)} 个) 已保存: {review_path}")
    
    # 显示示例和统计
    print("\n" + "=" * 60)
    print("数据合并完成！示例数据：")
    print("=" * 60)
    print(merged[['anime_name', 'year', 'genres', 'mal_score', 'bgm_score', 'imdb_rating']].head(10).to_string())
    
    print("\n" + "=" * 60)
    print("统计信息：")
    print("=" * 60)
    print(f"总共合并的番: {len(merged)}")
    print(f"有Bangumi评分数据: {merged['bgm_score'].notna().sum()}")
    print(f"有IMDB评分数据: {merged['imdb_rating'].notna().sum()}")
    print(f"有MAL评分数据: {merged['mal_score'].notna().sum()}")
    print(f"有三个平台数据: {((merged['bgm_score'].notna()) & (merged['imdb_rating'].notna()) & (merged['mal_score'].notna())).sum()}")
    
    print("\nGenres 分布:")
    # 统计所有出现的genres
    all_genres = []
    for genres_str in merged['genres']:
        if pd.notna(genres_str):
            all_genres.extend(str(genres_str).split('|'))
    
    from collections import Counter
    genre_counts = Counter(all_genres)
    for genre, count in genre_counts.most_common(15):
        print(f"  {genre:15} : {count:3d} 部")
    
    return merged


if __name__ == "__main__":
    merged_data = main()
