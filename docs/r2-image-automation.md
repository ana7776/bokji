# Cloudflare R2 이미지 자동화 점검

최종 정리일: 2026-07-04

## 현재 결론

이미지 자동화 코드 틀은 준비되어 있습니다.

지원 흐름:

```text
외부 이미지 URL 또는 로컬 이미지
→ 권한/출처 검토
→ 다운로드 또는 파일 읽기
→ Sharp로 WebP 변환
→ 1200x675 리사이즈
→ Cloudflare R2 업로드
→ 공개 이미지 URL 반환
→ posts.json의 image 필드에 반영
→ npm run build
```

## 구현 파일

```text
scripts/lib/r2-images.js       공통 로직: 다운로드, WebP 변환, R2 업로드, 결과 JSON 생성
scripts/fetch-r2-image.js      외부 이미지 URL → WebP 변환 → R2 업로드
scripts/upload-r2-image.js     로컬 이미지 파일 → WebP 변환 → R2 업로드
```

## 환경 변수

로컬에서는 `.env`, GitHub Actions와 Cloudflare Pages에서는 Secret/환경 변수로 등록합니다.

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=sosotime-images
R2_PUBLIC_BASE_URL=https://images.sosotime.com

IMAGE_MAX_BYTES=12582912
IMAGE_WIDTH=1200
IMAGE_HEIGHT=675
IMAGE_WEBP_QUALITY=80
IMAGE_RESIZE_FIT=cover
KEEP_IMAGE_TMP=0
```

## 외부 이미지 URL 처리

권한이 확인된 이미지 URL만 사용합니다.

```bash
npm run image:fetch -- "https://example.com/source.jpg" "cafe-order-mistake"
```

R2 업로드 없이 변환 결과만 검증:

```bash
npm run image:fetch -- "https://example.com/source.jpg" "cafe-order-mistake" --dry-run
```

## 로컬 이미지 처리

```bash
npm run image:upload -- "./source/photo.png" "cafe-order-mistake"
```

R2 업로드 없이 변환 결과만 검증:

```bash
npm run image:upload -- "./source/photo.png" "cafe-order-mistake" --dry-run
```

## 출력 예시

```json
{
  "sourceUrl": "https://example.com/source.jpg",
  "sourceContentType": "image/jpeg",
  "sourceBytes": 512000,
  "optimizedBytes": 132400,
  "width": 1200,
  "height": 675,
  "quality": 80,
  "fit": "cover",
  "bucket": "sosotime-images",
  "key": "curated/2026/07/cafe-order-mistake.webp",
  "publicUrl": "https://images.sosotime.com/curated/2026/07/cafe-order-mistake.webp"
}
```

## posts.json 반영 방식

업로드 결과의 `publicUrl`을 해당 글의 `image` 필드에 넣습니다.

```json
{
  "title": "카페에서 들린 주문 실수에 모두가 웃은 이유",
  "image": "https://images.sosotime.com/curated/2026/07/cafe-order-mistake.webp"
}
```

그 다음 정적 파일을 다시 생성합니다.

```bash
npm run build
```

## 승인 전 주의사항

- 커뮤니티 원문 이미지를 무단 복제하지 않습니다.
- 직접 만든 이미지, 권한이 확인된 이미지, 무료 라이선스 이미지, AI 생성 이미지 위주로 사용합니다.
- 외부 이미지는 반드시 출처와 사용 가능 여부를 검토한 뒤 업로드합니다.
- R2 키는 ASCII 안전 슬러그를 사용합니다. 한글 제목만 전달되면 `image-<hash>` 형태로 안전 키를 자동 생성합니다.
- 업로드 결과 JSON은 `.tmp/images`에 저장되며, 실제 WebP 임시 파일은 `KEEP_IMAGE_TMP=1`일 때만 유지합니다.
