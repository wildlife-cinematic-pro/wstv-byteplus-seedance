# Reference Image URLs

Use public HTTPS direct image URLs only.

WSTV supports one or two reference image URLs:

- `Reference Image 1` is the safest production default. Use it as the master identity, animal anatomy, environment, lighting, and realism anchor.
- `Reference Image 2` is optional and cautious. Use it only as a storyboard, shot order, framing, pacing, or motion guide.
- 3-5 reference images are not enabled for paid workflow yet.
- Do not paste comma-separated URLs into one field. Use separate boxes/flags.

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

If `Reference Image 2` is used, the prompt should include:

```text
Use Image 1 as the master identity, animal anatomy, environment, lighting, and realism anchor.
Use Image 2 only as storyboard shot order, framing, pacing, and motion guide.
Do not copy storyboard grid, borders, frame numbers, captions, text, logo, or watermark.
```

Storyboard/grid/captions may be copied by the model. The dashboard requires an acknowledgement before paid generation with `Reference Image 2`.

`images.wildstoriestv.com` is only for public reference images. Do not store API keys, signed output URLs, private task responses, or MP4 files there.

Local image upload and BytePlus Files API upload are intentionally not implemented yet.
