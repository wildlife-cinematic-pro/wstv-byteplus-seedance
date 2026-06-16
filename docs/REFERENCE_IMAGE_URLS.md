# Reference Image URLs

Use public HTTPS direct image URLs only.

Good examples:

```text
https://images.wildstoriestv.com/elephant_mud_master.png
https://images.wildstoriestv.com/bear_cub_falling.png
```

Bad examples:

```text
http://images.wildstoriestv.com/elephant_mud_master.png
http://localhost:8000/image.png
https://github.com/example/repo/blob/main/image.png
https://drive.google.com/file/d/example/view
https://www.facebook.com/photo.php?id=123
https://www.instagram.com/p/example/
https://example.com/page-about-an-image.html
```

Validation rules:

- URL must be non-empty and well-formed.
- Scheme must be `https`.
- `http`, localhost, local-only hostnames, and private/internal IP ranges are rejected.
- GitHub blob pages, Google Drive preview pages, Facebook pages, and Instagram pages are rejected.
- The validator sends a `HEAD` request first.
- If `HEAD` is blocked, it uses a streamed `GET` fallback with a small byte range.
- Response status must be `200`.
- `Content-Type` must start with `image/`.
- Allowed types are `image/jpeg`, `image/jpg`, `image/png`, and `image/webp`.
- HTML pages, login pages, and non-image files are rejected.

`images.wildstoriestv.com` is only for public reference images. Do not store API keys, signed output URLs, private task responses, or MP4 files there.

Local image upload and BytePlus Files API upload are intentionally not implemented yet.
