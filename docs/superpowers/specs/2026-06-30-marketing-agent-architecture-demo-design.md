# Marketing Agent Architecture Demo Design

## Goal

Expose the Marketing Agent Workbench architecture explanation on the personal website as a static public demo, without connecting the local `127.0.0.1:8765` backend service.

## Scope

- Publish the static architecture page from `C:\coding\marketing-agent-workbench\web\architecture.html`.
- Keep the public route under `/demos/marketing-agent-architecture/`.
- Link the route from the existing `src/content/projects/marketing-agent-workbench.md` project page.
- Do not publish the live chat workbench, `/api/*` routes, raw Excel files, API keys, or backend service code through the personal site.

## Architecture

The personal site remains an Astro static site. The architecture demo is copied into `public/demos/marketing-agent-architecture/`, so Astro publishes it as static assets without rendering it through content collections. The copied HTML uses relative `./architecture.css` and `./architecture.js` asset paths so it works under the nested demo route on both public domains.

The project page owns discovery. Its `links` front matter exposes the demo entry, and a short body section explains that the route is static-only.

## Verification

- `npm test` checks required static assets, the project-page link, and relative asset paths.
- `npm run build` proves Astro can build the site with the new public assets.
