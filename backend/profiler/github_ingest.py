import ipaddress
import os
import socket
import tempfile
import subprocess
import shutil
from urllib.parse import urlparse

ALLOWED_REPO_HOSTS = {"github.com", "www.github.com"}


class InvalidRepoUrlError(ValueError):
    pass


def validate_repo_url(repo_url: str) -> str:
    """
    Ensure repo_url is a public https://github.com/... URL.

    Without this, `git clone` would happily accept local paths, file://
    URLs, or internal-network hosts, letting a caller exfiltrate arbitrary
    files or hit internal services from the backend host (SSRF).
    """
    parsed = urlparse(repo_url)

    if parsed.scheme != "https":
        raise InvalidRepoUrlError("Repository URL must start with https://")

    if parsed.username or parsed.password:
        raise InvalidRepoUrlError("Repository URL must not contain credentials")

    if parsed.hostname not in ALLOWED_REPO_HOSTS:
        raise InvalidRepoUrlError("Only https://github.com repository URLs are supported")

    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        raise InvalidRepoUrlError("Could not resolve repository host")

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise InvalidRepoUrlError("Repository host resolves to a non-public address")

    return repo_url


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
    validate_repo_url(repo_url)
    temp_dir = tempfile.mkdtemp()
    try:
        # Clone the repository
        print(f"Cloning {repo_url} into {temp_dir}...")
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, temp_dir],
            check=True,
            capture_output=True,
            # Defense in depth: even if a rewritten/forged URL slips through,
            # git itself refuses anything but the https transport.
            env={**os.environ, "GIT_ALLOW_PROTOCOL": "https"},
        )
        
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
