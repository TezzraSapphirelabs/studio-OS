import os

# 1. Update globals.css to completely remove dark backgrounds and enforce Luxury White
globals_css = """@import "tailwindcss";
@import "./design-system.css";

:root {
  --background: var(--ds-bg);
  --foreground: var(--ds-fg);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Design System Colors */
  --color-ds-bg: var(--ds-bg);
  --color-ds-surface: var(--ds-surface);
  --color-ds-surface-hover: var(--ds-surface-hover);
  --color-ds-card: var(--ds-card);
  --color-ds-card-hover: var(--ds-card-hover);
  --color-ds-fg: var(--ds-fg);
  --color-ds-fg-inverse: var(--ds-fg-inverse);
  --color-ds-border: var(--ds-border);
  --color-ds-border-inverse: var(--ds-border-inverse);
  --color-ds-text-muted: var(--ds-text-muted);
  --color-ds-text-muted-inverse: var(--ds-text-muted-inverse);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }

@layer base {
  input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select {
    @apply flex min-h-[44px] w-full rounded-[16px] border border-ds-border bg-white px-4 py-2 text-sm text-ds-fg transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-ds-fg focus:ring-ds-border disabled:cursor-not-allowed disabled:opacity-50 shadow-sm;
  }
  
  button:not([class*="ds-"]):not([class*="p-0"]):not([class*="w-full"]):not([class*="bg-transparent"]):not([class*="absolute"]):not([class*="top-"]):not([class*="right-"]):not([class*="left-"]):not([class*="bottom-"]):not([class*="z-"]):not([class*="hidden"]):not([class*="shrink-0"]):not([class*="text-ds-text-muted"]) {
    @apply inline-flex items-center justify-center rounded-[16px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ds-border focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] bg-ds-card text-ds-fg-inverse hover:bg-ds-card-hover h-11 px-6 py-2 text-sm shadow-md;
  }
}
"""

design_system_css = """/* 
 * Studio OS - Premium Design System (FINAL)
 * Luxury Premium Monochrome
 */

:root {
  /* Core Colors */
  --ds-bg: #F7F7F5;
  --ds-surface: #FFFFFF;
  --ds-surface-hover: #F1F1EF;
  --ds-card: #2B2D31;
  --ds-card-hover: #35383D;
  
  --ds-fg: #0A0A0A;
  --ds-fg-inverse: #FFFFFF;
  
  --ds-border: #E5E5E0;
  --ds-border-inverse: #40424A;
  
  --ds-text-muted: #8F8F8A;
  --ds-text-muted-inverse: #A0A0A5;
  
  /* Shadows & Depth */
  --ds-shadow-float: 0 12px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.04);
  --ds-shadow-pop: 0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 8px 24px -6px rgba(0, 0, 0, 0.06);
  --ds-shadow-sm: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --ds-transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ds-float {
  box-shadow: var(--ds-shadow-float);
  transition: var(--ds-transition);
}

.ds-float:hover {
  box-shadow: var(--ds-shadow-pop);
  transform: translateY(-4px);
}
"""

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\globals.css', 'w', encoding='utf-8') as f:
    f.write(globals_css)

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\design-system.css', 'w', encoding='utf-8') as f:
    f.write(design_system_css)

p = r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\dashboard\page.tsx'
if os.path.exists(p):
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Make the outer container more spacious
    c = c.replace('<div className="space-y-8 animate-fade-in-up">', '<div className="space-y-12 animate-fade-in-up max-w-[1400px] mx-auto">')
    c = c.replace('<div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">', '<div className="stagger-children grid gap-8 sm:grid-cols-2 lg:grid-cols-4">')
    c = c.replace('<div className="grid gap-6 lg:grid-cols-3 mt-8">', '<div className="grid gap-10 lg:grid-cols-3 mt-12">')
    c = c.replace('<div className="lg:col-span-2 space-y-6">', '<div className="lg:col-span-2 space-y-10">')
    c = c.replace('className="p-6"', 'className="p-8"')
    c = c.replace('className="p-6 flex', 'className="p-8 flex')
    c = c.replace('className="flex items-center justify-between p-6 border-b border-ds-border"', 'className="flex items-center justify-between p-8 border-b border-ds-border/50"')
    c = c.replace('className="divide-y divide-ds-border"', 'className="divide-y divide-ds-border/50"')
    c = c.replace('className="p-6 pb-0 flex', 'className="p-8 pb-0 flex')
    c = c.replace('className="p-6 pt-0', 'className="p-8 pt-0')
    c = c.replace('className="p-4 flex', 'className="p-6 flex')
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

# Same for all major pages
pages = [
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
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()
        
        c = c.replace('<div className="space-y-6">', '<div className="space-y-12 max-w-[1400px] mx-auto">')
        c = c.replace('<div className="space-y-8 animate-fade-in-up">', '<div className="space-y-12 animate-fade-in-up max-w-[1400px] mx-auto">')
        c = c.replace('className="p-6"', 'className="p-8"')
        c = c.replace('className="p-6 flex', 'className="p-8 flex')
        c = c.replace('className="p-6 pb-0', 'className="p-8 pb-0')
        c = c.replace('className="p-4"', 'className="p-6"')
        c = c.replace('gap-4', 'gap-8')
        c = c.replace('gap-6 md:grid-cols', 'gap-8 md:grid-cols')
        
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)

print('Updated component structures')
