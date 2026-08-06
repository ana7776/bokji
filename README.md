# Bokji Check

Static Astro site for Korean welfare, income, housing, tax, and living-cost calculators.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is generated in `dist/`.

## Cloudflare Pages

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Production domain: `https://bokjicheck.co.kr`

After deployment, submit `https://bokjicheck.co.kr/sitemap.xml` to Google Search Console and Naver Search Advisor. The site serves this URL as an alias for Astro's generated sitemap index.

See `CLOUDFLARE_PAGES_R2_GUIDE.md` for the full GitHub main branch, Cloudflare Pages, and Cloudflare R2 setup guide.

## Image Pipeline

1. Copy image targets from `src/data/image-sources.example.json` into `src/data/image-sources.json`.
2. Set Cloudflare R2 values in `.env`.
3. Run:

```bash
npm run images:r2
```

The script crawls configured pages or direct image URLs, converts images to WebP, uploads them to R2, and writes `public/image-manifest.json`.
