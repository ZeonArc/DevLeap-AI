"""
Web access for the broker: a pluggable search backend plus a hardened
page fetcher.

A local model has no internet access, so job discovery needs a real search
provider. When none is configured the feature reports itself unavailable
rather than letting the model invent postings.
"""

import ipaddress
import re
import socket
from html.parser import HTMLParser
from typing import Optional
from urllib.parse import urlparse

import httpx

from core.config import (
    BRAVE_API_KEY,
    JOB_PAGE_MAX_CHARS,
    SEARCH_PROVIDER,
    SEARCH_TIMEOUT_SECONDS,
    SEARXNG_URL,
    TAVILY_API_KEY,
)

USER_AGENT = "DevLeapAI/0.6 (+job-posting-reader)"
MAX_REDIRECTS = 3
MAX_DOWNLOAD_BYTES = 3_000_000


class InvalidUrlError(ValueError):
    """The URL is malformed, non-public, or otherwise unsafe to fetch."""


class SearchUnavailableError(RuntimeError):
    """No search backend is configured, or the configured one failed."""


def validate_public_url(url: str) -> str:
    """
    Ensure a caller-supplied URL points at a public internet host.

    The backend fetches this URL itself, so without this check a caller could
    aim it at localhost or a cloud metadata endpoint and read internal
    services through our response (SSRF).
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise InvalidUrlError("Job URL must start with http:// or https://")

    if parsed.username or parsed.password:
        raise InvalidUrlError("Job URL must not contain credentials")

    if not parsed.hostname:
        raise InvalidUrlError("Job URL is missing a hostname")

    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        raise InvalidUrlError(f"Could not resolve {parsed.hostname}")

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise InvalidUrlError(
                f"{parsed.hostname} resolves to a non-public address"
            )

    return url


class _TextExtractor(HTMLParser):
    """Collapse an HTML document down to its readable text."""

    SKIP_TAGS = {"script", "style", "noscript", "svg", "head", "template"}
    BREAK_TAGS = {"p", "br", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
        elif tag in self.BREAK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth:
            return
        text = data.strip()
        if text:
            self.parts.append(text)

    def text(self) -> str:
        joined = " ".join(self.parts)
        joined = re.sub(r"[ \t]+", " ", joined)
        joined = re.sub(r"\s*\n\s*", "\n", joined)
        return re.sub(r"\n{3,}", "\n\n", joined).strip()


def html_to_text(html: str) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        # Malformed markup still yields whatever was parsed before the fault.
        pass
    return parser.text()


async def fetch_page_text(url: str, max_chars: int = JOB_PAGE_MAX_CHARS) -> str:
    """
    Download a public page and return its readable text.

    Redirects are followed manually so every hop can be re-validated — an
    allowed host can otherwise redirect straight to an internal address.
    """
    current = validate_public_url(url)

    async with httpx.AsyncClient(
        timeout=SEARCH_TIMEOUT_SECONDS,
        follow_redirects=False,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,text/plain;q=0.9"},
    ) as http:
        for _ in range(MAX_REDIRECTS + 1):
            response = await http.get(current)

            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    raise InvalidUrlError("Redirect without a destination")
                current = validate_public_url(str(response.next_request.url))
                continue

            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if not any(t in content_type for t in ("text/html", "text/plain", "json")):
                raise InvalidUrlError(f"Unsupported content type: {content_type or 'unknown'}")

            body = response.content[:MAX_DOWNLOAD_BYTES].decode(
                response.encoding or "utf-8", errors="replace"
            )
            text = html_to_text(body) if "html" in content_type else body.strip()
            return text[:max_chars]

    raise InvalidUrlError("Too many redirects")


# ── Search providers ─────────────────────────────────────────────────────

def search_available() -> bool:
    if SEARCH_PROVIDER == "searxng":
        return bool(SEARXNG_URL)
    if SEARCH_PROVIDER == "tavily":
        return bool(TAVILY_API_KEY)
    if SEARCH_PROVIDER == "brave":
        return bool(BRAVE_API_KEY)
    return False


def _normalise(title: str, url: str, snippet: str) -> dict:
    return {
        "title": (title or "").strip(),
        "url": (url or "").strip(),
        "snippet": (snippet or "").strip()[:600],
    }


async def _search_searxng(query: str, limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT_SECONDS) as http:
        response = await http.get(
            f"{SEARXNG_URL}/search",
            params={"q": query, "format": "json"},
            headers={"User-Agent": USER_AGENT},
        )
        response.raise_for_status()
        results = response.json().get("results", [])

    return [
        _normalise(r.get("title", ""), r.get("url", ""), r.get("content", ""))
        for r in results[:limit]
    ]


async def _search_tavily(query: str, limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT_SECONDS) as http:
        response = await http.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "max_results": limit,
                "search_depth": "basic",
            },
        )
        response.raise_for_status()
        results = response.json().get("results", [])

    return [
        _normalise(r.get("title", ""), r.get("url", ""), r.get("content", ""))
        for r in results[:limit]
    ]


async def _search_brave(query: str, limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT_SECONDS) as http:
        response = await http.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": limit},
            headers={
                "X-Subscription-Token": BRAVE_API_KEY or "",
                "Accept": "application/json",
                "User-Agent": USER_AGENT,
            },
        )
        response.raise_for_status()
        results = response.json().get("web", {}).get("results", [])

    return [
        _normalise(r.get("title", ""), r.get("url", ""), r.get("description", ""))
        for r in results[:limit]
    ]


async def search(query: str, limit: int = 8) -> list[dict]:
    """
    Run a web search through the configured provider.

    Raises SearchUnavailableError when nothing is configured, so callers can
    tell the person the feature is off instead of returning invented results.
    """
    if not search_available():
        raise SearchUnavailableError(
            "Job search is turned off. Set SEARCH_PROVIDER to searxng, tavily, "
            "or brave (with the matching URL or API key) to enable it."
        )

    providers = {
        "searxng": _search_searxng,
        "tavily": _search_tavily,
        "brave": _search_brave,
    }

    try:
        return await providers[SEARCH_PROVIDER](query, limit)
    except SearchUnavailableError:
        raise
    except Exception as exc:
        raise SearchUnavailableError(
            f"The {SEARCH_PROVIDER} search backend did not respond. {exc}"
        ) from exc
