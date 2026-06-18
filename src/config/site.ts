export const siteConfig = {
  name: "복지체크",
  domain: "https://bokjicheck.co.kr",
  defaultTitle: "복지체크 | 2026 복지 자격·급여·생활비 계산기",
  defaultDescription:
    "2026년 복지제도 신청 전 소득, 급여, 세금, 주거비, 생활비를 미리 점검하는 계산기와 정보성 칼럼을 제공합니다.",
  locale: "ko_KR",
  homeMode: "review" as "review" | "directory",
  dataRoot: "check",
  adsenseClientId: "ca-pub-0000000000000000",
};

export const navItems = [
  { href: "/", label: "홈" },
  { href: "/check/", label: "복지 체크도구" },
  { href: "/info/", label: "복지 가이드" },
];
