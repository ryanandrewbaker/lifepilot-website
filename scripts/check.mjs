import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const config = JSON.parse(read("site.config.json"));
const html = read("public/index.html");
const headers = read("public/_headers");
const wrangler = read("wrangler.jsonc");
const css = read("public/styles.css");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const appLinks = [...html.matchAll(/href="(https:\/\/lifepilot\.mrbakes\.au[^"]*)"/g)].map((match) => match[1]);

assert(config.appUrl.startsWith("https://"), "appUrl must be an https URL");
assert(!config.appUrl.includes("app.masis.au"), "do not point appUrl at app.masis.au yet");
assert(appLinks.length === 3, `expected 3 application links, found ${appLinks.length}`);
assert(appLinks.every((href) => href === config.appUrl), "application links must match site.config.json appUrl");
assert(!html.includes("app.masis.au"), "do not link app.masis.au yet");
assert(!/style\s*=/.test(html), "remove inline style attributes");
assert(!/<script(?![^>]*\bsrc=)/.test(html), "remove inline scripts");
assert(!html.includes("fonts.googleapis.com") && !html.includes("fonts.gstatic.com"), "serve Inter locally");
assert(html.includes('rel="canonical" href="https://masis.au/"'), "canonical URL missing");
assert(html.includes("https://masis.au/assets/og.png"), "Open Graph image missing");
assert(html.includes('class="feature-eyebrow tone-strength"'), "category colour classes missing");
assert(css.includes("/assets/fonts/InterVariable.woff2"), "local Inter font missing from CSS");
assert(headers.includes("Content-Security-Policy:") && !headers.includes("unsafe-inline"), "strict CSP missing");
assert(headers.includes("X-Content-Type-Options: nosniff"), "nosniff missing");
assert(headers.includes("X-Frame-Options: DENY"), "X-Frame-Options missing");
assert(headers.includes("frame-ancestors 'none'"), "frame-ancestors missing");
assert(headers.includes("Referrer-Policy:"), "Referrer-Policy missing");
assert(headers.includes("Permissions-Policy:"), "Permissions-Policy missing");
assert(!headers.includes("includeSubDomains"), "do not set HSTS includeSubDomains");
assert(wrangler.includes('"directory": "./public"'), "assets.directory missing");
assert(wrangler.includes('"not_found_handling": "404-page"'), "404 page handling missing");
assert(!wrangler.includes("single-page-application"), "do not use SPA fallback");
assert(wrangler.includes('"custom_domain": true'), "custom domain missing");
assert(wrangler.includes("masis.au"), "primary domain missing");
assert(!/"main"\s*:/.test(wrangler), "do not add a Worker entry script");
assert(!wrangler.includes("mrbakes.au"), "do not configure mrbakes.au on this Worker");
assert(!wrangler.includes("app.masis.au"), "do not configure app.masis.au yet");

for (const file of [
  "public/404.html",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/site.js",
  "public/favicon.svg",
  "public/favicon-32.png",
  "public/apple-touch-icon.png",
  "public/assets/og.png",
  "public/assets/symbol-white.svg",
  "public/assets/lockup-horizontal-white.svg",
  "public/assets/masis-desktop.webp",
  "public/assets/masis-iphone.webp",
  "public/assets/masis-week-ahead.webp",
  "public/assets/fonts/InterVariable.woff2",
  "public/assets/fonts/OFL.txt",
]) {
  assert(existsSync(join(root, file)), `missing ${file}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("check ok");
