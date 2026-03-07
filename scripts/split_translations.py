#!/usr/bin/env python3
"""
Script to split large translation files into modules
"""
import json
import os
from pathlib import Path

# Define module structure
MODULES = {
    'common': ['nav', 'footer', 'welcome', 'home', 'errors', 'buttons'],
    'auth': ['auth', 'login', 'register'],
    'profile': ['profile', 'portfolio', 'wallet', 'balance'],
    'jobs': ['jobs', 'job', 'create_job', 'deadline'],
    'proposals': ['proposals', 'proposal'],
    'chat': ['chat', 'messages'],
    'reviews': ['reviews', 'review', 'rating'],
    'admin': ['admin'],
    'vip': ['vip', 'pricing', 'subscription']
}

def split_translations(lang='ru'):
    """Split translation file into modules"""
    input_file = Path(f'frontend/src/locales/{lang}.json')
    output_dir = Path(f'frontend/src/locales/{lang}')
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    # Load original file
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Split into modules
    modules_data = {module: {} for module in MODULES.keys()}
    unassigned = {}
    
    for key, value in data.items():
        assigned = False
        for module, keywords in MODULES.items():
            if any(kw in key.lower() for kw in keywords):
                modules_data[module][key] = value
                assigned = True
                break
        
        if not assigned:
            unassigned[key] = value
    
    # Write modules
    for module, content in modules_data.items():
        if content:
            output_file = output_dir / f'{module}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(content, f, ensure_ascii=False, indent=2)
            print(f'✓ Created {module}.json ({len(content)} keys)')
    
    # Write unassigned to common
    if unassigned:
        common_file = output_dir / 'common.json'
        with open(common_file, 'r', encoding='utf-8') as f:
            common_data = json.load(f)
        common_data.update(unassigned)
        with open(common_file, 'w', encoding='utf-8') as f:
            json.dump(common_data, f, ensure_ascii=False, indent=2)
        print(f'✓ Added {len(unassigned)} unassigned keys to common.json')
    
    print(f'\\n✅ Split completed for {lang}.json')

if __name__ == '__main__':
    print('Splitting translation files...\\n')
    split_translations('ru')
    split_translations('tk')
    print('\\nDone!')
