from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
from bs4 import BeautifulSoup

def get_title_name_and_rating_from_title_html(html: str):
    soup = BeautifulSoup(html, "lxml")
    name = None
    rating = None

    # JSON-LD 常带 name / aggregateRating
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
            ar = obj.get("aggregateRating")
            if not rating and isinstance(ar, dict) and "ratingValue" in ar:
                rating = str(ar["ratingValue"]).strip()
        if name or rating:
            break

    return name, rating

def parse_genres_from_title_html(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")

    # 优先：JSON-LD 里通常有 genre 字段（string 或 list）
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.get_text(strip=True))
        except Exception:
            continue

        # 有时是 list（多段 JSON-LD）
        candidates = data if isinstance(data, list) else [data]
        for obj in candidates:
            if isinstance(obj, dict) and "genre" in obj:
                genre = obj["genre"]
                if isinstance(genre, list):
                    return [str(g).strip() for g in genre if str(g).strip()]
                if isinstance(genre, str) and genre.strip():
                    return [genre.strip()]

    return []

# ===== 快速测试 =====
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--window-size=1400,900")
options.add_argument("--disable-gpu")
options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(options=options)

test_urls = [
    "https://www.imdb.com/title/tt2560140/",
    "https://www.imdb.com/title/tt4028590/",
    "https://www.imdb.com/title/tt1355642/",
]

try:
    for idx, url in enumerate(test_urls, 1):
        print(f"\n[{idx}] Testing: {url}")
        driver.get(url)
        
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "script[type='application/ld+json']"))
            )
        except Exception as e:
            print(f"  ✗ Timeout: {e}")
            continue
        
        html = driver.page_source
        name, rating = get_title_name_and_rating_from_title_html(html)
        genres = parse_genres_from_title_html(html)
        
        print(f"  Title: {name}")
        print(f"  Rating: {rating}")
        print(f"  Genres: {genres}")
        
        time.sleep(0.5)
        
finally:
    driver.quit()
