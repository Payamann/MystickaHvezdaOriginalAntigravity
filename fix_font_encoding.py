import os

def check_and_fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            
        # Try UTF-8
        try:
            text = content.decode('utf-8')
            encoding = 'utf-8'
        except UnicodeDecodeError:
            # Try CP1250 (Common for Czech Windows)
            try:
                text = content.decode('cp1250')
                encoding = 'cp1250'
                print(f"File {filepath} is CP1250. Converting to UTF-8.")
            except UnicodeDecodeError:
                print(f"File {filepath} has UNKNOWN encoding.")
                return

        # Fix Google Fonts subset
        if 'fonts.googleapis.com' in text and 'subset=latin,latin-ext' not in text:
            # Extract the URL and add subset
            text = text.replace('display=swap"', 'display=swap&subset=latin,latin-ext"')
            text = text.replace('display=swap\'', 'display=swap&subset=latin,latin-ext\'')
            print(f"Fixed Google Fonts in {filepath}")

        # Fix mojibake in CSS (specific known strings)
        if filepath.endswith('.css'):
            text = text.replace('MYSTICKĂ  HVÄšZDA', 'MYSTICKÁ HVĚZDA')
            text = text.replace('BarevnĂˇ paleta', 'Barevná paleta')
            # Add more as discovered
            
        # Write back as UTF-8 (without BOM if possible, or consistent)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    root = r'c:\Users\pavel\OneDrive\Desktop\MystickaHvezda'
    for dirpath, dirnames, filenames in os.walk(root):
        if '.git' in dirpath: continue
        for f in filenames:
            if f.endswith(('.html', '.css')):
                check_and_fix_file(os.path.join(dirpath, f))

if __name__ == "__main__":
    main()
