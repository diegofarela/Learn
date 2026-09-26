# Learn

Public website. This folder is its own git repository. Push it to GitHub and enable Pages.

## Run locally

From the parent workspace:

```bash
docker compose up learn
```

Open [http://localhost:8082](http://localhost:8082). Edits in this folder refresh without `--build`.

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
