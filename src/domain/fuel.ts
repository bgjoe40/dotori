/**
 * 유류비 계산 — km당 단가 기본 170원 (연비 11km/L, 유가 1,860원/L 기준 환산)
 *  fuelCost = round(distanceKm * ratePerKm) + tollFee + parkingFee
 */
export const FUEL_RATE_PER_KM = 170;

export function calcFuelCost(
  distanceKm: number,
  tollFee = 0,
  parkingFee = 0,
  ratePerKm = FUEL_RATE_PER_KM,
): number {
  const d = Math.max(0, distanceKm || 0);
  const toll = Math.max(0, tollFee || 0);
  const park = Math.max(0, parkingFee || 0);
  const rate = Math.max(0, ratePerKm || FUEL_RATE_PER_KM);
  return Math.round(d * rate) + toll + park;
}
