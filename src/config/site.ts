export const siteConfig = {
  name: "복지CHECK",
  domain: "https://bokjicheck.co.kr",
  publisher: "복지체크 운영팀",
  contactEmail: "anagim7776@gmail.com",
  operatorName: "김안나",
  contactPhone: "010-4740-0766",
  defaultTitle: "복지CHECK | 나에게 맞는 복지서비스 찾기",
  defaultDescription:
    "복잡한 복지정보를 쉽게 확인하고 나에게 맞는 복지서비스를 찾아보는 복지CHECK입니다.",
  locale: "ko_KR",
  homeMode: "directory" as "review" | "directory",
  dataRoot: "check",
  adsenseClientId: "ca-pub-5804969457082424",
};

export const navItems = [
  { href: "/check/", label: "복지서비스 찾기" },
  { href: "/info/", label: "복지정보" },
  { href: "/sources/", label: "공식 출처" },
  { href: "/contact/", label: "문의·정정" },
  { href: "/about/", label: "사이트 소개" },
];
