// 2026년 기준 공용 계산 엔진 (요율 변경 시 이 파일만 수정)
// 기준일: 2026-07 / 출처: 보건복지부·국민건강보험공단·고용노동부·국세청 고시

export const RATES_2026 = {
  pensionTotal: 0.095, // 국민연금 전체 (근로자 4.75%)
  pensionWorker: 0.0475,
  pensionBaseMin: 410_000, // 기준소득월액 하한 (2026.7~2027.6)
  pensionBaseMax: 6_590_000, // 기준소득월액 상한
  healthTotal: 0.0719, // 건강보험 전체 (근로자 3.595%)
  healthWorker: 0.03595,
  ltcRatio: 0.009448 / 0.0719, // 장기요양 = 건강보험료 × (0.9448/7.19)
  employmentWorker: 0.009, // 고용보험 실업급여분 (근로자)
  minimumWage: 10_320, // 2026 최저시급
  uiDailyMax: 68_100, // 실업급여 1일 상한 (2026.1.1 이후 이직)
  uiDailyMin: 66_048, // 실업급여 1일 하한 (최저임금 80% × 8h)
  interestTaxRate: 0.154, // 이자소득세 14% + 지방소득세 1.4%
};

export const formatKRW = (n: number): string =>
  `${new Intl.NumberFormat("ko-KR").format(Math.round(n))}원`;

/** 원 단위 절사 (10원 미만 버림, 부동소수점 보정) */
export const floor10 = (n: number): number => Math.floor((n + 1e-6) / 10) * 10;

/** 근로소득공제 (연간 총급여 기준, 한도 2,000만 원) */
export function earnedIncomeDeduction(gross: number): number {
  let d: number;
  if (gross <= 5_000_000) d = gross * 0.7;
  else if (gross <= 15_000_000) d = 3_500_000 + (gross - 5_000_000) * 0.4;
  else if (gross <= 45_000_000) d = 7_500_000 + (gross - 15_000_000) * 0.15;
  else if (gross <= 100_000_000) d = 12_000_000 + (gross - 45_000_000) * 0.05;
  else d = 14_750_000 + (gross - 100_000_000) * 0.02;
  return Math.min(d, 20_000_000);
}

/** 종합소득세 기본세율 (6~45%, 8구간) 산출세액 */
export function basicIncomeTax(base: number): number {
  if (base <= 0) return 0;
  if (base <= 14_000_000) return base * 0.06;
  if (base <= 50_000_000) return base * 0.15 - 1_260_000;
  if (base <= 88_000_000) return base * 0.24 - 5_760_000;
  if (base <= 150_000_000) return base * 0.35 - 15_440_000;
  if (base <= 300_000_000) return base * 0.38 - 19_940_000;
  if (base <= 500_000_000) return base * 0.4 - 25_940_000;
  if (base <= 1_000_000_000) return base * 0.42 - 35_940_000;
  return base * 0.45 - 65_940_000;
}

/** 근로소득세액공제 (총급여 구간별 한도 적용) */
export function earnedTaxCredit(calcTax: number, gross: number): number {
  const credit = calcTax <= 1_300_000 ? calcTax * 0.55 : 715_000 + (calcTax - 1_300_000) * 0.3;
  let cap: number;
  if (gross <= 33_000_000) cap = 740_000;
  else if (gross <= 70_000_000) cap = Math.max(660_000, 740_000 - (gross - 33_000_000) * 0.008);
  else if (gross <= 120_000_000) cap = Math.max(500_000, 660_000 - (gross - 70_000_000) * 0.5);
  else cap = Math.max(200_000, 500_000 - (gross - 120_000_000) * 0.5);
  return Math.min(credit, cap);
}

/** 간이세액표 방식 '특별소득공제 등' 근사 (공제대상 가족 수 기준) */
function specialDeductionApprox(gross: number, family: number): number {
  if (family <= 1) return 3_100_000 + gross * 0.04;
  if (family === 2) return 3_600_000 + gross * 0.04;
  return 5_000_000 + gross * 0.07;
}

/** 간이세액표 자녀(8~20세) 월 차감액 근사 */
function childMonthlyCredit(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 12_500;
  if (n === 2) return 29_160;
  return 29_160 + (n - 2) * 25_000;
}

export interface NetPayBreakdown {
  pension: number;
  health: number;
  ltc: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  totalDeduction: number;
  net: number;
}

/**
 * 월 실수령액 분해 (2026년 기준)
 * @param monthlyGross 월 급여(세전)
 * @param monthlyTaxFree 월 비과세액
 * @param family 공제대상 가족 수(본인 포함)
 * @param children 8세 이상 20세 이하 자녀 수
 */
export function netPayBreakdown(
  monthlyGross: number,
  monthlyTaxFree: number,
  family: number,
  children: number,
): NetPayBreakdown {
  const R = RATES_2026;
  const taxable = Math.max(monthlyGross - monthlyTaxFree, 0);

  const pensionBase = Math.min(Math.max(taxable, R.pensionBaseMin), R.pensionBaseMax);
  const pension = floor10(pensionBase * R.pensionWorker);
  const health = floor10(taxable * R.healthWorker);
  const ltc = floor10(health * R.ltcRatio);
  const employment = floor10(taxable * R.employmentWorker);

  // 소득세: 근로소득 간이세액표 산정 방식 근사
  const annualGross = taxable * 12;
  const incomeAmount = annualGross - earnedIncomeDeduction(annualGross);
  const deductions = family * 1_500_000 + pension * 12 + specialDeductionApprox(annualGross, family);
  const taxBase = Math.max(incomeAmount - deductions, 0);
  const calcTax = basicIncomeTax(taxBase);
  const yearTax = Math.max(calcTax - earnedTaxCredit(calcTax, annualGross), 0);
  const incomeTax = Math.max(floor10(yearTax / 12) - childMonthlyCredit(children), 0);
  const localTax = floor10(incomeTax * 0.1);

  const totalDeduction = pension + health + ltc + employment + incomeTax + localTax;
  return { pension, health, ltc, employment, incomeTax, localTax, totalDeduction, net: monthlyGross - totalDeduction };
}
