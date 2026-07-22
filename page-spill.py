import os, re

def update_page_layout(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Let's replace the outer div of the page with something more spacious and premium
    # Search for something like `<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">` or `<div className="space-y-6">`
    content = re.sub(r'<div className="flex-1 space-y-4 p-4 md:p-8 pt-6[^"]*">', r'<div className="space-y-10 py-6">', content)
    content = re.sub(r'<div className="space-y-6[^"]*">', r'<div className="space-y-10 py-6">', content)
    content = re.sub(r'<div className="flex flex-col space-y-6[^"]*">', r'<div className="flex flex-col space-y-10 py-6">', content)
    
    # For stat cards grid
    content = re.sub(r'<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">', r'<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">', content)
    content = re.sub(r'<div className="grid grid-cols-1 md:grid-cols-2 gap-6">', r'<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

pages = [
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\dashboard\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\projects\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\projects\[projectId]\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\tasks\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\notes\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\calendar\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\files\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\analytics\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\tags\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\ai\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\team\page.tsx',
    r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\settings\page.tsx'
]

for p in pages:
    update_page_layout(p)

print("Updated spacings")
