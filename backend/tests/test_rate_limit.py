import pytest
from fastapi import HTTPException

from core.rate_limit import check_rate_limit, reset_rate_limits


@pytest.fixture(autouse=True)
def _clean_buckets():
    reset_rate_limits()
    yield
    reset_rate_limits()


def test_allows_requests_up_to_the_limit():
    for _ in range(3):
        check_rate_limit("user:ingest", limit=3, window_seconds=60, now=0.0)


def test_blocks_once_limit_is_exceeded():
    for _ in range(3):
        check_rate_limit("user:ingest", limit=3, window_seconds=60, now=0.0)

    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit("user:ingest", limit=3, window_seconds=60, now=1.0)

    assert exc_info.value.status_code == 429
    assert "Retry-After" in exc_info.value.headers


def test_allows_again_once_the_window_has_elapsed():
    for _ in range(3):
        check_rate_limit("user:ingest", limit=3, window_seconds=60, now=0.0)

    # First hit falls out of the sliding window.
    check_rate_limit("user:ingest", limit=3, window_seconds=60, now=61.0)


def test_scopes_are_independent():
    for _ in range(3):
        check_rate_limit("user:ingest", limit=3, window_seconds=60, now=0.0)

    # A different scope/key for the same user has its own budget.
    check_rate_limit("user:broker", limit=3, window_seconds=60, now=0.0)


def test_different_users_are_independent():
    for _ in range(3):
        check_rate_limit("user-a:ingest", limit=3, window_seconds=60, now=0.0)

    check_rate_limit("user-b:ingest", limit=3, window_seconds=60, now=0.0)
