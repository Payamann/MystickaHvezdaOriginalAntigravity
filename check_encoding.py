import sys

def check_file(filepath):
    print(f"Checking {filepath}:")
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Test UTF-8
        try:
            text = content.decode('utf-8')
            print("  UTF-8: OK")
            for i, char in enumerate(text):
                if ord(char) > 127:
                    # Print char and its hex sequence
                    hex_seq = content[i:i+4].hex() # Rough estimate
                    print(f"    Line {text.count('\n', 0, i)+1}: Char '{char}' (U+{ord(char):04X})")
                    if i > 100: break # Only show first few
        except UnicodeDecodeError as e:
            print(f"  UTF-8: FAILED at {e.start}")
            
    except Exception as e:
        print(f"  Error: {e}")

check_file(r'c:\Users\pavel\OneDrive\Desktop\MystickaHvezda\components\footer.html')
check_file(r'c:\Users\pavel\OneDrive\Desktop\MystickaHvezda\components\header.html')
check_file(r'c:\Users\pavel\OneDrive\Desktop\MystickaHvezda\css\style.v2.css')
