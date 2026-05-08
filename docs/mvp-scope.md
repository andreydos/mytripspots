# MVP Scope

## Included
- Clerk login and user bootstrap.
- Trips and places CRUD via GraphQL.
- Upload photos with presigned Cloudflare R2 URL flow.
- OSM map pins via Leaflet.
- Search by place title/notes.
- Offline draft save and sync queue.

## Guardrails
- 4MB hard max upload at API layer.
- Client auto-compresses selected photos to WebP target around 3MB before upload.
- MIME allowlist: jpeg/png/webp.
- API rate limits for guest/authenticated users.
- EXIF not exposed in public responses.
- Photo deletion is soft-delete first, physical delete later.
