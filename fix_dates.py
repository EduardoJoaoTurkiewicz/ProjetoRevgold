#!/usr/bin/env python3
"""
Script to fix date handling across components by replacing
new Date().toLocaleDateString('pt-BR') with dbDateToDisplay()
"""

import re
import os

# Patterns to match and replace
patterns = [
    # Pattern 1: new Date(variable).toLocaleDateString('pt-BR')
    (r'new Date\(([a-zA-Z0-9_.]+)\)\.toLocaleDateString\([\'"]pt-BR[\'"]\)', r'dbDateToDisplay(\1)'),

    # Pattern 2: new Date(object.property).toLocaleDateString('pt-BR')
    (r'new Date\(([a-zA-Z0-9_.]+\.[a-zA-Z0-9_]+)\)\.toLocaleDateString\([\'"]pt-BR[\'"]\)', r'dbDateToDisplay(\1)'),
]

# Files to process - excluding forms that might have current date displays
files_to_fix = [
    'src/components/Dashboard.tsx',
    'src/components/Debts.tsx',
    'src/components/Permutas.tsx',
    'src/components/Agenda.tsx',
    'src/components/Boletos.tsx',
    'src/components/Checks.tsx',
    'src/components/CashManagement.tsx',
    'src/components/Acertos.tsx',
    'src/components/Employees.tsx',
    'src/components/Taxes.tsx',
    'src/components/PixFees.tsx',
    'src/components/Reports.tsx',
    'src/components/reports/PayablesReport.tsx',
    'src/components/reports/ReceivablesReport.tsx',
    'src/components/reports/EnhancedReceivablesReport.tsx',
]

def add_import_if_needed(content, filepath):
    """Add dbDateToDisplay import if not present and date functions are used"""
    if 'dbDateToDisplay' in content:
        return content

    if 'toLocaleDateString' not in content:
        return content

    # Check if dateUtils import exists
    dateutils_import = re.search(r"import\s+{([^}]+)}\s+from\s+['\"]([^'\"]*dateUtils)['\"]", content)

    if dateutils_import:
        imports = dateutils_import.group(1)
        path = dateutils_import.group(2)

        if 'dbDateToDisplay' not in imports:
            new_imports = imports.strip() + ', dbDateToDisplay'
            new_import_line = f"import {{ {new_imports} }} from '{path}'"
            content = content.replace(dateutils_import.group(0), new_import_line)
            print(f"  ✓ Added dbDateToDisplay to existing import in {os.path.basename(filepath)}")
    else:
        # Add new import after first import or at beginning
        lines = content.split('\n')
        import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                import_idx = i + 1

        # Determine relative path based on file location
        if '/forms/' in filepath:
            import_path = '../../utils/dateUtils'
        elif '/reports/' in filepath:
            import_path = '../../utils/dateUtils'
        else:
            import_path = '../utils/dateUtils'

        new_import = f"import {{ dbDateToDisplay }} from '{import_path}';"
        lines.insert(import_idx, new_import)
        content = '\n'.join(lines)
        print(f"  ✓ Added new import in {os.path.basename(filepath)}")

    return content

def fix_dates_in_file(filepath):
    """Fix date handling in a single file"""
    if not os.path.exists(filepath):
        print(f"✗ File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    replacements = 0

    # Apply all patterns
    for pattern, replacement in patterns:
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            replacements += len(matches)

    if replacements > 0:
        # Add import if needed
        content = add_import_if_needed(content, filepath)

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ Fixed {replacements} date display(s) in {os.path.basename(filepath)}")
        return True
    else:
        print(f"  No changes needed in {os.path.basename(filepath)}")
        return False

def main():
    print("=" * 60)
    print("Fixing date display issues across components")
    print("=" * 60)

    total_fixed = 0
    for filepath in files_to_fix:
        if fix_dates_in_file(filepath):
            total_fixed += 1

    print("=" * 60)
    print(f"✓ Complete! Fixed {total_fixed} files")
    print("=" * 60)

if __name__ == '__main__':
    main()
