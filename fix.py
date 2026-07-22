import os
import re

search_dir = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src'

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix invalid quote escaping
    content = content.replace("\\'", "'")
    
    # Fix import { Card, Card }
    content = content.replace("import { Card, Card }", "import { Card }")
    content = content.replace("import { PageHeader, Button, Card, Input, Card }", "import { PageHeader, Button, Card, Input }")
    content = content.replace("import { Card } from '@/components/ui';\nimport { Card } from '@/components/ui';", "import { Card } from '@/components/ui';")
    content = content.replace("import React\nimport { Card } from '@/components/ui';", "import React;")
    
    # Also clean up "import React;" duplicate issues if any
    content = content.replace("import React;import React;", "import React;")
    
    # Clean up empty lines from failed parsing
    if path.endswith('ai\page.tsx') or path.endswith('analytics\page.tsx') or path.endswith('projects\[projectId]\page.tsx') or path.endswith('error-boundary.tsx') or path.endswith('stat-card.tsx'):
        content = content.replace("import React\nimport { Card } from '@/components/ui';", "import React;\nimport { Card } from '@/components/ui';")
    
    if content != original_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {path}')

for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
