import time
from collections import defaultdict
from typing import Dict, List, Optional

from fastapi import Depends, HTTPException

from core.auth import verify_clerk_token

_buckets: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(key: str, limit: int, window_seconds: int, now: Optional[float] = None) -> None:
    """
    Record a hit for `key` and raise HTTPException(429) if it exceeds `limit`
    hits within the trailing `window_seconds`. Pure, synchronous core of the
    rate limiter, kept separate from FastAPI wiring so it's easy to unit test.
    """
    now = now if now is not None else time.monotonic()
    window_start = now - window_seconds
    hits = _buckets[key]
    while hits and hits[0] < window_start:
        hits.pop(0)
    if len(hits) >= limit:
        retry_after = max(1, int(window_seconds - (now - hits[0])) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({limit} requests per {window_seconds}s). Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )
    hits.append(now)


def reset_rate_limits() -> None:
    """Test helper: clear all rate-limit state."""
    _buckets.clear()


def rate_limit(scope: str, limit: int, window_seconds: int):
    """
    FastAPI dependency factory: verifies the Clerk token, then enforces a
    per-user, per-scope sliding-window rate limit before the route runs.

    NOTE: bucket state lives in this process's memory only. It resets on
    restart and is NOT shared across multiple backend workers/replicas --
    fine for a single-instance deployment, but swap in a Redis-backed
    limiter before running more than one backend process.
    """
    def dependency(current_user_id: str = Depends(verify_clerk_token)) -> str:
        check_rate_limit(f"{scope}:{current_user_id}", limit, window_seconds)
        return current_user_id
    return dependency
