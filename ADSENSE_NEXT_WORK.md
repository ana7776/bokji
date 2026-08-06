# AdSense Next Work

작업 예정일: 2026-07-06

## 현재 상태

- Google Search Console 기준 색인 생성 페이지: 46개
- 미색인 페이지: 43개
- 사이트맵 제출 상태: `/sitemap-0.xml` 성공 확인
- AdSense 기본 준비:
  - `ads.txt` 있음
  - `<head>` AdSense 스크립트 있음
  - 소개, 문의, 개인정보처리방침, 편집·검수 기준, 공식 출처 페이지 있음

## 다음 작업 목표

검색 유입 키워드와 실제 사용자 질문에 맞춰 콘텐츠 전문성을 더 강화하고, AdSense 심사 전 사이트가 얇은 계산기 보조 페이지처럼 보이지 않도록 보강한다.

## 우선 점검할 키워드 축

1. 생계급여
   - 생계급여 계산기
   - 복지로 생계급여 모의계산
   - 2026년 생계급여 선정기준

2. 주거급여
   - 주거급여 계산기
   - 2026년 주거급여 기준임대료
   - 지역별 급지 구분
   - 부천 기준임대료
   - 기준임대료만큼만 지급되는지

3. 소득인정액
   - 2026년 소득인정액
   - 재산의 소득환산액 0원
   - 한부모 탈락 시 재산 환산 기준

4. 통장잔액과 금융재산
   - 통장잔액 계산 기준
   - 예금이자 반영 여부
   - 주거급여 소득인정액 예금이자

5. LH 전세임대와 공공임대
   - LH 전세임대 가구원 수
   - 2인 가구 월평균 소득 합산
   - 세전/세후 소득 기준
   - 국민임대, 행복주택, 통합공공임대 연결

## 이미 보강한 글

- `src/content/info/basic-livelihood-benefit-simulation-2026.md`
- `src/content/info/housing-benefit-standard-rent-2026.md`
- `src/content/info/basic-livelihood-income-recognition.md`
- `src/content/info/financial-asset-standard.md`
- `src/content/info/basic-pension-income-check-2026.md`
- `src/content/info/housing-benefit-cost-check.md`
- `src/content/info/public-rental-income-standard-2026.md`

## 다음에 할 일

1. Google Search Console에서 색인 생성 페이지 수 변화 확인
2. 미색인 사유 중 `발견됨 - 현재 색인이 생성되지 않음`, `크롤링됨 - 현재 색인이 생성되지 않음` URL 확인
3. 위 URL 중 핵심 글 5~10개를 URL 검사로 개별 색인 요청
4. 검색 유입 키워드와 연결되는 글의 본문 길이, 표, 질문형 답변, 공식 출처 링크 추가 점검
5. 계산기만 있는 페이지가 얇아 보이지 않도록 관련 가이드 링크와 설명 문단 보강
6. 복지·소득·재산 관련 글마다 공식 출처, 신청 전 참고용 안내, 최종 판단은 담당 기관 기준이라는 문구 확인

## 우선 색인 요청 후보

```txt
https://bokjicheck.co.kr/info/housing-benefit-standard-rent-2026/
https://bokjicheck.co.kr/info/basic-livelihood-benefit-simulation-2026/
https://bokjicheck.co.kr/info/basic-livelihood-income-recognition/
https://bokjicheck.co.kr/info/financial-asset-standard/
https://bokjicheck.co.kr/info/basic-pension-income-check-2026/
https://bokjicheck.co.kr/info/housing-benefit-cost-check/
https://bokjicheck.co.kr/info/public-rental-income-standard-2026/
```

## AdSense 신청 전 판단 기준

- 색인 생성 페이지가 50~60개 이상으로 늘면 신청 안정성이 더 좋아짐
- 검색 노출과 클릭이 며칠 더 이어지면 긍정 신호
- 큰 구조 변경은 피하고, 기존 글의 전문성·출처·내부링크 위주로 보강
- 신청 직전 `astro check` 통과 확인
