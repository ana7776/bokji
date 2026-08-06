# 검색 색인 제출 주소 정리

최종 정리일: 2026-07-04

## 제출 원칙

- 대표 도메인은 `https://sosotime.com`만 사용합니다.
- `http://`, `www`, `127.0.0.1`, `localhost`, `*.pages.dev` 주소는 색인 제출하지 않습니다.
- `?category=`, `?rank=`, `?q=`가 붙은 필터/검색 URL은 중복 색인이 될 수 있으므로 제출하지 않습니다.
- 가장 먼저 sitemap을 제출하고, 그 다음 홈과 주요 게시글만 URL 검사로 색인 요청합니다.

## 1순위 제출

```text
https://sosotime.com/sitemap.xml
https://sosotime.com/robots.txt
https://sosotime.com/
```

## 기본 페이지

```text
https://sosotime.com/
https://sosotime.com/about
https://sosotime.com/contact
https://sosotime.com/upload
https://sosotime.com/report
https://sosotime.com/policy/editorial
https://sosotime.com/policy/privacy
https://sosotime.com/policy/terms
```

## 우선 색인 요청 게시글

```text
https://sosotime.com/posts/cafe-order-mistake/
https://sosotime.com/posts/cat-box-takeover/
https://sosotime.com/posts/subway-door-timing/
https://sosotime.com/posts/group-chat-emoticon/
https://sosotime.com/posts/convenience-store-new-review/
https://sosotime.com/posts/스포츠-장면-하나가-유머-글로-번지는-이유/
https://sosotime.com/posts/출근길-목격담이-댓글을-빠르게-모으는-이유/
```

## 전체 게시글 URL

```text
https://sosotime.com/posts/cafe-order-mistake/
https://sosotime.com/posts/cat-box-takeover/
https://sosotime.com/posts/subway-door-timing/
https://sosotime.com/posts/group-chat-emoticon/
https://sosotime.com/posts/convenience-store-new-review/
https://sosotime.com/posts/퇴근길-지하철에서-모두가-조용해진-순간/
https://sosotime.com/posts/마트-계산대-앞에서-생긴-작은-오해/
https://sosotime.com/posts/질문-글이-답변을-많이-받는-방식/
https://sosotime.com/posts/사진-한-장이-설명보다-빠르게-퍼지는-이유/
https://sosotime.com/posts/배달-도착-알림-하나로-하루-기분이-바뀌는-이유/
https://sosotime.com/posts/편의점-앞에서-생긴-작은-착각/
https://sosotime.com/posts/직장-탕비실에서-입장이-갈리는-사소한-기준/
https://sosotime.com/posts/중고거래-약속-장소를-고를-때-확인할-것/
https://sosotime.com/posts/긴-제목이-클릭을-부르는-때와-피로하게-만드는-때/
https://sosotime.com/posts/저녁-게시판에-농담-글이-몰리는-이유/
https://sosotime.com/posts/사소한-인증-글이-오래-회자되는-조건/
https://sosotime.com/posts/버스에서-들린-소리에-사람들이-보인-반응/
https://sosotime.com/posts/베스트-글에서-반복되는-공통-구조/
https://sosotime.com/posts/동네-식당-후기에서-사람들이-먼저-보는-정보/
https://sosotime.com/posts/반려동물-사진-글을-과하게-설명하지-않아도-되는-이유/
https://sosotime.com/posts/커뮤니티-농담이-오해를-부르는-순간/
https://sosotime.com/posts/온라인-사과문이-받아들여지지-않는-이유/
https://sosotime.com/posts/출근-준비-시간이-늘-부족한-사람들의-공통점/
https://sosotime.com/posts/링크만-던져진-글보다-한눈에-보이는-글이-편한-이유/
https://sosotime.com/posts/가벼운-농담-글이-댓글을-많이-받는-이유/
https://sosotime.com/posts/스포츠-장면-하나가-유머-글로-번지는-이유/
https://sosotime.com/posts/출근길-목격담이-댓글을-빠르게-모으는-이유/
```

## Google Search Console 제출 순서

1. `Sitemaps` 메뉴에 `https://sosotime.com/sitemap.xml` 제출
2. URL 검사에서 `https://sosotime.com/` 색인 생성 요청
3. 우선 색인 요청 게시글 5개를 URL 검사로 제출
4. 나머지 게시글은 sitemap 수집을 기다리되, 중요한 글만 추가로 URL 검사 요청

## Naver Search Advisor 제출 순서

1. 사이트 등록: `https://sosotime.com`
2. 소유 확인 후 sitemap 제출: `https://sosotime.com/sitemap.xml`
3. robots 확인: `https://sosotime.com/robots.txt`
4. 웹 페이지 수집 요청에는 홈과 우선 색인 요청 게시글만 먼저 제출

## Bing Webmaster Tools 제출 순서

1. 사이트 추가: `https://sosotime.com`
2. sitemap 제출: `https://sosotime.com/sitemap.xml`
3. URL 제출에는 홈과 우선 색인 요청 게시글만 먼저 제출

## 배포 후 확인 주소

```text
https://sosotime.com/
https://sosotime.com/sitemap.xml
https://sosotime.com/robots.txt
```
