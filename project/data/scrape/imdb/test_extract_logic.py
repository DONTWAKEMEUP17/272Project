import json
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
                        year = date_str[:4]
            
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

# 测试 JSON-LD 数据
test_data = {
    "name": "Shingeki no kyojin",
    "datePublished": "2013-04-07",
    "aggregateRating": {
        "ratingValue": 9.1,
        "ratingCount": 250000
    }
}

json_script = f'<script type="application/ld+json">{json.dumps(test_data)}</script>'
html = f'<html><body>{json_script}</body></html>'

name, rating, rating_count, year = get_title_name_and_rating_from_title_html(html)

print(f"Title: {name}")
print(f"Rating: {rating}")
print(f"Rating Count: {rating_count}")
print(f"Year: {year}")
