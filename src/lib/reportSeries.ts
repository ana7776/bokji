// 모든 가이드 글은 하나의 리포트에 속하도록 유지합니다.
// 시리즈에 없는 글은 "다음 글" 안내가 붙지 않아 고립되기 쉽습니다.
// slug 는 시리즈 간 중복되지 않게 관리합니다(조회 시 첫 시리즈만 매칭됩니다).
export const reportSeries = [
  {
    title: "기초생활보장 신청 전 소득·재산 리포트",
    description:
      "중위소득, 가구원, 소득인정액, 금융재산과 주거용재산, 급여별 기준을 신청 전 점검 순서로 이어서 봅니다.",
    slugs: [
      "median-income-basic",
      "household-member-standard",
      "basic-livelihood-income-recognition",
      "financial-asset-standard",
      "housing-property-limit-2026",
      "basic-livelihood-car-property-check",
      "basic-livelihood-benefit-threshold-2026",
      "basic-livelihood-benefit-simulation-2026",
    ],
  },
  {
    title: "주거급여와 월 주거비 점검 리포트",
    description:
      "기준임대료, 가족 간 임대차계약, 실제 월세·전세대출 이자, 이사 초기비용을 함께 정리해 주거지원 판단 흐름을 만듭니다.",
    slugs: [
      "housing-benefit-standard-rent-2026",
      "housing-benefit-cost-check",
      "family-lease-housing-benefit",
      "public-rental-income-standard-2026",
      "area-size-housing-support",
      "moving-cost-check",
      "debt-and-welfare-check",
    ],
  },
  {
    title: "근로·프리랜서 소득 확인 리포트",
    description:
      "세전소득, 세후소득, 3.3% 정산, 건강보험료, 사업소득 자료를 구분해 복지 신청 전 소득 기준을 점검합니다.",
    slugs: [
      "welfare-income-standard-2026",
      "minimum-wage-and-welfare",
      "annual-leave-final-pay",
      "work-incentive-income-check",
      "freelancer-welfare-income",
      "freelancer-tax-settlement-guide",
      "self-employed-vat-income",
      "health-insurance-premium-check",
    ],
  },
  {
    title: "기초연금과 노후 소득 리포트",
    description:
      "기초연금 소득인정액, 지역별 기본재산액, 공식 모의계산, 은퇴 후 소득 공백을 순서대로 확인합니다.",
    slugs: [
      "basic-pension-income-check-2026",
      "basic-pension-property-deduction-2026",
      "basic-pension-official-simulation-guide",
      "retirement-income-gap",
    ],
  },
  {
    title: "대상별 복지 확인 리포트",
    description:
      "청년, 차상위, 의료급여 부양의무자, 장애인 복지자료처럼 대상에 따라 달라지는 기준을 나눠 봅니다.",
    slugs: [
      "youth-welfare-income-check",
      "near-poverty-simulation-guide",
      "medical-benefit-family-support",
      "disability-welfare-resource-check",
    ],
  },
  {
    title: "생활비와 긴급 상황 리포트",
    description:
      "가처분소득, 공과금과 통신비 부담, 갑작스러운 위기상황에서의 긴급복지 준비를 함께 정리합니다.",
    slugs: [
      "disposable-income-guide",
      "utility-cost-welfare",
      "telecom-cost-saving",
      "emergency-welfare-before-apply",
    ],
  },
  {
    title: "공식자료와 신청 준비 리포트",
    description:
      "복지로 모의계산, 공공데이터, 지역 복지사업, 신청 서류를 연결해 최종 확인 경로를 정리합니다.",
    slugs: [
      "bokjiro-simulation-before-apply",
      "welfare-public-data-source-guide",
      "local-welfare-public-data-check",
      "local-welfare-search-guide",
      "welfare-documents-checklist",
    ],
  },
];
