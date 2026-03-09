import csv
import json
import re
import time
from urllib.parse import urlencode, urljoin

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE = "https://www.imdb.com"
SEARCH_PATH = "/search/title/"

COMMON_PARAMS = {
    "title_type": "tv_series,tv_miniseries",
    "release_date": "2000-01-01,",
    "count": "100",
    "interests": "in0000027",  # anime interest
}

SORTS = {
    "popularity": "moviemeter,asc",
    "user_rating": "user_rating,desc",
}


def build_search_url(sort_value: str, start: int) -> str:
    params = dict(COMMON_PARAMS)
    params["sort"] = sort_value
    params["start"] = str(start)
    return f"{BASE}{SEARCH_PATH}?{urlencode(params)}"


def make_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    options.add_argument("--disable-gpu")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(30)
    return driver


def extract_title_links_from_search_html(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links = []
    for a in soup.select("a[href^='/title/tt']"):
        href = a.get("href")
        if not href:
            continue
        m = re.search(r"^(/title/tt\d+)", href)
        if m:
            links.append(m.group(1) + "/")
    # 去重但保序
    seen = set()
    out = []
    for x in links:
        if x not in seen:
            seen.add(x)
            out.append(urljoin(BASE, x))
    return out


def parse_genres_from_title_html(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.get_text(strip=True))
        except Exception:
            continue
        candidates = data if isinstance(data, list) else [data]
        for obj in candidates:
            if isinstance(obj, dict) and "genre" in obj:
                genre = obj["genre"]
                if isinstance(genre, list):
                    return [str(g).strip() for g in genre if str(g).strip()]
                if isinstance(genre, str) and genre.strip():
                    return [genre.strip()]
    return []


def get_title_name_and_rating_from_title_html(html: str):
    soup = BeautifulSoup(html, "lxml")
    name = None
    rating = None
    rating_count = None
    year = None
    
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.get_text(strip=True))
        except Exception:
            continue
        candidates = data if isinstance(data, list) else [data]
        for obj in candidates:
            if not isinstance(obj, dict):
                continue
            if not name and isinstance(obj.get("name"), str):
                name = obj["name"].strip()
            
            # 获取发布年份
            if not year:
                if "datePublished" in obj:
                    date_str = obj.get("datePublished", "")
                    if isinstance(date_str, str) and len(date_str) >= 4:
                        year = date_str[:4]  # 取前 4 位作为年份
            
            # 获取评分和评分人数
            ar = obj.get("aggregateRating")
            if ar and isinstance(ar, dict):
                if not rating and "ratingValue" in ar:
                    rating = str(ar["ratingValue"]).strip()
                if not rating_count and "ratingCount" in ar:
                    rating_count = str(ar["ratingCount"]).strip()
        
        if name or rating or year:
            break
    
    return name, rating, rating_count, year


def scrape_top200_for_sort(driver, sort_key: str):
    sort_value = SORTS[sort_key]
    urls = [build_search_url(sort_value, 1), build_search_url(sort_value, 101)]

    all_title_urls = []
    for page_idx, u in enumerate(urls, 1):
        try:
            print(f"\n获取列表页 {page_idx}...", flush=True)
            driver.get(u)
        except Exception as e:
            print(f"列表页加载超时，跳过: {str(e)[:50]}", flush=True)
            continue

        try:
            WebDriverWait(driver, 20).until(
                lambda d: len(d.find_elements(By.CSS_SELECTOR, "a[href^='/title/tt']")) > 0
            )
        except Exception:
            print(f"未找到标题链接，跳过", flush=True)
            continue

        html = driver.page_source
        extracted_urls = extract_title_links_from_search_html(html)
        print(f"提取了 {len(extracted_urls)} 个标题", flush=True)
        all_title_urls.extend(extracted_urls)
        time.sleep(1.5)

    if not all_title_urls:
        print("总共没有提取到任何 URL", flush=True)
        return []

    all_title_urls = all_title_urls[:200]  # 取完整的 200 条

    rows = []
    print(f"\n开始处理 {len(all_title_urls)} 个标题...", flush=True)

    for idx, turl in enumerate(all_title_urls, start=1):
        success = False
        for retry in range(2):  # 最多重试 1 次（总共尝试 2 次）
            try:
                driver.get(turl)
                
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "script[type='application/ld+json']"))
                    )
                except Exception:
                    if retry == 0:
                        print(f"  [{idx}] 重试...", flush=True)
                        time.sleep(1)
                        continue
                    else:
                        print(f"  [{idx}] 跳过 (无 JSON-LD)", flush=True)
                        break

                html = driver.page_source
                name, rating, rating_count, year = get_title_name_and_rating_from_title_html(html)
                genres = parse_genres_from_title_html(html)

                rows.append({
                    "sort": sort_key,
                    "rank": idx,
                    "title": name or "",
                    "rating": rating or "",
                    "rating_count": rating_count or "",
                    "year": year or "",
                    "url": turl,
                    "genres": "|".join(genres),
                })

                if idx % 5 == 0:
                    print(f"  [{idx}] ✓ {name or ''}", flush=True)

                success = True
                time.sleep(0.5)
                break  # 成功就退出重试循环
                
            except Exception as e:
                if retry == 0:
                    print(f"  [{idx}] 第1次失败，重试...", flush=True)
                    time.sleep(1)
                else:
                    print(f"  [{idx}] 错误: {str(e)[:40]}", flush=True)
                    time.sleep(0.5)

    print(f"\n'{sort_key}' 完成: {len(rows)} 行", flush=True)
    return rows


def main():
    driver = make_driver(headless=False)
    try:
        all_rows = []
        for sort_key in ["popularity", "user_rating"]:
            print(f"\n========== 处理 {sort_key} ==========", flush=True)
            rows = scrape_top200_for_sort(driver, sort_key)
            all_rows.extend(rows)
            time.sleep(1)

        with open("imdb_anime_top200_genres.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=["sort", "rank", "title", "rating", "rating_count", "year", "url", "genres"]
            )
            writer.writeheader()
            writer.writerows(all_rows)

        print(f"\n✓ 完成! 保存了 {len(all_rows)} 行到 imdb_anime_top200_genres.csv", flush=True)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
