import pytest

import common


class FakeResponse:
    def __init__(self, status_code=200, content_type="image/png", url="https://images.wildstoriestv.com/test.png"):
        self.status_code = status_code
        self.headers = {"content-type": content_type}
        self.url = url
        self.closed = False

    def close(self):
        self.closed = True


def requester_for(*responses):
    calls = []
    remaining = list(responses)

    def requester(method, url, **kwargs):
        calls.append((method, url, kwargs))
        if not remaining:
            raise AssertionError("unexpected request")
        response = remaining.pop(0)
        if isinstance(response, Exception):
            raise response
        return response

    requester.calls = calls
    return requester


def test_valid_https_image_url_accepted_with_head(capsys):
    requester = requester_for(FakeResponse(content_type="image/png"))
    result = common.validate_public_image_url(
        "https://images.wildstoriestv.com/elephant_mud_master.png",
        requester=requester,
    )
    assert result["content_type"] == "image/png"
    assert requester.calls[0][0] == "HEAD"
    assert "validation passed" in capsys.readouterr().out


def test_head_blocked_uses_safe_get_fallback():
    requester = requester_for(FakeResponse(status_code=405), FakeResponse(content_type="image/webp"))
    result = common.validate_public_image_url(
        "https://images.wildstoriestv.com/bear_cub_falling.webp",
        requester=requester,
    )
    assert result["content_type"] == "image/webp"
    assert [call[0] for call in requester.calls] == ["HEAD", "GET"]
    assert requester.calls[1][2]["stream"] is True
    assert requester.calls[1][2]["headers"]["Range"] == "bytes=0-1023"


@pytest.mark.parametrize(
    "url, message",
    [
        ("http://images.wildstoriestv.com/elephant.png", "https"),
        ("https://localhost/elephant.png", "localhost"),
        ("https://127.0.0.1/elephant.png", "private"),
        ("https://10.0.0.12/elephant.png", "private"),
        ("not a url", "https"),
        ("https://github.com/org/repo/blob/main/image.png", "GitHub blob"),
        ("https://drive.google.com/file/d/example/view", "Google Drive"),
        ("https://www.facebook.com/photo.php?id=1", "social media"),
        ("https://www.instagram.com/p/example/", "social media"),
    ],
)
def test_bad_image_url_shapes_rejected_before_network(url, message):
    requester = requester_for(FakeResponse())
    with pytest.raises(common.ConfigError, match=message):
        common.validate_public_image_url(url, requester=requester)
    assert requester.calls == []


def test_html_content_type_rejected():
    requester = requester_for(FakeResponse(content_type="text/html; charset=utf-8"))
    with pytest.raises(common.ConfigError, match="HTML"):
        common.validate_public_image_url("https://images.wildstoriestv.com/page", requester=requester)


def test_non_200_response_rejected():
    requester = requester_for(FakeResponse(status_code=404, content_type="image/png"))
    with pytest.raises(common.ConfigError, match="HTTP 404"):
        common.validate_public_image_url("https://images.wildstoriestv.com/missing.png", requester=requester)


def test_non_image_file_rejected():
    requester = requester_for(FakeResponse(content_type="application/pdf"))
    with pytest.raises(common.ConfigError, match="image"):
        common.validate_public_image_url("https://images.wildstoriestv.com/file.pdf", requester=requester)


def test_unsupported_image_type_rejected():
    requester = requester_for(FakeResponse(content_type="image/svg+xml"))
    with pytest.raises(common.ConfigError, match="unsupported"):
        common.validate_public_image_url("https://images.wildstoriestv.com/vector.svg", requester=requester)
