import os
import re

def check_files():
    start_dir = "C:\\Users\\pavel\\OneDrive\\Desktop\\MystickaHvezda"
    
    # Common mojibake patterns when decoding UTF-8 as CP1250/1252
    suspicious_patterns = [
        r"Ă\w",      # match Ăˇ, Ă©, Ă­, Ă˝...
        r"Ä\w",      # match ÄŤ, Ä›...
        r"Ĺ\w",      # match Ĺ™, Ĺľ...
        r"â€",       # match â€“ (dash), â€ť (quotes)...
        r"Â\s",      # match Â followed by space (non-breaking space)
        r"Â",        # lone Â
        r"đź",       # match part of emojis misdecoded
        r"\ufffd",   # Replacement character
    ]
    
    regexes = [re.compile(p) for p in suspicious_patterns]
    found_issues = []
    
    for root, dirs, files in os.walk(start_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'server' in dirs:
            dirs.remove('server')
            
        for file in files:
            if file.endswith(".html"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        
                    for line_num, line in enumerate(lines, 1):
                        for r in regexes:
                            if r.search(line):
                                rel_path = os.path.relpath(path, start_dir)
                                found_issues.append((rel_path, line_num, line.strip()))
                                break
                except Exception as e:
                    pass

    if not found_issues:
        print("No suspicious mojibake patterns found! All good.")
    else:
        print(f"Found {len(found_issues)} suspicious lines:")
        # Write to file to avoid console encoding issues
        with open("encoding_issues_report.txt", "w", encoding="utf-8") as f:
            for issue in found_issues:
                f.write(f"- {issue[0]}:{issue[1]} -> {issue[2][:100]}...\n")
        print("Wrote results to encoding_issues_report.txt")
            
if __name__ == "__main__":
    check_files()
