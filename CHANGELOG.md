# Changelog

## Unreleased

### Fixed

- **A short video uploaded from binary data was never deleted from storage.**
  The API now deletes a post's media folder only when the folder belongs to that
  post, and **Publish Video** created the post under a fresh ID instead of the one
  `generate-upload-urls` reserved for the upload. It is now created under the
  reserved ID, the same way **Publish Long Video** already did.
- The same operations stored the signed upload URL with its query stripped as the
  video and thumbnail URL. That host is the storage API, not the public CDN, so the
  cleanup could not recognise the files as Posty5's even with a matching ID. They
  now store the public `fileURL`, like every other client.

### Added

- **Upload Post ID** on **Publish Image** and **Publish Image to Account** when the
  source is **Uploaded Bucket File**. The image is uploaded outside the node, so
  the node cannot reserve an ID for it. Pass the `postId` returned with the
  bucket file URL and the post owns its image. Leave it empty and the post is still
  created, but the uploaded image is never deleted from storage.

## 4.3.0 - 2026-09-19

### Added

- **Up to five comments per post**, through a new **Comments** collection on the
  four publish operations. Each entry carries its own text, delay (0-1440
  minutes), optional image URL and per-platform switches, and they post in the
  order they are listed.

### Deprecated

- The single **Comment** collection. It still works — it is mapped into the
  first entry of **Comments** when that is empty — and the two are never sent
  together, because the API refuses a request carrying both. A workflow half
  upgraded, with the new collection filled in and the old one never cleared, is
  exactly the state that would otherwise produce a 400.

### Fixed

- **The credit wording was wrong everywhere it appeared.** A comment is **25
  credits**, not "+1", and an image post is **50**, not 5. Corrected on the node
  description, both image operations and the comment fields.

### Documentation

- The two caveats a workflow author has no way to discover are now stated on the
  fields themselves: **TikTok is not supported** (no public comment-posting
  endpoint, so it reports `notSupported` rather than failing), and **an image is
  Facebook only** (Instagram and YouTube comments are text-only).
