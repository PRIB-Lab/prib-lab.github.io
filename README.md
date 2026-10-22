# PRIB Labs Website V1

A production-oriented single-page institutional website for **PRIB Labs**.

## Architecture

- Static HTML/CSS/JavaScript
- Original procedural Canvas molecular/topology hero
- Cloudflare Workers Static Assets
- Private GitHub repository as source of truth
- No database, CMS, cookies, analytics, stock imagery, or external font/CDN dependency

## Local preview

```bash
python3 -m http.server 8788 -d site
```

Then open `http://localhost:8788`.

## Cloudflare deployment

Install dependencies once:

```bash
npm install
```

Authenticate and deploy:

```bash
npx wrangler login
npm run deploy
```

For Cloudflare Git integration use the private GitHub repository and set the deploy command to:

```bash
npx wrangler deploy
```

No build command is needed because this version is intentionally static.

Then in the Worker open **Settings → Domains & Routes → Add → Custom Domain** and add `priblabs.com`.

## Public content guardrails

Use **PRIB Labs** as the public brand. Do not expose private Gmail, server IPs, credentials, internal HPC paths, unpublished scientific details, or unverified customer/partnership claims.
