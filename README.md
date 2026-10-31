# Masis marketing

Public homepage for [masis.au](https://masis.au). It is a static site on Cloudflare Workers Static Assets, in its own repository. The application stays at `https://lifepilot.mrbakes.au` until a later migration.

## Local development

```bash
npm install
npm run dev
```

Wrangler serves `public/` locally. There is no framework build.

`npm run check` confirms the application links match `site.config.json`, the page can use a strict Content Security Policy, Inter is local, and this Worker does not claim `app.masis.au` or `mrbakes.au`.

## Deploy

The Cloudflare account must already be logged in (`npx wrangler login`) and the `masis.au` zone must be active. Deployment attaches `masis.au` as a Worker Custom Domain. Cloudflare creates that DNS record and the certificate. Do not change records on `mrbakes.au`.

```bash
npm run deploy:dry-run
npm run deploy
```

`app.masis.au` is intentionally not configured.

## Dashboard steps still required

Wrangler attached `masis.au` and Cloudflare issued its certificate. The logged-in token can deploy Workers, but it cannot edit zone DNS, Redirect Rules, or SSL/TLS settings. These two dashboard actions are still required. Do not change any record on `mrbakes.au`.

**HTTPS-only.** In the `masis.au` zone, open **SSL/TLS** → **Edge Certificates** and turn on **Always Use HTTPS**. Leave HSTS `includeSubDomains` and preload off while `app.masis.au` is unconfigured.

## www.masis.au

`www.masis.au` has no DNS record yet, so it does not resolve. The apex is the only hostname on this Worker. Send `www` to the apex with a Redirect Rule, not a second site and not a Worker script.

1. In the `masis.au` zone, open **DNS** and add a proxied `A` record for `www` pointing at `192.0.2.0`. `192.0.2.0` is a placeholder. Proxied traffic never reaches it.
2. Open **Rules** → **Redirect Rules** → **Create rule**.
3. Match **Hostname equals** `www.masis.au`.
4. Choose **Dynamic** redirect, status **301**, and preserve the query string.
5. Set the expression to `concat("https://masis.au", http.request.uri.path)`.

Leave **Always Use HTTPS** enabled for the zone. Do not enable HSTS `includeSubDomains` or preload while `app.masis.au` is still unconfigured.

## Change the application link

`site.config.json` is the source of truth for the in-app destination. Today that is `https://lifepilot.mrbakes.au/today`. Update `appUrl` and the three matching `href`s in `public/index.html` together. `npm run check` fails if they diverge. Do not switch them to `app.masis.au` until that migration is requested.

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback
```

Rollback restores the previous Worker version of this site. It does not roll back DNS, certificates, or the www Redirect Rule, and it does not affect the application.

## Screenshots

The product screens are the real Masis interface with publication edits: medication status, the location line, personal measurements, and the food log are replaced with example figures. Living-card photographs are replaced with category colours because their rights metadata is unverified. The Mount Ararat symbol and horizontal lockup are the approved SVG files, unchanged.

## Scope

This repository does not deploy the LifePilot web application, the Apple apps, or any API. It does not use KV, R2, D1, or a Worker script for normal page requests.
