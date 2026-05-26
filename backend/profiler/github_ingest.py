import os
import tempfile
import subprocess
import shutil

def is_text_file(filepath):
    """Check if a file is text (not binary) by reading a small chunk."""
    try:
        with open(filepath, 'tr') as check_file:
            check_file.read(1024)
            return True
    except:
        return False

def should_ignore(path):
    """Basic ignore list for node_modules, .git, etc."""
    ignore_dirs = {'.git', 'node_modules', 'venv', '__pycache__', 'build', 'dist', '.next'}
    parts = path.split(os.sep)
    return any(part in ignore_dirs for part in parts)

def clone_and_extract(repo_url: str) -> str:
    """Clones a repository, reads all text files, and returns a concatenated string."""
    temp_dir = tempfile.mkdtemp()
    try:
        # Clone the repository
        print(f"Cloning {repo_url} into {temp_dir}...")
        subprocess.run(["git", "clone", "--depth", "1", repo_url, temp_dir], check=True, capture_output=True)
        
        all_content = []
        
        # Walk the directory
        for root, dirs, files in os.walk(temp_dir):
            if should_ignore(root):
                continue
                
            for file in files:
                filepath = os.path.join(root, file)
                if should_ignore(filepath):
                    continue
                
                # Check extension / binary
                if not is_text_file(filepath):
                    continue
                    
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Get relative path for context
                    rel_path = os.path.relpath(filepath, temp_dir)
                    all_content.append(f"--- FILE: {rel_path} ---\n{content}\n")
                except Exception as e:
                    print(f"Failed to read {filepath}: {e}")
                    
        return "\n".join(all_content)
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
