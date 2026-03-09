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

# ===== 快速测试 =====
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--window-size=1400,900")
options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(options=options)
driver.set_page_load_timeout(30)

test_urls = [
    "https://www.imdb.com/title/tt2560140/",  # Shingeki no kyojin
    "https://www.imdb.com/title/tt12343534/",  # Jujutsu Kaisen
]

try:
    for idx, url in enumerate(test_urls, 1):
        print(f"\n[{idx}] {url}")
        driver.get(url)
        
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "script[type='application/ld+json']"))
            )
        except Exception as e:
            print(f"  ✗ Timeout: {e}")
            continue
        
        html = driver.page_source
        name, rating, rating_count, year = get_title_name_and_rating_from_title_html(html)
        
        print(f"  Title: {name}")
        print(f"  Rating: {rating}")
        print(f"  Rating Count: {rating_count}")
        print(f"  Year: {year}")
        
        time.sleep(0.5)
        
finally:
    driver.quit()
