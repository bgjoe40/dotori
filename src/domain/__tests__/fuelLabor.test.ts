import { describe, expect, it } from 'vitest';
import { calcFuelCost } from '../fuel';
import { calcLaborCost } from '../labor';

describe('calcFuelCost', () => {
  it('100km, 톨비 0, 주차비 0 → 17,000원', () => {
    expect(calcFuelCost(100, 0, 0)).toBe(17000);
  });
  it('200km + 톨비 5,000 + 주차비 2,000 → 41,000원', () => {
    expect(calcFuelCost(200, 5000, 2000)).toBe(41000);
  });
  it('음수 입력은 0으로 취급', () => {
    expect(calcFuelCost(-10, -1, -2)).toBe(0);
  });
  it('소수 거리도 반올림', () => {
    // 12.3 * 170 = 2091
    expect(calcFuelCost(12.3, 0, 0)).toBe(2091);
  });
  it('커스텀 단가 200원/km → 100km = 20,000원', () => {
    expect(calcFuelCost(100, 0, 0, 200)).toBe(20000);
  });
});

describe('calcLaborCost', () => {
  it('0km → 0원', () => {
    expect(calcLaborCost(0)).toBe(0);
  });
  it('1km → 3,000원 (구간 1~50)', () => {
    expect(calcLaborCost(1)).toBe(3000);
  });
  it('정확히 50km → 3,000원 (상한 포함)', () => {
    expect(calcLaborCost(50)).toBe(3000);
  });
  it('51km → 6,000원 (다음 구간)', () => {
    expect(calcLaborCost(51)).toBe(6000);
  });
  it('100km → 6,000원', () => {
    expect(calcLaborCost(100)).toBe(6000);
  });
  it('1000km → 60,000원', () => {
    expect(calcLaborCost(1000)).toBe(60000);
  });
  it('1001km → 63,000원 (외삽)', () => {
    expect(calcLaborCost(1001)).toBe(63000);
  });
});
