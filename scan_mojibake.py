import os

# Mojibake patterns for Czech characters (UTF-8 read as CP1250/ISO-8859-2)
PATTERNS = [
    'Ăˇ', 'Ä›', 'ÄŤ', 'Ĺˇ', 'Ĺ™', 'Ĺľ', 'Ă˝', 'Ă­', 'Ă©', 'Ăł', 'Ăş', 'ĹŻ',
    'Ă\x81', 'Ä\x9a', 'Ä\x8c', 'Ĺ\x10', 'Ĺ\x98', 'Ĺ\xbd', 'Ă\x9d', 'Ă\x8d', 'Ă\x89', 'Ă\x93', 'Ă\x9a', 'Ĺ\xae'
]

def scan_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            
        try:
            text = content.decode('utf-8')
            # Look for these patterns inside the UTF-8 text (which means they were double-encoded)
            found = []
            for p in PATTERNS:
                if p in text:
                    found.append(p)
            
            if found:
                print(f"FOUND MOJIBAKE in {filepath}: {found}")
                return True
        except UnicodeDecodeError:
            print(f"COULD NOT DECODE {filepath} as UTF-8 (Binary or other encoding)")
            return False
    except Exception as e:
        # print(f"Error reading {filepath}: {e}")
        pass
    return False

def main():
    root = r'c:\Users\pavel\OneDrive\Desktop\MystickaHvezda'
    corrupted_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        if '.git' in dirpath or 'node_modules' in dirpath:
            continue
        for f in filenames:
            if f.endswith(('.html', '.css', '.js')):
                path = os.path.join(dirpath, f)
                if scan_file(path):
                    corrupted_files.append(path)
    
    print(f"\nTotal corrupted files found: {len(corrupted_files)}")

if __name__ == "__main__":
    main()
