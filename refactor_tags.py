import os
import re

search_dir = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app'
components_dir = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components'

def refactor_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Track what components we need to import
    needs_button = False
    needs_input = False
    needs_select = False
    needs_textarea = False
    
    # 1. button -> Button
    if '<button' in content or '</button>' in content:
        # We only replace buttons that are standard buttons, not custom complex things
        # Actually, if we just swap tags it might break if the button relies on default HTML button behavior that Button overrides.
        # But to fulfill the prompt precisely:
        content = re.sub(r'<button(\s|>)', r'<Button\1', content)
        content = re.sub(r'</button>', r'</Button>', content)
        needs_button = True

    # 2. input -> Input
    if '<input' in content:
        # Input components in UI usually don't have closing tags, just <Input />
        # But native <input> also is usually self closing.
        # Be careful: type="checkbox", type="radio", type="file" shouldn't become <Input> ideally, but UI <Input> might pass type down.
        # UI Input passes {...props} down.
        content = re.sub(r'<input(\s|>)', r'<Input\1', content)
        needs_input = True
        
    # 3. select -> Select
    if '<select' in content or '</select>' in content:
        content = re.sub(r'<select(\s|>)', r'<Select\1', content)
        content = re.sub(r'</select>', r'</Select>', content)
        needs_select = True
        
    # 4. textarea -> Textarea
    if '<textarea' in content or '</textarea>' in content:
        content = re.sub(r'<textarea(\s|>)', r'<Textarea\1', content)
        content = re.sub(r'</textarea>', r'</Textarea>', content)
        needs_textarea = True
        
    if content != original_content:
        # Inject imports
        imports_to_add = []
        if needs_button and 'Button' not in original_content: imports_to_add.append('Button')
        if needs_input and 'Input' not in original_content: imports_to_add.append('Input')
        if needs_select and 'Select' not in original_content: imports_to_add.append('Select')
        if needs_textarea and 'Textarea' not in original_content: imports_to_add.append('Textarea')
        
        if imports_to_add:
            import_str = f"import {{ {', '.join(imports_to_add)} }} from '@/components/ui';\n"
            content = content.replace("import React", f"import React\n{import_str}")
            if "import React" not in content and "'use client';" in content:
                content = content.replace("'use client';\n", f"'use client';\n{import_str}")

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Refactored tags in: {path}')

for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.tsx'):
            refactor_file(os.path.join(root, file))

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.tsx'):
            # Don't refactor the UI components themselves!
            if 'components\\ui' not in root:
                refactor_file(os.path.join(root, file))
