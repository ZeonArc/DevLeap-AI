import socket

import pytest

from profiler.github_ingest import InvalidRepoUrlError, validate_repo_url


def test_allows_public_github_https_url(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('140.82.121.3', 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    url = "https://github.com/torvalds/linux"
    assert validate_repo_url(url) == url


@pytest.mark.parametrize("url", [
    "http://github.com/torvalds/linux",       # not https
    "file:///etc/passwd",                     # local file read
    "/etc/passwd",                            # bare local path
    "ext::sh -c id",                          # git "ext" transport helper
    "https://user:pass@github.com/torvalds/linux",  # embedded credentials
    "https://gitlab.com/foo/bar",             # disallowed host
    "https://github.com.evil.com/foo/bar",    # lookalike host
])
def test_blocks_disallowed_urls(url):
    with pytest.raises(InvalidRepoUrlError):
        validate_repo_url(url)


def test_blocks_hosts_that_resolve_to_private_addresses(monkeypatch):
    """Even an allowed hostname must resolve publicly (guards DNS rebinding)."""
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(InvalidRepoUrlError):
        validate_repo_url("https://github.com/torvalds/linux")


def test_blocks_unresolvable_host(monkeypatch):
    def fake_getaddrinfo(host, port):
        raise socket.gaierror("unknown host")

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(InvalidRepoUrlError):
        validate_repo_url("https://github.com/torvalds/linux")
