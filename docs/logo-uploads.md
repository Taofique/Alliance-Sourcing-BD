# CMS logo replacement

The admin settings Server Component loads existing MongoDB settings and passes
each logo to the small Client Component. The contact editor is unchanged.

## Running

Cloudinary 2.11.0, Sharp 0.35.5 (libvips 8.18.7), and saxes 6.0.0 were verified.
Run `npm install` after pulling these changes, then restart `npm run dev`.
For deployment, rebuild with `npm run build` and start with `npm start`.

Keep CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in
server environment variables. All three were present locally; their values
were not printed, and their validity was not checked with a live upload.
BETTER_AUTH_URL must match the browser-facing application origin.
The cloud name must be available at build time for Next.js image configuration.

Run isolated verification with:

```sh
node --require tsx/cjs --test scripts/logo-upload.test.cjs
npm run lint
npx tsc --noEmit
npm run build
```

Tests generate actual image bytes, including AVIF, and mock authentication,
the Mongoose model and the Cloudinary SDK upload stream. They never load
.env.local or change saved production logos. Contact PATCH and public logo
rendering are exercised against the isolated model. A real authenticated browser
upload, live Cloudinary credentials and a live MongoDB write remain untested.

## Request flow

```mermaid
sequenceDiagram
  participant Browser
  participant Page as admin/(protected)/settings/page.tsx
  participant Form as components/admin/logo-upload-form.tsx
  participant Route as api/site-settings/logo/route.ts
  participant Image as lib/logo-image.ts
  participant Cloud as lib/cloudinary.ts
  participant DB as services/site-settings.ts / MongoDB
  Browser->>Page: GET /admin/settings
  Page->>DB: getPublicSiteSettings()
  Page-->>Browser: Render saved logos and Client Components
  Browser->>Form: Select sourcing.svg; Upload and replace
  Form->>Route: POST FormData(file, logoKey)
  Route->>Route: Admin session, origin, bounded multipart, existing key
  Route->>Image: Validate XML and normalize with Sharp
  Image-->>Route: Static transparent PNG
  Route->>Cloud: uploadLogo(PNG)
  Cloud-->>Route: HTTPS URL + unique public ID
  Route->>DB: Update selected imageUrl/publicId only
  Route-->>Form: JSON success (or safe error)
  Form->>Page: router.refresh()
  Page->>DB: Read saved settings again
  Browser->>DB: Public reload via (site)/layout.tsx
  DB-->>Browser: layout.tsx → components/layout/logo.tsx → next/image
```

A Route Handler is the App Router equivalent of an Express endpoint: the exported
POST function receives a Web Request and returns a Web Response. It does not
inherit the protected admin layout, so it checks the admin session itself.
The page and database/Cloudinary/image helpers stay on the server. Only the form,
shared size constants, and serializable logo data enter the browser module graph.

The browser supplies multipart Content-Type and its boundary; the fetch call must
not set that header manually. Authentication and origin checks precede body reads.
The reader enforces a 2 MiB + 64 KiB total multipart budget while reading the
request stream, then checks the actual file against the shared 2 MiB limit.
Content-Length is only an early rejection, not a trusted size guarantee.

Configure the hosting proxy/platform to reject request bodies over 2,162,688 bytes
(or a nearby supported cap above that application limit), with suitable request
timeouts and upload rate/concurrency limits. A Route Handler cannot prevent an
upstream proxy or framework from buffering data before delivering Request.body.
Server Actions bodySizeLimit and Pages API bodyParser settings do not configure
this App Router Route Handler.

## SVG example and retention

Replacing the sourcing logo with an SVG validates its XML with saxes before
Sharp reads it. Static shapes, text, gradients, safe inline presentation styles
and internal fragment references are supported. Scripts, handlers, foreignObject,
DTD/entity declarations, processing instructions, external references, embedded
images, animation, stylesheets and unsupported elements/attributes are rejected.
This intentionally restrictive subset may require exporting complex artwork as
PNG or simplifying the SVG first; it does not silently remove artwork.

Sharp checks actual format and pages, applies a 16-million-pixel input limit,
auto-orients rasters, and fits within 1024 × 1024 without cropping or enlarging.
It retains transparency and emits only PNG. AVIF is identified as
format=heif with compression=av1 in the installed version. Animated WebP and APNG
are rejected. Processing has a 10-second Sharp timeout.

The PNG is streamed to the dedicated alliance-sourcing-bd/logos Cloudinary folder
with a fresh UUID and overwrite disabled. Only after successful upload does a
positional MongoDB update replace the selected logo's imageUrl/publicId.
No upsert, whole-document replacement, old asset deletion or local image deletion
occurs. Concurrent replacements use last completed database write wins.

On success, router.refresh() rerenders the settings Server Component and refreshes
the saved preview while retaining the success message. The existing force-dynamic
public layout reads MongoDB on reload and passes the URL into next/image.
An already open public tab needs reloading. No second cache system was introduced.

next.config.ts allows HTTPS res.cloudinary.com only under this cloud's
/image/upload/ path, without query strings or custom ports. Local /public paths
continue to work. dangerouslyAllowSVG is not enabled, and uploaded SVG source is
never served.

If processing or Cloudinary fails, no database update occurs. If upload succeeds
but the write fails or its completion is uncertain, the endpoint reports failure
and retains the new asset: it might be unused or already referenced by a completed
write. Reload settings before retrying. All older assets are retained because they
may still be referenced elsewhere.

## References

- [Sharp metadata and HEIF compression](https://sharp.pixelplumbing.com/api-input/)
- [Sharp input limits](https://sharp.pixelplumbing.com/api-constructor/)
- [Cloudinary Node upload streams](https://cloudinary.com/documentation/node_image_and_video_upload)
- [saxes XML parser and events](https://github.com/lddubeau/saxes)
- Installed Next.js guides: node_modules/next/dist/docs/01-app/
