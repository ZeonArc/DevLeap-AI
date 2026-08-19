import pytest

from core.websearch import InvalidUrlError, html_to_text, validate_public_url


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",
        "ftp://example.com/x",
        "http://localhost:8000/admin",
        "http://127.0.0.1/",
        "https://169.254.169.254/latest/meta-data/",  # cloud metadata
        "http://10.0.0.5/internal",
        "http://192.168.1.1/router",
        "https://user:secret@example.com/job",
    ],
)
def test_rejects_unsafe_urls(url):
    with pytest.raises(InvalidUrlError):
        validate_public_url(url)


def test_rejects_url_without_host():
    with pytest.raises(InvalidUrlError):
        validate_public_url("https:///no-host")


def test_allows_public_https_url():
    assert validate_public_url("https://github.com/some/job") == "https://github.com/some/job"


def test_html_to_text_drops_scripts_and_styles():
    html = """
    <html><head><style>.a{color:red}</style></head>
    <body>
      <script>var secret = 1;</script>
      <h1>Senior Backend Engineer</h1>
      <p>We use Python and Postgres.</p>
    </body></html>
    """
    text = html_to_text(html)
    assert "Senior Backend Engineer" in text
    assert "Python and Postgres" in text
    assert "secret" not in text
    assert "color:red" not in text


def test_html_to_text_decodes_entities():
    assert "R&D" in html_to_text("<p>R&amp;D</p>")


def test_html_to_text_survives_malformed_markup():
    assert "Hello" in html_to_text("<div><p>Hello<div></p>")
