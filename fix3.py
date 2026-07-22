import os, re

def fix():
    # 1. ai/page.tsx missing Card import
    p = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\ai\page.tsx'
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'import { Card }' not in c:
        c = c.replace("import { Markdown }", "import { Card }\nfrom '@/components/ui';\nimport { Markdown }")
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

    # 2. analytics/page.tsx parsing error Invalid character
    p = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\analytics\page.tsx'
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    # It might have \\n instead of \n because of my python string replacement!
    c = c.replace("\\n", "\n")
    c = c.replace("\\'", "'")
    if 'import { Card }' not in c:
        c = c.replace("import React,", "import { Card } from '@/components/ui';\nimport React,")
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

    # 3. error-boundary.tsx missing Card
    p = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\error-boundary.tsx'
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("\\n", "\n").replace("\\'", "'")
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

    # 4. stat-card.tsx Unexpected keyword or identifier
    p = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\stat-card.tsx'
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("\\n", "\n").replace("\\'", "'")
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

fix()
