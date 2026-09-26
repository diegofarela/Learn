# Learn

Public website. This folder is its own git repository. Push it to GitHub and enable Pages.

## Run locally

From the parent workspace:

```bash
docker compose up learn
```

Open [http://localhost:8082](http://localhost:8082). Edits in this folder refresh without `--build`.

## Viewport preview (device sizes)

On localhost / Docker, a **Dev tools** panel appears in the bottom-right (same idea as the portfolio site). Pick Phone / 700 / 820 / 960 / 1280 to open an iframe preview at that width so responsive CSS actually applies.

- Force on: add `?dev=1`
- Force off: add `?dev=0`, or use **Turn off & forget** in the panel

Without Docker:

```bash
npx --yes serve -l 8082
```

## Hosting (GitHub Pages)

1. Push this repo to GitHub (public)
2. **Settings → Pages → Source: GitHub Actions**

First-time public remote (from this folder):

```bash
git remote add origin https://github.com/<you>/<learn-pages-repo>.git
git push -u origin main
```
