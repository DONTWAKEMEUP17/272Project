from bs4 import BeautifulSoup
import re

with open('debug_list_page.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'lxml')

# 查看所有包含 /title/tt 的链接
links = soup.find_all('a', href=re.compile(r'^/title/tt'))
print(f"Found {len(links)} links with /title/tt pattern")

if links:
    for i, link in enumerate(links[:3]):
        print(f"\n=== Link {i+1} ===")
        print(f"href: {link.get('href')}")
        print(f"text: {link.get_text()}")
        
        # 看看父元素链
        current = link
        level = 0
        while current and level < 5:
            print(f"{'  '*level}┣ {current.name}: class={current.get('class', [])} id={current.get('id', '')}")
            current = current.parent
            level += 1

# 现在测试原始的 selector
print("\n=== Testing original selector ===")
original_results = soup.select("h3.lister-item-header a[href^='/title/tt']")
print(f"h3.lister-item-header a[href^='/title/tt']: {len(original_results)} matches")

# 尝试其他 selectors
print("\n=== Testing alternative selectors ===")
selectors = [
    "a[href^='/title/tt']",
    "a[href*='/title/tt']",
    "h2 > a[href^='/title/tt']",
    "h3 > a[href^='/title/tt']",
]

for sel in selectors:
    results = soup.select(sel)
    print(f"{sel}: {len(results)} matches")
