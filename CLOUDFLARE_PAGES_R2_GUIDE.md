# GitHub, Cloudflare Pages, R2 Image Pipeline Guide

이 문서는 `main` 브랜치에 push하면 Cloudflare Pages가 자동으로 빌드하고 배포하는 환경과, 외부 이미지를 WebP로 최적화한 뒤 Cloudflare R2에 업로드하는 Node.js 자동화 흐름을 한 번에 구성하기 위한 초기 가이드입니다.

## 1. 초기 디렉토리 구조

```text
site-root/
  .env.example
  .gitignore
  astro.config.mjs
  package.json
  package-lock.json
  tsconfig.json
  public/
    _headers
    _redirects
    _worker.js
    ads.txt
    robots.txt
    images/
  scripts/
    image-r2-pipeline.mjs
  src/
    components/
    config/
      site.ts
    content/
      info/
    data/
      image-sources.example.json
      image-sources.json
    layouts/
      BaseLayout.astro
    lib/
    pages/
      index.astro
      check/
      info/
      about.astro
      contact.astro
      privacy.astro
      sources.astro
```

핵심 파일 역할은 다음과 같습니다.

| 파일 | 역할 |
|---|---|
| `package.json` | Astro 빌드, Pages 배포, R2 이미지 업로드 스크립트 실행 명령 관리 |
| `astro.config.mjs` | 정적 사이트 빌드와 sitemap 생성 설정 |
| `public/_headers` | Cloudflare Pages 정적 응답 보안 헤더와 캐시 정책 |
| `public/_redirects` | Cloudflare Pages 리다이렉트 규칙 |
| `public/_worker.js` | `www` 도메인 301 정리와 `/sitemap.xml` 별칭 처리 |
| `src/data/image-sources.json` | 크롤링하거나 직접 업로드할 이미지 URL 목록 |
| `scripts/image-r2-pipeline.mjs` | 이미지 다운로드, WebP 변환, R2 업로드, manifest 생성 |
| `.env.example` | R2, 공공데이터, 이미지 파이프라인 환경변수 예시 |

## 2. package.json 필수 설정

```json
{
  "type": "module",
  "scripts": {
    "dev": "astro dev --host 127.0.0.1",
    "build": "astro check && astro build",
    "preview": "astro preview --host 127.0.0.1",
    "images:r2": "node scripts/image-r2-pipeline.mjs"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/sitemap": "3.2.1",
    "@aws-sdk/client-s3": "^3.1075.0",
    "astro": "^4.16.18",
    "sharp": "^0.35.2",
    "typescript": "^5.6.3"
  }
}
```

설치:

```bash
npm install
```

로컬 빌드 확인:

```bash
npm run build
npm run preview
```

## 3. GitHub main 브랜치 push

처음 GitHub 저장소를 연결할 때:

```bash
git init
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git add .
git commit -m "Initial site setup"
git push -u origin main
```

이후에는 아래 흐름으로 배포합니다.

```bash
git add .
git commit -m "Update site"
git push origin main
```

## 4. Cloudflare Pages 연결

Cloudflare Dashboard에서:

1. Workers & Pages로 이동합니다.
2. Pages 프로젝트를 새로 만들고 GitHub 저장소를 연결합니다.
3. Production branch를 `main`으로 지정합니다.
4. Framework preset은 `Astro`를 선택합니다.
5. Build command는 `npm run build`를 입력합니다.
6. Build output directory는 `dist`를 입력합니다.
7. 저장하면 이후 `main` push마다 자동 빌드와 배포가 실행됩니다.

배포 후 Custom domains에서 `bokjicheck.co.kr` 같은 실제 도메인을 연결합니다. `www` 도메인은 `public/_worker.js`와 `_redirects`로 루트 도메인에 301 정리합니다.

sitemap은 Search Console과 Naver Search Advisor에 아래 주소로 제출합니다.

```text
https://도메인/sitemap.xml
```

내부적으로는 Astro가 생성하는 `sitemap-index.xml`을 반환하므로 자동 생성 구조를 유지하면서도 제출 URL을 단순하게 유지합니다.

## 5. Cloudflare R2 준비

R2에서:

1. R2 bucket을 생성합니다.
2. 공개 이미지 URL을 만들기 위해 R2 custom domain 또는 public bucket URL을 준비합니다.
3. R2 API token을 생성합니다.
4. 권한은 최소 `Object Read & Write`로 두고, 가능하면 해당 bucket으로 scope를 제한합니다.
5. Access Key ID와 Secret Access Key를 `.env`에 저장합니다.

`.env` 예시:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_BASE_URL=https://images.example.com

IMAGE_SOURCE_FILE=src/data/image-sources.json
IMAGE_MANIFEST_FILE=public/image-manifest.json
IMAGE_R2_PREFIX=site-images
IMAGE_WEBP_QUALITY=80
IMAGE_MAX_WIDTH=1600
IMAGE_MAX_DOWNLOAD_BYTES=26214400
IMAGE_FETCH_TIMEOUT_MS=20000
```

R2 S3 호환 endpoint는 다음 형식입니다.

```text
https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
```

이 endpoint는 업로드용이며 최종 이미지 공개 URL이 아닙니다. 운영 환경에서는 R2 bucket의
**Settings > Custom Domains**에서 `images.example.com` 같은 도메인을 연결하고 그 주소를
`R2_PUBLIC_BASE_URL`에 넣습니다. `r2.dev` 주소는 개발용이며 rate limit이 있고 Cloudflare
Cache, WAF, Bot Management를 지원하지 않으므로 운영 이미지 호스트에는 권장하지 않습니다.

## 6. 이미지 소스 파일

`src/data/image-sources.json`에 업로드할 이미지를 정의합니다.

```json
[
  {
    "id": "direct-hero",
    "imageUrl": "https://example.com/hero.jpg",
    "alt": "메인 히어로 이미지",
    "tags": ["home", "hero"]
  },
  {
    "id": "article-first-image",
    "pageUrl": "https://example.com/article",
    "limit": 1,
    "alt": "글 본문 대표 이미지",
    "tags": ["article"]
  },
  {
    "id": "gallery-images",
    "pageUrl": "https://example.com/gallery",
    "pick": "all",
    "alt": "갤러리 이미지",
    "tags": ["gallery"]
  }
]
```

지원 입력:

| 필드 | 설명 |
|---|---|
| `imageUrl` | 직접 다운로드할 이미지 URL |
| `imageUrls` | 여러 직접 이미지 URL 배열 |
| `pageUrl` | HTML을 가져와 이미지 후보를 찾을 페이지 URL |
| `limit` | 페이지에서 앞쪽 몇 개 이미지만 선택할지 |
| `pick: "all"` | 페이지에서 발견한 이미지 후보 전체 처리 |
| `alt` | manifest에 저장할 대체 텍스트 |
| `tags` | manifest 필터링용 태그 |

## 7. R2 업로드 실행

```bash
npm run images:r2
```

스크립트 동작:

1. `src/data/image-sources.json`을 읽습니다.
2. `imageUrl`은 바로 다운로드합니다.
3. `pageUrl`은 HTML을 가져와 `og:image`, `twitter:image`, `link rel=image_src`, `img src`, `img srcset` 후보를 찾습니다.
4. 이미지를 다운로드합니다.
5. `sharp`로 회전 보정, 최대 너비 제한, WebP 품질 80 변환을 수행합니다.
6. `@aws-sdk/client-s3`의 `PutObjectCommand`로 R2에 업로드합니다.
7. 최종 공개 URL을 콘솔에 출력하고 `public/image-manifest.json`에 저장합니다.

한 건이라도 다운로드·변환·업로드에 실패하면 스크립트는 종료 코드 `1`을 반환하므로 CI나
Pages 빌드가 불완전한 manifest를 성공으로 오인하지 않습니다. 기본 다운로드 상한은 25 MiB이며
`IMAGE_MAX_DOWNLOAD_BYTES`로 조정할 수 있습니다.

manifest 예시:

```json
[
  {
    "id": "direct-hero",
    "url": "https://images.example.com/site-images/direct-hero-abc123.webp",
    "publicUrl": "https://images.example.com/site-images/direct-hero-abc123.webp",
    "key": "site-images/direct-hero-abc123.webp",
    "alt": "메인 히어로 이미지",
    "width": 1600,
    "height": 900,
    "originalBytes": 512000,
    "webpBytes": 134000,
    "compressionRatio": 0.2617,
    "sourcePageUrl": null,
    "sourceImageUrl": "https://example.com/hero.jpg",
    "sourceContentType": "image/jpeg",
    "tags": ["home", "hero"],
    "updatedAt": "2026-06-30T00:00:00.000Z"
  }
]
```

## 8. 운영 방식 선택

권장 방식은 로컬 또는 별도 CI에서 이미지를 업로드하고, 생성된 `public/image-manifest.json`을 커밋한 뒤 Pages는 정적 빌드만 수행하는 방식입니다.

```bash
npm run images:r2
npm run build
git add public/image-manifest.json src/data/image-sources.json
git commit -m "Update optimized image manifest"
git push origin main
```

Cloudflare Pages 빌드 중 매번 이미지를 새로 업로드하고 싶다면 Pages 환경변수에 R2 값을 모두 등록하고 Build command를 아래처럼 바꿀 수 있습니다.

```bash
npm run images:r2 && npm run build
```

다만 외부 이미지 URL 장애, 원본 사이트 차단, R2 API 제한 때문에 배포가 실패할 수 있으므로 운영 배포에서는 로컬 또는 별도 CI 실행을 권장합니다.

## 9. 공식 문서

- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Cloudflare Pages Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare R2 S3 SDK setup](https://developers.cloudflare.com/r2/get-started/s3/)
- [Cloudflare R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [Cloudflare R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
