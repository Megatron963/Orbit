# Orbit static jsDelivr package

This is a client-only static build for the public GitHub repository `Megatron963/orbit-link`. It cannot run the private Orbit site's server-side `/proxy` endpoint. Scramjet requires HTTPS, a browser with service worker support, and a reachable Wisp server entered in Customize.

## Publish

Upload every file and folder in this package to the root of `Megatron963/orbit-link` on GitHub and commit the changes. Keep the folder structure intact. Then open:

`https://cdn.jsdelivr.net/gh/Megatron963/orbit-link@main/index.svg`

jsDelivr uses a cache; after a new commit, add the commit hash to the CDN URL if the old version remains cached.

## Notes

- The CDN package is public. Do not add private keys or account data.
- `index.svg` bootstraps a scoped service worker that serves `orbit.html` as the app shell.
- Scramjet and its transports are included under `vendor/`; the Wisp server is separate and is not hosted by jsDelivr.
- The included public Mercury relay is only a convenience and may be limited or unavailable for some sites.
- Third-party notices are in `THIRD_PARTY_NOTICES.txt`.
