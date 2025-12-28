"""
Environment Verification Script
================================

This script checks that your Python environment and project structure
are set up correctly for the AI Interview Confidence Coach backend.

Run this script from the project root folder.
"""

import sys
from pathlib import Path

def main():
    print("=" * 70)
    print("🔍 ENVIRONMENT VERIFICATION")
    print("=" * 70)
    
    # Check 1: Python is working
    print("\n✓ Check 1: Python is running")
    print(f"  Status: ✅ SUCCESS")
    print(f"  (If you see this message, Python is working!)")
    
    # Check 2: Python version
    print("\n✓ Check 2: Python version")
    version = sys.version_info
    print(f"  Version: {version.major}.{version.minor}.{version.micro}")
    if version.major >= 3 and version.minor >= 8:
        print(f"  Status: ✅ GOOD (Python 3.8+ required)")
    else:
        print(f"  Status: ⚠️ WARNING (Python 3.8+ recommended)")
    
    # Get current directory
    project_root = Path.cwd()
    print(f"\n📂 Project root: {project_root}")
    
    # Check 3: backend/ folder exists
    print("\n✓ Check 3: backend/ folder")
    backend_dir = project_root / "backend"
    if backend_dir.exists() and backend_dir.is_dir():
        print(f"  Path: {backend_dir}")
        print(f"  Status: ✅ EXISTS")
    else:
        print(f"  Path: {backend_dir}")
        print(f"  Status: ❌ NOT FOUND")
    
    # Check 4: backend/data/ folder exists
    print("\n✓ Check 4: backend/data/ folder")
    data_dir = project_root / "backend" / "data"
    if data_dir.exists() and data_dir.is_dir():
        print(f"  Path: {data_dir}")
        print(f"  Status: ✅ EXISTS")
        
        # Bonus: List JSON files in data folder
        json_files = list(data_dir.glob("*.json"))
        if json_files:
            print(f"  Found {len(json_files)} JSON file(s):")
            for json_file in json_files:
                print(f"    • {json_file.name}")
    else:
        print(f"  Path: {data_dir}")
        print(f"  Status: ❌ NOT FOUND")
    
    # Check 5: backend/services/evaluation.py exists
    print("\n✓ Check 5: backend/services/evaluation.py")
    evaluation_file = project_root / "backend" / "services" / "evaluation.py"
    if evaluation_file.exists() and evaluation_file.is_file():
        print(f"  Path: {evaluation_file}")
        print(f"  Status: ✅ EXISTS")
        
        # Bonus: Show file size
        size_kb = evaluation_file.stat().st_size / 1024
        print(f"  Size: {size_kb:.1f} KB")
    else:
        print(f"  Path: {evaluation_file}")
        print(f"  Status: ❌ NOT FOUND")
    
    # Check 6: backend/services/ folder structure
    print("\n✓ Check 6: backend/services/ folder")
    services_dir = project_root / "backend" / "services"
    if services_dir.exists() and services_dir.is_dir():
        print(f"  Path: {services_dir}")
        print(f"  Status: ✅ EXISTS")
        
        # List Python files in services
        py_files = list(services_dir.glob("*.py"))
        if py_files:
            print(f"  Found {len(py_files)} Python file(s):")
            for py_file in py_files:
                print(f"    • {py_file.name}")
    else:
        print(f"  Path: {services_dir}")
        print(f"  Status: ❌ NOT FOUND")
    
    # Summary
    print("\n" + "=" * 70)
    print("📋 SUMMARY")
    print("=" * 70)
    
    all_checks = [
        ("Python running", True),
        ("Python 3.8+", version.major >= 3 and version.minor >= 8),
        ("backend/ folder", backend_dir.exists()),
        ("backend/data/ folder", data_dir.exists()),
        ("backend/services/evaluation.py", evaluation_file.exists()),
        ("backend/services/ folder", services_dir.exists()),
    ]
    
    passed = sum(1 for _, status in all_checks if status)
    total = len(all_checks)
    
    print(f"\n✅ Passed: {passed}/{total} checks")
    
    if passed == total:
        print("\n🎉 SUCCESS! Your environment is set up correctly!")
        print("\n💡 Next steps:")
        print("  1. Run the evaluation module tests:")
        print("     python backend/services/evaluation.py")
        print("\n  2. Try the beginner examples:")
        print("     python backend/services/example_usage.py")
    else:
        print("\n⚠️ Some checks failed. Please verify your project structure.")
        print("\n💡 Expected structure:")
        print("  project-root/")
        print("  ├── backend/")
        print("  │   ├── data/")
        print("  │   │   └── software_developer.json")
        print("  │   └── services/")
        print("  │       └── evaluation.py")
        print("  └── verify_environment.py  ← You are here")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
