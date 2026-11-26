# Latin gem page data

Each `.json` file in this directory is an array of gem entries consumed by `scripts/build-latin-gem-pages.cjs`.

Each entry must follow this shape:

```json
{
  "id": "Gems/Absinthus",
  "title": "Absinthus",
  "summary": "Absinthus lapis niger est...",
  "overview": [
    ["Nomina", "Absinthus; Abistos (apud Camillum)."],
    ["Species", "Niger..."],
    ["Locus", "In his testimoniis non indicatur."]
  ],
  "sources": [
    {
      "title": "Albertus Magnus, De mineralibus, tractatus II",
      "href": "../Texts/Albertus%20-%20Book%20of%20Minerals%20-%20Latin.html",
      "text": "ABSINTHUS est de genere gemmarum..."
    }
  ]
}
```

Keep summary and overview Latin simple and grounded in the cited text. Include only claims supported by the cited source passages. Copy source quotations from the Latin source pages verbatim; each `href` must point to the matching Latin source page and, where available, the exact heading anchor. Use actual Latin source passages, not prose translated from English when no Latin source supports it. Source display names may be Latin. Omit unsupported overview rows; use a concise Latin value such as `Non indicatur` only when the English page explicitly has no information for that field.

The builder creates only website files under `la/Gems`, updates Latin locale/search metadata and language routes in `assets/content-index.js`, and creates an alphabetical Latin gem index.
