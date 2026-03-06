from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time

# 快速测试：只取一个详情页
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--window-size=1400,900")
options.add_argument("--disable-gpu")
options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(options=options)

try:
    title_url = "https://www.imdb.com/title/tt2560140/"
    print(f"Testing URL: {title_url}")
    
    driver.get(title_url)
    
    # 等待 JSON-LD
    print("Waiting for JSON-LD...")
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "script[type='application/ld+json']"))
        )
        print("✓ Found JSON-LD script tag")
    except Exception as e:
        print(f"✗ Timeout waiting for JSON-LD: {e}")
        with open("test_debug.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("Saved HTML to test_debug.html")
        driver.quit()
        exit(1)
    
    html = driver.page_source
    
    # 查找 JSON-LD
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    
    json_lds = soup.find_all("script", attrs={"type": "application/ld+json"})
    print(f"Found {len(json_lds)} JSON-LD scripts")
    
    for i, script in enumerate(json_lds[:3]):
        try:
            data = json.loads(script.get_text(strip=True))
            print(f"\n[JSON-LD #{i+1}]")
            if isinstance(data, list):
                print(f"  Type: List with {len(data)} items")
            else:
                print(f"  Type: Dict")
                if "name" in data:
                    print(f"  name: {data.get('name')}")
                if "genre" in data:
                    print(f"  genre: {data.get('genre')}")
                if "aggregateRating" in data:
                    print(f"  rating: {data['aggregateRating'].get('ratingValue')}")
        except Exception as e:
            print(f"  Error parsing: {e}")
    
finally:
    driver.quit()
    print("\nDone!")
