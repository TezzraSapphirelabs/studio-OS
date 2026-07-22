import os

files_to_fix = [
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\ai\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\analytics\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\projects\[projectId]\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\error-boundary.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\stat-card.tsx'
]

for p in files_to_fix:
    try:
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace("import React;\nimport { Card", "import React from 'react';\nimport { Card")
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
    except Exception as e:
        print(f"Error {p}: {e}")

# Fix tasks page error
try:
    with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\tasks\page.tsx', 'r', encoding='utf-8') as f:
        c = f.read()
    # "No duplicate props allowed react/jsx-no-duplicate-props" at line 249
    # line 249 was: <Card key={task.id} hover className="p-0" onClick={() => handleTaskClick(task)} className="cursor-pointer">
    import re
    c = re.sub(r'className="([^"]+)"\s+onClick=\{([^}]+)\}\s+className="([^"]+)"', r'onClick={\2} className="\1 \3"', c)
    c = re.sub(r'className="([^"]+)"\s+className="([^"]+)"', r'className="\1 \2"', c)
    with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\tasks\page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
except Exception as e:
    pass
