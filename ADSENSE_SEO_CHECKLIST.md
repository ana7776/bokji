# AdSense and SEO Readiness Checklist

Last checked: 2026-08-15

## Current Site Position

- Static Astro site prepared for Cloudflare Pages.
- Main concept: Korean welfare, income, housing, tax, and living-cost calculators with supporting guides.
- Current build output: static pages under `dist/`.
- Main domain in config: `https://bokjicheck.co.kr`.

## AdSense Approval Readiness

### Strong Points

- Clear site topic: welfare application preparation, income standards, assets, housing costs, and living costs.
- No login, comments, or admin area required for public use.
- Core trust pages exist: about, contact, privacy policy, terms of service, editorial policy, and official sources.
- `/terms/` was added on 2026-08-15 and is linked from the global footer. It is written against the actual service (no sign-up, no payment, no application proxy) rather than copied boilerplate.
- AdSense publisher ID is configured as `ca-pub-5804969457082424`.
- `public/ads.txt` is present with the matching publisher account.
- AdSense ownership signals are available through the global script tag, `ads.txt`, and the `google-adsense-account` meta tag.
- `robots.txt` explicitly allows `Mediapartners-Google` and `Google-Display-Ads-Bot`, and points crawlers to `/sitemap.xml`.
- `/sitemap.xml` is aliased to the Astro-generated `/sitemap-index.xml` for Google Search Console and Naver Search Advisor submission.
- The privacy policy includes Google advertising cookie disclosure and an opt-out link.
- A Cloudflare Pages `_worker.js` redirects `www.bokjicheck.co.kr` to the canonical root domain before assets are served.
- Calculator pages include disclaimers that results are for reference and must be confirmed with official institutions.

### Resolved on 2026-08-15

- Fixed 26 broken markdown tables across 25 of the 35 guide posts. The delimiter row had two cells against a three-cell header, so GFM refused to parse them and the "신청 전 체크" table rendered as raw `| ... | ... |` text on nearly every guide page. Verified after rebuild: zero raw pipe rows in `dist`, 80 `<table>` elements across the info pages.
- Added the missing terms of service page required by the operations guide's trust-page list.
- Added two guide posts for search queries that had impressions but no dedicated page: `housing-property-limit-2026.md` (주거용재산 한도액) and `near-poverty-simulation-guide.md` (차상위계층 모의계산). Both are wired into `reportSeries` reading paths so they are not orphaned.

### Resolved on 2026-08-15 (second pass, guide chapters 4 → 3 → 2 → 8)

- **4.2 Mobile usability.** Every page except the home page rendered its content flush at x=0 with no horizontal padding, on desktop as well as mobile. Verified with Chromium at 360/768/1440px before and after: text inset went from 0px everywhere to 18/31/92px, with zero horizontal overflow. All pages now align to the same 1320px grid the header already used.
- **4.1 Missing 404 page.** Added `/404/` with links to the calculators, guides, sources and contact plus the six most recently updated posts. Returns a real 404 status and is excluded from the sitemap.
- **2.4 Representative posts.** `featured` was set on 21 of 37 posts and read by nothing. Reduced to three posts with non-overlapping roles (입문 / 실전 / 문제 해결) via new `featuredRole` and `featuredNote` fields, surfaced on the home page and `/info/`.
- **4.4 Image hygiene.** `public/images/bokjicheck-reference.png` was a 1.3MB design mockup, unreferenced but publicly deployed, showing features the site does not have (로그인, 회원가입, 복지뉴스, 복지상담, 커뮤니티). Moved to `design/` so it is no longer served.
- **8.3 Thin content.** Nine posts were under 800 Korean characters. All were expanded with substantive sections; the site now has zero posts under 800 characters and the median rose from 891 to 1146. Verified 0 broken internal links after adding roughly 30 new cross-links.

### Resolved on 2026-08-15 (third pass, guide chapters 3.4 and 2.3)

- **3.4 Internal linking.** 17 of the guide posts belonged to no report series, so they never rendered a "next reading" path and were reachable only through tag-matched related cards. Restructured into 7 series so that all 40 posts belong to exactly one path, verified programmatically (no duplicates, no missing slugs).
- **Three more posts for measured search demand**, each targeting queries that had impressions but no dedicated page: `basic-pension-property-deduction-2026.md` (기초연금 기본재산액, the only query axis that has produced a click), `family-lease-housing-benefit.md` (1촌 직계혈족 임대차계약, position 6), and `freelancer-tax-settlement-guide.md` (the 3.3% cluster, ~32 impressions at positions 31-58). The freelancer post is deliberately written from the tax-settlement angle so it does not duplicate the existing welfare-income post or the calculator.

### Gaps to Keep Improving

- Impressions collapsed from 55-77/day to 0-2/day after 2026-07-21, overlapping the Cloudflare Pages build-output problem fixed on 2026-08-07. Track recovery over the next few weeks before drawing content conclusions from the numbers.
- `/check/income/freelance/freelancer-tax-3-3/` holds 49 impressions at average position 35.6 with no clicks, the weakest ranking cluster on the site. Improve through internal links and supporting explanation rather than a new overlapping post.
- Several early guide posts have been expanded; continue reviewing any post under roughly 800 Korean characters.
- Every calculator should eventually include official source references, especially salary, loan, housing, and utility calculators.
- Replace symbolic ad slot names with numeric AdSense slot IDs if manual in-article ad units are created.
- Keep `ads.txt` synchronized with the active AdSense account.

## SEO Structure

### Implemented

- Canonical URLs are generated from `siteConfig.domain`.
- `robots.txt` allows crawling and points to the sitemap index.
- Astro sitemap generation is enabled.
- Article pages include `Article` and breadcrumb structured data.
- Calculator pages include `WebApplication`, FAQ, and breadcrumb structured data when applicable.
- Cloudflare Pages redirect added from `www` to the root domain.

### Recommended Submission Steps

1. Deploy the site to Cloudflare Pages.
2. Connect the custom domain `bokjicheck.co.kr`.
3. Submit `https://bokjicheck.co.kr/sitemap-index.xml` to Google Search Console.
4. Submit the same sitemap in Naver Search Advisor.
5. Use Naver Site Check after deployment to confirm robots, title, description, and canonical detection.

## Content Expansion Targets

Recently expanded guide posts:

- `utility-cost-welfare.md`
- `area-size-housing-support.md`
- `financial-asset-standard.md`
- `self-employed-vat-income.md`
- `moving-cost-check.md`
- `telecom-cost-saving.md`
- `welfare-documents-checklist.md`
- `freelancer-welfare-income.md`
- `retirement-income-gap.md`
- `work-incentive-income-check.md`
- `local-welfare-search-guide.md`
- `welfare-income-standard-2026.md`
- `local-welfare-public-data-check.md`
- `disability-welfare-resource-check.md`
- `basic-livelihood-benefit-threshold-2026.md`
- `basic-livelihood-car-property-check.md`
- `basic-pension-income-check-2026.md`
- `housing-benefit-standard-rent-2026.md`

Next posts to review for depth:

- `health-insurance-premium-check.md`

Each article should ideally include:

- Who should read it.
- What to prepare before checking.
- A table of key standards or documents.
- Common mistakes.
- Related calculator links.
- Official source links.
- A short final caution about confirming the latest official standard.

## Cloudflare Pages Settings

- Framework preset: Astro.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Node version: use the current LTS version supported by Cloudflare Pages.

## Image Pipeline

- Put image crawl targets in `src/data/image-sources.json`.
- Run `npm run images:r2` after setting the R2 environment variables in `.env`.
- The script downloads candidate images, converts them to WebP, uploads them to R2 through the S3-compatible endpoint, and writes `public/image-manifest.json`.
- Use only images you have permission to reuse. Prefer public-sector/open-license images, direct official assets, or owned generated assets.
