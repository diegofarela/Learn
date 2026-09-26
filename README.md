# Learn

Public site for organizing and visualizing computer science concepts in 3D.
This folder is its own git repository.

## Structure

| Path | Role |
|------|------|
| `index.html` | Hub — full concept atlas from `js/catalog.js` |
| `concepts/` | One page per ready concept (explanation + 3D visual + sources) |
| `js/catalog.js` | Master list of all CS concepts (`ready` \| `soon`) |
| `js/theme.js` | Light / dark / auto theme |
| `js/dev-tools.js` | Localhost viewport preview panel |

## Building concepts

1. Add or mark a concept `status: "ready"` in `js/catalog.js`
2. Create `concepts/{id}.html` with a live visual
3. Hyperlink related concepts with `.concept-link`
4. Go one concept at a time (current: **Stack**)

## Citation rule

If a passage is **word-for-word** from another source, wrap it in a `.verbatim` block and link the original:

```html
<figure class="verbatim">
  <blockquote cite="https://example.com/page">
    <p>“Exact quote here.”</p>
  </blockquote>
  <figcaption class="source">
    Verbatim from
    <a href="https://example.com/page" rel="noopener noreferrer" target="_blank"
      >Title — Site</a
    >
  </figcaption>
</figure>
```

Paraphrases in your own words do not need a verbatim block.

## Run locally

From the parent workspace:

```bash
docker compose up learn
```

Open [http://localhost:8082](http://localhost:8082).

Without Docker:

```bash
npx --yes serve -l 8082
```

## Viewport preview

On localhost, a **Dev tools** panel appears (bottom-right). Presets open an iframe so `@media` rules fire.

- Force on: `?dev=1`
- Force off: `?dev=0`
