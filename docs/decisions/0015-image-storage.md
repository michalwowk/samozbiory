# 0015 — Farm photo storage

- **Status:** proposed
- **Date:** 2026-09-26

## Context

A farm directory without photographs is dead on arrival, and photos are simultaneously an SEO surface
(Google Images for "samozbiór truskawek") and the heaviest part of the UX. Nothing in the current plan
covers object storage, upload, or processing.

The inputs are hostile: a farmer uploads from a phone — 6 MB, arbitrary orientation, and **EXIF
containing GPS coordinates of wherever the photo was taken**, which may be their home.

## Options

1. **Cloudflare R2** with presigned uploads, served through `next/image`.
2. **Prisma Storage buckets** — stays inside the CLI already in use.
3. **UploadThing** — fastest to integrate, another vendor.

## Recommendation

Option 1. Zero egress cost matters specifically for a product designed to live on organic traffic, where
images dominate the bill. Option 2 is attractive for tooling coherence but would tie image storage to a
release-candidate platform, and storage is the last place to accept a migration risk.

Two requirements hold regardless of the option chosen:

- **Strip EXIF server-side.** GPS coordinates from a private phone must never reach a public file.
- **Multiple renditions.** A mobile client needs different sizes than a desktop page, so whichever
  option wins must sit behind a CDN capable of transformations.
