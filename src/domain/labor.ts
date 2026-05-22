/**
 * 운전자 수고비 (왕복) — 50km 구간 단위로 3,000원씩 증가
 *  1~50km   → 3,000원
 *  51~100km → 6,000원
 *  ...
 *  951~1000km → 60,000원
 *
 * 1000km 초과도 동일 기울기(50km당 3,000원)로 외삽한다.
 * 0km는 0원.
 */
export const LABOR_BRACKET_KM = 50;
export const LABOR_BRACKET_FEE = 3000;

export function calcLaborCost(distanceKm: number): number {
  const d = Math.max(0, distanceKm || 0);
  if (d <= 0) return 0;
  const bracket = Math.ceil(d / LABOR_BRACKET_KM);
  return bracket * LABOR_BRACKET_FEE;
}
