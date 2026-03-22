import os
import sys
import subprocess
from pathlib import Path

# Add current dir to path
sys.path.append(str(Path(__file__).parent))

def run_command(args):
    """Executes agent.py with specific arguments"""
    cmd = [sys.executable, "agent.py"] + args
    print(f"🚀 Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(f"⚠️ Errors:\n{result.stderr}", file=sys.stderr)
    
    return result.returncode == 0

def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "auto"
    
    if action == "auto":
        print("🔮 Starting automated post generation...")
        success = run_command(["generate", "--auto"])
        if success:
            print("✅ Post generated successfully.")
        else:
            print("❌ Post generation failed.")
            
    elif action == "sync":
        print("💬 Starting comment synchronization...")
        success = run_command(["comments", "--sync"])
        if success:
            print("✅ Comments synced and replies generated.")
        else:
            print("❌ Comment sync failed.")
    
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)

if __name__ == "__main__":
    main()
