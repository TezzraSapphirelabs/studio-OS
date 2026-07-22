import os
import re

search_dir = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app'
components_dir = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components'

def refactor_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. GlassCard -> Card
    content = re.sub(r'<GlassCard(\s|>)', r'<Card\1', content)
    content = re.sub(r'</GlassCard>', r'</Card>', content)
    
    # 2. padding="none" -> p-0, sm -> p-4, md -> p-6, lg -> p-8
    # We need to inject this into className if it exists, or create one.
    # To keep it simple, Card padding prop isn't supported, so let's just use regex to replace padding="..." with className="..."
    # Actually, a simpler way is to map padding to className:
    def replace_padding(m):
        padding = m.group(1)
        cls = 'p-0' if padding == 'none' else 'p-4' if padding == 'sm' else 'p-6' if padding == 'md' else 'p-8'
        return f'className="{cls}"'
    
    content = re.sub(r'padding="(none|sm|md|lg)"', replace_padding, content)
    
    # Merge multiple classNames if they ended up adjacent
    # Example: className="p-4" className="flex..." -> className="p-4 flex..."
    content = re.sub(r'className="([^"]+)"\s+className="([^"]+)"', r'className="\1 \2"', content)
    
    # Fix import for GlassCard
    # if it says: import { GlassCard } from '@/components';
    # change to import { Card } from '@/components/ui';
    if 'GlassCard' in original_content:
        # We need to make sure Card is imported from @/components/ui
        if 'import { Card' not in content and "import {Card" not in content and "import { PageHeader, Card" not in content and "import { Button, Card" not in content:
            content = content.replace("import { GlassCard } from '@/components';", "import { Card } from '@/components/ui';")
            content = content.replace("import { GlassCard, ", "import { ")
            content = content.replace(", GlassCard }", " }")
            content = content.replace(", GlassCard,", ",")
            
            # If there's no import { Card } from '@/components/ui', add it
            if '<Card' in content and 'from \'@/components/ui\'' not in content:
                content = content.replace("import React", "import React\nimport { Card } from '@/components/ui';")
            elif '<Card' in content and 'from \'@/components/ui\'' in content:
                content = re.sub(r'import \{ ([^\}]+) \} from \'@/components/ui\';', r'import { \1, Card } from \'@/components/ui\';', content)

    if content != original_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Refactored: {path}')

for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.tsx'):
            refactor_file(os.path.join(root, file))

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.tsx'):
            refactor_file(os.path.join(root, file))
