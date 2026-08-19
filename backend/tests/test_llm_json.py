import json

import pytest

from core.llm import parse_json_response


def test_parses_clean_json():
    assert parse_json_response('{"a": 1}') == {"a": 1}


def test_strips_markdown_json_fence():
    text = '```json\n{"a": 1, "b": [1, 2, 3]}\n```'
    assert parse_json_response(text) == {"a": 1, "b": [1, 2, 3]}


def test_strips_plain_markdown_fence():
    text = '```\n{"a": 1}\n```'
    assert parse_json_response(text) == {"a": 1}


def test_recovers_json_surrounded_by_stray_text():
    text = 'Sure, here you go:\n{"job_title": "Engineer", "company": "Acme"}\nHope that helps!'
    assert parse_json_response(text) == {"job_title": "Engineer", "company": "Acme"}


def test_raises_json_decode_error_on_non_json():
    with pytest.raises(json.JSONDecodeError):
        parse_json_response("Sorry, I could not find that job posting.")
