# 소소타임 구현 계획

## 1단계: 정적 큐레이션 보드
- Cloudflare Pages에서 `public` 디렉터리를 배포 대상으로 사용한다.
- 첫 화면은 최신 글, 일간 베스트 10, 주간 베스트 10을 동시에 탐색할 수 있게 구성한다.
- 홈 목록은 JavaScript 실행 전에도 글 상세 링크가 보이도록 정적 HTML로 생성한다.
- 초기 게시글은 승인 전 검수형 텍스트 콘텐츠로 제한하고, 얇은 대량 생성 글은 공개하지 않는다.

## 2단계: 글 상세와 SEO
- 글 URL은 `/posts/글-제목/` 형식의 제목 기반 주소를 사용한다.
- 각 글은 고유 HTML, H1, meta description, canonical, Article JSON-LD를 가진다.
- sitemap은 쿼리 URL이 아니라 글 상세 정적 URL만 등록한다.
- robots.txt는 빌드 시 sitemap과 함께 자동 생성한다.

## 3단계: 수집 정책
- 원문 전체를 저장하지 않고 제목, URL, 지표, 검색용 일부 신호만 보관한다.
- 발행 데이터는 자체 제목, 요약, 큐레이터 코멘트, 출처 링크를 사용한다.
- 이미지는 원문 사이트의 직접 링크가 아니라 사용 허가가 확인된 파일만 처리한다.

## 4단계: 이미지와 Cloudflare R2
- 승인된 원문 이미지 URL을 다운로드한 뒤 `.webp`로 변환한다.
- 변환한 WebP 이미지만 Cloudflare R2에 업로드한다.
- R2 키는 `curated/YYYY/MM/{slug}.webp` 형식을 따른다.
- 다운로드, 변환, 업로드 명령은 `npm run image:fetch -- <source-image-url> <post-slug>`를 사용한다.
- 로컬 WebP 파일이 있으면 `npm run image:upload -- ./path/image.webp <post-slug>`를 사용한다.
- 공개 URL은 `R2_PUBLIC_BASE_URL` 환경 변수로 관리하고 게시글의 `image` 필드에는 최종 공개 URL을 저장한다.

## 5단계: 애드센스 준비
- 개인정보처리방침, 이용약관, 문의 및 정정 요청 페이지를 유지한다.
- 승인 전에는 자동 발행보다 검수된 텍스트형 큐레이션 비중을 높인다.
- 카테고리별 콘텐츠 수와 내부 링크를 충분히 확보한다.
