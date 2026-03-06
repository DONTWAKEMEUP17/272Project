import csv
import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_PAGE = "https://chii.in/anime/browser/%E6%97%A5%E6%9C%AC/tv?sort=rank"
BASE_SITE = "https://chii.in"
API_BASE = "https://api.bgm.tv/v0"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    # 如果你申请了 token，可以加：
    # "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",
}

session = requests.Session()
session.headers.update(HEADERS)

def fetch_subject_ids_from_page(url: str) -> list[int]:
    r = session.get(url, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    ids = []
    # 抓所有 /subject/xxxxx
    for a in soup.select("a[href*='/subject/']"):
        href = a.get("href", "")
        m = re.search(r"/subject/(\d+)", href)
        if m:
            ids.append(int(m.group(1)))

    # 去重保序
    seen = set()
    out = []
    for x in ids:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def fetch_subject_detail(subject_id: int) -> dict:
    url = f"{API_BASE}/subjects/{subject_id}"
    r = session.get(url, timeout=30)
    r.raise_for_status()
    return r.json()

def year_from_subject(subj: dict):
    # Bangumi 常见是 date / air_date 这类字段（不同接口/版本可能略有差异）
    # 这里做个鲁棒提取：找一个像 YYYY-MM-DD / YYYY 的字符串
    for key in ["date", "air_date", "aired", "release_date"]:
        v = subj.get(key)
        if isinstance(v, str) and len(v) >= 4 and v[:4].isdigit():
            return int(v[:4])
    return None

def main(max_items=1000, start_year=2000, pages=40, sleep_sec=0.6):
    # 1) 先抓多页榜单，确保你有足够候选（因为过滤后可能不足200）
    subject_ids = []
    # Bangumi 浏览页分页参数不一定统一：有时是 page=2 / 也可能是 ?page=2
    # 最稳：先抓第一页，然后你自己看页面“下一页”链接结构再微调。
    # 这里先用一个常见写法：&page=
    for p in range(1, pages + 1):
        url = BASE_PAGE + (f"&page={p}" if p > 1 else "")
        ids = fetch_subject_ids_from_page(url)
        subject_ids.extend(ids)
        print(f"page {p}: +{len(ids)} ids, total {len(subject_ids)}")
        time.sleep(sleep_sec)

    # 去重保序
    seen = set()
    dedup = []
    for x in subject_ids:
        if x not in seen:
            seen.add(x)
            dedup.append(x)
    subject_ids = dedup

    rows = []
    rank = 0
    for sid in subject_ids:
        rank += 1
        subj = fetch_subject_detail(sid)
        y = year_from_subject(subj)
        rating = subj.get("rating") or {}
        votes = rating.get("total") or 0

        if y is None or y < 2000:
            continue

        if votes < 5000:
            continue

        # Bangumi 的“类型/风格”更像 tags + 目录分类，不是 MAL 那种固定 genres
        # 这里先取 tags 名称（如果字段存在）
        tags = subj.get("tags") or []
        tag_names = [t.get("name") for t in tags if isinstance(t, dict) and t.get("name")]

        rating = subj.get("rating") or {}
        score = rating.get("score")
        total = rating.get("total")  # 评分人数（如果有）
        # rank 字段有时在 subj["rating"]["rank"] 或 subj["rank"]，做个兼容
        bgm_rank = subj.get("rank") or rating.get("rank")

        rows.append({
            "list_rank": rank,          # 在浏览页里的顺序
            "bgm_rank": bgm_rank,       # Bangumi 自己的 rank（如果返回）
            "id": sid,
            "name": subj.get("name") or subj.get("name_cn") or "",
            "name_cn": subj.get("name_cn") or "",
            "year": y,
            "score": score,
            "votes": total,
            "tags": "|".join(tag_names),
            "url": f"{BASE_SITE}/subject/{sid}",
        })

        if len(rows) >= max_items:
            break

        time.sleep(sleep_sec)

    with open("bangumi_tv_jp_rank_2000plus.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys() if rows else [])
        if rows:
            w.writeheader()
            w.writerows(rows)

    print("saved:", "bangumi_tv_jp_rank_2000plus.csv", "rows:", len(rows))

if __name__ == "__main__":
    main()