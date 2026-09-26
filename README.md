# Learn

Public site for organizing and visualizing computer science concepts.
Interactive atlas spanning foundations through MS-prep topics (discrete math,
theory, architecture, distributed systems, ML basics, and more).
Includes a **Stanford MSCS readiness** learning path on the hub: foundations
themes typical of day-one MS CS (not a substitute for official requirements).
This folder is its own git repository.

## Structure

| Path | Role |
|------|------|
| `index.html` | Hub — full concept atlas from `js/catalog.js` |
| `concepts/` | One page per ready concept (explanation + 3D visual + sources) |
| `js/catalog.js` | Master list of all CS concepts (`ready` \| `soon`) + `__LEARN_PATHS__` |
| `js/clarity-meta.js` | Aliases + “not to be confused with” per concept |
| `js/glossary.js` | Hover defs for jargon that is not its own page |
| `js/clarity.js` | Renders Also called / Not to be confused with |
| `js/termify.js` | Auto-links concepts + wraps glossary terms on pages |
| `js/theme.js` | Light / dark / auto theme |
| `js/dev-tools.js` | Localhost viewport preview panel |

## Building concepts

1. Add or mark a concept `status: "ready"` in `js/catalog.js`
2. Create `concepts/{id}.html` with a live visual
3. Add aliases / distinctions in `js/clarity-meta.js`
4. Hyperlink related concepts with `.concept-link` (or rely on termify)
5. Prefer one concept at a time when authoring

## Clarity rules (jargon & naming)

Readers should never wonder whether a technical word is a **new idea** or just **another name**.

1. **Same idea, other names** → list in `clarity-meta.js` `aliases`. The page shows an **Also called** line; each alias is hoverable and means “same concept.”
2. **Related but different** → list in `confusedWith` with a one-line distinction. The page shows **Not to be confused with** (links to the other concept when it has a page).
3. **Jargon without its own page** → add to `js/glossary.js`, or wrap inline:
   ```html
   <abbr class="term" tabindex="0" title="…" data-def="…">amortized</abbr>
   ```
4. **Another concept** → `.concept-link` to that page (termify also auto-links first mentions of catalog names).

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
