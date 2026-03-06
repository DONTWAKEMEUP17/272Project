import csv
import time
import requests

BASE = "https://api.jikan.moe/v4/top/anime"

def get_year(item: dict):
    y = item.get("year")
    if isinstance(y, int):
        return y
    aired = item.get("aired") or {}
    frm = aired.get("from")
    if isinstance(frm, str) and len(frm) >= 4 and frm[:4].isdigit():
        return int(frm[:4])
    return None

def fetch_page(page: int):
    r = requests.get(BASE, params={"type": "tv", "page": page}, timeout=30)
    r.raise_for_status()
    return r.json().get("data", [])

def main(min_year=2000, need=200):
    rows = []
    page = 1

    while len(rows) < need:
        data = fetch_page(page)
        if not data:
            break

        for item in data:
            year = get_year(item)
            if year is None or year < min_year:
                continue

            rows.append({
                "rank": item.get("rank"),
                "title": item.get("title"),
                "score": item.get("score"),
                "scored_by": item.get("scored_by"),   # 评分人数
                "members": item.get("members"),       # 收藏/关注人数（人气 proxy）
                "year": year,
                "genres": "|".join([g.get("name","") for g in (item.get("genres") or []) if g.get("name")]),
                "url": item.get("url"),
            })

            if len(rows) >= need:
                break

        page += 1
        time.sleep(0.5)  # 避免撞 rate limit 

    with open("mal_top_tv_2000plus_200.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)

    print("Saved:", "mal_top_tv_2000plus_200.csv", "rows:", len(rows))

if __name__ == "__main__":
    main(min_year=2000, need=200)